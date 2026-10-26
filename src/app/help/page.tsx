import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import DeckSizer from "@/components/DeckSizer";
import { ArrowRight } from "@/components/icons";
import { img } from "@/lib/cdn";
import { emailLink, instagramLink, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pillow talk — delivery, returns & FAQ — Lusted",
  description:
    "How ordering on WhatsApp works, paying, the plain box at your door, 7-day exchanges and finding your size — every question you'd ask after, answered before.",
  alternates: { canonical: "/help" },
};

// The delivery, returns & FAQ page as a deck of cards: pale, big-radius cards piled on a dark ground, one chapter per card, each with one model cut out on the card and the words wherever she leaves room — a
// different arrangement on every card. Every answer restates the terms (/terms) — keep the two in step. Anything not
// decided there (delivery times, fees, payment methods) is confirmed with the customer on WhatsApp, and the answers say
// so rather than promise it.
//
// PHOTOS: the chapter models are cut-outs (transparent webp, trimmed to her outline) from the "Pillow talk" renders
// (about-wall/help-prompt.txt, HELP-1…6, shot on a plain backdrop and cut out with rembg), so the card colour and where
// she stands are CSS. The opener and the closing card are the wide photos (HELP-0 and HELP-7); --pos and --pos-m are
// where she is in each, the focal point on a laptop and on a phone.
const photos = {
  opener: img("images/help/pillow-talk.webp"),
  ordering: img("images/help/how-to-have-us.webp"),
  payment: img("images/help/payment.webp"),
  delivery: img("images/help/delivery.webp"),
  returns: img("images/help/second-thoughts.webp"),
  sizing: img("images/help/sizing.webp"),
  privacy: img("images/help/between-us.webp"),
  closing: img("images/help/still-wondering.webp"),
};

type Qa = { q: string; a: ReactNode };

// where she stands and where the words go — see .help-card[data-layout] in globals.css
type Layout = "right" | "left" | "split" | "corner" | "left-low" | "right-high";

type Chapter = {
  id: string;
  title: ReactNode;
  tease: string;
  layout: Layout;
  paper: string; // the card's colour
  splitAt?: number; // on a two-column card, how many questions go in the first column (half by default)
  photo: { src: ReturnType<typeof img>; alt: string };
  items: Qa[];
};

const ask = (text: string) => whatsappLink(`Hi Lusted! ${text}`);

const chapters: Chapter[] = [
  {
    id: "ordering",
    title: (
      <>
        How to <em>have us</em>
      </>
    ),
    tease: "No checkout. No forms. Just you, one message, and someone on the other end who wants you to have it.",
    layout: "right",
    paper: "#f8f1ec",
    photo: {
      src: photos.ordering,
      alt: "Model in a cherry-red satin teddy and stockings, sitting with one knee up, typing her order on her phone and glancing up over it",
    },
    items: [
      {
        q: "How do I get my hands on something?",
        a: (
          <p>
            Fill your bag with everything you want and tap <strong>Send order on WhatsApp</strong> — or tap <strong>Order now on WhatsApp</strong> on
            the one piece you can’t stop looking at. It reaches us as a single message. A real person reads it, checks the piece is here and the size
            is right for you, and your order is confirmed the moment that’s done and payment is in.
          </p>
        ),
      },
      {
        q: "Can I just slide into your messages?",
        a: (
          <p>
            Please do. Tell us what you want on <a href={ask("I'd like to place an order.")}>WhatsApp</a>, on <a href={instagramLink}>Instagram</a> or
            at <a href={emailLink}>{site.email}</a> — the pieces, the sizes, the colours — and we’ll take it from there.
          </p>
        ),
      },
      {
        q: "How fast will you come back to me?",
        a: (
          <p>
            {site.responseTime} We’re around {site.hours}, and we don’t like keeping anyone waiting.
          </p>
        ),
      },
      {
        q: "What if the one I want is already taken?",
        a: (
          <p>
            We’ll tell you before anything is confirmed, and help you find the next thing to want. If we ever have to cancel an order, every rupee
            comes straight back to you.
          </p>
        ),
      },
    ],
  },
  {
    id: "payment",
    title: (
      <>
        Settling <em>up</em>
      </>
    ),
    tease: "The one unsexy moment of the whole affair. We keep it quick, so you can get back to the rest.",
    layout: "left",
    paper: "#f5ead9",
    photo: {
      src: photos.payment,
      alt: "Model standing in a liquid-gold chain-strap slip and gold stilettos, a black card held between two fingers to her lips",
    },
    items: [
      {
        q: "How do I pay you?",
        a: <p>When we confirm your order on WhatsApp we share secure ways to pay. Pick one, and it’s done.</p>,
      },
      {
        q: "What currency are the prices in?",
        a: <p>Sri Lankan rupees (LKR), with applicable taxes included unless we say otherwise. Nothing is added at the end.</p>,
      },
      {
        q: "Is there a delivery charge?",
        a: <p>Sometimes, depending on where you are — and you’ll always know before you pay, never after.</p>,
      },
      {
        q: "Do sale prices last?",
        a: <p>Only while stocks last. They can’t be put on an order that’s already placed — so if you want it, say so.</p>,
      },
    ],
  },
  {
    id: "delivery",
    title: (
      <>
        The plain <em>box</em>
      </>
    ),
    tease: "It arrives looking like nothing at all. Then you open it.",
    layout: "split",
    paper: "#f3e1da",
    splitAt: 4,
    photo: {
      src: photos.delivery,
      alt: "Model standing in a champagne silk robe fallen open over lavender lace, a plain brown box in her arms with its lid lifted an inch",
    },
    items: [
      {
        q: "Where will you come to?",
        a: <p>Anywhere in Sri Lanka.</p>,
      },
      {
        q: "How long will you make me wait?",
        a: <p>That depends on where you are. We confirm your estimated delivery time with your order — and we’re as impatient about it as you are.</p>,
      },
      {
        q: "Will anyone know what’s inside?",
        a: (
          <p>
            No. Every order goes out in a plain, unbranded box — tissue and ribbon inside, nothing on the outside that gives it away. Whoever signs
            for it will think it’s something dull. It isn’t. It stays our little secret.
          </p>
        ),
      },
      {
        q: "What do you need from me?",
        a: (
          <p>
            Your delivery address and a number the courier can reach you on. Check both twice — we can’t be responsible for delays caused by details
            that weren’t quite right.
          </p>
        ),
      },
      {
        q: "Can it go to someone else?",
        a: (
          <p>
            Of course — a gift, or to work, or wherever you’d rather it turned up. Give us their address and a number they’ll answer. The box gives
            nothing away either way.
          </p>
        ),
      },
      {
        q: "What if I’m not in?",
        a: (
          <p>
            The courier calls the number you gave us. If you’d rather it went to a neighbour, your office or a different day, tell us when you
            order and we’ll arrange what we can.
          </p>
        ),
      },
      {
        q: "Will I know when it’s coming?",
        a: <p>Yes. We tell you on WhatsApp the moment it’s on its way, and you can ask us where it is any time after that.</p>,
      },
      {
        q: "Does it come wrapped?",
        a: (
          <p>
            Inside, yes — tissue, a ribbon, every piece folded the way it should be. Outside, nothing at all. That’s rather the point.
          </p>
        ),
      },
      {
        q: "Can I collect it instead?",
        a: <p>Ask us. Tell us when you order that you’d rather collect, and we’ll see what’s possible where you are.</p>,
      },
      {
        q: "What if the box arrives damaged?",
        a: (
          <p>
            Message us with a photo straight away. If anything inside is the worse for it, we replace it or refund you in full — everything under{" "}
            <a href="#returns">Second thoughts</a>.
          </p>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: (
      <>
        Second <em>thoughts</em>
      </>
    ),
    tease: "Changed your mind? Didn’t fit the way you pictured it? Tell us. We don’t sulk.",
    layout: "corner",
    paper: "#efe6e0",
    photo: {
      src: photos.returns,
      alt: "Model kneeling in an ivory satin corset-bodysuit and stockings, holding a wine lace bra up by its straps as if asking which one",
    },
    items: [
      {
        q: "Can I swap it for something else?",
        a: (
          <>
            <p>
              Yes — within 7 days of delivery. Message us and we’ll arrange it. For hygiene, lingerie, bodysuits and swimwear must come back unworn
              and unwashed, with every tag and hygiene liner exactly where it was: try it on over something, admire yourself, then decide.
            </p>
            <p>
              <a href={ask("I'd like to arrange an exchange.")}>Arrange an exchange on WhatsApp</a>
            </p>
          </>
        ),
      },
      {
        q: "What if it arrives wrong, or something’s torn?",
        a: <p>Then we replace it or refund you in full, no argument. Send us a photo and we’ll sort it.</p>,
      },
      {
        q: "And sale pieces?",
        a: <p>Sale pieces can be exchanged for another size, but aren’t refundable unless they’re faulty.</p>,
      },
      {
        q: "How do I get it back to you?",
        a: (
          <p>
            Message us and we’ll arrange the return with you — how, and where to, depends on where you are. Once it’s back with us and checked,
            the exchange or the refund is on its way.
          </p>
        ),
      },
    ],
  },
  {
    id: "sizing",
    title: (
      <>
        Fitted <em>to you</em>
      </>
    ),
    tease: "Measure once. Then let us worry about where everything goes.",
    layout: "left-low",
    paper: "#f6e4e4",
    photo: {
      src: photos.sizing,
      alt: "Model standing side-on in white strappy lace and stockings, a tailor's tape around her hips, looking back over her shoulder",
    },
    items: [
      {
        q: "How do I know what’ll fit?",
        a: (
          <p>
            Our <Link href="/#size-guide">size guide</Link> has the charts for bras and tops, bodysuits and dresses, and bottoms — and shows exactly
            where to hold the tape. Caught between two sizes? <a href={ask("Can you help me with sizing?")}>Message us</a> before you order with
            your measurements and what you want the piece to do for you, and we’ll choose the one that does it.
          </p>
        ),
      },
      {
        q: "Can you help me choose a style for my shape?",
        a: (
          <p>
            Yes. Tell us what you’d like a piece to do — lift, hold, show, hide, all four — and we’ll point you to the ones that do it, and the sizes
            that do it best.
          </p>
        ),
      },
      {
        q: "Will it look like the photos?",
        a: (
          <p>
            We do our best to show every colour and detail as it really is, but every screen is a little different. Want a closer look at something?
            Ask, and we’ll send you one.
          </p>
        ),
      },
      {
        q: "And if it still doesn’t fit?",
        a: (
          <p>
            Then it goes back for the right size: within 7 days of delivery, unworn, tags on — everything under <a href="#returns">Second thoughts</a>.
            No lecture.
          </p>
        ),
      },
    ],
  },
  {
    id: "privacy",
    title: (
      <>
        Between <em>us</em>
      </>
    ),
    tease: "What you wear, and for whom, is nobody’s business. We’re very good at keeping quiet.",
    layout: "right-high",
    paper: "#f2e9df",
    photo: {
      src: photos.privacy,
      alt: "Model sitting in black satin and lace with a sleep mask pushed up into her hair, a finger laid across her lips",
    },
    items: [
      {
        q: "What happens to my details?",
        a: (
          <p>
            They’re used for your order and nothing else — and for our newsletter, only if you ask for it. We never sell them, and share only what a
            delivery or a payment needs. All of it is written down in our <Link href="/privacy">privacy policy</Link>.
          </p>
        ),
      },
      {
        q: "Where are my bag and favourites kept?",
        a: <p>Only in your own browser, on your own device. We don’t see a thing until you send us your order.</p>,
      },
      {
        q: "Will you message me afterwards?",
        a: (
          <p>
            Only about your order — unless you’ve asked for our newsletter, and you can stop that whenever you like. Your WhatsApp chat with us can
            be deleted on request once your order is done.
          </p>
        ),
      },
      {
        q: "What does the courier see?",
        a: <p>Your name, your address and a phone number. Not a word about what’s in the box, and nothing on the box to tell them.</p>,
      },
    ],
  },
];

// the questions and their answers, all open: the words fill the card
function Qas({ items }: { items: Qa[] }) {
  return (
    <dl className="help-qa">
      {items.map(({ q, a }) => (
        <div key={q}>
          <dt>{q}</dt>
          <dd>{a}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChapterCard({ c, i }: { c: Chapter; i: number }) {
  // the "split" and "corner" cards set the questions in two columns
  const half = c.splitAt ?? Math.ceil(c.items.length / 2);
  const columns = c.layout === "split" || c.layout === "corner" ? [c.items.slice(0, half), c.items.slice(half)] : [c.items];
  return (
    <section
      id={c.id}
      className="help-card"
      data-layout={c.layout}
      data-deck
      style={{ "--paper": c.paper, "--i": i + 1, "--model-ar": (c.photo.src.width / c.photo.src.height).toFixed(3) } as React.CSSProperties}
    >
      <div className="help-model">
        <Image quality={90} src={c.photo.src} alt={c.photo.alt} fill sizes="(min-width: 901px) 44vw, 90vw" />
      </div>
      <div className="help-card-head">
        <p className="help-no" aria-hidden="true">
          {String(i + 1).padStart(2, "0")}
        </p>
        <h2 className="h2">{c.title}</h2>
        <p className="help-tease">{c.tease}</p>
      </div>
      {columns.map((items, k) => (
        <div key={k} className={`help-qs help-qs-${k + 1}`}>
          <Qas items={items} />
        </div>
      ))}
    </section>
  );
}

export default function HelpPage() {
  return (
    <main className="help">
      <DeckSizer />
      <div className="container help-deck" style={{ "--n": chapters.length + 2 } as React.CSSProperties}>
        {/* the opener card: the wide photo, the words on its dark left */}
        <header className="help-card is-photo is-opener" style={{ "--i": 0 } as React.CSSProperties}>
          <div className="help-card-photo" aria-hidden="true" style={{ "--pos": "70% 40%", "--pos-m": "56% 30%" } as React.CSSProperties}>
            <Image quality={90} src={photos.opener} alt="" fill preload placeholder="blur" sizes="(min-width: 1467px) 1320px, 94vw" />
          </div>
          <div className="help-card-copy">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Delivery, returns &amp; FAQ</span>
            </nav>
            <p className="eyebrow" data-reveal>
              Pillow talk · delivery, returns &amp; FAQ
            </p>
            <h1 className="h1" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
              Ask us anything. <em>We don’t blush.</em>
            </h1>
            <p className="help-lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
              The questions you’d murmur afterwards — how to have us, how we slip through your door, what happens if it doesn’t fit — answered now,
              so later can be about something else.
            </p>
          </div>
        </header>

        {chapters.map((c, i) => (
          <ChapterCard key={c.id} c={c} i={i} />
        ))}

        {/* the closing card: still wondering — a real person on the other end */}
        <section className="help-card is-photo is-closing" aria-labelledby="help-cta-title" data-deck style={{ "--i": chapters.length + 1 } as React.CSSProperties}>
          <div className="help-card-photo" aria-hidden="true" style={{ "--pos": "75% 35%", "--pos-m": "70% 25%" } as React.CSSProperties}>
            <Image quality={90} src={photos.closing} alt="" fill placeholder="blur" sizes="(min-width: 1467px) 1320px, 94vw" />
          </div>
          <div className="help-card-copy">
            <p className="eyebrow" data-reveal>
              Still wondering?
            </p>
            <h2 id="help-cta-title" className="h1" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
              Say it <em>however you like.</em>
            </h2>
            <p className="help-lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
              A real person answers on WhatsApp or by email — about a size, a piece, a delivery, or the thing you’re not sure you should ask. The
              fine print behind every answer is in our <Link href="/terms">terms</Link>.
            </p>
            <div className="help-cta-actions" data-reveal style={{ "--d": "0.3s" } as React.CSSProperties}>
              <a className="btn btn-light" href={ask("I have a question.")} target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp <ArrowRight className="arrow" />
              </a>
              <a className="help-email" href={emailLink}>
                {site.email}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
