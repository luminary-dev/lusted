import type { Page } from "@playwright/test";
import { test, expect, go, main, CATALOG, navToggle, expectNoHorizontalScroll } from "./fixtures";
import { giftVoucher } from "../src/lib/site";

// The gift vouchers page (src/app/gift-vouchers, src/components/GiftVoucher.tsx): no payment, one WhatsApp message to
// the shop. The amounts and the range are placeholders in src/lib/site.ts, so they're read from there.
const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;
const card = (page: Page) => main(page).locator(".gv-card");
const send = (page: Page) => main(page).getByRole("link", { name: "Send the request on WhatsApp" });
const other = (page: Page) => main(page).getByRole("textbox", { name: "Another amount, in rupees" });
const sentText = async (page: Page) => {
  const href = (await send(page).getAttribute("href"))!;
  expect(href).toContain(`https://wa.me/${CATALOG.whatsapp}?text=`);
  return decodeURIComponent(href.split("text=")[1]);
};

test.describe("gift vouchers", () => {
  test("the page renders: the card, every amount, the explainer and the terms", async ({ prepared: page, errors }) => {
    await go(page, "/gift-vouchers");
    await expect(page).toHaveTitle("Gift vouchers — Lusted Sri Lanka");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Give them something wicked.");
    await expect(card(page)).toBeVisible();
    await expect(card(page).getByRole("img", { name: "Lusted Lingerie" })).toBeVisible();
    const amounts = main(page).getByRole("group", { name: "Amount" });
    for (const a of giftVoucher.amounts) await expect(amounts.getByRole("radio", { name: lkr(a) })).toBeAttached();
    await expect(amounts.getByRole("radio", { name: "Another amount" })).toBeAttached();
    await expect(main(page).getByRole("heading", { name: "How it happens" })).toBeVisible();
    await expect(main(page).locator(".gift-terms")).toContainText(`${giftVoucher.validMonths} months`);
    await expect(main(page).locator(".gift-terms").getByRole("link", { name: /terms/ })).toHaveAttribute("href", "/terms");
    await expect(send(page)).toHaveAttribute("data-wa-source", "gift-voucher");
    await expect(send(page)).toHaveAttribute("target", "_blank");
    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).pathname).toBe("/gift-vouchers");
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toContain("opengraph-image");
    expect(errors).toEqual([]);
  });

  test("choosing an amount, a name and a message updates the card and the WhatsApp message", async ({ prepared: page }) => {
    await go(page, "/gift-vouchers");
    const top = giftVoucher.amounts[giftVoucher.amounts.length - 1];
    await main(page).getByRole("radio", { name: lkr(top) }).check();
    await expect(main(page).getByRole("radio", { name: lkr(top) })).toBeChecked();
    await expect(card(page).locator(".gv-card-amount")).toHaveText(lkr(top));

    await main(page).getByRole("textbox", { name: /^To/ }).fill("Amaya");
    const words = "Happy birthday — pick something that makes you blush & then show me.";
    await main(page).getByRole("textbox", { name: /^Message/ }).fill(words);
    await expect(card(page).locator(".gv-card-to")).toHaveText("For Amaya");
    await expect(card(page).locator(".gv-card-note")).toHaveText(words);
    await expect(main(page).locator(".gv-count")).toContainText(`${words.length} / 120`);

    const text = await sentText(page);
    expect(text).toMatch(/^Gift voucher LST-[A-Z0-9]{5}\n/);
    expect(text).toContain(`Amount: ${lkr(top)}`);
    expect(text).toContain("To: Amaya");
    expect(text).toContain(`Message: ${words}`);
    // the reference on the card is the one in the message
    const ref = text.match(/LST-[A-Z0-9]{5}/)![0];
    await expect(card(page).locator(".gv-card-ref")).toHaveText(ref);

    // a whole-rupee amount of one's own, thousands commas forgiven
    await other(page).fill("7,500");
    await expect(main(page).getByRole("radio", { name: "Another amount" })).toBeChecked();
    await expect(card(page).locator(".gv-card-amount")).toHaveText(lkr(7500));
    expect(await sentText(page)).toContain(`Amount: ${lkr(7500)}`);
  });

  test("the message is capped at 120 characters", async ({ prepared: page }) => {
    await go(page, "/gift-vouchers");
    await main(page).getByRole("textbox", { name: /^Message/ }).fill("x".repeat(200));
    await expect(main(page).getByRole("textbox", { name: /^Message/ })).toHaveValue("x".repeat(120));
  });

  test("an invalid amount of one's own is refused: it says why, names no amount and opens no chat", async ({ prepared: page }) => {
    await go(page, "/gift-vouchers");
    const field = other(page);
    const error = main(page).locator(".gv-error");
    for (const [typed, why] of [
      [String(giftVoucher.min - 1), /smallest/i],
      [String(giftVoucher.max + 1), /Up to/],
      ["2500.50", /Whole rupees/],
      ["5k", /Whole rupees/],
      ["-5000", /Whole rupees/],
    ] as const) {
      await field.fill(typed);
      await field.blur();
      await expect(error, typed).toHaveText(why);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(card(page).locator(".gv-card-amount")).toHaveText("LKR —");
      const text = await sentText(page);
      expect(text, typed).not.toContain("Amount:");
      // the click is cancelled: no new tab, and focus goes back to the amount
      let opened = false;
      page.context().once("page", () => (opened = true));
      await send(page).click();
      await page.waitForTimeout(300);
      expect(opened, `${typed} opened a chat`).toBe(false);
      await expect(field).toBeFocused();
    }
    // an empty "Another amount" is refused too
    await field.fill("");
    await main(page).getByRole("radio", { name: "Another amount" }).check();
    await send(page).click();
    await expect(error).toHaveText(/Enter an amount/);
    // picking one of the amounts clears it
    await main(page).getByRole("radio", { name: lkr(giftVoucher.amounts[0]) }).check();
    await expect(error).toHaveText("");
    expect(await sentText(page)).toContain(`Amount: ${lkr(giftVoucher.amounts[0])}`);
  });

  test("linked from the footer and the phone menu, not the desktop bar", async ({ prepared: page }) => {
    await go(page, "/about");
    await expect(page.locator("footer.footer").getByRole("link", { name: "Gift vouchers" })).toHaveAttribute("href", "/gift-vouchers");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Gift vouchers" })).toBeHidden();
    await page.setViewportSize({ width: 375, height: 812 });
    await navToggle(page).click();
    const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Gift vouchers" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/gift-vouchers$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Give them something wicked.");
  });

  for (const [w, h] of [[375, 812], [1440, 900]] as const) {
    test(`fits ${w} px wide, and typing never changes the card's size`, async ({ prepared: page }) => {
      await page.setViewportSize({ width: w, height: h });
      await go(page, "/gift-vouchers");
      await expectNoHorizontalScroll(page, `/gift-vouchers at ${w}`);
      const before = await card(page).boundingBox();
      await main(page).getByRole("textbox", { name: /^To/ }).fill("Someone with a very long name indeed, really");
      await main(page).getByRole("textbox", { name: /^Message/ }).fill("w".repeat(30) + " " + "longer words that wrap ".repeat(5));
      await other(page).fill("100000");
      const after = await card(page).boundingBox();
      expect(after!.height).toBeCloseTo(before!.height, 0);
      expect(after!.width).toBeCloseTo(before!.width, 0);
      await expectNoHorizontalScroll(page, `/gift-vouchers at ${w}, filled in`);
    });
  }
});
