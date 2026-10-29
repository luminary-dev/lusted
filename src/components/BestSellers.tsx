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
            <p className="eyebrow">Most wanted</p>
            <h2 className="h2">
              Everyone’s <em>favourite mistake.</em>
            </h2>
          </div>
          <div className="head-side" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            <p>The six pieces that keep selling out for the same reason: nobody who wears them gets much sleep. Some get ordered twice — once to wear, once to replace the one that didn’t survive the night.</p>
            <Link className="btn btn-wine" href="/products?best=1&sort=best">
              Shop the usual suspects <ArrowRight className="arrow" />
            </Link>
          </div>
        </header>

        <div className="product-grid best-grid">
          {bestSellers.slice(0, 6).map((p, i) => (
            <div key={p.slug} data-reveal style={{ "--d": `${(i % 3) * 0.08}s` } as React.CSSProperties}>
              <ProductCard product={p} sizes="(min-width: 1460px) 430px, (min-width: 901px) 30vw, 44vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
