"""Generate Lusted hero images via the RioShiina/ImageGen Hugging Face Space (Krea 2).

Usage: python3 scripts/krea-hero.py <prompt 1-5> <out.png> [model] [width] [height] [seed]
  e.g. python3 scripts/krea-hero.py 2 refs/krea/hero-2.png Krea-2-Turbo 2048 1152 2026
Uses the local `hf` login token (~/.cache/huggingface/token) for ZeroGPU quota; never prints it.
"""
import json
import pathlib
import sys
import urllib.request

BASE = "https://rioshiina-imagegen.hf.space/gradio_api"
TOKEN = pathlib.Path.home().joinpath(".cache/huggingface/token").read_text().strip()

# Every prompt is built from the same layers so the set reads as one campaign:
# dreamy treatment -> goddess face -> skin -> figure -> scene -> composition.
DREAMY = (
    "Ethereal, dreamy, romantic luxury lingerie campaign photograph with a sexy, high-glamour mood, as if shot through a "
    "Black Pro-Mist 1/2 diffusion filter: soft-focus Orton glow, highlights blooming into a warm rosy haze, low contrast with "
    "lifted milky shadows, airy slightly overexposed whites, gentle pastel blush colour grade, faint golden light leaks, a "
    "luminous dream-sequence atmosphere. Clean, smooth, noise-free image with soft creamy bokeh, 85mm portrait lens at f/1.4."
)
FACE = (
    "She is a breathtaking, goddess-like woman in her mid-twenties with the face of a Miss Universe winner: symmetrical, "
    "refined features, high sculpted cheekbones, a softly defined jawline, almond-shaped honey-brown eyes with long fluttery "
    "lashes and soft smoky champagne eyeshadow, perfectly groomed brows, full glossy nude-pink lips, and long voluminous glossy "
    "espresso-brown hair in soft Hollywood waves with a luminous sheen."
)
SKIN = (
    "Her skin is flawless, porcelain-smooth glass skin: airbrushed-soft and perfectly even golden-olive in tone, with a dewy, "
    "luminous glow on her cheekbones, shoulders and collarbones, no freckles, no moles, no visible pores, retouched like a "
    "luxury cosmetics campaign."
)
FIGURE = (
    "She has a slim, toned hourglass figure with a defined waist, elegant collarbones, a long graceful neck, slender arms and "
    "long legs, poised like a runway model."
)
FRAME = (
    "Wide 16:9 composition: she occupies the right 40% of the frame with her face about 70% from the left edge, in the upper "
    "third; the left half is soft, uncluttered, glowing negative space for headline text; the bottom-right corner stays soft "
    "and simple. Tasteful, elegant and non-explicit."
)


def build(scene):
    return " ".join([DREAMY, FACE, SKIN, FIGURE, scene, FRAME])


PROMPTS = {
    1: build(
        "Scene: she reclines languidly against plush blush silk-satin pillows on a cloud-like bed, propped on one elbow, one "
        "hand sliding slowly into her hair, her body in a graceful S-curve, eyes half-lidded with a soft, sultry, inviting gaze "
        "straight into the lens and lips gently parted. She wears a fully lined blush-pink floral lace balconette bra with tiny "
        "satin bows and delicate straps, with a matching lace high-waist brief. Warm morning sunlight pours through billowing "
        "sheer ivory curtains on the left, wrapping her in a glowing pink haze with a halo of rim light through her hair; "
        "dreamy out-of-focus blush garden roses glow in the lower-right corner."
    ),
    2: build(
        "Scene: she lies on her front on flowing silk and turns to look back over her bare, glowing shoulder straight into the "
        "lens, chin resting near her shoulder, lashes lowered, lips softly parted in a sultry pout. She wears a blush-pink lined "
        "lace balconette bra with satin bow details. Around her, enormous sculptural waves of blush, rose and deep-wine silk "
        "sweep diagonally through the frame like a dream, glossy highlights rolling along every fold, and a faint luminous halo "
        "arcs behind her. Soft diffused key light from the front-left; the left half is a smooth, glowing ivory-to-blush silk "
        "gradient."
    ),
    3: build(
        "Scene: she sits on the edge of a bed of blush satin sheets bathed in golden-hour backlight, one long leg extended and "
        "the other tucked beneath her, leaning back on one hand while the fingertips of the other trace her collarbone, head "
        "tilted with a slow, knowing smile. She wears a blush embroidered tulle plunge bra and matching high-waist brief, fully "
        "lined, with fine satin straps. Tall sheer ivory curtains glow on the left like sunlight through clouds, a golden halo "
        "outlines her hair and shoulders, and soft blush peonies dissolve into the lower-right background."
    ),
    4: build(
        "Evening variation with deeper, richer tones and a velvety glow. Scene: wearing deep berry lips, she reclines against "
        "tufted deep-wine velvet cushions on a bed draped in burgundy satin, one arm raised behind her head, her body angled "
        "three-quarters toward the camera with a smouldering, confident gaze. She wears a deep ruby-red fully lined floral lace "
        "balconette bra with satin bows and fine gold sliders. Warm candlelight from the right gives her skin a molten golden "
        "glow; the left half dissolves into dark velvet and soft amber candle bokeh; a few red rose petals rest softly in the "
        "lower-right corner."
    ),
    5: build(
        "Scene: she stands by a tall window, half-turned toward the camera, a blush silk-satin kimono robe with wide lace cuffs "
        "slipping off one shoulder to reveal the strap of a blush lace bralette, one hand holding the edge of the robe, her "
        "head tilted with a soft, inviting gaze. Diffused window light makes the silk shimmer and her skin glow like warm "
        "porcelain; sheer blush curtains and a pale plaster wall melt into a dreamy haze on the left; a dusty-rose velvet "
        "armchair blurs softly in the lower right."
    ),
}

NEGATIVE = (
    "freckles, moles, beauty marks, visible pores, skin texture, rough skin, oily shine, blemishes, acne, wrinkles, veins, "
    "tan lines, body hair, film grain, noise, sharp crunchy details, harsh contrast, harsh shadows, flat lighting, cold "
    "colours, plastic skin, waxy doll-like face, uncanny, distorted face, asymmetrical eyes, cross-eyed, extra fingers, "
    "deformed hands, extra limbs, bad anatomy, text, watermark, logo, signature, frame, border, collage, cartoon, "
    "illustration, 3d render, cgi, low resolution, blurry face, jpeg artifacts, oversaturated, cluttered background, busy "
    "left side, subject centered, cropped head, nudity, nipples, see-through, explicit"
)


def request(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=900)


def main():
    if len(sys.argv) < 3 or int(sys.argv[1]) not in PROMPTS:
        sys.exit(__doc__)
    n, out = int(sys.argv[1]), sys.argv[2]
    model = sys.argv[3] if len(sys.argv) > 3 else "Krea-2-Turbo"
    width = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
    height = int(sys.argv[5]) if len(sys.argv) > 5 else 1152
    seed = int(sys.argv[6]) if len(sys.argv) > 6 else 2026
    params = {
        "task_type": "txt2img",
        "model": model,
        "prompt": PROMPTS[n],
        "negative_prompt": NEGATIVE,
        "width": width,
        "height": height,
        "seed": seed,
        "batch_size": 1,
        "zero_gpu_duration": 120,
    }
    body = json.dumps({"data": [json.dumps(params)]}).encode()
    event_id = json.load(request(f"{BASE}/call/run", body))["event_id"]
    print("submitted prompt", n, event_id, model, f"{width}x{height}", "seed", seed, flush=True)

    result, event = None, None
    with request(f"{BASE}/call/run/{event_id}") as stream:
        for raw in stream:
            line = raw.decode().strip()
            if line.startswith("event:"):
                event = line.split(":", 1)[1].strip()
            elif line.startswith("data:") and event in ("complete", "error"):
                result = (event, line.split(":", 1)[1].strip())
                break
    if not result or result[0] == "error":
        sys.exit(f"space error: {result}")
    task = json.loads(result[1])[0]
    if task.get("status") != "completed":
        sys.exit(f"task failed: {json.dumps(task)[:600]}")
    pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
    with request(task["result"]["images"][0]) as r, open(out, "wb") as f:
        f.write(r.read())
    print("saved", out, "in", task["result"].get("execution_time_seconds"), "s", flush=True)


main()
