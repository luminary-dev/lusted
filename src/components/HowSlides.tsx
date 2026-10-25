"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

export type HowSlide = { src: StaticImageData; alt: string };

// Keep in sync with --how-hold in globals.css (each slide's slow drift lasts exactly one hold).
const INTERVAL = 10000;

// The campaign photos behind "How it works". Each new photo is drawn across the old one by a soft diagonal sweep, like
// silk sliding off, from the models' side of the frame outwards, and drifts gently for as long as it stays; no blur,
// so it costs far less than the hero's transition. Only the photo on screen, the one leaving and the one up next
// are mounted. No visible controls; stands still with reduced motion.
export default function HowSlides({ slides }: { slides: HowSlide[] }) {
  const [{ active, prev }, setState] = useState({ active: 0, prev: -1 });

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) setState((s) => ({ active: (s.active + 1) % slides.length, prev: s.active }));
    }, INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);

  const next = (active + 1) % slides.length;
  return (
    <div className="how-slides">
      {slides.map((s, i) => {
        const state = i === active ? (prev < 0 ? "is-active is-first" : "is-active is-entering") : i === prev ? "is-leaving" : "";
        const mounted = i === active || i === prev || i === next;
        return (
          <div key={i} className={`how-slide ${state}`} aria-hidden={i !== active}>
            {mounted && (
              <Image
                quality={90}
                src={s.src}
                alt={s.alt}
                fill
                placeholder="blur"
                loading={i === 0 ? "eager" : "lazy"}
                sizes="(max-width: 600px) 134vw, (max-width: 900px) 100vw, 100vw"
                className="how-img"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
