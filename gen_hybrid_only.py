#!/usr/bin/env python3
"""
Re-generate ONLY the 3 hybrid demos using:
  1. A cleaner face crop (tighter — head + shoulders only, drops the
     ALTERU PD signage)
  2. A harder hybrid prompt that resists the model's tendency to
     "just replace the head" for complete-anatomy pets like cats/dogs.

Usage:  /Users/yin/miniconda3/bin/python3 gen_hybrid_only.py
"""
import datetime, hashlib, hmac, json, os, ssl, sys, time, urllib.parse, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

R2_ACCOUNT_ID = "[removed-r2-account-id]"
R2_ACCESS_KEY = "[removed-r2-access-key]"
R2_SECRET_KEY = "[removed-r2-secret-key]"
R2_BUCKET = "aigram"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PUBLIC = "https://images.aiwaves.tech"
API_URL = "http://aiservice.wdabuliu.com:8019/genl_image"
API_TIMEOUT = 120
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
    payload = json.dumps({"query": "", "params": {"url": ref_url, "prompt": prompt}}).encode()
    req = urllib.request.Request(API_URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=API_TIMEOUT) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:200]}")
    code = res.get("code")
    if code == 200: return res["url"]
    if code == 429: raise RuntimeError("rate_limit")
    print(f"  ✗ code={code}"); return None


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
        "A 19th-century zoological plate of an anthropomorphic HYBRID human. "
        "The subject is the man in the reference photo — KEEP HIS face "
        "structure, skin tone, eyebrows, hairline, jawline, eye placement, "
        "and human shoulders fully visible and RECOGNIZABLE. He is NOT a "
        "pure animal; he is a man with hybrid features grafted onto his "
        "existing human face. "
        f"Add to his head ONLY: {features} "
        "His face must remain ~70% human and ~30% creature. The viewer "
        "must instantly recognize the same man, transformed."
        + PLATE_STYLE
    )


JOBS = [
    {
        "out": "public/demo_pet_cat.jpg",
        "feats": "small triangular tabby cat ears emerging from his hair, "
                 "soft tabby-fur sideburns blending into his cheek stubble, "
                 "delicate whiskers near the corners of his human mouth, "
                 "his eyes now feline-almond yellow-green but still HIS eyes.",
    },
    {
        "out": "public/demo_pet_capybara.jpg",
        "feats": "soft coarse brown capybara fur growing on his cheeks and "
                 "jawline like a beard, small rounded capybara ears in his "
                 "hair, a slightly blunted nose, sleepy half-closed but "
                 "still HUMAN eyes.",
    },
    {
        "out": "public/demo_pet_octopus.jpg",
        "feats": "a bulbous violet octopus mantle rising from the top of his "
                 "head like a hat, small suckered tentacles curling down "
                 "from where his hair was, a few faint chromatophore spots "
                 "on his cheeks, but his face stays human and recognizable.",
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
