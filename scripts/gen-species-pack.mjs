#!/usr/bin/env node
// ============================================================================
//  gen-species-pack.mjs — one sentence -> Pet Filter species-pack draft.
//
//  This is a conservative authoring helper. It does not activate the generated
//  pack, because Pet Filter also needs matching cover/demo images before a new
//  taxonomy can look complete in the bestiary and processing screens.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARTRIDGE_DIR = path.join(ROOT, 'src/PetFilter/cartridge');

const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'into', 'with', 'from',
  'my', 'me', 'self', 'portrait', 'avatar', 'photo', 'filter', 'turn', 'make',
  'become', 'as', 'in', 'on', 'by', 'about', 'game', 'species', 'animal',
]);

function parseArgs(argv) {
  const args = { sentence: '', write: false, json: false, count: 12 };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--sentence' && next) args.sentence = argv[++i];
    else if (key === '--write') args.write = true;
    else if (key === '--json') args.json = true;
    else if (key === '--count' && next) args.count = Math.max(6, Math.min(20, Number(argv[++i]) || 12));
    else if (key === '-h' || key === '--help') usage(0);
  }
  if (!args.sentence) usage(1);
  return args;
}

function usage(code) {
  const message = [
    'Usage:',
    '  node scripts/gen-species-pack.mjs --sentence "moon garden animal transformation" [--json] [--write]',
    '',
    'Writes a draft species-pack file only when --write is passed.',
    'It does not activate the pack; generated cover/demo assets are still required.',
  ].join('\n');
  (code ? console.error : console.log)(message);
  process.exit(code);
}

function hashText(value) {
  let hash = 2166136261;
  for (const ch of value) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).slice(0, 7);
}

function includesAny(text, words) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function slugify(input) {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
  return ascii || `pack-${hashText(input)}`;
}

function titleFromSentence(sentence, family) {
  const picked = sentence
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((part) => part.length > 2 && !COMMON_WORDS.has(part.toLowerCase()))
    .slice(0, 3);
  if (!picked.length) {
    const fallback = {
      botanical: 'Botanical Orders',
      oceanic: 'Oceanic Orders',
      astral: 'Astral Orders',
      mythic: 'Mythic Orders',
      urban: 'Urban Orders',
      companion: 'Companion Orders',
    };
    return fallback[family] ?? 'Generated Orders';
  }
  return picked
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function classify(sentence) {
  if (includesAny(sentence, ['plant', 'flower', 'garden', 'forest', 'moss', 'tree', 'botanical', '植物', '花', '森林', '花园', '草木'])) return 'botanical';
  if (includesAny(sentence, ['ocean', 'sea', 'fish', 'coral', 'tide', 'deep', '水', '海', '鱼', '珊瑚', '潮汐'])) return 'oceanic';
  if (includesAny(sentence, ['moon', 'star', 'dream', 'cosmic', 'spirit', 'ghost', '星', '月', '梦', '灵', '宇宙'])) return 'astral';
  if (includesAny(sentence, ['dragon', 'myth', 'magic', 'fairy', 'monster', 'legend', '神话', '龙', '魔法', '妖精', '传说'])) return 'mythic';
  if (includesAny(sentence, ['city', 'office', 'school', 'street', 'internet', 'robot', '城市', '办公室', '学校', '街道', '网络', '机器人'])) return 'urban';
  return 'companion';
}

const PALETTES = {
  botanical: ['#6C8A3B', '#9A7A35', '#4F7D5F', '#A85E75', '#5E6F38', '#7A8E52', '#B08C48', '#55745B', '#8B6D88', '#687B3E', '#9A8F5F', '#6A6F45'],
  oceanic: ['#2F7A8A', '#3F6E78', '#557FA6', '#4B8F92', '#7A5E8D', '#2E607A', '#6C8B9E', '#3C8271', '#7F6B40', '#5B7E95', '#2E6F8A', '#846C8E'],
  astral: ['#5B5E9A', '#7A5BA6', '#3F6E78', '#8B6D88', '#6E5F9A', '#4F5E8E', '#7F8DBC', '#9E7AA8', '#5C6F8A', '#6D5A8C', '#3F6478', '#8A7B9A'],
  mythic: ['#8B4B3A', '#A33C2A', '#7A5B2F', '#5B3A6E', '#3F6E78', '#9E4B2E', '#6E5F38', '#8C6A3D', '#B66D6F', '#4F5E2A', '#A67C3F', '#5C8A3A'],
  urban: ['#4D6678', '#7A6A5A', '#8B4B3A', '#3F6E78', '#6B5F7A', '#8A7A45', '#526C58', '#7A5B2F', '#5E6378', '#8B6D5F', '#4F5E6A', '#7B4E5E'],
  companion: ['#8B4B3A', '#A67C3F', '#7A5B2F', '#6E5F38', '#A33C2A', '#B66D6F', '#8C6A3D', '#9D8270', '#C97A2E', '#9E4B2E', '#D9B98A', '#6B4A2A'],
};

const LIBRARY = {
  botanical: [
    entry('fern-crowned-cat', 'Fern-Crowned Cat', 'Felis filix', 'I', 'everyday', 'Patient and sly; it hides its thoughts beneath folded green fronds.', 'tabby cat fur is interwoven with curled fern fronds across the cheeks and brow, triangular cat ears rise through soft moss, tiny leaflets replace whisker shadows'),
    entry('orchid-fox', 'Orchid Fox', 'Vulpes orchidea', 'II', 'everyday', 'Elegant, watchful, and impossible to corner in conversation.', 'pale fox fur covers the face, enormous orchid-petal ears bloom from the head, petal markings frame the human eyes without covering them'),
    entry('moss-rabbit', 'Moss Rabbit', 'Lepus muscus', 'III', 'everyday', 'Soft-footed and cautious; it carries rain in its silence.', 'soft rabbit fur covers the face and neck, long ears are carpeted with velvet moss and tiny dew drops, a small twitching nose remains at the center'),
    entry('lotus-capybara', 'Lotus Capybara', 'Hydrochoerus lotos', 'IV', 'wholesome', 'Serene beyond persuasion; it rests where all arguments end.', 'coarse capybara fur covers the face, lotus petals form a calm collar around the shoulders, a blunt snout and small rounded ears remain clear'),
    entry('willow-sloth', 'Willow Sloth', 'Bradypus salix', 'V', 'wholesome', 'Dreamy, slow, and shaded by old kindness.', 'shaggy sloth fur hangs like willow leaves around the face, dark eye patches frame the human gaze, trailing green strands replace hair'),
    entry('marigold-dog', 'Marigold Dog', 'Canis calendula', 'VI', 'wholesome', 'Loyal and sun-warmed; it follows laughter home.', 'golden dog fur covers the face, floppy ears are edged with marigold petals, a wet dark nose and warm muzzle remain prominent'),
    entry('cactus-hedgehog', 'Cactus Hedgehog', 'Erinaceus opuntia', 'VII', 'wholesome', 'Kind but armored; a small desert of boundaries.', 'cream hedgehog fur covers the face, short cactus spines and tiny blossoms replace the quill coat around the head and shoulders'),
    entry('mushroom-owl', 'Mushroom Owl', 'Strix mycena', 'VIII', 'uncanny', 'Nocturnal, thoughtful, and faintly luminous after rain.', 'owl feather disks frame the face, small mushroom caps crown the head, speckled fungal markings glow softly along the cheeks'),
    entry('lichen-snail', 'Lichen Snail', 'Helix lichena', 'IX', 'uncanny', 'Unhurried and ancient; it wears its weather openly.', 'a spiral snail shell overgrown with pale lichen rises behind the head, moist mollusk skin covers the cheeks, separate eye-stalks lift from the temples'),
    entry('belladonna-frog', 'Belladonna Frog', 'Hyla belladonna', 'X', 'uncanny', 'Bright, still, and not as harmless as it appears.', 'glossy green frog skin covers the face, poisonous purple belladonna berries frame the shoulders, a wide amphibian smile crosses the lower face'),
    entry('ivy-octopus', 'Ivy Octopus', 'Octopus hedera', 'XI', 'uncanny', 'Clever and clinging; it leaves a pattern wherever it passes.', 'violet octopus mantle replaces the crown of the head, suckered tentacles twine with ivy vines around the shoulders and jaw'),
    entry('seed-puffer', 'Seed Pufferfish', 'Takifugu semen', 'XII', 'uncanny', 'Small pressure held inside a perfect roundness.', 'round pufferfish head with olive seedpod markings, short botanical spines cover the cheeks and brow, a small pursed mouth sits below human eyes'),
  ],
  oceanic: [
    entry('tide-cat', 'Tide Cat', 'Felis aestus', 'I', 'everyday', 'Alert, tidal, and fond of disappearing beneath the furniture of the sea.', 'sleek cat fur is patterned like blue-gray tide lines, triangular ears are edged with seafoam, white whiskers curl like wave crests'),
    entry('harbor-dog', 'Harbor Dog', 'Canis portus', 'II', 'everyday', 'Faithful as a lighthouse and twice as wet.', 'wet dog fur covers the face, floppy ears hang like soaked sails, a dark nose glistens with salt spray'),
    entry('shell-rabbit', 'Shell Rabbit', 'Lepus concha', 'III', 'everyday', 'Startled by sound, soothed by the shape of home.', 'soft rabbit fur covers the face, long ears are banded with nacre shell patterns, small pearly shell fragments frame the cheeks'),
    entry('coral-capybara', 'Coral Capybara', 'Hydrochoerus corallium', 'IV', 'wholesome', 'Communal, patient, and built for warm shallows.', 'capybara fur covers the face, small branching coral forms a gentle crown, blunt snout and rounded ears remain visible'),
    entry('kelp-otter', 'Kelp Otter', 'Lutra laminaria', 'V', 'wholesome', 'Playful, dexterous, and forever holding on.', 'sleek otter fur covers the face, ribbons of kelp trail around the shoulders, stiff white whiskers fan from the muzzle'),
    entry('moon-jelly-fawn', 'Moon Jelly Fawn', 'Cervus aurelia', 'VI', 'wholesome', 'Gentle, translucent, and easily moved by currents.', 'soft fawn fur blends into a translucent moon-jelly bell over the crown, long glowing tendrils fall around the neck'),
    entry('anemone-hedgehog', 'Anemone Hedgehog', 'Erinaceus actinia', 'VII', 'wholesome', 'Cautious and colorful; it bristles only when needed.', 'hedgehog fur covers the face, soft sea-anemone tendrils replace quills around the head, cream and coral colors surround the brow'),
    entry('clam-sage', 'Clam Sage', 'Tridacna sapiens', 'VIII', 'uncanny', 'Withdrawn until opened, then full of impossible blue.', 'two ridged giant clam shell halves enclose the head like an open helmet, iridescent mantle flesh frames the human eyes'),
    entry('octopus-oracle', 'Octopus Oracle', 'Octopus augur', 'IX', 'uncanny', 'Improvisational, watchful, and always solving three things at once.', 'large violet octopus mantle replaces the crown, thick suckered tentacles cascade down around cheeks and shoulders'),
    entry('lantern-puffer', 'Lantern Pufferfish', 'Takifugu lucerna', 'X', 'uncanny', 'A small warning light in deep water.', 'round inflated pufferfish head with lanternlike golden glow beneath the skin, short spines cover cheeks and brow'),
    entry('glass-frog', 'Glass Frog', 'Hyla vitrea', 'XI', 'uncanny', 'Almost transparent, except where feeling gathers.', 'smooth translucent green frog skin covers the face and throat, faint inner glow and broad frog smile remain visible'),
    entry('snail-of-the-reef', 'Reef Snail', 'Helix scopulus', 'XII', 'uncanny', 'Slow enough to map the ocean floor by memory.', 'large glossy spiral shell crusted with reef colors rises behind the head, moist mollusk skin replaces cheeks, separate eye-stalks lift from the temples'),
  ],
  astral: [
    entry('moon-cat', 'Moon Cat', 'Felis luna', 'I', 'everyday', 'A quiet watcher; it knows which rooms are touched by night.', 'silver tabby fur covers the face, crescent moon markings arc across the brow, triangular ears are dusted with pale starlight'),
    entry('comet-dog', 'Comet Dog', 'Canis cometa', 'II', 'everyday', 'Loyal, bright, and arriving faster than expected.', 'white dog fur streaked with comet gold covers the face, floppy ears trail like twin tails of light, a dark nose anchors the muzzle'),
    entry('star-hamster', 'Star Hamster', 'Mesocricetus stella', 'III', 'everyday', 'Small, busy, and secretly arranging constellations.', 'golden hamster fur covers the face, stuffed cheeks sparkle with tiny star freckles, round ears glow faintly at the edges'),
    entry('dream-capybara', 'Dream Capybara', 'Hydrochoerus somnium', 'IV', 'wholesome', 'Serene enough to sleep through prophecy.', 'soft brown capybara fur covers the face, lavender dream mist curls around rounded ears and blunt snout'),
    entry('nebula-sloth', 'Nebula Sloth', 'Bradypus nebula', 'V', 'wholesome', 'Slow, cosmic, and strangely reassuring.', 'shaggy sloth fur becomes a dusty violet nebula around the head, dark mask patches frame the human eyes'),
    entry('aurora-fox', 'Aurora Fox', 'Vulpes aurora', 'VI', 'wholesome', 'Alert and luminous, with one ear always listening north.', 'pale fox fur covers the face, enormous ears glow with green and violet aurora bands, pointed muzzle remains delicate'),
    entry('meteor-hedgehog', 'Meteor Hedgehog', 'Erinaceus meteorus', 'VII', 'wholesome', 'A shy little impact event.', 'hedgehog fur covers the face, short quills glow like cooling meteor iron, amber sparks dot the head and shoulders'),
    entry('eclipse-owl', 'Eclipse Owl', 'Strix eclipsis', 'VIII', 'uncanny', 'It watches from the edge of what cannot be seen.', 'dark owl feather disks frame the face, a black-gold eclipse halo crowns the head, feathered shadows surround the human eyes'),
    entry('void-octopus', 'Void Octopus', 'Octopus vacuus', 'IX', 'uncanny', 'Clever in darkness; it keeps spare exits in every thought.', 'deep indigo octopus mantle replaces the crown, star-speckled tentacles cascade around the shoulders'),
    entry('moon-jellyfish', 'Moon Jellyfish', 'Aurelia lunaris', 'X', 'uncanny', 'Drifting, translucent, and difficult to hold in memory.', 'large translucent moon-blue jellyfish bell crowns the head, long luminous tentacles fall around face and shoulders'),
    entry('saturn-snail', 'Saturn Snail', 'Helix saturnia', 'XI', 'uncanny', 'Slow, ringed, and planetary in private habits.', 'spiral snail shell with Saturn-ring bands rises behind the head, moist pearl-gray skin covers cheeks, separate eye-stalks lift at temples'),
    entry('cosmic-puffer', 'Cosmic Pufferfish', 'Takifugu caelum', 'XII', 'uncanny', 'A round universe with excellent boundaries.', 'round inflated pufferfish head patterned with tiny constellations, short dark spines cover cheeks and brow, small pursed mouth beneath human eyes'),
  ],
  mythic: [
    entry('griffin-cat', 'Griffin Cat', 'Felis gryphus', 'I', 'everyday', 'Proud, precise, and easily offended by poor posture.', 'cat fur covers the face while eagle-like feather crests rise around triangular ears, a subtle hooked feline muzzle remains under human eyes'),
    entry('hound-of-embers', 'Hound of Embers', 'Canis favilla', 'II', 'everyday', 'Faithful, warm, and always standing between friends and danger.', 'dark dog fur covers the face, floppy ears are rimmed with ember glow, a wet black nose and warm muzzle stay prominent'),
    entry('moon-hare', 'Moon Hare', 'Lepus lunaris', 'III', 'everyday', 'Quick, silver, and fond of impossible leaps.', 'soft silver rabbit fur covers the face, long upright ears carry moon markings, a twitching pink nose remains clear'),
    entry('kirin-capybara', 'Kirin Capybara', 'Hydrochoerus qilinus', 'IV', 'wholesome', 'A peaceful omen that prefers hot springs.', 'capybara fur covers the face, a gentle kirin horn and small scaled brow plates rise between rounded ears'),
    entry('phoenix-parrot', 'Phoenix Parrot', 'Ara phoenix', 'V', 'wholesome', 'Vivid, loud, and prepared to begin again.', 'scarlet parrot feathers cover the face and head, a curved black beak is framed by soft flame-like crest feathers'),
    entry('unicorn-otter', 'Unicorn Otter', 'Lutra unicornis', 'VI', 'wholesome', 'Playful, impossible, and more graceful than it admits.', 'sleek otter fur covers the face, a small pearl horn rises from the brow, white whiskers fan from the muzzle'),
    entry('dragon-hedgehog', 'Dragon Hedgehog', 'Erinaceus draco', 'VII', 'wholesome', 'Tiny, armored, and brave out of proportion.', 'hedgehog fur covers the face, small dragon scales and short quills cover crown and shoulders, tiny horn nubs sit above the brow'),
    entry('basilisk-frog', 'Basilisk Frog', 'Hyla basiliscus', 'VIII', 'uncanny', 'Still enough to make others nervous.', 'glossy green frog skin covers the face, a small basilisk crest runs along the head, gold speckles surround the human eyes'),
    entry('siren-jellyfish', 'Siren Jellyfish', 'Aurelia sirena', 'IX', 'uncanny', 'Softly radiant, with a voice like distant glass.', 'translucent jellyfish bell crowns the head, long singing tendrils fall around face and shoulders, pale violet glow touches the cheeks'),
    entry('kraken-octopus', 'Kraken Octopus', 'Octopus titanus', 'X', 'uncanny', 'Old, clever, and not fully contained by the page.', 'large dark octopus mantle replaces the crown, thick suckered tentacles curl around shoulders like ancient ropes'),
    entry('gorgon-snail', 'Gorgon Snail', 'Helix gorgonia', 'XI', 'uncanny', 'Slow but memorable; looking twice is rarely wise.', 'spiral shell rises behind the head, small serpent-like snail eye-stalks lift from the temples, damp olive skin covers cheeks'),
    entry('chimera-puffer', 'Chimera Pufferfish', 'Takifugu chimaera', 'XII', 'uncanny', 'Round, guarded, and assembled from several warnings.', 'inflated pufferfish head with mismatched scale patches, small horns and short spines cover cheeks and brow, a pursed mouth sits below human eyes'),
  ],
  urban: [
    entry('subway-cat', 'Subway Cat', 'Felis subterranea', 'I', 'everyday', 'Alert, nocturnal, and perfectly at home between stations.', 'gray tabby cat fur covers the face, triangular ears are edged with tiny reflective transit-map colors, white whiskers cut across the cheeks'),
    entry('courier-dog', 'Courier Dog', 'Canis tabellarius', 'II', 'everyday', 'Loyal, fast, and carrying everyone else’s weather.', 'warm dog fur covers the face, floppy ears tuck under a tiny courier cap shape, a dark nose and practical muzzle remain prominent'),
    entry('desk-hamster', 'Desk Hamster', 'Mesocricetus scrinium', 'III', 'everyday', 'Busy, over-caffeinated, and storing small victories.', 'golden hamster fur covers the face, round cheeks bulge like overfilled drawers, tiny paperclip-like whisker shadows frame the mouth'),
    entry('elevator-capybara', 'Elevator Capybara', 'Hydrochoerus elevatus', 'IV', 'wholesome', 'Calm in tight spaces; a friend to awkward silences.', 'coarse capybara fur covers the face, rounded ears and blunt snout stay clear, subtle elevator-button glow dots the collar'),
    entry('library-sloth', 'Library Sloth', 'Bradypus bibliotheca', 'V', 'wholesome', 'Slow, gentle, and never late for a thought.', 'shaggy sloth fur covers the face, dark mask patches frame the human eyes, small bookmark-colored strands replace hair'),
    entry('neon-fox', 'Neon Fox', 'Vulpes neonis', 'VI', 'wholesome', 'Clever, bright, and gone before the sign stops buzzing.', 'pale fox fur covers the face, enormous ears glow along their edges with soft neon, pointed muzzle remains delicate'),
    entry('pocket-hedgehog', 'Pocket Hedgehog', 'Erinaceus urbanus', 'VII', 'wholesome', 'Cautious, compact, and built for crowded days.', 'soft brown hedgehog fur covers the face, short quills resemble folded city receipts around crown and shoulders'),
    entry('billboard-owl', 'Billboard Owl', 'Strix tabula', 'VIII', 'uncanny', 'Wide-eyed and public, but never quite honest.', 'owl feather disks frame the face, small glowing signboard markings crown the head, feathered rings surround human eyes'),
    entry('server-room-octopus', 'Server-Room Octopus', 'Octopus machina', 'IX', 'uncanny', 'Many-armed, patient, and quietly solving the outage.', 'violet octopus mantle replaces the crown, cable-like tentacles with suckers cascade around shoulders and jaw'),
    entry('traffic-jellyfish', 'Traffic Jellyfish', 'Aurelia semaphora', 'X', 'uncanny', 'Drifts through signals and arrives when it arrives.', 'translucent jellyfish bell crowns the head, red amber green glow pulses through long tendrils around the shoulders'),
    entry('receipt-snail', 'Receipt Snail', 'Helix charta', 'XI', 'uncanny', 'Slow, documented, and impossible to fully expense.', 'spiral shell patterned like curled receipt paper rises behind the head, moist gray skin covers cheeks, eye-stalks lift from temples'),
    entry('battery-puffer', 'Battery Pufferfish', 'Takifugu volta', 'XII', 'uncanny', 'Small, overcharged, and best handled with care.', 'round inflated pufferfish head with battery-like copper markings, short spines cover cheeks and brow, small pursed mouth below human eyes'),
  ],
  companion: [
    entry('house-cat', 'House Cat', 'Felis domesticus', 'I', 'everyday', 'Observant, independent, and only sometimes pretending not to listen.', 'full tabby cat fur covers cheeks and brow, triangular ears rise from the top of the head, white whiskers fan from the muzzle'),
    entry('good-dog', 'Good Dog', 'Canis familiaris', 'II', 'everyday', 'Warm, loyal, and the most honest of the known orders.', 'full dog fur covers the face, long floppy ears hang from the head, a pronounced muzzle and wet black nose remain clear'),
    entry('round-hamster', 'Round Hamster', 'Mesocricetus rotundus', 'III', 'everyday', 'Cheerful, small, and storing tenderness for later.', 'caramel hamster fur covers the face, huge stuffed cheeks puff outward, small round ears sit high on the head'),
    entry('gentle-duck', 'Gentle Duck', 'Anas placida', 'IV', 'everyday', 'Calm, drifting, and faintly comic in a dignified way.', 'fluffy yellow duck down covers the face, a wide flat orange bill replaces nose and mouth area without hiding human eyes'),
    entry('quiet-capybara', 'Quiet Capybara', 'Hydrochoerus placidus', 'V', 'wholesome', 'Serene, social, and difficult to hurry.', 'coarse brown capybara fur covers the face and neck, a large blunt snout and small rounded ears define the silhouette'),
    entry('slow-sloth', 'Slow Sloth', 'Bradypus mitis', 'VI', 'wholesome', 'Dreamy, mossy, and loyal to the long view.', 'shaggy gray-brown sloth fur covers face and head, dark mask patches frame the human eyes, slow benevolent smile'),
    entry('red-panda', 'Red Panda', 'Ailurus fulgens', 'VII', 'wholesome', 'Solitary, gentle, and wrapped in mountain warmth.', 'rust-red red-panda fur covers the face, cream markings frame cheeks and brow, small triangular ears sit above a soft snout'),
    entry('river-otter', 'River Otter', 'Lutra fluvius', 'VIII', 'wholesome', 'Playful, dexterous, and fond of holding on.', 'sleek wet dark-brown otter fur covers face and neck, stiff white whiskers fan outward, small rounded ears press close'),
    entry('garden-snail', 'Garden Snail', 'Helix hortensis', 'IX', 'uncanny', 'Patient and private; it brings home everywhere.', 'large glossy spiral snail shell occupies the back and top of the head, moist translucent skin covers cheeks, eye-stalks rise from temples'),
    entry('common-octopus', 'Common Octopus', 'Octopus curiosus', 'X', 'uncanny', 'Improvisational, intelligent, and never out of exits.', 'large violet octopus mantle dominates the crown, thick suckered tentacles cascade around head and shoulders'),
    entry('moon-jelly', 'Moon Jelly', 'Aurelia mollis', 'XI', 'uncanny', 'Transparent to weather, opaque to intention.', 'translucent pale-blue jellyfish bell crowns the head, long ghostly tentacles fall around face and shoulders'),
    entry('tree-frog', 'Tree Frog', 'Hyla viridis', 'XII', 'uncanny', 'Still until it sings; brighter than its size suggests.', 'smooth bright-green frog skin covers face and neck, wide frog smile across the lower face, faint speckled markings on cheeks'),
  ],
};

function entry(id, name, latin, plate, category, character, promptCore) {
  return { id, name, latin, plate, category, character, promptCore };
}

function pickSpeciesPack(sentence, count) {
  const family = classify(sentence);
  const title = titleFromSentence(sentence, family);
  const hasAsciiTitle = /[a-zA-Z0-9]/.test(sentence);
  const id = hasAsciiTitle
    ? slugify(`${family}-${title}`)
    : `${family}-${hashText(sentence)}`;
  const source = LIBRARY[family].slice(0, count);
  const colors = PALETTES[family];
  const species = source.map((item, index) => ({
    ...item,
    tint: colors[index % colors.length],
  }));

  return {
    id,
    family,
    title,
    sentence,
    species,
    categoryLabels: {
      everyday: family === 'urban' ? 'Everyday Signals' : 'Familiar Orders',
      wholesome: family === 'botanical' ? 'Gentle Growths' : 'Gentle Orders',
      uncanny: family === 'astral' ? 'Astral Anomalies' : 'Curious Orders',
    },
    coverAssetsRequired: species.map((item) => `cover_${item.id}.jpg`),
    demoPortraitsSuggested: species.slice(0, 3).map((item) => ({
      asset: `demo_${item.id}.jpg`,
      petId: item.id,
    })),
  };
}

function validatePack(pack) {
  const errors = [];
  const seen = new Set();
  if (!/^[a-z0-9-]+$/.test(pack.id)) errors.push('pack.id must be kebab-case');
  if (pack.species.length < 6) errors.push('pack.species must include at least 6 entries');
  for (const item of pack.species) {
    if (!/^[a-z0-9-]+$/.test(item.id)) errors.push(`${item.name}: id must be kebab-case`);
    if (seen.has(item.id)) errors.push(`${item.id}: duplicate id`);
    seen.add(item.id);
    if (!['everyday', 'wholesome', 'uncanny'].includes(item.category)) errors.push(`${item.id}: invalid category`);
    for (const key of ['name', 'latin', 'plate', 'character', 'promptCore', 'tint']) {
      if (!item[key]) errors.push(`${item.id}: missing ${key}`);
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(item.tint)) errors.push(`${item.id}: tint must be #rrggbb`);
  }
  return errors;
}

function exportNameFor(pack) {
  return `create${pack.id.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')}SpeciesPack`;
}

function manifestFor(pack) {
  return {
    id: pack.id,
    family: pack.family,
    title: pack.title,
    sentence: pack.sentence,
    categoryLabels: pack.categoryLabels,
    species: pack.species,
    coverAssetsRequired: pack.coverAssetsRequired,
    demoPortraitsSuggested: pack.demoPortraitsSuggested,
  };
}

function fileSource(pack, exportName = exportNameFor(pack)) {
  const items = pack.species.map(({ tint, ...item }) => ({ ...item, tint }));

  return `import type { PetFilterCartridge, PetSpeciesPack } from './types';

// Generated by scripts/gen-species-pack.mjs.
// This is an authoring draft only: add matching cover/demo assets before
// wiring it into the live cartridge.
export const generatedSpeciesPackMeta = ${JSON.stringify(manifestFor(pack), null, 2)} as const;

const generatedItems = ${JSON.stringify(items, null, 2)} as const;

export function ${exportName}(
  imagePrompt: PetFilterCartridge['imagePrompt'],
): PetSpeciesPack {
  const HYBRID_PREFIX = imagePrompt.hybridPrefix;
  const HYBRID_SUFFIX_GUARD = imagePrompt.hybridSuffixGuard;
  const STYLE_SUFFIX = imagePrompt.styleSuffix;

  const species = generatedItems.map(({ promptCore, ...item }) => ({
    ...item,
    prompt: HYBRID_PREFIX + promptCore + '. (Eyes stay human per anchor.)' + HYBRID_SUFFIX_GUARD + STYLE_SUFFIX,
  })) satisfies PetSpeciesPack['species'];

  return {
    categoryLabels: ${JSON.stringify(pack.categoryLabels, null, 6)},
    species,
  };
}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pack = pickSpeciesPack(args.sentence, args.count);
  const errors = validatePack(pack);
  if (errors.length) {
    console.error('Generated species pack failed validation:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  if (args.json) {
    console.log(JSON.stringify(pack, null, 2));
  } else {
    console.log(`Sentence: ${args.sentence}`);
    console.log(`Pack:     ${pack.id}`);
    console.log(`Family:   ${pack.family}`);
    console.log(`Title:    ${pack.title}`);
    console.log(`Species:  ${pack.species.length}`);
    console.log('Assets needed before activation:');
    for (const asset of pack.coverAssetsRequired) console.log(`  - ${asset}`);
  }

  if (args.write) {
    const outPath = path.join(CARTRIDGE_DIR, 'generatedSpecies.ts');
    const manifestPath = path.join(CARTRIDGE_DIR, 'generatedSpecies.json');
    fs.writeFileSync(outPath, fileSource(pack, 'createGeneratedSpeciesPack'));
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifestFor(pack), null, 2)}\n`);
    console.log(`\nWritten: ${path.relative(ROOT, outPath)}`);
    console.log(`Manifest: ${path.relative(ROOT, manifestPath)}`);
    console.log('Export:  createGeneratedSpeciesPack');
    console.log('Next: npm run gen:species-assets -- --generate --activate');
  }
}

main();
