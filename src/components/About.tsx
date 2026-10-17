import Image from "next/image";
import Link from "next/link";
import about from "@/assets/images/about.webp";
import { ArrowRight, Box, Butterfly, Lock } from "./icons";

const values = [
  {
    icon: Box,
    title: "Discreet packaging",
    text: "Every order ships in plain, unbranded packaging — no mention of Lusted on the outside.",
  },
  {
    icon: Lock,
    title: "Private & secure ordering",
    text: "Your details are encrypted and only ever used for your order. Your trust means everything.",
  },
  {
    icon: Butterfly,
    title: "Thoughtful fabrics & craftsmanship",
    text: "Premium fabrics and skilled makers, for pieces that feel as exquisite as they look.",
  },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container about-grid">
        <div className="media about-media" data-reveal>
          <Image quality={90} src={about} alt="Blush lace bra and brief on satin beside roses, pearls and a candle" fill placeholder="blur" sizes="(min-width: 900px) 50vw, 100vw" />
        </div>

        <div className="about-copy">
          <div data-reveal>
            <p className="eyebrow">About us</p>
            <h2 className="h2">
              Made for confidence, <em>designed with care.</em>
            </h2>
            <p className="lede">
              At Lusted, we believe lingerie is more than what you wear — it’s how you feel. Our collections celebrate every version of you, with
              luxurious fabrics, flattering fits, and details that make you feel confident, comfortable, and undeniably feminine.
            </p>
            <p className="lede">Everyday comfort with a touch of indulgence — because you deserve to feel beautiful, always.</p>
            <Link href="/about" className="btn btn-ghost about-more">
              Read our story <ArrowRight className="arrow" />
            </Link>
          </div>

          <ul className="values">
            {values.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="value" data-reveal style={{ "--d": `${0.1 + i * 0.08}s` } as React.CSSProperties}>
                <span className="value-icon">
                  <Icon />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
