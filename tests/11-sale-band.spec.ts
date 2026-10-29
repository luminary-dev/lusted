import { test, expect } from "./fixtures";
import { saleBand } from "../src/lib/sale-band";

// The home page's sale band, worded from what is on sale. These run in Node — no page, no browser — over made-up sales,
// since the catalogue only ever holds one of them at a time (03-home.spec.ts checks the band the live catalogue gives).
const NAMES = { lingerie: "Lace Secrets", swim: "Sun Kissed", "after-dark": "Midnight Sins" } as const;
const band = (...pieces: [keyof typeof NAMES, number][]) => saleBand(pieces.map(([category, discount]) => ({ category, discount })), (c) => NAMES[c]);

test.describe("sale band wording", () => {
  test("nothing on sale: no band", () => {
    expect(band()).toBeNull();
  });

  test("an all-swim sale keeps the bikini band word for word", () => {
    expect(band(["swim", 20], ["swim", 20])).toEqual({
      eyebrow: "The Bikini Sale",
      lead: "Barely there.",
      offer: "Now 20% off.",
      body: "Less fabric, less to pay, nothing left to hide behind. Consider it permission to show them everything — while your size lasts.",
      cta: "Shop the bikini sale",
      href: "/products?sale=1&cat=swim",
    });
  });

  test("a single-collection sale names its collection, says nothing of bikinis and links to that collection's sale", () => {
    for (const [cat, name] of [["lingerie", "Lace Secrets"], ["after-dark", "Midnight Sins"]] as const) {
      const b = band([cat, 15], [cat, 15])!;
      expect(b.eyebrow).toBe(`The ${name} Sale`);
      expect(b.href).toBe(`/products?sale=1&cat=${cat}`);
      expect(b.cta).toMatch(/sale/i);
      expect(JSON.stringify(b)).not.toMatch(/bikini/i);
    }
  });

  test("a sale across collections is just the sale, and links to every sale piece", () => {
    const b = band(["swim", 20], ["lingerie", 20])!;
    expect(b.eyebrow).toBe("The Sale");
    expect(b.cta).toBe("Shop the sale");
    expect(b.href).toBe("/products?sale=1");
    expect(JSON.stringify(b)).not.toMatch(/bikini/i);
  });

  test("different discounts read 'Up to' the deepest; the same discount reads 'Now'", () => {
    expect(band(["lingerie", 10], ["lingerie", 30])!.offer).toBe("Up to 30% off.");
    expect(band(["after-dark", 25])!.offer).toBe("Now 25% off.");
  });
});
