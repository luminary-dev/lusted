import type { StaticImageData } from "next/image";
import manifest from "./image-manifest.json";

// The photos are served from Cloudflare R2, not bundled: img("images/hero/main/main-01.webp") gives next/image the same
// thing a static import would — the address, the size and the blur placeholder — from the manifest that
// scripts/images.mjs writes. NEXT_PUBLIC_IMAGE_CDN overrides the CDN address (the manifest carries the bucket's).
export type ImagePath = keyof typeof manifest.images;

export const imageCdn = (process.env.NEXT_PUBLIC_IMAGE_CDN || manifest.cdn).replace(/\/$/, "");

export function img(path: ImagePath): StaticImageData {
  const m = manifest.images[path];
  return { src: `${imageCdn}/${path}`, width: m.w, height: m.h, blurDataURL: m.blur };
}
