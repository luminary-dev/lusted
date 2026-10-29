"use client";

import { useSyncExternalStore } from "react";
import { trackEvent } from "./analytics";
import { getProduct } from "./products";

// Favourites (wishlist) kept in localStorage, as a list of product slugs.

const KEY = "lusted-favourites";
const EMPTY: string[] = [];
let slugs: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    slugs = Array.isArray(saved) ? saved.filter((s) => typeof s === "string" && getProduct(s)) : EMPTY;
  } catch {
    slugs = EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  read();
  // another tab changed the favourites: pick them up (registered once — load() only ever runs its body once)
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    read();
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function toggleFavourite(slug: string) {
  load();
  const adding = !slugs.includes(slug);
  slugs = adding ? [slug, ...slugs] : slugs.filter((s) => s !== slug);
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {}
  emit();
  if (adding) trackEvent("favourite", { slug }); // saves only; taking one off isn't counted
}

export const useFavourites = () =>
  useSyncExternalStore(
    subscribe,
    () => (load(), slugs),
    () => EMPTY,
  );
