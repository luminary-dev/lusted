import Link from "next/link";
import { afterDarkSlides } from "@/lib/hero-slides";
import AfterDarkReel, { type ReelLine } from "./AfterDarkReel";
import { ArrowRight } from "./icons";

// The After Dark band in the middle of the home page: a centred headline over two rows of campaign photos laid out
// like two strips of film that keep gliding past, each frame a tall crop centred on the model, the top row leftwards and
// the bottom row rightwards, so every frame comes round (CSS marquee, see .strip in globals.css; hover pauses it).
// Tapping a frame opens its row as a full-screen reel over the blurred page (AfterDarkReel.tsx).
// Nothing here is shared with the hero at the top: its own photos (hero/after-dark), its own layout, no slideshow.
const HALF = Math.ceil(afterDarkSlides.length / 2);
const ROWS = [afterDarkSlides.slice(0, HALF), afterDarkSlides.slice(HALF)];

// What the reel says under each row once it is opened (AfterDarkReel.tsx)
const LINES: ReelLine[] = [
  {
    eyebrow: "Staring is encouraged",
    title: "Picture it on you. Now picture it on the floor.",
    lead: "Every frame here is a piece made for an audience of one — sheer where it counts, loose where it needs to be, and very quick to lose. You set the pace tonight. They’ll keep up.",
    cta: "Raid the whole collection",
  },
  {
    eyebrow: "Choose your undoing",
    title: "None of this survives the night.",
    lead: "Sheer panels, thigh-high slits and single bows that are one tug from giving up. Pick the one you want to be peeled out of, then let the night get as greedy as you like.",
    cta: "Browse every bad idea",
  },
];

export default function AfterDark() {
  return (
    <section id="after-dark" className="after-dark" aria-labelledby="after-dark-title">
      <div className="container">
        <div className="after-dark-head">
          <p className="eyebrow center" data-reveal>
            After dark
          </p>
          <h2 id="after-dark-title" className="h2" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            Lights off, <em>hems up.</em>
          </h2>
          <p className="lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
            Forty looks for the hours nobody posts — sheer, slit to there, one bow from falling. Pick the one
            they&rsquo;ll replay at breakfast.
          </p>
          <div className="after-dark-actions" data-reveal style={{ "--d": "0.3s" } as React.CSSProperties}>
            <Link href="/products?cat=after-dark" className="btn btn-light">
              Shop for trouble <ArrowRight className="arrow" />
            </Link>
            <Link href="/products" className="after-dark-all">
              Or see it all
            </Link>
          </div>
        </div>
      </div>

      <AfterDarkReel rows={ROWS} lines={LINES} />
    </section>
  );
}
