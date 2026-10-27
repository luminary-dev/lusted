// Lets the console's browser put photos straight into the bucket (src/lib/admin/r2.ts signs the addresses): sets the
// bucket's CORS rules to allow PUT from the site's addresses. Run once, and again when an address is added:
//   node --env-file=.env.local scripts/admin/bucket-cors.mjs [more origins…]
// Bucket settings need more than the object keys the site runs with. With CLOUDFLARE_API_TOKEN in the environment
// (an API token with "Workers R2 Storage: Edit" on the account) the rules go through Cloudflare's API; without it the
// S3 route is tried with the R2_* keys, which works only if that key pair was made with admin rights. If neither can,
// the rules are printed to paste into the dashboard: R2 → the bucket → Settings → CORS policy.
import { AwsClient } from "aws4fetch";

const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_API_TOKEN } = process.env;
if (!R2_ACCOUNT_ID || !R2_BUCKET) throw new Error("set R2_ACCOUNT_ID and R2_BUCKET (see .env.local)");
const origins = ["https://lusted.vercel.app", "https://lusted-dev.vercel.app", "http://localhost:3000", "http://localhost:3177", "http://localhost:4010", ...process.argv.slice(2)];
const rules = [{ allowed: { origins, methods: ["PUT"], headers: ["content-type"] }, maxAgeSeconds: 3600 }];
const dashboard = JSON.stringify(rules.map((r) => ({ AllowedOrigins: r.allowed.origins, AllowedMethods: r.allowed.methods, AllowedHeaders: r.allowed.headers, MaxAgeSeconds: r.maxAgeSeconds })), null, 2);

if (CLOUDFLARE_API_TOKEN) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/cors`;
  const headers = { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" };
  const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify({ rules }) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    console.error(`Cloudflare API: HTTP ${res.status} ${JSON.stringify(body.errors ?? body)}\n\nPaste this in the dashboard instead (R2 → ${R2_BUCKET} → Settings → CORS policy):\n${dashboard}`);
    process.exit(1);
  }
  const check = await (await fetch(url, { headers })).json();
  console.log(`CORS on ${R2_BUCKET} (through Cloudflare's API):\n${JSON.stringify(check.result?.rules ?? check, null, 2)}`);
} else {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error("set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY, or CLOUDFLARE_API_TOKEN");
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}?cors`;
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?><CORSConfiguration><CORSRule>` +
    origins.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join("") +
    `<AllowedMethod>PUT</AllowedMethod><AllowedHeader>content-type</AllowedHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>`;
  const res = await client.fetch(url, { method: "PUT", body: xml, headers: { "content-type": "application/xml" } });
  if (!res.ok) {
    console.error(
      `S3 PutBucketCors: HTTP ${res.status} — the R2_* key pair can't change bucket settings.\n` +
        `Either set CLOUDFLARE_API_TOKEN (an API token with "Workers R2 Storage: Edit") and run this again, or paste this in the dashboard (R2 → ${R2_BUCKET} → Settings → CORS policy):\n${dashboard}`,
    );
    process.exit(1);
  }
  const check = await client.fetch(url);
  console.log(`CORS on ${R2_BUCKET}: PUT allowed from\n  ${origins.join("\n  ")}\n${(await check.text()).replace(/></g, ">\n<")}`);
}
