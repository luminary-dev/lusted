import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin/auth";

// Shared authorisation for every console route: a valid, unexpired session cookie, and — on anything that changes
// something — a same-origin check, so a page elsewhere can't drive the console with the owner's cookie (CSRF), even
// if a browser ever loosened SameSite.

// true when the request comes from the site itself (or a direct navigation); Sec-Fetch-Site when the browser sends
// it, the Origin header against the Host header otherwise
export function isSameOrigin(request: Request): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) return secFetchSite === "same-origin" || secFetchSite === "none";
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (request.headers.get("host") ?? "\0");
  } catch {
    return false;
  }
}

// a response to send instead of the handler's when the request isn't allowed, or null to carry on
export async function requireAdmin(request: Request, opts: { sameOrigin?: boolean } = {}): Promise<NextResponse | null> {
  if (opts.sameOrigin && !isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) return NextResponse.json({ ok: false }, { status: 401 });
  return null;
}
