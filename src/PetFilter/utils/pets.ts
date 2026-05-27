// Pet catalog + img2img prompts. Subject-agnostic prompt pattern: we
// describe the TARGET species + scene + style; the platform's img2img
// uses the user's uploaded ref as the visual condition, morphing the
// subject's features into the pet form while keeping recognizable
// expression, eye placement, and pose hints. See
// feedback_img2img_subject_agnostic_prompt.md.

export type PetCategory = 'everyday' | 'wholesome' | 'uncanny';

export interface Pet {
  id: string;
  /** Display name (English, sentence case). */
  name: string;
  /** Italic binomial — Latin scientific name. Shown under display name
   *  in the field-guide visual. */
  latin: string;
  /** Roman numeral plate number, for the "PLATE XII" header decoration. */
  plate: string;
  category: PetCategory;
  /** Img2img target description. */
  prompt: string;
  /** Hex tint that brushes the picker tile and result page accents. */
  tint: string;
  /** One-line Victorian-voice character read — shown on the Bestiary
   *  page and used as a hint when the LLM classifies. */
  character: string;
}

// HYBRID prompt — the key insight from user feedback: the AI output
// must clearly retain the user's face, eyes, expression, identity.
// "Pet Filter" is not "generate me a generic cat" — it's "show me as
// a half-cat hybrid". So we lead with the SUBJECT and frame the
// species as a transformation overlaid on their face.
//
// Each pet's prompt is `pet.prompt + STYLE_SUFFIX`, where pet.prompt
// describes the BLEND (hybrid features overlaid on the human face)
// instead of "Portrait of a [pet]". The species descriptors below
// have been rewritten accordingly.
const STYLE_SUFFIX = (
  ' The result must read as a HYBRID portrait — half-human, half-creature — ' +
  'NOT as a pure animal. The viewer must still recognize the original person. ' +
  'Centered head-and-shoulders bust, naturalist\'s observation pose. ' +
  'Rendered as a 19th-century zoological plate from a natural history book ' +
  '— hand-colored lithograph or engraving, fine pen-and-ink linework with ' +
  'soft watercolor wash, in the painterly tradition of John James Audubon ' +
  'and Ernst Haeckel. Aged cream paper background with faint foxing and ' +
  'subtle paper texture, muted earthen palette of sepia, sage green, dusty ' +
  'rose, and ivory, hand-painted color washes over crisp linework. ' +
  'Painterly, traditional — no plastic sheen, no photography, no 3D render, ' +
  'no neon, no digital glow. 1:1 aspect, no text, no labels, no logos, no border.'
);

// Each prompt leads with the HYBRID framing. The reference image is
// the user's photo; the model must keep their face recognizable while
// overlaying the species-specific features below.
// HYBRID prompt v5. Mammal species kept getting fully animalized at
// 30/70 because the model loves drawing a complete animal head. The
// fix: explicit EYE anchor — eyes must stay UNMISTAKABLY HUMAN
// (forward-facing, sclera visible, eyebrows, expression). Eyes carry
// identity; once they're locked, fur/ears/snout can go full animal
// and the viewer still reads the person underneath.
const HYBRID_PREFIX = (
  'A 19th-century zoological plate of a HYBRID creature — mostly the ' +
  'species, with the person from the reference photo recognizable ' +
  'underneath only on careful inspection. ' +
  'CRITICAL ANCHOR: The EYES must remain UNMISTAKABLY HUMAN — ' +
  'forward-facing, almond-shape, with visible white SCLERA, eyelids, ' +
  'eyebrows, and an expressive human gaze. DO NOT replace them with ' +
  'full animal eyes. Keep HUMAN SHOULDERS and the broad face shape ' +
  'visible. Transform their head this way: '
);
const HYBRID_SUFFIX_GUARD = (
  ' Balance: animal features dominate the surface (~70%), but human ' +
  'eyes + brow ridge + jawline + shoulders anchor identity (~30%). ' +
  'DO NOT include any plaque, ID number, or written text in the image.'
);

export const PETS: Pet[] = [
  // ─── Everyday ───
  {
    id: 'cat',
    name: 'House Cat',
    latin: 'Felis catus',
    plate: 'I',
    category: 'everyday',
    tint: '#8B4B3A',
    character: 'Domestic, alert, observant. Watches all but answers to few.',
    prompt: HYBRID_PREFIX + 'full tabby cat fur covers cheeks, forehead, jaw, chin — almost no human skin visible. LARGE triangular tabby ears rise from the top of the head replacing the hair. A small pink cat nose triangle. Long white whiskers. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'dog',
    name: 'Good Dog',
    latin: 'Canis familiaris',
    plate: 'II',
    category: 'everyday',
    tint: '#8B4B3A',
    character: 'Loyal, warm, easily moved. The most honest of the orders.',
    prompt: HYBRID_PREFIX + 'full dog fur covers all of the face, no human skin visible. Long floppy lop ears hang from the head replacing the hair. A pronounced dog snout extends forward replacing the nose and mouth area. A wet black dog nose. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    latin: 'Mesocricetus auratus',
    plate: 'III',
    category: 'everyday',
    tint: '#A67C3F',
    character: 'Small, busy, cheerful. Hoards what it loves.',
    prompt: HYBRID_PREFIX + 'full caramel-golden hamster fur covers all of the face, huge stuffed round cheeks puff out from each side, small round hamster ears on top of the head, a tiny pink twitching nose. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'duck',
    name: 'Duck',
    latin: 'Anas platyrhynchos',
    plate: 'IV',
    category: 'everyday',
    tint: '#B08C2E',
    character: 'Calm, drifty, faintly comic. Floats above most troubles.',
    prompt: HYBRID_PREFIX + 'fluffy yellow duckling down covers all of the face, a wide flat orange duck bill extends prominently replacing the nose and mouth, no human skin visible. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },

  // ─── Wholesome quirky ───
  {
    id: 'capybara',
    name: 'Capybara',
    latin: 'Hydrochoerus hydrochaeris',
    plate: 'V',
    category: 'wholesome',
    tint: '#7A5B2F',
    character: 'Supremely relaxed. Kind. Endlessly serene in hot springs.',
    prompt: HYBRID_PREFIX + 'coarse brown capybara fur covers all of the face and neck, no human skin visible, a large blunt capybara snout extends forward replacing the nose and mouth, small rounded capybara ears on top of the head. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'sloth',
    name: 'Sloth',
    latin: 'Bradypus tridactylus',
    plate: 'VI',
    category: 'wholesome',
    tint: '#6E5F38',
    character: 'Slow, dreamy, mossy. Takes the long view of all things.',
    prompt: HYBRID_PREFIX + 'shaggy moss-tinged grey-brown sloth fur covers all of the face and head, no human skin visible, prominent dark mask-patches AROUND the eyes (eyes themselves stay human per anchor), a slow benevolent sloth smile, mossy fur texture.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'parrot',
    name: 'Scarlet Macaw',
    latin: 'Ara macao',
    plate: 'VII',
    category: 'wholesome',
    tint: '#A33C2A',
    character: 'Vivid, vocal, conspicuous. Often louder than its plumage.',
    prompt: HYBRID_PREFIX + 'brilliant scarlet-red and green feather plumage covers all of the face and head, no human skin visible, a large curved black macaw beak extends prominently replacing the nose and mouth. (Eyes stay human per anchor — but with feathered ring around them.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    latin: 'Ambystoma mexicanum',
    plate: 'VIII',
    category: 'wholesome',
    tint: '#B66D6F',
    character: 'Perpetually amused. Regenerative. Faintly otherworldly.',
    prompt: HYBRID_PREFIX + 'translucent pale pink wet amphibian skin replaces all skin, prominent feathery gill fronds fan out from each side of the head (where ears were), a wide perpetual amphibian smile across the lower face, faint amphibian markings. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    latin: 'Erinaceus europaeus',
    plate: 'IX',
    category: 'wholesome',
    tint: '#8C6A3D',
    character: 'Cautious. Quietly spiky. Curls up when pressed.',
    prompt: HYBRID_PREFIX + 'a dense thick coat of cream-and-brown hedgehog quills covers the top, back, and sides of the head replacing all hair, soft brown hedgehog fur covers the entire face, no human skin visible, a small pointed hedgehog snout with twitching pink nose. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },

  // ─── Uncanny ───
  {
    id: 'clam',
    name: 'Giant Clam',
    latin: 'Tridacna gigas',
    plate: 'X',
    category: 'uncanny',
    tint: '#3F6E78',
    character: 'Withdrawn. Treasure within. Slightly uncanny when opened.',
    prompt: HYBRID_PREFIX + 'two large calcified ridged white-and-cream giant clam shell halves enclose most of the head like an open helmet, prominent ruffled iridescent blue-purple mantle flesh inside the shell covers most of the face, eye-spots along the mantle rim. (The pair of human eyes stays visible per anchor — peering out from between the shell halves.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'octopus',
    name: 'Common Octopus',
    latin: 'Octopus vulgaris',
    plate: 'XI',
    category: 'uncanny',
    tint: '#5B3A6E',
    character: 'Improvisational, intelligent, alien. Watches more than it shows.',
    prompt: HYBRID_PREFIX + 'a large bulbous violet octopus mantle dominates the top and back of the head, fully replacing the skull and hair, thick purple suckered tentacles cascade down around the head and over the shoulders, mottled green-purple chromatophore skin covers cheeks. (Eyes stay human per anchor — forward-facing in the face, with sclera and brows.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'snail',
    name: 'Garden Snail',
    latin: 'Helix aspersa',
    plate: 'XII',
    category: 'uncanny',
    tint: '#4F5E2A',
    character: 'Patient. Unhurried. Carries home upon its back.',
    prompt: HYBRID_PREFIX + 'a large glossy spiral brown snail shell occupies the back and top of the head, two long sensitive snail eye-stalks rise prominently from the temples with black eye-dots at the tips (these are SEPARATE from the human eyes), moist translucent mollusk skin replaces all human skin on cheeks, faint slime sheen. (The pair of human eyes stays in the face per anchor, with sclera and brows.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
];

export function petById(id: string): Pet | undefined {
  return PETS.find((p) => p.id === id);
}

export const CATEGORY_LABEL: Record<PetCategory, string> = {
  everyday: 'Everyday',
  wholesome: 'Wholesome',
  uncanny: 'Uncanny',
};
