import type { Page } from "@playwright/test";
import { test, expect, go, main, CATALOG } from "./fixtures";

// The tapped card's photo gliding into the product page and back (src/components/shop/PhotoMorph.tsx). The animation
// itself isn't checked — only that the navigation still works, and that the view transition React starts names the
// tapped card's photo and the page's main frame after the piece, and names nothing else.
const { slug, name } = CATALOG.hero;
const photo = `photo-${slug}`;

// React names the elements only while a transition runs, so this keeps, for every view transition the page starts,
// what carries a photo name once it is ready: "img photo-…" for a card's photo, "pdp-main media photo-…" for the frame.
async function recordTransitions(page: Page) {
  await page.addInitScript(() => {
    const seen: string[][] = [];
    (window as unknown as { __transitions: string[][] }).__transitions = seen;
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((arg?: Parameters<typeof start>[0]) => {
      const transition = start(arg);
      const named = () =>
        [...document.querySelectorAll<HTMLElement>("[style*='view-transition-name']")]
          .filter((el) => el.style.viewTransitionName.startsWith("photo-"))
          .map((el) => `${el.getAttribute("class") || el.tagName.toLowerCase()} ${el.style.viewTransitionName}`);
      transition.ready.then(
        () => seen.push(named()),
        () => seen.push([]),
      );
      return transition;
    }) as typeof document.startViewTransition;
  });
}
const named = (page: Page) => page.evaluate(() => (window as unknown as { __transitions: string[][] }).__transitions.flat());
const forget = (page: Page) => page.evaluate(() => void (window as unknown as { __transitions: string[][] }).__transitions.splice(0));

test.describe("the photo glide between a card and its page", () => {
  test("a tapped card opens the piece with its photo named for the glide, and Back carries it home", async ({ prepared: page }) => {
    await recordTransitions(page);
    // the glide pairs only when the piece's page renders in the same moment as the tap, as it does once its link has
    // been prefetched — wait for that rather than for a fixed time
    const prefetched = page.waitForResponse((r) => r.url().includes(`/products/${slug}?_rsc=`), { timeout: 15_000 }).catch(() => null);
    await go(page, "/products");
    await prefetched;
    const card = main(page).locator(".product-card").filter({ has: page.locator(`a[href="/products/${slug}"]`) }).first();
    await card.locator(".product-media > a > img").first().click();

    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
    await expect(main(page).locator("h1")).toHaveText(name);
    await expect(main(page).locator(".pdp-main img.is-active")).toHaveAttribute("alt", `${name} — front view`);
    await expect.poll(() => named(page)).toEqual(expect.arrayContaining([`img ${photo}`, `pdp-main media ${photo}`]));
    // only the tapped piece — not the related rows' cards, which share the card component
    expect((await named(page)).every((n) => n.endsWith(` ${photo}`))).toBe(true);

    await forget(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/products$/);
    await expect(card).toBeInViewport(); // the shop is back where it was
    await expect.poll(() => named(page)).toEqual(expect.arrayContaining([`img ${photo}`, `pdp-main media ${photo}`]));
  });

  test("other navigations and the theme switch name no photo", async ({ prepared: page }) => {
    await recordTransitions(page);
    await go(page, "/about");
    // a piece opened from the search, not from a card
    await page.keyboard.press("/");
    await page.locator(".search-results li a").first().click();
    await expect(page).toHaveURL(/\/products\/[^/]+$/);
    await expect(main(page).locator(".pdp-main")).toBeVisible();
    // the theme switch's bloom is its own view transition, of the whole page
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    await page.locator(".nav-theme").getByRole("switch", { name: "Dark mode" }).click();
    await expect(html).not.toHaveAttribute("data-theme", before!);
    await expect(html).not.toHaveClass(/theme-shifting/); // its transition has finished
    expect(await named(page)).toEqual([]);
  });
});
