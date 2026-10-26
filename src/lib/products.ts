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

// Every word must appear in the product's name, description, category, colours or details.
export function matchesQuery(p: Product, query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [p.name, p.description, categoryLabel(p.category), collectionName(p.category), ...p.colors.map((c) => colors[c].label), ...p.details].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}
