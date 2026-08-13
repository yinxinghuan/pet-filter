#!/usr/bin/env python3
"""
Generate ALL imagery for Pet Filter:
  - 12 picker covers (cover_<id>.jpg) — pure-species plates, blank ref
  - 3 hybrid demos (demo_pet_<id>.jpg) — human face + species, real face ref

Hybrid prompt EMPHASIZES subject retention so the model holds the face
through the morph instead of generating a generic animal.

Usage:
  /Users/yin/miniconda3/bin/python3 gen_all.py
"""
import datetime, hashlib, hmac, json, os, ssl, sys, time, urllib.parse, urllib.request, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

R2_ACCOUNT_ID = os.environ["ALTERU_R2_ACCOUNT_ID"]
R2_ACCESS_KEY = os.environ["ALTERU_R2_ACCESS_KEY_ID"]
R2_SECRET_KEY = os.environ["ALTERU_R2_SECRET_ACCESS_KEY"]
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


def upload_ref(path: str) -> str:
    with open(path, "rb") as f: data = f.read()
    obj = f"refs/pf-{int(time.time())}-{os.path.basename(path)}"
    host = f"{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    now = datetime.datetime.utcnow()
    amz = now.strftime("%Y%m%dT%H%M%SZ"); date = now.strftime("%Y%m%d")
    ct = "image/jpeg" if path.lower().endswith(("jpg", "jpeg")) else "image/png"
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


def call_api(ref_url: str, prompt: str):
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
    print(f"  ✗ code={code} body={res}")
    return None


def download(url: str, out_path: str):
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as r:
        data = r.read()
    with open(out_path, "wb") as f: f.write(data)
    print(f"  ✓ {out_path}  ({os.path.getsize(out_path) // 1024} KB)")


# ── Style ────────────────────────────────────────────────────────────
PLATE_STYLE = (
    " Rendered as a 19th-century zoological plate from a natural history "
    "book — hand-colored lithograph or engraving, fine pen-and-ink "
    "linework with soft watercolor wash, in the painterly tradition of "
    "John James Audubon and Ernst Haeckel. Aged cream paper background "
    "with faint foxing and subtle paper texture, muted earthen palette "
    "of sepia, sage green, dusty rose, and ivory, hand-painted color "
    "washes over crisp linework. Painterly and traditional — no plastic "
    "sheen, no photography, no 3D render, no neon, no digital glow. "
    "1:1 aspect, no text, no labels, no logos, no border."
)

# Pure-species plate (no subject). Used for picker covers.
def pure_pet(species_descr: str) -> str:
    return (
        f"A zoological plate study of {species_descr} "
        "Centered head-and-shoulders bust, naturalist's observation pose."
        + PLATE_STYLE
    )

# Hybrid plate (subject + species). Used for real user transfigurations
# AND for the frontispiece demo cycle. Pushes hard on retaining the
# subject's face/expression — the goal is "clearly this person, now
# part-animal" not "a generic animal".
def hybrid(species_features: str) -> str:
    return (
        "A 19th-century zoological plate of an anthropomorphic HYBRID. "
        "The subject in the reference image is a real person — KEEP their "
        "facial structure, eye placement, expression, hairline, and "
        "personal identity CLEARLY recognizable. Now blend onto the SAME "
        f"face the features of: {species_features} "
        "The result must read as a HYBRID portrait — half-human, "
        "half-creature — not as a pure animal. The viewer should still "
        "recognize the original person. Centered head-and-shoulders bust, "
        "naturalist's observation pose."
        + PLATE_STYLE
    )

# ── Species rosters ──────────────────────────────────────────────────
SPECIES = {
    # id            ┬ pure-pet descriptor                                   ┬ hybrid feature list
    "cat":      ("a domestic shorthair cat (Felis catus), soft tabby fur, "
                 "alert almond eyes, pink nose, whiskers, ears pricked.",
                 "soft tabby fur creeping across the cheeks and brow, "
                 "feline almond pupils retaining the subject's eye color, "
                 "small triangular cat ears emerging from where the human "
                 "ears were, delicate whiskers."),
    "dog":      ("a friendly mixed-breed dog (Canis familiaris), gentle "
                 "honest eyes, glossy coat, floppy ears.",
                 "soft canine fur on the cheeks, big honest eyes that "
                 "still hold the subject's expression, lop ears emerging "
                 "from the hairline, gentle dog snout barely forward of "
                 "the human nose."),
    "hamster":  ("a tiny golden hamster (Mesocricetus auratus), stuffed "
                 "round cheeks, bright black-bead eyes, pink nose, caramel fur.",
                 "puffy caramel cheeks emerging from the human face, "
                 "small round hamster ears, a tiny twitching pink nose, "
                 "the subject's eyes now bead-bright but still expressive."),
    "duck":     ("a young yellow duck (Anas platyrhynchos), fluffy down, "
                 "wide orange bill, calm dark eyes.",
                 "soft duckling down on the cheeks and neck, a wide flat "
                 "orange bill emerging from where the human mouth was, "
                 "calm dark eyes that retain the subject's expression."),
    "capybara": ("a capybara (Hydrochoerus hydrochaeris), sleepy half-"
                 "closed eyes, soft coarse brown fur, blunt snout, faint smile.",
                 "soft coarse brown capybara fur on the cheeks, sleepy "
                 "half-closed eyes (still the subject's), a blunt friendly "
                 "snout barely emerging from the human face, hot-spring "
                 "serenity."),
    "sloth":    ("a three-toed sloth (Bradypus tridactylus), shaggy moss-"
                 "tinged fur, dreamy half-lidded eyes, slow benevolent smile.",
                 "shaggy moss-tinged fur on the cheeks and neck, dark "
                 "patches around the human eyes, dreamy half-lidded "
                 "expression, a slow benevolent smile."),
    "parrot":   ("a vivid scarlet macaw parrot (Ara macao), brilliant red "
                 "and green plumage, curved black beak, white eye-ring.",
                 "brilliant red and green feather plumage around the "
                 "face, a curved black beak softly emerging where the "
                 "human nose+mouth were, a sharp curious eye with white "
                 "feathered ring."),
    "axolotl":  ("a pink axolotl (Ambystoma mexicanum), translucent pale "
                 "skin, feathery gill fronds, perpetual smile, tiny dark eyes.",
                 "translucent pale pink skin tone, feathery axolotl gill "
                 "fronds fanning out from where the human ears were, a "
                 "perpetual gentle smile, tiny dark dot eyes that retain "
                 "expression."),
    "hedgehog": ("a small hedgehog (Erinaceus europaeus), ring of cream "
                 "and brown quills, soft round face, shiny black eyes.",
                 "a ring of cream-and-brown quills crowning the head and "
                 "running along the cheeks, a small round face that's "
                 "still the subject's, shiny dark eyes, a tiny pink nose."),
    "clam":     ("a giant clam (Tridacna gigas) half-opened, ruffled "
                 "iridescent blue and purple mantle, ridged white shell.",
                 "ruffled iridescent blue-and-purple mantle framing the "
                 "subject's face like a collar, faint eye-spots along "
                 "the rim, the human face peering out from inside the "
                 "calcified ridged shell halves."),
    "octopus":  ("a common octopus (Octopus vulgaris), bulbous violet "
                 "head, slit-pupil eyes, suckered tentacles, mottled skin.",
                 "a bulbous violet octopus mantle behind and around the "
                 "human head, intelligent horizontal slit-pupil eyes "
                 "where the human eyes were, suckered tentacles curling "
                 "near the face, mottled chromatophore skin."),
    "snail":    ("a garden snail (Helix aspersa), glossy spiral brown "
                 "shell, long eye-stalks, glistening moist body.",
                 "a glossy spiral brown shell rising from the back of "
                 "the human head, long sensitive eye-stalks lifting up "
                 "from the temples, the human face glistening moist "
                 "and calm."),

    # ── Expansion v2 — 8 more orders (plates XIII–XX) ──
    "rabbit":   ("a soft brown rabbit (Oryctolagus cuniculus), tall "
                 "upright ears, twitching pink nose, gentle whiskers, "
                 "round dark eyes.",
                 "soft brown rabbit fur across the cheeks, tall upright "
                 "rabbit ears rising from the head, a small twitching "
                 "pink nose, slight buck-toothed mouth."),
    "goldfish": ("a single goldfish (Carassius auratus), shimmering "
                 "metallic orange-gold scales, flowing fan-shaped fins, "
                 "round eyes.",
                 "shimmering metallic orange-gold fish scales on the "
                 "cheeks and head, flowing fan-shaped dorsal and caudal "
                 "fins rising from where the hair was, faint gill slits, "
                 "a pursed round fish mouth."),
    "red_panda":("a red panda (Ailurus fulgens), rich rust-red fur, "
                 "cream-white facial markings, small triangular ears "
                 "tipped in white, gentle pointed snout.",
                 "rich rust-red red-panda fur on the cheeks with cream-"
                 "white markings around the cheeks and brow, small "
                 "triangular ears edged in white on the head, a soft "
                 "pointed snout with a small black nose."),
    "fennec":   ("a fennec fox (Vulpes zerda), pale sandy-cream fur, "
                 "enormous oversized pointed ears, delicate pointed "
                 "muzzle, alert dark eyes.",
                 "pale sandy-cream fennec fox fur on the cheeks, "
                 "ENORMOUS oversized pointed fennec ears rising from "
                 "the head, a small dark nose, delicate pointed muzzle."),
    "otter":    ("a river otter (Lutra lutra), sleek wet-looking dark-"
                 "brown fur, prominent white whiskers, small rounded "
                 "ears, slightly buck-toothed smile.",
                 "sleek wet-looking dark-brown otter fur on the cheeks "
                 "and neck, small rounded otter ears flat against the "
                 "head, prominent stiff white whiskers fanning from "
                 "the upper lip, a round dark nose."),
    "jellyfish":("a moon jellyfish (Aurelia aurita), translucent pale-"
                 "blue bell, long ghostly tentacles trailing down, faint "
                 "bioluminescent veins.",
                 "a large translucent pale-blue jellyfish bell crowning "
                 "the head like a luminous hat, long ghostly tentacles "
                 "cascading down around the face and shoulders, pale "
                 "translucent skin with faint blue-violet bioluminescent "
                 "veins on the cheeks."),
    "pufferfish":("an inflated pufferfish (Takifugu rubripes), mottled "
                 "olive-tan-and-cream spiny skin, small pursed round "
                 "mouth, large round eyes.",
                 "an inflated round pufferfish form — mottled olive-tan-"
                 "and-cream pufferfish skin covering the entire head, "
                 "short sharp spines on the cheeks and brow, a small "
                 "round pursed pufferfish mouth, faint side fins behind "
                 "the cheeks."),
    "frog":     ("a green tree frog (Hyla arborea), smooth glossy bright-"
                 "green skin, wide perpetual smile, sticky-pad fingers, "
                 "round dark eyes.",
                 "smooth glossy bright-green frog skin replacing all "
                 "skin on face and neck, a wide perpetual frog smile "
                 "across the lower face, faint speckled markings on the "
                 "cheeks, the throat membrane subtly inflated."),
}

# Which 3 species become hybrid demos for the frontispiece cycle.
HYBRID_DEMOS = ["cat", "capybara", "octopus"]


def main():
    # ── 1. Pure-species ref (cream tile) ──
    pure_ref_path = os.path.join(HERE, "_demo_ref.jpg")
    if not os.path.exists(pure_ref_path):
        Image.new("RGB", (1024, 1024), (235, 220, 190)).save(pure_ref_path, quality=92)
    print("\n[1/2] uploading PURE ref (blank cream)…")
    pure_ref_url = upload_ref(pure_ref_path)
    print(f"  ✓ {pure_ref_url}")

    # ── 2. Hybrid ref (face) — square-cropped from mugshot2 ──
    src_face = "/Users/yin/code/games/mugshot-booth/public/demo_mugshot2.jpg"
    hybrid_ref_path = os.path.join(HERE, "_hybrid_ref.jpg")
    if not os.path.exists(hybrid_ref_path):
        img = Image.open(src_face).convert("RGB")
        # crop center square + resize to 1024
        w, h = img.size
        side = min(w, h)
        img = img.crop(((w - side) // 2, (h - side) // 2,
                       (w + side) // 2, (h + side) // 2))
        img = img.resize((1024, 1024), Image.LANCZOS)
        img.save(hybrid_ref_path, quality=92)
    print("\n[2/2] uploading HYBRID ref (face crop)…")
    hybrid_ref_url = upload_ref(hybrid_ref_path)
    print(f"  ✓ {hybrid_ref_url}")

    jobs = []
    # Picker covers — pure pet, one per species.
    for sid, (desc, _hybrid_feats) in SPECIES.items():
        jobs.append({
            "out": f"public/cover_{sid}.jpg",
            "ref": pure_ref_url,
            "prompt": pure_pet(desc),
            "kind": "cover",
            "sid": sid,
        })
    # Hybrid demos for frontispiece.
    for sid in HYBRID_DEMOS:
        _desc, feats = SPECIES[sid]
        jobs.append({
            "out": f"public/demo_pet_{sid}.jpg",
            "ref": hybrid_ref_url,
            "prompt": hybrid(feats),
            "kind": "demo",
            "sid": sid,
        })

    # Skip jobs whose output already exists — idempotent reruns only
    # generate missing files. Set SKIP_EXISTING=0 to force regenerate.
    skip_existing = os.environ.get("SKIP_EXISTING", "1") != "0"
    if skip_existing:
        before = len(jobs)
        jobs = [j for j in jobs if not os.path.exists(os.path.join(HERE, j["out"]))]
        print(f"\nSkipping {before - len(jobs)} jobs that already exist on disk")

    print(f"\nTotal: {len(jobs)} images to generate (~{len(jobs) * 80 // 60} min)")
    last_call = 0
    for i, j in enumerate(jobs):
        out_path = os.path.join(HERE, j["out"])
        print(f"\n[{i+1}/{len(jobs)}] {j['kind']:5s} {j['sid']:8s} → {j['out']}")
        wait = RATE_LIMIT_S - (time.time() - last_call)
        if wait > 0:
            print(f"  ⏳ rate-limit wait {wait:.0f}s")
            time.sleep(wait)
        retries = 3
        while retries > 0:
            try:
                last_call = time.time()
                gen_url = call_api(j["ref"], j["prompt"])
                if gen_url is None:
                    print("  ⚠️  no URL returned, skipping")
                    break
                download(gen_url, out_path)
                break
            except RuntimeError as e:
                if str(e) == "rate_limit":
                    print("  ⏳ 30s back-off"); time.sleep(30); retries -= 1; continue
                raise
            except Exception as e:
                print(f"  ✗ {e}"); break


if __name__ == "__main__":
    main()
