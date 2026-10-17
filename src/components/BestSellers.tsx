import Link from "next/link";
import { bestSellers } from "@/lib/products";
import ProductCard from "./shop/ProductCard";
import { ArrowRight } from "./icons";

export default function BestSellers() {
  return (
    <section id="best-sellers" className="section best">
      <div className="container">
        <header className="head">
          <div data-reveal>
            <p className="eyebrow">Best sellers</p>
            <h2 className="h2">
              Most loved, <em>most worn.</em>
            </h2>
          </div>
          <div className="head-side" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            <p>The six pieces our customers come back for again and again.</p>
            <Link className="btn btn-wine" href="/products?best=1&sort=best">
              Shop all best sellers <ArrowRight className="arrow" />
            </Link>
          </div>
        </header>

        <div className="product-grid best-grid">
          {bestSellers.slice(0, 6).map((p, i) => (
            <div key={p.slug} data-reveal style={{ "--d": `${(i % 3) * 0.08}s` } as React.CSSProperties}>
              <ProductCard product={p} sizes="(min-width: 900px) 30vw, 50vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
