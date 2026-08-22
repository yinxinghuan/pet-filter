#!/usr/bin/env python3
"""
Re-generate ONLY the 3 hybrid demos using:
  1. A cleaner face crop (tighter — head + shoulders only, drops the
     ALTERU PD signage)
  2. A harder hybrid prompt that resists the model's tendency to
     "just replace the head" for complete-anatomy pets like cats/dogs.

Usage:  /Users/yin/miniconda3/bin/python3 gen_hybrid_only.py
"""
import datetime, hashlib, hmac, json, os, ssl, sys, time, urllib.parse, urllib.request, uuid
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

R2_ACCOUNT_ID = os.environ["ALTERU_R2_ACCOUNT_ID"]
R2_ACCESS_KEY = os.environ["ALTERU_R2_ACCESS_KEY_ID"]
R2_SECRET_KEY = os.environ["ALTERU_R2_SECRET_ACCESS_KEY"]
R2_BUCKET = "aigram"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PUBLIC = "https://images.aiwaves.tech"
MEDIA_API_BASE = "https://game.aiwaves.tech/alteru-media/api"
SESSION_ID = "fe0ac62d-462e-42a4-8622-85586a99d133"
API_TIMEOUT = 300
RATE_LIMIT_S = 80
_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def _sign(k, m): return hmac.new(k, m.encode(), hashlib.sha256).digest()


def upload_ref(path):
    with open(path, "rb") as f: data = f.read()
    obj = f"refs/pf-{int(time.time())}-{os.path.basename(path)}"
    host = f"{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    now = datetime.datetime.utcnow()
    amz = now.strftime("%Y%m%dT%H%M%SZ"); date = now.strftime("%Y%m%d")
    ct = "image/jpeg"
    h = hashlib.sha256(data).hexdigest()
    canon_uri = "/" + R2_BUCKET + "/" + urllib.parse.quote(obj, safe="/")
    hdrs = f"content-type:{ct}\nhost:{host}\nx-amz-content-sha256:{h}\nx-amz-date:{amz}\n"
    signed = "content-type;host;x-amz-content-sha256;x-amz-date"
    canon = "\n".join(["PUT", canon_uri, "", hdrs, signed, h])
    scope = f"{date}/auto/s3/aws4_request"
    sts = "\n".join(["AWS4-HMAC-SHA256", amz, scope, hashlib.sha256(canon.encode()).hexdigest()])
    kd = _sign(("AWS4" + R2_SECRET_KEY).encode(), date)
    kr = _sign(kd, "auto"); ks = _sign(kr, "s3"); ksg = _sign(ks, "aws4_request")
    sig = hmac.new(ksg, sts.encode(), hashlib.sha256).hexdigest()
    auth = f"AWS4-HMAC-SHA256 Credential={R2_ACCESS_KEY}/{scope}, SignedHeaders={signed}, Signature={sig}"
    url = f"{R2_ENDPOINT}/{R2_BUCKET}/{urllib.parse.quote(obj, safe='/')}"
    req = urllib.request.Request(url, data=data, method="PUT", headers={
        "Content-Type": ct, "x-amz-content-sha256": h, "x-amz-date": amz,
        "Authorization": auth, "Content-Length": str(len(data)),
    })
    with urllib.request.urlopen(req, timeout=60) as r: r.read()
    return f"{R2_PUBLIC}/{obj}"


def call_api(ref_url, prompt):
    payload = json.dumps({
        "request_id": str(uuid.uuid4()), "session_id": SESSION_ID,
        "mode": "edit", "prompt": prompt,
        "reference_urls": [ref_url], "size": {"width": 1024, "height": 1024},
    }).encode()
    req = urllib.request.Request(f"{MEDIA_API_BASE}/v1/images/generations", data=payload,
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r: task = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:200]}")
    deadline = time.time() + API_TIMEOUT
    while task.get("status") in ("queued", "running"):
        if time.time() > deadline: raise RuntimeError("media_timeout")
        time.sleep(4)
        with urllib.request.urlopen(f"{MEDIA_API_BASE}/v1/tasks/{task['task_id']}", timeout=60) as r:
            task = json.loads(r.read())
    if task.get("status") == "succeeded" and task.get("media", {}).get("url"):
        return task["media"]["url"]
    print(f"  ✗ media task={task}"); return None


def download(url, out):
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as r:
        data = r.read()
    with open(out, "wb") as f: f.write(data)
    print(f"  ✓ {out}  ({os.path.getsize(out) // 1024} KB)")


# Crop a tight face-only ref from the mugshot — drop the sign region.
def make_face_ref():
    src = "/Users/yin/code/games/mugshot-booth/public/demo_mugshot2.jpg"
    out = os.path.join(HERE, "_hybrid_ref_v2.jpg")
    img = Image.open(src).convert("RGB")
    w, h = img.size
    # Mugshot is 768x1024 ish. Head occupies roughly upper-third center.
    # Crop a tight 1:1 around the face: top ~50px to roughly 600px down,
    # center-cropped horizontally to square.
    # We'll heuristic: take the centered top-half-ish square.
    top = int(h * 0.05)
    bottom = int(h * 0.55)
    side = bottom - top
    left = (w - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((1024, 1024), Image.LANCZOS)
    img.save(out, quality=92)
    return out


# Hardened hybrid prompt — pushes much harder on subject preservation,
# explicitly tells the model NOT to redraw the head.
PLATE_STYLE = (
    " Rendered as a 19th-century zoological plate — hand-colored "
    "lithograph or engraving, fine pen-and-ink linework with soft "
    "watercolor wash, in the painterly tradition of John James "
    "Audubon and Ernst Haeckel. Aged cream paper background with "
    "faint foxing. Painterly, traditional — no photography, no 3D, "
    "no neon. 1:1 aspect, no text, no labels, no sign, no border. "
    "DO NOT include any plaque, ID number, or written text in the image."
)


def hybrid(features):
    return (
        "A 19th-century zoological plate of a HYBRID creature — mostly the "
        "species, with the man from the reference photo recognizable "
        "underneath only on careful inspection. "
        "CRITICAL ANCHOR: The EYES must remain UNMISTAKABLY HUMAN — "
        "forward-facing, almond-shape, with visible white SCLERA, eyelids, "
        "eyebrows, and an expressive human gaze. The eyes are the soul of "
        "identity. DO NOT replace them with full animal eyes. "
        "Keep his HUMAN SHOULDERS and the broad shape of his face visible. "
        f"Transform him this way: {features} "
        "Balance target: animal features dominate the surface (~70%), but "
        "his human eyes + brow ridge + jawline + shoulders anchor identity "
        "(~30%) so a careful viewer recognizes the same person. "
        "DO NOT include any plaque, ID number, or written text."
        + PLATE_STYLE
    )


JOBS = [
    {
        "out": "public/demo_pet_cat.jpg",
        "feats": "full tabby cat fur covers cheeks, forehead, jaw, chin — "
                 "almost no human skin visible. LARGE triangular tabby cat "
                 "ears rise from the top of the head replacing the hair. A "
                 "small pink cat nose triangle. Long white whiskers. BUT "
                 "the EYES STAY HUMAN — round, forward-facing, with visible "
                 "white sclera and human eyebrows above them. The man's "
                 "shoulders and brow ridge anchor him underneath.",
    },
    {
        "out": "public/demo_pet_capybara.jpg",
        "feats": "coarse brown capybara fur covers the entire face and "
                 "neck, no human skin visible. Small rounded capybara ears "
                 "on top of the head replace the hair. A slightly blunted "
                 "broad nose. BUT the EYES STAY HUMAN — round, forward-"
                 "facing, with visible white sclera and human eyebrows. "
                 "The man's shoulders and broad jaw shape anchor him.",
    },
    {
        "out": "public/demo_pet_octopus.jpg",
        "feats": "a LARGE bulbous violet octopus mantle dominates the top "
                 "and back of the head, fully replacing the skull and hair, "
                 "thick purple suckered tentacles cascade down around the "
                 "head and over the shoulders, mottled green-purple "
                 "chromatophore skin covers cheeks. BUT the EYES STAY "
                 "HUMAN — round, forward-facing, with visible white sclera "
                 "and human eyebrows. Shoulders + lower jaw still his.",
    },
]


def main():
    ref_path = make_face_ref()
    print(f"face ref: {ref_path}")
    print("uploading…")
    ref_url = upload_ref(ref_path)
    print(f"  ✓ {ref_url}")

    last = 0
    for i, j in enumerate(JOBS):
        out_path = os.path.join(HERE, j["out"])
        print(f"\n[{i+1}/{len(JOBS)}] {j['out']}")
        wait = RATE_LIMIT_S - (time.time() - last)
        if wait > 0:
            print(f"  ⏳ rate-limit {wait:.0f}s")
            time.sleep(wait)
        retries = 3
        while retries > 0:
            try:
                last = time.time()
                gen_url = call_api(ref_url, hybrid(j["feats"]))
                if gen_url is None: break
                download(gen_url, out_path)
                break
            except RuntimeError:
                print("  ⏳ 30s back-off"); time.sleep(30); retries -= 1
            except Exception as e:
                print(f"  ✗ {e}"); break


if __name__ == "__main__":
    main()
