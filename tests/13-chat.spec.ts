import type { Page } from "@playwright/test";
import { test, expect, go, CATALOG } from "./fixtures";
import { site } from "../src/lib/site";

// "Ask us", the chat assistant (src/components/ChatWidget.tsx, src/app/api/chat/route.ts). CI has no Anthropic key, so
// the route's guards are tested for real and Claude's replies are stood in for with page.route: what matters here is
// what the panel does with a reply — the links, the piece cards, the WhatsApp hand-over — not what Claude says.
const launcher = (page: Page) => page.getByRole("button", { name: "Ask us anything" });
const panel = (page: Page) => page.getByRole("dialog", { name: "Ask Lusted" });
const box = (page: Page) => panel(page).getByRole("textbox", { name: "Your message" });
const hero = CATALOG.hero;

async function reply(page: Page, text: string) {
  await page.route("**/api/chat", (route) => route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: text }));
}

test.describe("chat: the route", () => {
  test("takes only well-formed conversations from the site itself", async ({ page }) => {
    await go(page, "/");
    const post = (data: unknown, headers: Record<string, string> = {}) => page.request.post("/api/chat", { data, headers });
    expect((await post({ messages: [{ role: "user", content: "hi" }] }, { origin: "https://elsewhere.example" })).status()).toBe(403);
    expect((await post({})).status()).toBe(400);
    expect((await post({ messages: [] })).status()).toBe(400);
    expect((await post({ messages: [{ role: "assistant", content: "hi" }] })).status()).toBe(400);
    expect((await post({ messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }] })).status()).toBe(400);
    expect((await post({ messages: [{ role: "user", content: "x".repeat(801) }] })).status()).toBe(400);
    expect((await post({ messages: [{ role: "user", content: "   " }] })).status()).toBe(400);
    expect((await post({ messages: [{ role: "user", content: "x".repeat(30_000) }] })).status()).toBe(413);
    expect((await page.request.get("/api/chat")).status()).toBe(405);
    if (!process.env.ANTHROPIC_API_KEY) expect((await post({ messages: [{ role: "user", content: "hi" }] })).status()).toBe(501);
  });

  test("before the reveal, only someone past the gate can talk to it", async ({ playwright, baseURL }) => {
    test.skip(Date.now() >= Date.parse(site.revealAt), "the shop has been revealed");
    const outsider = await playwright.request.newContext({ baseURL }); // no preview cookie
    expect((await outsider.post("/api/chat", { data: { messages: [{ role: "user", content: "hi" }] } })).status()).toBe(403);
    await outsider.dispose();
  });
});

test.describe("chat: the panel", () => {
  test("opens from the corner, offers first questions, and closes with Escape back to the button", async ({ prepared: page, errors }) => {
    await go(page, "/products");
    await expect(panel(page)).toBeHidden();
    await launcher(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toContainText("Our shop assistant (AI)");
    await expect(panel(page).getByRole("button", { name: "Help me find my size" })).toBeVisible();
    await expect(box(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(launcher(page)).toBeFocused();
    expect(errors).toEqual([]);
  });

  test("a reply links the pieces it names, shows them as cards, and hands over to WhatsApp in plain words", async ({ prepared: page }) => {
    await reply(page, `Then you want the [${hero.name}](/products/${hero.slug}) — it lifts everything and hides very little.\n\nTell us your size on WhatsApp and it's yours.`);
    await go(page, "/");
    await launcher(page).click();
    await box(page).fill("Something for date night");
    await page.keyboard.press("Enter");
    await expect(panel(page).locator(".chat-msg.is-user")).toHaveText("Something for date night");
    const answer = panel(page).locator(".chat-msg.is-assistant").last();
    await expect(answer.getByRole("link", { name: hero.name }).first()).toHaveAttribute("href", `/products/${hero.slug}`);
    await expect(answer.locator(".chat-pieces li")).toHaveCount(1);
    const wa = panel(page).getByRole("link", { name: "Continue on WhatsApp" });
    await expect(wa).toHaveAttribute("data-wa-source", "chat");
    const href = (await wa.getAttribute("href"))!;
    expect(href).toContain(`https://wa.me/${CATALOG.whatsapp}?text=`);
    expect(decodeURIComponent(href.split("text=")[1])).toBe(`Hi Lusted! I'd like some help with: ${hero.name}.`);

    // a link to anything that isn't a piece stays plain text
    await reply(page, "Try the [Imaginary Gown](/products/not-a-real-piece).");
    await box(page).fill("And another?");
    await page.keyboard.press("Enter");
    const second = panel(page).locator(".chat-msg.is-assistant").last();
    await expect(second).toContainText("Try the Imaginary Gown.");
    await expect(second.getByRole("link")).toHaveCount(0);
  });

  test("the conversation survives a reload in the same tab, and Start over clears it", async ({ prepared: page }) => {
    await reply(page, "Mm, tell me more.");
    await go(page, "/");
    await launcher(page).click();
    await panel(page).getByRole("button", { name: "Dress me for date night" }).click();
    await expect(panel(page).locator(".chat-msg.is-assistant").last()).toHaveText("Mm, tell me more.");
    await page.reload();
    await go(page, "/");
    await launcher(page).click();
    await expect(panel(page).locator(".chat-msg.is-user")).toHaveText("Dress me for date night");
    await panel(page).getByRole("button", { name: "Start over" }).click();
    await expect(panel(page).locator(".chat-msg.is-user")).toHaveCount(0);
    await expect(panel(page).getByRole("button", { name: "Dress me for date night" })).toBeVisible();
  });

  test("when chat is switched off it sends the shopper to WhatsApp", async ({ prepared: page }) => {
    await page.route("**/api/chat", (route) => route.fulfill({ status: 501, json: { error: "Chat isn't switched on yet." } }));
    await go(page, "/");
    await launcher(page).click();
    await box(page).fill("hello");
    await page.keyboard.press("Enter");
    await expect(panel(page)).toContainText("a real person is, on WhatsApp");
    await expect(panel(page).getByRole("link", { name: "Continue on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  });

  test("isn't on the reveal page or in the owner console", async ({ prepared: page }) => {
    if (Date.now() < Date.parse(site.revealAt)) {
      await go(page, "/revealing-soon"); // after the reveal it sends everyone home
      await expect(launcher(page)).toHaveCount(0);
    }
    await go(page, "/admin");
    await expect(launcher(page)).toHaveCount(0);
  });
});
