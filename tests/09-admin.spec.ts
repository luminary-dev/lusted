import { test, expect } from "./fixtures";
import { offerProblem, percentProblem } from "../src/lib/admin/offers";
import { PHOTO_CHANGES_MAX, photoChangesProblem, photoKey, photoNamesClash, type PhotoChange } from "../src/lib/admin/photos";
import { inSizeOrder, soldOutProblem } from "../src/lib/admin/stock";

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

  // The rules the console checks before Save and the dispatch route checks before queuing a change. The route itself
  // can't be reached here — the suite's server has no session to give — so its refusals are covered through the rules
  // it shares with the console (src/lib/admin/offers.ts).
  test("an offer the Console workflow would refuse is caught before it is queued", () => {
    expect(offerProblem(4990, 5990)).toBeNull();
    expect(offerProblem(5990, 5990)).toMatch(/under the full price/);
    expect(offerProblem(6990, 5990)).toMatch(/under the full price/);
    expect(offerProblem(0, 5990)).toMatch(/end the offer/);
    expect(offerProblem(-10, 5990)).toMatch(/end the offer/);
    expect(offerProblem(4990.5, 5990)).toMatch(/whole rupees/i);
    expect(offerProblem(Number.NaN, 5990)).toMatch(/whole rupees/i);
    expect(offerProblem(4990)).toBeNull(); // with no full price to hand, only the offer itself is checked
    for (const ok of [1, 20, 90]) expect(percentProblem(ok), String(ok)).toBeNull();
    for (const bad of [0, 91, 100, -5, 12.5, Number.NaN]) expect(percentProblem(bad), String(bad)).toMatch(/1 to 90/);
  });

  // A piece's photos, changed from its row in the ledger: the same rules the console checks before Save and the
  // dispatch route checks before queuing (src/lib/admin/photos.ts), on a piece in ivory and blush with a front, a back
  // and a blush front and back, one of them put there by the console under a key of its own.
  test("a photo change the Console workflow would refuse is caught before it is queued", () => {
    const piece = { slug: "camille", colors: ["ivory", "blush"] };
    const keys = ["products/camille.0a1b2c3d.webp", "products/camille-back.webp", "products/camille--blush.webp", "products/camille--blush-back.webp", "products/camilleo.webp"];
    const change = (colour: string | null, view: PhotoChange["view"], remove = false): PhotoChange => ({ colour, view, remove });
    // the console's new key is found as the view's photo; a piece whose slug merely starts the same is not
    expect(photoKey(keys, "camille", null, "front")).toBe("products/camille.0a1b2c3d.webp");
    expect(photoKey(keys, "camille", null, "side")).toBeNull();
    expect(photoKey(["products/camille.webp", "products/camille.0a1b2c3d.webp"], "camille", null, "front")).toBe("products/camille.webp");
    expect(photoKey(["products/camille.not-a-rev.webp"], "camille", null, "front")).toBeNull();
    // the three optional photos are <slug>-4, -5 and -6, and the same after a colour
    expect(photoKey(["products/camille-4.webp", "products/camille--blush-6.0a1b2c3d.webp"], "camille", null, "extra1")).toBe("products/camille-4.webp");
    expect(photoKey(["products/camille-4.webp", "products/camille--blush-6.0a1b2c3d.webp"], "camille", "blush", "extra3")).toBe("products/camille--blush-6.0a1b2c3d.webp");
    expect(photoKey(["products/camille-4.webp"], "camille", null, "extra2")).toBeNull();
    // a new piece whose name would read as another's photo is refused in the fitting
    expect(photoNamesClash("camille-4", ["camille"])).toBe(true);
    expect(photoNamesClash("camille", ["camille-back"])).toBe(true);
    expect(photoNamesClash("camille--x", [])).toBe(true);
    expect(photoNamesClash("camille-14", ["camille"])).toBe(false);
    expect(photoNamesClash("rose-lace", ["rose"])).toBe(false);

    // replacing, adding, taking off, a new colourway (its front adds the colour), a colour's front taking its back along
    expect(photoChangesProblem(piece, keys, [change(null, "front"), change(null, "side"), change(null, "back", true)])).toBeNull();
    expect(photoChangesProblem(piece, keys, [change("blush", "side"), change("blush", "back", true)])).toBeNull();
    expect(photoChangesProblem(piece, keys, [change("lilac", "front"), change("lilac", "back")])).toBeNull();
    expect(photoChangesProblem(piece, keys, [change("blush", "front", true)])).toBeNull();
    expect(photoChangesProblem(piece, keys, [change(null, "extra1"), change(null, "extra3"), change("blush", "extra2")])).toBeNull();
    expect(photoChangesProblem(piece, keys, [change("lilac", "front"), change("lilac", "extra1")])).toBeNull();

    expect(photoChangesProblem(piece, keys, [])).toMatch(/nothing/i);
    expect(photoChangesProblem(piece, keys, [change(null, "front", true)])).toMatch(/keeps its front/);
    expect(photoChangesProblem(piece, keys, [change(null, "side", true)])).toMatch(/no side photo/);
    expect(photoChangesProblem(piece, keys, [change(null, "extra2", true)])).toMatch(/no extra 2 photo/);
    expect(photoChangesProblem(piece, keys, [change("lilac", "extra3")])).toMatch(/lilac front/);
    expect(photoChangesProblem(piece, keys, [change("ivory", "back")])).toMatch(/piece’s own/);
    expect(photoChangesProblem(piece, keys, [change(null, "back"), change(null, "back", true)])).toMatch(/one change per photo/i);
    // a colour's back and side show only with its front
    expect(photoChangesProblem(piece, keys, [change("lilac", "back")])).toMatch(/lilac front/);
    expect(photoChangesProblem(piece, keys, [change("blush", "front", true), change("blush", "side")])).toMatch(/blush front/);
    expect(photoChangesProblem(piece, keys, [change("Blush!", "front")])).toMatch(/colours/);
    expect(photoChangesProblem(piece, keys, Array.from({ length: PHOTO_CHANGES_MAX + 1 }, (_, i) => change(null, "back", i % 2 === 0)))).toMatch(/too many/i);
  });

  // The sizes a piece is out of, marked from its row in the ledger: the rule the dispatch route checks before queuing
  // (src/lib/admin/stock.ts) — first the shape of the list, then against the piece's own sizes as they are on dev.
  test("sold-out sizes the Console workflow would refuse are caught before they are queued", () => {
    const sizes = ["XS", "S", "M", "L"];
    expect(soldOutProblem(["M"], sizes)).toBeNull();
    expect(soldOutProblem(["XS", "L"], sizes)).toBeNull();
    expect(soldOutProblem(sizes, sizes)).toBeNull(); // every size: the whole piece is sold out
    expect(soldOutProblem([], sizes)).toBeNull(); // an empty list puts every size back
    expect(soldOutProblem(["XL"], sizes)).toBe("XL isn’t one of its sizes");
    expect(soldOutProblem(["m"], sizes)).toMatch(/isn’t one of its sizes/);
    expect(soldOutProblem(["M", "M"], sizes)).toMatch(/each size once/);
    for (const bad of ["M", null, {}, [3], [""], ["M", null], Array.from({ length: 21 }, (_, i) => `S${i}`)]) expect(soldOutProblem(bad), JSON.stringify(bad)).toMatch(/a list of sizes/);
    expect(soldOutProblem(["XL"])).toBeNull(); // with no sizes to hand, only the shape is checked
    // kept in the piece's own size order, however the sizes were pressed
    expect(inSizeOrder(["L", "XS"], sizes)).toEqual(["XS", "L"]);
  });
});
