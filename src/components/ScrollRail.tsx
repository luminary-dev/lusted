"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Stands in for the (hidden) browser scrollbar: a thin rose line across the top that fills as you scroll, and —
// on pages made of sections — a rail down the right edge with a heart per section. The section you're in glows;
// tap a heart to glide there.
const LABELS: Record<string, string> = {
  top: "Welcome",
  sale: "Sale",
  collections: "Collections",
  "best-sellers": "Best sellers",
  "size-guide": "Size guide",
  about: "Our story",
  care: "How it works",
  ordering: "Ordering",
  contact: "Contact",
};
const label = (id: string) => LABELS[id] ?? id.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function HeartMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3.1 1.6-1.9 3.1-3.1 5.2-3.1 3.5 0 5.4 3.5 4.1 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
    </svg>
  );
}

export default function ScrollRail() {
  const pathname = usePathname();
  const [sections, setSections] = useState<string[]>([]);
  const [active, setActive] = useState("");

  // the line across the top: a CSS variable updated once per frame
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll-progress", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // the rail: one heart per top-level section, the one filling the middle of the screen lit
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("main > section[id]")];
    const found = requestAnimationFrame(() => setSections(els.length >= 3 ? els.map((el) => el.id) : [])); // after the page's sections mount
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    if (els.length >= 3) els.forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(found);
      observer.disconnect();
    };
  }, [pathname]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (id === "top") window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    else el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  };

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      {sections.length > 0 && (
        <nav className="scroll-rail" aria-label="Sections">
          {sections.map((id, i) => (
            <span key={id} className="scroll-rail-step">
              {i > 0 && <i className="scroll-rail-gem" aria-hidden="true" />}
              <button
                type="button"
                className={id === active ? "is-active" : ""}
                aria-current={id === active ? "true" : undefined}
                aria-label={label(id)}
                onClick={() => go(id)}
              >
                <HeartMark />
                <span className="scroll-rail-label">{label(id)}</span>
              </button>
            </span>
          ))}
        </nav>
      )}
    </>
  );
}
