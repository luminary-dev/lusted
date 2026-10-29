import Link from "next/link";
import { newArrivals } from "@/lib/products";
import ProductCard from "./shop/ProductCard";
import { ArrowRight } from "./icons";

// The pieces wearing the "New" badge, newest first. It reads the catalogue's dates when the page is built, so a piece
// added from the console moves in at the front (and the oldest of them drops out) with the next deploy. Two new pieces
// don't make a row worth stopping for, so below three it stays out of the way.
const MIN_PIECES = 3;

export default function NewArrivals() {
  if (newArrivals.length < MIN_PIECES) return null;
  return (
    <section id="new-in" className="section new-in">
      <div className="container">
        <header className="head">
          <div data-reveal>
            <p className="eyebrow">Just arrived</p>
            <h2 className="h2">
              New in, <em>not yet seen on you.</em>
            </h2>
          </div>
          <div className="head-side" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            <p>The latest pieces to land, newest first — be the first to be caught in them, and the first out of them.</p>
            <Link className="btn btn-wine" href="/products?new=1&sort=new">
              Shop everything new <ArrowRight className="arrow" />
            </Link>
          </div>
        </header>

        <div className="product-grid">
          {newArrivals.map((p, i) => (
            <div key={p.slug} data-reveal style={{ "--d": `${(i % 3) * 0.08}s` } as React.CSSProperties}>
              <ProductCard product={p} sizes="(min-width: 1460px) 430px, (min-width: 901px) 30vw, 44vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
