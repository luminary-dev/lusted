// Finishes the AI-upscaled campaign images for the site.
//
// Input: Real-ESRGAN 4× outputs (realesrgan-ncnn-vulkan -n realesrgan-x4plus -s 4) named
//   <x4dir>/hero-src-<n>-x4.png and <x4dir>/vertical-src-<n>-x4.png, made from refs/krea/final/{hero,vertical}/src-<n>.png.
// Each is brought to 2× of the original (4096 px on the long side) and blended 75/25 with a plain
// Lanczos 2× enlargement of the original, so it keeps Real-ESRGAN's crisp eyes/hair/lace without
// over-smoothed, plastic-looking skin. Output: high-quality WebP under src/assets/images.
//
// Usage: node scripts/enhance-images.mjs <x4dir> [only these outputs…]
import sharp from "sharp";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const x4dir = process.argv[2];
if (!x4dir) throw new Error("usage: node scripts/enhance-images.mjs <dir with Real-ESRGAN x4 PNGs>");

// site file  <-  source image (refs/krea/final/<kind>/src-<n>.png)
const jobs = [
  ["hero/hero-1.webp", "hero", 14],
  ["hero/hero-2.webp", "hero", 12],
  ["hero/hero-3.webp", "hero", 11],
  ["hero/hero-4.webp", "hero", 16],
  ["hero/hero-5.webp", "hero", 10],
  ["hero/hero-6.webp", "hero", 4],
  ["hero/hero-7.webp", "hero", 5],
  ["hero/hero-8.webp", "hero", 17],
  ["hero/hero-9.webp", "hero", 19],
  ["hero/hero-10.webp", "hero", 18],
  ["hero/hero-11.webp", "hero", 31],
  ["hero/hero-12.webp", "hero", 27],
  ["hero/hero-13.webp", "hero", 30],
  ["hero/hero-14.webp", "hero", 33],
  ["how-it-works.webp", "hero", 21],
  ["cat-lingerie.webp", "vertical", 7],
  ["cat-swim.webp", "vertical", 6],
  ["cat-after-dark.webp", "vertical", 15],
  ["size-guide.webp", "vertical", 22],
];

const ESRGAN_WEIGHT = 0.75;

// Optional extra args: only rebuild these outputs, e.g. `hero/hero-8.webp`.
const only = process.argv.slice(3);

for (const [out, kind, n] of jobs) {
  if (only.length && !only.includes(out)) continue;
  const original = path.join(ROOT, "refs/krea/final", kind, `src-${n}.png`);
  const upscaled = path.join(x4dir, `${kind}-src-${n}-x4.png`);
  const { width, height } = await sharp(original).metadata();
  const W = width * 2, H = height * 2;

  const ai = await sharp(upscaled).resize(W, H, { kernel: "lanczos3" }).removeAlpha().toBuffer();
  const plain = await sharp(original).resize(W, H, { kernel: "lanczos3" }).removeAlpha().ensureAlpha(1 - ESRGAN_WEIGHT).png().toBuffer();

  const dest = path.join(ROOT, "src/assets/images", out);
  await sharp(ai)
    .composite([{ input: plain, blend: "over" }])
    .webp({ quality: 92, effort: 6, smartSubsample: true })
    .toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(`✓ ${out}  ${meta.width}×${meta.height}`);
}
