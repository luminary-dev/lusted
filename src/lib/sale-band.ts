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

// One voice per collection: the swim lines are the band as it first launched, word for word.
const COPY: Record<Category, Copy> = {
  swim: {
    lead: "Barely there.",
    body: "Less fabric, less to pay, nothing left to hide behind. Consider it permission to show them everything — while your size lasts.",
    cta: "Shop the bikini sale",
  },
  lingerie: {
    lead: "Undone for less.",
    body: "Lace that clings, satin that slips, and a price that gives in as easily as the clasp. Take the hint — while your size lasts.",
    cta: "Shop the lingerie sale",
  },
  "after-dark": {
    lead: "Wicked for less.",
    body: "Plunges, slits and hems that were never meant to last the night — and now neither are the prices. Go on, misbehave — while your size lasts.",
    cta: "Shop the after-dark sale",
  },
};

// A sale across collections speaks for all of them.
const MIXED: Copy = {
  lead: "Your excuse.",
  body: "Lace, strings and after-dark hems, all for less than they’re worth. Pick your sin — while your size lasts.",
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
