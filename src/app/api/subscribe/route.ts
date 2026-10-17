// Newsletter sign-up. Forwards the email to NEWSLETTER_WEBHOOK_URL (e.g. a Klaviyo,
// Mailchimp or Zapier webhook). Returns 501 until that env var is configured.
export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: "" }));
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const webhook = process.env.NEWSLETTER_WEBHOOK_URL;
  if (!webhook) return Response.json({ error: "Newsletter is not configured yet." }, { status: 501 });

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "lusted-website" }),
  });
  if (!res.ok) return Response.json({ error: "Could not subscribe right now." }, { status: 502 });
  return Response.json({ ok: true });
}
