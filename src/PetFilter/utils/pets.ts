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
// HYBRID prompt v3. Balance shifted from 70/30 → 50/50:
// the species features now occupy roughly HALF the head, but the
// underlying bone structure (jaw, shoulders, eye position) stays
// recognizable. Earlier 70/30 version produced "human with a hat";
// this version produces an honest hybrid creature.
const HYBRID_PREFIX = (
  'A 19th-century zoological plate of a STRIKING HYBRID creature. ' +
  'Begin with the person in the reference photo — their facial bone ' +
  'structure, eye position, jawline, and human shoulders MUST still ' +
  'be recognizable underneath. But push the species features ' +
  'PROMINENTLY: they should occupy roughly half the head — bold, ' +
  'visible, illustrative. Transform their head this way: '
);
const HYBRID_SUFFIX_GUARD = (
  ' Balance: ~50% human bone structure visible / ~50% creature features ' +
  'covering the surface. Same person, dramatically transformed. ' +
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
    prompt: HYBRID_PREFIX + 'the face is now SUBSTANTIALLY feline — soft tabby fur covers the cheeks, forehead, and jaw, LARGE triangular tabby cat ears rising prominently from the hair, full feline almond-shaped yellow-green eyes with vertical slit pupils, a distinct pink cat nose, prominent white whiskers fanning out from the muzzle. Bone structure still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'dog',
    name: 'Good Dog',
    latin: 'Canis familiaris',
    plate: 'II',
    category: 'everyday',
    tint: '#8B4B3A',
    prompt: HYBRID_PREFIX + 'the face is now SUBSTANTIALLY canine — soft dog fur covers the cheeks, forehead, and jaw, prominent floppy lop ears hanging from the head, a clear dog snout extending forward from the nose, a wet black dog nose, big warm honest brown eyes, mouth slightly open in a gentle smile. Bone structure still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    latin: 'Mesocricetus auratus',
    plate: 'III',
    category: 'everyday',
    tint: '#A67C3F',
    prompt: HYBRID_PREFIX + 'the face is now SIGNIFICANTLY rodent — large puffy stuffed caramel cheeks dominate the lower face, soft golden fur covers the cheeks and forehead, small round hamster ears sit prominently on the head, a tiny pink twitching nose, bright black bead eyes. Bone structure still recognizable underneath.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'duck',
    name: 'Duck',
    latin: 'Anas platyrhynchos',
    plate: 'IV',
    category: 'everyday',
    tint: '#B08C2E',
    prompt: HYBRID_PREFIX + 'a wide prominent flat orange duck bill protruding from the lower face, soft yellow duckling down covering the cheeks and neck like sideburns, calm dark beady duck eyes, the bone structure underneath still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },

  // ─── Wholesome quirky ───
  {
    id: 'capybara',
    name: 'Capybara',
    latin: 'Hydrochoerus hydrochaeris',
    plate: 'V',
    category: 'wholesome',
    tint: '#7A5B2F',
    prompt: HYBRID_PREFIX + 'soft coarse brown capybara fur completely covers the cheeks, jaw, and neck, a prominent blunt capybara snout pushes forward from the nose, small rounded capybara ears sit visibly on top of the head, sleepy heavy-lidded brown eyes. Forehead and bone structure still hold the subject\'s identity.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'sloth',
    name: 'Sloth',
    latin: 'Bradypus tridactylus',
    plate: 'VI',
    category: 'wholesome',
    tint: '#6E5F38',
    prompt: HYBRID_PREFIX + 'shaggy moss-tinged grey-brown sloth fur covers the cheeks, forehead, and jaw, prominent dark mask-patches around the eyes (still the subject\'s eyes underneath), heavy half-lidded dreamy expression, a slow benevolent smile, mossy texture in the fur.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'parrot',
    name: 'Scarlet Macaw',
    latin: 'Ara macao',
    plate: 'VII',
    category: 'wholesome',
    tint: '#A33C2A',
    prompt: HYBRID_PREFIX + 'brilliant scarlet-red and green feather plumage substantially covers the head — feathers replace the hair and frame the face, a prominent curved black macaw beak extends from where the nose and mouth were, sharp curious birdlike eyes with white feathered eye-rings. Bone structure underneath still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    latin: 'Ambystoma mexicanum',
    plate: 'VIII',
    category: 'wholesome',
    tint: '#B66D6F',
    prompt: HYBRID_PREFIX + 'translucent pale pink wet skin replaces the human skin tone across the entire face, prominent feathery axolotl gill fronds fan out from the sides of the head where the ears were, a wide perpetual gentle smile, tiny dark dot eyes, faint amphibian markings. Bone structure underneath still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    latin: 'Erinaceus europaeus',
    plate: 'IX',
    category: 'wholesome',
    tint: '#8C6A3D',
    prompt: HYBRID_PREFIX + 'a dense thick crown of cream-and-brown hedgehog quills replaces the hair across the top of the head and runs down the back of the neck, soft brown fur on the cheeks and chin, a tiny twitching pink nose, small bead-shiny dark eyes. Bone structure underneath still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },

  // ─── Uncanny ───
  {
    id: 'clam',
    name: 'Giant Clam',
    latin: 'Tridacna gigas',
    plate: 'X',
    category: 'uncanny',
    tint: '#3F6E78',
    prompt: HYBRID_PREFIX + 'two large calcified ridged white-and-cream giant clam shell halves frame the head like an open helmet (one above, one below the face), prominent ruffled iridescent blue-purple mantle flesh inside the shell, faint eye-spots along the mantle rim, the face peers out from between the shell halves. Bone structure still recognizable.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'octopus',
    name: 'Common Octopus',
    latin: 'Octopus vulgaris',
    plate: 'XI',
    category: 'uncanny',
    tint: '#5B3A6E',
    prompt: HYBRID_PREFIX + 'a LARGE bulbous violet octopus mantle dominates the top half of the head, replacing the hair entirely, thick purple suckered tentacles cascade down around the face and over the shoulders, mottled green-purple chromatophore patches across the cheeks, larger horizontal-slit pupil eyes. Lower face and jawline remain the subject\'s.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'snail',
    name: 'Garden Snail',
    latin: 'Helix aspersa',
    plate: 'XII',
    category: 'uncanny',
    tint: '#4F5E2A',
    prompt: HYBRID_PREFIX + 'a LARGE glossy spiral brown snail shell rises prominently from the top and back of the head, two long sensitive snail eye-stalks lift up from the temples (with small black eye-dots at the tips), the skin appears moist and translucent, faint mollusk texture on the cheeks. Lower face and jawline remain the subject\'s.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
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
