"""Generate the sale bikinis' product photos (front + back, 9:16) on the owner's private Space dhanikaa/Krea-2-Turbo_v2.

Usage: python3 scripts/krea-space-bikini.py <bikini 1-4> [steps]
Writes refs/krea/bikini/<slug>-<front|back|side>.png, skipping views that already exist. Each pair shares a seed and an identical model
description so the front and back read as the same woman. Same settings as scripts/krea-space-hero.py (official
Krea 2 Turbo fp8 base, every LoRA/slider at 0). Reads the local `hf` login token; never prints it.
"""
import json
import pathlib
import sys
import urllib.request

SPACE = "https://dhanikaa-krea-2-turbo-v2.hf.space"
TOKEN = pathlib.Path.home().joinpath(".cache/huggingface/token").read_text().strip()
WIDTH, HEIGHT = 1152, 2048  # 9:16 portrait
N_LORA_SLIDERS = 18
OUT = pathlib.Path(__file__).resolve().parent.parent / "refs/krea/bikini"

STYLE = (
    "Ultra-realistic luxury swimwear campaign photograph, sexy high-glamour editorial, as if shot on a medium-format camera "
    "with an 85mm lens at f/2: soft golden-hour sunlight, gentle warm haze, creamy bokeh, true-to-life colour, ultra-detailed "
    "fabric texture, sharp eyes, clean noise-free image. "
)
MODEL = (
    "The model is a breathtaking, goddess-like woman in her mid-twenties with the face of a Miss Universe winner: symmetrical "
    "refined features, high sculpted cheekbones, almond-shaped honey-brown eyes with long lashes and soft smoky makeup, full "
    "glossy lips, long voluminous glossy dark-brown hair in loose waves. Flawless glass-smooth sun-kissed golden-olive skin "
    "glistening with a little oil and a few water droplets, no freckles, no moles, no blemishes. Slim, toned hourglass figure "
    "with a tiny defined waist, curvy hips and long legs, poised like a runway model. "
)
SET = (
    "Setting: the sun-drenched white limestone terrace of a private Mediterranean villa, a softly blurred turquoise sea and "
    "pale sky behind her, no other people. "
)
FRONT = (
    "Full-length 9:16 portrait, FRONT VIEW: she stands facing the camera, weight on one hip, one hand sliding into her hair "
    "and the other resting on her hip, gazing straight into the lens with a slow, confident, seductive half-smile. Framed "
    "from the top of her head to just above her knees, centred, the whole bikini clearly visible. "
)
BACK = (
    "Full-length 9:16 portrait, BACK VIEW: she stands with her back to the camera, one knee softly bent, looking back over "
    "her shoulder into the lens with a teasing, seductive smile, hair swept over one shoulder so the back of the bikini is "
    "clearly visible. Framed from the top of her head to just above her knees, centred. "
)
SIDE = (
    "Full-length 9:16 portrait, SIDE VIEW: she stands in profile on the terrace, body turned to the side, back gently "
    "arched, face turned towards the lens over her shoulder with a seductive look, showing the bikini's side ties and "
    "high-cut silhouette; framed from the top of her head to just above her knees. "
)
SAFE = (
    "Revealing, daring swimwear catalogue photography — tiny cuts and thong backs, but every intimate area is fully covered "
    "by the lined bikini fabric: no nudity, no see-through."
)

BIKINIS = {
    1: {
        "slug": "pearl-seduction-bikini",
        "seed": 4101,
        "front": "She wears the Seraphina bikini: a barely-there ivory satin micro string bikini — tiny fully lined triangle cups "
        "held by strands of lustrous pearls instead of straps, pearl strands looping around her neck and draping across her "
        "collarbones, and a minimal ivory micro bottom with pearl-strand sides sitting high on her bare hips. ",
        "back": "She wears the Seraphina bikini: from behind, the ivory top is held only by a single strand of pearls across "
        "her bare back and a pearl halter at the neck; the ivory bottom is a minimal pearl-strand thong — a narrow satin "
        "back with strands of pearls over her bare hips. ",
    },
    2: {
        "slug": "scarlet-sin-bikini",
        "seed": 4202,
        "front": "She wears the Scarlet bikini: a provocative crimson-red micro bikini — tiny fully lined plunge triangle cups "
        "linked at the centre by a polished gold ring, a second gold ring at each hip joining thin crimson straps, and an "
        "extreme high-cut, cheeky micro bottom with dramatic side cut-outs that bare her hips. ",
        "back": "She wears the Scarlet bikini: from behind, thin crimson ties cross her bare back from a gold ring between her "
        "shoulder blades; the bottom is a crimson thong back with gold rings on each hip, sitting high on her bare hips. ",
    },
    3: {
        "slug": "noir-temptress-bikini",
        "seed": 4303,
        "front": "She wears the Noir bikini: a daring black micro triangle bikini with a strappy harness — tiny fully lined "
        "black triangle cups, thin black straps criss-crossing her ribs and stomach in a geometric harness with small gold "
        "buckles, and a minimal black micro bottom with double straps riding high on her bare hips. ",
        "back": "She wears the Noir bikini: from behind, a web of thin black harness straps criss-crosses her bare back to a "
        "small gold ring at the centre; the bottom is a minimal black G-string back with double straps high on her hips. ",
    },
    4: {
        "slug": "golden-goddess-bikini",
        "seed": 4404,
        "front": "She wears the Solene bikini: a scandalous liquid-gold metallic micro bikini — a tiny fully lined twisted "
        "bandeau top with a gold O-ring at the centre, fine gold body chains draped across her waist and hips, and an "
        "ultra-high-cut tie-side micro bottom in shimmering liquid gold, the ties knotted high on her bare hips. ",
        "back": "She wears the Solene bikini: from behind, the gold bandeau is held by a single thin tie across her bare back "
        "with gold body chains looping over her lower back and hips; the bottom is a shimmering liquid-gold thong back with "
        "tie sides knotted high on her hips. ",
    },
}


def request(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=1200)


def generate(prompt, seed, steps, out):
    data = [
        "text2image", prompt, "", None, None,
        WIDTH, HEIGHT, 4.0, 768, 1.0, 1.0,
        steps, 1.0, "euler", "beta",
        seed, False, 0,
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
        sys.exit(f"space error: {result[1][:500] if result else 'no result'}")
    gallery, status, _ = json.loads(result[1])
    item = gallery[0]
    img = item.get("image", item) if isinstance(item, dict) else item
    url = img.get("url") or f"{SPACE}/gradio_api/file={img['path']}"
    out.parent.mkdir(parents=True, exist_ok=True)
    with request(url) as r, open(out, "wb") as f:
        f.write(r.read())
    print("saved", out.name, "|", str(status)[:120], flush=True)


def main():
    if len(sys.argv) < 2 or int(sys.argv[1]) not in BIKINIS:
        sys.exit(__doc__)
    b = BIKINIS[int(sys.argv[1])]
    steps = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    for view, framing, look in (("front", FRONT, "front"), ("back", BACK, "back"), ("side", SIDE, "front")):
        out = OUT / f"{b['slug']}-{view}.png"
        if out.exists():
            continue
        generate(STYLE + MODEL + SET + framing + b[look] + SAFE, b["seed"], steps, out)


main()
