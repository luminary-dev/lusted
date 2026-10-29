"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { setColorChoice } from "@/lib/color-choice";
import { bag } from "@/lib/bag";
import {
  colors,
  fitLabels,
  formatPrice,
  getProduct,
  priceOf,
  type ColorKey,
} from "@/lib/products";
import { fillIn, productUrl, useOrigin } from "@/lib/order";
import { whatsappLink } from "@/lib/site";
import FavouriteButton from "./FavouriteButton";
import TrustStrip from "./TrustStrip";
import SizeGuideDialog from "./SizeGuideDialog";
import { Bag, WhatsApp } from "../icons";

// A card links to the colourway that was clicked (?colour=wine). Empty while the page is prerendered — there's no
// URL to read there — so the server's HTML and the first client render agree.
const noop = () => () => {};
const useColourParam = () =>
  useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("colour") ?? "",
    () => "",
  );

export default function ProductBuy({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  const oneSize = product.sizes.length === 1;
  // The shopper's own pick wins; until they make one the piece opens on the colourway its link asked for.
  const asked = useColourParam();
  const [picked, setPicked] = useState<ColorKey | null>(null);
  const linked = (product.colors as string[]).includes(asked) ? (asked as ColorKey) : null;
  const color = picked ?? linked ?? product.colors[0];
  const setColor = setPicked;
  useEffect(() => setColorChoice(slug, color), [slug, color]); // the gallery follows the picked colour
  const [size, setSize] = useState<string | null>(
    oneSize ? product.sizes[0] : null,
  );
  const [qty, setQty] = useState(1);
  const [nudge, setNudge] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const sizeGroup = useRef<HTMLDivElement>(null);

  // Asking for a size has to be noticed: the warning is announced, and the chips are brought into view and focused,
  // because on a phone they're usually scrolled off when the button is tapped.
  function requireSize() {
    if (size) return true;
    setNudge(true);
    sizeGroup.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    sizeGroup.current?.querySelector("button")?.focus();
    return false;
  }

  function pickSize(s: string) {
    setSize(s);
    setNudge(false);
  }

  const origin = useOrigin();
  const orderText = [
    `Hi Lusted! I'd like to order the ${product.name} — ${colors[color].label}, size ${size}, qty ${qty} (${formatPrice(priceOf(product) * qty)}).`,
    productUrl(origin, slug),
    ...fillIn,
  ].join("\n");

  return (
    <div className="buy">
      {/* one colourway needs no picker, but the colour still has to be named — otherwise the piece never says what
          it is, and the bag line later reads "Noir" against a photo the shopper was never told was Noir */}
      {product.colors.length === 1 && (
        <p className="buy-label buy-label-static">
          Colour <span>{colors[color].label}</span>
        </p>
      )}
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

      {/* A one-size piece has no chips to show, but the fit note and the chart are the very things its buyer needs,
          so only the chips are dropped — never the row below them. */}
      <div className="buy-group">
        <p className="buy-label">
          {oneSize ? "One size" : "Size"}{" "}
          {nudge && !size && (
            <span className="buy-warn" role="alert">
              Please choose a size
            </span>
          )}
          <button type="button" className="buy-guide" onClick={() => setGuideOpen(true)}>
            Size guide
          </button>
        </p>
        {!oneSize && (
          <div className="size-chips" ref={sizeGroup}>
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                className={size === s ? "is-active" : ""}
                onClick={() => pickSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
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
        data-wa-source="product"
        // always a real link (crawlable, reachable by keyboard); without a size the click asks for one first
        href={whatsappLink(size ? orderText : `Hi Lusted! I'd like to order the ${product.name}.`)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!requireSize()) e.preventDefault();
        }}
      >
        <WhatsApp /> Order now on WhatsApp
      </a>
      <TrustStrip />
      {guideOpen && (
        <SizeGuideDialog
          category={product.category}
          available={product.sizes}
          onPick={(s) => {
            pickSize(s);
            setGuideOpen(false);
          }}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </div>
  );
}
