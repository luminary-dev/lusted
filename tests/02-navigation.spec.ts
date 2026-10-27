import { test, expect, go, main, CATALOG, navToggle, openBag, bagDialog, searchDialog } from "./fixtures";

const NAV = [
  ["Shop", "/products"],
  ["Collections", "/#collections"],
  ["Size Guide", "/#size-guide"],
  ["Ordering", "/#ordering"],
  ["Contact", "/#contact"],
] as const;

test.describe("header", () => {
  test("logo links home, every nav link has the right target and all anchors exist on the home page", async ({ prepared: page }) => {
    await go(page, "/about");
    const logo = page.getByRole("link", { name: "Lusted — home" });
    await expect(logo).toHaveAttribute("href", "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, href] of NAV) await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
    await logo.click();
    await expect(page).toHaveURL(/\/$/);
    for (const [, href] of NAV) if (href.startsWith("/#")) await expect(page.locator(`#${href.slice(2)}`), href).toHaveCount(1);
  });

  test("anchor links scroll to their section and the active link follows", async ({ prepared: page }) => {
    await go(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, href] of NAV.filter(([, h]) => h.startsWith("/#"))) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${href.slice(1)}$`)); // "/#collections" → ends in "#collections"
      const id = href.slice(2);
      await expect.poll(async () => page.locator(`#${id}`).evaluate((el) => Math.abs(el.getBoundingClientRect().top) < window.innerHeight * 0.6), { timeout: 8000 }).toBe(true);
    }
    // scroll spy: with the middle of the viewport inside #contact the Contact link is marked active
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 200));
    await expect(nav.getByRole("link", { name: "Contact", exact: true })).toHaveClass(/is-active/);
    await go(page, "/products");
    await expect(nav.getByRole("link", { name: "Shop", exact: true })).toHaveClass(/is-active/);
  });

  test("WhatsApp button opens wa.me with a prefilled message in a new tab", async ({ prepared: page }) => {
    await go(page, "/");
    const btn = page.getByRole("link", { name: "Message us on WhatsApp" }).first();
    await expect(btn).toHaveAttribute("target", "_blank");
    await expect(btn).toHaveAttribute("rel", /noopener/);
    const href = await btn.getAttribute("href");
    expect(href).toContain(`https://wa.me/${CATALOG.whatsapp}?text=`);
    expect(decodeURIComponent(href!.split("text=")[1])).toMatch(/Hi Lusted/);
  });

  test("the bar turns solid once scrolled and stays solid off the home page", async ({ prepared: page }) => {
    await go(page, "/");
    const nav = page.locator("header.nav");
    await expect(nav).not.toHaveClass(/is-solid/);
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(nav).toHaveClass(/is-solid/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(nav).not.toHaveClass(/is-solid/);
    await go(page, "/products");
    await expect(nav).toHaveClass(/is-solid/);
  });

  test("favourites and bag icons show live counts", async ({ prepared: page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lusted-favourites", JSON.stringify(["rose-lace-balconette-bra", "siren-chainmail-mini"]));
      localStorage.setItem("lusted-bag", JSON.stringify([{ slug: "rose-lace-balconette-bra", size: "M", color: "blush", qty: 3 }]));
    });
    await go(page, "/");
    await expect(page.getByRole("link", { name: "Favourites, 2 saved" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open bag, 3 items" })).toBeVisible();
    await expect(page.locator(".nav .bag-count")).toHaveText(["2", "3"]);
  });
});

test.describe("search dialog", () => {
  test("opens from the button, ⌘K, Ctrl+K and '/', focuses the field and closes with Escape, the scrim or the X", async ({ prepared: page }) => {
    await go(page, "/about");
    const dialog = searchDialog(page);
    const root = page.locator(".search-root");
    await expect(root).toHaveAttribute("aria-hidden", "true");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(root).toHaveClass(/is-open/);
    await expect(page.getByRole("searchbox", { name: "Search products" })).toBeFocused();
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden"); // page scroll locked
    await page.keyboard.press("Escape");
    await expect(root).not.toHaveClass(/is-open/);
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Meta+k");
    await expect(root).toHaveClass(/is-open/);
    await dialog.getByRole("button", { name: "Close search" }).click();
    await expect(root).not.toHaveClass(/is-open/);
    await page.keyboard.press("Control+k");
    await expect(root).toHaveClass(/is-open/);
    await page.locator(".search-root .drawer-scrim").click({ position: { x: 10, y: 10 }, force: true });
    await expect(root).not.toHaveClass(/is-open/);
    await page.keyboard.press("/");
    await expect(root).toHaveClass(/is-open/);
    await page.keyboard.press("Escape");
  });

  test("'/' typed inside a field does not hijack it", async ({ prepared: page }) => {
    await go(page, "/products");
    const box = page.getByRole("searchbox", { name: "Search products" }).first();
    await box.click();
    await box.type("lace/silk");
    await expect(box).toHaveValue("lace/silk");
    await expect(page.locator(".search-root")).not.toHaveClass(/is-open/);
  });

  test("shows best sellers by default, suggestion chips fill the box, results update live and 'See all' opens the filtered shop", async ({ prepared: page }) => {
    await go(page, "/");
    await page.getByRole("button", { name: "Search" }).click();
    const dialog = searchDialog(page);
    await expect(dialog.locator(".search-label")).toHaveText("Best sellers");
    await expect(dialog.locator(".search-results li")).toHaveCount(6);
    const shown = await dialog.locator(".search-results li a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!.split("/").pop()));
    expect(shown).toEqual(CATALOG.bestSellers);
    for (const chip of ["lace", "silk", "bikini", "black", "bodysuit", "sale"]) await expect(dialog.getByRole("button", { name: chip, exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "bikini", exact: true }).click();
    await expect(page.getByRole("searchbox", { name: "Search products" })).toHaveValue("bikini");
    await expect(dialog.locator(".search-label")).toHaveText(/\d+ results?/);
    const n = Number((await dialog.locator(".search-label").textContent())!.match(/\d+/)![0]);
    expect(n).toBeGreaterThanOrEqual(CATALOG.byCategory.swim - 3);
    await expect(dialog.locator(".search-results li")).toHaveCount(Math.min(6, n));
    await dialog.getByRole("button", { name: /See all \d+ results/ }).click();
    await expect(page).toHaveURL(/\/products\?q=bikini$/);
    await expect(main(page).locator(".results-bar p")).toContainText(`${n} pieces`);
  });

  test("'sale' routes to the sale filter, nonsense shows the empty message, Enter submits", async ({ prepared: page }) => {
    await go(page, "/");
    await page.keyboard.press("/");
    const box = page.getByRole("searchbox", { name: "Search products" });
    await box.fill("qzxv");
    await expect(searchDialog(page).locator(".search-empty")).toContainText("Nothing’s wearing");
    await expect(searchDialog(page).getByRole("button", { name: /See all/ })).toHaveCount(0);
    await box.fill("sale");
    await expect(searchDialog(page).locator(".search-label")).toHaveText(`${CATALOG.sale.length} results`);
    await box.press("Enter");
    await expect(page).toHaveURL(/\/products\?sale=1$/);
    await expect(main(page).locator(".product-card")).toHaveCount(CATALOG.sale.length);
  });

  test("a result link opens that product and closes the dialog", async ({ prepared: page }) => {
    await go(page, "/about");
    await page.keyboard.press("/");
    await searchDialog(page).locator(".search-results li a").first().click();
    await expect(page).toHaveURL(new RegExp(`/products/${CATALOG.bestSellers[0]}$`));
    await expect(page.locator(".search-root")).not.toHaveClass(/is-open/);
  });
});

test.describe("theme switch", () => {
  test("flips data-theme, remembers it across pages and reloads, and the switch reports its state", async ({ prepared: page }) => {
    await go(page, "/");
    const html = page.locator("html");
    const sw = page.locator(".nav-theme").getByRole("switch", { name: "Dark mode" });
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(sw).toHaveAttribute("aria-checked", "true");
    expect(await page.evaluate(() => localStorage.getItem("lusted-theme"))).toBe("dark");
    await expect(page.locator("body")).toHaveCSS("background-color", /rgb\(2\d, 1\d, 1\d\)|rgb\(20, 10, 12\)/);
    await go(page, "/products");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.locator(".nav-theme").getByRole("switch").click();
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("first visit follows the system preference", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem("lusted-intro", "1"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await ctx.close();
  });
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the toggle opens a menu with every link, WhatsApp and the theme switch; links close it", async ({ prepared: page }) => {
    await go(page, "/about");
    const toggle = navToggle(page);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    const links = page.locator(".nav-links");
    await expect(links).toHaveCSS("opacity", "0");
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAccessibleName("Close menu");
    await expect(links).toHaveCSS("opacity", "1");
    for (const [label] of NAV) await expect(links.getByRole("link", { name: label, exact: true })).toBeVisible();
    await expect(links.getByRole("link", { name: /Message us on WhatsApp/ })).toBeVisible();
    await expect(links.getByRole("switch", { name: "Dark mode" })).toBeVisible(); // under 480 px the switch lives in the menu
    await expect(page.locator(".nav-theme")).toBeHidden();
    await expect(page.locator(".nav-whatsapp")).toBeHidden();
    await links.getByRole("link", { name: "Shop", exact: true }).tap();
    await expect(page).toHaveURL(/\/products$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(links).toHaveCSS("opacity", "0");
  });

  test("the logo closes the menu, the theme switch in the menu works", async ({ prepared: page }) => {
    await go(page, "/");
    await navToggle(page).tap();
    await page.locator(".nav-links").getByRole("switch").tap();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("link", { name: "Lusted — home" }).tap();
    await expect(navToggle(page)).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("tablet header (481–900)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });
  test("shows the icon-only WhatsApp button, the toggle and the switch in the bar", async ({ prepared: page }) => {
    await go(page, "/about");
    await expect(page.locator(".nav-whatsapp")).toBeVisible();
    await expect(page.locator(".nav-whatsapp span")).toBeHidden();
    await expect(page.locator(".nav-theme")).toBeVisible();
    await expect(navToggle(page)).toBeVisible();
  });
});

test.describe("bag drawer chrome", () => {
  test("opens from the bag icon, is empty with a shop link, closes on Escape, scrim and X, and locks scroll", async ({ prepared: page }) => {
    await go(page, "/about");
    const root = page.locator(".drawer-root");
    await openBag(page).click();
    await expect(root).toHaveClass(/is-open/);
    await expect(bagDialog(page).getByText("Your bag is empty.")).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Escape");
    await expect(root).not.toHaveClass(/is-open/);
    await openBag(page).click();
    await page.locator(".drawer-root .drawer-scrim").click({ position: { x: 10, y: 10 }, force: true });
    await expect(root).not.toHaveClass(/is-open/);
    await openBag(page).click();
    await bagDialog(page).getByRole("button", { name: "Close bag" }).click();
    await expect(root).not.toHaveClass(/is-open/);
    await openBag(page).click();
    await bagDialog(page).getByRole("link", { name: /Browse the shop/ }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(root).not.toHaveClass(/is-open/);
  });
});

test("the loading screen plays once per tab and is skipped afterwards", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const intro = page.locator(".intro");
  await expect(intro).toBeAttached();
  await expect(intro).toHaveClass(/is-gone/, { timeout: 12_000 });
  expect(await page.evaluate(() => sessionStorage.getItem("lusted-intro"))).toBe("1");
  await page.goto("/about");
  await expect(page.locator("html")).toHaveClass(/intro-seen/);
  await expect(intro).toBeHidden();
});
