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
// HYBRID prompt v4. Pushed further: 30/70 (human/creature).
// Earlier 50/50 still read as "human face + ears" — too human. Now
// the creature dominates: full fur, full ears replacing hair, full
// animal eyes. Only the JAWLINE + EYE POSITION + SHOULDERS subtly
// hint at the human underneath.
const HYBRID_PREFIX = (
  'A 19th-century zoological plate of a creature that is MOSTLY ANIMAL ' +
  'with subtle traces of human identity buried underneath. Reference ' +
  'the photo only loosely — keep their JAWLINE, their EYE POSITION, ' +
  'and their HUMAN SHOULDERS visible. Everything else about the head ' +
  'should be the species. The creature dominates; the human is barely ' +
  'a ghost of identity inside it. Transform their head this way: '
);
const HYBRID_SUFFIX_GUARD = (
  ' Balance: ~30% human (jawline + eye position + shoulders) / ~70% ' +
  'creature (fur, ears, snout, eyes — ALL of the surface). Lean hard ' +
  'into the animal. ' +
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
    prompt: HYBRID_PREFIX + 'the face is now PREDOMINANTLY feline — full tabby cat fur covers ALL of the face (cheeks, forehead, jaw, chin), only fur visible. LARGE triangular tabby ears replace the hair. Full feline almond-shape eyes with vertical slit pupils and amber-yellow irises. A small pink cat nose triangle. Long white whiskers fan from a furry muzzle. Only jawline + shoulder bones subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'dog',
    name: 'Good Dog',
    latin: 'Canis familiaris',
    plate: 'II',
    category: 'everyday',
    tint: '#8B4B3A',
    prompt: HYBRID_PREFIX + 'the face is now PREDOMINANTLY canine — full dog fur covers ALL of the face, no human skin visible. Long floppy lop ears hang from the head replacing the hair. A pronounced dog snout extends forward replacing the nose and mouth area. A wet black dog nose. Big warm brown dog eyes. Mouth slightly open with tongue showing. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    latin: 'Mesocricetus auratus',
    plate: 'III',
    category: 'everyday',
    tint: '#A67C3F',
    prompt: HYBRID_PREFIX + 'the face is now PREDOMINANTLY hamster — full caramel-golden hamster fur covers ALL of the face, huge stuffed round cheeks puff out from each side, round hamster ears on top of the head, a tiny pink twitching nose. Full black bead-bright hamster eyes. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'duck',
    name: 'Duck',
    latin: 'Anas platyrhynchos',
    plate: 'IV',
    category: 'everyday',
    tint: '#B08C2E',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY duck — fluffy yellow duckling down covers ALL of the face, a wide flat orange duck bill extends prominently replacing the nose and mouth, no human skin visible, calm dark beady duck eyes. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },

  // ─── Wholesome quirky ───
  {
    id: 'capybara',
    name: 'Capybara',
    latin: 'Hydrochoerus hydrochaeris',
    plate: 'V',
    category: 'wholesome',
    tint: '#7A5B2F',
    prompt: HYBRID_PREFIX + 'the face is now PREDOMINANTLY capybara — coarse brown fur covers ALL of the face and neck, no human skin visible, a large blunt capybara snout extends forward replacing the nose and mouth, small rounded capybara ears on top of the head, sleepy heavy-lidded dark beady eyes. Only broad bone structure + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'sloth',
    name: 'Sloth',
    latin: 'Bradypus tridactylus',
    plate: 'VI',
    category: 'wholesome',
    tint: '#6E5F38',
    prompt: HYBRID_PREFIX + 'the face is now PREDOMINANTLY sloth — shaggy moss-tinged grey-brown sloth fur covers ALL of the face and head, no human skin visible, prominent dark mask-patches around large heavy-lidded dreamy sloth eyes, a slow benevolent sloth smile, mossy fur texture. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'parrot',
    name: 'Scarlet Macaw',
    latin: 'Ara macao',
    plate: 'VII',
    category: 'wholesome',
    tint: '#A33C2A',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY macaw — brilliant scarlet-red and green feather plumage covers ALL of the face and head, no human skin visible, a large curved black macaw beak extends prominently replacing the nose and mouth, sharp curious birdlike eyes with bare white-skin eye-rings. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    latin: 'Ambystoma mexicanum',
    plate: 'VIII',
    category: 'wholesome',
    tint: '#B66D6F',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY axolotl — translucent pale pink wet amphibian skin replaces all skin, prominent feathery gill fronds fan out from each side of the head (where ears were), a wide perpetual amphibian smile across the lower face, large dark dot eyes, faint amphibian markings. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    latin: 'Erinaceus europaeus',
    plate: 'IX',
    category: 'wholesome',
    tint: '#8C6A3D',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY hedgehog — a dense thick coat of cream-and-brown hedgehog quills covers the top, back, and sides of the head replacing all hair, soft brown hedgehog fur covers the entire face, no human skin visible, a small pointed hedgehog snout with twitching pink nose, small bead-shiny dark eyes. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },

  // ─── Uncanny ───
  {
    id: 'clam',
    name: 'Giant Clam',
    latin: 'Tridacna gigas',
    plate: 'X',
    category: 'uncanny',
    tint: '#3F6E78',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY giant clam — two large calcified ridged white-and-cream clam shell halves enclose most of the head like an open helmet, prominent ruffled iridescent blue-purple mantle flesh inside the shell covers most of the face, eye-spots along the mantle rim, only a small slit shows the original human face peering out. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'octopus',
    name: 'Common Octopus',
    latin: 'Octopus vulgaris',
    plate: 'XI',
    category: 'uncanny',
    tint: '#5B3A6E',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY octopus — a large bulbous violet octopus mantle fully replaces the skull and hair, thick purple suckered tentacles cascade down covering most of the head and shoulders, mottled green-purple chromatophore skin replaces all visible flesh, large horizontal-slit cephalopod eyes. Only jawline + shoulder bones subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  },
  {
    id: 'snail',
    name: 'Garden Snail',
    latin: 'Helix aspersa',
    plate: 'XII',
    category: 'uncanny',
    tint: '#4F5E2A',
    prompt: HYBRID_PREFIX + 'the head is now PREDOMINANTLY snail — a large glossy spiral brown snail shell occupies the back of the head, two long sensitive snail eye-stalks rise prominently from the top of the head with black eye-dots at the tips, moist translucent mollusk skin replaces all human skin, faint slime sheen on the face. Only jawline + shoulders subtly hint at the human.' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
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
