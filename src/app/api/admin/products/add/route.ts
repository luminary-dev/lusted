import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { dispatch, getFile } from "@/lib/admin/github";
import { bucket } from "@/lib/admin/r2";
import { categories, colors, sizes as SIZES, type Category, type ColorKey } from "@/lib/products";

// Adding a piece. By now the photos are in the bucket under incoming/<upload>/ (upload-url) and the owner has read
// and approved the copy (copy). This checks everything once more, confirms the photos are really there, and fires
// the add-product dispatch: the console-add workflow makes the catalogue photos, uploads them, writes the piece into
// the catalogue and opens the pull request into dev.

const CATEGORIES = new Set(categories.map((c) => c.key));
const KEY = /^incoming\/[a-f0-9]{24}\/(front|back|side)\.(jpg|png|webp)$/;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, max: number, n: number) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => String(x).trim().slice(0, max)).slice(0, n) : []);

export async function POST(request: Request) {
  const denied = await requireAdmin(request, { sameOrigin: true });
  if (denied) return denied;
  const store = bucket();
  if (!store) return NextResponse.json({ ok: false, error: "The photo store is not configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const name = str(body.name, 60);
  const description = str(body.description, 600);
  const blurb = str(body.blurb, 90);
  const fitNote = str(body.fitNote, 160);
  const details = list(body.details, 80, 6);
  const moments = list(body.moments, 60, 3);
  const category = str(body.category, 20);
  const price = Math.round(Number(body.price));
  const fit = Number(body.fit ?? 0);
  const picked = list(body.colors, 20, 8).filter((c): c is ColorKey => c in colors);
  const sizes = list(body.sizes, 4, 8).filter((s) => (SIZES as readonly string[]).includes(s));
  const bestSeller = body.bestSeller === null || body.bestSeller === undefined ? undefined : Number(body.bestSeller);
  const views = (body.views ?? {}) as Record<string, unknown>;
  const keys: Record<string, string> = {};
  for (const view of ["front", "back", "side"] as const) {
    const key = views[view];
    if (typeof key === "string") {
      if (!KEY.test(key) || !key.includes(`/${view}.`)) return NextResponse.json({ ok: false, error: `The ${view} photo's address is wrong` }, { status: 400 });
      keys[view] = key;
    }
  }

  if (!name) return NextResponse.json({ ok: false, error: "Name" }, { status: 400 });
  if (!description) return NextResponse.json({ ok: false, error: "Description" }, { status: 400 });
  if (!CATEGORIES.has(category as Category)) return NextResponse.json({ ok: false, error: "Collection" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ ok: false, error: "Price" }, { status: 400 });
  if (![-1, 0, 1].includes(fit)) return NextResponse.json({ ok: false, error: "Fit" }, { status: 400 });
  if (picked.length === 0) return NextResponse.json({ ok: false, error: "Pick at least one colour" }, { status: 400 });
  if (sizes.length === 0) return NextResponse.json({ ok: false, error: "Pick at least one size" }, { status: 400 });
  if (moments.length !== 3) return NextResponse.json({ ok: false, error: "Three moments" }, { status: 400 });
  if (details.length === 0) return NextResponse.json({ ok: false, error: "At least one detail" }, { status: 400 });
  if (bestSeller !== undefined && (!Number.isInteger(bestSeller) || bestSeller < 1 || bestSeller > 99)) return NextResponse.json({ ok: false, error: "Best-seller rank" }, { status: 400 });
  if (!keys.front) return NextResponse.json({ ok: false, error: "The front photo is needed" }, { status: 400 });
  if (!keys.back) return NextResponse.json({ ok: false, error: "The back photo is needed" }, { status: 400 });
  const upload = keys.front.split("/")[1];
  for (const key of Object.values(keys)) if (key.split("/")[1] !== upload) return NextResponse.json({ ok: false, error: "The photos belong to different uploads" }, { status: 400 });

  const slug = slugify(name);
  if (!slug) return NextResponse.json({ ok: false, error: "Name" }, { status: 400 });

  try {
    const catalogFile = await getFile("src/lib/catalog.json");
    const taken = catalogFile ? (JSON.parse(catalogFile.toString("utf8")) as Array<{ slug: string }>).some((p) => p.slug === slug) : false;
    if (taken) return NextResponse.json({ ok: false, error: `“${name}” is already in the catalogue — change the name` }, { status: 409 });
    for (const [view, key] of Object.entries(keys)) {
      if (!(await store.exists(key))) return NextResponse.json({ ok: false, error: `The ${view} photo didn't finish uploading — try again` }, { status: 400 });
    }
    await dispatch("add-product", {
      slug,
      name,
      description,
      blurb: blurb || undefined,
      details,
      fitNote,
      moments,
      category,
      price,
      fit,
      colors: picked,
      sizes,
      bestSeller,
      views: keys,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "GitHub rejected the request" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, slug });
}
