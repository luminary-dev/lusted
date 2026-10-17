"""Dress one of the shop's existing model shots in a real product (Krea 2 Identity Edit on the owner's Space
dhanikaa/Krea-2-Turbo_v2, through its Gradio API with the local `hf` login token, which is never printed).

The primary image is the scene to keep (model, pose, room, framing — e.g. refs/krea/products/<slug>-front.png); the
reference is the product photo to copy the garment from. Use the same seed family per product and one call per view
(front / back / side), then save as refs/krea/products/<new-slug>-<view>.png and run import-krea-products.mjs.
Uses the official Krea 2 Turbo weights as a custom base with every LoRA at 0. The browser UI's direct app link runs
anonymously (free runs limit), so go through this API — it uses the account's quota and credits.

usage: python3 scripts/krea-space-edit.py <primary.png> <reference.png> <prompt.txt> <instruction.txt> <seed> <out.png> [steps]"""
import json, mimetypes, pathlib, sys, uuid, urllib.request

SPACE = "https://dhanikaa-krea-2-turbo-v2.hf.space"
TOKEN = pathlib.Path.home().joinpath(".cache/huggingface/token").read_text().strip()
primary, ref, ptxt, itxt, seed, out = sys.argv[1:7]
steps = float(sys.argv[7]) if len(sys.argv) > 7 else 8


def req(url, data=None, ctype="application/json"):
    r = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ctype})
    return urllib.request.urlopen(r, timeout=1200)


def upload(path):
    b = uuid.uuid4().hex
    p = pathlib.Path(path)
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"files\"; filename=\"{p.name}\"\r\n"
            f"Content-Type: {mimetypes.guess_type(p.name)[0] or 'image/png'}\r\n\r\n").encode() + p.read_bytes() + f"\r\n--{b}--\r\n".encode()
    srv = json.load(req(f"{SPACE}/gradio_api/upload", body, f"multipart/form-data; boundary={b}"))[0]
    return {"path": srv, "orig_name": p.name, "meta": {"_type": "gradio.FileData"}}


data = [
    "edit", pathlib.Path(ptxt).read_text().strip(), pathlib.Path(itxt).read_text().strip(),
    upload(primary), upload(ref),
    1024, 1024, 1.4, 768, 1.0, 1.0,
    steps, 1.0, "euler", "beta",
    int(seed), False, 0,
    "__custom_huggingface_base_model__", "Comfy-Org/Krea-2", "diffusion_models/krea2_turbo_fp8_scaled.safetensors", "",
    {"headers": ["repo_id", "filename", "revision", "weight"], "data": []},
    *([0.0] * 18),
]
eid = json.load(req(f"{SPACE}/gradio_api/call/_generate_wrapper", json.dumps({"data": data}).encode()))["event_id"]
print("submitted", eid[:8], flush=True)
event = None
with req(f"{SPACE}/gradio_api/call/_generate_wrapper/{eid}") as s:
    for raw in s:
        line = raw.decode().strip()
        if line.startswith("event:"):
            event = line[6:].strip()
        elif line.startswith("data:") and event in ("complete", "error"):
            payload = line[5:].strip()
            if event == "error":
                sys.exit("error: " + payload[:500])
            res = json.loads(payload)
            img = res[0][0]["image"] if isinstance(res[0], list) else res[0]
            url = img.get("url") or f"{SPACE}/gradio_api/file={img['path']}"
            pathlib.Path(out).write_bytes(req(url).read())
            print("saved", out, "|", str(res[1:])[:200])
            break
