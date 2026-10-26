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
  description: "Lusted is lingerie for every version of you — thoughtfully designed, beautifully made, and always delivered discreetly.",
};

const values = [
  { icon: Heart, title: "Every version of you", text: "Lingerie, swim and after-dark pieces for every body, every mood and every moment — never one idea of beautiful." },
  { icon: Butterfly, title: "Thoughtful fabrics", text: "Lined lace, soft satin and silk chosen for how they feel on skin, made by skilled makers to last." },
  { icon: Lock, title: "Private by design", text: "Plain, unbranded packaging and private one-to-one ordering. What you choose stays between us." },
  { icon: ChatDouble, title: "A real person, always", text: "Every order and sizing question is answered by our team on WhatsApp — never a bot." },
];

// how an order goes, start to doorstep
const steps = [
  { icon: Sparkle, title: "Browse and pick", text: "Wander the collection, save what tempts you, and send us your picks whenever you're ready." },
  { icon: ChatDouble, title: "Tell us on WhatsApp", text: "A real person helps with sizing and styling — measure once, and we'll find the fit that flatters." },
  { icon: Box, title: "Delivered in a plain box", text: "Wrapped in tissue, tied with a ribbon, in a box that gives nothing away. Payment and delivery are confirmed with you directly." },
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
              Made for confidence, <em>designed with care.</em>
            </h1>
            <p className="lede">
              Lusted began with a simple belief: lingerie is more than what you wear — it’s how you feel. We create pieces that celebrate every version
              of you, from everyday comfort to a little more daring after dark.
            </p>
          </div>
        </header>

        <section className="about-story">
          <div data-reveal>
            <p className="eyebrow">Our story</p>
            <h2 className="h2">
              From the first sketch <em>to the final stitch.</em>
            </h2>
            <blockquote className="about-quote">“Lingerie is more than what you wear. It’s how you feel in it.”</blockquote>
          </div>
          <div className="about-story-copy" data-reveal>
            <p className="lede">
              We design every collection around one question: how will it make you feel? That means luxurious fabrics, flattering fits and the small
              details — a satin bow, a scalloped edge, a gold slider — that turn something everyday into something you look forward to wearing.
            </p>
            <p className="lede">
              Shopping for lingerie should feel personal, never awkward. So instead of a faceless checkout, you talk to us. We help you find your size,
              style your pieces and deliver them discreetly to your door.
            </p>
          </div>
        </section>

        <section className="about-values">
          <div className="about-values-head" data-reveal>
            <p className="eyebrow">What we believe</p>
            <h2 className="h2">
              Four things we <em>never compromise on.</em>
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
              Personal, private <em>and unhurried.</em>
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
              Find your <em>next favourite.</em>
            </h2>
          </div>
          <div className="about-cta-actions">
            <Link href="/products" className="btn btn-wine">
              Shop the collection <ArrowRight className="arrow" />
            </Link>
            <a href={whatsappLink("Hi Lusted! I'd love some styling advice.")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Talk to us
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
