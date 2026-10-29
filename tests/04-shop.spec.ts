import { test, expect, go, CATALOG, parsePrice, slugs, bagDialog, photographed } from "./fixtures";

const cards = (page: import("@playwright/test").Page) => page.locator("main:visible .product-grid .product-card");
const count = async (page: import("@playwright/test").Page) => Number((await page.locator("main:visible .results-bar p").textContent())!.match(/(?:of )?(\d+) pieces?$/)![1]);

test.describe("the shop", () => {
  test("lists every piece with the right tabs, counts and three pages of fifteen", async ({ prepared: page }) => {
    await go(page, "/products");
    await expect(page.locator(".shop-head .lede")).toContainText(`${CATALOG.total} pieces`);
    const tabs = page.getByRole("tablist", { name: "Category" }).getByRole("tab");
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText(`All ${CATALOG.total}`);
    await expect(tabs.nth(1)).toContainText(`Lace Secrets ${CATALOG.byCategory.lingerie}`);
    await expect(tabs.nth(2)).toContainText(`Sun Kissed ${CATALOG.byCategory.swim}`);
    await expect(tabs.nth(3)).toContainText(`Midnight Sins ${CATALOG.byCategory["after-dark"]}`);
    await expect(page.locator(".results-bar p")).toHaveText(`1–15 of ${CATALOG.total} pieces`);
    await expect(cards(page)).toHaveCount(CATALOG.perPage);
    const pager = page.getByRole("navigation", { name: "Pages" });
    await expect(pager.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(pager.getByRole("button", { name: "Next page" })).toBeEnabled();
    await expect(pager.locator("button[aria-current=page]")).toHaveText("1");
  });

  test("pagination: numbers, prev/next, the page in the URL, the last page short, and filters reset to page 1", async ({ prepared: page }) => {
    await go(page, "/products");
    const pager = page.getByRole("navigation", { name: "Pages" });
    const seen = new Set<string>();
    (await slugs(cards(page))).forEach((s) => seen.add(s));
    await pager.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator(".results-bar p")).toHaveText(`16–30 of ${CATALOG.total} pieces`);
    (await slugs(cards(page))).forEach((s) => seen.add(s));
    await pager.getByRole("button", { name: "3", exact: true }).click();
    await expect(page).toHaveURL(/page=3/);
    await expect(cards(page)).toHaveCount(CATALOG.total - 2 * CATALOG.perPage);
    await expect(pager.getByRole("button", { name: "Next page" })).toBeDisabled();
    (await slugs(cards(page))).forEach((s) => seen.add(s));
    expect(seen.size, "no piece repeats across pages").toBe(CATALOG.total);
    await pager.getByRole("button", { name: "Previous page" }).click();
    await expect(page).toHaveURL(/page=2/);
    // a filter change goes back to page 1
    await page.getByRole("tab", { name: /Lace Secrets/ }).click();
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.locator(".results-bar p")).toHaveText(`1–15 of ${CATALOG.byCategory.lingerie} pieces`);
    // out-of-range pages clamp
    await go(page, "/products?page=99");
    await expect(cards(page)).toHaveCount(CATALOG.total - 2 * CATALOG.perPage);
    await go(page, "/products?page=0");
    await expect(page.locator(".results-bar p")).toHaveText(`1–15 of ${CATALOG.total} pieces`);
  });

  test("category tabs filter, update the URL and are shareable", async ({ prepared: page }) => {
    await go(page, "/products");
    for (const [key, n] of Object.entries(CATALOG.byCategory)) {
      const name = { lingerie: "Lace Secrets", swim: "Sun Kissed", "after-dark": "Midnight Sins" }[key]!;
      await page.getByRole("tab", { name: new RegExp(name) }).click();
      await expect(page).toHaveURL(new RegExp(`cat=${key}`));
      await expect(page.getByRole("tab", { name: new RegExp(name) })).toHaveAttribute("aria-selected", "true");
      expect(await count(page)).toBe(n);
      await expect(cards(page)).toHaveCount(Math.min(n, CATALOG.perPage));
    }
    await page.getByRole("tab", { name: /^All/ }).click();
    await expect(page).toHaveURL(/\/products$/);
    await go(page, "/products?cat=after-dark");
    await expect(page.getByRole("tab", { name: /Midnight Sins/ })).toHaveAttribute("aria-selected", "true");
    expect(await count(page)).toBe(CATALOG.byCategory["after-dark"]);
  });

  test("search: debounced into the URL, a chip appears, the clear button and chip both clear it, nonsense shows the empty state", async ({ prepared: page }) => {
    await go(page, "/products");
    const box = page.getByRole("searchbox", { name: "Search products" }).first();
    await box.fill("lace");
    await expect(page).toHaveURL(/q=lace/);
    const n = await count(page);
    expect(n).toBeGreaterThan(5);
    await expect(page.locator(".chips .chip", { hasText: "“lace”" })).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(box).toHaveValue("");
    await expect(page).not.toHaveURL(/q=/);
    expect(await count(page)).toBe(CATALOG.total);
    await box.fill("silk bikini");
    await expect(page).toHaveURL(/q=silk\+bikini|q=silk%20bikini/);
    await page.locator(".chips .chip", { hasText: "silk bikini" }).click();
    await expect(box).toHaveValue("");
    await box.fill("qqqqq");
    // a search that found nothing says so about the word, not about "those filters" — and offers a way on
    await expect(page.locator(".empty-title")).toContainText("Nothing matched “qqqqq”");
    await expect(page.locator(".empty-suggest .product-card")).toHaveCount(4);
    await page.locator(".empty").getByRole("button", { name: "Clear the search" }).click();
    await expect(page).not.toHaveURL(/q=/);
    expect(await count(page)).toBe(CATALOG.total);
    await expect(box).toHaveValue("");
    // every word must match: "wine lace" ⊆ "lace"
    await box.fill("wine lace");
    await expect(page).toHaveURL(/q=wine\+lace|q=wine%20lace/);
    const both = await count(page);
    await box.fill("lace");
    await expect(page).toHaveURL(/q=lace$/);
    expect(both).toBeLessThanOrEqual(await count(page));
    // search by colour name and by collection name
    await box.fill("mocha");
    await expect(page).toHaveURL(/q=mocha$/);
    expect(await count(page)).toBeGreaterThan(0);
    await box.fill("midnight sins");
    await expect(page).toHaveURL(/q=midnight/);
    expect(await count(page)).toBe(CATALOG.byCategory["after-dark"]);
  });

  test("search: words match at word starts, without accents, plurals fold and shoppers' words find the catalogue's", async ({ prepared: page }) => {
    // every piece a search finds, across all its pages
    const found = async (q: string) => {
      await go(page, `/products?q=${encodeURIComponent(q)}`);
      const all = await slugs(cards(page));
      const pages = Math.ceil((await count(page)) / CATALOG.perPage);
      for (let n = 2; n <= pages; n++) {
        await go(page, `/products?q=${encodeURIComponent(q)}&page=${n}`);
        all.push(...(await slugs(cards(page))));
      }
      return all;
    };
    const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const text = (p: (typeof photographed)[number]) => fold([p.name, p.description, ...p.details, ...p.colors].join(" "));
    const words = (p: (typeof photographed)[number]) => text(p).split(/[^a-z0-9]+/);
    const slugsOf = (ps: typeof photographed) => ps.map((p) => p.slug);

    // a plural finds what its singular finds
    const bikinis = await found("bikinis");
    expect(bikinis).toEqual(expect.arrayContaining(slugsOf(photographed.filter((p) => /\bbikini\b/i.test(p.name)))));
    expect(bikinis.length).toBe((await found("bikini")).length);

    // "red" finds the wine pieces, but not a piece whose only "red" is inside a word ("underwired", "embroidered")
    const red = await found("red");
    expect(red).toEqual(expect.arrayContaining(slugsOf(photographed.filter((p) => p.colors.includes("wine")))));
    const insideOnly = photographed.filter(
      (p) => text(p).includes("red") && !p.colors.includes("wine") && !words(p).some((w) => w.startsWith("red") || ["scarlet", "rouge", "crimson"].includes(w)),
    );
    for (const p of insideOnly) expect(red).not.toContain(p.slug);

    // shoppers' words: "white" finds the ivory pieces, "panties" the briefs and thongs
    expect(await found("white")).toEqual(expect.arrayContaining(slugsOf(photographed.filter((p) => p.colors.includes("ivory")))));
    const briefs = photographed.filter((p) => fold([p.name, ...p.details].join(" ")).split(/[^a-z0-9]+/).some((w) => /^(brief|thong)s?$/.test(w)));
    expect(await found("panties")).toEqual(expect.arrayContaining(slugsOf(briefs)));

    // accents don't matter: "rose" finds the Rosé pieces
    expect(await found("rose")).toContain(CATALOG.hero.slug);
  });

  test("sort: price both ways really sorts, newest matches the dates, best selling leads with the ranked six", async ({ prepared: page }) => {
    await go(page, "/products");
    const select = page.getByRole("combobox");
    await expect(select.locator("option")).toHaveText(["Featured", "Best selling", "Newest", "Price: low to high", "Price: high to low"]);
    const prices = async () => (await cards(page).locator(".price-now").allTextContents()).map(parsePrice);
    await select.selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    let p = await prices();
    expect(p).toEqual([...p].sort((a, b) => a - b));
    expect(p[0]).toBe(CATALOG.priceRange[0]);
    await select.selectOption("price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);
    p = await prices();
    expect(p).toEqual([...p].sort((a, b) => b - a));
    expect(p[0]).toBe(CATALOG.priceRange[1]);
    await select.selectOption("new");
    await expect(page).toHaveURL(/sort=new/);
    expect((await slugs(cards(page))).slice(0, 6).sort()).toEqual([...CATALOG.newest].sort());
    for (let i = 0; i < 6; i++) await expect(cards(page).nth(i).locator(".badge", { hasText: "New" })).toHaveCount(1);
    await select.selectOption("best");
    await expect(page).toHaveURL(/sort=best/);
    expect((await slugs(cards(page))).slice(0, 6)).toEqual(CATALOG.bestSellers.slice(0, 6));
    await select.selectOption("featured");
    await expect(page).not.toHaveURL(/sort=/);
  });

  test("filters: on sale, new in and best sellers match the catalogue and show the right badges", async ({ prepared: page }) => {
    await go(page, "/products");
    const filters = page.getByRole("complementary", { name: "Filters" });
    await filters.getByLabel("On sale").click();
    await expect(page).toHaveURL(/sale=1/);
    await expect(filters.getByLabel("On sale")).toBeChecked();
    const onSale = await slugs(cards(page));
    expect([...onSale].sort()).toEqual([...CATALOG.sale].sort());
    for (const [i, s] of onSale.entries()) {
      await expect(cards(page).nth(i).locator(".badge-sale")).toHaveText(`−${CATALOG.discount(s)}%`);
      await expect(cards(page).nth(i).locator(".price-was")).toBeVisible();
    }
    await filters.getByLabel("On sale").click();
    await expect(page).not.toHaveURL(/sale=1/);
    await filters.getByLabel("New in").click();
    await expect(page).toHaveURL(/new=1/);
    expect((await slugs(cards(page))).sort()).toEqual([...CATALOG.newest].sort());
    await filters.getByLabel("Best sellers").click(); // AND: new ∩ best
    await expect(page).toHaveURL(/best=1/);
    const both = await slugs(cards(page));
    expect(both.every((s) => CATALOG.newest.includes(s) && CATALOG.bestSellers.includes(s))).toBe(true);
    await filters.getByLabel("New in").click();
    await expect(page).not.toHaveURL(/new=1/);
    expect((await slugs(cards(page))).sort()).toEqual([...CATALOG.bestSellers].sort());
    await expect(page.locator(".chips .chip", { hasText: "Best sellers" })).toBeVisible();
    await page.locator(".chips").getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/products$/);
    expect(await count(page)).toBe(CATALOG.total);
  });

  test("filters: sizes, colours and price buckets, alone and combined, with the counts next to each", async ({ prepared: page }) => {
    test.slow();
    await go(page, "/products");
    const filters = page.getByRole("complementary", { name: "Filters" });
    for (const s of CATALOG.sizes) await expect(filters.locator(".size-chips").getByRole("button", { name: s, exact: true })).toHaveAttribute("aria-pressed", "false");
    await filters.locator(".size-chips").getByRole("button", { name: "XS", exact: true }).click();
    await expect(page).toHaveURL(/size=XS/);
    const xs = await count(page);
    await filters.locator(".size-chips").getByRole("button", { name: "XL", exact: true }).click();
    await expect(page).toHaveURL(/size=XS%2CXL|size=XS,XL/);
    expect(await count(page)).toBeGreaterThanOrEqual(xs); // OR within one facet
    await expect(page.locator(".chips .chip")).toHaveText(["Size XS", "Size XL"]);
    await page.locator(".chips .chip", { hasText: "Size XS" }).click();
    await expect(page).toHaveURL(/size=XL$/);
    await page.locator(".chips .chip", { hasText: "Size XL" }).click();
    // colours: every card shown must carry that colour, and multi-colour cards open on it
    for (const [key, label] of Object.entries(CATALOG.colours)) {
      await filters.locator(".color-list").getByRole("button", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`color=${key}$`));
      const n = await count(page);
      if (n) {
        const alts = await cards(page).locator(".product-media > a > img:not(.product-back)").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")!));
        for (const alt of alts) expect(alt, `card alt when filtered by ${label}`).toMatch(new RegExp(`in ${label.toLowerCase()}$`));
      }
      await filters.locator(".color-list").getByRole("button", { name: label, exact: true }).click();
      await expect(page).not.toHaveURL(/color=/);
    }
    expect(await count(page)).toBe(CATALOG.total);
    // price buckets: every shown price falls in the bucket; the count beside the label is honest
    const buckets: [string, (n: number) => boolean][] = [
      ["Under LKR 5,000", (n) => n < 5000],
      ["LKR 5,000 – 7,000", (n) => n >= 5000 && n < 7000],
      ["LKR 7,000 – 10,000", (n) => n >= 7000 && n < 10000],
      ["LKR 10,000+", (n) => n >= 10000],
    ];
    let sum = 0;
    for (const [label, ok] of buckets) {
      const row = filters.locator("label.check", { hasText: label });
      const expected = Number(await row.locator("em").textContent());
      await row.getByRole("checkbox").click();
      await expect(page).toHaveURL(/price=/);
      expect(await count(page), label).toBe(expected);
      sum += expected;
      const shown = (await cards(page).locator(".price-now").allTextContents()).map(parsePrice);
      expect(shown.every(ok), `${label}: ${shown}`).toBe(true);
      await row.getByRole("checkbox").click();
      await expect(page).not.toHaveURL(/price=/);
    }
    expect(sum).toBe(CATALOG.total);
    // combined: category + size + colour + price + flag all AND together, and the badge on the Filters button counts them
    await go(page, "/products?cat=lingerie&size=M&color=blush&price=u5000&best=1");
    await expect(page.getByRole("tab", { name: /Lace Secrets/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".chips .chip")).toHaveCount(4);
    const n = await count(page);
    for (const s of await slugs(cards(page))) expect(CATALOG.bestSellers, s).toContain(s);
    expect(n).toBeLessThanOrEqual(CATALOG.bestSellers.length);
    await page.locator(".chips").getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/products\?cat=lingerie$/); // clear all keeps the collection tab
  });

  test("product cards: name, price, hover shows the back view, swatches swap the colourway, the heart saves", async ({ prepared: page }) => {
    await go(page, "/products");
    const card = cards(page).filter({ has: page.locator(`a[href^="/products/${CATALOG.hero.slug}"]`) }).first();
    await expect(card.locator("h3")).toHaveText(CATALOG.hero.name);
    await expect(card.locator(".price-now")).toHaveText(`LKR ${CATALOG.hero.price.toLocaleString("en-LK")}`);
    await expect(card).toHaveClass(/has-back/);
    const back = card.locator("img.product-back");
    await expect(back).toHaveCSS("opacity", "0");
    await card.locator(".product-media").hover();
    await expect(back).toHaveCSS("opacity", "1");
    const swatches = card.getByRole("group", { name: "Colours" }).getByRole("button");
    await expect(swatches).toHaveCount(2);
    await expect(swatches.nth(0)).toHaveAttribute("aria-pressed", "true");
    await swatches.nth(1).click();
    await expect(swatches.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(card.locator(".product-media > a > img:not(.product-back)")).toHaveAttribute("alt", `${CATALOG.hero.name} in wine`);
    await expect(card.locator("[class*=sale]")).toHaveCount(0);
    const heart = card.getByRole("button", { name: `Save ${CATALOG.hero.name} to favourites` });
    await heart.click();
    await expect(card.getByRole("button", { name: `Remove ${CATALOG.hero.name} from favourites` })).toBeVisible();
    await expect(page.getByRole("link", { name: "Favourites, 1 saved" })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("lusted-favourites")!))).toEqual([CATALOG.hero.slug]);
    // the colourway on show follows the click: the link carries it and the piece opens on it, instead of the
    // shopper picking Wine and landing on the first colour
    await card.locator(".product-info").click();
    await expect(page).toHaveURL(new RegExp(`/products/${CATALOG.hero.slug}\\?colour=wine$`));
    await expect(page.locator(".buy-label > span").first()).toHaveText("Wine");
  });

  test("quick add on hover: pick a size, add, the line lands in the bag without the drawer taking over", async ({ prepared: page }) => {
    await go(page, "/products");
    const card = cards(page).filter({ has: page.locator(`a[href^="/products/${CATALOG.hero.slug}"]`) }).first();
    await card.locator(".product-media").hover();
    const quick = card.getByRole("group", { name: `Quick add ${CATALOG.hero.name}` });
    await expect(quick).toBeVisible();
    const cta = quick.locator(".quick-add-cta");
    await expect(cta).toBeDisabled();
    await expect(cta).toHaveText(/Pick your size/);
    await expect(quick.locator(".quick-add-sizes button")).toHaveText(CATALOG.sizes);
    await quick.locator(".quick-add-sizes").getByRole("button", { name: "L", exact: true }).click();
    await expect(cta).toBeEnabled();
    await expect(cta).toHaveText(/Add to bag · L/);
    await cta.click();
    // adding from the grid must not throw the drawer over the shop — it confirms itself and leaves the shopper
    // browsing, which is the whole point of quick add when building a set
    await expect(page.locator(".drawer-root")).not.toHaveClass(/is-open/);
    const toast = page.locator(".bag-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(CATALOG.hero.name);
    await expect(toast).toContainText("Blush · L");
    await expect(page.getByRole("button", { name: "Open bag, 1 items" })).toBeVisible();
    // and the line really is in the bag, not just announced
    await toast.getByRole("button", { name: "Peek in the bag" }).click();
    const bag = bagDialog(page);
    await expect(bag.locator(".bag-item")).toHaveCount(1);
    await expect(bag.locator(".bag-item")).toContainText(CATALOG.hero.name);
    await expect(bag.locator(".bag-item .bag-meta")).toContainText("Blush");
    // the size is a control now, so the line can be corrected without starting the piece again
    await expect(bag.locator(".bag-item .bag-size select")).toHaveValue("L");
    await expect(bag.locator(".drawer-total strong")).toHaveText(`LKR ${CATALOG.hero.price.toLocaleString("en-LK")}`);
  });

  test("a colour-filtered card quick-adds in that colour", async ({ prepared: page }) => {
    await go(page, "/products?color=wine");
    const card = cards(page).filter({ has: page.locator(`a[href^="/products/${CATALOG.hero.slug}"]`) }).first();
    await expect(card.locator(".product-media > a > img:not(.product-back)")).toHaveAttribute("alt", /in wine$/);
    await card.locator(".product-media").hover();
    await card.locator(".quick-add-sizes").getByRole("button", { name: "S", exact: true }).click();
    await card.locator(".quick-add-cta").click();
    // quick add is quiet now, so the bag is opened to read the line
    await page.getByRole("button", { name: /Open bag/ }).click();
    await expect(bagDialog(page).locator(".bag-item .bag-meta")).toContainText("Wine");
    await expect(bagDialog(page).locator(".bag-item .bag-size select")).toHaveValue("S");
  });
});

test.describe("the shop on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("filters live in a bottom sheet with a count, show/close, and quick add is off for touch", async ({ prepared: page }) => {
    await go(page, "/products");
    const btn = page.getByRole("button", { name: /Filters/ });
    await expect(btn).toBeVisible();
    const root = page.locator(".filters-root");
    await expect(root).not.toHaveClass(/is-open/);
    await btn.tap();
    await expect(root).toHaveClass(/is-open/);
    const filters = page.getByRole("complementary", { name: "Filters" });
    await filters.getByLabel("On sale").tap();
    await expect(page).toHaveURL(/sale=1/);
    await expect(filters.getByRole("button", { name: `Show ${CATALOG.sale.length} pieces` })).toBeVisible();
    await filters.getByRole("button", { name: /Show \d+ pieces/ }).tap();
    await expect(root).not.toHaveClass(/is-open/);
    await expect(btn).toContainText("1");
    await expect(cards(page)).toHaveCount(CATALOG.sale.length);
    await btn.tap();
    await filters.getByRole("button", { name: "Close filters" }).tap();
    await expect(root).not.toHaveClass(/is-open/);
    await btn.tap();
    await page.locator(".filters-scrim").tap({ position: { x: 10, y: 10 }, force: true });
    await expect(root).not.toHaveClass(/is-open/);
    await expect(cards(page).first().getByRole("group", { name: /Quick add/ })).toBeHidden();
    await expect(page.locator(".sort > span")).toBeHidden();
    await expect(page.getByRole("combobox")).toBeVisible();
    // the grid is two across on a phone
    const xs = await cards(page).evaluateAll((els) => els.slice(0, 2).map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(xs[0]).not.toBe(xs[1]);
  });
});
