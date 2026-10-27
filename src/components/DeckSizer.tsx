"use client";

import { useEffect } from "react";

// The help page's deck of cards: every card after the opener waits at the bottom of the screen showing only a strip of
// its top, and scrolls up into place in turn (globals.css, .help-card — position: sticky with a negative `bottom`). How
// far a card may hang below the screen is its own height less the strip, so each card gets its measured height as
// --h, kept up to date as answers open and close. Without this (before hydration) --h is enormous and nothing sticks:
// the cards simply follow each other down the page.
export default function DeckSizer() {
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".help-card[data-deck]"));
    if (!cards.length || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) (e.target as HTMLElement).style.setProperty("--h", `${e.target.getBoundingClientRect().height}px`);
    });
    for (const c of cards) ro.observe(c);
    return () => ro.disconnect();
  }, []);
  return null;
}
