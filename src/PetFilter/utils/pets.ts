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
const HYBRID_PREFIX = (
  'A 19th-century zoological plate of an anthropomorphic HYBRID. ' +
  'The subject in the reference image is a real person — KEEP their ' +
  'facial structure, eye placement, expression, hairline, and ' +
  'personal identity CLEARLY recognizable. Blend onto the SAME face ' +
  'the features of: '
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
    prompt: HYBRID_PREFIX + 'soft tabby fur creeping across the cheeks and brow, feline almond pupils retaining the subject\'s eye color, small triangular cat ears emerging from where the human ears were, delicate whiskers.' + STYLE_SUFFIX,
  },
  {
    id: 'dog',
    name: 'Good Dog',
    latin: 'Canis familiaris',
    plate: 'II',
    category: 'everyday',
    tint: '#8B4B3A',
    prompt: HYBRID_PREFIX + 'soft canine fur on the cheeks, big honest eyes that still hold the subject\'s expression, lop ears emerging from the hairline, a gentle dog snout barely forward of the human nose.' + STYLE_SUFFIX,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    latin: 'Mesocricetus auratus',
    plate: 'III',
    category: 'everyday',
    tint: '#A67C3F',
    prompt: HYBRID_PREFIX + 'puffy caramel cheeks emerging from the human face, small round hamster ears, a tiny twitching pink nose, the subject\'s eyes now bead-bright but still expressive.' + STYLE_SUFFIX,
  },
  {
    id: 'duck',
    name: 'Duck',
    latin: 'Anas platyrhynchos',
    plate: 'IV',
    category: 'everyday',
    tint: '#B08C2E',
    prompt: HYBRID_PREFIX + 'soft duckling down on the cheeks and neck, a wide flat orange bill emerging from where the human mouth was, calm dark eyes that retain the subject\'s expression.' + STYLE_SUFFIX,
  },

  // ─── Wholesome quirky ───
  {
    id: 'capybara',
    name: 'Capybara',
    latin: 'Hydrochoerus hydrochaeris',
    plate: 'V',
    category: 'wholesome',
    tint: '#7A5B2F',
    prompt: HYBRID_PREFIX + 'soft coarse brown capybara fur on the cheeks, sleepy half-closed eyes (still the subject\'s), a blunt friendly snout barely emerging from the human face, hot-spring serenity.' + STYLE_SUFFIX,
  },
  {
    id: 'sloth',
    name: 'Sloth',
    latin: 'Bradypus tridactylus',
    plate: 'VI',
    category: 'wholesome',
    tint: '#6E5F38',
    prompt: HYBRID_PREFIX + 'shaggy moss-tinged fur on the cheeks and neck, dark patches around the human eyes, dreamy half-lidded expression, a slow benevolent smile.' + STYLE_SUFFIX,
  },
  {
    id: 'parrot',
    name: 'Scarlet Macaw',
    latin: 'Ara macao',
    plate: 'VII',
    category: 'wholesome',
    tint: '#A33C2A',
    prompt: HYBRID_PREFIX + 'brilliant red and green feather plumage around the face, a curved black beak softly emerging where the human nose and mouth were, a sharp curious eye with white feathered ring.' + STYLE_SUFFIX,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    latin: 'Ambystoma mexicanum',
    plate: 'VIII',
    category: 'wholesome',
    tint: '#B66D6F',
    prompt: HYBRID_PREFIX + 'translucent pale pink skin tone, feathery axolotl gill fronds fanning out from where the human ears were, a perpetual gentle smile, tiny dark dot eyes that retain expression.' + STYLE_SUFFIX,
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    latin: 'Erinaceus europaeus',
    plate: 'IX',
    category: 'wholesome',
    tint: '#8C6A3D',
    prompt: HYBRID_PREFIX + 'a ring of cream-and-brown quills crowning the head and running along the cheeks, a small round face that\'s still the subject\'s, shiny dark eyes, a tiny pink nose.' + STYLE_SUFFIX,
  },

  // ─── Uncanny ───
  {
    id: 'clam',
    name: 'Giant Clam',
    latin: 'Tridacna gigas',
    plate: 'X',
    category: 'uncanny',
    tint: '#3F6E78',
    prompt: HYBRID_PREFIX + 'ruffled iridescent blue-and-purple mantle framing the subject\'s face like a collar, faint eye-spots along the rim, the human face peering out from inside the calcified ridged shell halves.' + STYLE_SUFFIX,
  },
  {
    id: 'octopus',
    name: 'Common Octopus',
    latin: 'Octopus vulgaris',
    plate: 'XI',
    category: 'uncanny',
    tint: '#5B3A6E',
    prompt: HYBRID_PREFIX + 'a bulbous violet octopus mantle behind and around the human head, intelligent horizontal slit-pupil eyes where the human eyes were, suckered tentacles curling near the face, mottled chromatophore skin.' + STYLE_SUFFIX,
  },
  {
    id: 'snail',
    name: 'Garden Snail',
    latin: 'Helix aspersa',
    plate: 'XII',
    category: 'uncanny',
    tint: '#4F5E2A',
    prompt: HYBRID_PREFIX + 'a glossy spiral brown shell rising from the back of the human head, long sensitive eye-stalks lifting up from the temples, the human face glistening moist and calm.' + STYLE_SUFFIX,
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
