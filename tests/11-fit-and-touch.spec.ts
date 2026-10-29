import { test, expect, go, CATALOG, bagDialog } from "./fixtures";

const { slug, name } = CATALOG.hero;

// The size guide, the bag's own corrections, and the two things a finger can't do without help. Each covers a
// decision made in the design pass, so a later change that quietly undoes one of them fails here.

test.describe("finding a size", () => {
  test("the chart opens over the piece, a measurement answers it, and the answer lands in the picker", async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
    await page.locator(".buy-group").getByRole("button", { name: "Size guide" }).click();

    const chart = page.getByRole("dialog", { name: "Find your size" });
    await expect(chart).toBeVisible();
    // the shopper stays on the piece — the whole point of not sending them to /#size-guide
    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));

    // 74cm underbust sits in the third band (73–77), which is M
    await chart.getByLabel(/Underbust/).fill("74");
    await expect(chart.getByRole("status")).toContainText("closest to M");
    await chart.getByRole("button", { name: "Choose M" }).click();

    await expect(chart).toBeHidden();
    await expect(page.locator(".size-chips button", { hasText: /^M$/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("Escape closes the chart and the piece is still there", async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
    await page.locator(".buy-group").getByRole("button", { name: "Size guide" }).click();
    const chart = page.getByRole("dialog", { name: "Find your size" });
    await expect(chart).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(chart).toBeHidden();
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  });
});

test.describe("correcting the bag", () => {
  test("a size is changed on the line, and a removal can be taken back", async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
    await page.locator(".size-chips button", { hasText: /^L$/ }).click();
    await page.locator(".buy-actions .btn-wine").click();

    const bag = bagDialog(page);
    const line = bag.locator(".bag-item");
    await expect(line).toHaveCount(1);
    await expect(line.locator(".bag-size select")).toHaveValue("L");

    // the wrong size used to mean removing the line and picking the piece again
    await line.locator(".bag-size select").selectOption("XL");
    await expect(line.locator(".bag-size select")).toHaveValue("XL");

    // remove sits on a small button next to the quantity, so it has a way back
    await line.getByRole("button", { name: `Remove ${name}` }).click();
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    const toast = page.locator(".bag-toast");
    await expect(toast).toContainText("removed");
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect(bag.locator(".bag-item")).toHaveCount(1);
    await expect(bag.locator(".bag-item .bag-size select")).toHaveValue("XL");
  });

  test("an empty bag offers somewhere to go", async ({ prepared: page }) => {
    await go(page, "/");
    await page.getByRole("button", { name: /Open bag/ }).click();
    const bag = bagDialog(page);
    await expect(bag.getByText("Your bag is empty.")).toBeVisible();
    await expect(bag.locator(".drawer-suggest a")).toHaveCount(4);
  });
});

test.describe("a card under a finger", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the back of a piece and quick add are both reachable without hover", async ({ prepared: page }) => {
    await go(page, "/products");
    const card = page.locator("main:visible .product-grid .product-card.has-back").first();

    // the back view is half of what's being bought, and hover can't show it here
    const flip = card.getByRole("button", { name: /^(Back|Front)$/ });
    await expect(flip).toBeVisible();
    await flip.click();
    await expect(card).toHaveClass(/shows-back/);

    // and the grid can be bought from at all
    await card.getByRole("button", { name: /Quick add/ }).click();
    await expect(card.locator(".quick-add")).toBeVisible();
  });

  test("the buy bar brings the price and the button back into reach", async ({ prepared: page }) => {
    await go(page, `/products/${slug}`);
    const bar = page.locator(".buy-bar");
    // the 9:16 photo puts the real button a screenful down, so on landing the bar is already carrying it
    await expect(bar).toHaveClass(/is-shown/);
    await expect(bar).toContainText(name);
    await expect(bar.getByRole("button")).toBeVisible();

    // and it steps aside once the real one is reached, so the same control isn't offered twice
    await page.locator(".buy-actions").scrollIntoViewIfNeeded();
    await expect(bar).not.toHaveClass(/is-shown/);
  });
});
