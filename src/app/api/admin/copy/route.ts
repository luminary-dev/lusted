import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { writeCopy } from "@/lib/admin/copy";
import { categories, colors, type Category, type ColorKey } from "@/lib/products";

// "Write it with AI": the front photo (shrunk by the browser first, so it fits a request) and the owner's few facts
// go to Claude; the name, description and the rest come back for the owner to read and change before adding.

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CATEGORIES = new Set(categories.map((c) => c.key));

export async function POST(request: Request) {
  const denied = await requireAdmin(request, { sameOrigin: true });
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad form data" }, { status: 400 });
  }
  const image = form.get("image");
  const category = String(form.get("category") ?? "");
  const price = Math.round(Number(form.get("price")));
  const fit = Number(form.get("fit") ?? 0);
  const picked = String(form.get("colors") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ColorKey => c in colors);
  const notes = String(form.get("notes") ?? "")
    .trim()
    .slice(0, 400);

  if (!(image instanceof File) || !TYPES.has(image.type)) return NextResponse.json({ ok: false, error: "The photo must be JPEG, PNG or WebP" }, { status: 400 });
  if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ ok: false, error: "The photo sent for the copy is too large" }, { status: 400 });
  if (!CATEGORIES.has(category as Category)) return NextResponse.json({ ok: false, error: "Collection" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ ok: false, error: "Price" }, { status: 400 });
  if (![-1, 0, 1].includes(fit)) return NextResponse.json({ ok: false, error: "Fit" }, { status: 400 });
  if (picked.length === 0) return NextResponse.json({ ok: false, error: "Pick at least one colour" }, { status: 400 });

  try {
    const copy = await writeCopy({
      category: category as Category,
      colors: picked,
      price,
      fit: fit as -1 | 0 | 1,
      notes,
      image: { mediaType: image.type as "image/jpeg" | "image/png" | "image/webp", base64: Buffer.from(await image.arrayBuffer()).toString("base64") },
    });
    return NextResponse.json({ ok: true, copy });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not write it";
    return NextResponse.json({ ok: false, error: /not set/.test(message) ? message : "Claude could not write it — try again" }, { status: /not set/.test(message) ? 501 : 502 });
  }
}
