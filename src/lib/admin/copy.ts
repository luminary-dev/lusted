import "server-only";

import catalog from "@/lib/catalog.json";
import { categories, colors, type Category, type ColorKey } from "@/lib/products";

// "Write it with AI": Claude looks at the front photo and writes the piece up the way the rest of the catalogue is
// written — the name, the description, the one-line blurb, the details, the fit note and the three moments — for the
// owner to read, change and approve before anything is added. Needs ANTHROPIC_API_KEY on the server; it never
// reaches the browser.

export type Copy = {
  name: string;
  /** two more names to choose from */
  names: string[];
  description: string;
  blurb: string;
  details: string[];
  fitNote: string;
  moments: string[];
};

export type Brief = {
  category: Category;
  colors: ColorKey[];
  price: number;
  fit: -1 | 0 | 1;
  notes: string;
  image: { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string };
};

const MODELS = ["claude-sonnet-5-5", "claude-sonnet-5"];

export async function writeCopy(brief: Brief): Promise<Copy> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set on the server");

  // three pieces from the same collection as the voice to match
  const examples = catalog
    .filter((p) => p.category === brief.category)
    .slice(0, 3)
    .map((p) => ({ name: p.name, description: p.description, blurb: p.blurb, details: p.details, fitNote: p.fitNote, moments: p.moments }));
  const collection = categories.find((c) => c.key === brief.category)!;
  // the names the catalogue does best: a mood, a sin, a colour or a temptress, then the piece — never a place
  const goodNames = ["Scarlet Sin Bikini", "Noir Temptress Bikini", "Pearl Seduction Bikini", "Golden Goddess Bikini", "Siren Chainmail Mini", "Vixen Cut-out Bandage Mini", "Rouge Eyelash Lace Bodysuit", "Delilah Backless String Dress", "Nightshade Plunge Mini", "Scarlet Butterfly Teddy", "Juliette Lace Bodysuit", "Rosé Lace Balconette Bra"];
  const takenNames = catalog.map((p) => p.name);
  const fit = { [-1]: "runs small (size up)", 0: "true to size", 1: "runs large (size down)" }[brief.fit];
  const prompt =
    `You write product copy for Lusted, a Sri Lankan lingerie, swim and after-dark boutique. The voice is very naughty: hungry, shameless, teasing and confident, a bit of a bad influence — every line leans in and whispers something wicked, with dirty innuendo, double meanings, dares and breathless asides. Write in the second person to a grown woman who is in charge of her own pleasure and is being wicked by choice. Make the piece the star of the seduction: what it shows, what it barely hides, how fast it comes off, who gets to take it off and what happens after. Words like naughty, filthy, wicked, aching, greedy, shameless, tease, tug, untie, peel, slip off and bad decisions fit; "slutty" only rarely, as a proud word she uses about herself, never as an insult. Short punchy sentences, em dashes, British spelling. The rules, without exception: no emoji or decorative symbols of any kind, no hashtags; nothing that suggests youth (never "girl", "teen", "young", "little", "schoolgirl", "barely legal", "daddy", "innocent" in a youthful sense); desire is always mutual and she is in control — nothing coercive; innuendo and heat, never a graphic description of sex, genitals or bodily fluids, because the description is also the search-engine snippet and the link preview people share; body-positive, nothing about bodies needing fixing; no invented fabric claims — describe only what the photo shows and what the owner says. Here are three pieces from the same collection ("${collection.name}") as the voice to match:\n${JSON.stringify(examples, null, 2)}\n\n` +
    `The photo shows a new piece for the "${collection.name}" collection (${collection.label.toLowerCase()}). Colours it comes in: ${brief.colors.map((c) => colors[c].label).join(", ")}. Price: LKR ${brief.price.toLocaleString("en-LK")}. Fit: ${fit}. Owner's notes: ${brief.notes || "(none)"}.\n\n` +
    `Reply with ONLY a JSON object — no markdown fence, no text before or after it — with these keys:\n` +
    `"name": the best of three names, and "names": the other two. A name is two to four words: a tempting first word or two — a mood, a sin, a colour, a jewel, a temptress's name (Scarlet, Noir, Rouge, Siren, Vixen, Delilah, Nightshade, Velvet, Midnight, Wicked, Honey, Halo…) — then what the piece is. These are the ones the catalogue does best, match them: ${goodNames.join("; ")}. Never a place, a city or a country (no Galle, Colombo, Capri, Mykonos), never a plain description ("Black Lace Bodysuit"), never a brand, and not any of these, already taken: ${takenNames.join("; ")};\n` +
    `"description": two or three sentences like the examples — what it is, what it bares, how it comes off — ending with the care in a few words (e.g. "Hand wash cold.");\n` +
    `"blurb": one short line for a small card, under 70 characters;\n` +
    `"details": an array of three to five short feature strings (fabric, lining, cut, fastening, care), like the examples — facts first, a cheeky word at most;\n` +
    `"fitNote": one sentence on how it sits and which size to take, consistent with the fit given — the sizing advice must stay exact;\n` +
    `"moments": an array of exactly three short lowercase phrases it's made for, like the examples — the page reads them as "Wear it for <one>, <two> & <three>. Then don't."`;

  let lastError: Error | null = null;
  for (const model of MODELS) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: brief.image.mediaType, data: brief.image.base64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    }).catch(() => null);
    if (!response) {
      lastError = new Error("Claude could not be reached");
      continue;
    }
    if (!response.ok) {
      const text = await response.text();
      lastError = new Error(`Claude: ${response.status} ${text.slice(0, 200)}`);
      if (response.status === 404 || /model/i.test(text)) continue; // this model name isn't available here: try the next
      break;
    }
    const body = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const raw = body.content?.find((block) => block.type === "text")?.text ?? "";
    return parseCopy(raw);
  }
  throw lastError ?? new Error("Claude replied unexpectedly");
}

// forgiving about fences, prose around the JSON and stray control characters
function parseCopy(raw: string): Copy {
  const text = raw.replace(/```(?:json)?/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error(`Claude returned no JSON: ${raw.slice(0, 160)}`);
  const copy = JSON.parse(text.slice(start, end + 1).replace(/[\u0000-\u001f]+/g, " ")) as Partial<Copy>;
  // the site never shows an emoji, so any that slip through the prompt are taken out here (with the joiners and
  // variation selectors that build them), and the space they leave is closed up
  const clean = (s: string) => s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u200D\uFE0F\u20E3]/gu, "").replace(/\s{2,}/g, " ").trim();
  const str = (v: unknown, max: number) => (typeof v === "string" ? clean(v).slice(0, max) : "");
  const list = (v: unknown, max: number, n: number) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && clean(x)).map((x) => clean(String(x)).slice(0, max)).slice(0, n) : []);
  const out: Copy = {
    name: str(copy.name, 60),
    names: list(copy.names, 60, 3).filter((n) => n !== str(copy.name, 60)),
    description: str(copy.description, 600),
    blurb: str(copy.blurb, 90),
    details: list(copy.details, 80, 6),
    fitNote: str(copy.fitNote, 160),
    moments: list(copy.moments, 60, 3),
  };
  if (!out.name || !out.description) throw new Error("Claude's copy is missing the name or the description");
  if (out.moments.length < 3) out.moments = [...out.moments, "slow mornings", "being looked at", "coming off"].slice(0, 3);
  if (out.details.length === 0) out.details = ["Hand wash cold"];
  return out;
}
