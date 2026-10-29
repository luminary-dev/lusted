# Lusted — Design Review

Scope: a report only. No source, test or config file was changed. This builds on the operator's CSS measurements (no type, spacing, duration or z-index tokens; 249 font sizes; 53 time values; 36 breakpoints) and doesn't repeat them. Each finding names the file, what's wrong and what to do instead. Findings are ranked by impact on conversion and trust.

Files read: `ProductBrowser.tsx`, `ProductCard.tsx`, `ProductBuy.tsx`, `BagDrawer.tsx`, `PdpGallery.tsx`, `FavouritesList.tsx`, `Nav.tsx`, `lib/bag.ts`, `app/products/[slug]/page.tsx`, `layout.tsx` (font imports), and styles `01-base`, `07-product-cards-sale`, `09-product-page`, `10-bag-shop-responsive`. I didn't read home sections, search, help or legal pages in depth. Anything marked *(inferred)* needs a visual check in a browser.

---

## Ranked summary

| # | Finding | Area | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | Size guide sends the shopper off the product page to `/#size-guide` | Journey | Very high | S |
| 2 | On mobile the 9:16 gallery pushes price, size and Add to bag below the fold, and there is no sticky buy bar | Mobile | Very high | M |
| 3 | The colour picked on a card is lost on the PDP, and the bag thumbnail shows the default colourway | Journey / trust | High | S |
| 4 | Sold-out sizes aren't modelled anywhere | States | High | M |
| 5 | Every quick-add opens the full modal bag drawer | Journey | High | S |
| 6 | The bag has no sale price, no undo, a destructive "Clear bag" under the CTA, and no way to edit size or colour | Bag | High | M |
| 7 | Gallery thumbnails reorder on each tap; no swipe or zoom; small main image on laptops | Product | High | M |
| 8 | Micro-type at 9–11.5px on a script and Montserrat system | Typography | Medium | S |
| 9 | Dark mode: dark swatches and the fit meter disappear; the drawer has no edge | Dark mode | Medium | S |
| 10 | Filter counts are static, so filters can lead to zero results | Shop | Medium | M |
| 11 | Long names are unclamped; single-colour and one-size pieces lose information | States | Medium | S |
| 12 | Six font families imported for a two-face system; stale font comments | Craft / perf | Low–Med | S |

---

## What's already good (keep it)

- **Shop mechanics** (`ProductBrowser.tsx`): filters live in the URL, so they're shareable and survive back navigation. Search is debounced and handles races. The mobile sheet shows a live "Show N pieces". The closed sheet is `inert`, and Esc closes it. This is better than most boutique stores.
- **Filter sheet layout** (`10-bag-shop-responsive.css`, `@media (max-width:900px)`): a real bottom sheet with a sticky header and footer, `86svh` max height, and an overflow-clipped root so iOS can't zoom out to the parked sheet. Well made.
- **Bag robustness** (`lib/bag.ts`, `BagDrawer.tsx`): syncs across tabs, drops stale lines, returns focus when the drawer closes.
- **Hand-off copy** in `BagDrawer.tsx` ("confirm sizes, delivery and secure payment… plain packaging") is the right tone for this category. Discretion is stated at the moment it matters.
- **Accessibility groundwork:** `--rose-ink` exists because the brand rose fails 4.5:1 on small text (`01-base.css`). Swatches keep a 14px dot with a 24px hit area (`07`, `.swatches .swatch::before`). There are focus-visible rules and reduced-motion handling for the intro curtain.
- **Dark palette** (`01-base.css :root[data-theme="dark"]`): designed, not inverted. Wine-black surfaces (`#140a0c` / `#1b0e11`), a champagne primary button (`--btn-bg:#ebc6b4` with wine ink) and a lightened rose. The theme-switch bloom transition is genuinely premium.
- **Brand moments:** the "Made for…" line in Parisienne under the description (`.pdp-moments`), the fit meter (`.buy-fit-meter`) and the frosted quick-add reveal (`07`, `.quick-add`) are all distinctive and on-brand.
- Real 404 for unknown slugs and an OG image per product.

---

## 1. The shopping journey, end to end

**1.1 Size guide leaves the product page. Impact: very high.**
`ProductBuy.tsx`: the "Size guide" link in `.buy-label` points to `/#size-guide`. Size anxiety is the biggest drop-off point in lingerie, and at that exact moment the shopper is sent to the home page and loses their colour and size choices. They feel thrown out.
*Instead:* open the existing `SizeGuide` content in a dialog or bottom sheet on the PDP. Pre-select the product's category, and offer a "Find my size" calculation (underbust and bust) that writes the chosen size back into the picker.

**1.2 Colour doesn't survive card → PDP → bag. Impact: high.**
`ProductCard.tsx`: the swatch changes the card photo, but the card link carries no colour. `ProductBuy.tsx` always starts on `product.colors[0]`. Then `BagDrawer.tsx` shows `p.image`, the default colourway, beside a line that reads "Wine · M". A shopper who chose Wine lands on Blush, and later sees a blush photo labelled Wine just before paying over WhatsApp. That reads as carelessness right when trust matters most.
*Instead:* add `?colour=` to the card link and let `ProductBuy` and `PdpGallery` start from it. Store the colour's image on the bag line and render that.

**1.3 Quick-add interrupts set-building. Impact: high.**
`lib/bag.ts` `add()` always calls `setOpen(true)`, so every quick-add from the grid opens the modal drawer with scroll lock. Shoppers building a bra-and-brief set get pulled out of browsing on every item.
*Instead:* from the grid, show a non-modal toast ("Added · View bag"), pulse the nav bag count, and keep the drawer for the PDP CTA and the nav icon.

**1.4 The bag isn't a place to decide. Impact: high.**
`BagDrawer.tsx`:
- Line prices show only the sale price. The saving disappears at the moment it would reassure.
- "Clear bag" (`.drawer-clear`) sits right under the primary CTA, with no confirmation or undo. Remove (`.bag-remove`) has no undo either.
- Size and colour can't be changed. The only fix for the wrong size is remove, go back to the PDP and add again.
- The subtotal has no delivery or free-shipping note.

*Instead:* show was/now and a "You save" line. Move "Clear bag" into an overflow or remove it, and give remove an "Undo" toast for 5 seconds. Make size an inline select on each line. Add one line about delivery and discreet billing under the total.

**1.5 The size nudge isn't announced. Impact: medium.**
`ProductBuy.tsx`: "Please choose a size" (`.buy-warn`) has no `aria-live`, and focus doesn't move to the size group. On mobile the size group may be scrolled off-screen when the button is tapped (see 4.1), so the warning looks like nothing happened.
*Instead:* scroll the size group into view, focus the first size and announce the message politely. Also use `--rose-ink`, not `--rose` (see 2.3).

**1.6 Favourites → checkout.**
`FavouritesList.tsx` is well judged. "Ask about these on WhatsApp" lists every saved piece, and the empty state has a clear CTA.
What's missing: favourites have no route into the bag. There's no "Add to bag" per card on touch devices, because quick-add is `display:none` under `(hover:none)` in `07`, and no "Add all". On mobile, favourites are a dead end that leads only to WhatsApp.
*Instead:* add a visible size pill row and Add button on favourites cards on touch devices.

---

## 2. Visual hierarchy and typography in practice

**2.1 The pairing works at display sizes.**
Parisienne is set large and fluid: `.h1 clamp(54px,6.9vw,102px)` and `.h2 clamp(45px,5.1vw,72px)` in `01-base.css`. The comment correctly sizes it about 1.5× because of its small x-height. Product names stay in Montserrat (`.pdp-info .h2` overrides to `var(--display)`, `09`), which is the right call for legibility.
At 45px on a 375px phone, a long Parisienne `.h2` will take 3–4 lines *(inferred)*. Test the longest section titles and cap at about 2 lines, or lower the minimum to around 40px with copy edited to fit.

**2.2 Script is used below its comfortable size. Impact: medium.**
- `.pdp-moments` is a fixed `28px` Parisienne in `--rose-ink` (`09`). It's fine on desktop. Because it doesn't scale, it's proportionally loud on mobile, where it competes with the product name, which bottoms out at 26px (`clamp(26px,2.4vw,36px)`). The script line then outranks the product.
- `.sale-card-body h3` uses Parisienne at `clamp(28px,2.7vw,38px)` inside a 48%-wide column (`07`). On phones this column is very narrow *(inferred)*.

*Instead:* make `.pdp-moments` fluid, about `clamp(22px,1.8vw,28px)`. Keep script at 28px and above only where it's the most prominent text in its block.

**2.3 Micro-type undermines the luxury feel. Impact: medium.**
Montserrat's uppercase letterspacing at 9–11.5px reads like a utility label, not lingerie:
- `.pdp-thumb span`: **9px**, uppercase, 0.18em, white on a gradient (`09`). Below any comfortable reading size.
- `.badges .badge`: 10px (`07`). `.pdp-view`: 10.5px (`09`). `.eyebrow`: 11.5px, 0.26em (`01`).
- `.buy-label .buy-warn` uses `var(--rose)` at 12px uppercase. `01-base.css` itself documents that the brand rose fails 4.5:1 for small text. Use `--rose-ink`.

*Instead:* set a minimum of 12px for any text and 11px for uppercase labels with ≤0.14em tracking. Drop the thumbnail text labels (the image is the label) or raise them to 11px.

**2.4 Prices.**
`.price` 14.5px is tabular, and a sale price turns `--rose-ink` with the old price at 13px muted (`07`). The hierarchy is clean.
The card doesn't show the percentage off; only the PDP badge and the home sale card show the offer (`.sale-card-off`). Add the "−20%" badge on shop cards too (the `.badge-sale` style already exists).

---

## 3. Empty, loading, error and edge states

| State | Status | File | Recommendation |
|-------|--------|------|----------------|
| Zero results | Designed, generic | `ProductBrowser.tsx` | The copy says "those filters" even for a text search. Branch the copy for search vs filters, show which filter to drop ("Remove *Black*" chip), and show 4 best sellers. |
| Empty bag | Minimal | `BagDrawer.tsx` (`.drawer-empty`) | Plain text plus Browse. Show saved favourites ("You saved 3 pieces") or best sellers. That's the highest-value empty state on the site. |
| No favourites | Designed | `FavouritesList.tsx` | Good copy and CTA. Could add 4 suggestions. |
| Sold-out / low stock | **Forgotten** | `ProductBuy.tsx`, quick-add, filters | No per-size stock in the data or UI. Also, `.btn:disabled` uses `cursor: progress` (`01`), so a disabled "sold out" button would show a loading cursor. Add `stock` per size, strike through and disable sold-out chips with "Notify me", and use `cursor: not-allowed` for that case. |
| Single-colour piece | Partly forgotten | `ProductBuy.tsx` | The colour picker is hidden, so the colour name never appears on the PDP. Always show "Colour: Noir" as static text. |
| One-size piece | Forgotten side-effect | `ProductBuy.tsx` | Hiding the size group also hides the fit meter, the fit note and the size guide, which is exactly the information a one-size buyer needs. Keep the fit row and show "One size fits UK 6–12". |
| Very long name | Forgotten | `07` `.product-info h3`, `.quick-add-name`; `10` `.bag-body > a` | No clamp anywhere. Grid rows go ragged, and in quick-add a 3-line name pushes the size pills up over the product. Add `-webkit-line-clamp:2` on cards and quick-add, and keep the full name on the PDP and bag. |
| Price with offer | Designed on card and PDP, missing in bag | `07`, `09`, `BagDrawer.tsx` | See 1.4. |
| PDP loading | Placeholder only | `10` `.pdp-skeleton { min-height:80vh }` | An empty block, not a skeleton. Give it a 9:16 tinted media block plus title and price bars so layout doesn't jump. |
| Image load | Good | `.media`, `.product-media` | `--cream-2` backgrounds avoid white flashes. |

---

## 4. Mobile

**4.1 The buy box is below the fold. Impact: very high.**
`10`, `@media (max-width:900px)`: `.pdp-gallery { width:min(100%,460px) }` with a `9/16` main image (`09` `.pdp-main`). On a 375px phone that's about 335×596px of photo plus thumbnails before the name, price, sizes or button appear *(inferred from the CSS)*. There is no sticky action bar. A shopper has to scroll a full screen and more to learn the price.
*Instead:* on mobile, use a swipeable full-width gallery capped at about 70svh with dot indicators. Below it, a sticky bottom bar with price, a size-select button and Add to bag (within thumb reach). Show the name and price above the fold.

**4.2 Tap targets in the bag.**
`10`: `.bag-row .stepper` is 36px high with 32px-wide buttons, and `.bag-remove` is 28×28 at the top-right, the hardest corner for a right thumb to reach. Raise them to 44px, and move remove to a text "Remove" beside the stepper or to a swipe action.

**4.3 Cards on touch devices.**
`07`: `@media (hover:none) { .quick-add { display:none } }` and the back-view crossfade is hover-only. That's reasonable, since it avoids a broken hover. But touch shoppers never see the back view, which for lingerie is half the product.
*Instead:* make the card image a 2-photo horizontal scroll-snap on touch, or show a small "Back" toggle.

**4.4 Nav.**
`Nav.tsx` plus `10`: the icon buttons are forced to `40px !important`, a little under the 44px target. Below 479px the theme switch moves into the menu (good). The bar holds logo, WhatsApp, search, favourites, bag and menu: six targets in 375px. Consider moving search into the menu panel on the smallest screens so the bag gets space.

**4.5 Filter sheet.** Good (see "What's already good"). Missing: a drag handle and swipe-down to dismiss, which iOS users try first.

---

## 5. Dark mode

**Verdict:** the tokens are designed, not inverted (see "What's already good"). The shop styles (`07`, `09`, `10`) have no dark overrides at all, while home, about and help (`03`, `12`, `16`) do. Everything below only works in light mode:

- **Dark swatches disappear.** `07` `.swatch` relies on `inset 0 0 0 1px rgba(0,0,0,.12)` plus `var(--hair)` (12% cream in dark). A Noir or Wine swatch on `--paper #1b0e11` has essentially no edge. Add `[data-theme="dark"] .swatch { box-shadow: inset 0 0 0 1px rgba(255,255,255,.25) }`.
- **The fit meter fill is too low-contrast.** `09` `.buy-fit-meter … { background: var(--wine) }`, and dark `--wine` is `#8c2340` on `#1b0e11`, well under 3:1 for a meaningful graphic. Use `--rose` in dark.
- **The drawer loses its edge.** `10` `.drawer` is separated only by `box-shadow: rgba(20,8,10,.3)`, which is invisible on near-black, over a 0.45 black scrim. Add `border:1px solid var(--hair)` or a lighter surface (`--cream-2`) in dark.
- **The sale badge is hard-coded** (`07` `.badge-sale { background:#7a1b33 !important }`). It works on photos, but the `!important` blocks theming.
- **Product photography** sits on `--cream-2` (`#2a171b` in dark). Packshots shot on light backgrounds will show as bright rectangles on a dark page *(inferred; check visually)*. Consider a slightly lifted dark card surface or packshots on transparent backgrounds.
- **The quick-add CTA** `#160b0d` (`07`) is near-identical to the dark page background. It sits on a photo so it's fine, but it's worth checking on dark images.

---

## 6. What's missing that a lingerie shopper expects

Ranked by business value against effort, with the reason it matters *here*:

1. **An in-place size guide and fit finder (value very high, effort S–M).** Fit is the main reason for lingerie returns and abandonment. This store sells through WhatsApp, so every size question that lands there costs a person's time. The data and fit meter already exist (`buy-fit`), and only the surface is missing (see 1.1).
2. **Model and fit facts on the PDP: "Model is 5'7", wears S"; fabric and stretch; care (value high, effort S).** Lusted already shoots on models (the `has-back` 9:16 shots in `07`). The context that makes those photos useful for sizing is missing.
3. **Per-size stock, plus sold-out and "notify me" (value high, effort M).** Without it, the WhatsApp hand-off is where shoppers discover a size is gone. That's the worst possible moment, after they've committed.
4. **Discreet-delivery and returns/hygiene policy visible on the PDP, not only in the bag (value high, effort S).** Discretion is the main purchase blocker for intimate wear, and the copy already exists in `BagDrawer.tsx`. Repeat a one-line version in `.pdp-perks` beside the CTA.
5. **"Complete the set" / matching pieces (value high for AOV, effort M).** Lingerie sells in sets. `.related` (`09`) is generic "related"; label it and order it by set first. Offer one-tap "add the matching brief in M".
6. **Reviews with fit feedback ("runs small") (value medium–high, effort M–L).** Social proof matters more for an unfamiliar boutique brand. Fit-tagged reviews also feed the fit meter.
7. **Gift options: gift note, gift wrap, "send to someone" (value medium, effort S over WhatsApp).** Lingerie is a gifting category. A checkbox that adds a line to the WhatsApp message is nearly free.
8. **A non-modal add-to-bag toast (value medium, effort S).** See 1.3.

---

## 7. Craft and consistency notes

- `layout.tsx` imports **six** Google families (Corinthia, Fraunces, Montserrat, Parisienne, Petit Formal Script, Playfair Display). Only Parisienne, Montserrat and Corinthia (`.intro-tag` via `--script`) appear in use in the files read. Remove the alternates, or at least confirm they aren't preloaded, since that cost lands on first paint.
- Stale comments in `01-base.css`: `.h1,.h2` says headlines use "Playfair Display", and `font-variation-settings:"SOFT" 100` is a Fraunces-only setting left on Parisienne. They're harmless but signal unfinished decisions. Choose the face and delete the alternate size blocks.
- The operator's token gap shows up in practice. Pill heights are 52px (`.btn`, `.stepper`), 42px (`.quick-add-cta`), 40px (nav), 36px (bag stepper) and 30px (quick-add sizes) with no scale behind them, and badge, eyebrow and label sizes vary in half-pixels (10, 10.5, 11, 11.5, 12, 12.5px). A 5-step type scale and a 4-step control-height scale would fix most of the visual noise without changing the look.