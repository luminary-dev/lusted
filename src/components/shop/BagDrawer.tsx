"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bag, useBag, useBagOpen } from "@/lib/bag";
import { bestSellers, colors, formatPrice, getProduct, priceOf } from "@/lib/products";
import { fillIn, newOrderRef, productUrl, useOrderRef, useOrigin } from "@/lib/order";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Close, WhatsApp } from "../icons";
import { useFavourites } from "@/lib/favourites";
import TrustStrip from "./TrustStrip";

export default function BagDrawer() {
  const open = useBagOpen();
  const { items, count, subtotal } = useBag();

  const closeBtn = useRef<HTMLButtonElement>(null);
  const origin = useOrigin();
  // one reference for the visit, so an order sent again after a change still matches the first message; clearing the
  // bag starts a new one
  const ref = useOrderRef();
  // the gift option only shapes this message — it isn't saved with the bag
  const [gift, setGift] = useState(false);
  const [note, setNote] = useState("");
  // "Clear bag" sits under the send button with nothing between a thumb and an empty bag, so it asks once
  const [confirmClear, setConfirmClear] = useState(false);
  const saved = useFavourites();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && bag.setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    // focus moves into the bag as it opens and back to whatever opened it when it closes
    const opener = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeBtn.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  const order = [
    `Order ${ref}`,
    "Hi Lusted! I'd like to order:",
    "",
    ...items.flatMap((i) => {
      const p = getProduct(i.slug)!;
      return [
        `• ${p.name} — ${colors[i.color].label}, size ${i.size} × ${i.qty} (${formatPrice(priceOf(p) * i.qty)})`,
        productUrl(origin, p.slug),
      ];
    }),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    ...(gift ? [note.trim() ? `It's a gift — note: ${note.trim()}` : "It's a gift."] : []),
    ...fillIn,
  ].join("\n");

  return (
    <div className={`drawer-root ${open ? "is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <div className="drawer-scrim" onClick={() => bag.setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your bag">
        <header className="drawer-head">
          <h2 className="h3">Your bag of tricks {count > 0 && <span>({count})</span>}</h2>
          <button ref={closeBtn} className="icon-btn" aria-label="Close bag" onClick={() => bag.setOpen(false)}>
            <Close />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Your bag is empty. Nothing to take off yet.</p>
            <Link href="/products" className="btn btn-wine" onClick={() => bag.setOpen(false)}>
              Shop, shamelessly <ArrowRight className="arrow" />
            </Link>
            {(() => {
              // the pieces they already said yes to come first; failing that, what everyone else is buying
              const suggestions = (saved.length ? saved.map(getProduct).filter((p) => !!p) : bestSellers).slice(0, 4);
              if (!suggestions.length) return null;
              return (
                <div className="drawer-suggest">
                  <p className="drawer-suggest-head">{saved.length ? "Still wanting these?" : "What everyone’s getting into"}</p>
                  <ul>
                    {suggestions.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/products/${p.slug}`} onClick={() => bag.setOpen(false)}>
                          <span className="drawer-suggest-media">
                            <Image src={p.image} alt="" fill sizes="80px" />
                          </span>
                          <span className="drawer-suggest-name">{p.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            <ul className="bag-list">
              {items.map((i) => {
                const p = getProduct(i.slug)!;
                return (
                  <li key={`${i.slug}-${i.size}-${i.color}`} className="bag-item">
                    <Link href={`/products/${p.slug}`} className="bag-thumb" onClick={() => bag.setOpen(false)}>
                      <Image src={p.colorViews[i.color]?.[0]?.src ?? p.image} alt={p.name} fill sizes="88px" />
                    </Link>
                    <div className="bag-body">
                      <Link href={`/products/${p.slug}`} onClick={() => bag.setOpen(false)}>
                        {p.name}
                      </Link>
                      <span className="bag-meta">
                        {colors[i.color].label}
                        {p.sizes.length > 1 ? (
                          <label className="bag-size">
                            <span className="sr-only">Size for {p.name}</span>
                            <select
                              value={i.size}
                              onChange={(e) => bag.changeSize(i, e.currentTarget.value)}
                            >
                              {p.sizes.map((sz) => (
                                <option key={sz} value={sz}>
                                  {sz}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <> · {i.size}</>
                        )}
                      </span>
                      <div className="bag-row">
                        <div className="stepper" aria-label="Quantity">
                          <button aria-label="Decrease quantity" onClick={() => bag.setQty(i, i.qty - 1)}>
                            −
                          </button>
                          <span>{i.qty}</span>
                          <button aria-label="Increase quantity" onClick={() => bag.setQty(i, i.qty + 1)}>
                            +
                          </button>
                        </div>
                        <strong className="bag-price">
                          {/* the price paid stays its own element: the struck-through one sits beside it, and
                              nothing reading this line should have to guess which number is which */}
                          <span className="bag-price-now">{formatPrice(priceOf(p) * i.qty)}</span>
                          {p.salePrice && <s>{formatPrice(p.price * i.qty)}</s>}
                        </strong>
                      </div>
                    </div>
                    <button className="bag-remove" aria-label={`Remove ${p.name}`} onClick={() => bag.remove(i)}>
                      <Close />
                    </button>
                  </li>
                );
              })}
            </ul>
            <footer className="drawer-foot">
              <div className="drawer-total">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="bag-gift">
                <label className="check">
                  <input type="checkbox" checked={gift} onChange={(e) => setGift(e.currentTarget.checked)} />
                  <span>This is a gift — lucky them</span>
                </label>
                {gift && (
                  <label className="bag-gift-note">
                    <span>Gift note (optional)</span>
                    <input type="text" maxLength={120} value={note} onChange={(e) => setNote(e.currentTarget.value)} />
                  </label>
                )}
              </div>
              <p>We’ll confirm sizes, delivery and secure payment with you on WhatsApp — discreetly, promise.</p>
              <a className="btn btn-wine" data-wa-source="bag" href={whatsappLink(order)} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> Send order on WhatsApp
              </a>
              <TrustStrip onNavigate={() => bag.setOpen(false)} />
              <button
                className={`drawer-clear ${confirmClear ? "is-confirming" : ""}`}
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    return;
                  }
                  bag.clear();
                  newOrderRef();
                  setGift(false);
                  setNote("");
                  setConfirmClear(false);
                }}
                onBlur={() => setConfirmClear(false)}
              >
                {confirmClear ? "Really? Tap again to empty the bag" : "Clear bag"}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
