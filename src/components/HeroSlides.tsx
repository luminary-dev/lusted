"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = {
  src: StaticImageData;
  alt: string;
  /** object-position on desktop / on phones — keeps the face clear of the headline and in frame */
  pos: string;
  posMobile: string;
};

// Keep in sync with --hero-hold in globals.css (each slide's slow drift lasts exactly one hold).
const INTERVAL = 8000;

// Full-screen hero backgrounds. Each new photo opens slowly from the model outwards through a soft iris,
// emerging from a warm champagne haze into focus; the previous photo melts into soft focus beneath it.
// No visible controls.
// `priority` is for the hero at the top of the page: its first photo is preloaded and the rest fetched eagerly. A band further
// down would pass false so its photos only load as it scrolls into view.
export default function HeroSlides({ slides, priority = true }: { slides: HeroSlide[]; priority?: boolean }) {
  const [{ active, prev }, setState] = useState({ active: 0, prev: -1 });

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) setState((s) => ({ active: (s.active + 1) % slides.length, prev: s.active }));
    }, INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);

  // Only the photo on screen, the one leaving and the one up next are mounted. Every slide at once decodes to
  // hundreds of megabytes of bitmap on a phone, which is enough for iOS Safari to kill the tab and reload it.
  const next = (active + 1) % slides.length;
  return (
    <div className="hero-slides">
      {slides.map((s, i) => {
        const state = i === active ? (prev < 0 ? "is-active is-first" : "is-active is-entering") : i === prev ? "is-leaving" : "";
        const mounted = i === active || i === prev || i === next;
        return (
          <div
            key={i}
            className={`hero-slide ${state}`}
            style={{ "--pos": s.pos, "--pos-m": s.posMobile } as React.CSSProperties}
            aria-hidden={i !== active}
          >
            {mounted && (
              <Image
                quality={90}
                src={s.src}
                alt={s.alt}
                fill
                preload={priority && i === 0}
                loading={priority && i === 0 ? undefined : priority ? "eager" : "lazy"}
                placeholder="blur"
                // phones: the crop is about 1.8× the screen width, so ask for that, not the full 4K
                sizes="(max-width: 600px) 190vw, (max-aspect-ratio: 1/1) 130vh, 100vw"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
