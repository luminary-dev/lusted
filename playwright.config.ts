import { defineConfig, devices } from "@playwright/test";

// The suite runs against a production build (`next build`), served on PORT (default 3177) so it never clashes with
// `next dev`. `npm test` builds first; `npx playwright test` reuses a server that is already up.
const PORT = Number(process.env.PW_PORT ?? 3177);
const BASE = process.env.PW_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 6, // GitHub's runners have two cores
  timeout: 90_000,
  expect: { timeout: process.env.CI ? 20_000 : 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/report" }], ["json", { outputFile: "test-results/results.json" }]],
  outputDir: "test-results/artifacts",
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    colorScheme: "light",
    locale: "en-GB",
    viewport: { width: 1440, height: 900 },
    // GitHub's runners have no GPU: WebGL there is emulated on the CPU, and the cursor smoke and the 3D size tags then
    // starve the page (seconds per frame on a 4K or 5K viewport). In CI the browser runs without WebGL, so the site
    // falls back as it does on any device without it — the suite tests the HTML tags, never the 3D scene.
    launchOptions: process.env.CI ? { args: ["--disable-3d-apis"] } : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, url: BASE, reuseExistingServer: true, timeout: 120_000 },
});
