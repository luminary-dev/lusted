"use client";

import { useSyncExternalStore } from "react";

// Pieces shared by the two WhatsApp order messages (the bag's and the product page's "Order now"), so the shop can
// quote delivery from the first message and match a chat to the pieces in it — and the product page's ask for a
// sold-out size.

// A short reference for a bag order, e.g. "LST-7K3QF" — random, so it carries nothing about the shopper. Letters and
// digits that read alike (0/O, 1/I/L) are left out so it can be read back over the phone.
const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function orderRef() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return `LST-${Array.from(bytes, (b) => REF_CHARS[b % REF_CHARS.length]).join("")}`;
}

// The bag's reference for this visit, kept in the browser only: it's made the first time it's asked for there, and is
// empty while the server prerenders (Next refuses random values during a prerender, and the bag is on every page), so
// the server's HTML and the first client render agree. `newOrderRef` starts a fresh one when the bag is cleared.
let current = "";
const refListeners = new Set<() => void>();
export const useOrderRef = () =>
  useSyncExternalStore(
    (l) => (refListeners.add(l), () => refListeners.delete(l)),
    () => (current ||= orderRef()),
    () => "",
  );
export function newOrderRef() {
  current = orderRef();
  refListeners.forEach((l) => l());
}

// The site's own address in the visitor's browser, for links in the message that open wherever the order came from.
// Empty while rendering on the server and during hydration (there's no window there), so the server's HTML and the
// first client render agree; the links become absolute straight after.
const noop = () => () => {};
export const useOrigin = () =>
  useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );

export const productUrl = (origin: string, slug: string) => `${origin}/products/${slug}`;

// Left blank at the end of the message for the shopper to fill in; the address and payment are settled in the chat.
export const fillIn = ["", "Name:", "City / town:"];

// The message from a product page when the size picked, or the whole piece, is sold out: the piece, its colour and
// size and its link, so the shop knows exactly what to come back with. No name or town to fill in — nothing is being
// ordered yet, and the chat itself is how the shop finds the shopper again. `size` is null for a one-size piece, or
// when every size is gone and none was picked.
export function backInStockText({ name, colour, size, url }: { name: string; colour: string; size: string | null; url: string }) {
  return [
    `Hi Lusted! The ${name} — ${colour}${size ? `, size ${size}` : ""} — is sold out just now.`,
    url,
    `Please message me when it's back${size ? ` in ${size}` : ""}.`,
  ].join("\n");
}
