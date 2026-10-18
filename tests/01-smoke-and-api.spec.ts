import { test, expect, go, ROUTES, CATALOG } from "./fixtures";

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

  test("an unknown route is a 404", async ({ prepared: page }) => {
    const res = await page.goto("/no-such-page", { waitUntil: "load" });
    expect(res?.status()).toBe(404);
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
