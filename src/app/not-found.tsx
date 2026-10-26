import type { Metadata } from "next";
import Link from "next/link";
import StatusPage from "@/components/StatusPage";
import { ArrowRight } from "@/components/icons";
import { categories } from "@/lib/products";

export const metadata: Metadata = {
  title: "Nothing on here — Lusted",
};

// Any address that isn't a page — and any piece no longer in the catalogue (src/proxy.ts sends those here with a 404).
// The one page where the site is allowed to be as forward as it likes: whoever lands here was looking for something.
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      eyebrow="Page not found · nothing on underneath"
      title={
        <>
          Caught you looking, <em>you naughty thing.</em>
        </>
      }
      lede="There’s nothing under this one — we took it all off and left the door open. Whatever you came here wanting, we have something wickeder: lace that doesn’t stay on, strings that barely try, and dresses for nights that end in someone else’s sheets. Come and get undressed."
      actions={
        <>
          <Link href="/products" className="btn btn-wine">
            Show me everything <ArrowRight className="arrow" />
          </Link>
          <Link href="/" className="btn btn-ghost">
            Take me back to bed
          </Link>
        </>
      }
      links={
        <>
          {categories.map((c) => (
            <Link key={c.key} href={`/products?cat=${c.key}`}>
              {c.name}
            </Link>
          ))}
          <Link href="/products?sale=1">Less fabric, less to pay</Link>
        </>
      }
    />
  );
}
