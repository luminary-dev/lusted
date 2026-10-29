import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { bucket } from "@/lib/admin/r2";

// A signed address for one photo: the browser puts the file straight into the bucket under incoming/<upload>/<view>.
// The upload id is minted here, once per piece, and comes back with the first address; the views are fixed names
// (front, back, side, and extra1–3 for the three optional photos a piece can have after them).

const VIEWS = new Set(["front", "back", "side", "extra1", "extra2", "extra3"]);
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: Request) {
  const denied = await requireAdmin(request, { sameOrigin: true });
  if (denied) return denied;
  const store = bucket();
  if (!store) return NextResponse.json({ ok: false, error: "The photo store is not configured" }, { status: 503 });

  let body: { upload?: unknown; view?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const view = typeof body.view === "string" && VIEWS.has(body.view) ? body.view : null;
  const type = typeof body.type === "string" && TYPES[body.type] ? body.type : null;
  const upload = typeof body.upload === "string" && /^[a-f0-9]{24}$/.test(body.upload) ? body.upload : randomBytes(12).toString("hex");
  if (!view || !type) return NextResponse.json({ ok: false, error: "A front, back, side or extra photo as JPEG, PNG or WebP" }, { status: 400 });

  const key = `incoming/${upload}/${view}.${TYPES[type]}`;
  try {
    const url = await store.uploadUrl(key, type);
    return NextResponse.json({ ok: true, upload, key, url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Could not sign the upload" }, { status: 502 });
  }
}
