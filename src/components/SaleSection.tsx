import Link from "next/link";
import { maxDiscount, onSale, type ColorKey } from "@/lib/products";
import { ArrowRight } from "./icons";
import SaleCard from "./SaleCard";

// Each card is tinted to its piece: the fade behind the text, the button glass and the glow beneath all take its colour.
const TINT: Record<ColorKey, string> = {
  ivory: "#86705c",
  blush: "#9b5d66",
  wine: "#6b1430",
  black: "#241a1c",
  champagne: "#8b6a35",
  mocha: "#5a3d31",
  lilac: "#6e5a8c",
  aqua: "#3f7f82",
};

export default function SaleSection() {
  // nothing on sale: no band (rather than "Now -Infinity% off")
  if (!onSale.length) return null;
  return (
    <section id="sale" className="section sale">
      <div className="container">
        <header className="head">
          <div data-reveal>
            <p className="eyebrow">The Bikini Sale</p>
            <h2 className="h2">
              Barely there. <em>Now {maxDiscount}% off.</em>
            </h2>
          </div>
          <div className="head-side" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            <p>
              Less fabric, less to pay, nothing left to hide behind. Consider it permission to show them everything —
              while your size lasts.
            </p>
            <Link className="btn btn-wine" href="/products?sale=1">
              Shop the bikini sale <ArrowRight className="arrow" />
            </Link>
          </div>
        </header>

        <div className="sale-products">
          {onSale.slice(0, 4).map((p, i) => (
            <SaleCard key={p.slug} product={p} tint={TINT[p.colors[0]]} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
