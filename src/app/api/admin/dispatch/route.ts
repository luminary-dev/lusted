import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { dispatch, getFile } from "@/lib/admin/github";
import { categories } from "@/lib/products";

// Small catalogue changes from the console: a piece's name, collection, price, offer price or best-seller rank, a
// removal, or an offer across a whole collection. Each fires one repository_dispatch; the console-apply workflow
// makes the change on a branch and opens the pull request that carries it into dev.

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

  let body: { action?: string; slug?: unknown; data?: Record<string, unknown>; category?: unknown; percentOff?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (body.action === "update-product") {
      if (typeof body.slug !== "string" || !SLUG.test(body.slug) || !body.data) return NextResponse.json({ ok: false }, { status: 400 });
      const data = sanitizeUpdate(body.data);
      if (Object.keys(data).length === 0) return NextResponse.json({ ok: false }, { status: 400 });
      if (typeof data.bestSeller === "number") {
        // six best sellers at most: a piece that isn't one yet can't become the seventh
        const file = await getFile("src/lib/catalog.json");
        const catalog = file ? (JSON.parse(file.toString("utf8")) as Array<{ slug: string; bestSeller?: number }>) : [];
        const me = catalog.find((p) => p.slug === body.slug);
        if (me && !me.bestSeller && catalog.filter((p) => p.bestSeller).length >= 6) return NextResponse.json({ ok: false, error: "Six best sellers already — clear one first" }, { status: 409 });
      }
      await dispatch("update-product", { slug: body.slug, data });
    } else if (body.action === "remove-product") {
      if (typeof body.slug !== "string" || !SLUG.test(body.slug)) return NextResponse.json({ ok: false }, { status: 400 });
      await dispatch("remove-product", { slug: body.slug });
    } else if (body.action === "bulk-offer") {
      const category = body.category;
      const percent = body.percentOff;
      const okCategory = typeof category === "string" && (category === "*" || CATEGORIES.has(category as never));
      const okPercent = percent === null || (typeof percent === "number" && percent >= 1 && percent <= 90);
      if (!okCategory || !okPercent) return NextResponse.json({ ok: false }, { status: 400 });
      await dispatch("bulk-offer", { category, percentOff: percent === null ? null : Math.round(percent as number) });
    } else {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "GitHub rejected the request" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
