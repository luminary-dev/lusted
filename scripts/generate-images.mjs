// Generates all site imagery with OpenAI's gpt-image-2.5-sunburst (text-to-image).
// Usage: node --env-file=.env.local scripts/generate-images.mjs [job-name ...]
// Reads OPENAI_API_KEY from the environment; never hardcode it.
//
// Jobs with a model in frame carry a `fallback` prompt with more coverage (robe / slip).
// It only runs if OpenAI's moderation rejects the primary prompt.
import { writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error("OPENAI_API_KEY is not set (put it in .env.local)");
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src/assets/images");
const RAW = path.join(ROOT, "refs/generated");

const STYLE =
  "Luxury lingerie brand campaign photograph. Soft warm natural window light, blush pink, dusty rose and champagne palette with deep wine accents, " +
  "shallow depth of field, medium-format film look with gentle grain, elegant, tasteful, high-end fashion editorial. No text, no logos, no watermark.";
// Fallbacks show robes / slips / dresses, so they're described as the fashion editorial they are.
const STYLE_FASHION = STYLE.replace("Luxury lingerie brand campaign photograph.", "Luxury fashion editorial photograph.");
const MODEL_DESC = "a woman in her twenties with long voluminous dark brown wavy hair, warm olive skin and soft natural makeup";

const jobs = {
  // hero: OpenAI moderation rejects model heroes; the hero slideshow is generated with Krea 2 (scripts/krea-hero.py).
  "collection-lingerie": {
    size: "2304x3072",
    // Model versions are rejected by moderation, so the collections use product still lifes.
    prompt: `${STYLE} Still life, no people: a blush pink floral lace balconette bra and matching brief with satin bows hanging from a vintage brass hanger against sheer blush curtains glowing with morning light, a vase of pink garden roses on a side table below.`,
  },
  "size-guide": {
    size: "2304x3072",
    prompt: `${STYLE} Portrait: ${MODEL_DESC} stands by sheer blush curtains, wearing a fully lined blush pink lace bralette and matching high-waist brief with satin bows, a soft pink tailor's measuring tape draped around her neck, warm smile.`,
    fallback: `${STYLE_FASHION} Portrait: ${MODEL_DESC} stands by sheer blush curtains in a blush pink silk camisole and matching wide-leg silk trousers, a soft pink tailor's measuring tape draped around her neck, warm smile.`,
  },
  about: {
    size: "3840x2160",
    prompt: `${STYLE} Still life, no people: a blush pink floral lace balconette bra and matching brief with satin ribbon bows laid on rumpled blush satin sheets, beside a fluted gold glass vase of pink garden roses, a lit candle on a mirrored gold tray and a strand of pearls. The garments sit in the right half of the frame.`,
  },
  packaging: {
    size: "2304x3072",
    prompt: `${STYLE} Still life, no people: a plain blush pink gift box with the lid off, blush tissue paper folded open revealing a hint of pink lace, tied with a wide pink satin ribbon, on a cream linen surface with a single pink rose and a handwritten thank-you card (blank). Discreet, elegant packaging.`,
  },
  footer: {
    size: "3840x2160",
    prompt: `${STYLE} No people: rumpled dusky-rose satin bedsheets in low warm evening light, deep red rose heads and scattered petals in the bottom-left corner and along the bottom edge, the rest soft and empty. Moody, dark, romantic.`,
  },
  "thumb-lingerie": {
    size: "2048x2048",
    prompt: `${STYLE} Close-up detail, no face: blush pink floral lace with a small pink satin bow at the centre gore of a lined bra, laid on satin.`,
  },
};

async function generate(name, prompt) {
  const job = jobs[name];
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: job.size,
      quality: "high",
      moderation: "low",
      n: 1,
      ...(job.background && { background: job.background }),
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(`${res.status} ${json.error?.code ?? ""} ${json.error?.message?.slice(0, 90) ?? ""}`);
    err.moderated = json.error?.code === "moderation_blocked";
    throw err;
  }
  return Buffer.from(json.data[0].b64_json, "base64");
}

async function run(name) {
  const job = jobs[name];
  const t0 = Date.now();
  let buf, variant = "primary";
  try {
    if (FALLBACK_ONLY && job.fallback) throw Object.assign(new Error("skipped"), { moderated: true });
    buf = await generate(name, job.prompt);
  } catch (e) {
    if (!(e.moderated && job.fallback)) throw new Error(`${name}: ${e.message}`);
    variant = "fallback";
    buf = await generate(name, job.fallback).catch((e2) => {
      throw new Error(`${name} (fallback): ${e2.message}`);
    });
  }
  const png = path.join(RAW, `${name}.png`);
  await writeFile(png, buf);
  execFileSync("cwebp", ["-quiet", "-q", "92", "-alpha_q", "100", png, "-o", path.join(OUT, `${name}.webp`)]);
  console.log(`✓ ${name} [${variant}] (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

await mkdir(OUT, { recursive: true });
await mkdir(RAW, { recursive: true });
// --fallback-only: skip primaries already known to be rejected by moderation.
const FALLBACK_ONLY = process.argv.includes("--fallback-only");
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const names = args.length ? args : Object.keys(jobs);
const results = await Promise.allSettled(names.map(run));
for (const r of results) if (r.status === "rejected") console.error("✗", r.reason.message);
