"use client";

import { useEffect, useRef } from "react";

// A small blush ring that eases after the pointer and swells softly over anything clickable. The normal cursor stays;
// mouse/trackpad only, off with reduced motion, never blocks clicks.
export default function CursorRing() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ring.current;
    if (!el) return;
    let x = -100,
      y = -100,
      tx = -100,
      ty = -100,
      raf = 0;
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add("is-on");
      el.classList.toggle("is-hover", !!(e.target as Element).closest?.("a, button, [role=button], label, select, input, textarea"));
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => el.classList.remove("is-on");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ring} className="cursor-ring" aria-hidden="true">
      <span />
    </div>
  );
}
