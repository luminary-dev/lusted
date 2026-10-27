import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getFile, listConsolePulls } from "@/lib/admin/github";

// The console's source of truth: the catalogue as it is on the dev branch right now (not the copy baked into the
// last deploy), and the console's own pull requests still on their way in. The console polls this after queuing a
// change and calls it done the moment the change is in the catalogue.

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const [catalogFile, pulls] = await Promise.all([getFile("src/lib/catalog.json"), listConsolePulls()]);
    const products = catalogFile ? JSON.parse(catalogFile.toString("utf8")) : null;
    return NextResponse.json({ ok: true, products, pulls });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "GitHub could not be reached" }, { status: 502 });
  }
}
