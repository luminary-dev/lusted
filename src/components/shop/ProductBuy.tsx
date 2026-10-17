"use client";

import Link from "next/link";
import { useState } from "react";
import { bag } from "@/lib/bag";
import {
  colors,
  fitLabels,
  formatPrice,
  getProduct,
  priceOf,
  type ColorKey,
} from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import FavouriteButton from "./FavouriteButton";
import { Bag, WhatsApp } from "../icons";

export default function ProductBuy({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  const oneSize = product.sizes.length === 1;
  const [color, setColor] = useState<ColorKey>(product.colors[0]);
  const [size, setSize] = useState<string | null>(
    oneSize ? product.sizes[0] : null,
  );
  const [qty, setQty] = useState(1);
  const [nudge, setNudge] = useState(false);

  function requireSize() {
    if (size) return true;
    setNudge(true);
    return false;
  }

  const orderText = `Hi Lusted! I'd like to order the ${product.name} — ${colors[color].label}, size ${size}, qty ${qty} (${formatPrice(priceOf(product) * qty)}).`;

  return (
    <div className="buy">
      {/* single-colour pieces don't need a colour picker */}
      {product.colors.length > 1 && (
        <div className="buy-group">
          <p className="buy-label">
            Colour <span>{colors[color].label}</span>
          </p>
          <div className="buy-colors">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={colors[c].label}
                aria-pressed={color === c}
                className={color === c ? "is-active" : ""}
                onClick={() => setColor(c)}
              >
                <span
                  className="swatch"
                  style={{ background: colors[c].hex }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {!oneSize && (
        <div className="buy-group">
          <p className="buy-label">
            Size{" "}
            {nudge && !size && (
              <span className="buy-warn">Please choose a size</span>
            )}
            <Link href="/#size-guide">Size guide</Link>
          </p>
          <div className="size-chips">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                className={size === s ? "is-active" : ""}
                onClick={() => {
                  setSize(s);
                  setNudge(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="buy-fit">
            <span className="buy-fit-meter" data-fit={product.fit} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>{fitLabels[product.fit]}.</strong> {product.fitNote}
            </span>
          </p>
        </div>
      )}

      <div className="buy-actions">
        <div className="stepper" aria-label="Quantity">
          <button
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span>{qty}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
          >
            +
          </button>
        </div>
        <button
          className="btn btn-wine"
          onClick={() =>
            requireSize() && bag.add({ slug, size: size!, color, qty })
          }
        >
          <Bag /> Add to bag — {formatPrice(priceOf(product) * qty)}
        </button>
        <FavouriteButton slug={slug} name={product.name} className="buy-fav" />
      </div>
      <a
        className="btn btn-ghost buy-whatsapp"
        href={size ? whatsappLink(orderText) : undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!requireSize()) e.preventDefault();
        }}
      >
        <WhatsApp /> Order now on WhatsApp
      </a>
    </div>
  );
}
