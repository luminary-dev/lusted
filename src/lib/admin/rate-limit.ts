import "server-only";

// A best-effort throttle on the sign-in route. It lives in the memory of one serverless instance, so it is a speed
// bump on top of the flat failure delay and the scrypt-hashed password, not a hard guarantee. For a durable limit,
// back it with a store (Upstash, Vercel KV).

const WINDOW_MS = 10 * 60 * 1000; // ten minutes
const MAX_FAILURES = 8; // per address per window, then 429

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : "") || request.headers.get("x-real-ip") || "unknown";
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
