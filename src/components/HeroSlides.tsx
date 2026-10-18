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
export default function HeroSlides({ slides }: { slides: HeroSlide[] }) {
  const [{ active, prev }, setState] = useState({ active: 0, prev: -1 });

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) setState((s) => ({ active: (s.active + 1) % slides.length, prev: s.active }));
    }, INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="hero-slides">
      {slides.map((s, i) => {
        const state = i === active ? (prev < 0 ? "is-active is-first" : "is-active is-entering") : i === prev ? "is-leaving" : "";
        return (
          <div
            key={i}
            className={`hero-slide ${state}`}
            style={{ "--pos": s.pos, "--pos-m": s.posMobile } as React.CSSProperties}
            aria-hidden={i !== active}
          >
            <Image quality={90} src={s.src} alt={s.alt} fill preload={i === 0} loading={i === 0 ? undefined : "eager"} placeholder="blur" sizes="(max-aspect-ratio: 1/1) 130vh, 100vw" />
          </div>
        );
      })}
    </div>
  );
}
