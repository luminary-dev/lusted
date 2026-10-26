import Link from "next/link";
import { categories } from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import { heroSlides } from "@/lib/hero-slides";
import HeroSlides from "./HeroSlides";
import ScrollCue from "./ScrollCue";
import { ArrowRight, WhatsApp } from "./icons";

// The phone cuts only lend their srcset to the slideshow (the blur placeholder is the wide photo's), so their blur
// data isn't sent to the browser — 27 of them would be ~12 KB of page for nothing.
const slides = heroSlides.map((s) => (s.phone ? { ...s, phone: { ...s.phone, blurDataURL: undefined } } : s));

export default function Hero() {
  return (
    <section id="top" className="hero">
      <HeroSlides slides={slides} />
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow" data-reveal>
            {categories.map((c) => c.name).join(" · ")}
          </p>
          <h1
            className="h1"
            data-reveal
            style={{ "--d": "0.1s" } as React.CSSProperties}
          >
            Dressed to tempt. <em>Made to be undone.</em>
          </h1>
          <p
            className="lede"
            data-reveal
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            Barely-there lace, sun-kissed strings and midnight silk — for the
            version of you that never asks permission.
          </p>
          <div
            className="hero-actions"
            data-reveal
            style={{ "--d": "0.3s" } as React.CSSProperties}
          >
            <Link href="/products" className="btn btn-light">
              Find your temptation <ArrowRight className="arrow" />
            </Link>
            <a
              href={whatsappLink(
                "Hi Lusted! I'd love some help finding the right piece.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-story"
            >
              <WhatsApp /> Whisper to us
            </a>
          </div>
        </div>
      </div>
      <ScrollCue href="/#sale" label="Scroll down to the bikini sale" />
    </section>
  );
}
