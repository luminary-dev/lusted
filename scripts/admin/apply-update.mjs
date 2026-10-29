// Applies one small console change to the catalogue: runs in the Console workflow (.github/workflows/console.yml) with
//   ADMIN_ACTION   update-product | remove-product | bulk-offer
//   ADMIN_PAYLOAD  the dispatch's client_payload as JSON (shaped and checked by src/app/api/admin/dispatch/route.ts)
// A removal also takes the piece's photos out of the manifest, but leaves them in the bucket. The workflow commits what
// changed, with the summary written here as the message.
import { CATALOG, COLLECTIONS, MANIFEST, SLUG, lkr, normalise, payload, quote, readJson, summarise, writeJson } from "./lib.mjs";

const action = process.env.ADMIN_ACTION;
const catalog = await readJson(CATALOG);
const find = (slug) => {
  if (!SLUG.test(slug ?? "")) throw new Error(`${action}: a slug is needed`);
  const i = catalog.findIndex((p) => p.slug === slug);
  if (i < 0) throw new Error(`${action}: ${slug} is not in the catalogue`);
  return i;
};
// an offer price: a round ten rupees, always below the full price
const offer = (price, pct) => Math.max(10, Math.min(Math.round((price * (1 - pct / 100)) / 10) * 10, price - 10));

if (action === "update-product") {
  const i = find(payload.slug);
  const product = catalog[i];
  const data = payload.data ?? {};
  const was = product.name;
  const parts = [];
  if (typeof data.name === "string" && data.name.trim() && data.name.trim() !== product.name) {
    parts.push(`renamed to ${quote(data.name.trim())}`);
    product.name = data.name.trim().slice(0, 60);
  }
  if (data.category in COLLECTIONS && data.category !== product.category) {
    parts.push(`moved to ${COLLECTIONS[data.category]}`);
    product.category = data.category;
  }
  if (typeof data.price === "number" && data.price > 0 && Math.round(data.price) !== product.price) {
    parts.push(`price ${lkr(product.price)} → ${lkr(Math.round(data.price))}`);
    product.price = Math.round(data.price);
  }
  if (data.salePrice === null && product.salePrice !== undefined) {
    parts.push("offer ended");
    delete product.salePrice;
  } else if (typeof data.salePrice === "number" && data.salePrice > 0) {
    const sale = Math.round(data.salePrice);
    // the console and the dispatch route refuse this before it is queued (src/lib/admin/offers.ts); this stays as the
    // last line of defence
    if (sale >= product.price) throw new Error("update-product: the offer price must be below the full price");
    if (sale !== product.salePrice) {
      parts.push(`${product.salePrice ? "offer" : "on offer at"} ${lkr(sale)}`);
      product.salePrice = sale;
    }
  }
  if (data.bestSeller === null && product.bestSeller !== undefined) {
    parts.push("no longer a best seller");
    delete product.bestSeller;
  } else if (Number.isInteger(data.bestSeller) && data.bestSeller >= 1 && data.bestSeller !== product.bestSeller) {
    if (!product.bestSeller && catalog.filter((p) => p.bestSeller).length >= 6) throw new Error("update-product: six best sellers already");
    parts.push(`best seller #${data.bestSeller}`);
    product.bestSeller = data.bestSeller;
  }
  if (parts.length === 0) {
    console.log("nothing changed");
    process.exit(0);
  }
  catalog[i] = normalise(product);
  await writeJson(CATALOG, catalog);
  await summarise(`${quote(was)}: ${parts.join(", ")}`);
} else if (action === "remove-product") {
  const i = find(payload.slug);
  const [product] = catalog.splice(i, 1);
  await writeJson(CATALOG, catalog);
  // its photos: the front, the back and side views and any colourways (products/<slug>--<colour>…). They come out of
  // the manifest but stay in the bucket. The live site reads the same bucket and keeps listing the piece until the next
  // release from dev to main, so deleting them here would leave it showing broken images until then — and, if this
  // change's pull request failed, would leave dev with the piece and no photos. Once nothing lists them they are never
  // fetched, and unlisted photos can be cleared from the bucket by hand later.
  const manifest = await readJson(MANIFEST);
  const mine = Object.keys(manifest.images).filter((key) => key.startsWith(`products/${product.slug}.`) || key.startsWith(`products/${product.slug}-`));
  for (const key of mine) {
    delete manifest.images[key];
    console.log(`  – ${key}`);
  }
  await writeJson(MANIFEST, manifest);
  await import("../sync-product-images.mjs");
  await summarise(`removed ${quote(product.name)} (${mine.length} photo${mine.length === 1 ? "" : "s"} kept in the bucket)`);
} else if (action === "bulk-offer") {
  const { category, percentOff } = payload;
  if (category !== "*" && !(category in COLLECTIONS)) throw new Error("bulk-offer: unknown collection");
  const pct = percentOff === null ? null : Math.round(Number(percentOff));
  if (pct !== null && !(pct >= 1 && pct <= 90)) throw new Error("bulk-offer: percent off must be 1–90");
  let changed = 0;
  catalog.forEach((p, i) => {
    if (category !== "*" && p.category !== category) return;
    if (pct === null) {
      if (p.salePrice === undefined) return;
      delete p.salePrice;
    } else {
      const sale = offer(p.price, pct);
      if (p.salePrice === sale) return;
      p.salePrice = sale;
    }
    catalog[i] = normalise(p);
    changed++;
  });
  if (changed === 0) {
    console.log("nothing changed");
    process.exit(0);
  }
  await writeJson(CATALOG, catalog);
  const scope = category === "*" ? "everything" : COLLECTIONS[category];
  await summarise(pct === null ? `offers cleared on ${scope} (${changed} piece${changed === 1 ? "" : "s"})` : `${pct}% off ${scope} (${changed} piece${changed === 1 ? "" : "s"})`);
} else {
  throw new Error(`unknown action: ${action}`);
}
