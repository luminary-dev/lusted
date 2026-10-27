import type { Metadata } from "next";
import { Suspense } from "react";
import ProductBrowser from "@/components/shop/ProductBrowser";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop all — Lusted",
  description: "Every Lusted piece — lingerie, swim and after dark, all of it made to come off. Search, filter by size, colour and price, and order so quietly on WhatsApp that no one knows.",
  alternates: { canonical: "/products" }, // every filtered, searched or paged view is the same shop
};

export default function ProductsPage() {
  return (
    <main className="shop">
      <div className="container">
        <header className="shop-head">
          <p className="eyebrow">Everything, off the hanger</p>
          <h1 className="h2">
            Every piece, <em>waiting to come off.</em>
          </h1>
          <p className="lede">{products.length} pieces across lingerie, swim and after dark — filter by size, colour and price, then pick what you want to be found in.</p>
        </header>
        {/* useSearchParams needs a Suspense boundary; the fallback is the unfiltered grid skeleton. */}
        <Suspense fallback={<div className="shop-loading" />}>
          <ProductBrowser />
        </Suspense>
      </div>
    </main>
  );
}
