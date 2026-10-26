import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import silkSheets from "@/assets/images/about-wall/silk-sheets.webp";
import doorway from "@/assets/images/about-wall/doorway.webp";
import velvetChaise from "@/assets/images/about-wall/velvet-chaise.webp";
import theBow from "@/assets/images/about-wall/the-bow.webp";
import windowShot from "@/assets/images/about-wall/window.webp";
import pearls from "@/assets/images/about-wall/pearls.webp";
import poolside from "@/assets/images/about-wall/poolside.webp";
import { whatsappLink } from "@/lib/site";
import PhotoWall from "./PhotoWall";
import { ArrowRight, Box, ChatDouble, Bolt, Lock } from "./icons";

// About us as a photo wall: real prints taped to the wall, in two rows, beside a short story and the four promises.
const promises = [
  { icon: Box, title: "A plain box — no one has to know" },
  { icon: ChatDouble, title: "We’ll help it fit just right" },
  { icon: Bolt, title: "A real person, never keeps you waiting" },
  { icon: Lock, title: "Our little secret, start to finish" },
];

// the prints stuck to the wall: each keeps its photo's own shape, a hair off straight (`tilt`, degrees) and a touch
// higher or lower (`lift`, px)
const frames: { src?: StaticImageData; alt: string; pos?: string; tilt: number; lift: number }[] = [
  { src: silkSheets, alt: "Model in black lace and stockings lying on ivory silk sheets", pos: "60% 40%", tilt: -2.4, lift: 6 },
  { src: doorway, alt: "Model in wine lace leaning in a doorway, a sheer robe slipping off her shoulders", pos: "50% 25%", tilt: 1.6, lift: -8 },
  { src: windowShot, alt: "Model at a sunlit window in a blush garter belt and stockings", pos: "50% 30%", tilt: 1.9, lift: -2 },
  { src: velvetChaise, alt: "Model in a scarlet string set across a velvet chaise by candlelight", pos: "35% 50%", tilt: -1.1, lift: 10 },
  { src: poolside, alt: "Model in a sheer white string bikini lying along the edge of an infinity pool at sunset", pos: "65% 50%", tilt: 2.3, lift: -4 },
  { src: theBow, alt: "Close-up of fingers untying a satin bow on a lace thong", tilt: 1.4, lift: -6 },
  { src: pearls, alt: "Close-up of lips holding a strand of pearls, a satin strap slipping off one shoulder", tilt: -2, lift: 8 },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container about-wall-grid">
        <div className="about-copy" data-reveal>
          <p className="eyebrow">About us</p>
          <h2 className="h2">
            Made to be seen, <em>sent to be our secret.</em>
          </h2>
          <p className="lede">
            Lingerie for the nights you plan and the ones you don’t — lace that lingers, silk that slips, strings that barely try. Picked to make you feel wicked, and delivered so quietly no one knows but you (and whoever gets to see it).
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
              Tempt me <ArrowRight className="arrow" />
            </a>
            <Link href="/about" className="btn btn-ghost">
              Read our story <ArrowRight className="arrow" />
            </Link>
          </div>
        </div>

        <PhotoWall label="Lusted, on the wall">
          {/* always two rows: the first four prints, then the last three */}
          {[frames.slice(0, 4), frames.slice(4)].map((row, r) => (
            <div key={r} className="print-row">
              {row.map(({ src, alt, pos, tilt, lift }, j) => {
                const i = r * 4 + j;
                return (
                  <figure
                    key={alt}
                    className={`polaroid ${i % 2 ? "tape-corners" : "tape-top"}`}
                    data-reveal
                    style={{ "--tilt": `${tilt}deg`, "--lift": `${lift}px`, "--d": `${i * 0.06}s`, "--ar": src ? src.width / src.height : 1, "--tape": `${((i * 37) % 9) - 4}deg` } as React.CSSProperties}
                  >
                    <div className="print">
                      <div className={`polaroid-photo ${src ? "" : "is-empty"}`} aria-hidden={!src || undefined}>
                        {src && <Image quality={85} src={src} alt={alt} fill placeholder="blur" sizes="(min-width: 901px) 23vw, 40vw" style={{ objectPosition: pos ?? "50% 50%" }} />}
                      </div>
                    </div>
                    {/* strips of paper tape holding it to the wall */}
                    <span className="print-tape" aria-hidden />
                    <span className="print-tape is-second" aria-hidden />
                  </figure>
                );
              })}
            </div>
          ))}
        </PhotoWall>
      </div>
    </section>
  );
}
