import { test, expect, go, ROUTES, CATALOG } from "./fixtures";
import { IMAGE_VERSION } from "../src/lib/cdn";
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
    await expect(page.locator(".lost-actions").getByRole("link", { name: /Show me what you’ve got/ })).toHaveAttribute("href", "/products");
    await expect(page.locator(".lost-actions").getByRole("link", { name: "Take me back to bed" })).toHaveAttribute("href", "/");
    // the photos are a slideshow: the first is a real (large) photo and the arrowhead moves on to the next
    const first = page.locator(".lost-photo .hero-slide").first();
    await expect(first).toHaveClass(/is-active/);
    await expect.poll(() => first.locator("img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 1000)).toBe(true);
    await page.locator(".slide-cue").click();
    await expect(page.locator(".lost-photo .hero-slide").nth(1)).toHaveClass(/is-active/);
    expect(await page.title()).toMatch(/nothing on here/i);
  });

  test("delivery, returns & FAQ: every chapter answers its questions in the open, and its links go where they say", async ({ prepared: page }) => {
    await go(page, "/help");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ask us anything");
    const ids = ["ordering", "payment", "delivery", "returns", "sizing", "privacy"];
    for (const id of ids) expect(await page.locator(`#${id} .help-qa dt`).count(), `questions in #${id}`).toBeGreaterThan(1);
    // the answers restate the terms: 7-day hygiene-safe exchanges, plain packaging — and they're readable without a click
    await expect(page.locator("#returns .help-qa dd").first()).toContainText("7 days");
    await expect(page.locator("#delivery .help-qa dd", { hasText: "plain, unbranded box" })).toBeVisible();
    // every chapter card has its model
    await expect(page.locator(".help-card .help-model img")).toHaveCount(ids.length);
    // links
    const hrefs = await page.locator(".help-card a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    expect(hrefs.filter((h) => h.startsWith("https://wa.me/")).every((h) => h.includes(CATALOG.whatsapp))).toBe(true);
    for (const h of ["/#size-guide", "/privacy", "/terms"]) expect(hrefs).toContain(h);
  });

  test("search engines: robots.txt points to a sitemap of every page, and pieces share their own photo", async ({ request, prepared: page }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/api\//);
    expect(robots).toMatch(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    for (const path of ["/", "/products", "/help", "/gift-vouchers", "/about", "/privacy", "/terms", `/products/${CATALOG.hero.slug}`]) expect(locs).toContain(path);
    expect(locs.filter((l) => l.startsWith("/products/"))).toHaveLength(CATALOG.total);
    expect(locs).not.toContain("/favourites");
    await go(page, `/products/${CATALOG.hero.slug}`);
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toContain(encodeURIComponent(CATALOG.hero.slug));
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`/products/${CATALOG.hero.slug}$`));
    const card = await request.get("/opengraph-image.png");
    expect(card.headers()["content-type"]).toBe("image/png");
  });

  test("search engines: every indexable page names its canonical address, and favourites asks not to be indexed", async ({ prepared: page }) => {
    for (const path of ["/", "/about", "/gift-vouchers", "/privacy", "/terms"]) {
      await go(page, path);
      const href = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(href, `canonical on ${path}`).toBeTruthy();
      expect(new URL(href!).pathname, `canonical on ${path}`).toBe(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    }
    await go(page, "/");
    await expect(page).toHaveTitle(/Sri Lanka/);
    await go(page, "/favourites");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toMatch(/noindex/);
  });

  test("structured data: the piece, its price in rupees and its breadcrumbs; the shop; the FAQ", async ({ prepared: page }) => {
    // every JSON-LD block on the page, parsed — a block that isn't valid JSON fails here
    const blocks = async () =>
      (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t) as Record<string, unknown> & { "@type": string });
    const { slug, name } = CATALOG.hero;
    await go(page, `/products/${slug}`);
    await expect(page).toHaveTitle(`${name} — Lusted Sri Lanka`);
    const ld = await blocks();
    const product = ld.find((b) => b["@type"] === "Product") as unknown as { name: string; image: string[]; offers: { price: number; priceCurrency: string; availability: string; url: string } };
    expect(product, "Product JSON-LD").toBeTruthy();
    expect(product.name).toBe(name);
    expect(product.image.length).toBeGreaterThan(0);
    for (const src of product.image) expect(src).toMatch(/^https?:\/\//);
    expect(product.offers.priceCurrency).toBe("LKR");
    expect(product.offers.price).toBe(CATALOG.sale.includes(slug) ? CATALOG.salePriceOf(slug) : CATALOG.priceOf(slug));
    expect(product.offers.availability).toBe("https://schema.org/InStock");
    expect(new URL(product.offers.url).pathname).toBe(`/products/${slug}`);
    // the breadcrumbs match the trail on the page
    const crumbs = ld.find((b) => b["@type"] === "BreadcrumbList") as unknown as { itemListElement: { name: string }[] };
    expect(crumbs.itemListElement.map((c) => c.name)).toEqual(await page.locator(".crumbs a").allTextContents());

    await go(page, "/");
    const store = (await blocks()).find((b) => b["@type"] === "OnlineStore") as unknown as { sameAs: string[]; contactPoint: { telephone: string; areaServed: string } };
    expect(store.sameAs.some((u) => u.includes(CATALOG.instagram))).toBe(true);
    expect(store.contactPoint.telephone).toBe(`+${CATALOG.whatsapp}`);
    expect(store.contactPoint.areaServed).toBe("LK");

    await go(page, "/help");
    const faq = (await blocks()).find((b) => b["@type"] === "FAQPage") as unknown as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.map((q) => q.name)).toEqual(await page.locator(".help-qa dt").allTextContents());
    for (const q of faq.mainEntity) expect(q.acceptedAnswer.text.length, q.name).toBeGreaterThan(10);
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

  test("photos answer only at the current version, and next/image optimises nothing else", async ({ request }) => {
    // any other version would be a fresh, uncached address for the same photo (src/lib/cdn.ts, src/app/img)
    const photo = "images/footer.webp";
    const current = `/img/v${IMAGE_VERSION}/${photo}`;
    expect((await request.get(current)).status(), current).toBe(200);
    for (const v of [IMAGE_VERSION - 1, IMAGE_VERSION + 1, 987]) {
      const res = await request.get(`/img/v${v}/${photo}`);
      expect(res.status(), `v${v}`).toBe(404);
    }
    const optimise = (url: string) => request.get(`/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`);
    expect((await optimise(current)).status(), current).toBe(200);
    for (const url of [`/img/v987/${photo}`, `/img/${photo}`, `${current}?bust=1`]) expect((await optimise(url)).status(), url).toBe(400);
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
  test("refuses a sign-up posted from another site with 403", async ({ request, baseURL }) => {
    // what a third-party page's cross-site POST looks like: text/plain (no preflight), its own Origin, and
    // Sec-Fetch-Site from a current browser — each one alone is refused before the body is read
    const data = JSON.stringify({ email: "someone@example.com" });
    const plain = { "content-type": "text/plain" };
    const foreign: Record<string, string>[] = [{ origin: "https://evil.example" }, { origin: "null" }, { "sec-fetch-site": "cross-site" }, { origin: "https://evil.example", "sec-fetch-site": "cross-site" }];
    for (const headers of foreign) {
      const r = await request.post("/api/subscribe", { data, headers: { ...plain, ...headers } });
      expect(r.status(), JSON.stringify(headers)).toBe(403);
    }
    // the site's own origin (and a request with no Origin at all, as above) goes on to the usual answers
    const own = await request.post("/api/subscribe", { data: { email: "someone@example.com" }, headers: { origin: baseURL!, "x-real-ip": `198.51.100.7-${Date.now()}` } });
    expect([200, 501, 502]).toContain(own.status());
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

  test("the privacy policy stays readable behind the gate (the newsletter form links to it)", async ({ page }) => {
    await page.context().clearCookies();
    const res = await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Privacy Policy/);
    await expect(page.locator(".reveal")).toHaveCount(0);
  });

  test("?preview=1 sets the cookie and lets the real site through", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/?preview=1", { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).searchParams.has("preview")).toBe(false);
    await expect(page.locator("h1")).toHaveText(/Dressed to tempt/);
    const cookie = (await page.context().cookies()).find((c) => c.name === "lusted-preview");
    expect(cookie?.value).toBe("1");
  });

  test("its own address shows it too until the moment, rather than sending anyone on", async ({ page }) => {
    await page.context().clearCookies();
    const res = await page.goto("/revealing-soon", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/revealing-soon");
    await expect(page.locator("h1")).toHaveText(/Revealing soon/);
  });
});

// The countdown lets whoever is waiting in at zero by reloading the page — once. The browser's clock is moved to just
// before the moment while the server's stays where it is, so the reload brings the reveal page back exactly as it would
// for a device whose clock runs fast; it must then stay put and ask for a refresh. /revealing-soon answers directly
// whether or not the gate is on, but only until the moment (afterwards it redirects), so this is skipped from then on.
test.describe("the countdown at zero", () => {
  test.skip(() => Date.now() >= Date.parse(site.revealAt), "reveal day has passed");

  test("reloads the page once, and only once", async ({ prepared: page }) => {
    const at = Date.parse(site.revealAt);
    await page.clock.install({ time: at - 5 * 60_000 });
    await go(page, "/revealing-soon");
    await page.clock.pauseAt(at - 2_000);
    await page.clock.runFor(2_000);
    await expect(page.locator(".reveal-live")).toBeVisible();

    const reloaded = page.waitForEvent("load");
    await page.clock.runFor(1_500);
    await reloaded;
    await expect(page.locator(".reveal-live")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("lusted-reveal-reloaded"))).toBe(site.revealAt);

    // a second reload would replace the document and lose this mark
    await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));
    await page.clock.runFor(5_000);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
  });
});

// From the moment itself the gate is gone and the teaser's own address sends visitors home. Skipped until then.
test.describe("after the reveal", () => {
  test.skip(() => Date.now() < Date.parse(site.revealAt), "reveal day hasn't come yet");

  test("/revealing-soon redirects to the home page", async ({ request }) => {
    const res = await request.get("/revealing-soon", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(new URL(res.headers().location, "http://localhost").pathname).toBe("/");
  });

  test("without the preview cookie the home page is the real site", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toHaveText(/Dressed to tempt/);
  });
});
