// Generates one catalogue photo per product in src/lib/catalog.json with gpt-image-2.5-sunburst.
// Usage: node --env-file=.env.local scripts/generate-products.mjs [slug ...]
// Skips products that already have an image unless their slug is passed explicitly,
// then rewrites src/lib/product-images.ts to match catalog.json (via scripts/sync-product-images.mjs).
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error("OPENAI_API_KEY is not set (put it in .env.local)");
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src/assets/products");
const RAW = path.join(ROOT, "refs/generated/products");
const catalog = JSON.parse(await readFile(path.join(ROOT, "src/lib/catalog.json"), "utf8"));

const STYLE =
  "E-commerce catalogue product photograph for a luxury lingerie and swimwear boutique. The entire garment is visible and centred with generous margins, " +
  "on a seamless warm blush-beige backdrop, soft diffused studio daylight, subtle natural shadow, crisp detail on fabric texture. " +
  "No people, no mannequin, no text, no logos, no props.";

const exists = (p) => access(p).then(() => true, () => false);
const CONCURRENCY = 8;

async function run(p) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt: `${STYLE} Product: ${p.shot}.`, size: "1536x2048", quality: "high", moderation: "low", n: 1 }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${p.slug}: ${res.status} ${json.error?.code ?? ""} ${json.error?.message?.slice(0, 90) ?? ""}`);
  const png = path.join(RAW, `${p.slug}.png`);
  await writeFile(png, Buffer.from(json.data[0].b64_json, "base64"));
  execFileSync("cwebp", ["-quiet", "-q", "90", png, "-o", path.join(OUT, `${p.slug}.webp`)]);
  console.log(`✓ ${p.slug}`);
}

await mkdir(OUT, { recursive: true });
await mkdir(RAW, { recursive: true });
const only = process.argv.slice(2);
const todo = [];
for (const p of catalog) {
  if (only.length ? only.includes(p.slug) : !(await exists(path.join(OUT, `${p.slug}.webp`)))) todo.push(p);
}
const queue = [...todo];
const errors = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let p; (p = queue.shift()); ) await run(p).catch((e) => errors.push(e.message));
  }),
);
errors.forEach((e) => console.error("✗", e));
console.log(`${todo.length - errors.length}/${todo.length} generated`);

// Keep src/lib/product-images.ts (static imports for next/image) in sync with the catalogue.
await import("./sync-product-images.mjs");
