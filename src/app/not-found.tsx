import type { Metadata } from "next";
import Link from "next/link";
import StatusPage from "@/components/StatusPage";
import { ArrowRight } from "@/components/icons";
import { categories } from "@/lib/products";

export const metadata: Metadata = {
  title: "Page not found — Lusted",
};

// Any address that isn't a page — and any piece no longer in the catalogue (src/proxy.ts sends those here with a 404)
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      eyebrow="Page not found"
      title={
        <>
          This one slipped away, <em>quietly.</em>
        </>
      }
      lede="The page you’re after isn’t here — it may have sold out, moved, or never existed. Everything else is still waiting for you."
      actions={
        <>
          <Link href="/products" className="btn btn-wine">
            Shop the collection <ArrowRight className="arrow" />
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to the home page
          </Link>
        </>
      }
      links={categories.map((c) => (
        <Link key={c.key} href={`/products?cat=${c.key}`}>
          {c.name}
        </Link>
      ))}
    />
  );
}
