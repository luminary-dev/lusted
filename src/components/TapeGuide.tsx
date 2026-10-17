"use client";

import { useEffect, useState } from "react";

// "Where the tape goes": a couturier's dress form in fine line art with a measuring tape wrapped around it at each
// point. Each tape is solid across the front and faint behind, so it reads as wrapping the form. Pointing at (or
// tapping / focusing) a step lights its tape up and draws it around the form; left alone, it slowly cycles through
// them like a fitting in progress (not with reduced motion).
const STEPS = [
  { title: "Underbust", text: "Snug, right beneath your bust", y: 92, half: 43 },
  { title: "Bust", text: "Across your fullest curve", y: 70, half: 48 },
  { title: "Waist", text: "Where you’re smallest", y: 120, half: 33 },
  { title: "Hips", text: "Around your fullest curve", y: 160, half: 46 },
];

const CX = 80; // centre line of the form

export default function TapeGuide() {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(t);
  }, [held]);

  const pick = (i: number) => {
    setActive(i);
    setHeld(true);
  };

  return (
    <div className="tape-guide" data-reveal onMouseLeave={() => setHeld(false)}>
      <svg className="tape-form" viewBox="0 0 196 244" aria-hidden="true">
        {/* the dress form: neck cap, torso, seams, stand and tripod */}
        <ellipse className="form-cap" cx={CX} cy="10" rx="11" ry="3.4" />
        <path className="form-body" d="M71 23 L71 12 Q80 7.5 89 12 L89 23 Z" />
        <path
          className="form-body"
          d="M71 22 C60 26 36 28 30 40 C26 50 28 62 32 74 C35 86 38 96 44 108 C48 116 48 124 45 132 C41 144 33 154 34 166 C35 178 52 184 80 184 C108 184 125 178 126 166 C127 154 119 144 115 132 C112 124 112 116 116 108 C122 96 125 86 128 74 C132 62 134 50 130 40 C124 28 100 26 89 22 Z"
        />
        <path className="form-seam" d="M80 23 L80 184" />
        <path className="form-seam" d="M57 29 C60 58 62 88 59 110 C56 140 58 160 61 182" />
        <path className="form-seam" d="M103 29 C100 58 98 88 101 110 C104 140 102 160 99 182" />
        <path className="form-stand" d="M80 184 L80 224 M80 224 L58 238 M80 224 L102 238 M80 224 L80 239" />
        <circle className="form-cap" cx="58" cy="239" r="2.4" />
        <circle className="form-cap" cx="102" cy="239" r="2.4" />
        <circle className="form-cap" cx={CX} cy="240" r="2.4" />

        {/* the four tapes, wrapped round the form */}
        {STEPS.map((s, i) => {
          const l = CX - s.half;
          const r = CX + s.half;
          const on = i === active;
          return (
            <g key={s.title} className={`tape-wrap ${on ? "is-active" : ""}`}>
              <path className="tape-back" d={`M${l} ${s.y} A${s.half} 6 0 0 1 ${r} ${s.y}`} />
              <path key={on ? `on-${active}` : "off"} className="tape-front" pathLength={1} d={`M${l} ${s.y} A${s.half} 6.5 0 0 0 ${r} ${s.y}`} />
              <path className="tape-ticks" d={`M${l} ${s.y} A${s.half} 6.5 0 0 0 ${r} ${s.y}`} />
              <text className="tape-label" x={r + 7} y={s.y + 3}>
                {s.title}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="tape-copy">
        <p className="tape-eyebrow">Where the tape goes</p>
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={i === active ? "is-active" : ""}
                aria-pressed={i === active}
                onMouseEnter={() => pick(i)}
                onFocus={() => pick(i)}
                onBlur={() => setHeld(false)}
                onClick={() => pick(i)}
              >
                <span>0{i + 1}</span>
                <strong>{s.title}</strong>
                <em>{s.text}</em>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
