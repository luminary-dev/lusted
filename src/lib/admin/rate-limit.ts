import "server-only";

// A best-effort throttle on the sign-in route. It lives in the memory of one serverless instance, so it is a speed
// bump on top of the flat failure delay and the scrypt-hashed password, not a hard guarantee. For a durable limit,
// back it with a store (Upstash, Vercel KV).

const WINDOW_MS = 10 * 60 * 1000; // ten minutes
const MAX_FAILURES = 8; // per address per window, then 429

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

// The caller's address. x-real-ip is set by the platform (Vercel overwrites it); failing that, the right-most
// X-Forwarded-For hop is the one the nearest proxy appended. The left-most hop is whatever the client sent, so keying
// on it let anyone dodge the throttle by sending a fresh X-Forwarded-For with every guess.
export function clientKey(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = (request.headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops[hops.length - 1] || "unknown";
}

// A general fixed-window counter for unauthenticated routes (the newsletter sign-up): true once `key` has made more
// than `max` calls in the window. Same caveat as above — per instance, a speed bump.
const hits = new Map<string, Bucket>();
export function overLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = hits.get(key);
  if (!bucket || bucket.reset <= now) hits.set(key, { count: 1, reset: now + windowMs });
  else bucket.count += 1;
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k); // never unbounded
  const current = hits.get(key);
  return !!current && current.count > max;
}

export function isRateLimited(key: string): boolean {
  const bucket = buckets.get(key);
  return !!bucket && bucket.reset > Date.now() && bucket.count >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) buckets.set(key, { count: 1, reset: now + WINDOW_MS });
  else bucket.count += 1;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k); // never unbounded
}

export function resetFailures(key: string): void {
  buckets.delete(key);
}
