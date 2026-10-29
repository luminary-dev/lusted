"use client";

import { useSyncExternalStore } from "react";
import { getProduct } from "./products";

// The pieces a shopper has opened, most recent first, kept in localStorage like the bag and favourites. Nothing here
// is sent anywhere — not even to analytics: what someone looked at on a lingerie site is theirs.

const KEY = "lusted-recently-viewed";
// enough to fill the product page's row with the current piece left out, and short enough to stay "recent"
const MAX = 8;
const EMPTY: string[] = [];
let slugs: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    // a piece that has left the catalogue (or a hand-edited entry) drops out rather than leaving a hole in the row
    slugs = Array.isArray(saved) ? [...new Set(saved.filter((s) => typeof s === "string" && getProduct(s)))].slice(0, MAX) : EMPTY;
  } catch {
    slugs = EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  read();
  // another tab opened a piece or cleared the list: pick it up (registered once — load() only ever runs its body once)
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY && e.key !== null) return; // null: the whole of localStorage was cleared
    read();
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function save(next: string[]) {
  slugs = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  emit();
}

export function recordView(slug: string) {
  load();
  if (slugs[0] === slug || !getProduct(slug)) return; // already at the front: nothing to write, nothing to re-render
  save([slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX));
}

export function clearRecentlyViewed() {
  load();
  save(EMPTY);
}

// The server has no history, so it (and the first client render, which must match it) sees an empty list; the saved
// one arrives straight after hydration.
export const useRecentlyViewed = () =>
  useSyncExternalStore(
    subscribe,
    () => (load(), slugs),
    () => EMPTY,
  );
