// Where a product photo lives in the bucket and the manifest: products/<base>.webp, or products/<base>.<rev>.webp for
// one the console put there, where the base is <slug> (the front), <slug>-back, <slug>-side, or <slug>-4, -5 and -6 —
// up to three optional photos more — and the same for each other colour as <slug>--<colour>…; <rev> is eight hex
// characters of the upload it came from. The console never writes over a key — the live site reads the same bucket and
// every photo is served immutable for a year — so each photo it puts in the bucket gets a key of its own. Shared by
// scripts/sync-product-images.mjs and the console's scripts (scripts/admin/); src/lib/admin/photos.ts is the same
// naming for the console itself.

// every view a colour can have, in the order the product page shows them, and what each adds to the base
export const VIEW_SUFFIX = { front: "", back: "-back", side: "-side", extra1: "-4", extra2: "-5", extra3: "-6" };
export const VIEWS = Object.keys(VIEW_SUFFIX);

export const photoBase = (slug, colour, view) => `${slug}${colour ? `--${colour}` : ""}${VIEW_SUFFIX[view]}`;

// The names only read one way while no piece's slug is another's plus a view's suffix ("rose" and "rose-4", or
// "rose-back") or holds the colour separator "--": then "rose-4" would be both a piece's front and another's fourth
// photo. Slugs come from names (the fitting's slugify never makes "--"), so this is a guard, not a rule anyone meets —
// but a clash would put one piece's photo on another, so it stops the run rather than guess.
export function assertNamesApart(slugs) {
  const all = new Set(slugs);
  for (const slug of slugs) {
    if (slug.includes("--")) throw new Error(`photo names: the slug ${slug} holds "--", which names a colour`);
    for (const suffix of Object.values(VIEW_SUFFIX)) if (suffix && all.has(slug + suffix)) throw new Error(`photo names: ${slug + suffix} is both a piece and a photo of ${slug}`);
  }
}

// the manifest key holding a photo, or null when there is none; with more than one, the plain name wins
export function photoKey(images, base) {
  const name = `products/${base}`;
  if (`${name}.webp` in images) return `${name}.webp`;
  return Object.keys(images).find((key) => key.startsWith(`${name}.`) && /^\.[a-f0-9]{8}\.webp$/.test(key.slice(name.length))) ?? null;
}

// a fresh key for a photo from incoming/<upload>/…: the same upload always gives the same key, so a second run of the
// same change finds the photo the first one finished
export const revKey = (base, incoming) => `products/${base}.${incoming.split("/")[1].slice(0, 8)}.webp`;
