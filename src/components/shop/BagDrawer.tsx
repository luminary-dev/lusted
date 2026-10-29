"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bag, useBag, useBagOpen } from "@/lib/bag";
import { colors, formatPrice, getProduct, priceOf } from "@/lib/products";
import { fillIn, newOrderRef, productUrl, useOrderRef, useOrigin } from "@/lib/order";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Close, WhatsApp } from "../icons";

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
          <h2 className="h3">Your bag {count > 0 && <span>({count})</span>}</h2>
          <button ref={closeBtn} className="icon-btn" aria-label="Close bag" onClick={() => bag.setOpen(false)}>
            <Close />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Your bag is empty.</p>
            <Link href="/products" className="btn btn-wine" onClick={() => bag.setOpen(false)}>
              Browse the shop <ArrowRight className="arrow" />
            </Link>
          </div>
        ) : (
          <>
            <ul className="bag-list">
              {items.map((i) => {
                const p = getProduct(i.slug)!;
                return (
                  <li key={`${i.slug}-${i.size}-${i.color}`} className="bag-item">
                    <Link href={`/products/${p.slug}`} className="bag-thumb" onClick={() => bag.setOpen(false)}>
                      <Image src={p.image} alt={p.name} fill sizes="88px" />
                    </Link>
                    <div className="bag-body">
                      <Link href={`/products/${p.slug}`} onClick={() => bag.setOpen(false)}>
                        {p.name}
                      </Link>
                      <span>
                        {colors[i.color].label} · {i.size}
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
                        <strong>{formatPrice(priceOf(p) * i.qty)}</strong>
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
                  <span>This is a gift</span>
                </label>
                {gift && (
                  <label className="bag-gift-note">
                    <span>Gift note (optional)</span>
                    <input type="text" maxLength={120} value={note} onChange={(e) => setNote(e.currentTarget.value)} />
                  </label>
                )}
              </div>
              <p>We’ll confirm sizes, delivery and secure payment with you on WhatsApp. Always shipped in plain packaging.</p>
              <a className="btn btn-wine" href={whatsappLink(order)} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> Send order on WhatsApp
              </a>
              <button
                className="drawer-clear"
                onClick={() => {
                  bag.clear();
                  newOrderRef();
                  setGift(false);
                  setNote("");
                }}
              >
                Clear bag
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
