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
- **Adding product photos** — put the shots in `refs/krea/products/` as `<slug>-front|back|side.png` and run `node scripts/import-krea-products.mjs`: it enhances them (Real-ESRGAN, when the binary is in `.tools/realesrgan/`), crops to 9:16, watermarks them and refreshes the image map. Neither folder is in git.

## Environment

- `NEWSLETTER_WEBHOOK_URL` — optional. Where the newsletter form posts sign-ups. Until it is set the form says sign-ups open soon.
- `OPENAI_API_KEY` — only for the image-generation scripts, never at runtime.

## Deploy

Hosted on Vercel as the `lusted` project.

```bash
vercel deploy --prod
```
