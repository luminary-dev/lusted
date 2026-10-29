import type { Category } from "./products";

// The home page's sale band says what is actually on sale. The owner console can put a percentage off any collection,
// so the band can't promise bikinis when it is the lace that's marked down. This is kept apart from products.ts (which
// pulls in every photo) so the tests can check the wording without a browser.

export interface SaleBand {
  eyebrow: string;
  /** the h2's first half; the second, emphasised half is `offer` */
  lead: string;
  /** "Now 20% off." when every piece is marked down the same, "Up to 30% off." when they differ */
  offer: string;
  body: string;
  cta: string;
  /** the shop, filtered to the sale (and to its collection, when it is all one) */
  href: string;
}

type Copy = Omit<SaleBand, "eyebrow" | "offer" | "href">;

// One voice per collection, each about what its pieces do (and how fast they come off).
const COPY: Record<Category, Copy> = {
  swim: {
    lead: "Strip down for less.",
    body: "Less fabric, less to pay and nothing left to hide behind. Show them everything and spend less doing it — while your size lasts.",
    cta: "Shop the bikini sale",
  },
  lingerie: {
    lead: "Slipping off for less.",
    body: "Lace that clings, satin that slips, and prices that come down as easily as your straps. Take the hint — while your size lasts.",
    cta: "Shop the lingerie sale",
  },
  "after-dark": {
    lead: "Bad decisions, discounted.",
    body: "Plunges, slits and hems that were never meant to last the night — and now neither are the prices. Misbehave twice — while your size lasts.",
    cta: "Shop the after-dark sale",
  },
};

// A sale across collections speaks for all of them.
const MIXED: Copy = {
  lead: "Be greedy.",
  body: "Lace, strings and after-dark hems, all marked down and all made to come off. Take more than one to bed — while your size lasts.",
  cta: "Shop the sale",
};

/**
 * The band's words for the pieces on sale (each with its collection and its discount, in whole per cent), or null when
 * nothing is — there is then no band. `collectionName` is products.ts's, passed in so this file stays free of photos.
 */
export function saleBand(pieces: { category: Category; discount: number }[], collectionName: (c: Category) => string): SaleBand | null {
  if (!pieces.length) return null;
  const top = Math.max(...pieces.map((p) => p.discount));
  const offer = pieces.every((p) => p.discount === top) ? `Now ${top}% off.` : `Up to ${top}% off.`;
  const only = pieces.every((p) => p.category === pieces[0].category) ? pieces[0].category : null;
  if (!only) return { eyebrow: "The Sale", offer, href: "/products?sale=1", ...MIXED };
  // the swim sale keeps the name it launched with; the others take their collection's
  const eyebrow = only === "swim" ? "The Bikini Sale" : `The ${collectionName(only)} Sale`;
  return { eyebrow, offer, href: `/products?sale=1&cat=${only}`, ...COPY[only] };
}
