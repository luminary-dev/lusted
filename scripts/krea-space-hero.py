"""Generate Lusted hero images on the owner's private Space dhanikaa/Krea-2-Turbo_v2.

Usage: python3 scripts/krea-space-hero.py <look 1-8> <out.png> [seed] [steps] [gpu_budget]
Uses the official Krea 2 Turbo weights (Comfy-Org/Krea-2, fp8) as a custom base model and leaves every
LoRA/slider at 0, so output stays clean fashion photography. Reads the local `hf` login token; never prints it.
"""
import json
import pathlib
import sys
import urllib.request

SPACE = "https://dhanikaa-krea-2-turbo-v2.hf.space"
TOKEN = pathlib.Path.home().joinpath(".cache/huggingface/token").read_text().strip()
WIDTH, HEIGHT = 2048, 1152  # 16:9, the largest the Space allows
N_LORA_SLIDERS = 18  # catalog slider inputs after the custom-LoRA table — all left at 0

LOOK = (
    "Ethereal, dreamy, sensual luxury fashion campaign photograph for a lingerie and swimwear boutique, sexy high-glamour "
    "editorial mood, as if shot through a Black Pro-Mist 1/2 diffusion filter: soft-focus glow, highlights blooming into a "
    "warm haze, low contrast with lifted milky shadows, gentle pastel colour grade, creamy bokeh, 85mm portrait lens at f/1.4, "
    "ultra-detailed, sharp eyes, clean noise-free image. "
    "She is a breathtaking, goddess-like woman in her mid-twenties with the face of a Miss Universe winner: symmetrical refined "
    "features, high sculpted cheekbones, almond-shaped honey-brown eyes with long lashes and soft smoky makeup, full glossy "
    "lips, long voluminous glossy dark-brown hair. Flawless porcelain-smooth glass skin, airbrushed-soft and even golden-olive, "
    "with a dewy luminous glow, no freckles, no moles, no blemishes. Slim, toned hourglass figure with a defined waist, elegant "
    "collarbones and long legs, poised like a runway model. "
)
FRAME = (
    " Wide 16:9 composition: she occupies the right 40% of the frame with her face about 70% from the left edge in the upper "
    "third; the left half is soft, uncluttered, glowing negative space for headline text; the bottom-right corner stays soft "
    "and simple. Sensual but non-explicit fashion photography — revealing cuts, but no nudity."
)

LOOKS = {
    1: "Scene — blush lace lingerie: she reclines seductively against plush blush silk-satin pillows on a cloud-soft bed, one "
    "arm raised behind her head, her body in a slow S-curve, eyes half-lidded with a smouldering gaze into the lens, lips softly "
    "parted. She wears a fully lined blush-pink floral lace balconette bra with tiny satin bows, a matching high-waist lace brief "
    "and lace suspender straps. Sheer ivory curtains glow behind her, pink garden roses blur in the foreground, warm morning "
    "light wraps her in a pink haze with rim light in her hair.",
    2: "Scene — barely-there wine lace bodysuit at dusk: alone in a candlelit boudoir, she kneels on a deep-wine velvet chaise "
    "by a tall window, back arched and hips turned, one hand sliding up into her hair and the other resting on her bare thigh, "
    "glancing over her shoulder into the lens with a slow, seductive, smouldering look and parted lips. She wears a daring "
    "deep wine-red lace and silk-satin bodysuit with a neckline plunging almost to the navel, small lined lace cups, sheer "
    "lace side panels, a corset-boned waist, a cut-out open back with crossing satin straps, one strap slipping off her "
    "shoulder, an extreme high-cut thong-style leg that bares her hips, and matching lace garter straps to sheer wine "
    "stockings. Deep burgundy velvet drapes, warm candle bokeh and the last rose-gold light of dusk glowing through sheer "
    "curtains on the left, no other people.",
    3: "Scene — string bikini on a yacht: she sits on the sun-warmed teak deck of a luxury yacht, leaning back on her hands, "
    "face tilted to the sun with closed eyes and a blissful, sensual expression, wet hair slicked back. She wears a daring, "
    "barely-there ivory textured string triangle bikini with small gold ring details and high-cut tie-side bottoms. Glistening "
    "sun-kissed skin with sparkling water droplets, turquoise Mediterranean sea and a hazy golden coastline blurred behind, "
    "golden-hour backlight rimming her body.",
    4: "Scene — barely-there gold swimsuit in an infinity pool: alone at a private infinity pool at sunset, she rises from the "
    "water onto the glowing edge, sitting with her back arched and both arms raised, fingers sliding through her wet slicked-back "
    "hair, lips parted, gazing into the lens with a slow, teasing, come-hither look. She wears a daring liquid-gold metallic "
    "one-piece swimsuit with a plunge cut almost to the navel, dramatic open sides held only by thin gold rings, a scooped low "
    "back and an extreme high-cut leg that bares her hips. Wet, glistening sun-kissed skin with sparkling droplets running down "
    "her collarbones and long legs. A glowing peach-and-rose sunset sky and soft ocean horizon dissolve into warm haze behind her, "
    "golden reflections dancing on the water, no other people.",
    5: "Scene — barely-there evening dress after midnight: alone in a dim, candlelit private rooftop lounge — an empty room, no "
    "other people — she reclines back across a deep-wine velvet chaise, one long leg stretched out through a thigh-high slit, "
    "the other knee raised, head tilted back with a slow, naughty, smouldering half-smile into the lens, fingertips trailing "
    "down from her collarbone, a coupe of champagne dangling loosely from her other hand, gold hoop earrings and a fine gold "
    "body chain at her waist. She wears a provocative, barely-there blush-champagne sequin slip dress with a neckline plunging "
    "almost to the waist, thin spaghetti straps slipping off one shoulder, a fully open back and a daring slit cut to the hip, "
    "the short hem riding high on her bare thighs, shimmering in the candlelight. Only flickering candles, smoky-gold mirror "
    "panels and blurred city lights dissolve into warm amber bokeh behind her.",
    6: "Scene — sheer black lace after the bath: alone in a candlelit black-marble bathroom softly filled with steam, she leans "
    "back against the rim of a freestanding stone bathtub, one knee raised, head tilted back with a slow, smouldering, "
    "half-lidded gaze into the lens, fingertips tracing the edge of her plunging neckline, damp glossy waves falling over one "
    "shoulder. She wears a daring black lace and sheer mesh bodysuit with small fully lined lace cups, a neckline plunging to "
    "the navel, sheer mesh side panels running down to an extreme high-cut leg that bares her hips, thin strappy cut-outs "
    "across the waist and an open back, with a sheer black silk-chiffon robe slipping off both shoulders and pooling at her "
    "elbows. Droplets of water glisten on her collarbones and thighs. Warm golden candlelight, soft steam haze, black-and-gold "
    "veined marble and a few rose petals blurred in the foreground, no other people.",
    7: "Scene — crimson micro string bikini at golden hour: alone in a deserted cove of fine pale sand, she kneels at the water's "
    "edge as a gentle wave foams around her knees, back arched and hips turned, one hand pushing her wet hair back from her face, "
    "lips parted, gazing into the lens with a slow, teasing, come-hither look. She wears the most daring, barely-there crimson-red "
    "micro string bikini: tiny fully lined triangle cups only just covering her, held on by nothing but whisper-thin strings that "
    "wrap around her neck and back, a minimal micro thong bottom with thin string sides tied in small bows high on her bare "
    "hips, and delicate gold body chains draped across her waist — almost all of her sun-kissed body bare. Wet, glistening "
    "skin with sparkling droplets running down her collarbones, waist and long legs, a low warm sun flaring behind her, glowing "
    "turquoise water and a pastel peach sky melting into hazy bokeh, no other people.",
    8: "Scene — ivory lace bustier on a moonlit terrace: alone on a private villa terrace at blue hour, she leans back against a "
    "stone balustrade, one arm draped along it and the other hand resting low on her hip, chin lowered, gazing up into the "
    "lens through her lashes with a soft, seductive, knowing smile. She wears a daring ivory Chantilly lace bustier with fully "
    "lined balconette cups, a deep plunge between them, a corset-boned waist and sheer lace panels, a matching barely-there "
    "high-cut lace thong brief, lace suspender straps to sheer ivory thigh-high stockings, and a long sheer ivory chiffon robe "
    "streaming off her shoulders in a warm breeze. Warm lantern light glows on her skin against the deep-blue dusk, a softly "
    "blurred sea and twinkling coastline lights behind her, white jasmine out of focus in the foreground, no other people.",
}


def request(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=1200)


def main():
    if len(sys.argv) < 3 or int(sys.argv[1]) not in LOOKS:
        sys.exit(__doc__)
    n, out = int(sys.argv[1]), sys.argv[2]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 2026
    steps = int(sys.argv[4]) if len(sys.argv) > 4 else 12
    budget = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    prompt = LOOK + LOOKS[n] + FRAME
    data = [
        "text2image", prompt, "", None, None,
        WIDTH, HEIGHT, 4.0, 768, 1.0, 1.0,
        steps, 1.0, "euler", "beta",
        seed, False, budget,
        "__custom_huggingface_base_model__", "Comfy-Org/Krea-2", "diffusion_models/krea2_turbo_fp8_scaled.safetensors", "",
        {"headers": ["repo_id", "filename", "revision", "weight"], "data": []},
        *([0.0] * N_LORA_SLIDERS),
    ]
    event_id = json.load(request(f"{SPACE}/gradio_api/call/_generate_wrapper", json.dumps({"data": data}).encode()))["event_id"]
    print("submitted look", n, f"{WIDTH}x{HEIGHT}", "steps", steps, "seed", seed, flush=True)
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
        sys.exit(f"space error: {result[1][:500] if result else 'no result'}")
    gallery, status, used_seed = json.loads(result[1])
    item = gallery[0]
    img = item.get("image", item) if isinstance(item, dict) else item
    url = img.get("url") or f"{SPACE}/gradio_api/file={img['path']}"
    pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
    with request(url) as r, open(out, "wb") as f:
        f.write(r.read())
    print("saved", out, "| status:", str(status)[:200], "| seed", used_seed, flush=True)


main()
