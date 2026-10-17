"use client";

import Image from "next/image";
import { useState } from "react";
import { useColorChoice } from "@/lib/color-choice";
import type { ColorKey, Product } from "@/lib/products";
import { Badges } from "./ProductCard";

// The product page gallery: the front view large, the other views as small thumbnails underneath. Choosing a
// thumbnail cross-fades it into the main frame (and the main view drops down into the thumbnails).
export default function PdpGallery({ product }: { product: Product }) {
  // the picked colour's photos when that colour has been photographed, otherwise the main colour's
  const color = useColorChoice(product.slug, product.colors[0]) as ColorKey;
  const views = product.colorViews[color] ?? product.views;
  const [active, setActive] = useState(0);
  const [shownColor, setShownColor] = useState(color);
  if (shownColor !== color) {
    setShownColor(color); // a new colour starts on its front view
    setActive(0);
  }

  return (
    <div className="pdp-gallery">
      <div className="pdp-main media">
        {views.map((v, i) => (
          <Image
            key={v.label}
            quality={90}
            src={v.src}
            alt={`${product.name} — ${v.label.toLowerCase()} view`}
            fill
            preload={i === 0}
            placeholder="blur"
            sizes="(min-width: 900px) 40vw, 100vw"
            className={`pdp-main-img ${i === active ? "is-active" : ""}`}
            aria-hidden={i !== active}
          />
        ))}
        <Badges product={product} />
        {views.length > 1 && (
          <span className="pdp-view" key={active}>
            {views[active].label}
          </span>
        )}
      </div>

      {views.length > 1 && (
        <div className="pdp-thumbs" role="group" aria-label="More views">
          {views.map((v, i) =>
            i === active ? null : (
              <button key={v.label} type="button" className="pdp-thumb" onClick={() => setActive(i)} aria-label={`Show the ${v.label.toLowerCase()} view`}>
                <Image quality={80} src={v.src} alt="" fill placeholder="blur" sizes="120px" />
                <span>{v.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
