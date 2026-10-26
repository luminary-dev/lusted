import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { siteUrl } from "@/lib/site-url";

// Every page worth finding: the home page, the shop, each piece, delivery & returns, about and the two policies. Favourites (personal) and
// the reveal page (a teaser) are left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/products"), changeFrequency: "weekly", priority: 0.9 },
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), lastModified: p.added, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: url("/help"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/about"), changeFrequency: "yearly", priority: 0.5 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
