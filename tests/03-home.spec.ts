import { test, expect, go, revealAll, main, CATALOG, parsePrice } from "./fixtures";

test.beforeEach(async ({ prepared: page }) => {
  await go(page, "/");
  await revealAll(page);
});

test("hero: 18 slides, one active, the first preloaded, both calls to action", async ({ prepared: page }) => {
  const slides = page.locator(".hero-slide");
  await expect(slides).toHaveCount(18);
  await expect(page.locator(".hero-slide.is-active")).toHaveCount(1);
  await expect(slides.first()).toHaveClass(/is-active/);
  // only the current, previous and next photos are mounted (memory on phones); every mounted one has alt text
  await expect(page.locator(".hero-slide img")).toHaveCount(2);
  for (const alt of await page.locator(".hero-slide img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")))) expect(alt).toMatch(/Model/);
  const first = slides.first().locator("img");
  await expect.poll(() => first.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 1000)).toBe(true);
  await expect(page.locator("#top").getByRole("link", { name: /Find your temptation/ })).toHaveAttribute("href", "/products");
  const whisper = page.locator("#top").getByRole("link", { name: /Whisper to us/ });
  expect(await whisper.getAttribute("href")).toContain("wa.me");
  await expect(page.locator("#top h1")).toContainText(/Dressed to tempt/);
});

test("hero slideshow advances when motion is allowed and holds with reduced motion", async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => sessionStorage.setItem("lusted-intro", "1"));
  await page.goto("/");
  await expect(page.locator(".hero-slide").nth(1)).toHaveClass(/is-active/, { timeout: 12_000 });
  await ctx.close();
  const still = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
  const p2 = await still.newPage();
  await p2.addInitScript(() => sessionStorage.setItem("lusted-intro", "1"));
  await p2.goto("/");
  await p2.waitForTimeout(9000);
  await expect(p2.locator(".hero-slide").first()).toHaveClass(/is-active/);
  await still.close();
});

test("sale: the four bikinis at exactly 20% off, prices struck through, each linking to its product", async ({ prepared: page }) => {
  const sale = page.locator("#sale");
  await expect(sale.locator("h2")).toContainText(/20% off/);
  const cards = sale.locator(".sale-card");
  await expect(cards).toHaveCount(4);
  const hrefs = await cards.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!.split("/").pop()));
  expect([...hrefs].sort()).toEqual([...CATALOG.sale].sort());
  for (let i = 0; i < 4; i++) {
    const c = cards.nth(i);
    await expect(c.locator(".sale-card-off")).toHaveText("−20%");
    const now = parsePrice((await c.locator(".sale-card-price").textContent())!);
    const was = parsePrice((await c.locator(".sale-card-price s").textContent())!);
    expect(Math.round(was * 0.8)).toBe(now);
    await expect(c.locator("h3")).not.toBeEmpty();
    await expect(c.locator(".sale-card-blurb")).not.toBeEmpty();
  }
  await expect(sale.getByRole("link", { name: /Shop the sale|sale/i }).last()).toHaveAttribute("href", "/products?sale=1");
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`/products/${hrefs[0]}$`));
});

test("collections: three cards open the shop filtered by category, plus the all-products button", async ({ prepared: page }) => {
  const grid = page.locator("#collections");
  await expect(grid.getByRole("link", { name: /Tempt me with everything/ })).toHaveAttribute("href", "/products");
  const cards = grid.locator(".col-card");
  await expect(cards).toHaveCount(3);
  const expected = [
    ["lingerie", "Lace Secrets"],
    ["swim", "Sun Kissed"],
    ["after-dark", "Midnight Sins"],
  ];
  for (const [i, [cat, name]] of expected.entries()) {
    await expect(cards.nth(i)).toHaveAttribute("href", `/products?cat=${cat}`);
    await expect(cards.nth(i).locator(".col-title")).toHaveText(name);
    await expect(cards.nth(i).locator("img")).toHaveAttribute("alt", /Model/);
  }
  await cards.nth(1).click();
  await expect(page).toHaveURL(/\/products\?cat=swim$/);
  await expect(main(page).getByRole("tab", { name: /Sun Kissed/ })).toHaveAttribute("aria-selected", "true");
  await expect(main(page).locator(".product-card")).toHaveCount(CATALOG.byCategory.swim);
});

test("best sellers: the six ranked pieces in order, with the badge, linking to the sorted shop", async ({ prepared: page }) => {
  const sec = page.locator("#best-sellers");
  const cards = sec.locator(".product-card");
  await expect(cards).toHaveCount(6);
  const hrefs = await cards.locator(".product-info").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!.split("/").pop()));
  expect(hrefs).toEqual(CATALOG.bestSellers);
  for (let i = 0; i < 6; i++) await expect(cards.nth(i).locator(".badge", { hasText: "Best seller" })).toHaveCount(1);
  await expect(sec.getByRole("link", { name: /See all|best/i }).last()).toHaveAttribute("href", "/products?best=1&sort=best");
});

test("how it works: three steps, the ordering anchor and the WhatsApp button", async ({ prepared: page }) => {
  const how = page.locator("#ordering");
  await expect(how).toBeVisible();
  await expect(how.locator("ol li, .how-steps li, .how-step")).toHaveCount(3);
  const link = how.getByRole("link", { name: /order|WhatsApp/i }).first();
  expect(await link.getAttribute("href")).toContain("wa.me");
});

test("size guide: three tabs switch the chart, five tags per tab, tags flip with click, Enter and Space", async ({ prepared: page }) => {
  const guide = page.locator("#size-guide");
  const tabs = guide.getByRole("tab");
  await expect(tabs).toHaveText(["Bras & tops", "Bodysuits & dresses", "Bottoms"]);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  const panel = guide.getByRole("tabpanel");
  await expect(panel).toHaveAttribute("aria-label", /Bras & tops sizes/);
  const tags = guide.locator(".size-tags .tag3d");
  await expect(tags).toHaveCount(5);
  await expect(tags.locator(".tag3d-front strong")).toHaveText(CATALOG.sizes);
  // bra chart carries underbust + cup sizes; bottoms carry hips
  await expect(tags.first().locator(".tag3d-front")).toContainText("Underbust");
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute("aria-label", /Bottoms sizes/);
  await expect(guide.locator(".size-tags .tag3d").first().locator(".tag3d-front")).toContainText("Hips");
  await tabs.nth(1).click();
  await expect(guide.locator(".size-tags .tag3d").first().locator(".tag3d-front")).toContainText(/Bust|UK/);
  // flipping (the HTML tags also back the WebGL ones for keyboard and screen-reader users)
  const swing = guide.locator(".tag3d-swing").nth(2);
  await expect(swing).toHaveAttribute("aria-pressed", "false");
  await swing.focus();
  await page.keyboard.press("Enter");
  await expect(swing).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press(" ");
  await expect(swing).toHaveAttribute("aria-pressed", "false");
  await swing.dispatchEvent("click");
  await expect(swing).toHaveAttribute("aria-pressed", "true");
  await tabs.first().click(); // switching tabs resets the flip
  await expect(guide.locator(".tag3d-swing").nth(2)).toHaveAttribute("aria-pressed", "false");
  expect(await guide.locator(".size-note a").getAttribute("href")).toContain("wa.me");
});

test("size guide: 'where the tape goes' — four steps, pointing/focusing picks one, the tape follows", async ({ prepared: page }) => {
  const tape = page.locator(".tape-guide");
  const steps = tape.locator("ol button");
  await expect(steps).toHaveCount(4);
  await expect(steps.locator("strong")).toHaveText(["Underbust", "Bust", "Waist", "Hips"]);
  await steps.nth(3).hover();
  await expect(steps.nth(3)).toHaveAttribute("aria-pressed", "true");
  await expect(tape.locator(".tape-wrap").nth(3)).toHaveClass(/is-active/);
  await steps.nth(1).focus();
  await expect(steps.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(tape.locator(".tape-wrap.is-active")).toHaveCount(1);
});

test("about: the photo wall holds seven prints with alt text, the promises and both buttons", async ({ prepared: page }) => {
  const about = page.locator("#about");
  const prints = about.locator(".photo-wall img");
  await expect(prints).toHaveCount(7);
  for (let i = 0; i < 7; i++) expect(await prints.nth(i).getAttribute("alt")).toMatch(/Model|Close-up/);
  await expect(about.locator(".about-promises li")).toHaveCount(4);
  expect(await about.getByRole("link", { name: /Tempt me/ }).getAttribute("href")).toContain("wa.me");
  await expect(about.getByRole("link", { name: /Read our story/ })).toHaveAttribute("href", "/about");
  await about.getByRole("link", { name: /Read our story/ }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test("contact: WhatsApp, email and Instagram links, hours, the QR code encodes the WhatsApp link", async ({ prepared: page }) => {
  const c = page.locator("#contact");
  expect(await c.getByRole("link", { name: /Message us on WhatsApp/ }).getAttribute("href")).toContain(`wa.me/${CATALOG.whatsapp}`);
  await expect(c.getByRole("link", { name: "Write to us" })).toHaveAttribute("href", `mailto:${CATALOG.email}`);
  const list = c.locator(".contact-list li");
  await expect(list).toHaveCount(4);
  await expect(list.nth(1).locator("a")).toHaveAttribute("href", `https://instagram.com/${CATALOG.instagram}`);
  await expect(list.nth(1).locator("a")).toHaveAttribute("target", "_blank");
  await expect(list.nth(2).locator("a")).toHaveAttribute("href", `mailto:${CATALOG.email}`);
  await expect(list.nth(3)).toContainText(/9AM/);
  await expect(c.getByRole("img", { name: /QR code/ })).toBeVisible();
  await expect(c.locator(".contact-qr svg path")).toHaveAttribute("d", /M\d+ \d+h1v1h-1z/);
});

test("footer: every link resolves, social links open in new tabs, the year is current", async ({ prepared: page, request }) => {
  const footer = page.locator("footer.footer");
  const links = await footer.locator(".footer-cols a").evaluateAll((as) => as.map((a) => [a.textContent!.trim(), (a as HTMLAnchorElement).getAttribute("href")!, (a as HTMLAnchorElement).target]));
  expect(links.map(([t]) => t)).toEqual(["All products", "Lace Secrets", "Sun Kissed", "Midnight Sins", "Sale", "Size guide", "How ordering works", "Contact", "About us", "Privacy policy", "Terms & conditions", "Instagram", "WhatsApp", "Email"]);
  for (const [label, href, target] of links) {
    if (href.startsWith("/")) {
      const r = await request.get(href.split("#")[0]);
      expect(r.status(), `${label} → ${href}`).toBe(200);
      if (href.includes("#")) await expect(page.locator(`#${href.split("#")[1]}`), href).toHaveCount(1);
    } else {
      expect(target, label).toBe("_blank");
      expect(href).toMatch(/^(https:\/\/(instagram\.com|wa\.me)|mailto:)/);
    }
  }
  await expect(footer.locator(".footer-bottom")).toContainText(`© ${new Date().getFullYear()} Lusted`);
  await expect(footer.getByRole("link", { name: /luminary-dev\.xyz/ })).toHaveAttribute("href", "https://luminary-dev.xyz");
});

test("newsletter: the browser blocks a bad address, a good one reports the sign-up state", async ({ prepared: page }) => {
  const form = page.locator("form.news-form");
  const input = form.getByRole("textbox", { name: "Email address" });
  await expect(form.locator(".news-note")).toHaveText("No spam. Just beautiful things.");
  await input.fill("not-an-email");
  await form.getByRole("button", { name: /Subscribe/ }).click();
  expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false); // native validation stops the submit
  await expect(form.locator(".news-note")).toHaveText("No spam. Just beautiful things.");
  await input.fill("someone@example.com");
  const [res] = await Promise.all([page.waitForResponse((r) => r.url().includes("/api/subscribe")), form.getByRole("button", { name: /Subscribe/ }).click()]);
  expect([200, 501, 502]).toContain(res.status());
  const note = form.locator(".news-note");
  await expect(note).toHaveAttribute("role", "status");
  if (res.status() === 501) await expect(note).toContainText("Sign-ups open soon");
  else if (res.status() === 200) {
    await expect(note).toContainText("inner circle");
    await expect(input).toHaveValue("");
  }
});

test("scroll rail: one heart per section, labels on hover, click glides there, the top line fills", async ({ prepared: page }) => {
  const rail = page.getByRole("navigation", { name: "Sections" });
  await expect(rail).toBeVisible();
  const ids = await page.locator("main > section[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids.length).toBeGreaterThanOrEqual(6);
  const hearts = rail.locator(".heart-hit");
  await expect(hearts).toHaveCount(ids.length);
  await expect(hearts.first()).toHaveAttribute("aria-current", "true");
  await expect(hearts.first()).toHaveAccessibleName("Welcome");
  await expect(rail.getByRole("button", { name: "Contact" })).toHaveCount(1);
  await rail.getByRole("button", { name: "Our story" }).click();
  await expect.poll(async () => page.locator("#about").evaluate((el) => Math.abs(el.getBoundingClientRect().top) < 40)).toBe(true);
  await expect(rail.getByRole("button", { name: "Our story" })).toHaveAttribute("aria-current", "true");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--scroll-progress")))).toBeGreaterThan(0.95);
  await expect(hearts.last()).toHaveAttribute("aria-current", "true");
});

test("every image on the home page loads and has alt text", async ({ prepared: page }) => {
  test.slow();
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  const broken = await page.locator("img").evaluateAll((imgs) =>
    (imgs as HTMLImageElement[]).filter((i) => i.getAttribute("alt") === null || (i.loading !== "lazy" && i.complete && i.naturalWidth === 0 && i.getAttribute("src"))).map((i) => i.getAttribute("src")?.slice(0, 80)),
  );
  expect(broken).toEqual([]);
});
