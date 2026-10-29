import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { dispatch, getFile } from "@/lib/admin/github";
import { offerProblem, percentProblem } from "@/lib/admin/offers";
import { INCOMING, PHOTO_CHANGES_MAX, PHOTO_VIEWS, photoChangesProblem, type PhotoView } from "@/lib/admin/photos";
import { bucket } from "@/lib/admin/r2";
import { categories, colors } from "@/lib/products";

// Small catalogue changes from the console: a piece's name, collection, price, offer price or best-seller rank, a
// removal, an offer across a whole collection, or a piece's photos. Each fires one repository_dispatch; the
// console-apply workflow makes the change on a branch and opens the pull request that carries it into dev.

const CATEGORIES = new Set(categories.map((c) => c.key));
const SLUG = /^[a-z0-9-]{1,64}$/;

// An update carries only the fields the owner changed in the ledger row, so any of them may be missing — a missing one
// stays as it is, and a null offer price or rank ends it; at least one has to come through.
function sanitizeUpdate(raw: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (typeof raw.name === "string" && raw.name.trim()) data.name = raw.name.trim().slice(0, 60);
  if (typeof raw.category === "string" && CATEGORIES.has(raw.category as never)) data.category = raw.category;
  if (typeof raw.price === "number" && Number.isFinite(raw.price) && raw.price > 0) data.price = Math.round(raw.price);
  if (raw.salePrice === null) data.salePrice = null;
  if (typeof raw.salePrice === "number" && Number.isFinite(raw.salePrice) && raw.salePrice > 0) data.salePrice = Math.round(raw.salePrice);
  if (raw.bestSeller === null) data.bestSeller = null;
  if (typeof raw.bestSeller === "number" && Number.isInteger(raw.bestSeller) && raw.bestSeller >= 1 && raw.bestSeller <= 99) data.bestSeller = raw.bestSeller;
  return data;
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request, { sameOrigin: true });
  if (denied) return denied;

  let body: { action?: string; slug?: unknown; data?: Record<string, unknown>; category?: unknown; percentOff?: unknown; changes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (body.action === "update-product") {
      if (typeof body.slug !== "string" || !SLUG.test(body.slug) || !body.data) return NextResponse.json({ ok: false }, { status: 400 });
      // an offer price that isn't a whole, positive number of rupees is refused here rather than quietly dropped
      const rawSale = body.data.salePrice;
      if (rawSale !== undefined && rawSale !== null) {
        const problem = typeof rawSale === "number" ? offerProblem(rawSale) : "Whole rupees only";
        if (problem) return NextResponse.json({ ok: false, error: `Offer price: ${problem.toLowerCase()}` }, { status: 400 });
      }
      const data = sanitizeUpdate(body.data);
      if (Object.keys(data).length === 0) return NextResponse.json({ ok: false }, { status: 400 });
      const pricing = typeof data.price === "number" || typeof data.salePrice === "number";
      if (typeof data.bestSeller === "number" || pricing) {
        const file = await getFile("src/lib/catalog.json");
        const catalog = file ? (JSON.parse(file.toString("utf8")) as Array<{ slug: string; price: number; salePrice?: number; bestSeller?: number }>) : [];
        const me = catalog.find((p) => p.slug === body.slug);
        // six best sellers at most: a piece that isn't one yet can't become the seventh
        if (typeof data.bestSeller === "number" && me && !me.bestSeller && catalog.filter((p) => p.bestSeller).length >= 6) return NextResponse.json({ ok: false, error: "Six best sellers already — clear one first" }, { status: 409 });
        // the offer, new or standing, has to stay under the full price, new or standing — the workflow refuses an
        // offer at or above it only after the change is queued, and then no pull request ever comes
        const price = typeof data.price === "number" ? data.price : me?.price;
        const sale = data.salePrice === null ? undefined : typeof data.salePrice === "number" ? data.salePrice : me?.salePrice;
        const problem = pricing && typeof sale === "number" ? offerProblem(sale, price) : null;
        if (problem) return NextResponse.json({ ok: false, error: `Offer price: ${problem.toLowerCase()}` }, { status: 400 });
      }
      await dispatch("update-product", { slug: body.slug, data });
    } else if (body.action === "remove-product") {
      if (typeof body.slug !== "string" || !SLUG.test(body.slug)) return NextResponse.json({ ok: false }, { status: 400 });
      await dispatch("remove-product", { slug: body.slug });
    } else if (body.action === "bulk-offer") {
      const category = body.category;
      const percent = body.percentOff;
      const okCategory = typeof category === "string" && (category === "*" || CATEGORIES.has(category as never));
      const percentWrong = percent === null ? null : percentProblem(typeof percent === "number" ? percent : NaN);
      if (!okCategory) return NextResponse.json({ ok: false }, { status: 400 });
      if (percentWrong) return NextResponse.json({ ok: false, error: `Percent off: ${percentWrong.toLowerCase()}` }, { status: 400 });
      await dispatch("bulk-offer", { category, percentOff: percent === null ? null : Math.round(percent as number) });
    } else if (body.action === "product-photo") {
      // A piece's photos: each change is a new photo for one view (front, back or side) of the piece, or of one of its
      // other colours, waiting in the bucket under incoming/, or null to take that view's photo off. Checked here
      // against the piece and its photos as they are on dev, so the workflow never gets a change it would refuse.
      if (typeof body.slug !== "string" || !SLUG.test(body.slug) || !Array.isArray(body.changes) || body.changes.length > PHOTO_CHANGES_MAX) return NextResponse.json({ ok: false }, { status: 400 });
      const changes: Array<{ colour: string | null; view: PhotoView; photo: string | null }> = [];
      for (const raw of body.changes as Array<Record<string, unknown> | null>) {
        const colour = raw?.colour ?? null;
        const view = raw?.view;
        const photo = raw?.photo ?? null;
        if (typeof view !== "string" || !PHOTO_VIEWS.includes(view as PhotoView)) return NextResponse.json({ ok: false }, { status: 400 });
        if (colour !== null && (typeof colour !== "string" || !(colour in colors))) return NextResponse.json({ ok: false, error: "Not one of the colours" }, { status: 400 });
        if (photo !== null && (typeof photo !== "string" || !INCOMING.test(photo) || !photo.includes(`/${view}.`))) return NextResponse.json({ ok: false, error: `The ${view} photo's address is wrong` }, { status: 400 });
        changes.push({ colour, view: view as PhotoView, photo });
      }
      const [catalogFile, manifestFile] = await Promise.all([getFile("src/lib/catalog.json"), getFile("src/lib/image-manifest.json")]);
      const catalog = catalogFile ? (JSON.parse(catalogFile.toString("utf8")) as Array<{ slug: string; colors: string[] }>) : [];
      const keys = manifestFile ? Object.keys((JSON.parse(manifestFile.toString("utf8")) as { images: Record<string, unknown> }).images) : null;
      const me = catalog.find((p) => p.slug === body.slug);
      if (!me || !keys) return NextResponse.json({ ok: false, error: "That piece isn't in the catalogue" }, { status: 400 });
      const problem = photoChangesProblem(me, keys, changes.map(({ colour, view, photo }) => ({ colour, view, remove: photo === null })));
      if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
      const store = bucket();
      if (!store && changes.some((c) => c.photo)) return NextResponse.json({ ok: false, error: "The photo store is not configured" }, { status: 503 });
      for (const { view, photo } of changes) {
        if (photo && !(await store!.exists(photo))) return NextResponse.json({ ok: false, error: `The ${view} photo didn't finish uploading — try again` }, { status: 400 });
      }
      await dispatch("product-photo", { slug: body.slug, changes });
    } else {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "GitHub rejected the request" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
