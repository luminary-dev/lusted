// The site's public address, for the absolute URLs in metadata, the sitemap and robots.txt (server-side only). On
// Vercel it is the production domain — a custom domain as soon as one is added — and the vercel.app address elsewhere.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "lusted.vercel.app";
export const siteUrl = new URL(`https://${host}`);
