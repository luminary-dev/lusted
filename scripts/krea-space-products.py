"""Generate every catalogue product as model photography — front, back and side (9:16) — on the owner's
private Space dhanikaa/Krea-2-Turbo_v2.

Usage: python3 scripts/krea-space-products.py [slug ...]
Writes refs/krea/products/<slug>-<front|back|side>.png and skips views that already exist, so it can simply be
re-run after the ZeroGPU daily quota resets; it stops cleanly when the quota runs out. Each product has its own design,
one of six different models and a set for its category; all three views share a seed so they read as one shoot.
Same settings as scripts/krea-space-hero.py. Reads the local `hf` login token; never prints it.
"""
import json
import pathlib
import sys
import urllib.error
import urllib.request

SPACE = "https://dhanikaa-krea-2-turbo-v2.hf.space"
TOKEN = pathlib.Path.home().joinpath(".cache/huggingface/token").read_text().strip()
WIDTH, HEIGHT = 864, 1536  # 9:16 — plenty for cards and product pages, and about half the GPU time of 1152 × 2048
STEPS = 12
# Seconds of GPU to reserve per shot. The Space's own estimate (35 s + size × steps) asks for ~82 s here, which ZeroGPU
# refuses once the daily quota runs low; a shot actually takes ~20 s, so a tight reservation lets far more through.
GPU_BUDGET = 40
N_LORA_SLIDERS = 18
OUT = pathlib.Path(__file__).resolve().parent.parent / "refs/krea/products"

STYLE = (
    "Ultra-realistic luxury lingerie and swimwear e-commerce campaign photograph, sexy high-glamour editorial, medium-format "
    "camera, 85mm lens at f/2.2, soft flattering light, true-to-life colour, ultra-detailed fabric texture, sharp eyes, clean "
    "noise-free image. "
)
BEAUTY = (
    "She is a breathtaking, goddess-like woman in her mid-twenties with the refined face of a beauty-pageant queen — "
    "symmetrical features, high cheekbones, long lashes, soft smoky makeup, full glossy lips — flawless glass-smooth skin "
    "with a dewy glow, no freckles, no moles, no blemishes, and a slim, toned hourglass figure with a tiny waist, curvy hips "
    "and long legs, poised like a runway model. "
)
MODELS = {
    "A": "She has long, voluminous, glossy dark-brown waves, golden-olive skin and almond honey-brown eyes. ",
    "B": "She has long, tousled honey-blonde waves, sun-kissed light-tan skin and green eyes. ",
    "C": "She has sleek, waist-length jet-black straight hair, porcelain-peach skin and dark, feline eyes. ",
    "D": "She has long copper-auburn waves, fair skin with a rosy glow and hazel eyes. ",
    "E": "She has voluminous dark-brown curls, rich caramel-bronze skin and amber eyes. ",
    "F": "She has a sleek chestnut-brown chin-length bob, warm beige skin and grey-blue eyes. ",
}
SETS = {
    "boudoir": "Setting: a sunlit Parisian boudoir — cream panelled walls, sheer ivory curtains, a blush velvet chaise and a "
    "rumpled satin bed softly blurred behind her, warm window light. ",
    "boudoir-night": "Setting: a candlelit boudoir at night — deep-wine velvet drapes, a gold-framed mirror and flickering "
    "candles in warm amber bokeh behind her. ",
    "cove": "Setting: a secluded white-sand cove, glowing turquoise water and pale cliffs softly blurred behind her, bright "
    "golden-hour sun. ",
    "pool": "Setting: the edge of a private infinity pool at sunset, a peach-and-rose sky over the sea blurred behind her. ",
    "yacht": "Setting: the teak deck of a luxury yacht, deep-blue sea and a hazy coastline blurred behind her, bright sun. ",
    "beachclub": "Setting: an exclusive beach club, white cabanas, palms and a turquoise sea softly blurred behind her, warm "
    "afternoon sun. ",
    "lounge": "Setting: a dim, candlelit private members' lounge — deep-wine velvet banquettes, smoky-gold mirrors and warm "
    "amber bokeh behind her. ",
    "rooftop": "Setting: a rooftop bar at night, glittering city lights in soft bokeh behind her, warm golden lanterns. ",
}
VIEWS = {
    "front": "Full-length 9:16 portrait, FRONT VIEW: she faces the camera with her hips pushed to one side and her back "
    "arched, one hand slowly running through her hair and the thumb of the other hooked into the garment at her hip "
    "as if about to tug it lower, lips parted, gazing into the lens with a smouldering, come-hither look; framed from the top "
    "of her head to just above her knees, centred, every inch of the tiny garment and all that bare skin on show. ",
    "back": "Full-length 9:16 portrait, BACK VIEW: she stands with her back to the camera, back arched and one hip popped, "
    "looking back over her shoulder into the lens with a teasing, seductive smile, hair swept over one shoulder so the back "
    "of the garment is clearly visible; framed from the top of her head to just above her knees. ",
    "side": "Full-length 9:16 portrait, SIDE VIEW: she stands in profile with her back arched and her chest lifted, one knee "
    "bent, a hand resting on her bare hip, face turned towards the lens over her shoulder with a sultry look, showing the "
    "high-cut side of the garment and her bare hip and legs; framed from the top of her head to just above her knees. ",
}
SAFE = (
    "Revealing, daring, seductive fashion photography — but every intimate area is fully covered by lined fabric: no "
    "nudity, no see-through cups."
)

# lingerie and swim only: without this the model sometimes dresses her in a slip or gown from behind
ONLY_THE_SET = "She wears only this piece and nothing over it — no dress, no slip, no robe, no cover-up. "
WITH_COVER = {"sakura-silk-kimono-set", "delilah-backless-string-dress", "margot-silk-slip"}  # a robe or a dress is the point here
CATALOG = {p["slug"]: p for p in json.loads((pathlib.Path(__file__).resolve().parent.parent / "src/lib/catalog.json").read_text())}

# slug: (seed, model, set, the design — distinct silhouettes, fabrics and details, front and back)
PRODUCTS = {
    # ── lingerie ──
    "rose-lace-balconette-bra": (5101, "A", "boudoir",
        "She wears the Rosé balconette set in blush pink: a fully lined floral lace balconette bra with scalloped edges, a "
        "deep centre gore and tiny satin bows on each strap, and a matching high-cut lace brief; from behind, a wide lace "
        "band with satin hook closure and a cheeky lace back."),
    "rose-lace-high-waist-brief": (5102, "D", "boudoir",
        "She wears the Rosé high-waist brief in deep wine: a high-waisted brief of sheer-panelled floral lace with a "
        "scalloped waistband sitting at her navel and dramatic high-cut legs, worn with a tiny matching wine lace "
        "triangle bralette; from behind, a cheeky lace back with a satin bow at the base of her spine."),
    "camille-satin-bow-bralette": (5103, "B", "boudoir",
        "She wears the Camille set in ivory satin: a soft fully lined triangle bralette with an oversized satin bow tied at "
        "the centre, thin ribbon straps that cross and tie in a bow at her back, and a tiny ivory satin tanga with bow "
        "sides."),
    "juliette-lace-bodysuit": (5104, "C", "boudoir-night",
        "She wears the Juliette bodysuit in black: a deep-plunge bodysuit of black Chantilly lace with fully lined cups, "
        "sheer mesh side panels, an extreme high-cut leg and a back open all the way to the waist, finishing in a thong "
        "back."),
    "margot-silk-slip": (5105, "F", "boudoir",
        "She wears the Margot slip in champagne silk: a bias-cut silk chemise with a deep cowl neckline, lace-trimmed slits "
        "up to the hip on both sides, a very short hem, and spaghetti straps that cross over a bare, open back."),
    "amelie-garter-belt": (5106, "E", "boudoir-night",
        "She wears the Amélie garter belt in black: a wide black lace garter belt sitting on her waist with four satin "
        "suspender straps clipped to sheer black seamed stockings, over a black lace thong and a black lace balconette "
        "bra."),
    # ── new: the most daring lingerie ──
    "vesper-strap-cage-set": (6101, "C", "boudoir-night",
        "She wears the Vesper lingerie set in black: a strappy black bra with thin straps criss-crossing her chest, ribs and bare back to small gold rings, and a tiny black thong bottom with three thin straps on each hip. Her back, waist and legs are bare."),
    "elodie-sheer-babydoll": (6102, "D", "boudoir",
        "She wears the Élodie babydoll in blush: a lined blush lace balconette bra with a short, floaty chiffon skirt that falls open at the front over a tiny blush lace thong, tied at the back with one satin bow. Her waist and legs are bare."),
    "noemie-satin-plunge-teddy": (6103, "F", "boudoir",
        "She wears the Noémie teddy in champagne satin: a one-piece satin teddy with thick padded, lined cups and a deep V neckline plunging all the way down to her navel, cut-outs at both sides of her waist, very high-cut legs and a thong back. Her back and legs are bare."),
    "sabine-crystal-set": (6104, "E", "boudoir-night",
        "She wears the Sabine lingerie set in wine: a tiny wine satin triangle bra edged with fine crystal chains, a crystal body chain draped down her stomach, and a tiny wine thong with crystal-chain straps on her hips. Her back, waist and legs are bare."),
    "sakura-silk-kimono-set": (6118, "A", "boudoir",
        "She wears the Sakura set in deep wine: a lined wine lace plunge bra and a tiny matching wine lace thong, with a short wine satin kimono with wide sleeves draped off her shoulders and hanging open behind her from her elbows, so her bra, bare stomach, thong and hips are all on show at the front."),
    "delilah-backless-string-dress": (6109, "D", "boudoir-night",
        "She wears the Delilah dress in black satin: a short black satin slip mini dress on thin straps with lined cups, its back completely bare from her shoulders down to the base of her spine, laced across with thin black criss-crossing strings. Her back and legs are bare."),
    "rouge-eyelash-lace-bodysuit": (6110, "B", "boudoir",
        "She wears the Rouge bodysuit in red: a lingerie bodysuit made entirely of intricate red floral lace with scalloped eyelash-lace edges, lined lace cups and a deep V neckline plunging to her navel, extreme high-cut legs and a thong back; from behind, thin straps cross her bare open back. The lace pattern is clearly visible all over. Her legs are bare."),
    # ── new: the most daring swim ──
    "ibiza-slingshot-swimsuit": (6201, "B", "pool",
        "She wears the Ibiza swimsuit in deep wine red: a wine-red halter one-piece with a plunging neckline and very high-cut legs; from behind, her whole back is bare down to a tiny wine-red thong back. Her back and legs are bare."),
    "mykonos-chain-bikini": (6202, "A", "cove",
        "She wears the Mykonos bikini in black: a tiny black triangle bikini held by fine gold chains instead of strings — a gold-chain halter, gold chain across her back and gold-chain sides on a tiny thong bottom. Her back, waist and legs are bare."),
    "tulum-crochet-bikini": (6203, "D", "beachclub",
        "She wears the Tulum bikini in ivory: a tiny hand-crochet triangle bikini with lined cups, long crochet ties finished with shell beads, and a crochet thong bottom tied high on her hips. Her back, waist and legs are bare."),
    "saint-tropez-cutout-monokini": (6204, "C", "yacht",
        "She wears the Saint-Tropez monokini in white: a white one-piece swimsuit plunging to her navel with large cut-outs baring her waist and hips, joined only by a narrow centre panel, and a thong back. Her back and legs are bare."),
    "capri-wetlook-bandeau": (6205, "E", "pool",
        "She wears the Capri bikini in black: a tiny strapless black bandeau top and a black thong bottom with high, narrow sides. Her back, waist and legs are bare."),
    "maldives-o-ring-bikini": (6206, "F", "cove",
        "She wears the Maldives bikini in glossy white: a tiny bandeau with a gold ring at the centre and a tiny tanga bottom with gold rings at each hip on thin high side straps; from behind, a cheeky tanga back. Her back, waist and legs are bare."),
    "bora-scrunch-bikini": (6207, "B", "yacht",
        "She wears the Bora bikini in mocha: a tiny ruched mocha triangle top tied at the neck and back, and a ruched scrunch-back mocha bottom with a very high leg. Her back, waist and legs are bare."),
    # ── new: the most daring after dark ──
    "vixen-cutout-bandage-mini": (6301, "D", "lounge",
        "She wears the Vixen dress in black: a bodycon bandage mini dress with sweeping cut-outs across her waist and ribs, a neckline plunging to her navel and a very short hem high on her thighs."),
    "siren-chainmail-mini": (6302, "A", "rooftop",
        "She wears the Siren dress: a draped liquid-gold metal chainmail halter mini dress with a deep cowl neckline, an open back down to the base of her spine and a high side split."),
    "muse-double-slit-gown": (6303, "C", "rooftop",
        "She wears the Muse gown in black satin: a long black satin gown on thin spaghetti straps with a deep V neckline plunging all the way down to her navel, and two thigh-high slits up to her hips, one on each side, showing both of her bare legs; the back is open down to her waist."),
    "desire-latex-micro-dress": (6304, "F", "lounge",
        "She wears the Desire dress in glossy wine latex: a strapless corset-boned mini dress that clings like a second skin, with lace-up sides showing a line of skin from her ribs to her hip and a very short hem."),
    "lola-fringe-micro-dress": (6305, "E", "rooftop",
        "She wears the Lola dress: a champagne beaded fringe mini dress with a plunging halter neckline and open sides, the beaded fringe swinging over her bare thighs."),
    "nightshade-crossstrap-mini": (6306, "B", "lounge",
        "She wears the Nightshade dress in blush satin: a very short blush satin mini dress with a deep V neckline plunging all the way down to her navel, the plunge laced shut with thin criss-crossing blush satin ties like a corset lace-up, so a strip of bare skin shows from her neckline to her navel between lined satin cups; thin straps and an open back."),
    "bijou-crystal-two-piece": (6307, "C", "lounge",
        "She wears the Bijou two-piece: a crystal-embellished ivory bralette with crystal fringe over her bare midriff and a matching crystal mini skirt slit high on one side."),
}


# Extra colourways: the same model, set and seed as the product's main shoot, the design re-coloured. Saved as
# refs/krea/products/<slug>--<colour>-<view>.png; the shop shows them when that colour is picked.
COLORWAYS = {
    ("rose-lace-balconette-bra", "wine"): "She wears the Rosé balconette set in deep wine red: a fully lined deep wine-red floral lace balconette bra with scalloped edges, a deep centre gore and tiny satin bows on each strap, and a matching high-cut wine-red lace brief; from behind, a wide wine lace band with satin hook closure and a cheeky lace back.",
    ("rose-lace-high-waist-brief", "wine"): "She wears the Rosé high-waist brief in dark burgundy wine red (deep dark red, not pink): a high-waisted brief of sheer-panelled dark wine-red floral lace with a scalloped waistband sitting at her navel and dramatic high-cut legs, worn with a tiny matching dark wine-red lace triangle bralette; from behind, a cheeky lace back with a satin bow at the base of her spine.",
    ("camille-satin-bow-bralette", "blush"): "She wears the Camille set in blush pink satin: a soft fully lined blush-pink satin triangle bralette with an oversized satin bow tied at the centre, thin ribbon straps that cross and tie in a bow at her back, and a tiny blush-pink satin tanga with bow sides.",
    ("juliette-lace-bodysuit", "blush"): "She wears the Juliette bodysuit in blush pink: a deep-plunge bodysuit of blush-pink Chantilly lace with fully lined cups, sheer mesh side panels, an extreme high-cut leg and a back open all the way to the waist, finishing in a thong back.",
    ("margot-silk-slip", "wine"): "She wears the Margot slip in deep wine silk: a bias-cut deep wine-red silk chemise with a deep cowl neckline, lace-trimmed slits up to the hip on both sides, a very short hem, and spaghetti straps that cross over a bare, open back.",
    ("amelie-garter-belt", "blush"): "She wears the Amélie garter belt in blush pink: a wide blush-pink lace garter belt sitting on her waist with four satin suspender straps clipped to sheer nude seamed stockings, over a blush-pink lace thong and a blush-pink lace balconette bra.",
}

class QuotaExhausted(Exception):
    pass


def request(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=1200)


def generate(prompt, seed, out):
    data = [
        "text2image", prompt, "", None, None,
        WIDTH, HEIGHT, 4.0, 768, 1.0, 1.0,
        STEPS, 1.0, "euler", "beta",
        seed, False, GPU_BUDGET,
        "__custom_huggingface_base_model__", "Comfy-Org/Krea-2", "diffusion_models/krea2_turbo_fp8_scaled.safetensors", "",
        {"headers": ["repo_id", "filename", "revision", "weight"], "data": []},
        *([0.0] * N_LORA_SLIDERS),
    ]
    event_id = json.load(request(f"{SPACE}/gradio_api/call/_generate_wrapper", json.dumps({"data": data}).encode()))["event_id"]
    result, event = None, None
    with request(f"{SPACE}/gradio_api/call/_generate_wrapper/{event_id}") as stream:
        for raw in stream:
            line = raw.decode().strip()
            if line.startswith("event:"):
                event = line.split(":", 1)[1].strip()
            elif line.startswith("data:") and event in ("complete", "error"):
                result = (event, line.split(":", 1)[1].strip())
                break
    if not result or result[0] == "error":
        msg = result[1] if result else "no result"
        # ZeroGPU rejects quickly with no detail ("null") or a quota message once the daily allowance is used up
        if msg in ("null", "") or "quota" in msg.lower() or "exceeded" in msg.lower():
            raise QuotaExhausted(msg[:200])
        raise RuntimeError(msg[:300])
    gallery, _, _ = json.loads(result[1])
    item = gallery[0]
    img = item.get("image", item) if isinstance(item, dict) else item
    url = img.get("url") or f"{SPACE}/gradio_api/file={img['path']}"
    out.parent.mkdir(parents=True, exist_ok=True)
    with request(url) as r, open(out, "wb") as f:
        f.write(r.read())


def main():
    only = sys.argv[1:]
    todo = [s for s in PRODUCTS if not only or s in only]
    done = skipped = 0
    for slug in todo:
        seed, model, scene, design = PRODUCTS[slug]
        for view, framing in VIEWS.items():
            out = OUT / f"{slug}-{view}.png"
            if out.exists():
                skipped += 1
                continue
            prompt = STYLE + BEAUTY + MODELS[model] + SETS[scene] + framing + design + " " + (ONLY_THE_SET if CATALOG[slug]["category"] != "after-dark" and slug not in WITH_COVER else "") + SAFE
            try:
                generate(prompt, seed, out)
            except QuotaExhausted as e:
                print(f"STOPPED: ZeroGPU quota used up ({e}). {done} generated this run — re-run after it resets.", flush=True)
                return
            except (RuntimeError, urllib.error.URLError) as e:
                print(f"✗ {slug}-{view}: {e}", flush=True)
                continue
            done += 1
            print(f"✓ {slug}-{view}", flush=True)
    print(f"finished: {done} generated, {skipped} already there", flush=True)


main()
