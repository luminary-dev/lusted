import { howSlides } from "@/lib/how-slides";
import { whatsappLink } from "@/lib/site";
import HowSlides from "./HowSlides";
import SlideCue from "./SlideCue";
import { ArrowRight } from "./icons";

// the phone cuts only lend their srcset (the blur placeholder is the wide photo's), so their blur data stays here
const slides = howSlides.map((s) => ({ ...s, phone: { ...s.phone, blurDataURL: undefined } }));

const steps = [
  { title: "Pick your poison", text: "Lingerie, swim, after dark — heart everything you want to be seen in, and everything you’d rather be seen out of." },
  {
    title: "Message us your sins",
    text: "Send us your bag in one message. A real person confirms your size, the price and that it’s here — and never asks who it’s for.",
  },
  { title: "It turns up looking boring", text: "Pay securely, and it arrives in a plain box with nothing on the outside. What’s inside is between you and whoever you decide to show." },
];

// Full-width 16:9 campaign photos (src/lib/how-slides.ts) with the models on the left, slowly changing over
// (HowSlides.tsx); the heading, steps and button sit over the soft, dark right-hand side.
export default function HowItWorks() {
  return (
    <section id="ordering" className="section how">
      <div className="how-media">
        <HowSlides slides={slides} />
      </div>
      <div className="container how-inner">
        <div className="how-copy" data-reveal>
          <p className="eyebrow">How it goes down</p>
          <h2 className="h2">
            Easier than <em>undressing</em>
          </h2>
          <p className="how-lede">No accounts, no forms, no strangers watching — just three steps and a real person who keeps your secrets.</p>

          <ol className="how-steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="how-num">0{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <a className="btn btn-light" data-wa-source="how-it-works" href={whatsappLink("Hi Lusted! I'd like to place an order.")} target="_blank" rel="noopener noreferrer">
            Start your naughty order <ArrowRight className="arrow" />
          </a>
        </div>
      </div>
      <SlideCue band="how" label="Next photo" />
    </section>
  );
}
