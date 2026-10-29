import { test, expect, go, main, CATALOG, bagDialog, openBag, photographed } from "./fixtures";

const fmt = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;
const { slug, name, price } = CATALOG.hero;
const seed = (items: unknown[]) => (page: import("@playwright/test").Page) => page.addInitScript((v) => localStorage.setItem("lusted-bag", JSON.stringify(v)), items);

test.describe("bag", () => {
  test("survives reload and navigation, merges the same line, caps at ten, removes at zero", async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
    const add = async (size: string, n = 1) => {
      await page.locator(".pdp-info .size-chips").getByRole("button", { name: size, exact: true }).click();
      for (let i = 0; i < n; i++) {
        await page.getByRole("button", { name: /Add to bag/ }).click();
        await expect(page.locator(".drawer-root")).toHaveClass(/is-open/);
        await page.keyboard.press("Escape"); // the drawer opens on every add; close it before the next
        await expect(page.locator(".drawer-root")).not.toHaveClass(/is-open/);
      }
    };
    await add("M", 2);
    const bag = bagDialog(page);
    await openBag(page).click();
    await expect(bag.locator(".bag-item")).toHaveCount(1); // same slug+size+colour merged
    await expect(bag.locator(".bag-item .stepper span")).toHaveText("2");
    await page.keyboard.press("Escape");
    await add("L");
    await openBag(page).click();
    await expect(bag.locator(".bag-item")).toHaveCount(2);
    await expect(bag.locator(".drawer-head h2")).toContainText("(3)");
    await expect(bag.locator(".drawer-total strong")).toHaveText(fmt(price * 3));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("lusted-bag")!));
    expect(stored).toEqual([
      { slug, size: "M", color: "blush", qty: 2 },
      { slug, size: "L", color: "blush", qty: 1 },
    ]);
    await page.reload();
    await expect(page.getByRole("button", { name: "Open bag, 3 items" })).toBeVisible();
    await go(page, "/about");
    await openBag(page).click();
    const first = bag.locator(".bag-item").first();
    const plus = first.getByRole("button", { name: "Increase quantity" });
    for (let i = 0; i < 12; i++) await plus.click();
    await expect(first.locator(".stepper span")).toHaveText("10");
    await expect(first.locator("strong")).toHaveText(fmt(price * 10));
    await expect(bag.locator(".drawer-total strong")).toHaveText(fmt(price * 11));
    const minus = first.getByRole("button", { name: "Decrease quantity" });
    for (let i = 0; i < 10; i++) await minus.click();
    await expect(bag.locator(".bag-item")).toHaveCount(1); // M line dropped at 0
    await expect(bag.locator(".bag-item .bag-meta")).toContainText("Blush");
    await expect(bag.locator(".bag-item .bag-size select")).toHaveValue("L");
    await bag.getByRole("button", { name: `Remove ${name}` }).click();
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("lusted-bag"))).toBe("[]");
  });

  test("the WhatsApp order message has a reference, every line with its link, the subtotal and the fill-in lines; clear bag empties it", async ({ prepared: page }) => {
    await seed([
      { slug, size: "S", color: "wine", qty: 2 },
      { slug: CATALOG.bagSale.slug, size: "M", color: CATALOG.bagSale.color, qty: 1 },
    ])(page);
    await go(page, "/");
    await openBag(page).click();
    const bag = bagDialog(page);
    await expect(bag.locator(".bag-item")).toHaveCount(2);
    // .bag-price-now, not the whole strong: a discounted line also carries the struck-through old price
    const salePrice = Number((await bag.locator(".bag-item").nth(1).locator(".bag-price-now").textContent())!.replace(/\D/g, ""));
    const href = decodeURIComponent((await bag.getByRole("link", { name: /Send order on WhatsApp/ }).getAttribute("href"))!);
    expect(href.startsWith(`https://wa.me/${CATALOG.whatsapp}?text=`)).toBe(true);
    const text = href.split("text=")[1];
    expect(text).toMatch(/^Order LST-[A-Z0-9]{5}\nHi Lusted! I'd like to order:\n/);
    const origin = new URL(page.url()).origin;
    expect(text).toContain(`• ${name} — Wine, size S × 2 (${fmt(price * 2)})\n${origin}/products/${slug}\n`);
    expect(text).toContain(`size M × 1 (${fmt(salePrice)})\n${origin}/products/${CATALOG.bagSale.slug}\n`);
    expect(text).toContain(`Subtotal: ${fmt(price * 2 + salePrice)}`);
    expect(text).not.toContain("gift");
    expect(text.endsWith("\n\nName:\nCity / town:")).toBe(true);
    await expect(bag.locator(".bag-item a.bag-thumb").first()).toHaveAttribute("href", `/products/${slug}`);
    // emptying the bag asks once — it sits directly under the send button
    await bag.getByRole("button", { name: "Clear bag" }).click();
    await expect(bag.locator(".bag-item")).toHaveCount(2);
    await bag.getByRole("button", { name: "Tap again to empty the bag" }).click();
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open bag, 0 items" })).toBeVisible();
  });

  test("ticking \"This is a gift\" adds a line to the order, with the note when there is one", async ({ prepared: page }) => {
    await seed([{ slug, size: "M", color: "blush", qty: 1 }])(page);
    await go(page, "/");
    await openBag(page).click();
    const bag = bagDialog(page);
    const order = async () => decodeURIComponent((await bag.getByRole("link", { name: /Send order on WhatsApp/ }).getAttribute("href"))!);
    const ref = (await order()).match(/Order (LST-[A-Z0-9]{5})/)![1];
    await expect(bag.getByLabel("Gift note (optional)")).toHaveCount(0);
    await bag.getByLabel("This is a gift").check();
    expect(await order()).toContain(`Subtotal: ${fmt(price)}\nIt's a gift.\n`);
    const note = bag.getByLabel("Gift note (optional)");
    await expect(note).toHaveAttribute("maxlength", "120");
    await note.fill("  Happy birthday, love  ");
    const text = await order();
    expect(text).toContain("It's a gift — note: Happy birthday, love\n\nName:");
    expect(text).toContain(`Order ${ref}`); // the reference holds while the order is edited
    await bag.getByLabel("This is a gift").uncheck();
    expect(await order()).not.toContain("gift");
  });

  test("a bag line for a piece that no longer exists is dropped quietly", async ({ prepared: page }) => {
    await seed([{ slug: "retired-piece", size: "M", color: "wine", qty: 1 }, { slug, size: "M", color: "blush", qty: 1 }])(page);
    await go(page, "/");
    await expect(page.getByRole("button", { name: "Open bag, 1 items" })).toBeVisible();
    await openBag(page).click();
    await expect(bagDialog(page).locator(".bag-item")).toHaveCount(1);
  });

  test("corrupt storage does not break the page", async ({ prepared: page, errors }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lusted-bag", "{not json");
      localStorage.setItem("lusted-favourites", "42");
      localStorage.setItem("lusted-theme", "purple");
    });
    await go(page, "/products");
    await expect(page.getByRole("button", { name: "Open bag, 0 items" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
    expect(errors).toEqual([]);
  });

  test("the bag item link closes the drawer and opens the product", async ({ prepared: page }) => {
    await seed([{ slug, size: "S", color: "blush", qty: 1 }])(page);
    await go(page, "/about");
    await openBag(page).click();
    await bagDialog(page).locator(".bag-body > a").click();
    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
    await expect(page.locator(".drawer-root")).not.toHaveClass(/is-open/);
  });

  test("changes in another tab show up here (storage event)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const a = await ctx.newPage();
    const b = await ctx.newPage();
    for (const p of [a, b]) await p.addInitScript(() => sessionStorage.setItem("lusted-intro", "1"));
    await a.goto("/about");
    await b.goto("/about");
    await b.evaluate(() => localStorage.setItem("lusted-bag", JSON.stringify([{ slug: "rose-lace-balconette-bra", size: "M", color: "blush", qty: 4 }])));
    await expect(a.getByRole("button", { name: "Open bag, 4 items" })).toBeVisible();
    await ctx.close();
  });
});

test.describe("favourites", () => {
  test("empty state, saving from cards and the product page, the list, the WhatsApp ask, removing", async ({ prepared: page }) => {
    await go(page, "/favourites");
    await expect(main(page).locator(".fav-empty")).toContainText("No favourites yet.");
    await main(page).locator(".fav-empty").getByRole("link", { name: /Browse the shop/ }).click();
    await expect(page).toHaveURL(/\/products$/);
    const first = main(page).locator(".product-grid .product-card").nth(0);
    const second = main(page).locator(".product-grid .product-card").nth(1);
    const firstName = (await first.locator("h3").textContent())!;
    const secondName = (await second.locator("h3").textContent())!;
    await first.getByRole("button", { name: /Save .* to favourites/ }).click();
    await second.getByRole("button", { name: /Save .* to favourites/ }).click();
    await expect(page.getByRole("link", { name: "Favourites, 2 saved" })).toBeVisible();
    await page.getByRole("link", { name: "Favourites, 2 saved" }).click();
    await expect(page).toHaveURL(/\/favourites$/);
    await expect(main(page).locator(".fav-bar p")).toHaveText("2 saved pieces");
    await expect(main(page).locator(".fav-grid .product-card h3")).toHaveText([secondName, firstName]); // newest saved first
    const ask = decodeURIComponent((await page.getByRole("link", { name: /Ask about these on WhatsApp/ }).getAttribute("href"))!);
    expect(ask).toContain(`• ${firstName}`);
    expect(ask).toContain(`• ${secondName}`);
    await main(page).locator(".fav-grid .product-card").first().getByRole("button", { name: /Remove .* from favourites/ }).click();
    await expect(main(page).locator(".fav-grid .product-card")).toHaveCount(1);
    await expect(main(page).locator(".fav-bar p")).toHaveText("1 saved piece");
    await expect(page.getByRole("link", { name: "Favourites, 1 saved" })).toBeVisible();
    await main(page).locator(".fav-grid .product-card").first().getByRole("button", { name: /Remove .* from favourites/ }).click();
    await expect(main(page).locator(".fav-empty")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("lusted-favourites"))).toBe("[]");
  });

  test("favourites persist across reloads and the nav heart highlights on the page", async ({ prepared: page }) => {
    await page.addInitScript(() => localStorage.setItem("lusted-favourites", JSON.stringify(["siren-chainmail-mini", "ghost-piece"])));
    await go(page, "/favourites");
    await expect(main(page).locator(".fav-grid .product-card")).toHaveCount(1); // the unknown slug is ignored
    await expect(page.getByRole("link", { name: /Favourites, 1 saved/ })).toHaveClass(/is-active/);
    await page.reload();
    await expect(main(page).locator(".fav-grid .product-card")).toHaveCount(1);
  });
});

test.describe("recently viewed", () => {
  // any other photographed piece will do: the row is the shopper's history, not the catalogue's pairings
  const other = photographed.find((p) => p.slug !== slug)!;
  const recentRow = (page: import("@playwright/test").Page) => main(page).getByRole("region", { name: "Recently viewed" });

  test("the second piece shows the first, an empty bag offers both, and Clear forgets them", async ({ prepared: page, errors }) => {
    await go(page, `/products/${other.slug}`);
    await expect(main(page).locator(".recent")).toHaveCount(0); // the only piece seen so far is this one
    await go(page, `/products/${slug}`);
    await expect(recentRow(page).locator(".product-card h3")).toHaveText([other.name]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("lusted-recently-viewed")!))).toEqual([slug, other.slug]);

    await openBag(page).click();
    const bag = bagDialog(page);
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    await expect(bag.locator(".drawer-suggest-head")).toHaveText("Still aching for these?");
    await expect(bag.locator(".drawer-suggest-name")).toHaveText([name, other.name]); // newest first
    await expect(bag.locator(".drawer-suggest-price").first()).toHaveText(fmt(price));
    await bag.locator(".drawer-suggest a").nth(1).click();
    await expect(page).toHaveURL(new RegExp(`/products/${other.slug}$`));
    await expect(page.locator(".drawer-root")).not.toHaveClass(/is-open/);

    await expect(recentRow(page).locator(".product-card h3")).toHaveText([name]);
    await recentRow(page).getByRole("button", { name: "Clear the evidence of recently viewed pieces" }).click();
    await expect(main(page).locator(".recent")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("lusted-recently-viewed"))).toBe("[]");
    await openBag(page).click();
    await expect(bag.locator(".drawer-suggest-head")).toHaveText("What's being bought"); // back to the usual empty bag
    expect(errors).toEqual([]);
  });

  test("a piece that has left the catalogue, or storage that isn't a list, is ignored", async ({ prepared: page, errors }) => {
    // seeded once per tab: an init script runs on every load, and the second load below needs what the page left
    await page.addInitScript((s) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("lusted-recently-viewed", JSON.stringify(["ghost-piece", s, s]));
    }, other.slug);
    await go(page, `/products/${slug}`);
    await expect(recentRow(page).locator(".product-card")).toHaveCount(1);
    await page.evaluate(() => localStorage.setItem("lusted-recently-viewed", "{not json"));
    await go(page, `/products/${slug}`);
    await expect(main(page).locator(".pdp-info h1")).toHaveText(name);
    await expect(main(page).locator(".recent")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
