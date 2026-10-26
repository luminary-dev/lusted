import { AwsClient } from "aws4fetch";
import manifest from "@/lib/image-manifest.json";

// The photos: served from the site's own origin, read from the private R2 bucket with a signed request. Only the
// server holds the keys (R2_* in the environment), only paths in the manifest are ever fetched, and the answer is
// cacheable for a year, so Vercel's edge serves repeats and the bucket sees a request per photo per region.
// next/image points at /img/<path> (src/lib/cdn.ts) and optimises from here like any same-origin image.

const paths = new Set(Object.keys(manifest.images));

function r2() {
  const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  return {
    client: new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" }),
    base: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
  };
}

async function serve(request: Request, params: Promise<{ path: string[] }>, method: "GET" | "HEAD") {
  const key = (await params).path.join("/");
  if (!paths.has(key)) return new Response("Not found", { status: 404 });
  const bucket = r2();
  if (!bucket) return new Response("The photo store is not configured (R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).", { status: 503 });

  const headers: Record<string, string> = {};
  const inm = request.headers.get("if-none-match");
  if (inm) headers["if-none-match"] = inm;
  const upstream = await bucket.client.fetch(`${bucket.base}/${key}`, { method, headers });
  if (upstream.status === 304) return new Response(null, { status: 304, headers: { "cache-control": "public, max-age=31536000, immutable" } });
  if (!upstream.ok) return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });

  const out = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  });
  for (const h of ["content-length", "etag", "last-modified"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(method === "HEAD" ? null : upstream.body, { status: 200, headers: out });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return serve(request, params, "GET");
}

export async function HEAD(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return serve(request, params, "HEAD");
}
