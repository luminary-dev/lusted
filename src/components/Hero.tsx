import Link from "next/link";
import hero1 from "@/assets/images/hero/hero-1.webp";
import hero2 from "@/assets/images/hero/hero-2.webp";
import hero3 from "@/assets/images/hero/hero-3.webp";
import hero4 from "@/assets/images/hero/hero-4.webp";
import hero5 from "@/assets/images/hero/hero-5.webp";
import hero6 from "@/assets/images/hero/hero-6.webp";
import hero7 from "@/assets/images/hero/hero-7.webp";
import hero8 from "@/assets/images/hero/hero-8.webp";
import hero9 from "@/assets/images/hero/hero-9.webp";
import hero10 from "@/assets/images/hero/hero-10.webp";
import hero11 from "@/assets/images/hero/hero-11.webp";
import hero12 from "@/assets/images/hero/hero-12.webp";
import hero13 from "@/assets/images/hero/hero-13.webp";
import hero14 from "@/assets/images/hero/hero-14.webp";
import hero15 from "@/assets/images/hero/hero-15.webp";
import hero16 from "@/assets/images/hero/hero-16.webp";
import hero17 from "@/assets/images/hero/hero-17.webp";
import hero18 from "@/assets/images/hero/hero-18.webp";
import { categories } from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import HeroSlides, { type HeroSlide } from "./HeroSlides";
import { ArrowRight, WhatsApp } from "./icons";

// Krea 2 campaign images (originals in refs/krea/final/hero). pos / posMobile are the crop focal points
// that keep each face clear of the headline on desktop and centred in frame on phones.
// Ordered so no two neighbouring slides share a colour story (the loop wraps from the last back to the first):
// blush → wine → sea → champagne → candlelit black → sea → blush → black → peach → wine → emerald sea → blue dusk → wine gown → sunlit ivory
// → wine sunset pool → blush bedroom → black sea → wine city night.
const slides: HeroSlide[] = [
  {
    src: hero1,
    alt: "Model reclining on blush satin pillows in a pink lace bra, brief and suspenders",
    pos: "72% 25%",
    posMobile: "84% 25%",
  },
  {
    src: hero4,
    alt: "Model kneeling on a velvet chaise in a wine lace bodysuit with garters",
    pos: "0% 20%",
    posMobile: "50% 20%",
  },
  {
    src: hero9,
    alt: "Model in a crimson string bikini kneeling in the surf at golden hour",
    pos: "0% 20%",
    posMobile: "60% 20%",
  },
  {
    src: hero3,
    alt: "Model in a champagne sequin slip dress on a velvet chaise by candlelight",
    pos: "72% 25%",
    posMobile: "81% 25%",
  },
  {
    src: hero11,
    alt: "Model kneeling on champagne silk sheets by candlelight in a black string harness",
    pos: "72% 20%",
    posMobile: "64% 20%",
  },
  {
    src: hero2,
    alt: "Model in an ivory string bikini on the deck of a yacht at golden hour",
    pos: "72% 25%",
    posMobile: "73% 25%",
  },
  {
    src: hero7,
    alt: "Model by a window in a blush silk robe over a lace bralette",
    pos: "0% 25%",
    posMobile: "63% 25%",
  },
  {
    src: hero8,
    alt: "Model in a sheer black lace bodysuit and chiffon robe on the rim of a marble bathtub by candlelight",
    pos: "72% 20%",
    posMobile: "68% 20%",
  },
  {
    src: hero5,
    alt: "Model in a plunging gold swimsuit at the edge of an infinity pool at sunset",
    pos: "0% 20%",
    posMobile: "66% 20%",
  },
  {
    src: hero6,
    alt: "Model on wine velvet cushions by candlelight in a ruby lace bra",
    pos: "72% 25%",
    posMobile: "72% 25%",
  },
  {
    src: hero12,
    alt: "Model in an emerald micro string bikini on sunlit rocks above a turquoise cove",
    pos: "72% 20%",
    posMobile: "60% 25%",
  },
  {
    src: hero10,
    alt: "Model in an ivory lace bustier, stockings and a flowing chiffon robe on a terrace at dusk",
    pos: "0% 20%",
    posMobile: "52% 20%",
  },
  {
    src: hero14,
    alt: "Model crouching low in a backless wine silk gown slit to the hip in an empty candlelit lounge",
    pos: "60% 20%",
    posMobile: "63% 20%",
  },
  {
    src: hero13,
    alt: "Model in a black fishnet bodystocking lying across an ivory silk bed at golden hour",
    pos: "50% 40%",
    posMobile: "58% 50%",
  },
  {
    src: hero15,
    alt: "Model crouching at the edge of an infinity pool at sunset in a wine patent string bikini",
    pos: "72% 20%",
    posMobile: "67% 20%",
  },
  {
    src: hero17,
    alt: "Model in a blush lace bra, lace skirt and stockings on a velvet chaise in a sunlit bedroom",
    pos: "72% 20%",
    posMobile: "78% 20%",
  },
  {
    src: hero18,
    alt: "Model in a black string bikini on the deck of a yacht at golden hour, looking back over her shoulder",
    pos: "72% 20%",
    posMobile: "72% 20%",
  },
  {
    src: hero16,
    alt: "Model in a wine satin cami and mini skirt leaning on a balcony rail above the city lights at night",
    pos: "72% 20%",
    posMobile: "68% 20%",
  },
];

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
    </section>
  );
}
