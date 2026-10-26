"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { discountPct, formatPrice, priceOf, type Product } from "@/lib/products";
import { ChevronNext } from "./icons";

// A sale card that answers the pointer: it tilts towards it in 3D with a soft sheen following along, and the back
// view opens as a circle spreading out from wherever the pointer came in. (No tilt with reduced motion.)
export default function SaleCard({ product: p, tint, index }: { product: Product; tint: string; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const track = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--rx", `${((x - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((0.5 - y) * 7).toFixed(2)}deg`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <Link
      ref={ref}
      href={`/products/${p.slug}`}
      className="sale-card"
      data-reveal
      onPointerEnter={track}
      onPointerMove={track}
      onPointerLeave={reset}
      style={{ "--d": `${index * 0.08}s`, "--tint": tint } as React.CSSProperties}
    >
      <span className="sale-card-media">
        <Image quality={90} src={p.image} alt={p.name} fill placeholder="blur" sizes="(min-width: 1460px) 440px, (min-width: 761px) 30vw, 61vw" className="sale-card-img" />
        {p.backImage && <Image quality={90} src={p.backImage} alt="" fill sizes="(min-width: 1460px) 440px, (min-width: 761px) 30vw, 61vw" className="sale-card-img sale-card-back" />}
      </span>
      <span className="sale-card-sheen" aria-hidden="true" />
      <div className="sale-card-body">
        <span className="sale-card-off">−{discountPct(p)}%</span>
        <h3>{p.name}</h3>
        {p.blurb && <p className="sale-card-blurb">{p.blurb}</p>}
        <p className="sale-card-price">
          {formatPrice(priceOf(p))} <s>{formatPrice(p.price)}</s>
        </p>
        <span className="sale-card-cta">
          Shop now <ChevronNext />
        </span>
      </div>
    </Link>
  );
}
