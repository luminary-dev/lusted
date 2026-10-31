"use client";

import { useEffect } from "react";
import { bag, useBagAdded, useBagRemoved } from "@/lib/bag";
import { colors, getProduct } from "@/lib/products";

const LIFE_MS = 6000;

// What the shop says instead of throwing the bag drawer over the grid: a line that stays out of the way, confirms
// what went in, and offers the one thing a shopper might want next — the bag, or their removal back.
export default function BagToast() {
  const added = useBagAdded();
  const removed = useBagRemoved();
  const notice = removed ?? added;
  const kind = removed ? "removed" : "added";

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => (removed ? bag.dismissRemoved() : bag.dismissAdded()), LIFE_MS);
    return () => clearTimeout(t);
  }, [notice, removed]);

  if (!notice) return null;
  const product = getProduct(notice.item.slug);
  if (!product) return null;

  return (
    // polite, not assertive: it confirms something the shopper just did, so it mustn't cut across what they're reading
    <div className="bag-toast" role="status" aria-live="polite">
      <p className="bag-toast-text">
        <strong>{product.name}</strong>
        <span>
          {colors[notice.item.color].label} · {notice.item.size}
          {kind === "removed" ? " · removed" : ""}
        </span>
      </p>
      {kind === "removed" ? (
        <button type="button" className="bag-toast-action" onClick={() => bag.undoRemove()}>
          Undo
        </button>
      ) : (
        <button
          type="button"
          className="bag-toast-action"
          onClick={() => {
            bag.dismissAdded();
            bag.setOpen(true);
          }}
        >
          Peek in the bag
        </button>
      )}
      <button
        type="button"
        className="bag-toast-close"
        aria-label="Dismiss"
        onClick={() => (kind === "removed" ? bag.dismissRemoved() : bag.dismissAdded())}
      >
        ×
      </button>
    </div>
  );
}
