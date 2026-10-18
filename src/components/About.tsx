import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import about from "@/assets/images/about.webp";
import packaging from "@/assets/images/packaging.webp";
import rail from "@/assets/images/collection-lingerie.webp";
import catLingerie from "@/assets/images/cat-lingerie.webp";
import catSwim from "@/assets/images/cat-swim.webp";
import catAfterDark from "@/assets/images/cat-after-dark.webp";
import howItWorks from "@/assets/images/how-it-works.webp";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Box, ChatDouble, Bolt, Lock } from "./icons";

// About us as a gallery wall: framed photos hung salon-style beside a short story and the four promises.
const promises = [
  { icon: Box, title: "A plain, unbranded box" },
  { icon: ChatDouble, title: "Help finding your fit" },
  { icon: Bolt, title: "A real person, replying fast" },
  { icon: Lock, title: "Private, start to finish" },
];

// each frame's place on the wall, in % of the wall (x, y, width, height) — hung like a salon wall, not a grid
const frames: { src: StaticImageData; alt: string; at: [number, number, number, number]; pos?: string }[] = [
  { src: catLingerie, alt: "Model in blush lace lingerie", at: [33, 4, 22, 31], pos: "50% 15%" },
  { src: packaging, alt: "Blush gift box with tissue and a rose", at: [58, 8, 17, 23] },
  { src: about, alt: "Blush lace bra and brief on satin with roses and pearls", at: [5, 39, 25, 20] },
  { src: catAfterDark, alt: "Model in an evening look by candlelight", at: [33, 38, 26, 40], pos: "50% 20%" },
  { src: howItWorks, alt: "Three models on a terrace by the sea", at: [62, 34, 33, 24], pos: "20% 30%" },
  { src: catSwim, alt: "Model in a string bikini at golden hour", at: [62, 61, 17, 26], pos: "50% 20%" },
  { src: rail, alt: "Lingerie hanging on a brass rail", at: [11, 62, 19, 25] },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container about-wall-grid">
        <div className="about-copy" data-reveal>
          <p className="eyebrow">About us</p>
          <h2 className="h2">
            Made to tempt, <em>wrapped to keep a secret.</em>
          </h2>
          <p className="lede">
            Lingerie for the version of you that never asks permission — and ordering that’s just as personal, and just as private.
          </p>
          <ul className="about-promises">
            {promises.map(({ icon: Icon, title }) => (
              <li key={title}>
                <Icon />
                {title}
              </li>
            ))}
          </ul>
          <div className="about-actions">
            <a className="btn btn-wine" href={whatsappLink("Hi Lusted! I'd like to place an order.")} target="_blank" rel="noopener noreferrer">
              Start your order <ArrowRight className="arrow" />
            </a>
            <Link href="/about" className="btn btn-ghost">
              Read our story <ArrowRight className="arrow" />
            </Link>
          </div>
        </div>

        <div className="photo-wall" aria-label="Lusted, framed">
          {frames.map(({ src, alt, at: [x, y, w, h], pos }, i) => (
            <figure
              key={alt}
              className="wall-frame"
              data-reveal
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, "--d": `${i * 0.07}s` } as React.CSSProperties}
            >
              <div className="wall-photo">
                <Image quality={85} src={src} alt={alt} fill placeholder="blur" sizes="(min-width: 900px) 20vw, 40vw" style={{ objectPosition: pos ?? "50% 50%" }} />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
