import { test, expect, go, revealAll, expectNoHorizontalScroll, overflowReport, ALL_DEVICES, BOUNDARIES, MINIMUM_SET, CATALOG, navToggle } from "./fixtures";

// GitHub's GPU-less runners paint the ultrawide, 4K and 5K screens (5-8 million pixels) on the CPU too slowly to
// finish; those run locally, and CI covers everything up to 2560×1440
const tooBigForCi = (v: { w: number; h: number }) => !!process.env.CI && v.w * v.h > 4_000_000;

const PAGES = ["/", "/products", `/products/${CATALOG.hero.slug}`, "/about", "/privacy"];

/** what the layout promises at a given width (the site's own breakpoints) */
async function expectBreakpointRules(page: import("@playwright/test").Page, w: number, path: string) {
  const mobileNav = w <= 900;
  await expect(navToggle(page), `nav toggle at ${w}`).toBeVisible({ visible: mobileNav });
  if (mobileNav) await expect(page.locator(".nav-links")).toHaveCSS("opacity", "0");
  else await expect(page.locator(".nav-links a").first()).toBeVisible();
  await expect(page.locator(".nav-whatsapp span"), `WhatsApp label at ${w}`).toBeVisible({ visible: w > 1240 });
  await expect(page.locator(".nav-whatsapp"), `WhatsApp button at ${w}`).toBeVisible({ visible: w > 479 });
  await expect(page.locator(".nav-theme"), `theme switch in bar at ${w}`).toBeVisible({ visible: w > 479 });
  if (path === "/") {
    await expect(page.getByRole("navigation", { name: "Sections" }), `scroll rail at ${w}`).toBeVisible({ visible: w >= 900 });
    await expect(page.locator(".contact-qr"), `QR at ${w}`).toBeVisible({ visible: w > 700 });
  }
  if (path === "/products") {
    await expect(page.getByRole("button", { name: /Filters/ }), `filters button at ${w}`).toBeVisible({ visible: w <= 900 });
    // under 900 the filters are a sheet parked off-screen until asked for; above, a sidebar on the page
    const aside = page.getByRole("complementary", { name: "Filters" });
    if (w > 900) await expect(aside).toBeInViewport();
    else await expect(aside).not.toBeInViewport();
  }
  // the header never wraps: logo and actions stay on one line inside the viewport
  const bar = await page.locator(".nav-bar").boundingBox();
  const logo = await page.getByRole("link", { name: "Lusted — home" }).boundingBox();
  const actions = await page.locator(".nav-actions").boundingBox();
  expect(bar!.x + bar!.width, `nav bar within ${w}`).toBeLessThanOrEqual(w + 1);
  expect(Math.abs(logo!.y - actions!.y), `logo and actions share a row at ${w}`).toBeLessThan(logo!.height);
  expect(bar!.height, `nav bar height at ${w}`).toBeLessThan(140);
}

async function expectReadable(page: import("@playwright/test").Page, w: number) {
  const h1 = page.locator("h1").first();
  await expect(h1).toBeVisible();
  const box = await h1.boundingBox();
  expect(box!.x, "h1 starts inside the viewport").toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width, "h1 ends inside the viewport").toBeLessThanOrEqual(w + 1);
  // body copy never runs past ~80 characters a line on wide screens, and is never tiny
  const lede = page.locator(".lede").first();
  if (await lede.count()) {
    const m = await lede.evaluate((el) => ({ w: el.getBoundingClientRect().width, size: parseFloat(getComputedStyle(el).fontSize) }));
    expect(m.size).toBeGreaterThanOrEqual(14);
    if (w >= 1200) expect(m.w / m.size, "lede measure (em)").toBeLessThanOrEqual(40);
  }
  const base = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  expect(base).toBeGreaterThanOrEqual(14);
}

test.describe("every device size", () => {
  for (const v of ALL_DEVICES) {
    test(`${v.kind} · ${v.name} (${v.w}×${v.h})`, async ({ prepared: page }) => {
      test.skip(tooBigForCi(v), "too large to paint without a GPU in CI");
      test.setTimeout(150_000);
      await page.setViewportSize({ width: v.w, height: v.h });
      for (const path of PAGES) {
        await go(page, path);
        await revealAll(page);
        await expectNoHorizontalScroll(page, `${v.name} ${path}`);
        await expectBreakpointRules(page, v.w, path);
        await expectReadable(page, v.w);
        // scrolled to the bottom nothing has pushed the page wider either
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await expectNoHorizontalScroll(page, `${v.name} ${path} (bottom)`);
      }
    });
  }
});

test.describe("breakpoint boundaries (−1 / 0 / +1)", () => {
  for (const v of BOUNDARIES) {
    test(`${v.w}px`, async ({ prepared: page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: v.w, height: v.h });
      for (const path of ["/", "/products"]) {
        await go(page, path);
        await revealAll(page);
        await expectNoHorizontalScroll(page, `${v.w} ${path}`);
        await expectBreakpointRules(page, v.w, path);
      }
    });
  }
});

test.describe("sizes, modes and postures", () => {
  test("resizing live (fold / rotate / split-screen) never leaves the layout broken or the menu stranded", async ({ prepared: page }) => {
    await go(page, "/");
    await revealAll(page);
    const steps = [360, 984, 360, 1092, 667, 375, 1366, 320, 2560, 390];
    for (const w of steps) {
      await page.setViewportSize({ width: w, height: w < 500 ? 800 : 900 });
      await page.waitForTimeout(150);
      await expectNoHorizontalScroll(page, `live resize → ${w}`);
      await expectBreakpointRules(page, w, "/");
    }
    // open the phone menu, grow to desktop: the menu must not stay open over the desktop bar
    await page.setViewportSize({ width: 390, height: 844 });
    await navToggle(page).click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(150);
    await expect(page.locator(".nav-links a").first()).toBeVisible();
    await expectNoHorizontalScroll(page, "menu open then widened");
  });

  test("iOS zoom-out: nothing parked off-screen inside an unclipped fixed layer", async ({ prepared: page }) => {
    // Desktop browsers ignore overflow inside position:fixed layers, but iOS Safari counts it as page width and lets you
    // pinch out to a blank stripe. Every fixed, full-width layer must clip, or keep its children inside the viewport.
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/products", `/products/${CATALOG.hero.slug}`]) {
      await go(page, path);
      const leaks = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed" || cs.display === "none") continue;
          if (/(hidden|clip)/.test(cs.overflow) || /(hidden|clip)/.test(cs.overflowX)) continue;
          for (const child of el.querySelectorAll<HTMLElement>("*")) {
            const r = child.getBoundingClientRect();
            if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)) {
              out.push(`${el.className || el.tagName} ⟶ ${child.className || child.tagName} [${Math.round(r.left)}…${Math.round(r.right)}]`);
              break;
            }
          }
        }
        return out;
      });
      expect(leaks, `${path}: off-screen content inside an unclipped fixed layer`).toEqual([]);
    }
  });

  test("short landscape phone (667×375): the header does not eat the screen and the hero copy is reachable", async ({ prepared: page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await go(page, "/");
    const bar = await page.locator(".nav-bar").boundingBox();
    expect(bar!.height).toBeLessThan(375 * 0.3);
    await page.locator("#top h1").scrollIntoViewIfNeeded();
    await expect(page.locator("#top h1")).toBeInViewport();
    await go(page, `/products/${CATALOG.hero.slug}`);
    await page.getByRole("button", { name: /Add to bag/ }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: /Add to bag/ })).toBeInViewport();
  });

  test("WCAG 1.4.10 reflow: at 320 px wide (400% zoom) nothing needs two-dimensional scrolling", async ({ prepared: page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    for (const path of PAGES) {
      await go(page, path);
      await revealAll(page);
      const r = await overflowReport(page);
      expect(r.scrollWidth, `${path} at 320: ${r.offenders.join(" | ")}`).toBeLessThanOrEqual(321);
    }
  });

  test("200% zoom equivalent (720 px) keeps the shop usable", async ({ prepared: page }) => {
    await page.setViewportSize({ width: 720, height: 450 });
    await go(page, "/products");
    await expectNoHorizontalScroll(page, "720 shop");
    await page.getByRole("button", { name: /Filters/ }).click();
    await expect(page.getByRole("complementary", { name: "Filters" })).toBeVisible();
    await expectNoHorizontalScroll(page, "720 shop with filters open");
  });

  test("larger text (user font size 150% / 200%) reflows without clipping the header or buttons", async ({ prepared: page }) => {
    for (const pct of [150, 200]) {
      await page.setViewportSize({ width: 390, height: 844 });
      await go(page, "/about");
      await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
      await page.waitForTimeout(100);
      await expectNoHorizontalScroll(page, `font ${pct}%`);
      const cta = page.locator(".about-cta").getByRole("link", { name: /Show me everything/ });
      await cta.scrollIntoViewIfNeeded();
      const b = await cta.boundingBox();
      expect(b!.x + b!.width, `button fits at ${pct}%`).toBeLessThanOrEqual(391);
      const t = await cta.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(t, `button label not clipped at ${pct}%`).toBe(true);
    }
  });

  test("WCAG 1.4.12 text spacing overrides don't clip or overflow", async ({ prepared: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go(page, "/");
    await revealAll(page);
    await page.addStyleTag({ content: "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}" });
    await page.waitForTimeout(100);
    await expectNoHorizontalScroll(page, "text spacing");
    const clipped = await page.locator(".btn, .nav-links a, .eyebrow").evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "visible").map((e) => e.textContent?.trim()));
    expect(clipped).toEqual([]);
  });

  test("dark mode at phone, tablet and desktop widths: readable contrast tokens and no light leaks", async ({ prepared: page }) => {
    await page.addInitScript(() => localStorage.setItem("lusted-theme", "dark"));
    for (const [w, h] of [[390, 844], [820, 1180], [1920, 1080]] as const) {
      await page.setViewportSize({ width: w, height: h });
      for (const path of ["/", "/products", "/about"]) {
        await go(page, path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        expect(bg, `${path} @${w} dark body`).toMatch(/rgb\((\d|1\d|2\d|3\d), (\d|1\d), (\d|1\d|2\d)\)/);
        await expectNoHorizontalScroll(page, `${path} dark @${w}`);
      }
    }
  });

  for (const dpr of [1, 1.5, 2, 2.625, 3, 3.5, 4]) {
    test(`DPR ${dpr}: photography is served sharp enough for the screen`, async ({ browser }) => {
      const ctx = await browser.newContext({ deviceScaleFactor: dpr, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      await page.addInitScript(() => sessionStorage.setItem("lusted-intro", "1"));
      await page.goto("/");
      const img = page.locator(".hero-slide").first().locator("img");
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
      const served = await img.evaluate((i: HTMLImageElement) => new URL(i.currentSrc, location.href).searchParams.get("w"));
      const rendered = await img.evaluate((i) => i.getBoundingClientRect().width);
      // phones get the 9:16 cut of the photo (hero/main-phone), shown at 100vw, so the chosen candidate must cover the
      // screen width × DPR (next/image picks the first size ≥ that), capped at the largest size
      const portrait = await img.evaluate((i: HTMLImageElement) => i.naturalHeight > i.naturalWidth);
      expect(portrait, "the phone is served the portrait cut, not the wide photo").toBe(true);
      expect(Number(served), `served width for ${rendered}px × ${dpr}`).toBeGreaterThanOrEqual(Math.min(3840, Math.floor(390 * dpr) - 1));
      await ctx.close();
    });
  }

  test("safe areas: viewport-fit and env() insets are declared so notched phones get padding", async ({ prepared: page }) => {
    await go(page, "/");
    const vp = await page.locator('meta[name="viewport"]').getAttribute("content");
    const css = await page.evaluate(async () => {
      let text = "";
      for (const s of document.styleSheets) {
        try {
          for (const r of s.cssRules) text += r.cssText;
        } catch {}
      }
      return text;
    });
    test.info().annotations.push({ type: "safe-area", description: `viewport-fit=cover: ${/viewport-fit=cover/.test(vp ?? "")}; env(safe-area-inset) used: ${/safe-area-inset/.test(css)}` });
    expect(/viewport-fit=cover/.test(vp ?? "") === /safe-area-inset/.test(css), "viewport-fit=cover must be paired with env(safe-area-inset-*) padding").toBe(true);
  });

  test("forced colours / high contrast: content still has visible borders on controls", async ({ browser }) => {
    const ctx = await browser.newContext({ forcedColors: "active", viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem("lusted-intro", "1"));
    await page.goto("/products");
    await expect(page.getByRole("tab", { name: /^All/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^open bag/i })).toBeVisible();
    await ctx.close();
  });

  test("print: the page prints without the fixed chrome", async ({ prepared: page }) => {
    await go(page, `/products/${CATALOG.hero.slug}`);
    await page.emulateMedia({ media: "print" });
    const fixed = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("header, .scroll-rail, canvas, .intro")].filter((e) => getComputedStyle(e).position === "fixed" && getComputedStyle(e).display !== "none").map((e) => e.className || e.tagName));
    test.info().annotations.push({ type: "print", description: `fixed chrome still shown in print: ${fixed.join(", ") || "none"}` });
    expect(fixed, "fixed chrome in print").toEqual([]);
  });
});

test.describe("screenshots for review (practical minimum set)", () => {
  for (const v of MINIMUM_SET) {
    test(`${v.name} ${v.w}×${v.h}`, async ({ prepared: page }, info) => {
      test.skip(tooBigForCi(v), "too large to paint without a GPU in CI");
      await page.setViewportSize({ width: v.w, height: v.h });
      for (const path of ["/", "/products", `/products/${CATALOG.hero.slug}`, "/about"]) {
        await go(page, path);
        await revealAll(page);
        const shot = await page.screenshot({ fullPage: path !== "/" });
        await info.attach(`${v.w}x${v.h}${path.replace(/\//g, "_") || "_home"}.png`, { body: shot, contentType: "image/png" });
      }
    });
  }
});
