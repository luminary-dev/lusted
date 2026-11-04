// Frames every product photo the same way, so a shopper scrolling the shop sees each model at the same size: the face
// a sixth of the frame's height (FACE) with its top 11.5% down (FACE_TOP), which is head to mid-thigh — the framing of
// the closest shots. A photo can only be zoomed in, never out, so the closest shots set the size and a photo already
// within 3% of it is left alone. The model is found with Apple's Vision framework (scripts/lib/measure-model.swift, so
// this runs on a Mac only); the crop is centred on her body, the old wordmark is kept out of the crop (or painted out
// where it can't be), a crop that has to grow 1.2× or more is enhanced with Real-ESRGAN, and the photo is marked again
// (scripts/lib/wordmark.mjs).
//
// A re-framed photo gets a key of its own, <base>.<rev>.webp in assets/products/ (scripts/lib/photo-keys.mjs), and the
// old file is removed from assets/: the live site reads the same bucket and serves every photo immutable for a year, so
// a photo written over its old key would change lusted.lk before a release. Then, as for any photo change:
// node scripts/images.mjs manifest, node scripts/sync-product-images.mjs, node scripts/images.mjs upload.
//
// Usage: node scripts/frame-products.mjs [--check] [slug …]   (--check only reports what it would change)
// Real-ESRGAN: the realesrgan-ncnn-vulkan binary in .tools/realesrgan/ (git-ignored), ESRGAN_BIN or on PATH.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { watermark } from "./lib/wordmark.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets/products");
const FACE = 0.16;
const FACE_TOP = 0.115;
const TOLERANCE = 1.03;
const ESRGAN_WEIGHT = 0.65;
// the wordmark's corner, shadow included, as a share of the photo (scripts/lib/wordmark.mjs: a fifth of the width, 7%
// in from the right and the bottom)
const MARK = { left: 0.704, top: 0.902 };

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const slugs = args.filter((a) => !a.startsWith("--"));

function findEsrgan() {
  for (const bin of [process.env.ESRGAN_BIN, path.join(ROOT, ".tools/realesrgan/realesrgan-ncnn-vulkan"), "realesrgan-ncnn-vulkan"].filter(Boolean)) {
    try {
      execFileSync(bin, ["-h"], { stdio: "ignore" });
      return bin;
    } catch (e) {
      if (e.code !== "ENOENT" && e.status !== undefined) return bin; // it ran (prints help with a non-zero code)
    }
  }
  return null;
}

// "rose-back.1a2b3c4d.webp" → "rose-back": the photo's name without the revision a console or an earlier run gave it
const baseOf = (file) => file.replace(/(\.[a-f0-9]{8})?\.webp$/, "");

const files = (await readdir(DIR)).filter((f) => f.endsWith(".webp") && (!slugs.length || slugs.some((s) => baseOf(f) === s || baseOf(f).startsWith(`${s}-`))));
if (!files.length) throw new Error("no product photos to frame (run node scripts/images.mjs pull on a fresh clone)");
const measured = execFileSync("swift", [path.join(ROOT, "scripts/lib/measure-model.swift"), ...files.map((f) => path.join(DIR, f))], { maxBuffer: 1 << 24 })
  .toString()
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

const ESRGAN = CHECK ? null : findEsrgan();
if (!CHECK && !ESRGAN) console.warn("warning: realesrgan-ncnn-vulkan not found (set ESRGAN_BIN) — the most zoomed photos will be softer");

let framed = 0;
for (const m of measured) {
  const file = path.basename(m.file);
  if (m.error) {
    console.warn(`  ${file}: ${m.error} — left as it is`);
    continue;
  }
  const zoom = FACE / m.faceHeight;
  if (zoom < TOLERANCE) continue;
  console.log(`  ${file}: ${zoom.toFixed(2)}× ${CHECK ? "too far away" : "closer"}`);
  if (CHECK) continue;

  const src = path.join(DIR, file);
  const { width: W, height: H } = await sharp(src).metadata();
  const cw = Math.round(W / zoom);
  const ch = Math.round((cw * 16) / 9);
  // her face at FACE_TOP, but the crop stays in the photo and, where it can, above the old wordmark
  const markTop = Math.round(H * MARK.top);
  let top = Math.max(0, Math.min(Math.round(m.faceTop * H - FACE_TOP * ch), H - ch));
  if (top + ch > markTop && ch <= markTop) top = Math.max(0, markTop - ch);
  const left = Math.max(0, Math.min(Math.round(m.bodyX * W - cw / 2), W - cw));

  const tmp = await mkdtemp(path.join(os.tmpdir(), "lusted-frame-"));
  let input = src;
  if (top + ch > markTop && left + cw > Math.round(W * MARK.left)) {
    // the old wordmark is in the crop: paint it out (the new one lands over the same corner)
    input = path.join(tmp, "clean.png");
    const x = Math.round(W * MARK.left);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", `delogo=x=${x}:y=${markTop}:w=${W - x - 1}:h=${Math.min(Math.round(H * 0.075), H - markTop - 1)}`, input]);
  }
  const crop = await sharp(input).extract({ left, top, width: cw, height: ch }).removeAlpha().png().toBuffer();
  // never smaller than the catalogue's usual 1664 px wide (the console's own uploads can be narrower)
  const OW = Math.max(W, 1664);
  const OH = Math.round((OW * 16) / 9);
  let img;
  if (ESRGAN && OW / cw >= 1.2) {
    const a = path.join(tmp, "crop.png");
    const x4 = path.join(tmp, "x4.png");
    await writeFile(a, crop);
    execFileSync(ESRGAN, ["-i", a, "-o", x4, "-n", "realesrgan-x4plus", "-s", "4", "-m", path.join(path.dirname(ESRGAN), "models")], { stdio: "ignore" });
    const ai = await sharp(x4).resize(OW, OH, { kernel: "lanczos3" }).removeAlpha().toBuffer();
    const plain = await sharp(crop).resize(OW, OH, { kernel: "lanczos3" }).ensureAlpha(1 - ESRGAN_WEIGHT).png().toBuffer();
    img = await sharp(ai).composite([{ input: plain }]).png().toBuffer();
  } else {
    img = await sharp(crop).resize(OW, OH, { kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).png().toBuffer();
  }
  const out = await sharp(img).composite(await watermark(OW, OH)).webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer();
  const rev = createHash("sha1").update(out).digest("hex").slice(0, 8);
  await writeFile(path.join(DIR, `${baseOf(file)}.${rev}.webp`), out);
  await unlink(src);
  await rm(tmp, { recursive: true, force: true });
  framed++;
}
console.log(CHECK ? "check done" : `framed ${framed} photo(s) — now: node scripts/images.mjs manifest, node scripts/sync-product-images.mjs, node scripts/images.mjs upload`);
