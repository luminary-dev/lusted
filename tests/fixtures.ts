import { test as base, expect, type Page, type Locator } from "@playwright/test";

/* ───────── the viewport matrix (responsive-dimensions-oct-2026.txt) ───────── */
export type Viewport = { name: string; w: number; h: number; kind: "phone" | "foldable" | "tablet" | "laptop" | "desktop" | "boundary" | "landscape"; dpr?: number };

const vp = (kind: Viewport["kind"]) => (name: string, w: number, h: number, dpr?: number): Viewport => ({ name, w, h, kind, dpr });
const phone = vp("phone"), fold = vp("foldable"), tablet = vp("tablet"), laptop = vp("laptop"), desktop = vp("desktop"), boundary = vp("boundary"), landscape = vp("landscape");

export const PHONES: Viewport[] = [
  phone("iPhone SE 1st gen", 320, 568, 2),
  phone("iPhone SE 2/3, 6–8", 375, 667, 2),
  phone("iPhone X / XS / 11 Pro", 375, 812, 3),
  phone("iPhone 12/13 mini · Galaxy S23–S26", 360, 780, 3),
  phone("iPhone 12–14, 17e", 390, 844, 3),
  phone("iPhone 14 Pro – 16", 393, 852, 3),
  phone("iPhone 16 Pro, 17, 17 Pro", 402, 874, 3),
  phone("iPhone 6s–8 Plus", 414, 736, 3),
  phone("iPhone XR / 11 / Pro Max", 414, 896, 2),
  phone("iPhone Air", 420, 912, 3),
  phone("iPhone 12–14 Pro Max / Plus", 428, 926, 3),
  phone("iPhone 14 Pro Max – 16 Plus", 430, 932, 3),
  phone("iPhone 16/17 Pro Max", 440, 956, 3),
  phone("Galaxy S25+/Ultra/Edge", 412, 891, 3.5),
  phone("Galaxy A35/A55", 412, 892, 2.625),
  phone("Galaxy A36", 412, 918, 2.625),
  phone("Galaxy Z Flip 7 main", 360, 840, 3),
  phone("Galaxy S6/S7 legacy", 360, 640, 3),
  phone("Galaxy S8/S9 legacy", 360, 740, 4),
  phone("Galaxy S20+/S21 Ultra", 384, 854, 3.75),
  phone("Galaxy S20 Ultra · Pixel 6–8", 412, 915, 3),
  phone("Pixel 5 / 4a · Xiaomi", 393, 851, 3),
  phone("Pixel 9 / 10", 360, 808, 3),
  phone("Pixel 9/10 Pro", 427, 952, 3),
  phone("Pixel 8/9/10 Pro XL", 448, 997, 3),
  phone("OnePlus 12/13", 412, 905, 3),
  phone("OnePlus Nord 4", 360, 924, 3),
  phone("Xiaomi Mi 10T class", 393, 873, 3),
  phone("Generic Android 360×800", 360, 800, 3),
  phone("Mid-range Android 384×832", 384, 832, 3),
  phone("Older 18:9 budget", 360, 720, 2),
];
export const FOLDABLES: Viewport[] = [
  fold("Galaxy Z Fold 7 unfolded", 984, 1092, 2),
  fold("Galaxy Z Fold 7 cover", 360, 840, 3),
  fold("Galaxy Z Fold 2 unfolded", 884, 1104, 2),
  fold("Original Galaxy Fold unfolded", 768, 1076, 2),
];
export const TABLETS: Viewport[] = [
  tablet("Small Android tablet", 600, 960, 2),
  tablet("iPad mini 7", 744, 1133, 2),
  tablet("iPad classic / 768", 768, 1024, 2),
  tablet("MatePad / Galaxy Tab", 800, 1280, 2),
  tablet("iPad 10.2", 810, 1080, 2),
  tablet("iPad 11th gen / Air 11", 820, 1180, 2),
  tablet("iPad Air 10.5", 834, 1112, 2),
  tablet("iPad Pro 11 (older)", 834, 1194, 2),
  tablet("iPad Pro 11 M4", 834, 1210, 2),
  tablet("iPad Air 13 / Pro 12.9", 1024, 1366, 2),
  tablet("iPad Pro 13 M4", 1032, 1376, 2),
];
export const TABLETS_LANDSCAPE: Viewport[] = [
  landscape("iPad classic landscape", 1024, 768, 2),
  landscape("iPad mini 7 landscape", 1133, 744, 2),
  landscape("iPad 11 landscape", 1180, 820, 2),
  landscape("iPad Pro 11 landscape", 1194, 834, 2),
  landscape("iPad Pro 11 M4 landscape", 1210, 834, 2),
  landscape("iPad Pro 12.9 landscape", 1366, 1024, 2),
  landscape("iPad Pro 13 M4 landscape", 1376, 1032, 2),
  landscape("Short landscape phone", 667, 375, 2),
  landscape("Landscape phone 844×390", 844, 390, 3),
];
export const LAPTOPS: Viewport[] = [
  laptop("Small laptop / Surface Pro", 1280, 720, 1),
  laptop("MacBook Air 13 (older)", 1280, 800, 2),
  laptop("MacBook Air 13 M3/M4", 1280, 832, 2),
  laptop("Budget Windows laptop", 1366, 768, 1),
  laptop("Surface Pro 4–7", 1368, 912, 2),
  laptop("MacBook Pro 15 (older)", 1440, 900, 2),
  laptop("MacBook Air 15", 1440, 932, 2),
  laptop("MacBook Air 13 scaled", 1470, 956, 2),
  laptop("Surface Laptop 13.5", 1504, 1003, 2),
  laptop("MacBook Pro 14 M4", 1512, 982, 2),
  laptop("Windows 125% scaling", 1536, 864, 1.25),
  laptop("Surface Laptop 15", 1664, 1110, 2),
  laptop("MacBook Pro 16 M4", 1728, 1117, 2),
];
export const DESKTOPS: Viewport[] = [
  desktop("Full HD", 1920, 1080, 1),
  desktop("1600×900", 1600, 900, 1),
  desktop("1680×1050", 1680, 1050, 1),
  desktop("WUXGA 1920×1200", 1920, 1200, 1),
  desktop("Ultrawide FHD 21:9", 2560, 1080, 1),
  desktop("QHD 27in", 2560, 1440, 1),
  desktop("Ultrawide QHD 21:9", 3440, 1440, 1),
  desktop("4K at DPR 1", 3840, 2160, 1),
  desktop("Super-ultrawide 32:9", 5120, 1440, 1),
  desktop("Old monitor / kiosk 800×600", 800, 600, 1),
  desktop("Old monitor 1024×768", 1024, 768, 1),
];
// the site's own breakpoints (479, 600, 700, 760, 900, 1080, 1100, 1240) and the framework ones, each at -1 / 0 / +1
const BREAKS = [320, 359, 360, 375, 390, 393, 402, 412, 414, 420, 430, 440, 479, 480, 481, 500, 575, 576, 599, 600, 601, 639, 640, 699, 700, 701, 759, 760, 761, 767, 768, 839, 840, 899, 900, 901, 991, 992, 1023, 1024, 1079, 1080, 1081, 1099, 1100, 1101, 1199, 1200, 1239, 1240, 1241, 1279, 1280, 1300, 1399, 1400, 1439, 1440, 1535, 1536, 1599, 1600, 1700, 1919, 1920, 2559, 2560];
export const BOUNDARIES: Viewport[] = BREAKS.map((w) => boundary(`width ${w}`, w, w < 700 ? 820 : 900, 1));

export const ALL_DEVICES: Viewport[] = [...PHONES, ...FOLDABLES, ...TABLETS, ...TABLETS_LANDSCAPE, ...LAPTOPS, ...DESKTOPS];
export const MINIMUM_SET: Viewport[] = [
  phone("320", 320, 568), phone("360", 360, 800), phone("375", 375, 812), phone("390", 390, 844), phone("393", 393, 852), phone("402", 402, 874), phone("412", 412, 915), phone("430", 430, 932), phone("440", 440, 956),
  landscape("667×375", 667, 375), fold("Fold cover 360", 360, 840), fold("Fold 7 unfolded 984", 984, 1092),
  tablet("600", 600, 960), tablet("768", 768, 1024), tablet("820", 820, 1180), tablet("1024", 1024, 1366),
  landscape("1024×768", 1024, 768), landscape("1180×820", 1180, 820), landscape("1366×1024", 1366, 1024),
  laptop("1280", 1280, 800), laptop("1366", 1366, 768), laptop("1440", 1440, 900), laptop("1536", 1536, 864),
  desktop("1920", 1920, 1080), desktop("2560", 2560, 1440), desktop("3440", 3440, 1440),
];

/* ───────── catalogue facts the tests assert against ───────── */
export const CATALOG = {
  total: 37,
  byCategory: { lingerie: 19, swim: 11, "after-dark": 7 },
  sale: ["pearl-seduction-bikini", "scarlet-sin-bikini", "noir-temptress-bikini", "golden-goddess-bikini"],
  bestSellers: ["rose-lace-balconette-bra", "siren-chainmail-mini", "bloom-lace-up-ruffle-mini", "fleur-embroidered-satin-slip", "mykonos-chain-bikini", "wisteria-embroidered-bustier-set"],
  newest: ["fleur-embroidered-satin-slip", "lotus-satin-cheongsam", "scarlet-butterfly-teddy", "bloom-lace-up-ruffle-mini", "jade-dragon-cheongsam", "wisteria-embroidered-bustier-set"],
  multiColour: { "rose-lace-balconette-bra": ["blush", "wine"], "rose-lace-high-waist-brief": ["blush", "wine"], "camille-satin-bow-bralette": ["ivory", "blush"], "juliette-lace-bodysuit": ["black", "blush"], "margot-silk-slip": ["champagne", "wine"], "amelie-garter-belt": ["black", "blush"], "wisteria-embroidered-bustier-set": ["lilac", "aqua"] },
  sizes: ["XS", "S", "M", "L", "XL"],
  colours: { blush: "Blush", wine: "Wine", black: "Black", ivory: "Ivory", champagne: "Champagne", mocha: "Mocha", lilac: "Lilac", aqua: "Aqua" },
  priceRange: [2900, 12900],
  perPage: 15,
  pages: 3,
  whatsapp: "6581234567",
  email: "support@lusted.lk",
  instagram: "lusted.lk",
  hero: { slug: "rose-lace-balconette-bra", name: "Rosé Lace Balconette Bra", price: 4900, colours: ["blush", "wine"] },
};
export const ROUTES = ["/", "/products", `/products/${CATALOG.hero.slug}`, "/about", "/favourites", "/privacy", "/terms"];

/* ───────── helpers ───────── */
export const parsePrice = (s: string) => Number((s.match(/LKR\s*([\d,]+)/)?.[1] ?? "0").replace(/,/g, ""));
export const slugs = async (cards: Locator) => (await cards.locator("a[aria-label]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!.split("/").pop()))) as string[];

/** every element whose box pokes out of the viewport on the right, with its width — for horizontal-overflow reports */
export async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const html = document.documentElement, body = document.body;
    const bad: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        // skip things deliberately off-canvas (menus, drawers, slides) and anything clipped by an overflow:hidden ancestor
        const cs = getComputedStyle(el);
        if (cs.position === "fixed" || cs.visibility === "hidden" || cs.opacity === "0") continue;
        let p = el.parentElement, clipped = false;
        while (p && p !== body) {
          const o = getComputedStyle(p);
          if (/(hidden|clip|auto|scroll)/.test(o.overflowX) || o.overflow === "hidden" || o.contain.includes("paint")) { clipped = true; break; }
          p = p.parentElement;
        }
        if (clipped) continue;
        bad.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} [${Math.round(r.left)}…${Math.round(r.right)} of ${vw}]`);
      }
    }
    return { scrollWidth: Math.max(html.scrollWidth, body.scrollWidth), clientWidth: html.clientWidth, offenders: [...new Set(bad)].slice(0, 12) };
  });
}

export async function expectNoHorizontalScroll(page: Page, label = "") {
  const r = await overflowReport(page);
  expect(r.scrollWidth, `${label} horizontal overflow: scrollWidth ${r.scrollWidth} > ${r.clientWidth}. Offenders: ${r.offenders.join(" | ") || "none found"}`).toBeLessThanOrEqual(r.clientWidth + 1);
}

/** opens a page with the intro skipped, animations calmed and console errors collected */
export const test = base.extend<{ errors: string[]; prepared: Page }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (/favicon|ERR_ABORTED|net::ERR_|Download the React DevTools/i.test(t)) return;
      errors.push(t);
    });
    page.on("response", (r) => {
      if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
    });
    await provide(errors);
  },
  prepared: async ({ page, errors }, provide) => {
    // until reveal day the proxy shows /revealing-soon everywhere; the preview cookie is the way through (src/proxy.ts)
    await page.context().addCookies([{ name: "lusted-preview", value: "1", url: process.env.PW_BASE_URL ?? "http://localhost:3177" }]);
    void errors;
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("lusted-intro", "1");
        if (localStorage.getItem("lusted-theme") === null) localStorage.setItem("lusted-theme", "light"); // a deterministic start, but a choice sticks
      } catch {}
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await provide(page);
  },
});
export { expect };

export async function go(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "load" });
  await page.waitForFunction(() => document.fonts.status === "loaded");
  return res;
}

/** for `[data-reveal]` content: force every reveal block visible so assertions don't depend on scroll position */
export async function revealAll(page: Page) {
  await page.addStyleTag({ content: "[data-reveal]{animation:none!important;opacity:1!important;transform:none!important}" });
}

/** Next keeps previously visited pages mounted (hidden) for instant back navigation — scope to the one on screen */
export const main = (page: Page) => page.locator("main:visible");
export const navToggle = (page: Page) => page.getByRole("button", { name: /open menu|close menu/i });
export const openBag = (page: Page) => page.getByRole("button", { name: /^open bag/i });
export const bagDialog = (page: Page) => page.getByRole("dialog", { name: "Your bag" });
export const searchDialog = (page: Page) => page.getByRole("dialog", { name: "Search" });
