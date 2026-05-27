#!/usr/bin/env python3
"""
Generate 3 demo pet portraits for the Pet Filter frontispiece.

Uses a generic human face as the ref_url anchor; img2img reclassifies
that face as a cat / capybara / octopus following the SAME prompt
pattern shipped in src/PetFilter/utils/pets.ts (subject-agnostic scene
description).

Pre-generated so off-platform / first-time-user views can show actual
photographic output, not engraving placeholders.

Usage:
  /Users/yin/miniconda3/bin/python3 gen_demo_portraits.py
"""
import datetime
import hashlib
import hmac
import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# ── R2 ───────────────────────────────────────────────────────────────────
R2_ACCOUNT_ID  = "[removed-r2-account-id]"
R2_ACCESS_KEY  = "[removed-r2-access-key]"
R2_SECRET_KEY  = "[removed-r2-secret-key]"
R2_BUCKET      = "aigram"
R2_ENDPOINT    = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PUBLIC      = "https://images.aiwaves.tech"

API_URL      = "http://aiservice.wdabuliu.com:8019/genl_image"
API_TIMEOUT  = 120
RATE_LIMIT_S = 80

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def upload_ref(path: str) -> str:
    """Sign + PUT to R2, return the public images.aiwaves.tech URL."""
    with open(path, "rb") as f:
        data = f.read()
    obj_key   = f"refs/pf-demo-{int(time.time())}-{os.path.basename(path)}"
    host      = f"{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    now       = datetime.datetime.utcnow()
    amz_date  = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    region, service = "auto", "s3"

    ct = "image/jpeg" if path.lower().endswith(("jpg", "jpeg")) else "image/png"
    content_hash = hashlib.sha256(data).hexdigest()
    canon_uri = "/" + R2_BUCKET + "/" + urllib.parse.quote(obj_key, safe="/")

    canon_headers = (
        f"content-type:{ct}\n"
        f"host:{host}\n"
        f"x-amz-content-sha256:{content_hash}\n"
        f"x-amz-date:{amz_date}\n"
    )
    signed = "content-type;host;x-amz-content-sha256;x-amz-date"
    canon_req = "\n".join(["PUT", canon_uri, "", canon_headers, signed, content_hash])

    cred_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    sts = "\n".join([
        "AWS4-HMAC-SHA256", amz_date, cred_scope,
        hashlib.sha256(canon_req.encode()).hexdigest(),
    ])
    k_date    = _sign(("AWS4" + R2_SECRET_KEY).encode(), date_stamp)
    k_region  = _sign(k_date, region)
    k_service = _sign(k_region, service)
    k_signing = _sign(k_service, "aws4_request")
    sig = hmac.new(k_signing, sts.encode(), hashlib.sha256).hexdigest()
    auth = (
        f"AWS4-HMAC-SHA256 Credential={R2_ACCESS_KEY}/{cred_scope}, "
        f"SignedHeaders={signed}, Signature={sig}"
    )
    url = f"{R2_ENDPOINT}/{R2_BUCKET}/{urllib.parse.quote(obj_key, safe='/')}"
    req = urllib.request.Request(url, data=data, method="PUT", headers={
        "Content-Type":         ct,
        "x-amz-content-sha256": content_hash,
        "x-amz-date":           amz_date,
        "Authorization":        auth,
        "Content-Length":       str(len(data)),
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        r.read()
    return f"{R2_PUBLIC}/{obj_key}"


def call_api(ref_url: str, prompt: str) -> str | None:
    payload = json.dumps({
        "query": "",
        "params": {"url": ref_url, "prompt": prompt},
    }).encode()
    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=API_TIMEOUT) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        sys.exit(f"ERROR HTTP {e.code}: {body[:200]}")
    code = result.get("code")
    if code == 200:
        return result["url"]
    if code == 429:
        raise RuntimeError("rate_limit")
    print(f"  ✗ API returned code={code} body={result}")
    return None


def download(url: str, out_path: str) -> None:
    print(f"  ↓ downloading…")
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as resp:
        data = resp.read()
    with open(out_path, "wb") as f:
        f.write(data)
    kb = os.path.getsize(out_path) // 1024
    print(f"  ✓ {out_path}  ({kb} KB)")


# ── Build a synthetic 1:1 ref ────────────────────────────────────────────
# We don't have an embedded stock face; use a soft warm-cream tile that
# the API will treat as a 1:1 condition. img2img with a non-face ref
# means the model leans entirely on the SCENE prompt — fine for demo
# purposes where there's no specific subject to preserve. The
# subject-agnostic prompt pattern ("a portrait of a [pet], the subject's
# expression suggests…") still produces a coherent portrait.

STYLE_SUFFIX = (
    " Rendered as a 19th-century zoological plate from a natural history "
    "book — hand-colored lithograph or engraving, fine pen-and-ink "
    "linework with soft watercolor wash, in the painterly tradition of "
    "John James Audubon and Ernst Haeckel. Centered specimen study, "
    "head-and-shoulders bust, naturalist's observation pose. Aged cream "
    "paper background with faint foxing and subtle paper texture, muted "
    "earthen palette of sepia, sage green, dusty rose, and ivory, with "
    "hand-painted color washes over crisp linework. Painterly, "
    "traditional, no plastic sheen, no photography, no 3D render, no "
    "neon, no digital glow. 1:1 aspect, no text, no labels, no logos, "
    "no border."
)

PORTRAITS = [
    {
        "out": "public/demo_pet_cat.jpg",
        "prompt": ("Portrait of a domestic shorthair cat, soft brown tabby fur, "
                   "alert almond eyes, pink nose, whiskers, ears pricked, "
                   "looking gently at the viewer.") + STYLE_SUFFIX,
    },
    {
        "out": "public/demo_pet_capybara.jpg",
        "prompt": ("Portrait of a capybara, the world's most relaxed rodent, "
                   "sleepy half-closed eyes, soft coarse brown fur, blunt snout, "
                   "faint smile, hot-spring serenity.") + STYLE_SUFFIX,
    },
    {
        "out": "public/demo_pet_octopus.jpg",
        "prompt": ("Portrait of a common octopus, bulbous violet head, "
                   "intelligent horizontal slit pupil eyes, suckered tentacles "
                   "curling near the face, mottled chromatophore skin, "
                   "faint blush of color.") + STYLE_SUFFIX,
    },
]


def main() -> None:
    ref_path = os.path.join(HERE, "_demo_ref.jpg")
    if not os.path.exists(ref_path):
        # Warm cream tile, 1024x1024, slight gradient for non-flat appearance.
        img = Image.new("RGB", (1024, 1024), (235, 220, 190))
        img.save(ref_path, quality=92)
    print(f"  ↑ uploading ref {os.path.basename(ref_path)}…")
    ref_url = upload_ref(ref_path)
    print(f"  ✓ ref → {ref_url}")

    last_call = 0
    for i, p in enumerate(PORTRAITS):
        out_path = os.path.join(HERE, p["out"])
        print(f"\n[{i+1}/{len(PORTRAITS)}] {p['out']}")

        # Honor the 80s API rate limit.
        wait = RATE_LIMIT_S - (time.time() - last_call)
        if wait > 0:
            print(f"  ⏳ waiting {wait:.0f}s to respect rate limit…")
            time.sleep(wait)

        retries = 3
        while retries > 0:
            try:
                last_call = time.time()
                gen_url = call_api(ref_url, p["prompt"])
                if gen_url is None:
                    print("  ⚠️  API returned no URL — skipping")
                    break
                download(gen_url, out_path)
                break
            except RuntimeError as e:
                if str(e) == "rate_limit":
                    print(f"  ⏳ rate-limited; waiting 30s…")
                    time.sleep(30)
                    retries -= 1
                    continue
                raise
            except Exception as e:
                print(f"  ✗ {e}")
                break


if __name__ == "__main__":
    main()
