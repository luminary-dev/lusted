# Lusted

The website for **Lusted** — lingerie, swim and after-dark pieces from a Sri Lankan boutique that takes its orders on WhatsApp.

Live at **https://lusted.vercel.app**.

## What it is

A Next.js 16 site: a single scrolling home page (hero slideshow, bikini sale, the three collections, best sellers, how ordering works, size guide, about, contact), a shop with search and filters, a page per product, favourites, an about page, and the privacy policy and terms. There is no checkout — the bag and favourites live in the visitor's browser, and "Send order on WhatsApp" turns the bag into one message to the shop.

## Run it

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
npm run lint
```

## Where things live

- **Products** — `src/lib/catalog.json`: name, price (LKR), sale price, sizes, colours, best-seller rank (1–6), date added, description. Photos are `src/assets/products/<slug>.webp` with optional `-back` and `-side` views.
- **Contact details** — `src/lib/site.ts`: WhatsApp number, Instagram, email, hours. Every button and link reads from here.
- **Collection names and taglines** — `categories` in `src/lib/products.ts`.
- **Colours, type and spacing** — CSS variables at the top of `src/app/globals.css`; dark mode is the `[data-theme="dark"]` block.
- **Brand assets** — `brand/` (logo pack, icons, social images).
- **Link previews and search engines** — `src/app/opengraph-image.png` is the brand card every shared link shows (product pages share their own front photo instead); `src/app/sitemap.ts` and `src/app/robots.ts` build `/sitemap.xml` and `/robots.txt`. Absolute URLs come from Vercel's production domain (`src/lib/site-url.ts`), so a custom domain is picked up without a code change. The reveal page is `noindex`.
- **Adding product photos** — put the shots in `refs/krea/products/` as `<slug>-front|back|side.png` and run `node scripts/import-krea-products.mjs`: it enhances them (Real-ESRGAN, when the binary is in `.tools/realesrgan/`), crops to 9:16, watermarks them and refreshes the image map. Neither folder is in git.

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

## Deploy

Hosted on Vercel as the `lusted` project.

```bash
vercel deploy --prod
```
