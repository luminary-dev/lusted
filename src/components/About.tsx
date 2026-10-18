import Image from "next/image";
import Link from "next/link";
import about from "@/assets/images/about.webp";
import packaging from "@/assets/images/packaging.webp";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Box, ChatDouble, Bolt, Lock } from "./icons";

// About us + "Quick & discreet" in one: who we are, and the four promises behind every order.
const promises = [
  {
    icon: Box,
    title: "A plain, unbranded box",
    text: "Nothing on the outside says Lusted — or what’s waiting inside. Our little secret.",
  },
  {
    icon: ChatDouble,
    title: "Help finding your fit",
    text: "Not sure of your size? Tell us, and we’ll find the one that fits like it was made for you.",
  },
  {
    icon: Bolt,
    title: "A real person, replying fast",
    text: "Every order is handled by one of us — never a bot — usually within minutes.",
  },
  {
    icon: Lock,
    title: "Private, start to finish",
    text: "Your details are only ever used for your order. What you buy stays between us.",
  },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container about-grid">
        <div className="about-visual" data-reveal>
          <div className="media about-media">
            <Image quality={90} src={about} alt="Blush lace bra and brief on satin beside roses, pearls and a candle" fill placeholder="blur" sizes="(min-width: 900px) 50vw, 100vw" />
          </div>
          <div className="media about-inset">
            <Image quality={90} src={packaging} alt="Blush gift box with tissue, satin ribbon and a pink rose" fill placeholder="blur" sizes="(min-width: 900px) 22vw, 45vw" />
          </div>
        </div>

        <div className="about-copy">
          <div data-reveal>
            <p className="eyebrow">About us</p>
            <h2 className="h2">
              Made to tempt, <em>wrapped to keep a secret.</em>
            </h2>
            <p className="lede">
              Lusted is lingerie for the version of you that never asks permission — lace you want to be caught in, satin made to slip, and
              strings that barely bother. Every piece is chosen to make you feel undeniably, dangerously good.
            </p>
            <p className="lede">And because what you wear underneath is nobody’s business, ordering is just as personal and just as private.</p>
          </div>

          <ul className="values values-grid">
            {promises.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="value" data-reveal style={{ "--d": `${0.1 + i * 0.06}s` } as React.CSSProperties}>
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

          <div className="about-actions" data-reveal>
            <a className="btn btn-wine" href={whatsappLink("Hi Lusted! I'd like to place an order.")} target="_blank" rel="noopener noreferrer">
              Start your order <ArrowRight className="arrow" />
            </a>
            <Link href="/about" className="btn btn-ghost">
              Read our story <ArrowRight className="arrow" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
