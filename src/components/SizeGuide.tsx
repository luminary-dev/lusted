"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
const sizeImg = img("images/size-guide.webp");
import { whatsappLink } from "@/lib/site";
import { ArrowRight } from "./icons";
import SizeTags3D from "./SizeTags3D";
import TapeGuide from "./TapeGuide";
import { img } from "@/lib/cdn";

// Body measurements in cm. Bra bands follow the underbust (UK/US/AU 30 = 63–67 cm, then +5 cm per band) and cups
// the bust-minus-underbust difference. Dress sizes use the usual UK/AU 6–14 ↔ EU 34–42 ↔ US 2–10 conversion.
// XXL follows the same steps (UK 16 / EU 44 / US 12). Check them against your makers' own charts.
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const UK = ["6", "8", "10", "12", "14", "16"];
const EU = ["34", "36", "38", "40", "42", "44"];
const US = ["2", "4", "6", "8", "10", "12"];
const BUST = ["78 – 82", "83 – 87", "88 – 92", "93 – 97", "98 – 102", "103 – 108"];
const WAIST = ["60 – 64", "65 – 69", "70 – 74", "75 – 79", "80 – 84", "85 – 90"];
const HIPS = ["84 – 88", "89 – 93", "94 – 98", "99 – 103", "104 – 108", "109 – 114"];

// the line on the back of each swing tag
const TEASE = [
  "Small. Precise. Trouble.",
  "Made to be noticed, then handled.",
  "Every curve, held exactly right.",
  "More to love. More to take off.",
  "Every inch, worshipped.",
  "Made for all of you — slowly.",
];

// each size is a swing tag: [label, value] lines
const guides: Record<string, [string, string][][]> = {
  "Bras & tops": [
    [
      ["Underbust", "63 – 67"],
      ["Bust", "75 – 85"],
      ["UK · US", "30A – 30C"],
      ["EU", "65A – 65C"],
    ],
    [
      ["Underbust", "68 – 72"],
      ["Bust", "80 – 90"],
      ["UK · US", "32A – 32C"],
      ["EU", "70A – 70C"],
    ],
    [
      ["Underbust", "73 – 77"],
      ["Bust", "87 – 97"],
      ["UK · US", "34B – 34D"],
      ["EU", "75B – 75D"],
    ],
    [
      ["Underbust", "78 – 82"],
      ["Bust", "92 – 102"],
      ["UK · US", "36B – 36D"],
      ["EU", "80B – 80D"],
    ],
    [
      ["Underbust", "83 – 87"],
      ["Bust", "99 – 109"],
      ["UK · US", "38C – 38DD"],
      ["EU", "85C – 85E"],
    ],
    [
      ["Underbust", "88 – 92"],
      ["Bust", "106 – 116"],
      ["UK · US", "40C – 40DD"],
      ["EU", "90C – 90E"],
    ],
  ],
  "Bodysuits & dresses": SIZES.map((_, i) => [
    ["Bust", BUST[i]],
    ["Waist", WAIST[i]],
    ["Hips", HIPS[i]],
    ["UK · EU · US", `${UK[i]} · ${EU[i]} · ${US[i]}`],
  ]),
  Bottoms: SIZES.map((_, i) => [
    ["Waist", WAIST[i]],
    ["Hips", HIPS[i]],
    ["UK · EU · US", `${UK[i]} · ${EU[i]} · ${US[i]}`],
  ]),
};

type Tab = keyof typeof guides;


export default function SizeGuide() {
  const [tab, setTab] = useState<Tab>("Bras & tops");
  const [flipped, setFlipped] = useState(-1); // the tag turned over by a tap / click / key
  const flip = (i: number) => setFlipped((f) => (f === i ? -1 : i));
  // null until the WebGL tags report in; true once they're up (the HTML tags then stay for screen readers only). The tags
  // only build as the section nears, but wherever WebGL can run their room is held from the first paint (the `webgl`
  // class, layout.tsx), so the section never changes height under someone scrolling — or jumping to an anchor — past it.
  // If they then can't start, `no-3d` gives the room back to the HTML tags.
  const [ready3d, setReady3d] = useState<boolean | null>(null);
  const has3d = ready3d === true;
  const tags3d = useMemo(
    () =>
      guides[tab].map((lines, i) => ({
        size: SIZES[i],
        lines,
        tease: TEASE[i],
      })),
    [tab],
  );

  return (
    <section id="size-guide" className="section size">
      {/* a measuring tape ribbon running across the top of the section — it glides sideways as you scroll */}
      <div className="tape" aria-hidden="true">
        <div className="tape-track">
          {Array.from({ length: 50 }, (_, i) => (
            <span key={i}>{(i + 1) * 10}</span>
          ))}
        </div>
      </div>

      <div className="container size-layout">
        <div className="size-visual" data-reveal>
          <div className="media size-media">
            <Image
              quality={90}
              src={sizeImg}
              alt="Model in pearl-strand lingerie pulling a blush measuring tape around her waist"
              fill
              placeholder="blur"
              sizes="(min-width: 901px) 900px, (min-width: 601px) 520px, 90vw"
            />
          </div>
        </div>

        <div className="size-main">
          <div data-reveal>
            <p className="eyebrow">Size guide</p>
            <h2 className="h2">
              Fitted to <em>every inch of you</em>
            </h2>
            <p className="size-lede">
              Wrap a soft tape around every curve, slowly, and find the tag
              that’s been waiting to be pulled off you. Touch one to turn it
              over.
            </p>
          </div>

          <div
            className="tabs"
            role="tablist"
            aria-label="Size guide category"
            data-reveal
          >
            {(Object.keys(guides) as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "is-active" : ""}
                onClick={() => {
                  setTab(t);
                  setFlipped(-1);
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div
            className={`size-tags-stage ${ready3d === false ? "no-3d" : ""} ${has3d ? "has-3d" : ""}`}
            role="tabpanel"
            aria-label={`${tab} sizes, body measurements in cm`}
          >
            <SizeTags3D tags={tags3d} onReady={setReady3d} />
            <p className="tags3d-hint" aria-hidden="true">
              ← Swipe along the cord →
            </p>
            <ul className="size-tags">
              {guides[tab].map((lines, i) => (
                <li
                  key={`${tab}-${SIZES[i]}`}
                  className={`tag3d ${flipped === i ? "is-flipped" : ""}`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div
                    className="tag3d-swing"
                    role="button"
                    tabIndex={0}
                    aria-pressed={flipped === i}
                    onClick={() => flip(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        flip(i);
                      }
                    }}
                  >
                    <div className="tag3d-card">
                      <div className="tag3d-face tag3d-front">
                        <strong>{SIZES[i]}</strong>
                        <dl>
                          {lines.map(([k, v]) => (
                            <div key={k}>
                              <dt>{k}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div className="tag3d-face tag3d-back" aria-hidden="true">
                        <span className="tag3d-brand">Lusted</span>
                        <strong>{SIZES[i]}</strong>
                        <p>{TEASE[i]}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <TapeGuide />
          <p className="size-note">
            All measurements in cm. Torn between two? Go up one —{" "}
            <a
              href={whatsappLink("Hi Lusted! Could you help me with sizing?")}
              target="_blank"
              rel="noopener noreferrer"
            >
              or let us whisper the answer <ArrowRight />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
