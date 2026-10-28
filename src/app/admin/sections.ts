// The four rooms of the back room, one page each (/admin/<id>). Shared by the pages (server) and the console (client),
// so it lives on its own: a client module's plain exports aren't readable from a server component.
export const SECTIONS = [
  { id: "fitting", numeral: "i", name: "The fitting", aside: "add a piece" },
  { id: "offers", numeral: "ii", name: "Offers", aside: "a collection at once" },
  { id: "ledger", numeral: "iii", name: "The ledger", aside: "every piece" },
  { id: "daybook", numeral: "iv", name: "The day book", aside: "what happened" },
] as const;
export type Section = (typeof SECTIONS)[number]["id"];
