"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, colors, matchesQuery, priceBuckets, priceOf, products, sizes, type Category, type ColorKey, type Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import { Chevron, ChevronNext, Close, Search, Sliders } from "../icons";

const PER_PAGE = 15;

const sorts = [
  { key: "featured", label: "Featured" },
  { key: "best", label: "Best selling" },
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const;

const flags = [
  { key: "sale", label: "On sale", test: (p: Product) => !!p.salePrice },
  { key: "new", label: "New in", test: (p: Product) => p.isNew },
  { key: "best", label: "Best sellers", test: (p: Product) => !!p.bestSeller },
] as const;

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export default function ProductBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // All filter state lives in the URL so filtered views can be shared and survive reloads.
  const cat = (params.get("cat") ?? "") as Category | "";
  const selSizes = list(params.get("size"));
  const selColors = list(params.get("color")) as ColorKey[];
  const selPrice = list(params.get("price"));
  const selFlags = flags.filter((f) => params.get(f.key) === "1").map((f) => f.key);
  const sort = (params.get("sort") ?? "featured") as (typeof sorts)[number]["key"];
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  function update(changes: Record<string, string | string[] | null>) {
    const next = new URLSearchParams(params.toString());
    if (!("page" in changes)) next.delete("page"); // any filter, search or sort change starts again from page 1
    for (const [k, v] of Object.entries(changes)) {
      const value = Array.isArray(v) ? v.join(",") : v;
      if (value) next.set(k, value);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const toggle = (key: string, current: string[], value: string) =>
    update({ [key]: current.includes(value) ? current.filter((x) => x !== value) : [...current, value] });

  // Debounce typing into the URL.
  useEffect(() => {
    if (query === urlQuery) return;
    const t = setTimeout(() => update({ q: query.trim() || null }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(() => {
    const q = urlQuery.trim().toLowerCase();
    const out = products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (q && !matchesQuery(p, q)) return false;
      if (selSizes.length && !p.sizes.some((s) => s === "One size" || selSizes.includes(s))) return false;
      if (selColors.length && !p.colors.some((c) => selColors.includes(c))) return false;
      if (selPrice.length && !priceBuckets.some((b) => selPrice.includes(b.key) && b.test(priceOf(p)))) return false;
      for (const f of flags) if (selFlags.includes(f.key) && !f.test(p)) return false;
      return true;
    });
    const by: Record<string, (a: Product, b: Product) => number> = {
      best: (a, b) => (a.bestSeller ?? 99) - (b.bestSeller ?? 99),
      new: (a, b) => b.added.localeCompare(a.added),
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
    };
    return by[sort] ? [...out].sort(by[sort]) : out;
  }, [cat, urlQuery, selSizes, selColors, selPrice, selFlags, sort]);

  // 15 pieces per page; the page lives in the URL (?page=2) like the filters
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const top = useRef<HTMLDivElement>(null);
  const goTo = (n: number) => {
    update({ page: n > 1 ? String(n) : null });
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.key, products.filter((p) => p.category === c.key).length])), []);

  const chips = [
    ...(urlQuery ? [{ label: `“${urlQuery}”`, clear: () => (setQuery(""), update({ q: null })) }] : []),
    ...selSizes.map((s) => ({ label: `Size ${s}`, clear: () => toggle("size", selSizes, s) })),
    ...selColors.map((c) => ({ label: colors[c]?.label ?? c, clear: () => toggle("color", selColors, c) })),
    ...selPrice.map((k) => ({ label: priceBuckets.find((b) => b.key === k)?.label ?? k, clear: () => toggle("price", selPrice, k) })),
    ...flags.filter((f) => selFlags.includes(f.key)).map((f) => ({ label: f.label, clear: () => update({ [f.key]: null }) })),
  ];
  const clearAll = () => {
    setQuery("");
    router.replace(cat ? `${pathname}?cat=${cat}` : pathname, { scroll: false });
  };

  const filterCount = selSizes.length + selColors.length + selPrice.length + selFlags.length;

  return (
    <div className="browser">
      <div className="cat-tabs" role="tablist" aria-label="Category">
        <button role="tab" aria-selected={!cat} className={!cat ? "is-active" : ""} onClick={() => update({ cat: null })}>
          All <span>{products.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c.key} role="tab" aria-selected={cat === c.key} className={cat === c.key ? "is-active" : ""} onClick={() => update({ cat: c.key })}>
            {c.name} <span>{counts[c.key]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <label className="search">
          <Search />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lace, satin, bikini…" aria-label="Search products" />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => (setQuery(""), update({ q: null }))}>
              <Close />
            </button>
          )}
        </label>
        <button className="filters-btn" onClick={() => setDrawer(true)}>
          <Sliders /> Filters {filterCount > 0 && <span>{filterCount}</span>}
        </button>
        <label className="sort">
          <span>Sort</span>
          <select aria-label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}>
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <Chevron />
        </label>
      </div>

      <div className="browser-body">
        <div className={`filters-root ${drawer ? "is-open" : ""}`}>
          <div className="filters-scrim" onClick={() => setDrawer(false)} />
          <aside className="filters" aria-label="Filters">
            <div className="filters-head">
              <h2 className="h3">Filters</h2>
              <button className="icon-btn" aria-label="Close filters" onClick={() => setDrawer(false)}>
                <Close />
              </button>
            </div>

            <fieldset>
              <legend>Shop by</legend>
              {flags.map((f) => (
                <label key={f.key} className="check">
                  <input type="checkbox" checked={selFlags.includes(f.key)} onChange={() => update({ [f.key]: selFlags.includes(f.key) ? null : "1" })} />
                  <span>{f.label}</span>
                  <em>{products.filter(f.test).length}</em>
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Size</legend>
              <div className="size-chips">
                {sizes.map((s) => (
                  <button key={s} type="button" aria-pressed={selSizes.includes(s)} className={selSizes.includes(s) ? "is-active" : ""} onClick={() => toggle("size", selSizes, s)}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Colour</legend>
              <div className="color-list">
                {(Object.keys(colors) as ColorKey[]).map((c) => (
                  <button key={c} type="button" aria-pressed={selColors.includes(c)} className={selColors.includes(c) ? "is-active" : ""} onClick={() => toggle("color", selColors, c)}>
                    <span className="swatch" style={{ background: colors[c].hex }} />
                    {colors[c].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Price</legend>
              {priceBuckets.map((b) => (
                <label key={b.key} className="check">
                  <input type="checkbox" checked={selPrice.includes(b.key)} onChange={() => toggle("price", selPrice, b.key)} />
                  <span>{b.label}</span>
                  <em>{products.filter((p) => b.test(priceOf(p))).length}</em>
                </label>
              ))}
            </fieldset>

            <div className="filters-foot">
              <button className="btn btn-ghost" onClick={clearAll} disabled={!filterCount && !urlQuery}>
                Clear all
              </button>
              <button className="btn btn-wine" onClick={() => setDrawer(false)}>
                Show {results.length} {results.length === 1 ? "piece" : "pieces"}
              </button>
            </div>
          </aside>
        </div>

        <div className="results" ref={top}>
          <div className="results-bar">
            <p>
              {pages > 1
                ? `${(page - 1) * PER_PAGE + 1}–${(page - 1) * PER_PAGE + shown.length} of ${results.length} pieces`
                : `${results.length} ${results.length === 1 ? "piece" : "pieces"}`}
            </p>
            {chips.length > 0 && (
              <div className="chips">
                {chips.map((c) => (
                  <button key={c.label} className="chip" onClick={c.clear}>
                    {c.label} <Close />
                  </button>
                ))}
                <button className="chip-clear" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            )}
          </div>

          {results.length ? (
            <>
              <div className="product-grid">
                {shown.map((p) => {
                  const color = p.colors.find((c) => selColors.includes(c)); // filtered by colour → show that colourway
                  return <ProductCard key={`${p.slug}-${color ?? ""}`} product={p} color={color} />;
                })}
              </div>
              {pages > 1 && (
                <nav className="pager" aria-label="Pages">
                  <button type="button" className="pager-step is-prev" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">
                    <ChevronNext />
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" className={n === page ? "is-active" : ""} aria-current={n === page ? "page" : undefined} onClick={() => goTo(n)}>
                      {n}
                    </button>
                  ))}
                  <button type="button" className="pager-step" onClick={() => goTo(page + 1)} disabled={page === pages} aria-label="Next page">
                    <ChevronNext />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="empty">
              <h3 className="h3">No pieces match those filters.</h3>
              <p>Try removing a filter, or message us — we may have it in the back.</p>
              <button className="btn btn-wine" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
