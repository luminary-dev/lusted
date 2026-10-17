"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { bag } from "@/lib/bag";
import FavouriteButton from "./FavouriteButton";
import { colors, discountPct, formatPrice, type Product } from "@/lib/products";
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
function QuickAdd({ product }: { product: Product }) {
  const oneSize = product.sizes.length === 1;
  const [size, setSize] = useState<string | null>(oneSize ? product.sizes[0] : null);

  return (
    <div className="quick-add" role="group" aria-label={`Quick add ${product.name}`}>
      <p className="quick-add-name">{product.name}</p>
      <span className="quick-add-price">
        {formatPrice(product.salePrice ?? product.price)}
        {product.salePrice && <s>{formatPrice(product.price)}</s>}
      </span>
      {!oneSize && (
        <div className="quick-add-sizes">
          {product.sizes.map((s) => (
            <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="quick-add-cta"
        disabled={!size}
        onClick={() => size && bag.add({ slug: product.slug, size, color: product.colors[0], qty: 1 })}
      >
        <Bag /> {size ? (oneSize ? "Add to bag" : `Add to bag · ${size}`) : "Pick your size"}
      </button>
    </div>
  );
}

export default function ProductCard({
  product,
  sizes = "(min-width: 1080px) 24vw, (min-width: 700px) 32vw, 50vw",
}: {
  product: Product;
  sizes?: string;
}) {
  const href = `/products/${product.slug}`;
  return (
    <article className={`product-card ${product.backImage ? "has-back" : ""}`}>
      <div className="product-media">
        <Link href={href} aria-label={product.name}>
          <Image
            quality={90}
            src={product.image}
            alt={product.name}
            fill
            placeholder="blur"
            sizes={sizes}
          />
          {product.backImage && (
            <Image
              quality={90}
              src={product.backImage}
              alt=""
              fill
              sizes={sizes}
              className="product-back"
            />
          )}
        </Link>
        <Badges product={product} />
        <FavouriteButton
          slug={product.slug}
          name={product.name}
          className="card-fav"
        />
        <QuickAdd product={product} />
      </div>
      <Link href={href} className="product-info">
        <h3>{product.name}</h3>
        <Price product={product} />
      </Link>
      {product.colors.length > 1 && (
        <div className="swatches" aria-label="Colours">
          {product.colors.map((c) => (
            <span
              key={c}
              className="swatch"
              title={colors[c].label}
              style={{ background: colors[c].hex }}
            />
          ))}
        </div>
      )}
    </article>
  );
}
