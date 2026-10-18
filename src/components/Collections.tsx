import Image from "next/image";
import Link from "next/link";
import lingerie from "@/assets/images/cat-lingerie.webp";
import swim from "@/assets/images/cat-swim.webp";
import afterDark from "@/assets/images/cat-after-dark.webp";
import { categories, type Category } from "@/lib/products";
import { ArrowRight, Heart, Moon, Sun } from "./icons";

// Card art and wording; each collection's name, tagline and category label come from `categories`
// in src/lib/products.ts (shared with the footer).
const art: {
  cat: Category;
  badge: string;
  Icon: typeof Heart;
  cta: string;
  img: typeof lingerie;
  alt: string;
}[] = [
  {
    cat: "lingerie",
    badge: "Boudoir",
    Icon: Heart,
    cta: "Unwrap the lace",
    img: lingerie,
    alt: "Model reclining on blush satin pillows in a pink lace balconette bra and brief",
  },
  {
    cat: "swim",
    badge: "Poolside",
    Icon: Sun,
    cta: "Take the plunge",
    img: swim,
    alt: "Model in an ivory string bikini on a linen daybed by the sea",
  },
  {
    cat: "after-dark",
    badge: "Afterparty",
    Icon: Moon,
    cta: "Steal the night",
    img: afterDark,
    alt: "Model in a black sequin halter mini dress with gold chain cut-outs in a candlelit lounge",
  },
];

const collections = art.map((a) => {
  const c = categories.find((x) => x.key === a.cat)!;
  return { ...a, name: c.label, title: c.name, text: c.tagline };
});

export default function Collections() {
  return (
    <section id="collections" className="section">
      <div className="container">
        <header className="head">
          <div data-reveal>
            <p className="eyebrow">Choose your sin</p>
            <h2 className="h2">
              Pick your <em>pleasure</em>
            </h2>
          </div>
          <div
            className="head-side"
            data-reveal
            style={{ "--d": "0.1s" } as React.CSSProperties}
          >
            <p>Lace for when you want to be unwrapped, strings for when you want to be stared at, and silk for when you’re not going home alone.</p>
            <Link className="btn btn-wine" href="/products">
              Tempt me with everything <ArrowRight className="arrow" />
            </Link>
          </div>
        </header>

        <div className="collections-grid">
          {collections.map((c, i) => (
            <Link
              key={c.cat}
              className="col-card"
              href={`/products?cat=${c.cat}`}
              data-reveal
              style={{ "--d": `${i * 0.1}s` } as React.CSSProperties}
            >
              <Image
                quality={90}
                src={c.img}
                alt={c.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 900px) 30vw, 100vw"
                className="col-card-img"
              />
              <span className="col-badge">
                <c.Icon /> {c.badge}
              </span>

              <div className="col-overlay">
                <h3 className="col-title">{c.title}</h3>
                <p className="col-text">{c.text}</p>
                <span className="col-cta">
                  <span>{c.cta}</span>
                  <span className="col-cta-arrow">
                    <ArrowRight />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
