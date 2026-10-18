"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import wordmark from "@/assets/brand/wordmark-dark.png";

// The first thing you see: two wine-velvet curtains drawn across the screen, the Lusted wordmark surfacing out of a
// candlelit glow while a ribbon of satin light slides across it and a thin rose line draws itself underneath — then the
// curtains part and the site is revealed. Shown once per visit (sessionStorage); returning to the site in the same
// tab skips it (the inline script in layout.tsx hides it before paint). With reduced motion it simply fades.
const MIN_MS = 2500;

export default function LoadingScreen() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.documentElement.classList.contains("intro-seen")) return;
    const started = performance.now();
    let leave = 0,
      gone = 0;
    const open = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      leave = window.setTimeout(() => {
        el.classList.add("is-leaving");
        try {
          sessionStorage.setItem("lusted-intro", "1");
        } catch {}
        gone = window.setTimeout(() => el.classList.add("is-gone"), 1300);
      }, wait);
    };
    if (document.readyState === "complete") open();
    else window.addEventListener("load", open, { once: true });
    // never hold the site hostage: open after 5 s even if something is still loading
    const failsafe = window.setTimeout(open, 5000);
    return () => {
      window.removeEventListener("load", open);
      clearTimeout(leave);
      clearTimeout(gone);
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <div ref={ref} className="intro" aria-hidden="true" style={{ "--logo": `url(${wordmark.src})` } as React.CSSProperties}>
      <div className="intro-curtain is-left" />
      <div className="intro-curtain is-right" />
      <div className="intro-mark">
        <div className="intro-logo">
          <Image src={wordmark} alt="" preload sizes="(min-width: 600px) 320px, 62vw" />
          <span className="intro-shine" />
        </div>
        <span className="intro-line" />
        <p className="intro-tag">undressing the site for you…</p>
      </div>
    </div>
  );
}
