import Link from "next/link";
import { ArrowRight, Box, ChatDouble, Lock, Tag } from "../icons";

// The quiet reassurance beside every "send it to us" button — on the product page and in the bag — for the first-time
// buyer who hesitates before messaging. Every line restates a promise already made in the terms (/terms) and the help
// page (/help); keep the three in step. Delivery fees, delivery times and payment methods aren't decided yet, so they
// are confirmed on WhatsApp and never promised here.
const promises = [
  { icon: Lock, text: "Plain, unbranded box" },
  { icon: Box, text: "Delivery across Sri Lanka" },
  { icon: Tag, text: "7-day exchange" },
  { icon: ChatDouble, text: "Sizing help from a real person" },
];

// onNavigate: the bag closes itself when the help link is followed
export default function TrustStrip({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="trust">
      <ul className="trust-list" aria-label="Ordering with Lusted">
        {promises.map(({ icon: Icon, text }) => (
          <li key={text}>
            <Icon /> {text}
          </li>
        ))}
      </ul>
      <Link href="/help" className="trust-link" onClick={onNavigate}>
        Delivery, returns &amp; FAQ <ArrowRight />
      </Link>
    </div>
  );
}
