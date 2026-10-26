// Newsletter sign-up. Forwards the email to NEWSLETTER_WEBHOOK_URL (e.g. a Klaviyo,
// Mailchimp or Zapier webhook). Returns 501 until that env var is configured.
export async function POST(request: Request) {
  // any body that isn't a JSON object with an email (not JSON, `null`, an array…) is just an invalid address
  const body: unknown = await request.json().catch(() => null);
  const email = body && typeof body === "object" ? (body as { email?: unknown }).email : undefined;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
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
