import { test, expect, go, main, CATALOG, bagDialog, parsePrice, searchDialog } from "./fixtures";
import { getProduct, inStock, soldOutPick, toViews, viewName, type Product } from "../src/lib/products";
import { backInStockText } from "../src/lib/order";

const { slug, name, price } = CATALOG.hero;
const fmt = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

test.describe("product page", () => {
  test.beforeEach(async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
  });

  test("breadcrumb, heading, price, description, 'made for' line and collection eyebrow", async ({ prepared: page }) => {
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link");
    await expect(crumbs).toHaveText(["Home", "Shop", "Lace Secrets"]);
    await expect(crumbs.nth(2)).toHaveAttribute("href", "/products?cat=lingerie");
    await expect(page.locator("h1")).toHaveText(name);
    await expect(page.locator(".pdp-price .price-now")).toHaveText(fmt(price));
    await expect(page.locator(".pdp-info .lede")).toContainText(/Hand wash|wash/i);
    await expect(page.locator(".pdp-moments")).toContainText(/^Wear it for .+ & .+\. Then don’t\.$/);
    await expect(page.locator(".pdp-info .eyebrow")).toHaveText("Lace Secrets");
  });

  test("'Details & care' lists the piece's fabric, construction and care lines from the catalogue", async ({ prepared: page }) => {
    const details = page.getByRole("region", { name: "Details & care" });
    await expect(details.getByRole("heading", { level: 2 })).toHaveText("Details & care");
    const items = details.getByRole("listitem");
    await expect(items).toHaveCount(CATALOG.hero.details.length);
    await expect(items).toHaveText(CATALOG.hero.details);
  });

  test("gallery: front large, back and side thumbnails, choosing one swaps the main view and its label", async ({ prepared: page }) => {
    const main = page.locator(".pdp-main img.is-active");
    await expect(main).toHaveAttribute("alt", `${name} — front view`);
    await expect(page.locator(".pdp-view")).toHaveText("Front");
    const thumbs = page.getByRole("group", { name: "More views" }).getByRole("button");
    await expect(thumbs).toHaveText(["Back", "Side"]);
    await thumbs.filter({ hasText: "Side" }).click();
    await expect(page.locator(".pdp-main img.is-active")).toHaveAttribute("alt", `${name} — side view`);
    await expect(page.locator(".pdp-view")).toHaveText("Side");
    await expect(page.getByRole("group", { name: "More views" }).getByRole("button")).toHaveText(["Front", "Back"]);
    await expect.poll(() => page.locator(".pdp-main img.is-active").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    await expect(page.locator(".pdp-main .badge", { hasText: "Best seller" })).toBeVisible();
  });

  test("colour picker swaps the whole gallery to that colourway and resets to the front view", async ({ prepared: page }) => {
    const picker = page.locator(".buy-colors").getByRole("button");
    await expect(picker).toHaveCount(2);
    await expect(picker.nth(0)).toHaveAccessibleName("Blush");
    await expect(page.locator(".buy-label", { hasText: "Colour" })).toContainText("Blush");
    await page.getByRole("group", { name: "More views" }).getByRole("button", { name: /back/ }).click();
    await expect(page.locator(".pdp-view")).toHaveText("Back");
    await picker.nth(1).click();
    await expect(picker.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".buy-label", { hasText: "Colour" })).toContainText("Wine");
    await expect(page.locator(".pdp-view")).toHaveText("Front");
    const src = await page.locator(".pdp-main img.is-active").getAttribute("src");
    expect(src).toMatch(/wine/);
    await expect(page.locator(".pdp-main img.is-active")).toHaveAttribute("alt", `${name} — front view`);
  });

  test("size is required: add to bag and WhatsApp both nudge until one is picked, the fit note shows", async ({ prepared: page }) => {
    await expect(page.locator(".buy-fit")).toContainText(/True to size|Runs small|Runs large/);
    // the guide opens over the piece now instead of sending the shopper to the home page and losing their choices
    const guide = page.locator(".buy-group").getByRole("button", { name: "Size guide" });
    await guide.click();
    const chart = page.getByRole("dialog", { name: "Find your size" });
    await expect(chart).toBeVisible();
    await chart.getByRole("button", { name: "Close the size guide" }).click();
    await expect(chart).toBeHidden();
    await page.getByRole("button", { name: /Add to bag/ }).click();
    await expect(page.locator(".buy-warn")).toHaveText("Please choose a size");
    await expect(page.locator(".drawer-root")).not.toHaveClass(/is-open/);
    // the WhatsApp button is always a real link (crawlable, reachable by keyboard), but without a size a click only
    // asks for one — nothing opens
    const wa = page.locator(".buy-whatsapp");
    expect(await wa.getAttribute("href")).toContain(`wa.me/${CATALOG.whatsapp}`);
    const popup = page.context().waitForEvent("page", { timeout: 1500 }).catch(() => null);
    await wa.click();
    expect(await popup).toBeNull();
    await expect(page.locator(".buy-warn")).toHaveText("Please choose a size");
    await page.locator(".pdp-info .size-chips").getByRole("button", { name: "M", exact: true }).click();
    await expect(page.locator(".buy-warn")).toHaveCount(0);
    const href = (await wa.getAttribute("href"))!;
    expect(href).toContain(`wa.me/${CATALOG.whatsapp}`);
    const text = decodeURIComponent(href.split("text=")[1]);
    expect(text).toContain(name);
    expect(text).toContain("Blush, size M, qty 1");
    expect(text).toContain(fmt(price));
    // the piece's link and blank lines for the shopper to fill in follow
    expect(text).toContain(`).\n${new URL(page.url()).origin}/products/${slug}\n\nName:\nCity / town:`);
  });

  test("a trust strip under the WhatsApp button promises only what the terms do and leads to delivery, returns & FAQ", async ({ prepared: page }) => {
    const promises = ["Plain, unbranded box", "Delivery across Sri Lanka", "7-day exchange", "Sizing help from a real person"];
    const strip = main(page).locator(".buy").getByRole("list", { name: "Ordering with Lusted" });
    await expect(strip.getByRole("listitem")).toHaveText(promises);
    await expect(main(page).locator(".buy").getByRole("link", { name: "Delivery, returns & FAQ" })).toHaveAttribute("href", "/help");
    // the bag carries the same strip beside its send button, and following its link closes the bag
    await page.locator(".pdp-info .size-chips").getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: /Add to bag/ }).click();
    const bag = bagDialog(page);
    await expect(bag.getByRole("list", { name: "Ordering with Lusted" }).getByRole("listitem")).toHaveText(promises);
    await bag.getByRole("link", { name: "Delivery, returns & FAQ" }).click();
    await expect(page).toHaveURL(/\/help$/);
    await expect(page.locator(".drawer-root")).not.toHaveClass(/is-open/);
  });

  test("quantity stepper stays within 1–10 and the button price multiplies", async ({ prepared: page }) => {
    const stepper = page.locator(".buy-actions .stepper");
    const minus = stepper.getByRole("button", { name: "Decrease quantity" });
    const plus = stepper.getByRole("button", { name: "Increase quantity" });
    await expect(stepper.locator("span")).toHaveText("1");
    await minus.click();
    await expect(stepper.locator("span")).toHaveText("1");
    for (let i = 0; i < 12; i++) await plus.click();
    await expect(stepper.locator("span")).toHaveText("10");
    await expect(page.getByRole("button", { name: /Add to bag/ })).toContainText(fmt(price * 10));
    await minus.click();
    await expect(page.getByRole("button", { name: /Add to bag/ })).toContainText(fmt(price * 9));
    await page.locator(".pdp-info .size-chips").getByRole("button", { name: "S", exact: true }).click();
    expect(decodeURIComponent((await page.locator(".buy-whatsapp").getAttribute("href"))!)).toContain(`qty 9 (${fmt(price * 9)})`);
  });

  test("add to bag opens the drawer with colour, size, quantity and subtotal, and the nav badge updates", async ({ prepared: page }) => {
    await page.locator(".buy-colors").getByRole("button", { name: "Wine" }).click();
    await page.locator(".pdp-info .size-chips").getByRole("button", { name: "XL", exact: true }).click();
    await page.locator(".buy-actions").getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: /Add to bag/ }).click();
    const bag = bagDialog(page);
    await expect(page.locator(".drawer-root")).toHaveClass(/is-open/);
    await expect(bag.locator(".drawer-head h2")).toContainText("(2)");
    await expect(bag.locator(".bag-item .bag-meta")).toContainText("Wine");
    await expect(bag.locator(".bag-item .bag-size select")).toHaveValue("XL");
    await expect(bag.locator(".bag-item .stepper span")).toHaveText("2");
    await expect(bag.locator(".bag-item strong")).toHaveText(fmt(price * 2));
    await expect(bag.locator(".drawer-total strong")).toHaveText(fmt(price * 2));
    await expect(page.getByRole("button", { name: "Open bag, 2 items" })).toBeVisible();
    const order = decodeURIComponent((await bag.getByRole("link", { name: /Send order on WhatsApp/ }).getAttribute("href"))!);
    expect(order).toContain(`• ${name} — Wine, size XL × 2 (${fmt(price * 2)})`);
    expect(order).toContain(`Subtotal: ${fmt(price * 2)}`);
  });

  test("the heart saves the piece and the related row shows four other pieces from the same collection", async ({ prepared: page }) => {
    await page.locator(".buy-fav").click();
    await expect(page.getByRole("link", { name: "Favourites, 1 saved" })).toBeVisible();
    await expect(page.locator(".buy-fav")).toHaveAccessibleName(`Remove ${name} from favourites`);
    const related = page.locator(".related .product-card");
    await expect(related).toHaveCount(4);
    await expect(page.locator(".related h2")).toContainText(name);
    const hrefs = await related.locator(".product-info").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    expect(hrefs).not.toContain(`/products/${slug}`);
    await related.first().locator(".product-info").click();
    await expect(page).toHaveURL(/\/products\/[a-z-]+$/);
    await expect(main(page).locator(".pdp-info .eyebrow")).toHaveText("Lace Secrets");
  });

  test("'Complete the set' shows the pieces made to go with it, and the related row leaves them out", async ({ prepared: page }) => {
    const pairs = CATALOG.pairsOf(slug);
    test.skip(pairs.length === 0, `${slug} is paired with nothing in the catalogue`);
    const set = page.locator(".pairs");
    await expect(set.locator(".eyebrow")).toHaveText("Complete the set");
    await expect(set.locator("h2")).toContainText(name);
    const hrefsOf = (cards: import("@playwright/test").Locator) =>
      cards.locator(".product-info").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    await expect(set.locator(".product-card")).toHaveCount(pairs.length);
    expect(await hrefsOf(set.locator(".product-card"))).toEqual(pairs.map((s) => `/products/${s}`));
    const related = await hrefsOf(page.locator(".related .product-card"));
    for (const s of pairs) expect(related, `${s} shows once, under "Complete the set"`).not.toContain(`/products/${s}`);
  });
});

test.describe("other product shapes", () => {
  test("a single-colour sale piece: no colour picker, sale badge and struck-through price, discount maths", async ({ prepared: page }) => {
    const sample = CATALOG.sampleSale;
    await go(page, `/products/${sample.slug}`);
    if (sample.singleColour) await expect(page.locator(".buy-colors")).toHaveCount(0);
    await expect(page.locator(".pdp-main .badge-sale")).toHaveText(`−${CATALOG.discount(sample.slug)}%`);
    const now = parsePrice((await page.locator(".pdp-price .price-now").textContent())!);
    const was = parsePrice((await page.locator(".pdp-price .price-was").textContent())!);
    expect(now).toBe(CATALOG.salePriceOf(sample.slug));
    expect(was).toBe(CATALOG.priceOf(sample.slug));
    await expect(page.locator(".pdp-info .eyebrow")).toHaveText(sample.collection);
    await page.locator(".pdp-info .size-chips").getByRole("button").first().click();
    await page.getByRole("button", { name: /Add to bag/ }).click();
    await expect(bagDialog(page).locator(".drawer-total strong")).toHaveText(`LKR ${now.toLocaleString("en-LK")}`);
  });

  test("every multi-colour piece swaps its gallery for each colour", async ({ prepared: page }) => {
    test.slow();
    for (const [s, cols] of Object.entries(CATALOG.multiColour)) {
      await go(page, `/products/${s}`);
      const picker = page.locator(".buy-colors").getByRole("button");
      await expect(picker, s).toHaveCount(cols.length);
      for (const [i, c] of cols.entries()) {
        await picker.nth(i).click();
        await expect(page.locator(".buy-label", { hasText: "Colour" }), `${s} ${c}`).toContainText(CATALOG.colours[c as keyof typeof CATALOG.colours]);
        const src = (await page.locator(".pdp-main img.is-active").getAttribute("src"))!;
        if (i > 0) expect(src, `${s}: ${c} should have its own photo`).toMatch(new RegExp(`--${c}|${c}`));
      }
    }
  });
});

test.describe("product page on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("gallery, thumbnails, pickers and the add button all fit and work by tap", async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
    await expect(page.locator(".pdp-main")).toBeVisible();
    await page.getByRole("group", { name: "More views" }).getByRole("button", { name: /back/ }).tap();
    await expect(page.locator(".pdp-view")).toHaveText("Back");
    await page.locator(".pdp-info .size-chips").getByRole("button", { name: "M", exact: true }).tap();
    await page.getByRole("button", { name: /Add to bag/ }).tap();
    await expect(page.locator(".drawer-root")).toHaveClass(/is-open/);
    const box = await page.locator(".drawer").boundingBox();
    expect(box!.width).toBeLessThanOrEqual(390);
  });
});

// Up to three optional photos per colour, after front, back and side (src/lib/products.ts). No piece has them yet, so
// the order and names the gallery gets are checked on stand-in photos rather than on a page.
test("gallery views: the optional photos follow front, back and side, named by where they show", () => {
  const photo = (src: string) => ({ src, width: 900, height: 1600, blurDataURL: "" });
  const views = toViews({ front: photo("f"), side: photo("s"), extra1: photo("4"), extra3: photo("6") });
  expect(views.map((v) => v.label)).toEqual(["Front", "Side", "Photo 3", "Photo 4"]);
  expect(views.map((v) => v.src.src)).toEqual(["f", "s", "4", "6"]); // a gap left by one taken off closes up
  expect(toViews({ front: photo("f"), back: photo("b") }).map((v) => v.label)).toEqual(["Front", "Back"]);
  // the alt text and the thumbnail's name: "front view", but "photo 3"
  expect(viewName("Front")).toBe("front view");
  expect(viewName("Photo 3")).toBe("photo 3");
});

// Sold-out sizes (`soldOut` in the catalogue, marked from the console's ledger). Nothing in the catalogue is sold out,
// and the catalogue is built into the page's script, so the page is shown it through the browser instead: the script
// that carries the catalogue is answered with two best sellers marked sold out — one in a single size, one in every
// size — and the real catalogue is never touched. The pieces are reached by a client-side link (the search dialog,
// from a page that shows neither), so the page draws them in the browser from that catalogue rather than hydrating
// the server's HTML, which was drawn from the real one.
test.describe("sold-out sizes", () => {
  const [partly, wholly] = CATALOG.bestSellers.map((s) => getProduct(s)!);
  const goneSize = partly.sizes.includes("M") ? "M" : partly.sizes[1];
  const inSize = partly.sizes.find((s) => s !== goneSize)!;

  test.beforeEach(async ({ prepared: page }) => {
    const marked = new Set<string>();
    await page.route(/\/_next\/static\/chunks\/.+\.js(\?.*)?$/, async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      const mark = (text: string, slug: string, sizes: string[]) =>
        text.replace(`"slug":"${slug}",`, () => (marked.add(slug), `"slug":"${slug}","soldOut":${JSON.stringify(sizes)},`));
      await route.fulfill({ response: res, body: mark(mark(body, partly.slug, [goneSize]), wholly.slug, wholly.sizes) });
    });
    await go(page, "/about");
    await page.keyboard.press("/");
    await expect(searchDialog(page).locator(".search-results")).toBeVisible();
    expect(marked.size, "the catalogue's script was found and both pieces marked").toBe(2);
  });

  const open = async (page: import("@playwright/test").Page, slug: string) => {
    await searchDialog(page).locator(`a[href="/products/${slug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
    await expect(page.locator(".pdp-info .size-chips")).toBeVisible();
  };

  test("a sold-out size stays pickable, struck through, and turns the button into a WhatsApp ask for that size", async ({ prepared: page }) => {
    await open(page, partly.slug);
    const chips = page.locator(".pdp-info .size-chips");
    const gone = chips.getByRole("button", { name: `${goneSize} — sold out` });
    await expect(gone).toBeEnabled();
    await expect(gone).toHaveClass(/is-gone/);
    await expect(gone).toHaveCSS("text-decoration-line", "line-through");
    await expect(chips.getByRole("button", { name: inSize, exact: true })).not.toHaveClass(/is-gone/);
    // until a size is picked, the piece can still be bagged in the others
    await expect(page.getByRole("button", { name: /Add to bag/ })).toBeVisible();

    await gone.click();
    await expect(gone).toHaveAttribute("aria-pressed", "true");
    const ask = page.locator(".buy-actions").getByRole("link", { name: "Message me when it’s back" });
    await expect(ask).toBeVisible();
    await expect(ask).toHaveAttribute("data-wa-source", "back-in-stock");
    await expect(ask).toHaveAttribute("target", "_blank");
    const href = (await ask.getAttribute("href"))!;
    expect(href).toContain(`wa.me/${CATALOG.whatsapp}`);
    const colour = CATALOG.colours[partly.colors[0] as keyof typeof CATALOG.colours];
    expect(decodeURIComponent(href.split("text=")[1])).toBe(
      `Hi Lusted! The ${partly.name} — ${colour}, size ${goneSize} — is sold out just now.\n${new URL(page.url()).origin}/products/${partly.slug}\nPlease message me when it's back in ${goneSize}.`,
    );
    // nothing to bag, no quantity, and no second WhatsApp link that would order what's gone
    await expect(page.getByRole("button", { name: /Add to bag/ })).toHaveCount(0);
    await expect(page.locator(".buy-actions .stepper")).toHaveCount(0);
    await expect(page.locator(".buy-whatsapp")).toHaveCount(0);

    // a size that's in brings the bag back, and the bag won't switch the line to the one that's gone
    await chips.getByRole("button", { name: inSize, exact: true }).click();
    await page.getByRole("button", { name: /Add to bag/ }).click();
    const bag = bagDialog(page);
    await expect(bag).toBeVisible();
    await expect(bag.getByRole("option", { name: `${goneSize} — sold out` })).toHaveJSProperty("disabled", true);
    await expect(bag.getByRole("option", { name: inSize, exact: true })).toHaveJSProperty("disabled", false);
  });

  test("a piece gone in every size asks without a size, or for the one picked", async ({ prepared: page }) => {
    await open(page, wholly.slug);
    const chips = page.locator(".pdp-info .size-chips").getByRole("button");
    await expect(chips).toHaveCount(wholly.sizes.length);
    for (const i of wholly.sizes.keys()) await expect(chips.nth(i)).toHaveClass(/is-gone/);
    const ask = page.locator(".buy-actions").getByRole("link", { name: "Message me when it’s back" });
    const text = async () => decodeURIComponent((await ask.getAttribute("href"))!.split("text=")[1]);
    expect(await text()).toMatch(/is sold out just now\.\n.+\nPlease message me when it's back\.$/);
    await page.locator(".pdp-info .size-chips").getByRole("button", { name: `${wholly.sizes[0]} — sold out` }).click();
    expect(await text()).toMatch(new RegExp(`size ${wholly.sizes[0]} — is sold out just now\\.[\\s\\S]+back in ${wholly.sizes[0]}\\.$`));
    await expect(page.getByRole("button", { name: /Add to bag|Sold out/ })).toHaveCount(0);
  });
});

// The rules behind the sold-out UI, on made-up pieces (no page needed).
test("sold-out sizes: what can be bagged, when the page asks instead, and what the ask says", () => {
  const piece = (sizes: string[], soldOut?: string[]) => ({ sizes, soldOut }) as Product;
  const some = piece(["S", "M", "L"], ["M"]);
  expect(inStock(some, "S")).toBe(true);
  expect(inStock(some, "M")).toBe(false);
  expect(soldOutPick(some, null)).toBe(false); // nothing picked yet, and other sizes are in
  expect(soldOutPick(some, "S")).toBe(false);
  expect(soldOutPick(some, "M")).toBe(true);
  const none = piece(["S", "M"], ["S", "M"]);
  expect(soldOutPick(none, null)).toBe(true);
  expect(soldOutPick(none, "S")).toBe(true);
  expect(soldOutPick(piece(["S", "M"]), null)).toBe(false);
  expect(soldOutPick(piece(["S", "M"], []), "M")).toBe(false);

  const url = "https://lusted.lk/products/rose";
  expect(backInStockText({ name: "Rosé Bra", colour: "Wine", size: "M", url })).toBe(
    `Hi Lusted! The Rosé Bra — Wine, size M — is sold out just now.\n${url}\nPlease message me when it's back in M.`,
  );
  expect(backInStockText({ name: "Rosé Bra", colour: "Wine", size: null, url })).toBe(
    `Hi Lusted! The Rosé Bra — Wine — is sold out just now.\n${url}\nPlease message me when it's back.`,
  );
});
