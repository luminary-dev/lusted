import type { StaticImageData } from "next/image";
import manifest from "./image-manifest.json";

// The photos aren't bundled: they live in a private R2 bucket and the site serves them from its own origin at
// /img/<path> (src/app/img/[...path]/route.ts). img("images/hero/main/main-01.webp") gives next/image the same thing a
// static import would — the address, the size and the blur placeholder — from the manifest scripts/images.mjs writes.
// NEXT_PUBLIC_IMAGE_CDN, if set, serves them from that public address instead (next.config.ts allows its host).
export type ImagePath = keyof typeof manifest.images;

const base = (process.env.NEXT_PUBLIC_IMAGE_CDN || "/img").replace(/\/$/, "");
// Bumped whenever the photos themselves change under the same paths (they're served immutable for a year, and the
// image optimiser and browsers keep them that long): the version is a path segment, so every address changes and every
// cache refetches. The /img route and next/image's allowed sources (next.config.ts) accept only this version, so an
// invented one can't make each request a fresh, uncached fetch and a billed transformation.
// 2: the wordmark on every photo.
export const IMAGE_VERSION = 2;

export function img(path: ImagePath): StaticImageData {
  const m = manifest.images[path];
  const src = base === "/img" ? `/img/v${IMAGE_VERSION}/${path}` : `${base}/${path}`;
  return { src, width: m.w, height: m.h, blurDataURL: m.blur };
}
