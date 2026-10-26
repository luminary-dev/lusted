// The photos live outside git — in assets/ (git-ignored) on a laptop and in the private Cloudflare R2 bucket the
// site reads them from (src/app/img/[...path]/route.ts). What the repository keeps is src/lib/image-manifest.json:
// every photo's path, size and blur placeholder, which is what next/image needs (src/lib/cdn.ts turns a path into
// the StaticImageData the components use).
//
//   node scripts/images.mjs manifest   rewrite the manifest from assets/ (run after adding or changing a photo)
//   node scripts/images.mjs upload     put new and changed photos in the bucket (by content hash)
//   node scripts/images.mjs check      every photo in the manifest is in the bucket
//   node scripts/images.mjs pull       fetch every photo in the manifest from the bucket into assets/ (a fresh clone)
//
// upload, check and pull need the bucket's keys in the environment (.env.local has them on the laptop; Vercel and CI
// hold the same four): R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const MANIFEST = path.join(ROOT, "src/lib/image-manifest.json");
const STATE = path.join(ASSETS, ".uploaded.json"); // content hash of every photo already in the bucket
const TYPES = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif" };

async function photos() {
  const out = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (TYPES[path.extname(e.name).toLowerCase()]) out.push(path.relative(ASSETS, p).split(path.sep).join("/"));
    }
  }
  await walk(ASSETS);
  return out.sort();
}

async function manifest() {
  const images = {};
  for (const rel of await photos()) {
    const file = path.join(ASSETS, rel);
    const { width, height } = await sharp(file).metadata();
    // the blur placeholder, the way next/image makes one for a static import: 8 px wide, as a data URL
    const blur = await sharp(file).resize(8).webp({ quality: 60 }).toBuffer();
    images[rel] = { w: width, h: height, blur: `data:image/webp;base64,${blur.toString("base64")}` };
  }
  await writeFile(MANIFEST, JSON.stringify({ images }, null, 2) + "\n");
  console.log(`manifest: ${Object.keys(images).length} photos → ${path.relative(ROOT, MANIFEST)}`);
}

// the bucket through R2's S3 endpoint, requests signed with the R2_* keys
function bucket() {
  const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error("set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (see .env.local)");
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const base = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
  return (key, init) => client.fetch(`${base}/${key}`, init);
}

async function upload() {
  const put = bucket();
  const state = JSON.parse(await readFile(STATE, "utf8").catch(() => "{}"));
  const todo = [];
  for (const rel of await photos()) {
    const hash = createHash("sha1").update(await readFile(path.join(ASSETS, rel))).digest("hex");
    if (state[rel] !== hash) todo.push([rel, hash]);
  }
  console.log(`upload: ${todo.length} new or changed photo(s)`);
  let n = 0;
  const worker = async () => {
    while (todo.length) {
      const [rel, hash] = todo.shift();
      const res = await put(rel, { method: "PUT", body: await readFile(path.join(ASSETS, rel)), headers: { "content-type": TYPES[path.extname(rel).toLowerCase()] } });
      if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`);
      state[rel] = hash;
      await writeFile(STATE, JSON.stringify(state, null, 2) + "\n");
      console.log(`  ✓ ${rel} (${++n})`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log("upload: done");
}

async function check() {
  const head = bucket();
  const { images } = JSON.parse(await readFile(MANIFEST, "utf8"));
  const missing = [];
  await Promise.all(
    Object.keys(images).map(async (rel) => {
      const res = await head(rel, { method: "HEAD" }).catch(() => null);
      if (!res?.ok) missing.push(`${rel} (${res ? res.status : "no answer"})`);
    }),
  );
  if (missing.length) {
    console.error(`check: ${missing.length} of ${Object.keys(images).length} photo(s) not in the bucket:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`check: all ${Object.keys(images).length} photos are in the bucket`);
}

async function pull() {
  const get = bucket();
  const { images } = JSON.parse(await readFile(MANIFEST, "utf8"));
  let n = 0;
  for (const rel of Object.keys(images)) {
    const file = path.join(ASSETS, rel);
    if (await stat(file).catch(() => null)) continue;
    const res = await get(rel);
    if (!res.ok) throw new Error(`${rel}: ${res.status}`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    n++;
  }
  console.log(`pull: ${n} photo(s) fetched into assets/`);
}

const commands = { manifest, upload, check, pull };
const cmd = commands[process.argv[2]];
if (!cmd) {
  console.error("usage: node scripts/images.mjs manifest | upload | check | pull");
  process.exit(2);
}
await cmd();
