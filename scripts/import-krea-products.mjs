// Brings the Krea model shots into the shop: refs/krea/products/<slug>-<view>.png and refs/krea/bikini/<slug>-<view>.png
// become assets/products/<slug>.webp (front) and <slug>-back|side.webp, then product-images.ts is re-synced.
// A product switches to model photography as soon as its front shot exists.
//
// Each photo is finished on the way in:
//  · enhanced — upscaled 4× with Real-ESRGAN (realesrgan-x4plus), brought to 2× and blended 75/25 with a plain Lanczos
//    enlargement so lace, hair and eyes sharpen without plastic skin (same recipe as scripts/enhance-images.mjs). Needs
//    the realesrgan-ncnn-vulkan binary: in .tools/realesrgan/ (git-ignored), ESRGAN_BIN or on PATH. Without it the photo is imported un-enhanced, with a warning.
//  · cropped to exactly 9:16 (the frame the site shows), then watermarked — the Lusted wordmark in white, bottom right,
//    the same gap from the right and bottom edges, softly shadowed.
// The PNGs in refs/ stay clean originals.
//
// Usage: node scripts/import-krea-products.mjs [--all]   (--all re-finishes photos that are already imported)
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "assets/products");
const ALL = process.argv.includes("--all");
const ESRGAN_WEIGHT = 0.75;

function findEsrgan() {
  const candidates = [process.env.ESRGAN_BIN, path.join(ROOT, ".tools/realesrgan/realesrgan-ncnn-vulkan")].filter(Boolean);
  try {
    candidates.push(execFileSync("which", ["realesrgan-ncnn-vulkan"]).toString().trim());
  } catch {}
  for (const bin of candidates) {
    try {
      execFileSync(bin, ["-h"], { stdio: "ignore" });
      return bin;
    } catch (e) {
      if (e.code !== "ENOENT" && e.status !== undefined) return bin; // it ran (prints help with a non-zero code)
    }
  }
  return null;
}
const ESRGAN = findEsrgan();
if (!ESRGAN) console.warn("⚠ realesrgan-ncnn-vulkan not found (set ESRGAN_BIN) — importing without enhancement");

// white wordmark, alpha taken from the brand master
const wordmark = await sharp(path.join(ROOT, "brand/source/wordmark-light.png")).trim({ threshold: 1 }).png().toBuffer();
async function watermark(width, height) {
  const w = Math.round(width * 0.2);
  const alpha = await sharp(wordmark).resize(w).extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
  const { width: mw, height: mh } = alpha.info;
  const make = (rgb, opacity) =>
    sharp({ create: { width: mw, height: mh, channels: 3, background: rgb } })
      .joinChannel(alpha.data, { raw: { width: mw, height: mh, channels: 1 } })
      .ensureAlpha()
      .linear([1, 1, 1, opacity], [0, 0, 0, 0])
      .png()
      .toBuffer();
  const pad = Math.round(w * 0.12);
  const shadow = await sharp(await make({ r: 30, g: 8, b: 14 }, 0.35))
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .blur(Math.max(1, w / 60))
    .png()
    .toBuffer();
  const mark = await make({ r: 255, g: 255, b: 255 }, 0.6);
  const margin = Math.round(width * 0.07); // the same gap from the right edge and the bottom edge
  const left = width - margin - mw;
  const top = height - margin - mh;
  return [
    { input: shadow, left: left - pad, top: top - pad + Math.round(w / 90) },
    { input: mark, left, top },
  ];
}

async function finish(src, dest) {
  const { width, height } = await sharp(src).metadata();
  let img;
  if (ESRGAN) {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "lusted-x4-"));
    const x4 = path.join(tmp, "x4.png");
    const models = path.join(path.dirname(ESRGAN), "models"); // the release keeps its models next to the binary
    execFileSync(ESRGAN, ["-i", src, "-o", x4, "-n", "realesrgan-x4plus", "-s", "4", "-m", models], { stdio: "ignore" });
    const W = width * 2, H = height * 2;
    const ai = await sharp(x4).resize(W, H, { kernel: "lanczos3" }).removeAlpha().toBuffer();
    const plain = await sharp(src).resize(W, H, { kernel: "lanczos3" }).removeAlpha().ensureAlpha(1 - ESRGAN_WEIGHT).png().toBuffer();
    img = { buf: await sharp(ai).composite([{ input: plain }]).png().toBuffer(), W, H };
    await rm(tmp, { recursive: true, force: true });
  } else {
    img = { buf: await sharp(src).removeAlpha().png().toBuffer(), W: width, H: height };
  }
  // crop to exactly 9:16 — the frame every card and the product page show — trimming the extra height mostly from the
  // bottom (22% top / 78% bottom, the cards' object-position), so the watermark's margins look the same everywhere
  const H916 = Math.round((img.W * 16) / 9);
  if (img.H > H916) {
    const top = Math.round((img.H - H916) * 0.22);
    img = { buf: await sharp(img.buf).extract({ left: 0, top, width: img.W, height: H916 }).png().toBuffer(), W: img.W, H: H916 };
  }
  await sharp(img.buf)
    .composite(await watermark(img.W, img.H))
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toFile(dest);
}

let n = 0;
for (const dir of ["refs/krea/products", "refs/krea/bikini"]) {
  const abs = path.join(ROOT, dir);
  const files = await readdir(abs).catch(() => []);
  for (const f of files) {
    const m = f.match(/^(.+)-(front|back|side)\.png$/);
    if (!m) continue;
    const [, slug, view] = m;
    const dest = path.join(OUT, view === "front" ? `${slug}.webp` : `${slug}-${view}.webp`);
    const src = path.join(abs, f);
    const [s, d] = await Promise.all([stat(src), stat(dest).catch(() => null)]);
    if (!ALL && d && d.mtimeMs >= s.mtimeMs) continue; // already imported
    await finish(src, dest);
    n++;
    console.log(`✓ ${path.basename(dest)}`);
  }
}
console.log(`imported ${n} photo(s)${ESRGAN ? " (enhanced 2×)" : ""}`);
await import("./sync-product-images.mjs");
