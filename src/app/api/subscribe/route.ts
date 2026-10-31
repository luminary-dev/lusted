// Newsletter sign-up. Forwards the email to NEWSLETTER_WEBHOOK_URL (e.g. a Klaviyo,
// Mailchimp or Zapier webhook). Returns 501 until that env var is configured.
import { isSameOrigin } from "@/lib/admin/guard";
import { clientKey, overLimit } from "@/lib/admin/rate-limit";
import { readJson } from "@/lib/read-json";

const MAX_BODY_BYTES = 2048; // an email and a little JSON; anything bigger is not a sign-up
const MAX_SIGNUPS = 5; // well-formed sign-ups per address per minute, then 429 (keeps the webhook from being flooded)
const WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  // Only the site's own form may sign someone up. readJson takes a JSON body whatever its Content-Type, so without
  // this any page elsewhere could post a cross-site text/plain "form" and sign up addresses whose owners never asked
  // (consent the Personal Data Protection Act needs us to have). A browser always sends Origin (and, today,
  // Sec-Fetch-Site) on a cross-site POST, so a page can't get past this. A request with neither header isn't from a
  // browser page at all (curl, a script, the Playwright API tests): it can't ride on a visitor's browser, and it could
  // send any header it liked anyway, so it is let through to the same checks and rate limit as everyone else.
  const fromBrowser = request.headers.has("origin") || request.headers.has("sec-fetch-site");
  if (fromBrowser && !isSameOrigin(request)) return Response.json({ error: "Please sign up through our website." }, { status: 403 });

  const read = await readJson(request, MAX_BODY_BYTES);
  if (read.tooLarge) return Response.json({ error: "Please enter a valid email address." }, { status: 413 });
  // any body that isn't a JSON object with an email (not JSON, `null`, an array…) is just an invalid address
  const body = read.value;
  const email = body && typeof body === "object" ? (body as { email?: unknown }).email : undefined;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (overLimit(`subscribe:${clientKey(request)}`, MAX_SIGNUPS, WINDOW_MS)) {
    return Response.json({ error: "Too many sign-ups — try again in a minute." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const webhook = process.env.NEWSLETTER_WEBHOOK_URL;
  if (!webhook) return Response.json({ error: "Newsletter is not configured yet." }, { status: 501 });

  // a webhook that is down or slow is the same answer as one that refuses: try again later (never a hung request)
  const ok = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "lusted-website" }),
    signal: AbortSignal.timeout(5000),
  }).then(
    (res) => res.ok,
    () => false,
  );
  if (!ok) return Response.json({ error: "Could not subscribe right now." }, { status: 502 });
  return Response.json({ ok: true });
}
