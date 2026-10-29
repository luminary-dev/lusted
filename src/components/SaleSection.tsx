import Link from "next/link";
import { collectionName, discountPct, onSale, type ColorKey } from "@/lib/products";
import { saleBand } from "@/lib/sale-band";
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
  const band = saleBand(onSale.map((p) => ({ category: p.category, discount: discountPct(p) })), collectionName);
  if (!band) return null;
  return (
    <section id="sale" className="section sale">
      <div className="container">
        <header className="head">
          <div data-reveal>
            <p className="eyebrow">{band.eyebrow}</p>
            <h2 className="h2">
              {band.lead} <em>{band.offer}</em>
            </h2>
          </div>
          <div className="head-side" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            <p>{band.body}</p>
            <Link className="btn btn-wine" href={band.href}>
              {band.cta} <ArrowRight className="arrow" />
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
