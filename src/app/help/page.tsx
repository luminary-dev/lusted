import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { emailLink, instagramLink, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery, returns & FAQ — Lusted",
  description:
    "How ordering on WhatsApp works, payment, discreet delivery across Sri Lanka, 7-day exchanges and finding your size — the answers before you ask.",
  alternates: { canonical: "/help" },
};

// Every answer here restates the terms (/terms) — keep the two in step. Anything not decided there (delivery times,
// fees, payment methods) is confirmed with the customer on WhatsApp, and the answers say so rather than promise it.
type Qa = { q: string; a: ReactNode };

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

const ask = (text: string) => whatsappLink(`Hi Lusted! ${text}`);

const sections: LegalSection[] = [
  {
    id: "ordering",
    title: "Ordering",
    body: (
      <Faq
        items={[
          {
            q: "How do I place an order?",
            a: (
              <p>
                Add your pieces to the bag and tap <strong>Send order on WhatsApp</strong> — or tap <strong>Order now on WhatsApp</strong> on any
                piece. Your order arrives as one message; a real person checks availability and your size with you, and your order is confirmed
                once that’s done and payment is received.
              </p>
            ),
          },
          {
            q: "Can I order without the website?",
            a: (
              <p>
                Of course. Message us on <a href={ask("I'd like to place an order.")}>WhatsApp</a>, on{" "}
                <a href={instagramLink}>Instagram</a> or at <a href={emailLink}>{site.email}</a> with the pieces, sizes and colours you’d like.
              </p>
            ),
          },
          {
            q: "How quickly will you reply?",
            a: (
              <p>
                {site.responseTime} We’re around {site.hours}.
              </p>
            ),
          },
          {
            q: "What if a piece is out of stock?",
            a: <p>We’ll tell you before anything is confirmed. If we ever have to cancel an order, any payment is refunded in full.</p>,
          },
        ]}
      />
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <Faq
        items={[
          {
            q: "How do I pay?",
            a: <p>We share secure payment options with you when we confirm your order on WhatsApp.</p>,
          },
          {
            q: "What currency are the prices in?",
            a: <p>All prices are in Sri Lankan rupees (LKR) and include applicable taxes unless stated otherwise.</p>,
          },
          {
            q: "Is there a delivery charge?",
            a: <p>Any delivery charge is confirmed with you before you pay — no surprises after.</p>,
          },
          {
            q: "Do sale prices last?",
            a: <p>Sale prices apply while stocks last, and can’t be applied to orders already placed.</p>,
          },
        ]}
      />
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <Faq
        items={[
          {
            q: "Where do you deliver?",
            a: <p>Across Sri Lanka.</p>,
          },
          {
            q: "How long does delivery take?",
            a: <p>It depends on where you are — we confirm your estimated delivery time with your order.</p>,
          },
          {
            q: "Will anyone know what’s inside?",
            a: (
              <p>
                No. Every order goes out in a plain, unbranded box — wrapped in tissue inside, nothing on the outside that gives it away. It stays our
                little secret.
              </p>
            ),
          },
          {
            q: "What do you need from me?",
            a: (
              <p>
                Your delivery address and a phone number the courier can reach. Please double-check both — we can’t be responsible for delays caused
                by incorrect details.
              </p>
            ),
          },
        ]}
      />
    ),
  },
  {
    id: "returns",
    title: "Exchanges & returns",
    body: (
      <Faq
        items={[
          {
            q: "Can I exchange or return a piece?",
            a: (
              <>
                <p>
                  Yes, within 7 days of delivery — message us to arrange it. For hygiene, lingerie, bodysuits and swimwear must be unworn, unwashed,
                  with every tag and hygiene liner still in place.
                </p>
                <p>
                  <a href={ask("I'd like to arrange an exchange.")}>Arrange an exchange on WhatsApp</a>
                </p>
              </>
            ),
          },
          {
            q: "What if something arrives faulty or wrong?",
            a: <p>We’ll always replace it or refund you in full. Just message us with a photo.</p>,
          },
          {
            q: "Can I return sale pieces?",
            a: <p>Sale pieces can be exchanged for a different size, but aren’t refundable unless faulty.</p>,
          },
        ]}
      />
    ),
  },
  {
    id: "sizing",
    title: "Sizing & fit",
    body: (
      <Faq
        items={[
          {
            q: "How do I find my size?",
            a: (
              <p>
                Our <Link href="/#size-guide">size guide</Link> has the charts for bras and tops, bodysuits and dresses, and bottoms — and shows
                exactly where to hold the tape. Unsure between two? <a href={ask("Can you help me with sizing?")}>Message us</a> before you order and
                we’ll help you choose.
              </p>
            ),
          },
          {
            q: "Will the colour look exactly like the photos?",
            a: <p>We do our best to show colours and details accurately, but every screen is a little different. Ask us for a closer look anytime.</p>,
          },
        ]}
      />
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: (
      <Faq
        items={[
          {
            q: "What happens to my details?",
            a: (
              <p>
                Only for your order — and our newsletter, if you sign up for it. We never sell your information, and share only what a delivery
                or payment needs. The full story is in our <Link href="/privacy">privacy policy</Link>.
              </p>
            ),
          },
          {
            q: "Where are my bag and favourites saved?",
            a: <p>Only in your own browser, on your device — we don’t see them until you send us your order.</p>,
          },
        ]}
      />
    ),
  },
  {
    id: "contact",
    title: "Still wondering?",
    body: (
      <p>
        Message us on <a href={ask("I have a question.")}>WhatsApp</a> or email <a href={emailLink}>{site.email}</a> — a real person will answer. The
        details behind these answers are in our <Link href="/terms">terms</Link>.
      </p>
    ),
  },
];

export default function HelpPage() {
  return (
    <LegalPage
      eyebrow="Delivery, returns & FAQ"
      title={
        <>
          Everything you’d ask, <em>answered quietly.</em>
        </>
      }
      intro={<p>How ordering works, paying, discreet delivery, exchanges and finding your fit — before you even have to ask.</p>}
      sections={sections}
    />
  );
}
