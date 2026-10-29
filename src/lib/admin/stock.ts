// Which of a piece's sizes are sold out, as the ledger marks them: a list of the piece's own sizes, each at most once,
// and an empty list when everything is back. The console builds it from the piece's sizes, the dispatch route checks
// it again before anything is queued (against the piece's sizes as they are on dev), and the Console workflow keeps
// its own check as the last line of defence (scripts/admin/apply-update.mjs). No server-only imports here: the
// console, the route and the tests all read the same rule.

// Why a list of sold-out sizes won't do, in the console's words (lower case, since a size leads some), or null when
// it will. The piece's sizes are optional: without them only the shape of the list is checked.
export function soldOutProblem(soldOut: unknown, sizes?: string[]): string | null {
  if (!Array.isArray(soldOut) || soldOut.length > 20 || soldOut.some((s) => typeof s !== "string" || !s || s.length > 20)) return "a list of sizes";
  if (new Set(soldOut).size !== soldOut.length) return "each size once";
  const stranger = sizes ? soldOut.find((s) => !sizes.includes(s)) : undefined;
  if (stranger !== undefined) return `${stranger} isn’t one of its sizes`;
  return null;
}

// The list as the catalogue keeps it: in the piece's own size order, so the same sizes always read the same.
export const inSizeOrder = (soldOut: string[], sizes: string[]) => sizes.filter((s) => soldOut.includes(s));
