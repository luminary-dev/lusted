"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTrackNoResults } from "@/lib/analytics";
import { bestSellers, collectionName, matchesQuery, products } from "@/lib/products";
import { Price } from "./shop/ProductCard";
import { ArrowRight, Close, Search } from "./icons";

// Open state lives in a tiny module store so the header button and keyboard shortcut share it.
let open = false;
// The results are only rendered once search has been opened: the closed dialog is still in the layout (it fades), so
// its thumbnails would otherwise download on every page load, and every page's HTML would carry the list.
let opened = false;
const listeners = new Set<() => void>();
export function setSearchOpen(next: boolean) {
  open = next;
  if (next) opened = true;
  listeners.forEach((l) => l());
}
const useSearchOpen = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => open,
    () => false,
  );

const suggestions = ["lace", "silk", "bikini", "black", "bodysuit", "sale"];

export default function SearchDialog() {
  const isOpen = useSearchOpen();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K or "/" opens search anywhere; Escape closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape" && open) setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.style.overflow = "hidden";
    // focus goes to the search box, and back to whatever opened search when it closes
    const opener = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const q = query.trim();
  const results = q ? products.filter((p) => matchesQuery(p, q) || (q.toLowerCase() === "sale" && p.salePrice)) : bestSellers;
  useTrackNoResults(q, !results.length, "dialog");

  function close() {
    setSearchOpen(false);
  }

  function seeAll() {
    close();
    router.push(q.toLowerCase() === "sale" ? "/products?sale=1" : q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <div className={`search-root ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen} inert={!isOpen}>
      <div className="drawer-scrim" onClick={close} />
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search">
        <form
          className="search-field"
          onSubmit={(e) => {
            e.preventDefault();
            seeAll();
          }}
        >
          <Search />
          <input ref={input} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you want to be caught in?" aria-label="Search products" />
          <kbd>esc</kbd>
          <button type="button" className="icon-btn" aria-label="Close search" onClick={close}>
            <Close />
          </button>
        </form>

        {!q && (
          <div className="search-suggest">
            <span>Everyone’s after</span>
            {suggestions.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setQuery(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <p className="search-label">{q ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Best sellers"}</p>
        {!opened ? null : results.length ? (
          <ul className="search-results">
            {results.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} onClick={close}>
                  <span className="search-thumb">
                    <Image src={p.image} alt="" fill sizes="56px" />
                  </span>
                  <span className="search-name">
                    <strong>{p.name}</strong>
                    <em>{collectionName(p.category)}</em>
                  </span>
                  <Price product={p} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="search-empty">Nothing’s wearing “{q}” tonight. Try “lace”, “silk” or “bikini”.</p>
        )}

        {q && results.length > 0 && (
          <button type="button" className="search-all" onClick={seeAll}>
            See all {results.length} results <ArrowRight />
          </button>
        )}
      </div>
    </div>
  );
}
