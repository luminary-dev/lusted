import type { StaticImageData } from "next/image";
import manifest from "./image-manifest.json";

// The photos aren't bundled: they live in a private R2 bucket and the site serves them from its own origin at
// /img/<path> (src/app/img/[...path]/route.ts). img("images/hero/main/main-01.webp") gives next/image the same thing a
// static import would — the address, the size and the blur placeholder — from the manifest scripts/images.mjs writes.
// NEXT_PUBLIC_IMAGE_CDN, if set, serves them from that public address instead (next.config.ts allows its host).
export type ImagePath = keyof typeof manifest.images;

const base = (process.env.NEXT_PUBLIC_IMAGE_CDN || "/img").replace(/\/$/, "");

export function img(path: ImagePath): StaticImageData {
  const m = manifest.images[path];
  return { src: `${base}/${path}`, width: m.w, height: m.h, blurDataURL: m.blur };
}
