// Shared by the console's two scripts (add-product.mjs, apply-update.mjs): the catalogue and manifest files, the
// bucket, the owner's photos on their way from incoming/ into the catalogue, the entry's canonical key order, and the
// one-line summary the workflow turns into the commit message (and so into the console's activity feed — it must say
// exactly what changed).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { blurPlaceholder, finishProduct } from "../lib/wordmark.mjs";

export const ROOT = path.resolve(import.meta.dirname, "../..");
export const CATALOG = path.join(ROOT, "src/lib/catalog.json");
export const MANIFEST = path.join(ROOT, "src/lib/image-manifest.json");
export const SUMMARY = path.join(ROOT, ".admin-summary");

export const SLUG = /^[a-z0-9-]{1,64}$/;
// where the console's upload-url route puts the owner's photos (src/app/api/admin/upload-url/route.ts)
export const INCOMING = /^incoming\/[a-f0-9]{24}\/(front|back|side|extra[123])\.(jpg|png|webp)$/;
export const COLLECTIONS = { lingerie: "Lace Secrets", swim: "Sun Kissed", "after-dark": "Midnight Sins" };
export const lkr = (n) => `LKR ${Number(n).toLocaleString("en-US")}`;
export const quote = (s) => `“${s}”`;

export const payload = JSON.parse(process.env.ADMIN_PAYLOAD || "{}");

export const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
export const writeJson = (file, value) => writeFile(file, JSON.stringify(value, null, 2) + "\n");

// a catalogue entry's keys in the order every entry has them (a key not listed here is kept, after these)
const ORDER = ["slug", "name", "category", "price", "salePrice", "colors", "sizes", "bestSeller", "added", "description", "blurb", "details", "fit", "fitNote", "moments", "mainView", "pairsWith"];
export function normalise(entry) {
  const out = {};
  for (const key of ORDER) if (entry[key] !== undefined) out[key] = entry[key];
  for (const key of Object.keys(entry)) if (!(key in out) && entry[key] !== undefined) out[key] = entry[key];
  return out;
}

// the manifest with its photos in path order, the way scripts/images.mjs writes it
export const sortManifest = (manifest) => ({ images: Object.fromEntries(Object.entries(manifest.images).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) });

// today in Sri Lanka, YYYY-MM-DD
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });

export function bucket() {
  const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error("R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are needed");
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const base = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
  return {
    async get(key) {
      const res = await client.fetch(`${base}/${key}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`GET ${key}: HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
    async put(key, body, contentType) {
      const res = await client.fetch(`${base}/${key}`, { method: "PUT", body, headers: { "content-type": contentType } });
      if (!res.ok) throw new Error(`PUT ${key}: HTTP ${res.status}`);
    },
    async del(key) {
      const res = await client.fetch(`${base}/${key}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) console.warn(`  ! could not delete ${key} (HTTP ${res.status})`);
    },
  };
}

// One of the owner's photos, from incoming/ to the catalogue: finished the way every product photo is
// (scripts/lib/wordmark.mjs: cropped to 9:16, the wordmark), put in the bucket under `key`, and its manifest entry
// returned. The original stays in incoming/ until the script is done with the change (it deletes them last).
export async function finishPhoto(store, incoming, key) {
  const original = await store.get(incoming);
  let finished;
  if (original) {
    finished = await finishProduct(original);
    await store.put(key, finished.buf, "image/webp");
  } else {
    // a second run of the same change (the originals went with the first) — the finished photo is already there
    const done = await store.get(key);
    if (!done) throw new Error(`the photo is not in the bucket (${incoming})`);
    const { width, height } = await sharp(done).metadata();
    finished = { buf: done, width, height };
  }
  console.log(`  ✓ ${key} ${finished.width}×${finished.height}`);
  return { w: finished.width, h: finished.height, blur: await blurPlaceholder(finished.buf) };
}

export async function summarise(text) {
  await writeFile(SUMMARY, text + "\n");
  console.log(`summary: ${text}`);
}
