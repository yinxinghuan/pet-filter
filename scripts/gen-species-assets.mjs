#!/usr/bin/env node
// ============================================================================
//  gen-species-assets.mjs — generated species pack -> cover/demo image assets.
//
//  Default mode is a dry run. Pass --generate to call the platform image API.
//  Activation is allowed only after every required local asset exists.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CARTRIDGE_DIR = path.join(ROOT, 'src/PetFilter/cartridge');
const API_URL = 'https://chat.aiwaves.tech/aigram/api/gen-image';
const ORIGIN = 'https://aigram.app';

function parseArgs(argv) {
  const args = {
    pack: '',
    outDir: PUBLIC_DIR,
    generate: false,
    activate: false,
    force: false,
    covers: true,
    demos: true,
    refUrl: '',
    limit: Infinity,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--pack' && next) args.pack = path.resolve(ROOT, argv[++i]);
    else if (key === '--out' && next) args.outDir = path.resolve(ROOT, argv[++i]);
    else if (key === '--generate') args.generate = true;
    else if (key === '--activate') args.activate = true;
    else if (key === '--force') args.force = true;
    else if (key === '--covers-only') args.demos = false;
    else if (key === '--demos-only') args.covers = false;
    else if (key === '--ref-url' && next) args.refUrl = argv[++i];
    else if (key === '--limit' && next) args.limit = Math.max(1, Number(argv[++i]) || Infinity);
    else if (key === '-h' || key === '--help') usage(0);
  }

  if (!args.pack) {
    const generatedManifest = path.join(CARTRIDGE_DIR, 'generatedSpecies.json');
    if (fs.existsSync(generatedManifest)) {
      args.pack = generatedManifest;
      return args;
    }
    const candidates = fs.readdirSync(CARTRIDGE_DIR)
      .filter((name) => /^gen-.+Species\.json$/.test(name))
      .sort();
    if (candidates.length === 1) {
      args.pack = path.join(ROOT, 'src/PetFilter/cartridge', candidates[0]);
    } else {
      usage(1);
    }
  }

  return args;
}

function usage(code) {
  const message = [
    'Usage:',
    '  npm run gen:species-assets -- --generate --activate',
    '  npm run gen:species-assets -- --activate',
    '  npm run gen:species-assets -- --pack src/PetFilter/cartridge/gen-...Species.json',
    '  npm run gen:species-assets -- --pack src/PetFilter/cartridge/gen-...Species.json --generate',
    '',
    'Options:',
    '  --generate       Actually call the gen-image API. Default is dry-run.',
    '  --activate       Activate generated.ts only after every required cover/demo asset exists.',
    '  --force          Regenerate files that already exist.',
    '  --covers-only    Generate only cover_<id>.jpg files.',
    '  --demos-only     Generate only frontispiece demo files.',
    '  --ref-url URL    Optional public HTTPS reference for demo img2img.',
    '  --limit N        Limit number of planned/generated assets for smoke tests.',
  ].join('\n');
  (code ? console.error : console.log)(message);
  process.exit(code);
}

function readPack(packPath) {
  const raw = fs.readFileSync(packPath, 'utf8');
  const pack = JSON.parse(raw);
  if (!pack.id || !Array.isArray(pack.species)) {
    throw new Error(`Invalid species-pack manifest: ${packPath}`);
  }
  return pack;
}

function coverPrompt(species, pack) {
  return [
    `A square cover portrait of an invented animal species inspired by ${species.name} (${species.latin}).`,
    `Mood family: ${pack.title}.`,
    `Specimen traits: ${species.promptCore}.`,
    'Pure species portrait only, not a human, no human face, no human shoulders.',
    'If the traits mention human eyes, reinterpret them as forward-facing expressive specimen eyes.',
    'Centered head-and-shoulders animal portrait, calm observation pose, close crop with the animal filling most of the square frame.',
    'High-end mobile game portrait asset, tactile illustrated realism, soft studio lighting, detailed fur and botanical textures, matte warm background.',
    'Not a printed book page, not a museum label, not a catalog card, not a signed illustration, not a paper artwork.',
    '1:1 aspect. Minimal empty margins. Absolutely no text anywhere, no labels, no captions, no page numbers, no specimen numbers, no handwriting, no artist signature, no logos, no border, no UI.',
  ].join(' ');
}

function demoPrompt(species, pack) {
  return [
    `A frontispiece demo portrait for ${pack.title}: a human-animal HYBRID reclassified as ${species.name} (${species.latin}).`,
    `Transformation traits: ${species.promptCore}.`,
    'The result must read as a hybrid identity portrait, half-human and half-creature.',
    'Keep unmistakably human eyes: forward-facing, visible sclera, eyelids, eyebrows, expressive gaze.',
    'Keep human shoulders and broad face structure visible under the transformation.',
    'Animal features should dominate the surface, but identity remains readable.',
    'High-end mobile game portrait asset, tactile illustrated realism, soft studio lighting, detailed fur and botanical textures, matte warm background.',
    'Not a printed book page, not a museum label, not a catalog card, not a signed illustration, not a paper artwork.',
    '1:1 aspect. Minimal empty margins. Absolutely no text anywhere, no labels, no captions, no page numbers, no specimen numbers, no handwriting, no artist signature, no logos, no border, no UI.',
  ].join(' ');
}

function buildJobs(pack, args) {
  const jobs = [];
  if (args.covers) {
    for (const species of pack.species) {
      jobs.push({
        kind: 'cover',
        id: species.id,
        out: path.join(args.outDir, `cover_${species.id}.jpg`),
        prompt: coverPrompt(species, pack),
      });
    }
  }
  if (args.demos) {
    for (const demo of pack.demoPortraitsSuggested ?? []) {
      const species = pack.species.find((item) => item.id === demo.petId);
      if (!species) continue;
      jobs.push({
        kind: 'demo',
        id: species.id,
        out: path.join(args.outDir, demo.asset),
        prompt: demoPrompt(species, pack),
        refUrl: args.refUrl || undefined,
      });
    }
  }
  return jobs.slice(0, args.limit);
}

async function generateImage(job) {
  const body = job.refUrl
    ? { prompt: job.prompt, ref_url: job.refUrl }
    : { prompt: job.prompt };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`gen-image HTTP ${res.status}: ${text.slice(0, 220)}`);
  }
  const data = await res.json();
  const url = typeof data === 'string' ? data : data.url ?? data.image_url ?? data.output?.url;
  if (!url) throw new Error(`gen-image response had no url: ${JSON.stringify(data).slice(0, 220)}`);
  return url;
}

async function download(url, outPath, kind) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`download HTTP ${res.status}: ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await normalizeImage(bytes, outPath, kind);
}

async function normalizeImage(bytes, outPath, kind) {
  const image = sharp(bytes);
  const meta = await image.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;
  const cropRatio = kind === 'demo' ? 0.76 : 0.86;
  const cropSize = Math.floor(Math.min(width, height) * cropRatio);
  const left = Math.max(0, Math.floor((width - cropSize) / 2));
  const top = Math.max(0, Math.floor((height - cropSize) / 2));
  await image
    .extract({ left, top, width: cropSize, height: cropSize })
    .resize(1024, 1024, { fit: 'cover' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outPath);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function generatedCartridgeSource(pack) {
  const title = JSON.stringify(pack.title);
  const id = JSON.stringify(pack.id);
  return `import type { PetFilterCartridge } from './types';
import { naturalistCartridge } from './naturalist';
import { createGeneratedSpeciesPack, generatedSpeciesPackMeta } from './generatedSpecies';

const generatedImagePrompt: PetFilterCartridge['imagePrompt'] = {
  ...naturalistCartridge.imagePrompt,
  styleSuffix:
    naturalistCartridge.imagePrompt.styleSuffix +
    ' Theme direction: ' + ${title} +
    '. Premium mobile social-avatar composition; no text, label, border, logo, or signature.',
};

export const generatedCartridge: PetFilterCartridge = {
  ...naturalistCartridge,
  id: ${id},
  gameId: 'pet-filter-' + ${id} + '-preview',
  imagePrompt: generatedImagePrompt,
  copy: {
    overrides: {
      ...naturalistCartridge.copy.overrides,
      en: {
        ...naturalistCartridge.copy.overrides.en,
        brand_mark: 'generated identity archive · preview',
        front_book_title: ${title},
        front_book_sub: 'A generated animal identity archive',
        bestiary_title: ${title},
        bestiary_sub: 'A generated taxonomy. Tap a portrait to inspect.',
        catalog_note: 'The archive will choose one generated order for the submitted likeness.',
        cta_transfigure: 'Transform me',
        wall_heading: ${title} + ' Archive',
      },
      zh: {
        ...naturalistCartridge.copy.overrides.zh,
        brand_mark: '生成身份档案 · 预览',
        front_book_title: ${title},
        front_book_sub: '一句话生成的动物身份档案',
        bestiary_title: ${title},
        bestiary_sub: '由一句话生成的物种分类。轻触肖像以详阅。',
        catalog_note: '档案会为提交的肖像选择一种生成目。',
        cta_transfigure: '为我变形',
        wall_heading: ${title} + '档案',
      },
    },
  },
  frontispiece: {
    ...naturalistCartridge.frontispiece,
    demoPortraits: [...generatedSpeciesPackMeta.demoPortraitsSuggested],
  },
  speciesPack: createGeneratedSpeciesPack(generatedImagePrompt),
};
`;
}

function activateGeneratedPack(pack, outDir) {
  if (path.resolve(outDir) !== path.resolve(PUBLIC_DIR)) {
    throw new Error('Activation requires assets in the project public/ directory. Remove --out.');
  }
  const required = [
    ...(pack.coverAssetsRequired ?? []),
    ...(pack.demoPortraitsSuggested ?? []).map((item) => item.asset),
  ];
  const missing = required.filter((asset) => !fs.existsSync(path.join(PUBLIC_DIR, asset)));
  if (missing.length) {
    throw new Error(`Cannot activate: ${missing.length} required asset(s) missing: ${missing.slice(0, 6).join(', ')}`);
  }
  const speciesSource = path.join(CARTRIDGE_DIR, 'generatedSpecies.ts');
  if (!fs.existsSync(speciesSource)) {
    throw new Error('Cannot activate: generatedSpecies.ts is missing. Run gen:species -- --write first.');
  }
  const outPath = path.join(CARTRIDGE_DIR, 'generated.ts');
  fs.writeFileSync(outPath, generatedCartridgeSource(pack));
  console.log(`\nActivated preview cartridge: ${path.relative(ROOT, outPath)}`);
  console.log('Open: http://127.0.0.1:5173/ (or ?cartridge=generated)');
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const pack = readPack(args.pack);
  const jobs = buildJobs(pack, args);
  const planned = jobs.map((job) => ({
    ...job,
    exists: fs.existsSync(job.out),
    relativeOut: path.relative(ROOT, job.out),
  }));

  console.log(`Pack: ${pack.id}`);
  console.log(`Title: ${pack.title}`);
  console.log(`Mode: ${args.generate ? 'generate' : 'dry-run'}`);
  console.log(`Jobs: ${planned.length}`);

  for (const job of planned) {
    const status = job.exists && !args.force ? 'skip-existing' : args.generate ? 'generate' : 'plan';
    console.log(`- [${status}] ${job.kind} ${job.id} -> ${job.relativeOut}`);
  }

  if (!args.generate) {
    console.log('\nDry run only. Pass --generate to call gen-image.');
    if (args.activate) activateGeneratedPack(pack, args.outDir);
    return;
  }

  for (const job of planned) {
    if (job.exists && !args.force) continue;
    let attempt = 0;
    while (attempt < 3) {
      attempt += 1;
      try {
        console.log(`\n${job.kind} ${job.id}: generating (attempt ${attempt})...`);
        const url = await generateImage(job);
        console.log(`  url: ${url}`);
        await download(url, job.out, job.kind);
        console.log(`  wrote ${path.relative(ROOT, job.out)}`);
        break;
      } catch (err) {
        console.error(`  failed: ${err.message}`);
        if (attempt >= 3) throw err;
        await sleep([3000, 8000, 15000][attempt - 1]);
      }
    }
    await sleep(1100);
  }

  if (args.activate) activateGeneratedPack(pack, args.outDir);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
