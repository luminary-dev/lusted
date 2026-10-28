# Security findings

Audit of the server-side attack surface: the image proxy, the admin console API, the GitHub token, the newsletter
sign-up, `NEXT_PUBLIC_*` usage, request bodies, error responses and security headers. Line numbers refer to the
code before this pass unless noted. Regression tests: `tests/10-security.spec.ts`.

## Fixed

### 1. Login throttle bypass via a spoofed `X-Forwarded-For` — medium
- **Where:** `src/lib/admin/rate-limit.ts:13-16` (`clientKey`), used by `src/app/api/admin/login/route.ts:11`.
- **Attack:** the throttle (8 failures per 10 minutes, then 429) was keyed on the **left-most** `X-Forwarded-For`
  entry. The client controls that value, and proxies append to the header rather than replacing it. Sending a new
  `X-Forwarded-For` with every request gave an attacker a fresh bucket each time, so password guessing was limited only
  by the flat 1.2 s delay, and that can be run in parallel.
- **Change:** `clientKey` now uses `x-real-ip`, which the platform sets and overwrites, and otherwise the
  **right-most** `X-Forwarded-For` hop, which the nearest proxy appended.
- **Test:** "login throttle can't be dodged by rotating X-Forwarded-For". It sends 9 failed sign-ins with a different
  client-supplied hop each time and expects the 9th to return 429. The old code returned 401 every time.

### 2. Newsletter sign-up had no rate limit — medium
- **Where:** `src/app/api/subscribe/route.ts:3-24`.
- **Attack:** anyone could post unlimited well-formed addresses. Each one is forwarded to `NEWSLETTER_WEBHOOK_URL`, so
  an attacker could flood the mailing list with junk or third-party addresses (subscription bombing) and burn the
  webhook provider's quota.
- **Change:** a per-address fixed window (`overLimit` in `rate-limit.ts`) of 5 valid sign-ups per minute, then 429
  with `Retry-After: 60`. The check runs after validation and before the webhook call.
- **Test:** "newsletter sign-up is rate limited per address". The 6th request from one address gets 429, and a
  different address is still accepted.

### 3. Unbounded request bodies on public routes — low
- **Where:** `src/app/api/subscribe/route.ts:5` and `src/app/api/admin/login/route.ts:17-25` (`request.json()`).
- **Attack:** both routes are unauthenticated and read the whole body into memory before validating it. On login, a
  very large `password` string is also normalised and fed to scrypt. That is cheap amplification for memory and CPU
  exhaustion, up to the platform's body limit.
- **Change:** a new `src/lib/read-json.ts` reads the body as a stream and stops at a byte cap, checking
  `Content-Length` first. The caps are 2 KB for subscribe and 4 KB for login (after the same-origin check). Both
  routes answer 413 when the cap is exceeded. Whether the input is valid is still decided by the existing code.
  Login accepts either JSON or a form post (the no-JS path added in #23), so the cap is applied to the raw body
  before it is parsed as either; an oversized form gets the same 303 back to `/admin` that any rejected form gets,
  since a browser without JS has nowhere to show a 413.
- **Tests:** "login refuses an oversized body" and "newsletter sign-up refuses an oversized body". Both expect 413;
  the old code returned 401 and 400. "the no-JS form sign-in still works and is capped too" covers the form path.

## Checked and judged non-issues

- **Image proxy, `src/app/img/[...path]/route.ts`: no SSRF and no path traversal.** The R2 host is built from server
  environment variables (`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`). The caller supplies only
  the key, and the key must exactly match an entry in `image-manifest.json` (`paths.has(key)`, line 24) before any
  fetch. So `..`, encoded traversal, absolute URLs, `169.254.169.254`, `127.0.0.1` and `10.x` all get 404 without an
  upstream request. Redirects aren't a concern because the only upstream is the signed R2 request. Responses carry
  `nosniff` and a content type from the trusted bucket. Covered by the "image route serves only manifest paths" test.
- **Admin authentication is enforced on the server.** Every route under `src/app/api/admin/*` (state, activity,
  dispatch, upload-url, copy, products/add) calls `requireAdmin` before doing anything. The ones that change state
  also require same origin, checked with `Sec-Fetch-Site`, or `Origin` against `Host`. Login has its own same-origin
  check. Logout only clears the cookie. Covered by the "admin API refuses requests without a session" test.
- **Session cookie (`login/route.ts`):** `httpOnly`, `sameSite: "strict"`, `secure` in production, `path: "/"`, and
  `maxAge` of 7 days, which matches the expiry signed into the token. The token is `expires.nonce.HMAC-SHA256`, keyed
  with `ADMIN_SESSION_SECRET`. Signatures are compared with `safeEqual` (an HMAC of both values, then
  `timingSafeEqual`, so length isn't leaked). The password is checked against `ADMIN_PASSWORD_HASH` with scrypt and
  `timingSafeEqual`, and the email comparison is constant-time.
- **Accepted (low):** sessions are stateless, so logout can't revoke a token that has been copied. It stays valid
  until it expires (7 days at most). Rotating `ADMIN_SESSION_SECRET` signs every session out, as documented in
  `auth.ts`. Server-side revocation would need a store, which is out of scope.
- **`GITHUB_ADMIN_TOKEN`** is read only in `src/lib/admin/github.ts`, which imports `server-only`. It is sent only in
  the `Authorization` header to `api.github.com` and is never returned in a response. The dispatch and products/add
  routes respond with a fixed "GitHub rejected the request" message. The error they log (`github.ts:33`) contains
  GitHub's status and response text, not the token. In client code the token appears only as its name in UI help
  text.
- **`NEXT_PUBLIC_*`:** the only one is `NEXT_PUBLIC_IMAGE_CDN`, a public image base URL, so nothing sensitive is
  exposed. `ANTHROPIC_API_KEY` (`copy.ts`) and the `R2_*` keys are read only in modules that import `server-only`.
- **Webhook payload injection (subscribe):** the email must match the address pattern and is at most 254 characters.
  It is serialised with `JSON.stringify` into a fixed shape (`{ email, source }`), so nothing can be injected. The
  webhook URL comes from server environment only, and the call has a 5 s timeout.
- **Authenticated bodies** (dispatch, upload-url, copy, products/add): every field is type-checked and length-capped,
  and photo keys are matched against strict patterns. Body size is bounded by the platform limit and the route
  requires a session, so these were left unchanged.
- **Error responses:** routes return fixed messages. Exceptions are logged on the server, and no stack traces or
  internal paths reach the client.
- **Security headers (`next.config.ts`):** CSP with `frame-ancestors 'none'`, `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, COOP and CORP. HSTS is set by Vercel. The admin routes also get
  `Cache-Control: no-store` and `noindex`.

## Caveats

- Both limiters live in memory on a single serverless instance, so they slow attackers down rather than guarantee a
  limit. A durable limit needs a shared store.
- `x-real-ip` can be trusted only behind a proxy that overwrites it, as Vercel does. If the app is ever served
  directly to the internet, put a proxy in front of it that sets this header.