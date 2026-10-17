"use client";

import { useSyncExternalStore } from "react";

// The colour picked on a product page, shared between the buy box (where it's picked) and the gallery (which
// shows that colour's photos). Keyed by product; lives only for the visit.
const chosen = new Map<string, string>();
const listeners = new Set<() => void>();

export function setColorChoice(slug: string, color: string) {
  chosen.set(slug, color);
  listeners.forEach((l) => l());
}

export function useColorChoice(slug: string, fallback: string) {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => chosen.get(slug) ?? fallback,
    () => fallback,
  );
}
