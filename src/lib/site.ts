// Shop contact details — edit these to update every link on the site.
export const site = {
  name: "Lusted",
  tagline: "Lingerie for every version of you.",
  whatsappDisplay: "+65 8123 4567",
  whatsappNumber: "6581234567", // digits only, used for wa.me links
  instagramHandle: "lusted.lk",
  email: "support@lusted.lk",
  hours: "9AM – 7PM",
  responseTime: "We typically reply within 24 hours (Mon – Sun).",
  // Reveal day. Until this moment every page shows the "Revealing soon" page (src/proxy.ts); ?preview=1 lets you through.
  revealAt: "2026-11-01T19:00:00+05:30",
  // Puts the "Revealing soon" page in front of the site until revealAt (src/proxy.ts). Hosts beginning with "dev."
  // (dev.lusted.vercel.app) and deployments with REVEAL_GATE=off in the environment always show the real site;
  // anywhere else, open any page with ?preview=1 once to get through.
  revealGate: true,
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
  { href: "/#contact", label: "Contact" },
];
