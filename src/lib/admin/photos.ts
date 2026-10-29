// A piece's photos, as the console changes them: which photo fills each view (front, back, side — for the piece's
// own colour and for each of its other colours), and what makes a set of photo changes one the Console workflow will
// apply. The console checks these before Save and the dispatch route checks them again before anything is queued;
// scripts/admin/apply-update.mjs keeps its own check as the last line of defence, and scripts/lib/photo-keys.mjs is
// the same naming for the scripts. No server-only imports here: the console, the route and the tests all read it.
//
// A photo's key is products/<base>.webp, or products/<base>.<rev>.webp once the console has put one there, where the
// base is <slug>, <slug>-back, <slug>-side, or <slug>--<colour> with the same -back and -side, and <rev> is eight hex
// characters of the upload it came from. The console never writes over a key: the live site reads the same bucket and
// serves every photo with a year-long immutable cache, so a new photo always gets a new key, and the old one only
// leaves the manifest.

export const PHOTO_VIEWS = ["front", "back", "side"] as const;
export type PhotoView = (typeof PHOTO_VIEWS)[number];
// one change: a photo for a view of the piece (colour null) or of one of its other colours, or its removal
export type PhotoChange = { colour: string | null; view: PhotoView; remove: boolean };

// the most a single change carries: every view of the piece and of seven other colours
export const PHOTO_CHANGES_MAX = 24;
// where the upload-url route puts a photo on its way in (src/app/api/admin/upload-url/route.ts)
export const INCOMING = /^incoming\/[a-f0-9]{24}\/(front|back|side)\.(jpg|png|webp)$/;

const base = (slug: string, colour: string | null, view: PhotoView) => `${slug}${colour ? `--${colour}` : ""}${view === "front" ? "" : `-${view}`}`;

// The manifest key holding a view's photo, or null when it has none. With more than one (a photo put there by hand
// next to the console's), the plain name wins, as scripts/sync-product-images.mjs has it.
export function photoKey(keys: readonly string[], slug: string, colour: string | null, view: PhotoView): string | null {
  const name = `products/${base(slug, colour, view)}`;
  if (keys.includes(`${name}.webp`)) return `${name}.webp`;
  return keys.find((key) => key.startsWith(`${name}.`) && /^\.[a-f0-9]{8}\.webp$/.test(key.slice(name.length))) ?? null;
}

// Why a set of photo changes to a piece won't do, in the console's words, or null when it will. `keys` is every photo
// in the manifest now; the changes are checked against the piece as they would leave it.
export function photoChangesProblem(piece: { slug: string; colors: readonly string[] }, keys: readonly string[], changes: readonly PhotoChange[]): string | null {
  if (changes.length === 0) return "Nothing to change";
  if (changes.length > PHOTO_CHANGES_MAX) return "Too many at once — save some first";
  const main = piece.colors[0];
  const seen = new Set<string>();
  for (const { colour, view, remove } of changes) {
    if (!PHOTO_VIEWS.includes(view)) return "Front, back or side";
    if (colour !== null && !/^[a-z]{1,20}$/.test(colour)) return "Not one of the colours";
    // the piece's first colour is the one its own photos show
    if (colour !== null && colour === main) return `The ${colour} photos are the piece’s own`;
    const slot = `${colour ?? ""}/${view}`;
    if (seen.has(slot)) return "One change per photo";
    seen.add(slot);
    if (remove && colour === null && view === "front") return "A piece keeps its front photo — replace it instead";
    if (remove && !photoKey(keys, piece.slug, colour, view)) return `There’s no ${colour ? `${colour} ` : ""}${view} photo to remove`;
  }
  // a colour's back and side show only with its front, so a colour needs its front once the changes are in — and a
  // colour the piece doesn't list yet (which its front photo adds to it) starts with that front
  const colours = new Set(changes.filter((c) => c.colour !== null && !c.remove).map((c) => c.colour!));
  for (const colour of colours) {
    const front = changes.find((c) => c.colour === colour && c.view === "front");
    const hasFront = front ? !front.remove : !!photoKey(keys, piece.slug, colour, "front");
    if (!hasFront) return `Add the ${colour} front photo too`;
  }
  return null;
}
