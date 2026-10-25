import { howSlides } from "@/lib/how-slides";
import { whatsappLink } from "@/lib/site";
import HowSlides from "./HowSlides";
import { ArrowRight } from "./icons";

const steps = [
  { title: "Choose your pieces", text: "Browse lingerie, swim and after dark, and save everything that makes your pulse race." },
  {
    title: "Message us your picks",
    text: "Send them to us on WhatsApp — we’ll help you find your perfect fit and confirm price and availability, personally.",
  },
  { title: "Discreet delivery", text: "Pay securely, and your order arrives in plain, unbranded packaging." },
];

// Full-width 16:9 campaign photos (src/lib/how-slides.ts) with the models on the left, slowly changing over
// (HowSlides.tsx); the heading, steps and button sit over the soft, dark right-hand side.
export default function HowItWorks() {
  return (
    <section id="ordering" className="section how">
      <div className="how-media">
        <HowSlides slides={howSlides} />
      </div>
      <div className="container how-inner">
        <div className="how-copy" data-reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="h2">
            From desire <em>to your door</em>
          </h2>
          <p className="how-lede">Three easy, private steps — no accounts, no checkout forms, just us.</p>

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

          <a className="btn btn-light" href={whatsappLink("Hi Lusted! I'd like to place an order.")} target="_blank" rel="noopener noreferrer">
            Start your order <ArrowRight className="arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}
