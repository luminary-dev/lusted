import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, verifyCredentials } from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/guard";
import { clientKey, isRateLimited, recordFailure, resetFailures } from "@/lib/admin/rate-limit";
import { readBody } from "@/lib/read-json";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 }); // no cross-site sign-ins

  const key = clientKey(request);
  // the form posts JSON once the page has hydrated; before that (or without JS) the browser posts it as a form, and
  // the answer is then a redirect back to the console rather than JSON
  const asForm = (request.headers.get("content-type") ?? "").includes("form");
  const back = () => NextResponse.redirect(new URL("/admin", request.url), 303);

  if (isRateLimited(key)) {
    await sleep(1200);
    if (asForm) return back();
    return NextResponse.json({ ok: false, error: "Too many attempts — wait a few minutes." }, { status: 429, headers: { "Retry-After": "600" } });
  }

  // capped: the route is public, and an unbounded body (or a megabyte "password" fed to scrypt) costs memory and CPU
  const read = await readBody(request, 4096);
  if (read.tooLarge) return asForm ? back() : NextResponse.json({ ok: false }, { status: 413 });

  let email = "";
  let password = "";
  try {
    if (asForm) {
      const form = new URLSearchParams(read.text);
      email = form.get("email") ?? "";
      password = form.get("password") ?? "";
    } else {
      const body = JSON.parse(read.text);
      if (typeof body?.email === "string") email = body.email;
      if (typeof body?.password === "string") password = body.password;
    }
  } catch {
    /* the failure path below */
  }

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
