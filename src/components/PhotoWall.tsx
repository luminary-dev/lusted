"use client";

import { useRef, type ReactNode } from "react";

// The gallery wall's pointer tracking: as the pointer moves across the wall, --px / --py (-1…1) tilt the whole wall
// a degree or two towards you and slide the light across the glass. Pointer-only; everything still renders without it.
export default function PhotoWall({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (px: number, py: number) => {
    ref.current?.style.setProperty("--px", px.toFixed(3));
    ref.current?.style.setProperty("--py", py.toFixed(3));
  };
  return (
    <div
      ref={ref}
      className="photo-wall"
      aria-label={label}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onPointerLeave={() => set(0, 0)}
    >
      {children}
    </div>
  );
}
