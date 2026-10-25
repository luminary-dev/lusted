// Turns enhanced hero PNGs (4096×2304, from enhance-images.mjs) into the webp slides the home page imports, numbered on
// from the last one already in the band's folder (src/lib/hero-slides.ts lists each band in the order it plays).
// Usage: node scripts/hero-webp.mjs <main|after-dark> <in-2x.png> [<in-2x.png> …]
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const [band, ...inputs] = process.argv.slice(2);
if (!["main", "after-dark"].includes(band) || !inputs.length) throw new Error("usage: node scripts/hero-webp.mjs <main|after-dark> <in.png> [...]");
const OUT = path.join(ROOT, "src/assets/images/hero", band);

let n = Math.max(0, ...(await readdir(OUT)).map((f) => Number(f.match(new RegExp(`^${band}-(\\d+)\\.webp$`))?.[1] ?? 0)));
for (const src of inputs) {
  const dest = path.join(OUT, `${band}-${String(++n).padStart(2, "0")}.webp`);
  const info = await sharp(src).webp({ quality: 88, effort: 6, smartSubsample: true }).toFile(dest);
  console.log(`✓ ${path.basename(dest)}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB  ← ${path.basename(src)}`);
}
