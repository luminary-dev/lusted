// Builds brand/logo-pack (+ zip) from the sunburst logo sources in brand/source, and copies
// the marks the website uses into src/assets/brand and src/app (favicons).
// Usage: node scripts/build-logo-pack.mjs
import sharp from "sharp";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "brand/source");
const PACK = path.join(ROOT, "brand/logo-pack");
const SITE = path.join(ROOT, "src/assets/brand");

const WINE = "#5c1226";
const BLUSH = "#efdcd4";
const INK = { light: "deep wine #6B1430", dark: "champagne rose-gold #EBC6B4" };

// Trimmed, transparent master of a mark.
const master = (name) => sharp(path.join(SRC, `${name}.png`)).trim({ threshold: 1 }).png().toBuffer();

// Mark centred on a solid square tile (app icons / avatars).
async function tile(markBuf, size, bg, scale) {
  const inner = Math.round(size * scale);
  const mark = await sharp(markBuf).resize(inner, inner, { fit: "inside" }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

await rm(PACK, { recursive: true, force: true });
for (const d of ["light-mode", "dark-mode", "app-icons", "social"]) await mkdir(path.join(PACK, d), { recursive: true });
await mkdir(SITE, { recursive: true });

const sizes = { wordmark: [2400, 1200, 600], monogram: [1024, 512, 256], seal: [1024, 512, 256] };
const manifest = [];

for (const theme of ["light", "dark"]) {
  for (const [mark, widths] of Object.entries(sizes)) {
    const buf = await master(`${mark}-${theme}`);
    const { width } = await sharp(buf).metadata();
    // Never upscale past the generated master; files are named by their real width.
    for (const w of [...new Set(widths.map((w) => Math.min(w, width)))]) {
      const out = path.join(PACK, `${theme}-mode`, `lusted-${mark}-${theme}-${w}.png`);
      await sharp(buf).resize({ width: w, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(out);
      manifest.push(path.relative(PACK, out));
    }
    // the site only uses the wordmark; the monogram and seal live in the logo pack
    if (mark === "wordmark") await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).png().toFile(path.join(SITE, `${mark}-${theme}.png`));
  }
}

// App icons: champagne monogram on wine (primary) and wine monogram on blush (alt).
const monoDark = await master("monogram-dark");
const monoLight = await master("monogram-light");
const sealDark = await master("seal-dark");
const sealLight = await master("seal-light");
const icons = [
  ["app-icon-wine-1024.png", monoDark, 1024, WINE, 0.62],
  ["app-icon-wine-512.png", monoDark, 512, WINE, 0.62],
  ["app-icon-wine-192.png", monoDark, 192, WINE, 0.62],
  ["apple-touch-icon-180.png", monoDark, 180, WINE, 0.62],
  ["favicon-32.png", monoDark, 32, WINE, 0.78],
  ["app-icon-blush-1024.png", monoLight, 1024, BLUSH, 0.62],
  ["app-icon-blush-512.png", monoLight, 512, BLUSH, 0.62],
];
for (const [name, mark, size, bg, scale] of icons) {
  await writeFile(path.join(PACK, "app-icons", name), await tile(mark, size, bg, scale));
  manifest.push(`app-icons/${name}`);
}
for (const [name, mark, bg] of [
  ["profile-seal-wine-1080.png", sealDark, WINE],
  ["profile-seal-blush-1080.png", sealLight, BLUSH],
]) {
  await writeFile(path.join(PACK, "social", name), await tile(mark, 1080, bg, 0.8));
  manifest.push(`social/${name}`);
}

// Favicons used by the site (Next.js file conventions).
await writeFile(path.join(ROOT, "src/app/icon.png"), await tile(monoDark, 512, WINE, 0.62));
await writeFile(path.join(ROOT, "src/app/apple-icon.png"), await tile(monoDark, 180, WINE, 0.62));

await writeFile(
  path.join(PACK, "README.txt"),
  `LUSTED — LOGO PACK
==================

light-mode/   Wine ink (${INK.light}) on transparent — use on light backgrounds (cream, blush, white).
dark-mode/    Champagne ink (${INK.dark}) on transparent — use on dark backgrounds (wine, black, photos).

  lusted-wordmark-*   Primary logo: "Lusted" with swash, sparkle and LINGERIE tagline.
  lusted-monogram-*   "L" monogram with sparkle — avatars, stamps, small spaces.
  lusted-seal-*       Circular seal — packaging stickers, tissue seals, social profile.

app-icons/    Square icons: champagne monogram on wine (${WINE}) or wine monogram on blush (${BLUSH}).
              favicon-32, apple-touch-icon-180, 192/512/1024 for web app / store listings.
social/       1080×1080 profile pictures (seal on wine / blush).

Clear space: keep at least the height of the "L" sparkle around every mark.
Minimum size: wordmark 120px wide on screen; below that use the monogram.

Files:
${manifest.map((f) => `  ${f}`).join("\n")}
`,
);

execFileSync("zip", ["-qr", "../lusted-logo-pack.zip", "."], { cwd: PACK });
console.log(`✓ ${manifest.length} files → brand/logo-pack + brand/lusted-logo-pack.zip`);
