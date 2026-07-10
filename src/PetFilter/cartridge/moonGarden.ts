import type { PetFilterCartridge } from './types';
import { naturalistCartridge } from './naturalist';
import {
  createBotanicalMoonGardenTransformationSpeciesPack,
  generatedSpeciesPackMeta,
} from './gen-botanical-moon-garden-transformationSpecies';

const moonGardenImagePrompt: PetFilterCartridge['imagePrompt'] = {
  hybridPrefix:
    'A high-end mobile game portrait asset of a HYBRID moon-garden creature — mostly the ' +
    'species, with the person from the reference photo still recognizable underneath. ' +
    'CRITICAL ANCHOR: The EYES must remain UNMISTAKABLY HUMAN — forward-facing, ' +
    'almond-shape, visible white sclera, eyelids, eyebrows, and expressive human gaze. ' +
    'Keep human shoulders and broad face structure visible under the transformation. ' +
    'Transform their head this way: ',
  hybridSuffixGuard:
    ' Balance: animal and botanical features dominate the surface (~70%), while human ' +
    'eyes + brow ridge + jawline + shoulders anchor identity (~30%). Do not include ' +
    'any plaque, ID number, caption, label, signature, watermark, or written text.',
  styleSuffix:
    ' The result must read as a moonlit botanical-animal identity portrait, not a pure animal. ' +
    'Centered head-and-shoulders bust, close crop, premium social avatar composition. ' +
    'Tactile illustrated realism, soft studio moonlight, detailed fur, moss, petals, leaves, ' +
    'and subtle botanical textures. Matte warm night-garden background, gentle depth of field, ' +
    'no printed page, no museum card, no border, no UI, no text, no logo, no signature. 1:1 aspect.',
  variationAxes: {
    pose: [
      'frontal moon-garden portrait',
      'three-quarter view with shoulders visible',
      'head turned gently toward the light',
      'chin tilted slightly upward',
      'calm direct gaze into the camera',
    ],
    light: [
      'soft moonlight rim from the upper right',
      'warm lantern fill from below the leaves',
      'diffuse greenhouse light with a faint lunar glow',
      'cool night-garden light with soft catchlights',
    ],
    composition: [
      'small fern curls framing the head',
      'subtle moon disc blurred in the background',
      'a few petals and leaves near the shoulders',
      'moss and vines integrated into the silhouette',
      'close avatar crop with minimal empty margin',
    ],
    render: [
      'fine realistic fur detail',
      'soft painterly botanical edges',
      'matte premium game-art finish',
      'gentle depth of field around the silhouette',
    ],
  },
};

export const moonGardenCartridge: PetFilterCartridge = {
  ...naturalistCartridge,
  id: generatedSpeciesPackMeta.id,
  gameId: 'pet-filter-moon-garden-preview',
  imagePrompt: moonGardenImagePrompt,
  copy: {
    overrides: {
      ...naturalistCartridge.copy.overrides,
      en: {
        ...naturalistCartridge.copy.overrides.en,
        brand_mark: 'moon garden archive · preview',
        front_house: 'ALTERU MOON GARDEN',
        front_book_title: 'Moon Garden',
        front_book_sub: 'or, A Night-Blooming Animal Archive',
        bestiary_title: 'Twelve Moon-Garden Orders',
        bestiary_sub: 'A preview taxonomy grown from one sentence. Tap a portrait to inspect.',
        hero_title: 'Moonlit Reclassification',
        hero_sub: 'Submit a likeness — the garden will decide which night-blooming animal form is hiding beneath it.',
        catalog_note: 'This preview uses a generated species pack. The garden will pick one order for the submitted likeness.',
        cta_transfigure: 'Transform me',
        cta_wall: 'Moon garden archive',
        result_subhead: 'The garden has found this subject to be a',
        result_below_image: 'grown for the moon garden archive',
        result_judgment_signature: 'the garden',
        wall_heading: 'Moon Garden Archive',
        wall_sub: 'Recent night-blooming transformations from the generated preview pack.',
      },
      zh: {
        ...naturalistCartridge.copy.overrides.zh,
        brand_mark: '月光花园档案 · 预览',
        front_house: 'ALTERU 月光花园',
        front_book_title: '《月光花园》',
        front_book_sub: '或：夜间盛放的动物档案',
        bestiary_title: '十二种月光花园目',
        bestiary_sub: '由一句话长出的预览物种包。轻触肖像以详阅。',
        hero_title: '月光下的重新分类',
        hero_sub: '提交一张肖像 — 花园会判断其中藏着哪一种夜间盛放的动物形态。',
        catalog_note: '这是生成物种包预览。花园会为提交的肖像选择一个目。',
        cta_transfigure: '为我变形',
        cta_wall: '月光花园档案',
        result_subhead: '花园发现此对象属于',
        result_below_image: '生长于月光花园档案',
        result_judgment_signature: '月光花园',
        wall_heading: '月光花园档案',
        wall_sub: '生成预览包里近期盛放的变形。',
      },
    },
  },
  frontispiece: {
    ...naturalistCartridge.frontispiece,
    demoPortraits: [...generatedSpeciesPackMeta.demoPortraitsSuggested],
  },
  speciesPack: createBotanicalMoonGardenTransformationSpeciesPack(moonGardenImagePrompt),
  social: {
    ...naturalistCartridge.social,
    reactionImagePromptSuffix: 'moonlit botanical-animal social avatar, no text, no logo',
  },
  archive: {
    ...naturalistCartridge.archive,
    authorFallback: 'gardener',
  },
  cartridgeCanChange: [
    ...naturalistCartridge.cartridgeCanChange,
    'generated species pack and matching cover/demo assets',
  ],
};
