import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, verifyCredentials } from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/guard";
import { clientKey, isRateLimited, recordFailure, resetFailures } from "@/lib/admin/rate-limit";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 }); // no cross-site sign-ins

  const key = clientKey(request);
  if (isRateLimited(key)) {
    await sleep(1200);
    if ((request.headers.get("content-type") ?? "").includes("form")) return NextResponse.redirect(new URL("/admin", request.url), 303);
    return NextResponse.json({ ok: false, error: "Too many attempts — wait a few minutes." }, { status: 429, headers: { "Retry-After": "600" } });
  }

  let email = "";
  let password = "";
  // the form posts JSON once the page has hydrated; before that (or without JS) the browser posts it as a form, and
  // the answer is then a redirect back to the console rather than JSON
  const asForm = (request.headers.get("content-type") ?? "").includes("form");
  try {
    if (asForm) {
      const form = await request.formData();
      email = String(form.get("email") ?? "");
      password = String(form.get("password") ?? "");
    } else {
      const body = await request.json();
      if (typeof body?.email === "string") email = body.email;
      if (typeof body?.password === "string") password = body.password;
    }
  } catch {
    /* the failure path below */
  }
  const back = () => NextResponse.redirect(new URL("/admin", request.url), 303);

  if (!email || !password || !verifyCredentials(email, password)) {
    recordFailure(key);
    await sleep(1200); // a flat delay keeps guessing slow and the timing uniform
    return asForm ? back() : NextResponse.json({ ok: false }, { status: 401 });
  }

  resetFailures(key);
  const response = asForm ? back() : NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
