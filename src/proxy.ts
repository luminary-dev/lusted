import { NextResponse, type NextRequest } from "next/server";
import catalog from "@/lib/catalog.json";
import { site } from "@/lib/site";

// With site.revealGate on, every page shows /revealing-soon in place until reveal day (site.revealAt) — the address
// bar keeps the real URL. To see the actual site before then, open any page with ?preview=1 once: it sets a cookie
// that lets you through for 30 days. REVEAL_GATE=off in the environment switches the gate off early; after the
// moment passes it is simply gone, no deploy needed.
const REVEAL_AT = Date.parse(site.revealAt);
const PREVIEW_COOKIE = "lusted-preview";

// A product URL that isn't in the catalogue gets a real 404. The product route is partially prerendered, so its
// shell would otherwise answer 200 and only the streamed body would say "not found" — which search engines index.
const slugs = new Set(catalog.map((p) => p.slug));

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (site.revealGate && Date.now() < REVEAL_AT && process.env.REVEAL_GATE !== "off") {
    if (searchParams.get("preview") === "1") {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("preview");
      const res = NextResponse.redirect(clean);
      res.cookies.set(PREVIEW_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
      return res;
    }
    if (!request.cookies.has(PREVIEW_COOKIE) && pathname !== "/revealing-soon") {
      return NextResponse.rewrite(new URL("/revealing-soon", request.url));
    }
  }

  const [, section, slug] = pathname.split("/");
  if (section === "products" && slug && !slugs.has(slug)) return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  return NextResponse.next();
}

// every page, but not the API, Next's own files or anything with a file extension (images, icons, fonts)
export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
