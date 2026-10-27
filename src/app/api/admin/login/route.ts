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
    return NextResponse.json({ ok: false, error: "Too many attempts — wait a few minutes." }, { status: 429, headers: { "Retry-After": "600" } });
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.email === "string") email = body.email;
    if (typeof body?.password === "string") password = body.password;
  } catch {
    /* the failure path below */
  }

  if (!email || !password || !verifyCredentials(email, password)) {
    recordFailure(key);
    await sleep(1200); // a flat delay keeps guessing slow and the timing uniform
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  resetFailures(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
