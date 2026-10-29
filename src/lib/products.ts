import catalog from "./catalog.json";
import type { StaticImageData } from "next/image";
import { colorImages, productImages, productViews } from "./product-images";

// Product data lives in catalog.json (placeholder catalogue — replace with your real range).

export type Category = "lingerie" | "swim" | "after-dark";
export type ColorKey = keyof typeof colors;

// `label` is the plain category (kept searchable, so "swim" still finds the bikinis); `name` is the collection name shown
// to shoppers everywhere (product pages, shop tabs, search, footer) and `tagline` its line on the home-page cards.
export const categories: { key: Category; label: string; name: string; tagline: string }[] = [
  { key: "lingerie", label: "Lingerie", name: "Lace Secrets", tagline: "Lace that clings like a secret and comes off like a confession." },
  { key: "swim", label: "Swim", name: "Sun Kissed", tagline: "Barely-there strings, wet skin, and every eye on what’s barely covered." },
  { key: "after-dark", label: "After Dark", name: "Midnight Sins", tagline: "Plunges, slits and hems that give up long before the night does." },
];

export const colors = {
  blush: { label: "Blush", hex: "#e8b4aa" },
  wine: { label: "Wine", hex: "#6b1430" },
  black: { label: "Black", hex: "#1c1416" },
  ivory: { label: "Ivory", hex: "#f2ebdf" },
  champagne: { label: "Champagne", hex: "#e6ccb2" },
  mocha: { label: "Mocha", hex: "#7a5646" },
  lilac: { label: "Lilac", hex: "#b9a2d8" },
  aqua: { label: "Aqua", hex: "#8fd3d6" },
};

export const sizes = ["XS", "S", "M", "L", "XL"] as const;

export const fitLabels = { [-1]: "Runs small — size up", 0: "True to size", 1: "Runs large — size down" } as const;

export interface Product {
  slug: string;
  name: string;
  category: Category;
  price: number;
  salePrice?: number;
  colors: ColorKey[];
  sizes: string[];
  bestSeller?: number;
  added: string;
  description: string;
  /** a one-line description for compact cards (the sale section) */
  blurb?: string;
  /** the piece's features and care — woven into `description` for shoppers; kept here so search finds them */
  details: string[];
  /** how it fits: -1 runs small (size up) · 0 true to size · 1 runs large (size down) */
  fit: -1 | 0 | 1;
  /** a line on how the piece sits — the product page's fit panel */
  fitNote: string;
  /** three short moments it's made for — the product page's "Made for…" line */
  moments: string[];
  /** what the main photo shows when it isn't the front (e.g. "Side") — labels it in the product gallery */
  mainView?: string;
  /** the slugs of the pieces made to be worn with it (the Rosé bra and its brief) — the product page's "Complete the
   *  set"; kept symmetric in the catalogue, and a slug that isn't (or is no longer) a photographed piece is skipped */
  pairsWith?: string[];
  image: (typeof productImages)[keyof typeof productImages];
  /** model-shot pieces: the back view, shown on hover in cards */
  backImage?: StaticImageData;
  /** every photo of the piece, front first (front, back and side where they exist) — the product page gallery */
  views: { label: string; src: StaticImageData }[];
  /** the gallery per colour: the main colour (colors[0]) is `views`; other colours appear once they're photographed */
  colorViews: Partial<Record<ColorKey, { label: string; src: StaticImageData }[]>>;
  isNew: boolean;
}

type ViewSet = { front: StaticImageData; back?: StaticImageData; side?: StaticImageData };
const toViews = (v: ViewSet, mainLabel = "Front") => [
  { label: mainLabel, src: v.front },
  ...(v.back ? [{ label: "Back", src: v.back }] : []),
  ...(v.side ? [{ label: "Side", src: v.side }] : []),
];

// The six most recently added pieces are flagged "New".
const shot = catalog.filter((p) => p.slug in productImages); // pieces appear once they have a photo
const newest = new Set([...shot].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 6).map((p) => p.slug));

export const products: Product[] = shot.map((p) => ({
  ...(p as Omit<Product, "image" | "isNew" | "backImage" | "views" | "colorViews">),
  image: productImages[p.slug as keyof typeof productImages],
  backImage: productViews[p.slug as keyof typeof productImages]?.back,
  views: toViews({ front: productImages[p.slug as keyof typeof productImages], ...productViews[p.slug as keyof typeof productImages] }, (p as { mainView?: string }).mainView),
  colorViews: {
    [p.colors[0]]: toViews({ front: productImages[p.slug as keyof typeof productImages], ...productViews[p.slug as keyof typeof productImages] }, (p as { mainView?: string }).mainView),
    ...Object.fromEntries(
      Object.entries(colorImages[p.slug as keyof typeof productImages] ?? {}).map(([c, v]) => [c, toViews(v)]),
    ),
  },
  isNew: newest.has(p.slug),
}));

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const categoryLabel = (c: Category) => categories.find((x) => x.key === c)?.label ?? c;
export const collectionName = (c: Category) => categories.find((x) => x.key === c)?.name ?? c;

export const priceOf = (p: Product) => p.salePrice ?? p.price;
export const discountPct = (p: Product) => (p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);
// Prices are whole Sri Lankan rupees (LKR).
export const formatPrice = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

export const bestSellers = products.filter((p) => p.bestSeller).sort((a, b) => a.bestSeller! - b.bestSeller!);
export const onSale = products.filter((p) => p.salePrice);
export const maxDiscount = Math.max(...onSale.map(discountPct));

export const priceBuckets = [
  { key: "u5000", label: "Under LKR 5,000", test: (n: number) => n < 5000 },
  { key: "5000-7000", label: "LKR 5,000 – 7,000", test: (n: number) => n >= 5000 && n < 7000 },
  { key: "7000-10000", label: "LKR 7,000 – 10,000", test: (n: number) => n >= 7000 && n < 10000 },
  { key: "10000", label: "LKR 10,000+", test: (n: number) => n >= 10000 },
];

// Shoppers' words the catalogue doesn't use, and the catalogue's words for them. Keys are singular (query words are
// folded to the singular before the lookup), and every word on the right must really occur in a piece's name, details
// or colours, or a collection's label or name — a word nobody wrote finds nothing.
export const searchSynonyms: Record<string, string[]> = {
  pink: ["blush", "rose"],
  red: ["wine", "scarlet", "rouge", "crimson"],
  burgundy: ["wine"],
  white: ["ivory", "pearl"],
  cream: ["ivory"],
  purple: ["lilac"],
  brown: ["mocha"],
  blue: ["aqua"],
  panty: ["brief", "thong"],
  knicker: ["brief", "thong"],
  underwear: ["brief", "thong"],
  swimwear: ["swim", "bikini", "monokini", "swimsuit"],
  swimsuit: ["swim", "bikini", "monokini", "swimsuit"],
  lingerie: ["lace"],
  nighty: ["slip", "babydoll", "teddy"],
  nightie: ["slip", "babydoll", "teddy"],
  nightdress: ["slip", "babydoll", "teddy"],
  dress: ["gown", "mini", "cheongsam"],
};

// Lower case without accents, so "rose" finds "Rosé" and "elodie" finds "Élodie".
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const wordsOf = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);
// A rough singular — enough for "bikinis", "dresses" and "panties"; short words like "bra" and "set" are left alone.
const singular = (w: string) =>
  w.length > 4 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : /(ss|sh|ch|x|z)es$/.test(w) ? w.slice(0, -2) : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w;

// Every word of the query must match (AND). A word matches when a word of the piece's name, description, details,
// colours, category or collection starts with it — so a half-typed "biki" already finds the bikinis but "red" no longer
// finds "underwired" — or when its singular does, or when one of its synonyms above is a whole word of the piece's name,
// details, colours, category or collection. Synonyms skip the description and must match whole words, because the
// prose uses words loosely: "Slip the straps back" isn't a slip, and "dress" → "mini" mustn't find "minimal".
export function matchesQuery(p: Product, query: string) {
  const words = wordsOf(query);
  if (!words.length) return true;
  const labels = wordsOf([p.name, categoryLabel(p.category), collectionName(p.category), ...p.colors.map((c) => colors[c].label), ...p.details].join(" "));
  const hay = [...labels, ...wordsOf(p.description)];
  const whole = new Set([...labels, ...labels.map(singular)]);
  return words.every((w) => {
    const one = singular(w);
    if (hay.some((h) => h.startsWith(w) || h.startsWith(one))) return true;
    return [...(searchSynonyms[w] ?? []), ...(searchSynonyms[one] ?? [])].some((s) => whole.has(s));
  });
}
