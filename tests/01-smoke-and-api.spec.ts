import { test, expect, go, ROUTES, CATALOG } from "./fixtures";
import { site } from "../src/lib/site";

test.describe("routes", () => {
  for (const path of ROUTES) {
    test(`${path} answers 200 with a title, one h1, lang and no console errors`, async ({ prepared: page, errors }) => {
      const res = await go(page, path);
      expect(res?.status(), `${path} status`).toBe(200);
      await expect(page).toHaveTitle(/Lusted/);
      expect(await page.locator("html").getAttribute("lang")).toBe("en");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("header.nav")).toBeVisible();
      await expect(page.locator("footer.footer")).toBeAttached();
      expect(errors, `console/page errors on ${path}`).toEqual([]);
    });
  }

  test("every product page renders its own name and price", async ({ prepared: page }) => {
    test.setTimeout(240_000);
    await go(page, "/products?sort=new");
    // collect every slug from all three pages of the shop
    const all = new Set<string>();
    for (let p = 1; p <= CATALOG.pages; p++) {
      await go(page, `/products?page=${p}`);
      const hrefs = await page.locator(".product-card .product-info").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
      hrefs.forEach((h) => all.add(h));
    }
    expect(all.size).toBe(CATALOG.total);
    for (const href of all) {
      const res = await page.goto(href, { waitUntil: "domcontentloaded" });
      expect(res?.status(), href).toBe(200);
      const name = (await page.locator("h1").textContent())?.trim();
      expect(name, href).toBeTruthy();
      await expect(page).toHaveTitle(new RegExp(name!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await expect(page.locator(".pdp-price .price-now")).toContainText(/LKR\s[\d,]+/);
      await expect(page.locator(".pdp-main img.is-active")).toHaveAttribute("alt", /view$/);
      await expect(page.locator(".crumbs a").nth(1)).toHaveAttribute("href", "/products");
    }
  });

  test("an unknown product is a real 404", async ({ prepared: page }) => {
    const res = await page.goto("/products/this-piece-does-not-exist", { waitUntil: "load" });
    // the body says 404, so the status should too — search engines index a 200
    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
    expect(res?.status(), "HTTP status for a missing product").toBe(404);
  });

  test("an unknown route is a 404, on the site's own page with the way back in", async ({ prepared: page }) => {
    const res = await page.goto("/no-such-page", { waitUntil: "load" });
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Caught you looking");
    await expect(page.locator(".nav")).toBeVisible();
    await expect(page.locator(".lost-actions").getByRole("link", { name: /Show me everything/ })).toHaveAttribute("href", "/products");
    await expect(page.locator(".lost-actions").getByRole("link", { name: "Take me back to bed" })).toHaveAttribute("href", "/");
    // the photos are a slideshow: the first is a real (large) photo and the arrowhead moves on to the next
    const first = page.locator(".lost-photo .hero-slide").first();
    await expect(first).toHaveClass(/is-active/);
    await expect.poll(() => first.locator("img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 1000)).toBe(true);
    await page.locator(".slide-cue").click();
    await expect(page.locator(".lost-photo .hero-slide").nth(1)).toHaveClass(/is-active/);
    expect(await page.title()).toMatch(/nothing on here/i);
  });

  test("delivery, returns & FAQ: every section has questions that open in place, and its links go where they say", async ({ prepared: page }) => {
    await go(page, "/help");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ask us anything");
    const ids = ["ordering", "payment", "delivery", "returns", "sizing", "privacy"];
    for (const id of ids) expect(await page.locator(`#${id} details`).count(), `questions in #${id}`).toBeGreaterThan(1);
    // the answers restate the terms: 7-day hygiene-safe exchanges, plain packaging
    const q = page.locator("#returns details").first();
    await expect(q.locator(".faq-a")).toBeHidden();
    await q.locator("summary").click();
    await expect(q).toHaveAttribute("open", "");
    await expect(q.locator(".faq-a")).toContainText("7 days");
    await q.locator("summary").press("Enter");
    await expect(q).not.toHaveAttribute("open", "");
    await page.locator("#delivery summary", { hasText: "Will anyone know" }).click();
    await expect(page.locator("#delivery .faq-a", { hasText: "plain, unbranded box" })).toBeVisible();
    // links (answers are in the DOM even while closed)
    const hrefs = await page.locator(".help-card a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    expect(hrefs.filter((h) => h.startsWith("https://wa.me/")).every((h) => h.includes(CATALOG.whatsapp))).toBe(true);
    for (const h of ["/#size-guide", "/privacy", "/terms"]) expect(hrefs).toContain(h);
    // every chapter card has its model
    await expect(page.locator(".help-card .help-model img")).toHaveCount(ids.length);
  });

  test("search engines: robots.txt points to a sitemap of every page, and pieces share their own photo", async ({ request, prepared: page }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/api\//);
    expect(robots).toMatch(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    for (const path of ["/", "/products", "/help", "/about", "/privacy", "/terms", `/products/${CATALOG.hero.slug}`]) expect(locs).toContain(path);
    expect(locs.filter((l) => l.startsWith("/products/"))).toHaveLength(CATALOG.total);
    expect(locs).not.toContain("/favourites");
    await go(page, `/products/${CATALOG.hero.slug}`);
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toContain(encodeURIComponent(CATALOG.hero.slug));
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`/products/${CATALOG.hero.slug}$`));
    const card = await request.get("/opengraph-image.png");
    expect(card.headers()["content-type"]).toBe("image/png");
  });

  test("metadata: description, theme-color per scheme, open graph, viewport", async ({ prepared: page }) => {
    await go(page, "/");
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toMatch(/lingerie/i);
    expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toMatch(/Lusted/);
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
    expect(await page.locator('meta[name="viewport"]').getAttribute("content")).toMatch(/width=device-width/);
    await go(page, "/products");
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toMatch(/filter/i);
  });

  test("icons and brand assets resolve", async ({ page }) => {
    for (const p of ["/icon.png", "/apple-icon.png"]) {
      const r = await page.request.get(p);
      expect(r.status(), p).toBe(200);
      expect(r.headers()["content-type"]).toMatch(/image/);
    }
  });
});

test.describe("newsletter API", () => {
  test("rejects a bad email with 400", async ({ request }) => {
    for (const email of ["", "bad", "a@b", "@x.com", "a b@c.com", "x".repeat(250) + "@a.co"]) {
      const r = await request.post("/api/subscribe", { data: { email } });
      expect(r.status(), `email ${JSON.stringify(email)}`).toBe(400);
      expect((await r.json()).error).toMatch(/valid email/i);
    }
  });
  test("rejects malformed JSON and other methods", async ({ request }) => {
    expect((await request.post("/api/subscribe", { data: "not json", headers: { "content-type": "text/plain" } })).status()).toBe(400);
    expect((await request.get("/api/subscribe")).status()).toBe(405);
    expect((await request.put("/api/subscribe", { data: { email: "a@b.co" } })).status()).toBe(405);
  });
  test("answers 501 until the webhook is configured (or 200 once it is)", async ({ request }) => {
    const r = await request.post("/api/subscribe", { data: { email: "someone@example.com" } });
    expect([200, 501, 502]).toContain(r.status());
    if (r.status() === 501) expect((await r.json()).error).toMatch(/not configured/i);
  });
});

// With site.revealGate on, every page is replaced by /revealing-soon until reveal day (site.revealAt) unless the preview
// cookie is set; the `prepared` fixture carries the cookie, so this is the one place the gate itself is exercised with a
// bare page. While the gate is off (or reveal day has passed) these are skipped.
test.describe("revealing soon", () => {
  test.skip(() => !site.revealGate || Date.now() >= Date.parse(site.revealAt), "the reveal gate is off");

  test("without the preview cookie the home page is the reveal page, with no site chrome", async ({ page }) => {
    await page.context().clearCookies();
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Revealing soon/);
    await expect(page.locator("h1")).toHaveText(/Revealing soon/);
    await expect(page.locator("header.nav")).toBeHidden();
    await expect(page.locator("footer.footer")).toBeHidden();
    await expect(page.locator(".reveal-count li")).toHaveCount(4);
    await expect(page.locator(".reveal-count .reveal-num").first()).toHaveText(/\d\d/);
  });

  test("?preview=1 sets the cookie and lets the real site through", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/?preview=1", { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).searchParams.has("preview")).toBe(false);
    await expect(page.locator("h1")).toHaveText(/Dressed to tempt/);
    const cookie = (await page.context().cookies()).find((c) => c.name === "lusted-preview");
    expect(cookie?.value).toBe("1");
  });
});
