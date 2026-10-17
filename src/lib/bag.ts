"use client";

import { useSyncExternalStore } from "react";
import { getProduct, priceOf, type ColorKey } from "./products";

// Shopping bag kept in localStorage. Orders are sent to the shop as a WhatsApp message.

export type BagItem = { slug: string; size: string; color: ColorKey; qty: number };

const KEY = "lusted-bag";
const EMPTY: BagItem[] = [];
let items: BagItem[] = EMPTY;
let loaded = false;
let open = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(saved)) items = saved.filter((i) => getProduct(i.slug));
  } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
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
  add(item: BagItem) {
    load();
    const existing = items.find((i) => same(i, item));
    save(existing ? items.map((i) => (same(i, item) ? { ...i, qty: Math.min(i.qty + item.qty, 10) } : i)) : [...items, item]);
    bag.setOpen(true);
  },
  setQty(item: BagItem, qty: number) {
    save(qty <= 0 ? items.filter((i) => !same(i, item)) : items.map((i) => (same(i, item) ? { ...i, qty: Math.min(qty, 10) } : i)));
  },
  remove: (item: BagItem) => save(items.filter((i) => !same(i, item))),
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

export const useBagOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
