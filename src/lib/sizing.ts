import type { Category } from "./products";

// The body measurements behind both size guides — the home page's swing tags (components/SizeGuide.tsx) and the
// dialog on a product page (components/shop/SizeGuideDialog.tsx). One copy, so the two can never drift.
//
// Bra bands follow the underbust (UK/US/AU 30 = 63–67 cm, then +5 cm per band) and cups the bust-minus-underbust
// difference. Dress sizes use the usual UK/AU 6–14 ↔ EU 34–42 ↔ US 2–10 conversion. XXL follows the same steps
// (UK 16 / EU 44 / US 12). Check them against your makers' own charts.
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const UK = ["6", "8", "10", "12", "14", "16"];
export const EU = ["34", "36", "38", "40", "42", "44"];
export const US = ["2", "4", "6", "8", "10", "12"];
export const BUST = ["78 – 82", "83 – 87", "88 – 92", "93 – 97", "98 – 102", "103 – 108"];
export const WAIST = ["60 – 64", "65 – 69", "70 – 74", "75 – 79", "80 – 84", "85 – 90"];
export const HIPS = ["84 – 88", "89 – 93", "94 – 98", "99 – 103", "104 – 108", "109 – 114"];
export const UNDERBUST = ["63 – 67", "68 – 72", "73 – 77", "78 – 82", "83 – 87", "88 – 92"];

export const guides: Record<string, [string, string][][]> = {
  "Bras & tops": [
    [["Underbust", "63 – 67"], ["Bust", "75 – 85"], ["UK · US", "30A – 30C"], ["EU", "65A – 65C"]],
    [["Underbust", "68 – 72"], ["Bust", "80 – 90"], ["UK · US", "32A – 32C"], ["EU", "70A – 70C"]],
    [["Underbust", "73 – 77"], ["Bust", "87 – 97"], ["UK · US", "34B – 34D"], ["EU", "75B – 75D"]],
    [["Underbust", "78 – 82"], ["Bust", "92 – 102"], ["UK · US", "36B – 36D"], ["EU", "80B – 80D"]],
    [["Underbust", "83 – 87"], ["Bust", "99 – 109"], ["UK · US", "38C – 38DD"], ["EU", "85C – 85E"]],
    [["Underbust", "88 – 92"], ["Bust", "106 – 116"], ["UK · US", "40C – 40DD"], ["EU", "90C – 90E"]],
  ],
  "Bodysuits & dresses": SIZES.map((_, i) => [
    ["Bust", BUST[i]],
    ["Waist", WAIST[i]],
    ["Hips", HIPS[i]],
    ["UK · EU · US", `${UK[i]} · ${EU[i]} · ${US[i]}`],
  ]),
  Bottoms: SIZES.map((_, i) => [
    ["Waist", WAIST[i]],
    ["Hips", HIPS[i]],
    ["UK · EU · US", `${UK[i]} · ${EU[i]} · ${US[i]}`],
  ]),
};

export type GuideTab = keyof typeof guides;
export const TABS = Object.keys(guides) as GuideTab[];

// Which chart a piece opens on. The collections don't map one-to-one onto the charts — a lingerie set has both a bra
// and a brief — so this is the likeliest starting point and the shopper can switch.
export const tabForCategory = (category: Category): GuideTab =>
  category === "after-dark" ? "Bodysuits & dresses" : "Bras & tops";

// Which measurement answers "find my size" on each chart, and the ranges to match against.
export const finderFor = (tab: GuideTab): { label: string; hint: string; ranges: string[] } =>
  tab === "Bras & tops"
    ? { label: "Underbust", hint: "Measure snugly, right under the bust.", ranges: UNDERBUST }
    : tab === "Bottoms"
      ? { label: "Hips", hint: "Measure around the fullest part.", ranges: HIPS }
      : { label: "Bust", hint: "Measure around the fullest part.", ranges: BUST };

// The size whose range holds this measurement in cm, or the nearest one when it falls between or outside the chart.
// Returns an index into SIZES, or -1 when the number isn't usable.
export function sizeIndexFor(cm: number, ranges: string[]): number {
  if (!Number.isFinite(cm) || cm <= 0) return -1;
  const bounds = ranges.map((r) => r.split("–").map((n) => Number(n.trim())));
  for (let i = 0; i < bounds.length; i++) {
    const [lo, hi] = bounds[i];
    if (cm >= lo && cm <= hi) return i;
  }
  // outside every band: the closest edge, so a measurement just past the chart still lands somewhere sensible
  let best = 0;
  let bestGap = Infinity;
  bounds.forEach(([lo, hi], i) => {
    const gap = cm < lo ? lo - cm : cm - hi;
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  });
  return best;
}
