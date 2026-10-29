// Where a product photo lives in the bucket and the manifest: products/<base>.webp, or products/<base>.<rev>.webp for
// one the console put there, where the base is <slug>, <slug>-back, <slug>-side, or <slug>--<colour> with the same
// -back and -side, and <rev> is eight hex characters of the upload it came from. The console never writes over a key —
// the live site reads the same bucket and every photo is served immutable for a year — so each photo it puts in the
// bucket gets a key of its own. Shared by scripts/sync-product-images.mjs and the console's scripts
// (scripts/admin/); src/lib/admin/photos.ts is the same naming for the console itself.

export const photoBase = (slug, colour, view) => `${slug}${colour ? `--${colour}` : ""}${view === "front" ? "" : `-${view}`}`;

// the manifest key holding a photo, or null when there is none; with more than one, the plain name wins
export function photoKey(images, base) {
  const name = `products/${base}`;
  if (`${name}.webp` in images) return `${name}.webp`;
  return Object.keys(images).find((key) => key.startsWith(`${name}.`) && /^\.[a-f0-9]{8}\.webp$/.test(key.slice(name.length))) ?? null;
}

// a fresh key for a photo from incoming/<upload>/…: the same upload always gives the same key, so a second run of the
// same change finds the photo the first one finished
export const revKey = (base, incoming) => `products/${base}.${incoming.split("/")[1].slice(0, 8)}.webp`;
