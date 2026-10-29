"use client";

import { useSyncExternalStore } from "react";
import { trackEvent } from "./analytics";
import { getProduct, priceOf, type ColorKey } from "./products";

// Shopping bag kept in localStorage. Orders are sent to the shop as a WhatsApp message.

export type BagItem = { slug: string; size: string; color: ColorKey; qty: number };

const KEY = "lusted-bag";
const EMPTY: BagItem[] = [];
let items: BagItem[] = EMPTY;
let loaded = false;
let open = false;
// The last line added from a card and the last one removed anywhere — what the toast shows, and what "Undo" puts
// back. Both are one-deep on purpose: a shopper only ever means the thing they just did.
let added: { item: BagItem; at: number } | null = null;
let removed: { item: BagItem; at: number } | null = null;
const listeners = new Set<() => void>();

// A saved line is only kept if it still makes sense against today's catalogue: the piece exists and still comes in
// that size and colour, with a whole quantity of 1–10. Anything else (a renamed colour, a stale or hand-edited entry)
// would otherwise break the bag drawer — which is on every page.
const valid = (i: unknown): i is BagItem => {
  if (!i || typeof i !== "object") return false;
  const { slug, size, color, qty } = i as Record<string, unknown>;
  const p = typeof slug === "string" ? getProduct(slug) : undefined;
  return !!p && p.sizes.includes(size as string) && p.colors.includes(color as ColorKey) && Number.isInteger(qty) && (qty as number) >= 1 && (qty as number) <= 10;
};

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    items = Array.isArray(saved) ? saved.filter(valid) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  read();
  // another tab changed the bag: pick it up (registered once — load() only ever runs its body once)
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    read();
    emit();
  });
}

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function save(next: BagItem[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  emit();
}

const same = (a: BagItem, b: Omit<BagItem, "qty">) => a.slug === b.slug && a.size === b.size && a.color === b.color;

export const bag = {
  // `quiet` is how a product card adds: opening the drawer over the grid interrupts anyone building a set, so the
  // card only announces the line (BagToast) and leaves them browsing. The product page and the nav keep the drawer.
  add(item: BagItem, opts: { quiet?: boolean } = {}) {
    load();
    const existing = items.find((i) => same(i, item));
    save(existing ? items.map((i) => (same(i, item) ? { ...i, qty: Math.min(i.qty + item.qty, 10) } : i)) : [...items, item]);
    if (opts.quiet) {
      added = { item, at: Date.now() };
      emit();
    } else {
      bag.setOpen(true);
    }
    trackEvent("add_to_bag", { slug: item.slug });
  },
  dismissAdded() {
    added = null;
    emit();
  },
  setQty(item: BagItem, qty: number) {
    save(qty <= 0 ? items.filter((i) => !same(i, item)) : items.map((i) => (same(i, item) ? { ...i, qty: Math.min(qty, 10) } : i)));
  },
  remove(item: BagItem) {
    const line = items.find((i) => same(i, item));
    save(items.filter((i) => !same(i, item)));
    if (line) {
      removed = { item: line, at: Date.now() };
      emit();
    }
  },
  // Puts the line back exactly as it was, quantity included — a mis-tap on a 28px button shouldn't cost a re-pick.
  undoRemove() {
    if (!removed) return;
    const line = removed.item;
    removed = null;
    load();
    save(items.find((i) => same(i, line)) ? items.map((i) => (same(i, line) ? { ...i, qty: Math.min(i.qty + line.qty, 10) } : i)) : [...items, line]);
  },
  dismissRemoved() {
    removed = null;
    emit();
  },
  clear: () => save([]),
  setOpen(next: boolean) {
    open = next;
    emit();
  },
};

export function useBag() {
  const list = useSyncExternalStore(
    subscribe,
    () => (load(), items),
    () => EMPTY,
  );
  // pieces that have left the catalogue drop out of a saved bag quietly
  const live = list.filter((i) => getProduct(i.slug));
  const count = live.reduce((n, i) => n + i.qty, 0);
  const subtotal = live.reduce((n, i) => n + i.qty * priceOf(getProduct(i.slug)!), 0);
  return { items: live, count, subtotal };
}

// The one-deep add/remove notices, for the toast.
export const useBagAdded = () =>
  useSyncExternalStore(
    subscribe,
    () => added,
    () => null,
  );

export const useBagRemoved = () =>
  useSyncExternalStore(
    subscribe,
    () => removed,
    () => null,
  );

export const useBagOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
