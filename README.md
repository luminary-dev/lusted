# Lusted

The website for **Lusted** — lingerie, swim and after-dark pieces from a Sri Lankan boutique that takes its orders on WhatsApp.

Live at **https://lusted.vercel.app**.

## What it is

A Next.js 16 site: a single scrolling home page (hero slideshow, bikini sale, the three collections, best sellers, how ordering works, size guide, about, contact), a shop with search and filters, a page per product, favourites, an about page, a delivery, returns & FAQ page (`/help`), and the privacy policy and terms. There is no checkout — the bag and favourites live in the visitor's browser, and "Send order on WhatsApp" turns the bag into one message to the shop.

## Run it

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
npm run lint
```

## Where things live

- **Products** — `src/lib/catalog.json`: name, price (LKR), sale price, sizes, colours, best-seller rank (1–6), date added, description. Photos are `assets/products/<slug>.webp` with optional `-back` and `-side` views (see "Photos").
- **Contact details** — `src/lib/site.ts`: WhatsApp number, Instagram, email, hours. Every button and link reads from here.
- **Collection names and taglines** — `categories` in `src/lib/products.ts`.
- **Colours, type and spacing** — CSS variables at the top of `src/app/globals.css`; dark mode is the `[data-theme="dark"]` block.
- **Brand assets** — `brand/` (logo pack, icons, social images).
- **Link previews and search engines** — `src/app/opengraph-image.png` is the brand card every shared link shows (product pages share their own front photo instead); `src/app/sitemap.ts` and `src/app/robots.ts` build `/sitemap.xml` and `/robots.txt`. Absolute URLs come from Vercel's production domain (`src/lib/site-url.ts`), so a custom domain is picked up without a code change. The reveal page is `noindex`.
- **Photos** — every photo (products, hero, sections) lives outside git: in `assets/` on a laptop (git-ignored) and in the Cloudflare R2 bucket `luminary-lusted` the site serves them from. The repository keeps `src/lib/image-manifest.json` — each photo's path, size and blur placeholder — and `img("images/hero/main/main-01.webp")` from `src/lib/cdn.ts` turns a path into what `next/image` needs. After adding or changing a photo: `node scripts/images.mjs manifest` (rewrites the manifest), then `CLOUDFLARE_API_TOKEN=… node scripts/images.mjs upload` (new and changed photos only) and `node scripts/images.mjs check`. On a fresh clone, `node scripts/images.mjs pull` fetches them all from the bucket. The bucket's public address is in `scripts/images.mjs` (`NEXT_PUBLIC_IMAGE_CDN` overrides it); `next.config.ts` allows that host for `next/image`.
- **Adding product photos** — put the shots in `refs/krea/products/` as `<slug>-front|back|side.png` and run `node scripts/import-krea-products.mjs`: it enhances them (Real-ESRGAN, when the binary is in `.tools/realesrgan/`), crops to 9:16, watermarks them into `assets/products/` and refreshes `product-images.ts`; then the manifest and upload steps above. Neither folder is in git.

## Performance

- **Image `sizes` are measured, not guessed.** Each photo's `sizes` says how wide it is actually drawn — for `object-fit: cover` photos in tall boxes that is wider than the box (the hero is ~1.9× the screen height below 16:9, the size-guide photo ~900px on desktop). Too small and it looks soft on retina; too big and it wastes data. After a layout change, re-measure before editing.
- **The 3D size tags build late.** `SizeTags3D.tsx` loads three.js and builds the scene only when the size guide is about a screen and a half away, in small steps, with shaders compiled in the background — on a phone that work used to block the page for seconds at load.
- **Nothing hidden competes with the first screen:** hero slides after the first load at low priority, search thumbnails only after search is first opened, and the filmstrip's looped copies carry no blur placeholder.

## Environment

- `NEWSLETTER_WEBHOOK_URL` — optional. Where the newsletter form posts sign-ups. Until it is set the form says sign-ups open soon.
- `OPENAI_API_KEY` — only for the image-generation scripts, never at runtime.

## Tests

End-to-end tests in `tests/` (Playwright, Chromium) cover every route and API response, the header, search, theme switch, mobile menu, every home-page section, the shop's tabs, search, sort, filters, pagination and quick add, product pages, the bag and favourites, accessibility (axe, keyboard, tap targets) and responsiveness at every viewport in `tests/fixtures.ts` — phones, foldables, tablets, laptops, desktops and every breakpoint at −1 / 0 / +1.

```bash
npm run test:build   # production build, then the whole suite (about 10 minutes)
npm test             # the suite against an existing `next start` on port 3177
npm run test:report  # open the last HTML report
```

## CI

`.github/workflows/ci.yml` runs on every push to `dev` or `main` and every pull request. Jobs, all side by side:

- **Branch rules** (pull requests only) — the branch is up to date with its base, and `main` only takes `dev`.
- **Lint and types** — eslint, then the generated route types and `tsc`.
- **Tests (1/6 … 6/6)** — a production build and the whole Playwright suite (every route, section and viewport), split
  across six machines, with the Next.js build cache and the browser download cached between runs.
- **Lighthouse (home, shop, product, about, help)** — mobile, three runs of the page, one machine per page. It fails if
  accessibility drops below 90, best practices or SEO below 95, layout shift goes over 0.05 or total blocking time over
  3,000 ms, and warns if performance drops below 45 — thresholds in `lighthouserc.json`. The speed numbers are relative to
  GitHub's runner, not to real phones: with two cores and no GPU it measures the home page at ~1,500 ms of blocking where
  a laptop measures ~25 ms, so the limits are set to catch a real regression there rather than to match the laptop's
  scores. The server is warmed before measuring, and blocking time and layout shift are judged by the best of the three
  runs, so a runner hiccup in one run doesn't fail the job.
- **Deploy** (pushes to `dev` or `main` only) — after every job above has passed; see "Deploy" below.

GitHub's two-core runners are several times slower than a laptop, so the suite runs two workers per machine, waits for
hydration before it interacts (`go()` in `tests/fixtures.ts`), runs the browser without WebGL (they have no GPU; Lighthouse
does the same) and leaves the screens over 4 million pixels (ultrawide, 4K, 5K) to local runs. The test and Lighthouse
reports are attached to each run. A push reaches the dev site in about seven minutes. On a private repository every job's
minutes count against the GitHub Actions minutes in your plan.

```bash
REVEAL_GATE=off npx next start -p 3200 &   # then, with the server up:
npx @lhci/cli@0.15.1 autorun               # the Lighthouse step locally, after npm run build
```

## Errors and missing pages

`src/app/not-found.tsx` (any unknown address or product, with a real 404 status) and `src/app/error.tsx` (anything that fails while a page renders — try again, or order on WhatsApp) share `components/StatusPage.tsx` and keep the site's nav and footer. `src/app/global-error.tsx` is the last resort when the layout itself fails: a self-contained page with its own few lines of CSS.

## Deploy

Hosted on Vercel as the `lusted` project. Two branches, two addresses, deployed by CI (`.github/workflows/ci.yml`):

- **`dev`** — integration. Every merged pull request that passes CI is deployed as a Vercel preview and
  **https://lusted-dev.vercel.app** is pointed at it. Vercel's Preview environment carries `REVEAL_GATE=off`, so the dev
  site shows the real pages. (Preview deployments ask for a Vercel login unless Deployment Protection is relaxed in the
  project settings.)
- **`main`** — production, **https://lusted.vercel.app**, which shows the "Revealing soon" page until reveal day. Only
  merges of `dev` reach it.

**The flow:** work on a branch → pull request into `dev` → merge → pull request `dev → main` → merge. Pull requests are
merged as merge commits (the repository allows no other method), must be up to date with their base, and must have every
check green; `main` takes pull requests from `dev` only. A direct push to either branch runs the checks but is never
deployed — the deploy job looks for the merge commit.

CI needs three repository secrets (Settings → Secrets and variables → Actions): `VERCEL_TOKEN` (vercel.com → Account →
Tokens; a token scoped to the team is fine), `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (both in `.vercel/project.json`
after `vercel link`).

GitHub's own rulesets aren't available to this private repository on the organisation's free plan, so the rules above
are enforced by the workflow (red checks, no deploy) rather than blocked by GitHub. The rulesets GitHub should enforce
are kept ready in `.github/rulesets/` (see its README); when the plan allows them, `scripts/apply-rulesets.sh` turns
them on. To deploy by hand from a laptop:

```bash
vercel deploy --prod   # production
vercel                 # a preview; then: vercel alias set <its url> lusted-dev.vercel.app
```
