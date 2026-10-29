"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { setColorChoice } from "@/lib/color-choice";
import { bag } from "@/lib/bag";
import {
  colors,
  fitLabels,
  formatPrice,
  getProduct,
  inStock,
  priceOf,
  soldOutPick,
  type ColorKey,
} from "@/lib/products";
import { trackEvent } from "@/lib/analytics";
import { backInStockText, fillIn, productUrl, useOrigin } from "@/lib/order";
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
    oneSize && inStock(product, product.sizes[0]) ? product.sizes[0] : null,
  );
  const [qty, setQty] = useState(1);
  const [nudge, setNudge] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const sizeGroup = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  // On a phone the 9:16 photo puts the price and the button a screenful down. The bar carries them within reach,
  // and only appears once the real button has scrolled out of sight, so it never doubles up.
  const [barShown, setBarShown] = useState(false);
  useEffect(() => {
    const el = actions.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setBarShown(!e.isIntersecting), { rootMargin: "0px 0px -8px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  // the size picked is sold out (or the whole piece is, before one is picked): the button asks the shop to say when
  // it's back instead of adding it
  const asking = soldOutPick(product, size);

  const origin = useOrigin();
  const orderText = [
    `Hi Lusted! I'd like to order the ${product.name} — ${colors[color].label}, size ${size}, qty ${qty} (${formatPrice(priceOf(product) * qty)}).`,
    productUrl(origin, slug),
    ...fillIn,
  ].join("\n");
  // One link, in two places (beside the price and in the phone's bar). `data-wa-source` names it in the WhatsApp
  // count (SiteAnalytics.tsx); its own event says which piece and size were asked for, so the shop knows what to bring
  // back first.
  const askLink = (
    <a
      className="btn btn-wine buy-ask"
      data-wa-source="back-in-stock"
      href={whatsappLink(
        backInStockText({ name: product.name, colour: colors[color].label, size: oneSize ? null : size, url: productUrl(origin, slug) }),
      )}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("back_in_stock_ask", { slug, size: size ?? "any" })}
    >
      <WhatsApp /> Message me when it&rsquo;s back
    </a>
  );

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
            {product.sizes.map((s) => {
              const had = inStock(product, s);
              // a sold-out size stays pickable, so a shopper can ask for it back; it's struck through and named as
              // sold out, and picking it turns the button into that ask
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  title={had ? undefined : `${s} is sold out`}
                  className={`${size === s ? "is-active" : ""} ${had ? "" : "is-gone"}`}
                  onClick={() => pickSize(s)}
                >
                  {s}
                  {!had && <span className="sr-only"> — sold out</span>}
                </button>
              );
            })}
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
            {/* the photographs are on a model, and this is what makes them readable as a size */}
            {product.modelNote && <span className="buy-model">{product.modelNote}</span>}
          </span>
        </p>
      </div>

      <div className="buy-actions" ref={actions}>
        {/* nothing is being ordered while asking, so there's no quantity to choose */}
        {!asking && (
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
        )}
        {asking ? (
          askLink
        ) : (
          <button
            className="btn btn-wine"
            onClick={() =>
              requireSize() && bag.add({ slug, size: size!, color, qty })
            }
          >
            <Bag /> Add to bag — {formatPrice(priceOf(product) * qty)}
          </button>
        )}
        <FavouriteButton slug={slug} name={product.name} className="buy-fav" />
      </div>
      {/* while asking, the button above is already the WhatsApp link — a second one would only order what's gone */}
      {!asking && (
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
      )}
      <TrustStrip />

      {/* aria-hidden while it's away so the same two controls aren't announced twice */}
      <div className={`buy-bar ${barShown ? "is-shown" : ""} ${asking ? "is-asking" : ""}`} aria-hidden={!barShown} inert={!barShown}>
        <div className="buy-bar-price">
          <span>{product.name}</span>
          <strong>{formatPrice(priceOf(product) * qty)}</strong>
        </div>
        {asking ? (
          askLink
        ) : (
          <button
            className="btn btn-wine"
            onClick={() => {
              if (!requireSize()) return;
              bag.add({ slug, size: size!, color, qty });
            }}
          >
            <Bag /> {size ? "Add to bag" : "Pick a size"}
          </button>
        )}
      </div>

      {guideOpen && (
        <SizeGuideDialog
          category={product.category}
          available={product.sizes}
          soldOut={product.soldOut ?? []}
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
