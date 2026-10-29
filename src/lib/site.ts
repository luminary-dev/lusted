// Shop contact details — edit these to update every link on the site.
export const site = {
  name: "Lusted",
  tagline: "Lingerie that doesn’t stay on.",
  whatsappDisplay: "+65 8123 4567",
  whatsappNumber: "6581234567", // digits only, used for wa.me links
  instagramHandle: "lusted.lk",
  email: "support@lusted.lk",
  hours: "9AM – 7PM",
  responseTime: "We typically reply within 24 hours (Mon – Sun).",
  // Reveal day. Until this moment every page shows the "Revealing soon" page (src/proxy.ts); ?preview=1 lets you through.
  revealAt: "2026-11-01T19:00:00+05:30",
  // Puts the "Revealing soon" page in front of the site until revealAt (src/proxy.ts). Deployments with
  // REVEAL_GATE=off in the environment (Vercel's Preview environment, so lusted-dev.vercel.app) and hosts beginning
  // with "dev." always show the real site; anywhere else, open any page with ?preview=1 once to get through.
  revealGate: true,
};

// Gift vouchers (/gift-vouchers), sold over WhatsApp like everything else. Placeholders until the shop decides: the
// amounts offered, the smallest and largest "Another amount" (whole rupees), and how long a voucher lasts from the day
// it's sent — the page, its card and its WhatsApp message all read them from here.
export const giftVoucher = {
  amounts: [5000, 10000, 15000, 25000],
  min: 3000,
  max: 100000,
  validMonths: 12,
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const instagramLink = `https://instagram.com/${site.instagramHandle}`;
export const emailLink = `mailto:${site.email}`;

export const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/#collections", label: "Collections" },
  { href: "/#size-guide", label: "Size Guide" },
  { href: "/#ordering", label: "Ordering" },
  { href: "/help", label: "FAQ" },
  // the phone menu only: the bar above 900 px has no room for a seventh link, and the footer carries it there
  { href: "/gift-vouchers", label: "Gift vouchers", menuOnly: true },
  { href: "/#contact", label: "Contact" },
];
