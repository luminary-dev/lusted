// Lets the console's browser put photos straight into the bucket (src/lib/admin/r2.ts signs the addresses): sets the
// bucket's CORS rules to allow PUT from the site's addresses. Run once, and again when an address is added:
//   node --env-file=.env.local scripts/admin/bucket-cors.mjs [more origins…]
import { AwsClient } from "aws4fetch";

const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error("set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (see .env.local)");
const origins = ["https://lusted.vercel.app", "https://lusted-dev.vercel.app", "http://localhost:3000", "http://localhost:3177", "http://localhost:4010", ...process.argv.slice(2)];

const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}?cors`;
const body =
  `<?xml version="1.0" encoding="UTF-8"?><CORSConfiguration><CORSRule>` +
  origins.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join("") +
  `<AllowedMethod>PUT</AllowedMethod><AllowedHeader>content-type</AllowedHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>`;
const res = await client.fetch(url, { method: "PUT", body, headers: { "content-type": "application/xml" } });
if (!res.ok) throw new Error(`PutBucketCors: HTTP ${res.status} ${await res.text()}`);
const check = await client.fetch(url);
console.log(`CORS on ${R2_BUCKET}: PUT allowed from\n  ${origins.join("\n  ")}\n${(await check.text()).replace(/></g, ">\n<")}`);
