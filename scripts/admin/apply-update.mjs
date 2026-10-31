// Applies one small console change to the catalogue: runs in the Console workflow (.github/workflows/console.yml) with
//   ADMIN_ACTION   update-product | remove-product | bulk-offer | product-photo
//   ADMIN_PAYLOAD  the dispatch's client_payload as JSON (shaped and checked by src/app/api/admin/dispatch/route.ts)
// A removal also takes the piece's photos out of the manifest, but leaves them in the bucket, and drops it from any
// other piece's pairsWith. A photo change finishes the owner's new photos the way add-product.mjs does and puts each
// under a key of its own (scripts/lib/photo-keys.mjs); a photo it replaces or removes leaves the manifest but stays in
// the bucket, for the same reason a removed piece's do. The workflow commits what changed, with the summary written
// here as the message.
import { VIEWS, photoBase, photoKey, revKey } from "../lib/photo-keys.mjs";
import { CATALOG, COLLECTIONS, INCOMING, MANIFEST, SLUG, bucket, finishPhoto, lkr, normalise, payload, quote, readJson, sortManifest, summarise, writeJson } from "./lib.mjs";

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
  // only the fields the owner changed are sent; one that's absent is left as the catalogue has it now (another change
  // may have moved it since the console last looked), and a null offer price or rank ends it
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
    if (sale !== product.salePrice) {
      parts.push(`${product.salePrice ? "offer" : "on offer at"} ${lkr(sale)}`);
      product.salePrice = sale;
    }
  }
  // checked on the piece as it ends up, since a new price may come without the offer it sits above (or the other way);
  // the console and the dispatch route refuse this before it is queued (src/lib/admin/offers.ts), so this is the last
  // line of defence
  if (("price" in data || "salePrice" in data) && product.salePrice !== undefined && product.salePrice >= product.price) throw new Error("update-product: the offer price must be below the full price");
  if (data.bestSeller === null && product.bestSeller !== undefined) {
    parts.push("no longer a best seller");
    delete product.bestSeller;
  } else if (Number.isInteger(data.bestSeller) && data.bestSeller >= 1 && data.bestSeller !== product.bestSeller) {
    if (!product.bestSeller && catalog.filter((p) => p.bestSeller).length >= 6) throw new Error("update-product: six best sellers already");
    parts.push(`best seller #${data.bestSeller}`);
    product.bestSeller = data.bestSeller;
  }
  // the sizes it's out of, as the whole list: an empty one puts every size back. Only the piece's own sizes — the
  // console and the dispatch route refuse anything else before it is queued (src/lib/admin/stock.ts), so this is the
  // last line of defence
  if (Array.isArray(data.soldOut)) {
    if (data.soldOut.some((s) => !product.sizes.includes(s))) throw new Error("update-product: only the piece's own sizes can be sold out");
    const before = product.soldOut ?? [];
    const gone = product.sizes.filter((s) => data.soldOut.includes(s));
    const out = gone.filter((s) => !before.includes(s));
    const back = before.filter((s) => !gone.includes(s));
    const oneSize = product.sizes.length === 1;
    if (out.length) parts.push(oneSize ? "sold out" : gone.length === product.sizes.length ? "sold out in every size" : `${out.join(", ")} sold out`);
    if (back.length) parts.push(oneSize ? "back in stock" : `${back.join(", ")} back in stock`);
    if (gone.length) product.soldOut = gone;
    else delete product.soldOut;
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
  // the pieces it was paired with forget it too, so no "Complete the set" points at a piece that's gone
  const unpaired = [];
  catalog.forEach((p, j) => {
    if (!p.pairsWith?.includes(product.slug)) return;
    p.pairsWith = p.pairsWith.filter((s) => s !== product.slug);
    if (p.pairsWith.length === 0) delete p.pairsWith;
    catalog[j] = normalise(p);
    unpaired.push(quote(p.name));
  });
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
  await summarise(`removed ${quote(product.name)} (${mine.length} photo${mine.length === 1 ? "" : "s"} kept in the bucket)${unpaired.length ? `, unpaired from ${unpaired.join(", ")}` : ""}`);
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
} else if (action === "product-photo") {
  const i = find(payload.slug);
  const product = catalog[i];
  const manifest = await readJson(MANIFEST);
  const has = (colour, view) => photoKey(manifest.images, photoBase(product.slug, colour, view));
  // each change is a photo (an incoming/ address) for one view of the piece (front, back, side or one of the three
  // extras), or of one of its other colours, or null to
  // remove that view's photo. The console and the dispatch route refuse anything else before it is queued
  // (src/lib/admin/photos.ts); this is the last line of defence.
  const changes = (Array.isArray(payload.changes) ? payload.changes : []).map(({ colour = null, view, photo = null } = {}) => ({ colour, view, photo }));
  if (changes.length === 0 || changes.length > 48) throw new Error("product-photo: one to 48 changes");
  const seen = new Set();
  for (const { colour, view, photo } of changes) {
    if (!VIEWS.includes(view)) throw new Error("product-photo: front, back, side or an extra");
    if (colour !== null && !/^[a-z]{1,20}$/.test(colour)) throw new Error("product-photo: not a colour");
    if (colour === product.colors[0]) throw new Error(`product-photo: the ${colour} photos are the piece's own`);
    if (seen.has(`${colour}/${view}`)) throw new Error("product-photo: one change per photo");
    seen.add(`${colour}/${view}`);
    if (photo === null && colour === null && view === "front") throw new Error("product-photo: a piece keeps its front photo");
    if (photo !== null && (!INCOMING.test(photo) || !photo.includes(`/${view}.`))) throw new Error(`product-photo: the ${view} photo's address is wrong`);
  }
  // a colour's other photos show only with its front (sync-product-images.mjs)
  for (const colour of new Set(changes.filter((c) => c.colour !== null && c.photo !== null).map((c) => c.colour))) {
    const front = changes.find((c) => c.colour === colour && c.view === "front");
    if (!(front ? front.photo !== null : has(colour, "front"))) throw new Error(`product-photo: the ${colour} photos need a front`);
  }

  const store = changes.some((c) => c.photo !== null) ? bucket() : null;
  const said = [];
  let kept = 0; // photos out of the manifest, still in the bucket
  for (const { colour, view, photo } of changes) {
    const was = has(colour, view);
    const label = `${colour ? `${colour} ` : ""}${view.replace(/^extra/, "extra ")}`;
    if (photo === null) {
      // already gone: a second run of the same change, or the colour's front took it along just before
      if (!was) continue;
      // a colour's other photos go with its front, since they never show without it
      const gone = [was, ...(colour && view === "front" ? VIEWS.filter((v) => v !== "front").map((v) => has(colour, v)).filter(Boolean) : [])];
      for (const key of gone) {
        delete manifest.images[key];
        console.log(`  – ${key}`);
      }
      kept += gone.length;
      said.push(gone.length > 1 ? `${colour} photos removed` : `${label} photo removed`);
    } else {
      const key = revKey(photoBase(product.slug, colour, view), photo);
      if (was === key) continue; // in already: a second run of the same change
      manifest.images[key] = await finishPhoto(store, photo, key);
      if (was) {
        delete manifest.images[was];
        console.log(`  – ${was}`);
        kept++;
      }
      said.push(was ? `${label} photo replaced` : `new ${label} photo`);
    }
  }
  // a photo of the piece in a colour it doesn't list yet adds the colour, after the ones it has
  const added = [...new Set(changes.filter((c) => c.colour !== null && c.photo !== null && !product.colors.includes(c.colour)).map((c) => c.colour))];
  if (said.length === 0 && added.length === 0) {
    console.log("nothing changed");
    process.exit(0);
  }
  if (added.length) {
    product.colors = [...product.colors, ...added];
    catalog[i] = normalise(product);
    await writeJson(CATALOG, catalog);
    said.push(`${added.join(" and ")} added to its colours`);
  }
  await writeJson(MANIFEST, sortManifest(manifest));
  for (const { photo } of changes) if (photo !== null) await store.del(photo);
  await import("../sync-product-images.mjs");
  await summarise(`${quote(product.name)}: ${said.join(", ")}${kept ? ` (${kept} old photo${kept === 1 ? "" : "s"} kept in the bucket)` : ""}`);
} else {
  throw new Error(`unknown action: ${action}`);
}
