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

// The "Featured" card in the hero — point it at any edit, filter or product.
export const featured = {
  eyebrow: "Tonight's temptation",
  title: "The Blush Edit",
  tagline: "Soft lace. Bad intentions.",
  href: "/products?color=blush",
};
