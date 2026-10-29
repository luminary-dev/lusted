// Puts the Lusted wordmark on every photo under assets/images — the same mark the product photos carry
// (scripts/lib/wordmark.mjs): white, bottom right, with a soft shadow, sized from the photo's shorter side so it reads
// the same on a wide hero photo and a tall phone cut. Transparent cut-outs (the FAQ models) are left alone: they sit
// on a card, not in a frame; so are the console door's wide photos, which the page signs itself. The unmarked originals are kept outside the repo (../images/unmarked/<path>) and a photo
// is only ever marked once (assets/.watermarked.json remembers which), so the script can be run again after new
// photos land. Usage: node scripts/watermark-images.mjs [path-under-assets/images …]
import { readFile, writeFile, mkdir, copyFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { watermark } from "./lib/wordmark.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES = path.join(ROOT, "assets/images");
const BACKUP = path.resolve(ROOT, "../images/unmarked");
const STATE = path.join(ROOT, "assets/.watermarked.json");

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
  // the console door's wide photos are left unmarked: they're cropped to the screen, so a baked-in mark would be cut;
  // the page signs them itself (src/app/admin/login-form.tsx)
  if (/^admin\/door-wide-/.test(rel)) { skipped++; continue; }
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
  console.log(`  done ${rel}`);
}
await writeFile(STATE, JSON.stringify(done, null, 2) + "\n");
console.log(`watermark: ${marked} marked, ${skipped} cut-outs left alone, ${kept} already marked`);
