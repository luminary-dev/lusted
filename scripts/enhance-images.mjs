// Enhances photos 2× the way the product shots are: Real-ESRGAN (realesrgan-x4plus) 4×, brought to 2× and blended
// 75/25 with a plain Lanczos enlargement so lace, hair and eyes sharpen without plastic skin. No crop, no watermark —
// the output is a PNG at twice the input size, next to nothing else touched.
// Usage: node scripts/enhance-images.mjs <out-dir> <in.png> [<in.png> …]
// Output names: <out-dir>/<basename>-2x.png. Needs realesrgan-ncnn-vulkan in .tools/realesrgan/ (or ESRGAN_BIN / PATH).
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ESRGAN_WEIGHT = 0.75;
const [outDir, ...inputs] = process.argv.slice(2);
if (!outDir || !inputs.length) throw new Error("usage: node scripts/enhance-images.mjs <out-dir> <in.png> [...]");

const candidates = [process.env.ESRGAN_BIN, path.join(ROOT, ".tools/realesrgan/realesrgan-ncnn-vulkan")].filter(Boolean);
try {
  candidates.push(execFileSync("which", ["realesrgan-ncnn-vulkan"]).toString().trim());
} catch {}
const ESRGAN = candidates.find((p) => p && (() => { try { execFileSync("test", ["-x", p]); return true; } catch { return false; } })());
if (!ESRGAN) throw new Error("realesrgan-ncnn-vulkan not found (set ESRGAN_BIN)");
const models = path.join(path.dirname(ESRGAN), "models");

await mkdir(outDir, { recursive: true });
for (const src of inputs) {
  const { width, height } = await sharp(src).metadata();
  const tmp = await mkdtemp(path.join(os.tmpdir(), "lusted-x4-"));
  const x4 = path.join(tmp, "x4.png");
  execFileSync(ESRGAN, ["-i", src, "-o", x4, "-n", "realesrgan-x4plus", "-s", "4", "-m", models], { stdio: "ignore" });
  const W = width * 2, H = height * 2;
  const ai = await sharp(x4).resize(W, H, { kernel: "lanczos3" }).removeAlpha().toBuffer();
  const plain = await sharp(src).resize(W, H, { kernel: "lanczos3" }).removeAlpha().ensureAlpha(1 - ESRGAN_WEIGHT).png().toBuffer();
  const dest = path.join(outDir, `${path.basename(src, path.extname(src)).replace(/[\s()]+/g, "-").replace(/-+$/, "")}-2x.png`);
  await sharp(ai).composite([{ input: plain }]).png({ compressionLevel: 6 }).toFile(dest);
  await rm(tmp, { recursive: true, force: true });
  console.log(`done ${path.basename(dest)}  ${W}×${H}`);
}
