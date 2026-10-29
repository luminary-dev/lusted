"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
const sizeImg = img("images/size-guide.webp");
import { whatsappLink } from "@/lib/site";
import { ArrowRight } from "./icons";
import SizeTags3D from "./SizeTags3D";
import TapeGuide from "./TapeGuide";
import { img } from "@/lib/cdn";
import { SIZES, guides, type GuideTab } from "@/lib/sizing";

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
type Tab = GuideTab;


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
              data-wa-source="size-guide"
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
