import "server-only";

import { type ScryptOptions, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// The owner console's sign-in. Nothing lives in the repo: the email and an scrypt hash of the password come from the
// environment (.env.local on the laptop, the Vercel project in production), and a session is a signed, stateless token
// in an httpOnly cookie. With any of the three missing the console refuses every sign-in.
//
//   ADMIN_EMAIL            the owner's sign-in email
//   ADMIN_PASSWORD_HASH    "<salt-hex>:<scrypt-hash-hex>" (the README has the one-liner that makes one)
//   ADMIN_SESSION_SECRET   a long random hex string; changing it signs every browser out at once

export const ADMIN_COOKIE = "lusted_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

// constant-time equality for strings of any length
function safeEqual(a: string, b: string): boolean {
  const key = randomBytes(32);
  const ha = createHmac("sha256", key).update(a).digest();
  const hb = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function configured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET);
}

// scrypt's work factor. Node's own default is N=16384, r=8, p=1; it is written out here so the cost is visible and
// so a change to that default could never stop the stored hash verifying. maxmem has to be raised with N: scrypt
// needs 128*N*r bytes, which is 16 MB at N=16384 but 128 MB at N=131072, over Node's 32 MB ceiling.
const LEGACY_COST: ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

// "<salt-hex>:<hash-hex>" is the original shape and means the cost above. "<N>:<r>:<p>:<salt-hex>:<hash-hex>" carries
// its own, so ADMIN_PASSWORD_HASH can be regenerated at a higher work factor — OWASP asks for N=131072 — by setting
// the variable alone, with no deploy. Both verify, so raising it never locks the owner out mid-change.
function parseStored(stored: string): { cost: ScryptOptions; salt: Buffer; want: Buffer } | null {
  const parts = stored.split(":");
  const [saltHex, hashHex] = parts.length === 5 ? parts.slice(3) : parts;
  if (parts.length !== 2 && parts.length !== 5) return null;
  if (!saltHex || !hashHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(hashHex)) return null;

  let cost = LEGACY_COST;
  if (parts.length === 5) {
    const [N, r, p] = parts.slice(0, 3).map(Number);
    // N must be a power of two above 1, and the three together must stay inside maxmem
    if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return null;
    if (N < 2 || (N & (N - 1)) !== 0) return null;
    if (128 * N * r > (LEGACY_COST.maxmem as number)) return null;
    cost = { N, r, p, maxmem: LEGACY_COST.maxmem };
  }
  return { cost, salt: Buffer.from(saltHex, "hex"), want: Buffer.from(hashHex, "hex") };
}

export function verifyCredentials(email: string, password: string): boolean {
  const wantEmail = process.env.ADMIN_EMAIL;
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!wantEmail || !stored) return false;
  const parsed = parseStored(stored);
  if (!parsed) return false;

  const emailOk = safeEqual(email.trim().toLowerCase(), wantEmail.trim().toLowerCase());
  let passwordOk = false;
  try {
    const { cost, salt, want } = parsed;
    const got = scryptSync(password.normalize("NFKC"), salt, want.length, cost);
    passwordOk = want.length > 0 && timingSafeEqual(got, want);
  } catch {
    passwordOk = false;
  }
  return emailOk && passwordOk;
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex"); // every token opaque and unique, and the nonce is signed too
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  if (!/^[a-f0-9]{32}$/.test(nonce)) return false;
  return safeEqual(signature, sign(`${expires}.${nonce}`));
}
