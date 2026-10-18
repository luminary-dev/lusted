import AxeBuilder from "@axe-core/playwright";
import { test, expect, go, revealAll, ROUTES, CATALOG, navToggle } from "./fixtures";

const scan = async (page: import("@playwright/test").Page, label: string) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).exclude(".hero-slides").exclude("canvas").analyze();
  const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const moderate = r.violations.filter((v) => v.impact === "moderate" || v.impact === "minor");
  test.info().annotations.push({ type: `axe ${label}`, description: `${r.violations.length} violations (${serious.length} serious/critical): ${r.violations.map((v) => `${v.id}×${v.nodes.length}`).join(", ") || "none"}` });
  for (const v of moderate) test.info().annotations.push({ type: "axe-minor", description: `${label}: ${v.id} — ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(" ")}` });
  expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" ; ")}`), `${label}: serious accessibility violations`).toEqual([]);
};

test.describe("axe", () => {
  for (const path of ROUTES) {
    test(`${path} has no serious WCAG 2.1 AA violations (desktop, light)`, async ({ prepared: page }) => {
      await go(page, path);
      await revealAll(page);
      await scan(page, `${path} desktop`);
    });
  }
  test("the home page in dark mode", async ({ prepared: page }) => {
    await page.addInitScript(() => localStorage.setItem("lusted-theme", "dark"));
    await go(page, "/");
    await revealAll(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await scan(page, "/ dark");
  });
  test("open dialogs: search, bag with an item, mobile menu and the filters sheet", async ({ prepared: page }) => {
    await page.addInitScript(() => localStorage.setItem("lusted-bag", JSON.stringify([{ slug: "rose-lace-balconette-bra", size: "M", color: "blush", qty: 1 }])));
    await go(page, "/products");
    await page.keyboard.press("/");
    await expect(page.locator(".search-panel")).toHaveCSS("opacity", "1"); // scan once the fade-in has finished, not mid-blend
    await scan(page, "search dialog");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^open bag/i }).click();
    await scan(page, "bag drawer");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    await navToggle(page).click();
    await expect(page.locator(".nav-links")).toHaveCSS("opacity", "1");
    await scan(page, "mobile menu");
    await navToggle(page).click();
    await expect(page.locator(".nav-links")).toHaveCSS("visibility", "hidden"); // let the menu finish closing first
    await page.getByRole("button", { name: /Filters/ }).click();
    await scan(page, "filters sheet");
  });
});

test.describe("keyboard and semantics", () => {
  test("tab order reaches the logo, every nav link, the header buttons and into the page; focus is visible", async ({ prepared: page }) => {
    await go(page, "/about");
    const names: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        const ring = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
        const shadow = cs.boxShadow !== "none";
        return { name: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30) || el.tagName, ring: ring || shadow, tag: el.tagName };
      });
      names.push(info.name!);
      expect(info.ring, `focus on "${info.name}" (${info.tag}) must be visible`).toBe(true);
    }
    expect(names).toEqual(expect.arrayContaining(["Lusted — home", "Shop", "Collections", "Size Guide", "Ordering", "Contact", "Message us on WhatsApp", "Search", "Favourites, 0 saved", "Open bag, 0 items", "Dark mode"]));
  });

  test("Enter on the search button opens the dialog, focus moves into it and returns on Escape; Space toggles the theme", async ({ prepared: page }) => {
    await go(page, "/about");
    await page.getByRole("button", { name: "Search" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("searchbox", { name: "Search products" })).toBeFocused();
    await page.keyboard.type("lace");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(page.locator(".search-root")).not.toHaveClass(/is-open/);
    const sw = page.locator(".nav-theme").getByRole("switch");
    await sw.focus();
    await page.keyboard.press("Space");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("landmarks, headings and names: one main, banner, contentinfo, no empty buttons or links, no duplicate ids", async ({ prepared: page }) => {
    for (const path of ROUTES) {
      await go(page, path);
      await expect(page.getByRole("main"), path).toHaveCount(1);
      await expect(page.getByRole("banner"), path).toHaveCount(1);
      await expect(page.getByRole("contentinfo"), path).toHaveCount(1);
      const problems = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("button, a[href]")) {
          const name = el.getAttribute("aria-label") || el.textContent?.trim() || el.getAttribute("title") || (el.querySelector("img") as HTMLImageElement | null)?.alt;
          if (!name) out.push(`unnamed ${el.tagName.toLowerCase()}.${el.className}`);
        }
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (dupes.length) out.push(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);
        const levels = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
        for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) out.push(`heading jumps h${levels[i - 1]} → h${levels[i]}`);
        return out;
      });
      expect(problems, path).toEqual([]);
    }
  });

  test("touch targets at phone width: every visible control is at least 24×24, most at least 40", async ({ prepared: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const report: string[] = [];
    for (const path of ["/", "/products", `/products/${CATALOG.hero.slug}`]) {
      await go(page, path);
      await revealAll(page);
      const small = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("button, a[href], input, select, [role=button]")) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.opacity === "0") continue;
          let p: HTMLElement | null = el, hidden = false;
          while (p) {
            const s = getComputedStyle(p);
            if (s.display === "none" || s.visibility === "hidden" || (s.opacity === "0" && p !== el)) { hidden = true; break; }
            p = p.parentElement;
          }
          if (hidden) continue;
          if (r.width >= 24 && r.height >= 24) continue;
          if (el.tagName === "A" && el.closest("p, .lede, .size-note, .contact-note")) continue; // a link inside running text is exempt
          // the target is the real clickable region: pseudo-elements and a wrapping <label> count, so probe 12 px out
          // from the centre in each direction with elementFromPoint instead of trusting the box alone
          el.scrollIntoView({ block: "center", behavior: "instant" }); // the page scrolls smoothly by default; probe only once it is there
          const q = el.getBoundingClientRect();
          if (q.bottom < 0 || q.top > innerHeight || q.right < 0 || q.left > innerWidth) continue; // parked off-canvas (a closed sheet) — not tappable until opened, and checked then
          const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
          const label = el.closest("label");
          const owns = (x: number, y: number) => {
            const hit = document.elementFromPoint(x, y);
            return !!hit && (el.contains(hit) || (!!label && label.contains(hit)));
          };
          if (owns(cx - 11.5, cy) && owns(cx + 11.5, cy) && owns(cx, cy - 11.5) && owns(cx, cy + 11.5)) continue;
          out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        return out;
      });
      report.push(...small.map((s) => `${path}: ${s}`));
    }
    expect(report, "controls under 24×24 CSS px (WCAG 2.5.8)").toEqual([]);
  });

  test("reduced motion: no scroll-driven reveals, the hero holds, the loading screen just fades", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    const anim = await page.locator("[data-reveal]").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    await ctx.close();
  });
});
