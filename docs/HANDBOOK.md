# Lusted — the handbook


Everything about how the site is built, tested, deployed and run. The short version is the [README](../README.md).
The website for **Lusted** — lingerie, swim and after-dark pieces from a Sri Lankan boutique that takes its orders on WhatsApp.

Live at **https://lusted.lk** (www.lusted.lk and lusted.vercel.app redirect or alias to it).

## What it is

A Next.js 16 site: a single scrolling home page (hero slideshow, the sale, the three collections, best sellers, new in, how ordering works, size guide, about, contact), a shop with search and filters, a page per product, favourites, an about page, a delivery, returns & FAQ page (`/help`), and the privacy policy and terms. There is no checkout — the bag and favourites live in the visitor's browser, and "Send order on WhatsApp" turns the bag into one message to the shop: a short order reference (LST- and five letters or digits, random, nothing about the shopper) on top, each piece with its link, the subtotal, a gift line if "This is a gift — lucky them" is ticked (with the optional note), and blank "Name:" and "City / town:" lines for the shopper to fill in, so the shop can quote delivery from the first message (`src/lib/order.ts`). A product page's "Order now on WhatsApp" sends the same link and blank lines for its one piece.

## Run it

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
npm run lint
```

## Where things live

- **Products** — `src/lib/catalog.json`: name, price (LKR), sale price, sizes, colours, best-seller rank (1–6), date added (the six most recently added photographed pieces are "New": they wear the badge, make up the shop's "New in" filter and fill the home page's "Just arrived" row, newest first — `isNew` and `newArrivals` in `src/lib/products.ts`; the row hides itself below three), description, and `pairsWith` — the slugs of the pieces made to be worn with it (the Rosé bra and brief), shown as "Complete the set" on its product page and left out of the related row below. Keep pairings symmetric (list each piece on the other); removing a piece from the console drops it from the others' `pairsWith`, and a slug that isn't a photographed piece is skipped. Photos are `assets/products/<slug>.webp` with optional `-back` and `-side` views and up to three more, `-4`, `-5` and `-6`, which the product page shows after them as "Photo 4" and on (see "Photos"; a photo the console put in the bucket has a short revision in its name, see "The owner console"). A slug that is another's plus one of those endings (`rose` and `rose-4`), or that holds `--` (the colour separator), would make the names read two ways: `sync-product-images.mjs` stops on it and the fitting refuses such a name.
- **Contact details** — `src/lib/site.ts`: WhatsApp number, Instagram, email, hours. Every button and link reads from here.
- **Collection names and taglines** — `categories` in `src/lib/products.ts`.
- **Search** — `matchesQuery` in `src/lib/products.ts`, for the search dialog and the shop: every word must start a word of the piece (case and accents ignored, plurals folded), and `searchSynonyms` beside it turns shoppers' words ("panties", "white", "swimwear") into the catalogue's — add one there when shoppers search for something the catalogue calls by another name.
- **Colours, type and spacing** — CSS variables at the top of `src/app/globals.css`; dark mode is the `[data-theme="dark"]` block.
- **Brand assets** — `brand/` (logo pack, icons, social images).
- **Link previews and search engines** — `src/app/opengraph-image.png` is the brand card every shared link shows (product pages share their own front photo instead); `src/app/sitemap.ts` and `src/app/robots.ts` build `/sitemap.xml` and `/robots.txt`. Absolute URLs come from Vercel's production domain (`src/lib/site-url.ts`), so a custom domain is picked up without a code change. Every indexable page names its canonical address (`alternates.canonical` in its metadata); the reveal page and `/favourites` (each visitor's own list) are `noindex`. Titles that shoppers search for carry the place — `Lusted Sri Lanka — …` on the home page, `<piece> — Lusted Sri Lanka` and `Shop all — Lusted Sri Lanka`. Search engines also get structured data (schema.org JSON-LD, a `<script>` tag through `src/components/JsonLd.tsx`): each product page describes the piece as a `Product` — its photos, and an `Offer` at the price shown (the sale price while there is one) in LKR — plus the `BreadcrumbList` the page shows; the home page describes the shop as an `OnlineStore` with its logo (`/icon.png`), Instagram and a customer-service contact read from `src/lib/site.ts`; and `/help` is an `FAQPage` built from the same questions and answers it renders. Check a page with Google's [Rich Results Test](https://search.google.com/test/rich-results) after changing any of it.
- **Photos** — every photo (products, hero, sections) lives outside git: in `assets/` on a laptop (git-ignored) and in the private Cloudflare R2 bucket `luminary-lusted`. The site serves them from its own origin, `/img/v<IMAGE_VERSION>/<path>` (`src/app/img/[...path]/route.ts` reads the bucket with a signed request and answers with a year-long immutable cache header, so Vercel's edge serves repeats), and `next/image` optimises them from there. The repository keeps `src/lib/image-manifest.json` — each photo's path, size and blur placeholder — and `img("images/hero/main/main-01.webp")` from `src/lib/cdn.ts` turns a path into what `next/image` needs; a path not in the manifest is never fetched. The bucket's keys are the four `R2_*` variables (`.env.local` locally; the Vercel project and the repository's Actions secrets hold the same). After adding or changing a photo: `node scripts/images.mjs manifest`, then `node scripts/images.mjs upload` (new and changed photos only) and `node scripts/images.mjs check`. On a fresh clone, `node scripts/images.mjs pull` fetches them all. Setting `NEXT_PUBLIC_IMAGE_CDN` to a public address serves them from there instead.
- **The wordmark on every photo** — every photo under `assets/images/` carries the same mark the product photos do (white wordmark, bottom right, soft shadow). `node scripts/watermark-images.mjs` puts it on any photo that doesn’t have it yet, keeps the unmarked original outside the repo (`../images/unmarked/`) and remembers what it has done in `assets/.watermarked.json`; transparent cut-outs (the FAQ models) are left alone. Run it after new photos land, before the manifest and upload steps. Because photos are served immutable for a year, a change to the photos under the same paths needs `IMAGE_VERSION` in `src/lib/cdn.ts` bumped — it’s a path segment, so every address changes and every cache refetches. Only the current version is served: the `/img` route answers 404 for any other, and `next/image` optimises only `/img/v<IMAGE_VERSION>/…` with no query string (`images.localPatterns` in `next.config.ts`, which reads the same constant), so made-up versions can’t each cost a function run, a bucket read and a billed transformation.
- **Adding product photos** — put the shots in `refs/krea/products/` as `<slug>-front|back|side.png` and run `node scripts/import-krea-products.mjs`: it enhances them (Real-ESRGAN, when the binary is in `.tools/realesrgan/`), crops to 9:16, watermarks them into `assets/products/` and refreshes `product-images.ts`; then the manifest and upload steps above. Neither folder is in git.

## Voice

The site talks like the shop: shamelessly naughty — teasing, hungry, full of innuendo and double meanings, written to a
grown woman who is in charge of her own pleasure, with short lines and a script-font line that lands the joke. Each
section has its own joke; buttons still say plainly what they do, and the words around them do the flirting. The rules
hold everywhere, including the console's AI copywriter (`src/lib/admin/copy.ts`, which also strips any emoji it is
sent back) and the scripts' console output (plain "done" and "warning:"):

- **No emojis, anywhere.** Typographic marks are fine (em dashes, arrows, ⌘K).
- Nothing that suggests youth ("girl", "teen", "young", "little", "innocent" in that sense, "daddy"), nothing
  coercive, nothing graphic — heat and innuendo, not explicit description — and nothing degrading or about bodies
  needing fixing.
- **Stays plain:** the privacy policy and terms, prices, sizes, the size guide's measurements and how to measure,
  fabric and care facts, delivery, returns and exchange facts (the FAQ answers keep every fact exact; only the voice
  plays), accessibility text (alt text, aria labels), the WhatsApp messages a shopper sends the shop, and the owner
  console's own interface. Errors and validation say clearly what went wrong and what to do — a flirty first line at most.
- **Sensual, never explicit:** page titles, meta descriptions and link previews, which strangers and search engines see.

## Performance

- **Image `sizes` are measured, not guessed.** Each photo's `sizes` says how wide it is actually drawn — for `object-fit: cover` photos in tall boxes that is wider than the box (the hero is ~1.9× the screen height below 16:9, the size-guide photo ~900px on desktop). Too small and it looks soft on retina; too big and it wastes data. After a layout change, re-measure before editing.
- **The 3D size tags build late.** `SizeTags3D.tsx` loads three.js and builds the scene only when the size guide is about a screen and a half away, in small steps, with shaders compiled in the background — on a phone that work used to block the page for seconds at load.
- **The loading screen only greets a visit that begins on the home page**, once per tab. A visit that lands anywhere else — a product link opened from Instagram or WhatsApp, whose in-app browsers start a fresh session every time — goes straight to the page, and doesn't meet the curtain on the home page later either. The inline script in `src/app/layout.tsx` decides before first paint, so it never flashes.
- **Nothing hidden competes with the first screen:** hero slides after the first load at low priority, search thumbnails only after search is first opened, and the filmstrip's looped copies carry no blur placeholder.

## Environment

- `NEWSLETTER_WEBHOOK_URL` — optional. Where the newsletter form posts sign-ups (`src/app/api/subscribe/route.ts`). Until it is set the route answers 501, nothing is stored, and the form says sign-ups open soon. The route only takes sign-ups from the site's own pages: a browser request from anywhere else gets 403, so no other site can sign people up. Under each form a short line says what subscribers get, that they can unsubscribe any time, and links to `/privacy` — the consent the Personal Data Protection Act asks for. Double opt-in (a confirmation email before an address is added) is up to the provider behind the webhook.
- `OPENAI_API_KEY` — only for the image-generation scripts, never at runtime.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`, `ANTHROPIC_API_KEY` — the owner console, see below.

## Tests

End-to-end tests in `tests/` (Playwright, Chromium) cover every route and API response, the header, search, theme switch, mobile menu, every home-page section (and, in Node, the sale band's wording for every kind of sale), the shop's tabs, search, sort, filters, pagination and quick add, product pages, the bag and favourites, accessibility (axe, keyboard, tap targets) and responsiveness at every viewport in `tests/fixtures.ts` — phones, foldables, tablets, laptops, desktops and every breakpoint at −1 / 0 / +1.

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
reports are attached to each run. A push reaches the dev site in about seven minutes. The repository is public, so
GitHub's standard runners cost nothing against the plan's Actions minutes.

```bash
REVEAL_GATE=off npx next start -p 3200 &   # then, with the server up:
npx @lhci/cli@0.15.1 autorun               # the Lighthouse step locally, after npm run build
```

## Monitoring

**Uptime** (`.github/workflows/uptime.yml`) checks the live site every fifteen minutes (at 7, 22, 37 and 52 past the
hour, and on demand from the Actions tab): `https://lusted.lk/` answers (the "Revealing soon" page counts), `www.lusted.lk`
is a 308 redirect to it, one photo from the manifest answers as an image at the address the site gives it (the
`IMAGE_VERSION` and the path are read from `src/lib` on every run, so a version bump doesn't break it), and the
certificate is for `lusted.lk` and has more than 14 days left. A request that fails is tried again after 20 seconds
before it counts. A failure shows as a red run in the Actions tab, with an error naming the check and what it got, and
GitHub emails it to whoever added or last changed the schedule (Settings → Notifications → Actions, email on). Each run's
summary lists the four results. The address is `SITE_HOST` at the top of the file. Scheduled runs only use the copy on
`main` and are free on a public repository; to silence it, Actions → Uptime → ⋯ → Disable workflow.

## Security

The repository is public, so GitHub's protections are all on: secret scanning with push protection (a commit carrying a
known secret format is rejected at push), the dependency graph with Dependabot alerts and security updates, private
vulnerability reporting (`SECURITY.md` and `/.well-known/security.txt` say how to report), and rulesets on `dev` and
`main` (`.github/rulesets/`). Five workflows watch the code: **CodeQL** (`codeql.yml`, every push and pull request and
weekly, TypeScript and the workflows themselves — a merge may not add a high-severity finding), **Dependency review**
(`dependency-review.yml`, a pull request adding a vulnerable or badly licensed package goes red), **Workflows**
(`workflows.yml`: actionlint for mistakes in the workflow files, zizmor for their security, gitleaks for secrets in the
commits), **Scorecard** (`scorecard.yml`, OpenSSF's weekly supply-chain score, under Security → Code scanning) and the
CI itself. `dependabot.yml` opens weekly pull requests into `dev` for npm packages and for the actions, which are
pinned to commits, after a week's cooldown on new versions. Workflows get a read-only token by default and widen it
per job; `CODEOWNERS` routes every review to the owner.

The site sends security headers on every response (`next.config.ts`): a content security policy that allows only the
site itself (inline scripts and styles are allowed because Next's hydration scripts and the theme script in
`layout.tsx` are inline), no framing, `nosniff`, a strict referrer policy, a permissions policy that switches off
camera, microphone, location and payment, and cross-origin isolation headers. HSTS comes from Vercel. The source is
published to be read, not reused — see `LICENSE`.

## The owner console

**/admin** — unlinked, kept out of search, never cached — is where the owner runs the catalogue without opening the
repository, in four rooms on four pages (`/admin/fitting`, `/admin/offers`, `/admin/ledger`, `/admin/daybook`, each
under the same header): add a piece, change a name, collection, price, offer price or best-seller rank, change a piece's
photos, remove a piece, or put a percentage off a whole collection (the home page's sale band then names that collection and links to its sale pieces —
`src/lib/sale-band.ts` holds its words). It is modelled on the Luvana console, with two differences: the photos are the
owner's own (front, back and side — nothing is generated or retouched; each is cropped to the catalogue's 9:16 frame
and given the wordmark, `scripts/lib/wordmark.mjs`), and the words are Claude's to start with. "Write it with AI"
sends the front photo and the brief (collection, price, colours, fit, notes) to Claude, which writes the name, the
description, the one-line blurb, the details, the fit note and the three moments in the catalogue's voice, next to
three pieces from the same collection; the owner reads, changes and approves before anything is added.

Nothing in the console touches the repository directly. The browser puts the photos straight into the bucket on
signed addresses (`src/lib/admin/r2.ts`, under `incoming/`), then every change fires a `repository_dispatch`
(`src/lib/admin/github.ts`) that the **Console** workflow (`.github/workflows/console.yml`) picks up: it applies the
change on a branch off `dev` (`scripts/admin/add-product.mjs` finishes the photos, puts them in the bucket, updates
the manifest, the catalogue and `product-images.ts`; `scripts/admin/apply-update.mjs` makes the smaller changes — a
removal takes the piece's photos out of the manifest but leaves them in the bucket, which the live site reads too, so
it is never left with broken images while it still lists the piece before the next release; unlisted photos can be
cleared from the bucket by hand later), commits it as `admin: <what changed>`, opens a pull request into `dev` and merges
it once the checks are green — ten minutes or so, after which CI deploys the dev site. A console change takes the same
road as every other change. Saving a row in the ledger sends only the fields changed in it, so a change still on its
way — a percentage off its collection, say — isn't undone by the older values the row was showing. A change the
workflow would refuse opens no pull request, so the console would wait on it for ever: an offer price at or above the
full price, of nothing or of part of a rupee, or a percentage off outside whole numbers 1–90, is said beside the field
and can't be saved, and the dispatch route refuses it with a 400 before anything is queued (both read
`src/lib/admin/offers.ts`; the workflow keeps its own check as the last line of defence). The console reads the catalogue (and which product photos the manifest lists) off the `dev` branch, watches its pull requests and
says "done" the moment a change lands; `console-refresh.yml` keeps a queued console pull request up to date when
another merges first. Live changes still go out by the usual release (`dev → main`). The tests read the catalogue
facts they check from `catalog.json` itself (`tests/fixtures.ts`), so a piece added or changed from the console
doesn't fail them — the home page's hero piece, `rose-lace-balconette-bra`, is the one piece the suite and Lighthouse
name directly, so it shouldn't be removed from the console.

**A piece's photos.** "Photos" on a ledger row opens the piece's photos under it, as thumbnails: front, back, side and
three optional extras for the piece itself and for each of its other colours. Any of them can be replaced, an empty one
filled, and any but the piece's own front taken off — a piece always keeps a front photo, so that one can only be
replaced. The extras show on the product page after side, in their slots' order, for the colour picked; taking off
extra 1 while extra 2 stays just closes the gap there — nothing is renamed in the bucket. A colour's other photos show
only with its front (`sync-product-images.mjs`), so they need it, and taking off a colour's front takes them too. "Another colour…" photographs the piece in a colour it doesn't list yet: the colour's front photo adds it to
the end of the piece's colours, so shoppers can pick it — the choice was between that and refusing, and refusing
would leave the owner no way to do it, since the ledger can't change a piece's colours. The changes on a piece are
gathered and saved as one (the `product-photo` dispatch, applied by `apply-update.mjs`), so its photos are never in two
pull requests at once — both would rewrite the same lines of the manifest and the second would conflict; the row
says "on its way" until the change is on `dev`. New photos are finished exactly as the fitting's are (`finishPhoto` in
`scripts/admin/lib.mjs`, shared with `add-product.mjs`: cropped to 9:16, the wordmark). The console says what's wrong
beside Save, and the dispatch route refuses a change the workflow would refuse with a 400 before it's queued (both read
`src/lib/admin/photos.ts`; the script keeps its own check).

**Why a new photo gets a new name.** The live site reads the same bucket as dev and serves every photo immutable for
a year, so a photo written over an old key would change the live site before a release — and, behind those caches,
not even everywhere at once. So the console never writes over a key: every photo it puts in the bucket, a new piece's
from the fitting too, is `products/<base>.<rev>.webp`, where `<base>` is the usual `<slug>[--<colour>][-back|-side|-4|-5|-6]`
and `<rev>` eight hex characters of the upload it came from (`scripts/lib/photo-keys.mjs`; `src/lib/admin/photos.ts` for
the console and the tests). Replacing a photo puts the new key in the manifest and takes the old one out; the old file
stays in the bucket — as a removed piece's do — so the live site keeps showing it until the next release, which then
shows the new one at its own address, with no `IMAGE_VERSION` bump. `sync-product-images.mjs` reads either name (the
plain one wins if both are listed), so photos added on a laptop keep their plain names. Unlisted photos can be cleared
from the bucket by hand later.

The sign-in page shows one of the photos under `assets/images/admin/back-room-*.webp`, a different one each time the
door is opened (the prompts are in `about-wall/admin-login-prompt.txt`, outside the repo; drop a new one in, watermark
it, then `images.mjs manifest` and `upload`); with none it draws a curtain. The console needs, on Vercel (Production and Preview): `ADMIN_EMAIL`; `ADMIN_PASSWORD_HASH` — `<N>:<r>:<p>:<salt-hex>:<scrypt-hex>`, the scrypt cost and the hash (the older
`<salt-hex>:<scrypt-hex>` still works and means N=16384; re-running the one-liner below is all it takes to move
to OWASP's N=131072 — set the variable, no deploy),
made with the one-liner below; `ADMIN_SESSION_SECRET` — any long random string; `GITHUB_ADMIN_TOKEN` — a fine-grained
token for this repository with Contents read/write and Pull requests read (it fires the dispatches and reads `dev`);
`ANTHROPIC_API_KEY` — for the copy; and the four `R2_*` keys it already has. The repository needs one more Actions
secret, `CONSOLE_TOKEN` — a fine-grained token with Contents and Pull requests read/write, used by the workflow to push
the branch and open and merge the pull request (the workflow's own token could push, but nothing it pushes runs CI).
The bucket must allow the browser's uploads: `node --env-file=.env.local scripts/admin/bucket-cors.mjs` sets its
CORS rules for the site's addresses (lusted.lk, dev.lusted.lk, the two vercel.app addresses and localhost; run it again
whenever one is added) — through Cloudflare's API with `CLOUDFLARE_API_TOKEN` in `.env.local` (an API
token with "Workers R2 Storage: Edit"), since the site's own R2 keys can't change bucket settings; without it the script
prints the rules to paste into the dashboard. Sessions are a signed cookie for seven days; eight wrong passwords in ten
minutes lock an address out for ten.

```bash
node -e "const c=require('crypto');const s=c.randomBytes(16);const o={N:131072,r:8,p:1,maxmem:268435456};console.log('131072:8:1:'+s.toString('hex')+':'+c.scryptSync(process.argv[1].normalize('NFKC'),s,32,o).toString('hex'))" 'the-password'
```

## Errors and missing pages

`src/app/not-found.tsx` (any unknown address or product, with a real 404 status) and `src/app/error.tsx` (anything that fails while a page renders — try again, or order on WhatsApp) share `components/StatusPage.tsx` and keep the site's nav and footer. `src/app/global-error.tsx` is the last resort when the layout itself fails: a self-contained page with its own few lines of CSS.

## Analytics and errors

Orders happen on WhatsApp, so the site counts what leads there. **Vercel Web Analytics** (visits, pages, referrers —
cookieless, no personal identifiers) and **Speed Insights** (how fast pages load for real visitors) are mounted in
`layout.tsx` by `components/SiteAnalytics.tsx`. Both must be **switched on once in the Vercel project** (Analytics and
Speed Insights tabs → Enable); until then their scripts answer 404 and nothing is counted. They load from the site's own
origin (`/_vercel/*`, which the proxy leaves alone), so the content security policy needed no change; they are off
while developing, and under `next start` their scripts are an expected 404 that the tests' console check ignores.

Custom events (Vercel → Analytics → Events), sent through `src/lib/analytics.ts`:

- `whatsapp_click` — any tap on a WhatsApp link; `source` says which: `nav`, `nav-menu`, `hero`, `bag` (Send order),
  `product` (Order now — only once a size is chosen), `favourites`, `contact`, `footer`, `how-it-works`, `about`,
  `about-page`, `size-guide`, `revealing-soon`, `error-page`, otherwise the page's path (`/help`, `/privacy`…). A new
  WhatsApp link is counted on its own; give it a `data-wa-source` (on the link or around it) to name it.
- `add_to_bag` and `favourite` (saving only) — with the piece's `slug`.
- `search_no_results` — a search that found nothing, the `query` cut to 40 characters, from the search dialog
  (`source: dialog`) or the shop (`source: shop`, only when nothing in the catalogue matches, not when filters emptied it).

Server errors land in Vercel → Logs as one JSON line each: `request_error` (from `src/instrumentation.ts` — the route,
method, path, digest and message of anything that fails on the server) and `img_upstream_error` (the photo route
couldn't get a photo from the bucket — its key and R2's status).

## Deploy

**The domain.** `lusted.lk` is registered at the LK Domain Registry (rs.domains.lk), whose nameservers point to
Cloudflare (`carlane` and `cleo.ns.cloudflare.com`), where its DNS lives: `lusted.lk` an A record to Vercel
(216.198.79.1), `www` and `dev` CNAMEs to the project's Vercel target — all "DNS only", not proxied, so Vercel issues
the certificates and runs its own CDN. In the Vercel project `lusted.lk` is the production domain and `www.lusted.lk`
a 308 redirect to it; `dev.lusted.lk` is pointed at each dev preview by CI (Vercel only ties a domain to Preview
through a Git branch, and deploys here come from CI). The site's absolute URLs follow Vercel's production domain on
their own (`src/lib/site-url.ts`).

Hosted on Vercel as the `lusted` project. Two branches, two addresses, deployed by CI (`.github/workflows/ci.yml`):

- **`dev`** — integration. Every merged pull request that passes CI is deployed as a Vercel preview and
  **https://dev.lusted.lk** (and the older https://lusted-dev.vercel.app) is pointed at it. Vercel's Preview environment carries `REVEAL_GATE=off`, so the dev
  site shows the real pages. (Preview deployments ask for a Vercel login unless Deployment Protection is relaxed in the
  project settings.)
- **`main`** — production, **https://lusted.lk** (and lusted.vercel.app), which shows the "Revealing soon" page until reveal day (`/privacy` stays readable, for the newsletter form's link). Only
  merges of `dev` reach it. At the moment itself (`revealAt` in `src/lib/site.ts`) the gate in `src/proxy.ts` stops
  without a deploy: the countdown reloads the page once for anyone waiting on it, so they are let straight in, and from
  then on `/revealing-soon` redirects (307) to the home page.

**Versions and releases.** Every release carries a version in `package.json` (the footer shows it as `v0.9.0`), and
the pull request into `main` must bump it — the Branch rules check refuses one that doesn't. When the merge deploys
to production, the deploy job tags the commit `v<version>` and cuts a GitHub release with notes written from the
pull requests since the last one. Patch for fixes, minor for new things; `1.0.0` is reveal day.

**The flow:** work on a branch → pull request into `dev` → merge → pull request `dev → main` → merge. Pull requests are
merged as merge commits (the repository allows no other method), must be up to date with their base, and must have every
check green; `main` takes pull requests from `dev` only. A direct push to either branch runs the checks but is never
deployed — the deploy job looks for the merge commit.

CI needs three repository secrets (Settings → Secrets and variables → Actions): `VERCEL_TOKEN` (vercel.com → Account →
Tokens; a token scoped to the team is fine), `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (both in `.vercel/project.json`
after `vercel link`). The deploys run the Vercel CLI at the exact version in `VERCEL_CLI` at the top of `ci.yml`, never
`@latest` — it is handed the token and the dev deploy reads the preview's URL from its output — so a bump is that one
line, to a release at least two weeks old.

The repository is public, and GitHub enforces the rules above: the rulesets in `.github/rulesets/` (see its README) are
active on `dev` and `main`, so a pull request can't be merged until it is up to date with its base and every required
check has passed, and neither branch takes a force-push. The workflow enforces the same on its side (red checks, no
deploy), and its Branch rules job is what keeps `main` to pull requests from `dev`. After editing a ruleset file,
`scripts/apply-rulesets.sh` updates them on GitHub. To deploy by hand from a laptop:

```bash
vercel deploy --prod   # production
vercel                 # a preview; then: vercel alias set <its url> dev.lusted.lk (and lusted-dev.vercel.app)
```
