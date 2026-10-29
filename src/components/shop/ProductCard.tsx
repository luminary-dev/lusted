"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { bag } from "@/lib/bag";
import FavouriteButton from "./FavouriteButton";
import { allSoldOut, colors, discountPct, formatPrice, inStock, type ColorKey, type Product } from "@/lib/products";
import { Bag } from "../icons";

export function Price({ product }: { product: Product }) {
  return (
    <span className="price">
      {product.salePrice ? (
        <>
          <span className="price-now">{formatPrice(product.salePrice)}</span>
          <s className="price-was">{formatPrice(product.price)}</s>
        </>
      ) : (
        <span className="price-now">{formatPrice(product.price)}</span>
      )}
    </span>
  );
}

export function Badges({ product }: { product: Product }) {
  return (
    <div className="badges">
      {allSoldOut(product) && <span className="badge badge-gone">Sold out</span>}
      {product.salePrice && (
        <span className="badge badge-sale">−{discountPct(product)}%</span>
      )}
      {product.isNew && <span className="badge">New</span>}
      {product.bestSeller && <span className="badge">Best seller</span>}
    </div>
  );
}

// Quick add (hover, mouse only): the bottom of the photo melts into a frosted blur holding the name, a frosted
// price pill, the sizes and a solid add-to-bag button — pick a size, then add.
function QuickAdd({ product, color }: { product: Product; color: ColorKey }) {
  const oneSize = product.sizes.length === 1;
  const gone = allSoldOut(product);
  const [size, setSize] = useState<string | null>(oneSize && inStock(product, product.sizes[0]) ? product.sizes[0] : null);

  return (
    <div className="quick-add" role="group" aria-label={`Quick add ${product.name}`}>
      <p className="quick-add-name">{product.name}</p>
      <span className="quick-add-price">
        {formatPrice(product.salePrice ?? product.price)}
        {product.salePrice && <s>{formatPrice(product.price)}</s>}
      </span>
      {!oneSize && (
        <div className="quick-add-sizes">
          {product.sizes.map((s) => {
            const had = inStock(product, s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                aria-disabled={!had}
                disabled={!had}
                className={had ? "" : "is-gone"}
                onClick={() => setSize(s)}
              >
                {s}
                {!had && <span className="sr-only"> — sold out</span>}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className="quick-add-cta"
        disabled={!size || gone}
        onClick={() => size && bag.add({ slug: product.slug, size, color, qty: 1 }, { quiet: true })}
      >
        <Bag /> {gone ? "Sold out" : size ? (oneSize ? "Add to bag" : `Add to bag · ${size}`) : "Pick your size"}
      </button>
    </div>
  );
}

export default function ProductCard({
  product,
  color: initialColor,
  sizes = "(min-width: 1500px) 340px, (min-width: 901px) 23vw, 44vw",
}: {
  product: Product;
  color?: ColorKey; // start on this colourway (e.g. the colour the shop is filtered by)
  sizes?: string;
}) {
  // the swatches swap the photo to that colourway when it has been photographed
  const [color, setColor] = useState<ColorKey>(initialColor ?? product.colors[0]);
  // The link carries the colourway being looked at, so the piece opens on it instead of resetting to the first one.
  // Only when it isn't the default, to keep the common link clean and shareable.
  const href = color === product.colors[0] ? `/products/${product.slug}` : `/products/${product.slug}?colour=${color}`;
  const views = product.colorViews[color] ?? product.views;
  const front = views[0].src;
  const back = views.find((v) => v.label === "Back")?.src;
  // A finger has no hover: without these two, a touch shopper never sees the back of a piece and can't add from the
  // grid at all — on a lingerie site the back is half the product, and favourites are reached only on touch.
  const [showBack, setShowBack] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  return (
    <article className={`product-card ${back ? "has-back" : ""} ${showBack ? "shows-back" : ""} ${quickOpen ? "is-quick" : ""}`}>
      <div className="product-media">
        <Link href={href} aria-label={product.name}>
          <Image
            quality={90}
            key={`${color}-front`}
            src={front}
            alt={`${product.name} in ${colors[color].label.toLowerCase()}`}
            fill
            placeholder="blur"
            sizes={sizes}
          />
          {back && (
            <Image
              key={`${color}-back`}
              quality={90}
              src={back}
              alt=""
              fill
              sizes={sizes}
              className="product-back"
            />
          )}
        </Link>
        <Badges product={product} />
        <div className="card-touch" aria-hidden={false}>
          {back && (
            <button
              type="button"
              className="card-flip"
              aria-pressed={showBack}
              onClick={() => setShowBack((v) => !v)}
            >
              {showBack ? "Front" : "Back"}
            </button>
          )}
          {!allSoldOut(product) && (
            <button
              type="button"
              className="card-quick"
              aria-expanded={quickOpen}
              onClick={() => setQuickOpen((v) => !v)}
            >
              <Bag />
              <span className="sr-only">{quickOpen ? `Close quick add for ${product.name}` : `Quick add ${product.name}`}</span>
            </button>
          )}
        </div>
        <FavouriteButton
          slug={product.slug}
          name={product.name}
          className="card-fav"
        />
        <QuickAdd product={product} color={color} />
      </div>
      <Link href={href} className="product-info">
        <h3>{product.name}</h3>
        <Price product={product} />
      </Link>
      {product.colors.length > 1 && (
        <div className="swatches" role="group" aria-label="Colours">
          {product.colors.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${c === color ? "is-active" : ""}`}
              title={colors[c].label}
              aria-label={colors[c].label}
              aria-pressed={c === color}
              style={{ background: colors[c].hex }}
              onClick={() => setColor(c)}
              onMouseEnter={() => product.colorViews[c] && setColor(c)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
