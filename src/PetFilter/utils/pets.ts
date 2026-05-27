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

// Shared style suffix appended to every pet prompt — defines the
// aesthetic the entire game is themed around: 19th-c. natural history
// plate. Audubon / Haeckel / Buffon school. Hand-painted, NOT photo-
// realistic. Keeping this consistent across all 12 species so the wall
// looks like a single bound volume.
const STYLE_SUFFIX = (
  ' Rendered as a 19th-century zoological plate from a natural history book — ' +
  'hand-colored lithograph or engraving, fine pen-and-ink linework with soft ' +
  'watercolor wash, in the painterly tradition of John James Audubon and Ernst ' +
  'Haeckel. Centered specimen study, head-and-shoulders bust, naturalist' +
  "'s observation pose. Aged cream paper background with faint foxing and " +
  'subtle paper texture, muted earthen palette of sepia, sage green, dusty ' +
  'rose, and ivory, with hand-painted color washes over crisp linework. ' +
  'Retain the recognizable facial structure and expression of the reference ' +
  'subject, translated into illustration rather than photograph. ' +
  'Painterly, traditional, no plastic sheen, no photography, no 3D render, ' +
  'no neon, no digital glow. 1:1 aspect, no text, no labels, no logos, no border.'
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
    prompt: 'Portrait of a domestic shorthair cat, soft fur, alert almond eyes, pink nose, whiskers, ears pricked.' + STYLE_SUFFIX,
  },
  {
    id: 'dog',
    name: 'Good Dog',
    latin: 'Canis familiaris',
    plate: 'II',
    category: 'everyday',
    tint: '#8B4B3A',
    prompt: 'Portrait of a friendly mixed-breed dog, glossy coat, big honest eyes, gentle smile, tongue slightly out, floppy ears.' + STYLE_SUFFIX,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    latin: 'Mesocricetus auratus',
    plate: 'III',
    category: 'everyday',
    tint: '#A67C3F',
    prompt: 'Portrait of a tiny golden hamster, round cheeks stuffed, bright black-bead eyes, twitching pink nose, soft caramel fur.' + STYLE_SUFFIX,
  },
  {
    id: 'duck',
    name: 'Duck',
    latin: 'Anas platyrhynchos',
    plate: 'IV',
    category: 'everyday',
    tint: '#B08C2E',
    prompt: 'Portrait of a young yellow duck, fluffy feathers, wide orange bill, calm dark eyes, soft chest down.' + STYLE_SUFFIX,
  },

  // ─── Wholesome quirky ───
  {
    id: 'capybara',
    name: 'Capybara',
    latin: 'Hydrochoerus hydrochaeris',
    plate: 'V',
    category: 'wholesome',
    tint: '#7A5B2F',
    prompt: 'Portrait of a capybara, the world\'s most relaxed rodent, sleepy half-closed eyes, soft brown coarse fur, blunt snout, faint smile, hot-spring serenity.' + STYLE_SUFFIX,
  },
  {
    id: 'sloth',
    name: 'Sloth',
    latin: 'Bradypus tridactylus',
    plate: 'VI',
    category: 'wholesome',
    tint: '#6E5F38',
    prompt: 'Portrait of a three-toed sloth, shaggy moss-tinged fur, dark patches around dreamy half-lidded eyes, slow benevolent smile, claws lightly visible.' + STYLE_SUFFIX,
  },
  {
    id: 'parrot',
    name: 'Scarlet Macaw',
    latin: 'Ara macao',
    plate: 'VII',
    category: 'wholesome',
    tint: '#A33C2A',
    prompt: 'Portrait of a vivid scarlet macaw parrot, brilliant red and green plumage, curved black beak, sharp curious eye with white ring, head tilted.' + STYLE_SUFFIX,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    latin: 'Ambystoma mexicanum',
    plate: 'VIII',
    category: 'wholesome',
    tint: '#B66D6F',
    prompt: 'Portrait of a pink axolotl underwater, translucent pale skin, feathery external gill fronds fanning out, perpetual smile, tiny dark dot eyes, water ripples on face.' + STYLE_SUFFIX,
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    latin: 'Erinaceus europaeus',
    plate: 'IX',
    category: 'wholesome',
    tint: '#8C6A3D',
    prompt: 'Portrait of a small hedgehog, ring of cream and brown quills, soft round face, tiny shiny black eyes, small pink nose, slight smile.' + STYLE_SUFFIX,
  },

  // ─── Uncanny ───
  {
    id: 'clam',
    name: 'Giant Clam',
    latin: 'Tridacna gigas',
    plate: 'X',
    category: 'uncanny',
    tint: '#3F6E78',
    prompt: 'Portrait of a giant clam half-opened, ruffled iridescent blue and purple mantle inside, faint eye-spots along the rim, calcified ridged white shell, slightly unsettling but vivid.' + STYLE_SUFFIX,
  },
  {
    id: 'octopus',
    name: 'Common Octopus',
    latin: 'Octopus vulgaris',
    plate: 'XI',
    category: 'uncanny',
    tint: '#5B3A6E',
    prompt: 'Portrait of an octopus, bulbous violet head, intelligent horizontal slit pupil eyes, suckered tentacles curling near face, mottled chromatophore skin, faint blush of color.' + STYLE_SUFFIX,
  },
  {
    id: 'snail',
    name: 'Garden Snail',
    latin: 'Helix aspersa',
    plate: 'XII',
    category: 'uncanny',
    tint: '#4F5E2A',
    prompt: 'Portrait of a garden snail, glossy spiral brown shell on its back, long sensitive eye-stalks raised, glistening moist body, calm and unhurried.' + STYLE_SUFFIX,
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
