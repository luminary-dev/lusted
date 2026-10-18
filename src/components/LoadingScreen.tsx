"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import wordmark from "@/assets/brand/wordmark-dark.png";

// The first thing you see: two wine-velvet curtains drawn across the screen, the Lusted wordmark unveiled out of a
// candlelit glow with rose-gold dust drifting up through it, a ribbon of satin light sliding across the letters and a
// thin rose line drawing itself underneath — then light leaks through the seam and the curtains are drawn aside. Shown once per visit (sessionStorage); returning to the site in the same
// tab skips it (the inline script in layout.tsx hides it before paint). With reduced motion it simply fades.
const MIN_MS = 2500;
// how long the curtains take to clear (CSS: 0.15 s delay + 1.9 s draw) before the overlay is removed
const OPEN_MS = 2150;

// rose-gold dust motes — fixed values (no Math.random) so the server and the browser render the same thing
const motes = Array.from({ length: 14 }, (_, i) => ({
  "--x": `${8 + ((i * 41) % 84)}%`,
  "--dx": `${((i * 29) % 40) - 20}px`,
  "--s": `${4 + ((i * 7) % 5)}px`,
  "--t": `${3.4 + ((i * 53) % 17) / 10}s`,
  "--d": `${((i * 0.37) % 2.6).toFixed(2)}s`,
}));

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
        gone = window.setTimeout(() => el.classList.add("is-gone"), OPEN_MS);
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
      <span className="intro-seam" />
      <div className="intro-mark">
        <span className="intro-dust">
          {motes.map((m, i) => (
            <i key={i} style={m as React.CSSProperties} />
          ))}
        </span>
        <div className="intro-logo">
          <Image src={wordmark} alt="" preload sizes="(min-width: 600px) 320px, 62vw" />
          <span className="intro-shine" />
        </div>
        <span className="intro-line" />
        <p className="intro-tag">
          undressing the site for you
          <span className="intro-dots">
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </p>
      </div>
    </div>
  );
}
