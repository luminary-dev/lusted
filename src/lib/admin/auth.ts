import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

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

export function verifyCredentials(email: string, password: string): boolean {
  const wantEmail = process.env.ADMIN_EMAIL;
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!wantEmail || !stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const emailOk = safeEqual(email.trim().toLowerCase(), wantEmail.toLowerCase());
  let passwordOk = false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const want = Buffer.from(hashHex, "hex");
    const got = scryptSync(password.normalize("NFKC"), salt, want.length);
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
