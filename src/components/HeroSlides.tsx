"use client";

import Image, { getImageProps, type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = {
  src: StaticImageData;
  /** a 9:16 cut of the same photo centred on the model, for phones (hero/main-phone); the wide photo serves everywhere else */
  phone?: StaticImageData;
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
export default function HeroSlides({
  slides,
  priority = true,
}: {
  slides: HeroSlide[];
  priority?: boolean;
}) {
  const [{ active, prev }, setState] = useState({ active: 0, prev: -1 });

  useEffect(() => {
    if (
      slides.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const t = setInterval(() => {
      if (!document.hidden)
        setState((s) => ({
          active: (s.active + 1) % slides.length,
          prev: s.active,
        }));
    }, INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);

  // Only the photo on screen, the one leaving and the one up next are mounted. Every slide at once decodes to
  // hundreds of megabytes of bitmap on a phone, which is enough for iOS Safari to kill the tab and reload it.
  const next = (active + 1) % slides.length;
  return (
    <div className="hero-slides">
      {slides.map((s, i) => {
        const state =
          i === active
            ? prev < 0
              ? "is-active is-first"
              : "is-active is-entering"
            : i === prev
              ? "is-leaving"
              : "";
        const mounted = i === active || i === prev || i === next;
        return (
          <div
            key={i}
            className={`hero-slide ${state}`}
            style={
              // a phone cut is already centred on the model, so a phone keeps only the vertical focal point
              {
                "--pos": s.pos,
                "--pos-m": s.phone
                  ? `50% ${s.posMobile.split(" ")[1] ?? "20%"}`
                  : s.posMobile,
              } as React.CSSProperties
            }
            aria-hidden={i !== active}
          >
            {mounted &&
              (s.phone ? (
                // art direction: phones get the 9:16 cut, everything wider the full photo (one <img>, two sources)
                <HeroPicture
                  slide={s}
                  priority={priority && i === 0}
                  eager={priority}
                />
              ) : (
                <Image
                  quality={90}
                  src={s.src}
                  alt={s.alt}
                  fill
                  preload={priority && i === 0}
                  loading={
                    priority && i === 0
                      ? undefined
                      : priority
                        ? "eager"
                        : "lazy"
                  }
                  placeholder="blur"
                  sizes="(max-width: 600px) 190vw, (max-aspect-ratio: 1/1) 130vh, 100vw"
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

// The hero photo as a <picture>: the phone cut below 600px, the wide photo above. Built from Next's own image props so
// both sources go through the optimiser with srcset, blur placeholder and lazy loading like a plain <Image>.
function HeroPicture({
  slide,
  priority,
  eager,
}: {
  slide: HeroSlide;
  priority: boolean;
  eager: boolean;
}) {
  const common = {
    alt: slide.alt,
    fill: true as const,
    quality: 90,
    placeholder: "blur" as const,
    preload: priority,
    loading: priority
      ? undefined
      : eager
        ? ("eager" as const)
        : ("lazy" as const),
  };
  const { props: phone } = getImageProps({
    ...common,
    src: slide.phone!,
    sizes: "100vw",
  });
  const { props: wide } = getImageProps({
    ...common,
    src: slide.src,
    sizes: "(max-aspect-ratio: 1/1) 130vh, 100vw",
  });
  return (
    <picture>
      <source
        media="(max-width: 600px)"
        srcSet={phone.srcSet}
        sizes={phone.sizes}
      />
      <img {...wide} alt={slide.alt} />
    </picture>
  );
}
