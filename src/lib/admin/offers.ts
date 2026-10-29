// What makes an offer price, or a percentage off a collection, one the Console workflow will accept. The console
// checks these before Save, and the dispatch route checks them again before anything is queued: a change the workflow
// refuses (scripts/admin/apply-update.mjs, which keeps its own check as the last line of defence) opens no pull
// request, so the console would wait on it for ever and the owner would never learn why. No server-only imports here:
// the console, the route and the tests all read the same rules.

export const PERCENT_MIN = 1;
export const PERCENT_MAX = 90;

// Why an offer price won't do, in the console's words, or null when it will. The full price is optional: without it
// only the price itself is checked.
export function offerProblem(sale: number, price?: number): string | null {
  if (!Number.isFinite(sale) || !Number.isInteger(sale)) return "Whole rupees only";
  if (sale <= 0) return "Clear it to end the offer";
  if (typeof price === "number" && Number.isFinite(price) && price > 0 && sale >= price) return "Must be under the full price";
  return null;
}

// Why a percentage off a collection won't do, or null when it will: whole numbers from 1 to 90, as the workflow takes.
export function percentProblem(percent: number): string | null {
  if (!Number.isInteger(percent) || percent < PERCENT_MIN || percent > PERCENT_MAX) return `A whole number from ${PERCENT_MIN} to ${PERCENT_MAX}`;
  return null;
}
