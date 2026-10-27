import type { Metadata } from "next";
import Link from "next/link";
import HeroSlides, { type HeroSlide } from "@/components/HeroSlides";
import SlideCue from "@/components/SlideCue";
import { ArrowRight } from "@/components/icons";
import { img } from "@/lib/cdn";

export const metadata: Metadata = {
  title: "Nothing on here — Lusted",
};

// Any address that isn't a page — and any piece no longer in the catalogue (src/proxy.ts sends those here with a
// 404). The one page where the site is allowed to be as forward as it likes: whoever lands here was looking for
// something, and every photo is a wrong door, opened — the two of them somewhere they have no business being. The
// photos play as a slideshow (HeroSlides, the hero's iris transition) and the arrowhead moves it on. Each photo holds
// its models on the right, so the words sit on the dark left; phones and portrait tablets get a 3:4 cut centred on
// the models with the words over the bottom. `pos` is the wide photo's focal point on a laptop (the hair sits near the top
// edge, so the top is kept); `posMobile` is used below 900 px — it crops the wide photo to the models on tablets, and keeps them at the top of the phone cut.
const slides: HeroSlide[] = [
  {
    src: img("images/404/the-suite.webp"),
    phone: img("images/404/the-suite-phone.webp"),
    alt: "Two models in the doorway of a candlelit hotel suite, one in bottle-green lace held from behind by the other in a butter-yellow silk slip",
    pos: "88% 0%",
    posMobile: "72% 0%",
  },
  {
    src: img("images/404/the-lift.webp"),
    phone: img("images/404/the-lift-phone.webp"),
    alt: "Two models still wet from the pool, in a teal chrome bikini and a pearl-strung crochet bikini, pressed together in a velvet hotel lift",
    pos: "90% 0%",
    posMobile: "80% 0%",
  },
  {
    src: img("images/404/the-library.webp"),
    phone: img("images/404/the-library-phone.webp"),
    alt: "Two models at the brass ladder of a candlelit library, one in chocolate latex and pearls on the rungs, the other in a raspberry orchid bodysuit looking up at her",
    pos: "90% 0%",
    posMobile: "78% 0%",
  },
  {
    src: img("images/404/the-kitchen.webp"),
    phone: img("images/404/the-kitchen-phone.webp"),
    alt: "Two models in a hotel kitchen at 3 am, one in a currant-red satin gown on the steel counter, the other in a silver mirror-disc dress holding a forkful of cake between them",
    pos: "90% 0%",
    posMobile: "78% 0%",
  },
  {
    src: img("images/404/the-pool.webp"),
    phone: img("images/404/the-pool-phone.webp"),
    alt: "Two models hip-deep in a turquoise indoor pool at night, holding each other, in a midnight-blue wet-look gown and a liquid-gold mini dress",
    pos: "85% 0%",
    posMobile: "74% 0%",
  },
  {
    src: img("images/404/the-lobby.webp"),
    phone: img("images/404/the-lobby-phone.webp"),
    alt: "Two models at a hotel reception desk at 4 am, one in an apricot crystal-mesh dress on the brass counter, the other in a black patent harness set between her knees",
    pos: "88% 0%",
    posMobile: "76% 0%",
  },
  {
    src: img("images/404/the-cellar.webp"),
    phone: img("images/404/the-cellar-phone.webp"),
    alt: "Two models against the bottle racks of a candlelit wine cellar, in a rose-gold cage monokini and a lilac tulle bustier set",
    pos: "88% 0%",
    posMobile: "76% 0%",
  },
];

export default function NotFound() {
  return (
    <main className="lost">
      <div className="lost-photo" aria-hidden="true">
        <HeroSlides slides={slides} band="lost" phoneUpTo={900} />
      </div>
      <div className="container lost-inner">
        <div className="lost-copy">
          <p className="lost-code" aria-hidden="true">
            404
          </p>
          <p className="eyebrow lost-eyebrow" data-reveal>
            Page not found<span className="lost-eyebrow-more">· nothing on underneath</span>
          </p>
          <h1 className="h1 lost-title" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            Caught you looking, <em>you naughty thing</em>
          </h1>
          <div className="lost-lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
            <p>There’s nothing under this one. We took it all off.</p>
            <p>Whatever you came for, we have something wickeder — lace that doesn’t stay on, strings that barely try.</p>
            <p className="lost-invite">Come and get undressed.</p>
          </div>
          <div className="lost-actions" data-reveal style={{ "--d": "0.3s" } as React.CSSProperties}>
            <Link href="/products" className="btn btn-light">
              Show me everything <ArrowRight className="arrow" />
            </Link>
            <Link href="/" className="lost-home">
              Take me back to bed
            </Link>
          </div>
        </div>
      </div>
      <SlideCue band="lost" label="Next photo" />
    </main>
  );
}
