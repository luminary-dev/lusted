import { test, expect } from "./fixtures";

// The owner console (src/app/admin): reachable in front of the reveal gate, never cached or indexed, and nothing in
// it answers without a session. The server the suite runs against has no ADMIN_* environment, so the form is shown
// with its "not set up" notice and the button disabled; with the environment set, the same page signs in.

test.describe("owner console", () => {
  test("/admin shows the sign-in form, even without the preview cookie, with no-store and noindex headers", async ({ browser }) => {
    const context = await browser.newContext();
    await context.clearCookies(); // the reveal gate is on for the served build — the console is its own door
    const page = await context.newPage();
    const res = await page.goto("/admin", { waitUntil: "load" });
    expect(res?.status()).toBe(200);
    expect(res?.headers()["cache-control"]).toContain("no-store");
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    expect(res?.headers()["content-security-policy"]).toContain("r2.cloudflarestorage.com");
    await expect(page).toHaveTitle(/back room/i);
    const form = page.locator("main.adm-login form");
    await expect(form).toBeVisible();
    await expect(form.getByPlaceholder("Email")).toBeVisible();
    await expect(form.getByPlaceholder("Password")).toBeVisible();
    await expect(form.getByRole("button", { name: /Let me in/ })).toBeVisible();
    // its own page: the shop's nav, footer, cursor and intro are hidden around it (17-admin.css)
    for (const chrome of ["header.nav", "footer.footer", ".scroll-rail"]) await expect(page.locator(chrome), chrome).toBeHidden();
    await context.close();
  });

  test("every room asks for the key without a session, and an unknown room is a 404", async ({ request }) => {
    for (const room of ["fitting", "offers", "ledger", "daybook"]) {
      const res = await request.get(`/admin/${room}`);
      expect(res.status(), room).toBe(200);
      expect(await res.text(), room).toContain("adm-login-card");
    }
    expect((await request.get("/admin/cellar")).status()).toBe(404);
  });

  test("the console's API answers nothing without a session", async ({ request }) => {
    for (const path of ["/api/admin/state", "/api/admin/activity"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
    }
    for (const path of ["/api/admin/dispatch", "/api/admin/upload-url", "/api/admin/products/add", "/api/admin/copy"]) {
      const res = await request.post(path, { data: {} });
      expect([401, 403], path).toContain(res.status());
    }
    const res = await request.post("/api/admin/login", { data: { email: "nobody@example.com", password: "wrong" }, headers: { origin: "http://localhost:1" } });
    expect(res.status()).toBe(403); // a cross-site sign-in never gets as far as the password
  });

  test("a wrong password is refused", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "load" });
    // the form's own fetch carries the page's origin; a request without one is refused before the password is looked at
    const origin = new URL(page.url()).origin;
    const res = await page.request.post("/api/admin/login", { data: { email: "nobody@example.com", password: "wrong" }, headers: { origin } });
    expect(res.status()).toBe(401);
    expect(res.headers()["set-cookie"]).toBeUndefined();
  });
});
