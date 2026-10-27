// The watermark every photo on the site carries: the Lusted wordmark in white, bottom right, softly shadowed, sized
// from the photo's shorter side (a fifth of it) and the same gap (7%) from the right and bottom edges, so it reads the
// same on a wide hero photo, a tall phone cut and a 9:16 product shot. Shared by scripts/import-krea-products.mjs,
// scripts/watermark-images.mjs and scripts/admin/add-product.mjs. Returns the layers for sharp's composite().
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "../..");
let wordmark; // the brand master, trimmed, read once
async function master() {
  wordmark ??= await sharp(path.join(ROOT, "brand/source/wordmark-light.png")).trim({ threshold: 1 }).png().toBuffer();
  return wordmark;
}

export async function watermark(width, height) {
  const base = Math.min(width, height);
  const w = Math.round(base * 0.2);
  const alpha = await sharp(await master()).resize(w).extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
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
  const margin = Math.round(base * 0.07);
  const left = width - margin - mw;
  const top = height - margin - mh;
  return [
    { input: shadow, left: left - pad, top: top - pad + Math.round(w / 90) },
    { input: mark, left, top },
  ];
}

// A product photo's finish (every card and the product page show a 9:16 frame): cropped to exactly 9:16 — extra height
// trimmed 22% from the top and 78% from the bottom, the cards' object-position; extra width trimmed evenly — then the
// wordmark. `buf` is any image sharp can read; the result is a WebP buffer with its size.
export async function finishProduct(buf, { maxWidth = 2160 } = {}) {
  let img = sharp(buf).rotate().removeAlpha();
  let { width: W, height: H } = await img.metadata();
  const H916 = Math.round((W * 16) / 9);
  if (H > H916) {
    const top = Math.round((H - H916) * 0.22);
    img = sharp(await img.extract({ left: 0, top, width: W, height: H916 }).png().toBuffer());
    H = H916;
  } else if (H < H916) {
    const W916 = Math.round((H * 9) / 16);
    const left = Math.round((W - W916) / 2);
    img = sharp(await img.extract({ left, top: 0, width: W916, height: H }).png().toBuffer());
    W = W916;
  }
  if (W > maxWidth) {
    img = sharp(await img.resize(maxWidth, undefined, { kernel: "lanczos3" }).png().toBuffer());
    ({ width: W, height: H } = await img.metadata());
  }
  const out = await img.composite(await watermark(W, H)).webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer();
  return { buf: out, width: W, height: H };
}

// the blur placeholder next/image shows first, the way scripts/images.mjs makes one for the manifest
export async function blurPlaceholder(buf) {
  const blur = await sharp(buf).resize(8).webp({ quality: 60 }).toBuffer();
  return `data:image/webp;base64,${blur.toString("base64")}`;
}
