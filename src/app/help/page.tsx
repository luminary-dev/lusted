import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@/components/icons";
import { img } from "@/lib/cdn";
import { emailLink, instagramLink, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pillow talk — delivery, returns & FAQ — Lusted",
  description:
    "How ordering on WhatsApp works, paying, the plain box at your door, 7-day exchanges and finding your size — every question you'd ask after, answered before.",
  alternates: { canonical: "/help" },
};

// The delivery, returns & FAQ page, after dark: the practical questions asked and answered as pillow talk. Every answer
// restates the terms (/terms) — keep the two in step. Anything not decided there (delivery times, fees, payment methods)
// is confirmed with the customer on WhatsApp, and the answers say so rather than promise it.
//
// PHOTOS: stand-ins until the eight "Pillow talk" renders are made (about-wall/help-prompt.txt, HELP-0…7). The alt texts
// already describe the photos to come; when the renders land in assets/images/help/, swap the paths below and nothing else.
const photos = {
  opener: img("images/about-page/dressing-room.webp"),
  ordering: img("images/hero/main-phone/main-01.webp"),
  payment: img("images/hero/main-phone/main-02.webp"),
  delivery: img("images/about-page/the-parcel.webp"),
  returns: img("images/hero/main-phone/main-03.webp"),
  sizing: img("images/about-page/the-fitting.webp"),
  privacy: img("images/hero/main-phone/main-04.webp"),
  closing: img("images/hero/main/main-01.webp"),
};

type Qa = { q: string; a: ReactNode };

type Chapter = {
  id: string;
  title: ReactNode;
  caption: string;
  tease: string;
  photo: { src: ReturnType<typeof img>; alt: string; pos?: string };
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
    caption: "say the word",
    tease: "No checkout. No forms. Just you, one message, and someone on the other end who wants you to have it.",
    photo: {
      src: photos.ordering,
      alt: "Model sitting up against a wine velvet headboard in a cherry-red satin teddy, typing her order on her phone and glancing up over it",
      pos: "50% 20%",
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
    caption: "the least sexy minute",
    tease: "The one unsexy moment of the whole affair. We keep it quick, so you can get back to the rest.",
    photo: {
      src: photos.payment,
      alt: "Model perched on the arm of a velvet chair in a liquid-gold chain-strap slip, a black card held to her lips",
      pos: "50% 20%",
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
    caption: "nothing on the outside",
    tease: "It arrives looking like nothing at all. Then you open it.",
    photo: {
      src: photos.delivery,
      alt: "Model with her back against her front door in a champagne silk robe fallen open over lavender lace, lifting the lid of a plain brown box",
      pos: "50% 30%",
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
    ],
  },
  {
    id: "returns",
    title: (
      <>
        Second <em>thoughts</em>
      </>
    ),
    caption: "this one, or this one?",
    tease: "Changed your mind? Didn’t fit the way you pictured it? Tell us. We don’t sulk.",
    photo: {
      src: photos.returns,
      alt: "Model kneeling on silk sheets in an ivory satin corset-bodysuit among three lingerie sets, holding a wine lace bra up by its straps",
      pos: "50% 20%",
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
    ],
  },
  {
    id: "sizing",
    title: (
      <>
        Fitted <em>to you</em>
      </>
    ),
    caption: "measure once",
    tease: "Measure once. Then let us worry about where everything goes.",
    photo: {
      src: photos.sizing,
      alt: "Model side-on at a dawn window in white strappy lace, a tailor's tape around her hips, looking back over her shoulder",
      pos: "50% 25%",
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
        q: "Will it look like the photos?",
        a: (
          <p>
            We do our best to show every colour and detail as it really is, but every screen is a little different. Want a closer look at something?
            Ask, and we’ll send you one.
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
    caption: "shh",
    tease: "What you wear, and for whom, is nobody’s business. We’re very good at keeping quiet.",
    photo: {
      src: photos.privacy,
      alt: "Model lying back on black satin pillows in black satin and lace, a sleep mask pushed up into her hair and a finger across her lips",
      pos: "50% 20%",
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
    ],
  },
];

// one question per <details>: native open/close, keyboard and screen-reader friendly, no script
function Faq({ items }: { items: Qa[] }) {
  return (
    <div className="faq">
      {items.map(({ q, a }) => (
        <details key={q}>
          <summary>{q}</summary>
          <div className="faq-a">{a}</div>
        </details>
      ))}
    </div>
  );
}

export default function HelpPage() {
  return (
    <main className="help">
      {/* the opener: she fills the right of the photo, the words sit on the dark left */}
      <header className="help-hero">
        <div className="help-hero-photo" aria-hidden="true">
          <Image quality={90} src={photos.opener} alt="" fill preload placeholder="blur" sizes="100vw" />
        </div>
        <div className="container help-hero-inner">
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
            The questions you’d murmur afterwards — how to have us, how we slip through your door, what happens if it doesn’t fit — answered now, so
            later can be about something else.
          </p>
          <nav className="help-index" aria-label="On this page" data-reveal style={{ "--d": "0.3s" } as React.CSSProperties}>
            {chapters.map((c, i) => (
              <a key={c.id} href={`#${c.id}`}>
                <span>{String(i + 1).padStart(2, "0")}</span> {c.caption}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="container">
        {chapters.map((c, i) => (
          <section key={c.id} id={c.id} className={`help-chapter${i % 2 ? " is-flipped" : ""}`}>
            <figure className="help-photo" data-reveal>
              <Image
                quality={90}
                src={c.photo.src}
                alt={c.photo.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1467px) 540px, (min-width: 901px) 38vw, 100vw"
                style={{ objectPosition: c.photo.pos }}
              />
              <figcaption>{c.caption}</figcaption>
            </figure>
            <div className="help-chapter-body">
              <div className="help-chapter-head" data-reveal>
                <p className="help-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="h2">{c.title}</h2>
                <p className="help-tease">{c.tease}</p>
              </div>
              <div data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
                <Faq items={c.items} />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* the closing band: still wondering — a real person on the other end */}
      <section className="help-cta" aria-labelledby="help-cta-title">
        <div className="help-cta-photo" aria-hidden="true">
          <Image quality={90} src={photos.closing} alt="" fill placeholder="blur" sizes="100vw" />
        </div>
        <div className="container help-cta-inner">
          <p className="eyebrow" data-reveal>
            Still wondering?
          </p>
          <h2 id="help-cta-title" className="h1" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
            Say it <em>however you like.</em>
          </h2>
          <p className="help-lede" data-reveal style={{ "--d": "0.2s" } as React.CSSProperties}>
            A real person answers on WhatsApp or by email — about a size, a piece, a delivery, or the thing you’re not sure you should ask. The fine
            print behind every answer is in our <Link href="/terms">terms</Link>.
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
    </main>
  );
}
