import { test, expect, go, main, CATALOG, bagDialog, parsePrice } from "./fixtures";

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
    await expect(page.locator(".buy-group").getByRole("link", { name: "Size guide" })).toHaveAttribute("href", "/#size-guide");
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
    await expect(bag.locator(".bag-item")).toContainText("Wine · XL");
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
});

test.describe("other product shapes", () => {
  test("a single-colour sale piece: no colour picker, sale badge and struck-through price, discount maths", async ({ prepared: page }) => {
    await go(page, `/products/${CATALOG.sale[0]}`);
    await expect(page.locator(".buy-colors")).toHaveCount(0);
    await expect(page.locator(".pdp-main .badge-sale")).toHaveText("−20%");
    const now = parsePrice((await page.locator(".pdp-price .price-now").textContent())!);
    const was = parsePrice((await page.locator(".pdp-price .price-was").textContent())!);
    expect(Math.round(was * 0.8)).toBe(now);
    await expect(page.locator(".pdp-info .eyebrow")).toHaveText("Sun Kissed");
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
