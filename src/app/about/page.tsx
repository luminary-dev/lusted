import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import about from "@/assets/images/about.webp";
import packaging from "@/assets/images/packaging.webp";
import lingerie from "@/assets/images/collection-lingerie.webp";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Box, Butterfly, ChatDouble, Heart, Lock, Sparkle } from "@/components/icons";

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

const promises = [
  { icon: Box, text: "Plain, unbranded packaging" },
  { icon: Sparkle, text: "Personal sizing advice" },
  { icon: Lock, text: "Private, secure ordering" },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="container">
        <header className="about-hero">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>About us</span>
          </nav>
          <p className="eyebrow">About us</p>
          <h1 className="h1">
            Made for confidence, <em>designed with care.</em>
          </h1>
          <p className="lede">
            Lusted began with a simple belief: lingerie is more than what you wear — it’s how you feel. We create pieces that celebrate every version of
            you, from everyday comfort to a little more daring after dark.
          </p>
        </header>

        <div className="media about-page-hero">
          <Image quality={90} src={about} alt="Blush lace bra and brief on satin beside roses, pearls and a candle" fill preload placeholder="blur" sizes="(min-width: 1400px) 1320px, 100vw" />
        </div>

        <section className="about-story">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="h2">
              From the first sketch <em>to the final stitch.</em>
            </h2>
          </div>
          <div className="about-story-copy">
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

        <section className="about-values-grid">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="about-value" data-reveal>
              <span className="value-icon">
                <Icon />
              </span>
              <h3 className="h3">{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <section className="about-split">
          <div className="media">
            <Image quality={90} src={lingerie} alt="Blush floral lace set on a brass hanger by sheer curtains" fill placeholder="blur" sizes="(min-width: 900px) 30vw, 50vw" />
          </div>
          <div className="media">
            <Image quality={90} src={packaging} alt="Blush gift box with tissue, satin ribbon and a pink rose" fill placeholder="blur" sizes="(min-width: 900px) 30vw, 50vw" />
          </div>
          <div className="about-split-copy">
            <p className="eyebrow">How we work</p>
            <h2 className="h2">
              Personal, private <em>and unhurried.</em>
            </h2>
            <p className="lede">Browse the collection, send us your picks, and we’ll take care of the rest — from fit to doorstep.</p>
            <ul className="pdp-perks">
              {promises.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon /> {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="about-cta">
          <h2 className="h2">
            Find your <em>next favourite.</em>
          </h2>
          <div>
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
