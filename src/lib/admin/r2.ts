import "server-only";

import { AwsClient } from "aws4fetch";

// The console's side of the photo bucket. The owner's photos never pass through the site's own functions (a request
// body there is capped at a few megabytes): the browser puts each one straight into the bucket on a signed address
// made here, under incoming/<upload>/<view>, and the add-product workflow picks them up from there.

export function bucket() {
  const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const base = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
  return {
    // a signed address the browser can PUT one object to, good for ten minutes
    async uploadUrl(key: string, contentType: string): Promise<string> {
      const url = new URL(`${base}/${key}`);
      url.searchParams.set("X-Amz-Expires", "600");
      const signed = await client.sign(new Request(url, { method: "PUT", headers: { "content-type": contentType } }), {
        aws: { signQuery: true, allHeaders: false },
      });
      return signed.url;
    },
    async exists(key: string): Promise<boolean> {
      const response = await client.fetch(`${base}/${key}`, { method: "HEAD" });
      return response.ok;
    },
  };
}
