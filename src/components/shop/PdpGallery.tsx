"use client";

import Image from "next/image";
import { useState } from "react";
import { useColorChoice } from "@/lib/color-choice";
import { viewName, type ColorKey, type Product } from "@/lib/products";
import { Badges } from "./ProductCard";

// The product page gallery: the front view large, the other views (back, side, and up to three more photos) as small
// thumbnails underneath. Choosing a thumbnail cross-fades it into the main frame (and the main view drops down into the
// thumbnails).
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
            alt={`${product.name} — ${viewName(v.label)}`}
            fill
            preload={i === 0}
            placeholder="blur"
            sizes="(min-width: 901px) and (max-height: 834px) 300px, (min-width: 901px) calc(56.25vh - 169px), (min-width: 521px) 460px, 90vw"
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
              <button key={v.label} type="button" className="pdp-thumb" onClick={() => setActive(i)} aria-label={`Show the ${viewName(v.label)}`}>
                <Image quality={75} src={v.src} alt="" fill placeholder="blur" sizes="80px" />
                <span>{v.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
