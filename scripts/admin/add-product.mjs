// Adds a piece from the console: runs in the Console workflow (.github/workflows/console.yml) on the add-product
// dispatch, with the piece in ADMIN_PAYLOAD (src/app/api/admin/products/add/route.ts shapes and checks it) and the
// bucket's keys in the environment. The owner's photos are waiting in the bucket under incoming/<upload>/; each is
// finished the way every product photo is (scripts/lib/wordmark.mjs: cropped to 9:16, the wordmark) and put in the
// bucket under products/<slug>[-back|-side].webp, the manifest learns their size and blur, the catalogue gets the
// entry, the incoming originals are deleted and product-images.ts is regenerated. The workflow commits what changed.
import { blurPlaceholder, finishProduct } from "../lib/wordmark.mjs";
import { CATALOG, COLLECTIONS, MANIFEST, SLUG, bucket, lkr, normalise, payload, quote, readJson, sortManifest, summarise, today, writeJson } from "./lib.mjs";
import sharp from "sharp";

const INCOMING = /^incoming\/[a-f0-9]{24}\/(front|back|side)\.(jpg|png|webp)$/;
const { slug, views = {} } = payload;
// the piece itself travels under one field (a dispatch payload carries ten fields at most)
const piece = payload.piece ?? payload;
if (!SLUG.test(slug ?? "")) throw new Error("add-product: a slug is needed");
if (!(piece.category in COLLECTIONS)) throw new Error("add-product: unknown collection");
if (!INCOMING.test(views.front ?? "")) throw new Error("add-product: the front photo's address is needed");
if (!INCOMING.test(views.back ?? "")) throw new Error("add-product: the back photo's address is needed");

const catalog = await readJson(CATALOG);
if (catalog.some((p) => p.slug === slug)) {
  console.log(`${slug} is already in the catalogue — nothing to do`);
  process.exit(0);
}

if (piece.bestSeller && catalog.filter((p) => p.bestSeller).length >= 6) throw new Error("add-product: six best sellers already");
const store = bucket();
const manifest = await readJson(MANIFEST);
for (const view of ["front", "back", "side"]) {
  const incoming = views[view];
  if (!incoming) continue;
  if (!INCOMING.test(incoming) || !incoming.includes(`/${view}.`)) throw new Error(`add-product: the ${view} photo's address is wrong`);
  const key = `products/${slug}${view === "front" ? "" : `-${view}`}.webp`;
  const original = await store.get(incoming);
  let finished;
  if (original) {
    finished = await finishProduct(original);
    await store.put(key, finished.buf, "image/webp");
  } else {
    // a second run of the same piece (the originals went with the first) — the finished photo is already there
    const done = await store.get(key);
    if (!done) throw new Error(`add-product: the ${view} photo is not in the bucket (${incoming})`);
    const { width, height } = await sharp(done).metadata();
    finished = { buf: done, width, height };
  }
  manifest.images[key] = { w: finished.width, h: finished.height, blur: await blurPlaceholder(finished.buf) };
  console.log(`  ✓ ${key} ${finished.width}×${finished.height}`);
}
await writeJson(MANIFEST, sortManifest(manifest));

catalog.push(
  normalise({
    slug,
    name: piece.name,
    category: piece.category,
    price: piece.price,
    colors: piece.colors,
    sizes: piece.sizes,
    bestSeller: piece.bestSeller ?? undefined,
    added: today(),
    description: piece.description,
    blurb: piece.blurb || undefined,
    details: piece.details,
    fit: piece.fit,
    fitNote: piece.fitNote,
    moments: piece.moments,
  }),
);
await writeJson(CATALOG, catalog);

for (const incoming of Object.values(views)) if (typeof incoming === "string" && INCOMING.test(incoming)) await store.del(incoming);

await import("../sync-product-images.mjs");
const photos = Object.keys(views).length;
await summarise(`added ${quote(piece.name)} to ${COLLECTIONS[piece.category]} at ${lkr(piece.price)} (${photos} photo${photos === 1 ? "" : "s"})`);
