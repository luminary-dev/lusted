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
    eyebrow: "You’ve been staring. Good.",
    title: "Imagine it on. Now imagine it coming off.",
    lead: "Every piece in this reel was cut to be peeled off slowly, by someone who was told to wait and didn’t. Tonight you decide who kneels first.",
    cta: "Undress the whole collection",
  },
  {
    eyebrow: "Pick what you’ll be stripped out of",
    title: "Nothing here stays on past midnight.",
    lead: "Sheer, slit and held on by a single bow that’s begging to be pulled. Choose what you want to be unwrapped from, and let the rest of the night do what it likes with you.",
    cta: "Watch every piece",
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
            The night <em>has plans.</em>
          </h2>
          <p className="lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
            Forty looks for after midnight — sheer, slit and tied with a single bow. Pick the one you&rsquo;ll be
            remembered in.
          </p>
          <div className="after-dark-actions" data-reveal style={{ "--d": "0.3s" } as React.CSSProperties}>
            <Link href="/products?cat=after-dark" className="btn btn-light">
              Steal the night <ArrowRight className="arrow" />
            </Link>
            <Link href="/products" className="after-dark-all">
              See everything
            </Link>
          </div>
        </div>
      </div>

      <AfterDarkReel rows={ROWS} lines={LINES} />
    </section>
  );
}
