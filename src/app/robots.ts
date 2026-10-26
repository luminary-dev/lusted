import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Crawl everything but the sign-up API and the visitor's own favourites list; the sitemap lists the rest.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/favourites"] },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
