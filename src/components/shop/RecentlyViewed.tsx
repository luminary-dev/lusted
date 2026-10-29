"use client";

import { useEffect, useState } from "react";
import { clearRecentlyViewed, recordView, useRecentlyViewed } from "@/lib/recently-viewed";
import { getProduct, type Product } from "@/lib/products";
import ProductCard from "./ProductCard";

// The product page's last row: the other pieces this shopper has opened, newest first. It records the visit too, so
// opening a piece is all it takes to land here. The list lives in the browser, so the server (and the first client
// render) draws nothing and the row appears after hydration — at the foot of the page, below the fold, where it moves
// nothing the shopper is looking at.
export default function RecentlyViewed({ slug }: { slug: string }) {
  const recent = useRecentlyViewed()
    .filter((s) => s !== slug)
    .map(getProduct)
    .filter((p): p is Product => !!p)
    .slice(0, 4); // one row of the related grid
  // the row (and the button) go once cleared, so the screen reader is told rather than left on nothing
  const [cleared, setCleared] = useState(false);

  useEffect(() => recordView(slug), [slug]);

  return (
    <>
      {recent.length > 0 && (
        <section className="recent" aria-labelledby="recent-title">
          <header className="head">
            <div>
              <p className="eyebrow" id="recent-title">
                Recently viewed
              </p>
              <h2 className="h2">
                You couldn’t keep <em>your eyes off these</em>
              </h2>
            </div>
            <button
              type="button"
              className="recent-clear"
              onClick={() => {
                clearRecentlyViewed();
                setCleared(true);
              }}
            >
              Clear the evidence<span className="sr-only"> of recently viewed pieces</span>
            </button>
          </header>
          <div className="product-grid related-grid">
            {recent.map((p) => (
              <ProductCard key={p.slug} product={p} sizes="(min-width: 1460px) 320px, (min-width: 1081px) 22vw, 44vw" />
            ))}
          </div>
        </section>
      )}
      <p className="sr-only" role="status">
        {cleared && !recent.length ? "Recently viewed pieces cleared." : ""}
      </p>
    </>
  );
}
