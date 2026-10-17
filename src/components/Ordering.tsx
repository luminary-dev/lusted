import Image from "next/image";
import packaging from "@/assets/images/packaging.webp";
import { whatsappLink } from "@/lib/site";
import { ArrowRight, Bolt, Box, ChatDouble } from "./icons";

const perks = [
  { icon: ChatDouble, title: "Personal sizing support", text: "Not sure about your size? Our team will help you find your perfect fit." },
  { icon: Bolt, title: "Fast responses", text: "We typically reply within minutes during business hours." },
  { icon: Box, title: "Plain, unbranded packaging", text: "Nothing on the outside gives away what’s inside." },
];

// "Here for you, every step": personal service and discreet packaging. The steps live in HowItWorks.tsx.
export default function Ordering() {
  return (
    <section id="care" className="section care">
      <div className="container">
        <div className="ordering-feature">
          <div className="media" data-reveal>
            <Image quality={90} src={packaging} alt="Blush gift box with tissue, satin ribbon and a pink rose" fill placeholder="blur" sizes="(min-width: 900px) 45vw, 100vw" />
          </div>
          <div data-reveal>
            <p className="eyebrow">Quick &amp; discreet</p>
            <h2 className="h2">
              Here for you, <em>every step.</em>
            </h2>
            <p className="lede">Shopping lingerie should feel personal and private. That’s why every order is handled by a real person — never a bot.</p>
            <ul className="perks">
              {perks.map(({ icon: Icon, title, text }) => (
                <li key={title} className="perk">
                  <span className="perk-icon">
                    <Icon />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a className="btn btn-wine" href={whatsappLink("Hi Lusted! I'd like to place an order.")} target="_blank" rel="noopener noreferrer">
              Start your order <ArrowRight className="arrow" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
