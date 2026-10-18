import { NextResponse, type NextRequest } from "next/server";
import catalog from "@/lib/catalog.json";

// A product URL that isn't in the catalogue gets a real 404. The product route is partially prerendered, so its
// shell would otherwise answer 200 and only the streamed body would say "not found" — which search engines index.
const slugs = new Set(catalog.map((p) => p.slug));

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !slugs.has(slug)) return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  return NextResponse.next();
}

export const config = { matcher: "/products/:slug" };
