# Lusted

Website for **Lusted** — lingerie, swim and after dark. A single-page Next.js 16 site built to match the design mockups in `refs/` (1.webp – 8.webp).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

**On your phone:** the dev server listens on every network interface, so a phone on the same network can open `http://<laptop-ip>:<port>` (e.g. `http://172.20.10.3:4050` when the laptop is on the phone's iPhone hotspot — find the IP with `ipconfig getifaddr en0`). Next.js only serves dev assets to origins listed in `allowedDevOrigins` in `next.config.ts`, so add the laptop's IP there if it changes. If the page won't load, allow incoming connections for `node` in macOS System Settings → Network → Firewall.

## What's on the page

**Home (`/`)**

| Section | Component | Notes |
| --- | --- | --- |
| Nav | `Nav.tsx` | Logo, links, a WhatsApp “Message us” button (icon-only on mid widths, inside the menu on small phones), and header icons: search (`SearchDialog.tsx`, also ⌘K or `/`), favourites, bag, light/dark switch (`ThemeToggle.tsx`). On small phones the theme switch moves into the menu |
| Hero | `Hero.tsx`, `HeroSlides.tsx` | Full-screen slideshow of 10 campaign images, changing every 8 s with a slow iris bloom: the new photo opens from the model outwards through a soft-edged circle, emerging from a warm haze into focus, while the old one melts into soft focus (no visible controls, pauses when the tab is hidden, no autoplay with reduced motion), with “Explore the collection” + “Whisper to us” (WhatsApp), and a “Tonight's temptation” card featuring one product — currently the Lola Fringe Micro Dress — with its photo, name, a tagline and a link to its page (set `featured.product` to any slug in `src/lib/site.ts`) |
| Sale | `SaleSection.tsx`, `SaleCard.tsx` | “The Bikini Sale”: the standard section header (“Barely there. Now N% off.”, computed from the catalogue — every bikini is exactly 20% off) and the 4 reduced bikinis as landscape cards in a 2 × 2 grid — the photo on the right melting into a band tinted to each piece (a soft `mask-image` fade, no tint over the model) with the discount, the name in script, a one-line `blurb` from the catalogue, prices and a frosted “Shop now” button. On hover the card tilts towards the pointer in 3D, a soft sheen follows it and the back view opens as a circle spreading from where the pointer came in (no tilt with reduced motion; one card per row on phones) |
| Collections | `Collections.tsx` | Three full-photo cards — Lace Secrets (Lingerie), Sun Kissed (Swim), Midnight Sins (After Dark) → open the shop filtered by category. Collection names and taglines live in `categories` in `src/lib/products.ts`; the names are what shoppers see everywhere — product pages, shop tabs, search and footer (the plain “Swim” etc. stays searchable and in the URLs) |
| Best sellers | `BestSellers.tsx` | The 6 products with a `bestSeller` rank in `catalog.json` |
| How it works | `HowItWorks.tsx` | Full-width 16:9 campaign photo of three models (one per collection) with “From desire to your door” and three ordering steps over the sea on the right (`#ordering`, linked as “Ordering” in the nav). Photo: `src/assets/images/how-it-works.webp`, from `refs/krea/final/hero/src-21.png` |
| Size guide | `SizeGuide.tsx`, `SizeTags3D.tsx` | Sits between Best sellers and About. “Fitted to every curve”: the measuring-tape ribbon is the section's top edge; a full-bleed photo (under the tape, to the screen's left edge and the bottom border); the size chart as **photo-real 3D swing tags** (three.js, loaded only in the browser) — each card bent (bow, bottom curl, twist) with real thickness, hanging on its own string length at a slight resting angle (small enough that every tag reads), seen slightly from the side through a 34° lens, paper-fibre texture and debossed ink, laminated wine backs with gold foil, gold eyelets, satin strings looped onto a cord that runs from a gold end cap at the photo to the screen edge; lit by a softbox with **contact-hardening soft shadows (PCSS)** patched into three.js's basic shadow map (lighter in light mode, stronger in dark, following the theme switch); calm, well-damped spring physics (a light breeze, a nudge when brushed, a soft capped sway on scroll so they never wind up and spin, tap/click to turn over) and pointer parallax; the HTML fallback tags sway gently (±6°); plus “Where the tape goes” (`TapeGuide.tsx`): a couturier's dress form in line art with a measuring tape wrapped round it at the underbust, bust, waist and hips — pointing at / tapping a step draws its tape round the form; left alone it cycles through them (not with reduced motion). Phones swipe along the cord. The HTML tags stay for screen readers and as the no-WebGL fallback |
| About | `About.tsx` | “Made for confidence, designed with care.” — the lace still-life photo, a short brand story, “Read our story” and the three promises (discreet packaging, private ordering, fabrics & craftsmanship) |
| Service, Contact | `Ordering.tsx` (“Here for you, every step” — packaging and perks), `Contact.tsx` | Contact: “Tell us what you desire” — WhatsApp and email links, a WhatsApp QR code (generated at build time with `qrcode`, hidden on phones) with a “Go on, scan me.” tease beside it and a list of channels |
| Footer | `Footer.tsx`, `Newsletter.tsx` | Compact: logo, newsletter, links (shop links use the collection names), social icons |

**Shop (`/products`)** — `components/shop/ProductBrowser.tsx`: search, collection tabs (Lace Secrets / Sun Kissed / Midnight Sins), filters (on sale / new / best sellers, size, colour, price), sort, active-filter chips. All filters live in the URL (e.g. `/products?cat=swim&size=M&sale=1`) so filtered views can be shared. Results show 15 per page (`PER_PAGE` in `ProductBrowser.tsx`) with numbered pages under the grid; the page is in the URL too (`?page=2`) and any filter, search or sort change goes back to page 1. On mobile the filters open as a bottom sheet. Product cards (`components/shop/ProductCard.tsx`) show the back view on hover, plus a quick add: the lower half of the photo melts into a frosted blur with the name, a frosted price pill, the sizes and a solid "Add to bag" button — pick a size, then add (mouse only; on touch screens a tap opens the product). Clicking anywhere else on the photo or the panel opens the product page; only the size pills and the button are clickable.

**Product page (`/products/[slug]`)** — `components/shop/PdpGallery.tsx`: the front photo large with the back and side views as small thumbnails underneath (choosing one cross-fades it into the main frame). Beside it: collection name, price/sale price, the description (which carries the piece's details and care), a script "Made for…" line, colour + size pickers with a one-line fit note (a three-step runs small / true to size / runs large meter), quantity, add to bag, "Order now on WhatsApp" and related pieces ("If the … tempted you"). Every photographed product's page is prerendered (products without a photo yet are hidden).

**About (`/about`), Privacy policy (`/privacy`), Terms & conditions (`/terms`)** — standalone pages linked from the menu and footer. The privacy policy and terms are **templates** written for a Sri Lankan online boutique that takes orders on WhatsApp (they reference the Personal Data Protection Act, No. 9 of 2022, LKR pricing, discreet delivery and a 7-day hygiene-safe exchange policy). Have them reviewed against how you actually operate before launch.

**Favourites (`/favourites`)** — `lib/favourites.ts`: the heart on every product card and product page saves the piece on this device; the header heart shows the count and opens the list, with a one-tap "Ask about these on WhatsApp".

**Search** — the header search opens a quick-search dialog with live results; Enter or "See all results" opens the shop filtered by that search.

**Bag** — `lib/bag.ts` + `components/shop/BagDrawer.tsx`: kept in the browser (`localStorage`); "Send order on WhatsApp" sends the full order (items, sizes, colours, quantities, subtotal) as one message. Payment and delivery are confirmed on WhatsApp.

Sections fade in on scroll using pure-CSS scroll-driven animations (no JavaScript); browsers without support simply show the content, and reduced-motion settings are respected.

## Products

The catalogue is **`src/lib/catalog.json`** — 31 placeholder products (names, prices in Sri Lankan rupees — LKR, sale prices, sizes, colours, best-seller ranks, descriptions). Replace it with your real range:

- `salePrice` puts a product in the sale section and the "On sale" filter.
- `bestSeller` (1–6) puts it in Best sellers, in that order.
- The 6 most recently `added` products get the "New" badge.
- Single-colour pieces hide the colour swatches and picker. Colours: blush, wine, black, ivory, champagne, mocha (`colors` in `src/lib/products.ts`; the sale card tint per colour is `TINT` in `SaleSection.tsx`).
- `description` is the product page copy and includes every feature and the care note; `details` lists the same points for search.
- `fit` (-1 runs small · 0 true to size · 1 runs large) and `fitNote` drive the fit line under the size picker; `moments` (three, lower-case) make the "Made for…" line.
- `shot` describes the product photo for `scripts/generate-products.mjs`.
- Extra views: `src/assets/products/<slug>-back|side.webp`, then `node scripts/sync-product-images.mjs`.
- **Model photography.** Products are being re-shot as Krea 2 model photography in three views — front, back and side — each with its own design, one of six models and a set for its category:
  - the four sale bikinis (Pearl Seduction, Scarlet Sin, Noir Temptress, Golden Goddess): `scripts/krea-space-bikini.py <1-4>` (1152 × 2048, `refs/krea/bikini/`);
  - everything else: `scripts/krea-space-products.py [slug …]` (864 × 1536, `refs/krea/products/`). It skips views that already exist and stops cleanly when the Space's daily ZeroGPU quota runs out — just re-run it after the reset. Over-quota generation runs on prepaid ZeroGPU credits only through the Space's web UI (the API refuses), so the same prompts can also be pasted into the UI — same seed, 12 steps, the custom `Comfy-Org/Krea-2` turbo fp8 base — and the downloaded PNG saved as `<slug>-<view>.png`.
  - Prompt lessons: describe the garment plainly (a "web of straps" or "barely-there" pushes the model to put her in a dress from behind); lingerie and swim prompts add "nothing over it"; when a shot comes out in a different colour, the catalogue colour follows the photo (that's how Mocha joined the palette).
  - All 31 products are photographed.
  - Then `node scripts/import-krea-products.mjs` finishes the new shots into `src/assets/products/` — enhanced 2× with Real-ESRGAN (binary in the git-ignored `.tools/realesrgan/`; download the macOS release from github.com/xinntao/Real-ESRGAN) and watermarked with the Lusted wordmark bottom right, the same gap from the right and bottom edges — and re-syncs `product-images.ts`. `--all` re-finishes everything. The PNG originals live in the git-ignored `refs/`. A product switches to its model shots as soon as its front exists; cards show the back on hover, the product page shows every view.

After adding or renaming products, generate the missing photos (this also updates `src/lib/product-images.ts`):

```bash
node --env-file=.env.local scripts/generate-products.mjs   # pass slugs to redo specific photos
```

> The size charts in `SizeGuide.tsx` (Bras & tops, Bodysuits & dresses, Bottoms) use standard conversions — bra bands from the underbust, cups from the bust − underbust difference, and UK/AU 6–14 ↔ EU 34–42 ↔ US 2–10 dress sizes. Check them against your makers' own charts before launch.

## Edit your details

Prices are formatted as `LKR 6,900` by `formatPrice` in `src/lib/products.ts`; the shop's price filters are the `priceBuckets` in the same file (under 5,000 · 5,000–7,000 · 7,000–10,000 · 10,000+). Prices are set for a Sri Lankan boutique: lingerie LKR 2,900–7,900, swim 4,900–7,500, after-dark 8,500–12,900; sale pieces are exactly 20% off.


All contact details (WhatsApp number, Instagram, email, hours) live in **`src/lib/site.ts`** — every button and link on the site reads from there. Email (support@lusted.lk), Instagram (@lusted.lk) and hours are real; the WhatsApp number is still the placeholder from the mockups.

## Newsletter

`POST /api/subscribe` forwards the email to a webhook. Set `NEWSLETTER_WEBHOOK_URL` (e.g. a Klaviyo, Mailchimp or Zapier webhook) in `.env.local` or your hosting env. Until it's set, the form tells visitors sign-ups open soon.

## Light & dark mode

The switch in the nav flips `<html data-theme>` and remembers the choice in `localStorage`. First-time visitors get their system setting. An inline script in `layout.tsx` applies the theme before paint, so there's no flash. Dark-theme colours are the `:root[data-theme="dark"]` block in `globals.css`.

## Logo pack

`brand/lusted-logo-pack.zip` (and the unzipped `brand/logo-pack/`) — wordmark, monogram and seal in a wine colourway for light backgrounds and a champagne colourway for dark backgrounds, plus app icons, favicon and social profile images. See `brand/logo-pack/README.txt`.

Recreated from the brand sheet (`refs/9.webp`) with `gpt-image-2.5-sunburst`:

```bash
node --env-file=.env.local scripts/generate-logos.mjs   # → brand/source/*.png
node scripts/build-logo-pack.mjs                        # → pack, zip, site logos, favicons
```

## Design

- Icons: [lucide-react](https://lucide.dev) — the icon set used by shadcn/ui — wrapped in `src/components/icons.tsx`. Lucide ships no brand logos, so the WhatsApp and Instagram logos come from [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react`, another icon library shadcn/ui supports) — same 24px outline style, no custom SVGs.
- Home sections alternate paper / cream / blush backgrounds; the colour change is the break (no divider lines).

- Fonts: **Petit Formal Script** (headlines — formal copperplate, fancy but easy to read) and **Montserrat** (everything else), via `next/font/google`. To try another headline font, change `--headline` in `globals.css`: `var(--fraunces)` = Fraunces, `var(--serif)` = Playfair Display (closest free match to the logo), `var(--script)` = Corinthia — the matching sizes are noted next to `.h1`/`.h2`.
- Palette, spacing and type scale are CSS variables at the top of `src/app/globals.css`; content sits in a 1320px container with fluid (`clamp`) type and section spacing.

## Images

All images are in `src/assets/images/` and were generated with OpenAI `gpt-image-2.5-sunburst` (`scripts/generate-images.mjs`), except the hero slideshow.

- OpenAI's moderation rejects shots of a model in lingerie or swimwear (and even several robe / dress variants), so the About page's lingerie shot is a product still life and the old size-guide shot showed the model in silk loungewear (now replaced by a Krea image — `refs/krea/final/vertical/src-22.png`). Model photography (hero, collection cards, How it works) comes from Krea 2 instead.
- The **hero slideshow** (`src/assets/images/hero/hero-1…10.webp`) and the **collection cards** (`src/assets/images/cat-lingerie|swim|after-dark.webp`) are Krea 2 campaign images generated on the `dhanikaa/Krea-2-Turbo_v2` Space (prompts in `scripts/krea-space-hero.py`). Originals: `refs/krea/final/hero` (2048×1152) and `refs/krea/final/vertical` (1152×2048). Each hero slide's crop focal point (desktop + phone) is set in `Hero.tsx`; the cards crop to 3:5 from near the top. These photos are AI-upscaled 2× (to 4096 px) with [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (`realesrgan-x4plus`) and blended 75/25 with a plain enlargement for natural skin — see `scripts/enhance-images.mjs`.

To regenerate:

```bash
# needs OPENAI_API_KEY in .env.local (gitignored)
node --env-file=.env.local scripts/generate-images.mjs [job ...]
python3 scripts/krea-hero.py <1-5> refs/krea/hero-N.png Krea-2-Raw 2048 1152   # hero images (HF ZeroGPU quota)
```
