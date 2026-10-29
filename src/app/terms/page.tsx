import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { emailLink, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions — Lusted",
  description: "The terms for ordering from Lusted — pricing in LKR, payment, discreet delivery, exchanges and returns.",
  alternates: { canonical: "/terms" },
};

// Template terms — have them reviewed for your business before launch.
const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <p>
        These terms apply to every order placed with Lusted, whether through this website, WhatsApp, Instagram or email. By placing an order you agree
        to them. Please also read our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "orders",
    title: "Placing an order",
    body: (
      <>
        <p>
          Adding pieces to your bag and sending them to us on WhatsApp is a request to order. Your order is confirmed once we’ve checked availability
          and sizing with you and received payment.
        </p>
        <p>We may decline or cancel an order — for example if a piece is out of stock — and will refund any payment in full if we do.</p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Prices & payment",
    body: (
      <ul>
        <li>All prices are in Sri Lankan rupees (LKR) and include applicable taxes unless stated otherwise.</li>
        <li>Delivery charges, if any, are confirmed with you before you pay.</li>
        <li>Sale prices apply while stocks last and can’t be applied to orders already placed.</li>
        <li>We’ll share secure payment options when we confirm your order.</li>
      </ul>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <p>
        We deliver across Sri Lanka in plain, unbranded packaging. Estimated delivery times are confirmed with your order and depend on your location.
        Please make sure your address and phone number are correct — we can’t be responsible for delays caused by incorrect details.
      </p>
    ),
  },
  {
    id: "exchanges",
    title: "Exchanges & returns",
    body: (
      <>
        <p>
          For hygiene reasons, lingerie, bodysuits and swimwear can only be exchanged or returned if unworn, unwashed, with all tags and hygiene
          liners intact, and within 7 days of delivery.
        </p>
        <ul>
          <li>Message us within 7 days to arrange an exchange or return.</li>
          <li>Faulty or incorrect items are always replaced or refunded in full.</li>
          <li>Sale items can be exchanged for size but are not refundable unless faulty.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sizing",
    title: "Sizing & product details",
    body: (
      <p>
        We do our best to show colours and details accurately, but screens vary. Our <Link href="/#size-guide">size guide</Link> is a guide only —
        message us before ordering and we’ll help you choose the right fit.
      </p>
    ),
  },
  {
    id: "content",
    title: "Website content",
    body: <p>All photography, text and branding on this site belong to Lusted and may not be copied or reused without our written permission.</p>,
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        Nothing in these terms limits your rights as a consumer under Sri Lankan law. Otherwise, our liability for any order is limited to the amount
        you paid for it.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        Questions about these terms? Message us on <a href={whatsappLink("Hi Lusted, I have a question about your terms.")}>WhatsApp</a> or email{" "}
        <a href={emailLink}>{site.email}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms & conditions"
      title={
        <>
          The fine print, <em>with the lights on.</em>
        </>
      }
      updated="16 October 2026"
      intro={<p>Ordering, paying, delivery and exchanges — the one part of Lusted that keeps its clothes on.</p>}
      sections={sections}
    />
  );
}
