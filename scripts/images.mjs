// The photos live outside git — in assets/ (git-ignored) on a laptop and in the Cloudflare R2 bucket the site serves
// them from. What the repository keeps is src/lib/image-manifest.json: every photo's path, size and blur placeholder,
// which is what next/image needs (src/lib/cdn.ts turns a path into the StaticImageData the components use).
//
//   node scripts/images.mjs manifest   rewrite the manifest from assets/ (run after adding or changing a photo)
//   node scripts/images.mjs upload     put new and changed photos in the bucket (needs CLOUDFLARE_API_TOKEN: an R2 token
//                                      with write access to the bucket — it goes through R2's S3 endpoint)
//   node scripts/images.mjs check      every photo in the manifest answers on the CDN
//   node scripts/images.mjs pull       fetch every photo in the manifest from the CDN into assets/ (a fresh clone)
//
// Changing BUCKET or CDN here is the only place: the manifest carries the CDN address and next.config.ts reads it.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const MANIFEST = path.join(ROOT, "src/lib/image-manifest.json");
const STATE = path.join(ASSETS, ".uploaded.json"); // content hash of every photo already in the bucket
const ACCOUNT = "5433d68c14c01f69241b8676f11d4e4a"; // the Cloudflare account that owns the bucket
const BUCKET = "luminary-lusted";
const CDN = "https://bucket-public-url-not-set.r2.dev"; // the bucket's public address (R2 → bucket → Settings → Public access)
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
  await writeFile(MANIFEST, JSON.stringify({ cdn: CDN, images }, null, 2) + "\n");
  console.log(`manifest: ${Object.keys(images).length} photos → ${path.relative(ROOT, MANIFEST)}`);
}

// R2's S3 endpoint, signed by curl: the access key is the API token's id, the secret the SHA-256 of the token
async function s3() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("set CLOUDFLARE_API_TOKEN (an R2 token with write access to the bucket)");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/tokens/verify`, { headers: { Authorization: `Bearer ${token}` } });
  const id = (await res.json()).result?.id;
  if (!id) throw new Error("Cloudflare did not recognise CLOUDFLARE_API_TOKEN");
  const secret = createHash("sha256").update(token).digest("hex");
  return { user: `${id}:${secret}`, base: `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}` };
}

async function upload() {
  const { user, base } = await s3();
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
      const { stdout } = await run("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "-X", "PUT", "--aws-sigv4", "aws:amz:auto:s3", "--user", user,
        "-H", `Content-Type: ${TYPES[path.extname(rel).toLowerCase()]}`, "-H", "Cache-Control: public, max-age=31536000, immutable",
        "--data-binary", `@${path.join(ASSETS, rel)}`, `${base}/${rel}`]);
      if (stdout.trim() !== "200") throw new Error(`${rel}: HTTP ${stdout.trim()}`);
      state[rel] = hash;
      await writeFile(STATE, JSON.stringify(state, null, 2) + "\n");
      console.log(`  ✓ ${rel} (${++n})`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log("upload: done");
}

async function check() {
  const { cdn, images } = JSON.parse(await readFile(MANIFEST, "utf8"));
  const missing = [];
  await Promise.all(
    Object.keys(images).map(async (rel) => {
      const res = await fetch(`${cdn}/${rel}`, { method: "HEAD" }).catch(() => null);
      if (!res?.ok) missing.push(`${rel} (${res ? res.status : "no answer"})`);
    }),
  );
  if (missing.length) {
    console.error(`check: ${missing.length} of ${Object.keys(images).length} photo(s) not on the CDN:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`check: all ${Object.keys(images).length} photos answer on ${cdn}`);
}

async function pull() {
  const { cdn, images } = JSON.parse(await readFile(MANIFEST, "utf8"));
  let n = 0;
  for (const rel of Object.keys(images)) {
    const file = path.join(ASSETS, rel);
    if (await stat(file).catch(() => null)) continue;
    const res = await fetch(`${cdn}/${rel}`);
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
