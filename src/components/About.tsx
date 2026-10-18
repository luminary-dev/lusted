import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import silkSheets from "@/assets/images/about-wall/silk-sheets.webp";
import doorway from "@/assets/images/about-wall/doorway.webp";
import velvetChaise from "@/assets/images/about-wall/velvet-chaise.webp";
import theBow from "@/assets/images/about-wall/the-bow.webp";
import windowShot from "@/assets/images/about-wall/window.webp";
import pearls from "@/assets/images/about-wall/pearls.webp";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Box, ChatDouble, Bolt, Lock } from "./icons";

// About us as a gallery wall: framed photos hung salon-style beside a short story and the four promises.
const promises = [
  { icon: Box, title: "A plain, unbranded box" },
  { icon: ChatDouble, title: "Help finding your fit" },
  { icon: Bolt, title: "A real person, replying fast" },
  { icon: Lock, title: "Private, start to finish" },
];

// each frame's place on the wall, in % of the wall (x, y, width, height) — every photo a different shape and size,
// hung like a salon wall rather than a grid (the wall is 100 × 66, so a frame's height % = its width ÷ aspect × 100/66)
const frames: { src?: StaticImageData; alt: string; at: [number, number, number, number]; pos?: string }[] = [
  // an empty frame waiting for the poolside shot (2:1)
  { alt: "Empty frame", at: [0, 6.8, 22, 16.7] },
  { src: doorway, alt: "Model in wine lace leaning in a doorway, a sheer robe slipping off her shoulders", at: [0, 27, 22, 50], pos: "50% 30%" },
  { src: silkSheets, alt: "Model in black lace and stockings lying on ivory silk sheets", at: [24.5, 6, 28, 52] },
  { src: velvetChaise, alt: "Model in a scarlet string set across a velvet chaise by candlelight", at: [55, 15, 40, 33] },
  { src: theBow, alt: "Close-up of fingers untying a satin bow on a lace thong", at: [24.5, 62, 20, 30] },
  { src: pearls, alt: "Close-up of lips holding a strand of pearls, a satin strap slipping off one shoulder", at: [47, 62, 14, 21] },
  { src: windowShot, alt: "Model at a sunlit window in a blush garter belt and stockings", at: [63.5, 52, 22, 44], pos: "50% 25%" },
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
              <div className={`wall-photo ${src ? "" : "is-empty"}`} aria-hidden={!src || undefined}>
                {src && <Image quality={85} src={src} alt={alt} fill placeholder="blur" sizes="(min-width: 900px) 20vw, 40vw" style={{ objectPosition: pos ?? "50% 50%" }} />}
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
