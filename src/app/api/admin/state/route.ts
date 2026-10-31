import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getFile, listConsolePulls } from "@/lib/admin/github";

// The console's source of truth: the catalogue as it is on the dev branch right now (not the copy baked into the
// last deploy), which product photos it lists (the manifest's products/ keys — a replaced photo has a new key, so this
// is how the console sees a photo change land), and the console's own pull requests still on their way in. The
// console polls this after queuing a change and calls it done the moment the change is in.

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const [catalogFile, manifestFile, pulls] = await Promise.all([getFile("src/lib/catalog.json"), getFile("src/lib/image-manifest.json"), listConsolePulls()]);
    const products = catalogFile ? JSON.parse(catalogFile.toString("utf8")) : null;
    const images = manifestFile ? (JSON.parse(manifestFile.toString("utf8")) as { images: Record<string, unknown> }).images : null;
    const photos = images ? Object.keys(images).filter((key) => key.startsWith("products/")) : null;
    return NextResponse.json({ ok: true, products, photos, pulls });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "GitHub could not be reached" }, { status: 502 });
  }
}
