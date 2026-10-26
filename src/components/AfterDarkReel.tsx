"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { HeroSlide } from "./HeroSlides";
import { ArrowRight } from "./icons";

// The After Dark filmstrip (AfterDark.tsx): two rows of frames that glide past on their own. Tapping a frame opens that
// row as a reel: the page blurs away and the same row carries on gliding, larger, from exactly where it was, with a
// line of copy and the way into every piece beneath it. Esc, the close button or the blurred page closes it again.

export type ReelLine = {
  eyebrow: string;
  title: string;
  lead: string;
  cta: string;
};

function Frames({
  row,
  dup,
  onPick,
  as,
}: {
  row: HeroSlide[];
  dup: boolean;
  onPick?: () => void;
  as: "button" | "link";
}) {
  return (
    <ul
      className={`strip-set${dup ? " is-dup" : ""}`}
      aria-hidden={dup || undefined}
    >
      {row.map((s, i) => {
        // the photos in hero/after-dark are already 4:5 cuts centred on the model, so a frame shows the whole file
        const img = (
          <Image
            src={s.src}
            alt={dup ? "" : s.alt}
            fill
            // the frame widths in globals.css: --card on .strip, larger on .reel-stage .strip
            sizes={
              as === "button"
                ? "(max-width: 1111px) 200px, (min-width: 1611px) 290px, 18vw"
                : "(max-width: 862px) 250px, (min-width: 1586px) 460px, 29vw"
            }
            // a copy only comes into view after its original has already loaded and been on screen, so its blur
            // placeholder would never show — leaving it out keeps 40 of them out of the page
            placeholder={dup ? "empty" : "blur"}
            quality={75}
          />
        );
        return (
          <li key={i}>
            {as === "button" ? (
              <button
                type="button"
                onClick={onPick}
                aria-label={`${s.alt} — open this reel`}
                tabIndex={dup ? -1 : undefined}
              >
                {img}
              </button>
            ) : (
              <Link
                href="/products?cat=after-dark"
                aria-label={`${s.alt} — shop After Dark`}
                tabIndex={dup ? -1 : undefined}
              >
                {img}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function AfterDarkReel({
  rows,
  lines,
}: {
  rows: HeroSlide[][];
  lines: ReelLine[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [startDelay, setStartDelay] = useState("0s");
  const strips = useRef<(HTMLDivElement | null)[]>([]);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  // the reel picks the row up where it is: read how far the row's glide has got and start the reel's glide from there
  const pick = useCallback((r: number) => {
    const strip = strips.current[r];
    if (strip) {
      const cs = getComputedStyle(strip);
      const x = new DOMMatrix(cs.transform).m41;
      const half = strip.scrollWidth / 2 || 1;
      const p = Math.min(1, Math.max(0, -x / half)); // keyframe progress, 0…1 (reverse rows run the keyframes backwards)
      const dur = parseFloat(cs.animationDuration) || 195;
      setStartDelay(`${-((r === 1 ? 1 - p : p) * dur).toFixed(2)}s`);
    }
    opener.current = document.activeElement;
    setOpen(r);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    (opener.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <div className="strips">
        {rows.map((row, r) => (
          <div
            key={r}
            className={`strip-viewport${r === 1 ? " is-reverse" : ""}`}
          >
            <div
              className="strip"
              ref={(el) => {
                strips.current[r] = el;
              }}
            >
              {[false, true].map((dup) => (
                <Frames
                  key={String(dup)}
                  row={row}
                  dup={dup}
                  as="button"
                  onPick={() => pick(r)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* rendered onto the body: the band is its own stacking context with an angled clip, which would keep the reel
          under the nav and cut its corner */}
      {open !== null &&
        createPortal(
          <div
            className="reel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reel-title"
            // anywhere that isn't a frame, the copy or the close button is "outside": the blurred page and the gaps between frames
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest("a, button, .reel-copy"))
                close();
            }}
          >
            <div className="reel-backdrop" />
            <button
              ref={closeBtn}
              type="button"
              className="reel-close"
              onClick={close}
              aria-label="Close the reel"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="reel-stage">
              <div
                className={`strip-viewport${open === 1 ? " is-reverse" : ""}`}
              >
                <div className="strip" style={{ animationDelay: startDelay }}>
                  {[false, true].map((dup) => (
                    <Frames
                      key={String(dup)}
                      row={rows[open]}
                      dup={dup}
                      as="link"
                    />
                  ))}
                </div>
              </div>
              <div className="reel-copy">
                <p className="eyebrow center">{lines[open].eyebrow}</p>
                <h3 id="reel-title" className="reel-title">
                  {lines[open].title}
                </h3>
                <p className="reel-lead">{lines[open].lead}</p>
                <Link href="/products" className="reel-cta">
                  <span>{lines[open].cta}</span>{" "}
                  <ArrowRight className="arrow" />
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
