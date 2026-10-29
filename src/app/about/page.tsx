import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
const dressingRoom = img("images/about-page/dressing-room.webp");
const theParcel = img("images/about-page/the-parcel.webp");
const theFitting = img("images/about-page/the-fitting.webp");
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Box, Butterfly, ChatDouble, Heart, Lock, Sparkle } from "@/components/icons";
import { img } from "@/lib/cdn";

export const metadata: Metadata = {
  title: "About us — Lusted",
  description: "Lusted is lingerie made to be looked at and cut to be taken off — designed for the moment someone notices, made to last past it, and delivered so no one knows.",
  alternates: { canonical: "/about" },
};

const values = [
  { icon: Heart, title: "Every mood you’re in", text: "Lingerie, swim and after-dark pieces for the good girl, the bad one, and the one who can’t decide — never one idea of sexy." },
  { icon: Butterfly, title: "Fabric that feels like skin", text: "Lined lace, satin and silk chosen for how they feel under a hand — made to be pulled at, and to survive it." },
  { icon: Lock, title: "Nobody has to know", text: "A plain, unbranded box and private one-to-one ordering. What you wear, and for whom, stays between us." },
  { icon: ChatDouble, title: "A real person, no blushing", text: "Every order and every sizing question is answered by our team on WhatsApp — never a bot, never a judgement." },
];

// how an order goes, start to doorstep
const steps = [
  { icon: Sparkle, title: "Pick what you’ll be found in", text: "Wander the collection, save what makes you want to be seen, and send us your picks when you’re ready — or when you can’t wait." },
  { icon: ChatDouble, title: "Whisper it to us", text: "A real person helps with sizing and styling — measure once, and we’ll find the fit that makes it hard to look away." },
  { icon: Box, title: "Arrives looking innocent", text: "Tissue, a ribbon, and a box that gives nothing away. Payment and delivery are confirmed with you directly, and quietly." },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="container">
        {/* the opener: the dressing-room photo, the headline over its quiet left side */}
        <header className="about-hero">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>About us</span>
          </nav>
          <div className="about-hero-photo">
            <Image
              quality={90}
              src={dressingRoom}
              alt="Model in a champagne silk slip fallen open over ivory lace, lifting her hair before a gilt mirror in a sunlit dressing room"
              fill
              preload
              placeholder="blur"
              sizes="(min-width: 1467px) 1320px, (min-width: 901px) 90vw, 158vw"
            />
          </div>
          <div className="about-hero-copy">
            <p className="eyebrow">About us</p>
            <h1 className="h1">
              Made to be looked at. <em>Cut to be taken off.</em>
            </h1>
            <p className="lede">
              Lusted started with one filthy little truth: lingerie isn’t about what you wear. It’s about what happens once someone notices it. Every
              piece we make is for that moment — the slow look, the hand on the strap, the lights left on.
            </p>
          </div>
        </header>

        <section className="about-story">
          <div data-reveal>
            <p className="eyebrow">Our story</p>
            <h2 className="h2">
              From the first sketch <em>to the last thing to come off.</em>
            </h2>
            <blockquote className="about-quote">“Lingerie isn’t what you wear. It’s what you want done about it.”</blockquote>
          </div>
          <div className="about-story-copy" data-reveal>
            <p className="lede">
              We design every piece around one question: what will it make them do? That means fabric that feels like skin, cuts that show exactly
              what you decide to show, and the small details — a bow, a ring, a single hook — put precisely where fingers go first.
            </p>
            <p className="lede">
              Buying it shouldn’t feel like a checkout. It should feel like telling someone what you like. So you talk to us: we find your size, we
              tell you what it’ll do on you, and we get it to your door looking like nothing at all.
            </p>
          </div>
        </section>

        <section className="about-values">
          <div className="about-values-head" data-reveal>
            <p className="eyebrow">What we believe</p>
            <h2 className="h2">
              Four things we <em>won’t take off.</em>
            </h2>
          </div>
          <ul className="about-values-list">
            {values.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="about-value" data-reveal style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
                <span className="value-icon">
                  <Icon />
                </span>
                <h3 className="h3">{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* how we work: two prints taped up beside the three steps */}
        <section className="about-how">
          <div className="about-prints" data-reveal>
            <figure className="about-print is-left">
              <span className="about-tape" aria-hidden />
              <div className="about-print-photo">
                <Image
                  quality={90}
                  src={theParcel}
                  alt="Model kneeling on silk sheets in a blush satin robe, lifting a lace bra from the tissue in a plain box"
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1450px) 335px, (min-width: 901px) 23vw, (min-width: 601px) 300px, 51vw"
                  style={{ objectPosition: "50% 40%" }}
                />
              </div>
              <figcaption>the parcel</figcaption>
            </figure>
            <figure className="about-print is-right">
              <span className="about-tape" aria-hidden />
              <div className="about-print-photo">
                <Image
                  quality={90}
                  src={theFitting}
                  alt="Model at a candlelit vanity mirror in a wine lace set with garters, a tailor's measuring tape round her neck, looking back over her shoulder"
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1450px) 335px, (min-width: 901px) 23vw, (min-width: 601px) 300px, 51vw"
                  style={{ objectPosition: "50% 30%" }}
                />
              </div>
              <figcaption>the fitting</figcaption>
            </figure>
          </div>
          <div className="about-how-copy" data-reveal>
            <p className="eyebrow">How we work</p>
            <h2 className="h2">
              Personal, private, <em>and in no hurry at all.</em>
            </h2>
            <ol className="about-steps">
              {steps.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="value-icon">
                    <Icon />
                  </span>
                  <div>
                    <h3 className="h3">{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-cta" data-reveal>
          <div className="about-cta-copy">
            <p className="eyebrow">Ready when you are</p>
            <h2 className="h2">
              Find your <em>next weakness.</em>
            </h2>
          </div>
          <div className="about-cta-actions">
            <Link href="/products" className="btn btn-wine">
              Show me everything <ArrowRight className="arrow" />
            </Link>
            <a href={whatsappLink("Hi Lusted! I'd love some styling advice.")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" data-wa-source="about-page">
              Whisper to us
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
