"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Stands in for the (hidden) browser scrollbar: a thin rose line across the top that fills as you scroll and — on
// pages made of sections — a string of flat pastel-pink hearts down the right edge, one per section, with tiny dots
// between them. The thread fills pink down to where you are; the section you're in is a solid heart with a soft glow,
// the two either side are smaller and paler, the rest are outlines. Hover a heart for the section's
// name; click to glide there.
const LABELS: Record<string, string> = {
  top: "Welcome",
  sale: "Sale",
  collections: "Collections",
  "best-sellers": "Best sellers",
  "new-in": "New in",
  "size-guide": "Size guide",
  about: "Our story",
  ordering: "How it works",
  contact: "Contact",
};
const label = (id: string) => LABELS[id] ?? id.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

const STEP = 40; // px between hearts
const PAD = 14;
const W = 30;
const CX = W / 2;
// a full, slightly plump heart centred on 0,0 (about 16 px wide)
const HEART = "M0 6.4C-2.6 4.6-8 1.2-8-3.1-8-6-5.9-7.6-3.9-7.6-2.1-7.6-.8-6.5 0-5.1.8-6.5 2.1-7.6 3.9-7.6 5.9-7.6 8-6 8-3.1 8 1.2 2.6 4.6 0 6.4Z";

export default function ScrollRail() {
  const pathname = usePathname();
  const [sections, setSections] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLElement>(null);

  // find the page's top-level sections once it has mounted
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const ids = [...document.querySelectorAll<HTMLElement>("main > section[id]")].map((el) => el.id);
      setSections(ids.length >= 3 ? ids : []);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  // per frame while scrolling: the top line's fill, how far the lacing has reached, and which section is current
  useEffect(() => {
    const els = sections.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll-progress", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
      if (els.length < 2) return;
      // the section under the middle of the screen, and how far through it we are
      const mid = window.scrollY + window.innerHeight * 0.5;
      const tops = els.map((el) => el.getBoundingClientRect().top + window.scrollY);
      let i = 0;
      while (i < tops.length - 1 && mid >= tops[i + 1]) i++;
      const next = i < tops.length - 1 ? tops[i + 1] : root.scrollHeight;
      const frac = Math.max(0, Math.min(1, (mid - tops[i]) / Math.max(1, next - tops[i])));
      const atEnd = window.scrollY >= max - 2;
      const reach = atEnd ? 1 : Math.min(1, (i + frac * 0.999) / (els.length - 1));
      rail.current?.style.setProperty("--reach", reach.toFixed(4));
      setActive(atEnd ? els.length - 1 : i);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll(); // first paint
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (id === "top") window.scrollTo({ top: 0, behavior });
    else el.scrollIntoView({ behavior, block: "start" });
  };

  const n = sections.length;
  const H = PAD * 2 + (n - 1) * STEP;
  const yAt = (i: number) => PAD + i * STEP;

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      {n > 0 && (
        <nav className="scroll-rail" aria-label="Sections" ref={rail} style={{ width: W, height: H }}>
          <svg className="hearts" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
            {/* the thread: faint all the way, pink down to where you are */}
            <line className="heart-thread" x1={CX} x2={CX} y1={0} y2={H} />
            <line className="heart-thread-fill" x1={CX} x2={CX} y1={yAt(0)} y2={yAt(n - 1)} pathLength={1} />
            {sections.slice(1).map((id, i) => (
              <circle key={id} className="heart-pearl" cx={CX} cy={yAt(i) + STEP / 2} r={1.9} />
            ))}
            {sections.map((id, i) => (
              <g key={id} transform={`translate(${CX} ${yAt(i)})`}>
                <g className="heart" data-dist={Math.min(3, Math.abs(i - active))}>
                  <path className="heart-body" d={HEART} />
                </g>
              </g>
            ))}
          </svg>
          {sections.map((id, i) => (
            <button
              key={id}
              type="button"
              className="heart-hit"
              style={{ top: yAt(i) }}
              aria-label={label(id)}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(id)}
            >
              <span className="scroll-rail-label">{label(id)}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
