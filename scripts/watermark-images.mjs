// Puts the Lusted wordmark on every photo under assets/images — the same mark the product photos carry
// (import-krea-products.mjs): white, bottom right, with a soft shadow, sized from the photo's shorter side so it reads
// the same on a wide hero photo and a tall phone cut. Transparent cut-outs (the FAQ models) are left alone: they sit
// on a card, not in a frame. The unmarked originals are kept outside the repo (../images/unmarked/<path>) and a photo
// is only ever marked once (assets/.watermarked.json remembers which), so the script can be run again after new
// photos land. Usage: node scripts/watermark-images.mjs [path-under-assets/images …]
import { readFile, writeFile, mkdir, copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES = path.join(ROOT, "assets/images");
const BACKUP = path.resolve(ROOT, "../images/unmarked");
const STATE = path.join(ROOT, "assets/.watermarked.json");

const wordmark = await sharp(path.join(ROOT, "brand/source/wordmark-light.png")).trim({ threshold: 1 }).png().toBuffer();
async function watermark(width, height) {
  const base = Math.min(width, height); // the shorter side: a wide photo and a tall one get the same-sized mark
  const w = Math.round(base * 0.2);
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
  const margin = Math.round(base * 0.07); // the same gap from the right edge and the bottom edge
  const left = width - margin - mw;
  const top = height - margin - mh;
  return [
    { input: shadow, left: left - pad, top: top - pad + Math.round(w / 90) },
    { input: mark, left, top },
  ];
}

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(webp|jpe?g|png)$/i.test(e.name)) yield p;
  }
}

const done = JSON.parse(await readFile(STATE, "utf8").catch(() => "{}"));
const only = process.argv.slice(2);
let marked = 0, skipped = 0, kept = 0;
for await (const file of walk(IMAGES)) {
  const rel = path.relative(IMAGES, file);
  if (only.length && !only.some((o) => rel.startsWith(o))) continue;
  if (done[rel]) { kept++; continue; }
  const meta = await sharp(file).metadata();
  if (meta.hasAlpha) {
    // a cut-out: see whether it really has transparency (a photo saved with an alpha channel is still a photo)
    const { data } = await sharp(file).ensureAlpha().extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
    let transparent = false;
    for (let i = 0; i < data.length; i += 97) if (data[i] < 250) { transparent = true; break; }
    if (transparent) { skipped++; console.log(`  – ${rel} (cut-out, left alone)`); continue; }
  }
  const backup = path.join(BACKUP, rel);
  await mkdir(path.dirname(backup), { recursive: true });
  await copyFile(file, backup);
  const buf = await sharp(file).composite(await watermark(meta.width, meta.height)).webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer();
  await writeFile(file, buf);
  done[rel] = { w: meta.width, h: meta.height, at: new Date().toISOString().slice(0, 10) };
  marked++;
  console.log(`  ✓ ${rel}`);
}
await writeFile(STATE, JSON.stringify(done, null, 2) + "\n");
console.log(`watermark: ${marked} marked, ${skipped} cut-outs left alone, ${kept} already marked`);
