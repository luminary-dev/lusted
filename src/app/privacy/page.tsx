import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { emailLink, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Lusted",
  description: "How Lusted collects, uses and protects your personal information — discreetly, and only to fulfil your order.",
};

// Template policy — have it reviewed against your actual practices before launch.
const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        Lusted (“we”, “us”) is an online lingerie, swimwear and partywear boutique based in Sri Lanka. We take orders through WhatsApp, Instagram and
        email. This policy explains what personal information we collect, why, and the choices you have. We handle personal data in line with Sri
        Lanka’s Personal Data Protection Act, No. 9 of 2022.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>We only collect what we need to help you shop and to deliver your order:</p>
        <ul>
          <li>
            <strong>Contact details</strong> — your name, email address and WhatsApp number when you message us or use the enquiry form.
          </li>
          <li>
            <strong>Order details</strong> — the pieces, sizes and colours you choose, your delivery address and any notes you send us.
          </li>
          <li>
            <strong>Sizing information</strong> — measurements you choose to share so we can recommend the right fit.
          </li>
          <li>
            <strong>Newsletter sign-ups</strong> — your email address, if you join our inner circle.
          </li>
        </ul>
        <p>
          Your bag, favourites and light/dark preference are stored only in your own browser (local storage) — they are never sent to us until you
          choose to send an order.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use it",
    body: (
      <ul>
        <li>To answer your questions, give sizing advice and confirm your order.</li>
        <li>To arrange payment and discreet delivery.</li>
        <li>To send you new collections and offers — only if you’ve subscribed, and you can unsubscribe at any time.</li>
        <li>To meet our legal and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "discretion",
    title: "Discretion",
    body: (
      <p>
        Every order is packed in plain, unbranded packaging with no mention of Lusted or its contents on the outside. Our team never shares what you
        bought, your measurements or your conversations with anyone outside Lusted.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We never sell your personal information. We share only what’s necessary with:</p>
        <ul>
          <li>Delivery partners — your name, phone number and address, so they can deliver your parcel.</li>
          <li>Payment providers — to process your payment securely. We don’t store full card details.</li>
          <li>Messaging and email services (such as WhatsApp) that carry our conversations with you.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep order records for as long as we need them for your order, returns and our legal and tax obligations, then delete or anonymise them.
        Chat history can be deleted on request once your order is complete.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <p>
        You can ask to see the personal information we hold about you, correct it, have it deleted, or withdraw consent to marketing at any time.
        Message us on <a href={whatsappLink("Hi Lusted, I have a privacy request.")}>WhatsApp</a> or email{" "}
        <a href={emailLink}>{site.email}</a> and we’ll respond as soon as possible.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: <p>We use reputable, encrypted services for messaging, payment and storage, and limit access to your information to the team members handling your order.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The latest version will always be on this page. See also our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title={
        <>
          Your privacy, <em>always first.</em>
        </>
      }
      updated="16 October 2026"
      intro={<p>We know lingerie is personal. Here’s exactly how we look after your information — in plain language.</p>}
      sections={sections}
    />
  );
}
