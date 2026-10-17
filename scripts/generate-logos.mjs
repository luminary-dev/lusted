// Recreates the Lusted logo marks from the brand sheet (refs/9.webp) with gpt-image-2.5-sunburst,
// as flat single-colour marks on transparent backgrounds — one colourway per site theme.
// Usage: node --env-file=.env.local scripts/generate-logos.mjs [job ...]
// Then: node scripts/build-logo-pack.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error("OPENAI_API_KEY is not set (put it in .env.local)");
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "refs/crops/9.png");
const OUT = path.join(ROOT, "brand/source");

// Light theme = dark wine ink; dark theme = champagne / rose-gold ink.
const INKS = {
  light: "solid deep wine red #6B1430",
  dark: "solid soft champagne rose-gold #EBC6B4",
};
const FLAT =
  "Render it as a clean, flat, print-ready logo: one single solid colour only, no metallic texture, no emboss, no bevel, no gradient, no shadow, no fabric, no background scene. " +
  "Crisp smooth edges, perfectly centred with generous empty padding, on a fully transparent background. Keep the letterforms and proportions identical to the reference.";

const marks = {
  wordmark: {
    size: "3072x2048",
    what: "the main 'Lusted' high-contrast serif logotype with the long swash flowing from the 'L' under the word, the small four-point sparkle star, and the spaced-out 'LINGERIE' tagline below-right (exactly as at the top of this brand sheet)",
  },
  monogram: {
    size: "2048x2048",
    what: "the 'L' monogram with its swash and the small four-point sparkle star (the middle bottom tile of this brand sheet)",
  },
  seal: {
    size: "2048x2048",
    what: "the circular seal: a thin circle containing the 'L' monogram with swash, 'LUSTED' arched along the top inside the circle, 'LINGERIE' arched along the bottom, and two small sparkle stars on the left and right (the bottom right tile of this brand sheet)",
  },
};

const jobs = Object.fromEntries(
  Object.entries(marks).flatMap(([mark, m]) =>
    Object.entries(INKS).map(([theme, ink]) => [`${mark}-${theme}`, { size: m.size, prompt: `Isolate ${m.what}. ${FLAT} Colour: ${ink}.` }]),
  ),
);

async function run(name) {
  const job = jobs[name];
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", job.prompt);
  form.append("size", job.size);
  form.append("quality", "high");
  form.append("background", "transparent");
  form.append("output_format", "png");
  form.append("n", "1");
  form.append("image[]", new Blob([await readFile(SRC)], { type: "image/png" }), "brand-sheet.png");
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${json.error?.code ?? ""} ${json.error?.message?.slice(0, 90) ?? ""}`);
  await writeFile(path.join(OUT, `${name}.png`), Buffer.from(json.data[0].b64_json, "base64"));
  console.log(`✓ ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

await mkdir(OUT, { recursive: true });
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(jobs);
const results = await Promise.allSettled(names.map(run));
for (const r of results) if (r.status === "rejected") console.error("✗", r.reason.message);
