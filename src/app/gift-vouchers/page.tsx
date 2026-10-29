import type { Metadata } from "next";
import Link from "next/link";
import GiftVoucher from "@/components/GiftVoucher";
import { ChatDouble, Heart, Sparkle } from "@/components/icons";
import { giftVoucher } from "@/lib/site";

const title = "Gift vouchers — Lusted Sri Lanka";
const description =
  "Can’t guess the size? Don’t. Give a Lusted gift voucher for the amount you choose — requested on WhatsApp and sent the same way, as discreet as everything else we do.";

// A page that sets its own openGraph replaces the layout's whole, the brand card (src/app/opengraph-image.png)
// included, so the card is named again here.
const image = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Lusted Lingerie" };

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/gift-vouchers" },
  openGraph: { title, description, type: "website", siteName: "Lusted", locale: "en_LK", url: "/gift-vouchers", images: [image] },
  twitter: { card: "summary_large_image", images: [image] },
};

// Vouchers are sold the way everything else is: no payment here, one WhatsApp message to the shop, which confirms,
// takes payment and sends the voucher back in the chat. The amounts, the range for "Another amount" and how long a
// voucher lasts are placeholders in `giftVoucher` (src/lib/site.ts); the steps below say what the shop does with a
// request — keep them, and the line under them, in step with the terms (/terms).
const steps = [
  {
    icon: Sparkle,
    title: "Pick your temptation",
    text: "Pick an amount, add their name and a few wicked words if you like, and send the request. It reaches us as one WhatsApp message, with its reference on top.",
  },
  {
    icon: ChatDouble,
    title: "We say yes",
    text: "A real person replies, discreetly, to confirm the voucher and share secure ways to pay — the same as any order.",
  },
  {
    icon: Heart,
    title: "They get to be bad",
    text: `Once it’s paid, we send the voucher on WhatsApp: a card with its own code, to forward, print or keep for the right moment. It’s good for ${giftVoucher.validMonths} months on anything here — they choose, you enjoy the view.`,
  },
];

export default function GiftVouchersPage() {
  return (
    <main className="gift-page">
      <div className="container">
        <header className="gift-head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Gift vouchers</span>
          </nav>
          <p className="eyebrow">Gift vouchers</p>
          <h1 className="h2">
            Give them <em>something wicked.</em>
          </h1>
          <p className="lede">
            Can’t guess the size? Don’t. Give a voucher and let them choose exactly what they want to be peeled out of — requested on WhatsApp,
            sent the same way, and as discreet as everything else we do.
          </p>
        </header>

        <GiftVoucher />

        <section className="gift-how" aria-labelledby="gift-how-title">
          <h2 id="gift-how-title" className="h2">
            How it <em>happens</em>
          </h2>
          <ol className="gift-steps">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="gift-step-icon">
                  <Icon />
                </span>
                <h3 className="h3">{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <p className="gift-terms">
            A voucher is valid for {giftVoucher.validMonths} months from the day we send it and can’t be exchanged for cash. Everything else is in our{" "}
            <Link href="/terms">terms &amp; conditions</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
