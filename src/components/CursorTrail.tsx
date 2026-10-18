"use client";

import { useEffect, useRef } from "react";

// A bundle of silky ribbons that trail the cursor: each is a chain of springy nodes pulled after the pointer and drawn
// as one smooth curve, shading through Lusted's wine → rose → blush as they swirl, then fading out when the cursor
// rests. Mouse/trackpad only (no touch), off with reduced motion, and never in the way of clicks.
const TRAILS = 18;
const NODES = 40;
const PALETTE = [
  [122, 27, 51], // wine
  [179, 84, 106], // rose
  [232, 180, 170], // blush
];

type Node = { x: number; y: number; vx: number; vy: number };

export default function CursorTrail() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let w = 0,
      h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const pointer = { x: w / 2, y: h / 2 };
    let trails: { spring: number; friction: number; nodes: Node[] }[] = [];
    const seed = () => {
      trails = Array.from({ length: TRAILS }, (_, i) => ({
        // each ribbon a little looser than the last, so they fan out and swirl instead of moving as one line
        spring: 0.45 + (i / TRAILS) * 0.025 + Math.random() * 0.1 - 0.05,
        friction: 0.5 + Math.random() * 0.01 - 0.002,
        nodes: Array.from({ length: NODES }, () => ({ x: pointer.x, y: pointer.y, vx: 0, vy: 0 })),
      }));
    };

    let energy = 0; // 1 while the cursor moves, eases to 0 so the ribbons fade when it rests
    let started = false;
    let t = 0;
    let raf = 0;

    const colour = (phase: number, alpha: number) => {
      // glide around the palette: wine → rose → blush → rose → wine …
      const p = (Math.sin(phase) + 1) / 2;
      const [a, b] = p < 0.5 ? [PALETTE[0], PALETTE[1]] : [PALETTE[1], PALETTE[2]];
      const k = p < 0.5 ? p * 2 : (p - 0.5) * 2;
      const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
      return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      energy *= 0.985;
      if (energy < 0.01) return;
      t += 0.0125;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = document.documentElement.dataset.theme === "dark" ? "lighter" : "source-over";
      trails.forEach((trail, ti) => {
        let spring = trail.spring;
        const n0 = trail.nodes[0];
        n0.vx += (pointer.x - n0.x) * spring;
        n0.vy += (pointer.y - n0.y) * spring;
        for (let i = 0; i < trail.nodes.length; i++) {
          const n = trail.nodes[i];
          if (i > 0) {
            const prev = trail.nodes[i - 1];
            n.vx += (prev.x - n.x) * spring;
            n.vy += (prev.y - n.y) * spring;
            n.vx += prev.vx * 0.025;
            n.vy += prev.vy * 0.025;
          }
          n.vx *= trail.friction;
          n.vy *= trail.friction;
          n.x += n.vx;
          n.y += n.vy;
          spring *= 0.99;
        }
        const nodes = trail.nodes;
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 1; i < nodes.length - 2; i++) {
          const a = nodes[i],
            b = nodes[i + 1];
          ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
        }
        const a = nodes[nodes.length - 2],
          b = nodes[nodes.length - 1];
        ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
        ctx.strokeStyle = colour(t + ti * 0.18, 0.22 * energy);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!started) {
        started = true;
        seed();
      }
      energy = 1;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvas} className="cursor-trail" aria-hidden="true" />;
}
