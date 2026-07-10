# Pet Filter Social Cartridge Plan

This is the first preferred social-template extraction after the social route
correction. Pet Filter is a better mother template than a pure prompt wall
because it expresses the product's strongest social pattern:

```text
me / my portrait -> identity interpretation -> generated artifact ->
personal archive -> public wall/detail -> reactions/notes/share
```

## Locked Social Engine

Do not expose these as raw generated fields:

- Portrait/reference input and upload flow.
- Species classification -> generated plate -> verdict result order.
- Personal save mirror, public bestiary/wall, detail view, reactions, notes.
- Aigram identity, notification, share/open-in-app plumbing.
- Human-eye identity anchor and recognizability constraints in image prompts.

## First Extracted Fields

Implemented:

- `src/PetFilter/cartridge/types.ts`
- `src/PetFilter/cartridge/naturalist.ts`
- `src/PetFilter/cartridge/index.ts`

Wired into:

- `PetFilter.tsx`: save key now comes from `PET_FILTER_CARTRIDGE.gameId`.
- `hooks/usePetGen.ts`: classification prompt intro, JSON output rules, and
  fallback judgment system now come from `PET_FILTER_CARTRIDGE.curator`.
- `hooks/usePetGen.ts`: classification catalog is generated from the shared
  species table instead of maintaining a second hard-coded species list.
- `utils/pets.ts`: hybrid identity anchor and natural-history plate style now
  come from `PET_FILTER_CARTRIDGE.imagePrompt`.
- `hooks/usePetGen.ts`: image variation axes now come from
  `PET_FILTER_CARTRIDGE.imagePrompt.variationAxes`.
- `PetFilter.tsx` and `components/ResultScreen.tsx`: reaction order,
  reaction notification templates, and reaction notification image prompt
  suffix now come from `PET_FILTER_CARTRIDGE.social`.
- `components/ResultScreen.tsx`: reaction aria labels now come from
  `PET_FILTER_CARTRIDGE.social.reactionAriaLabels`.
- `components/Wall.tsx`: archive stats labels, plate prefix, author/self
  bylines, author fallback, and relative-time suffixes now come from
  `PET_FILTER_CARTRIDGE.archive`.
- `utils/pets.ts`: the old `PETS`, `petById`, and `CATEGORY_LABEL` exports are
  now a compatibility layer over `PET_FILTER_CARTRIDGE.speciesPack`.
- `src/PetFilter/cartridge/naturalistSpecies.ts`: the naturalist taxonomy,
  category labels, species display metadata, and per-species img2img prompt
  bodies now live in the cartridge layer.
- `i18n/index.ts`: result, processing, frontispiece, archive, and notes copy
  can now be overridden by `PET_FILTER_CARTRIDGE.copy.overrides`, while the
  existing 5-locale table remains the fallback.
- `components/FrontispiecePage.tsx`: live/demo rotation timings, fallback
  author labels, self label, and curated demo portraits now come from
  `PET_FILTER_CARTRIDGE.frontispiece`.
- `components/ProcessingScreen.tsx`: the rotating "considered order" cadence
  now comes from `PET_FILTER_CARTRIDGE.processing`.
- `components/ResultScreen.tsx`: author attribution and judgment signature copy
  now resolve through i18n/cartridge copy instead of hard-coded English.
- `scripts/gen-species-pack.mjs`: one-sentence species-pack authoring helper.
  It can preview JSON or write a draft `gen-*Species.ts` file, and it lists
  required cover/demo assets before activation.
- `src/PetFilter/cartridge/gen-botanical-moon-garden-transformationSpecies.ts`:
  generated authoring proof for "moon garden animal transformation". It is not
  wired into the live cartridge because matching cover/demo assets still need
  to be generated first.
- `src/PetFilter/cartridge/gen-botanical-moon-garden-transformationSpecies.json`:
  machine-readable manifest for downstream asset generation.
- `scripts/gen-species-assets.mjs`: cover/demo asset generation planner and
  generator. Dry-run is the default; pass `--generate` to call the platform
  gen-image API and write local files. Generated platform WebP responses are
  normalized into real 1024x1024 JPEG assets through `sharp`; cover images use
  a moderate safe crop, while frontispiece demos use a tighter crop to remove
  text/signature artifacts from the generated edges.

## Next Extraction

Move these into cartridge fields next:

- Promote a generated preview into a standalone social game only after
  publishing QA confirms repository, UUID, poster, zipurl, save key and wall
  data isolation.
- Share/open-in-app and return-visit loops: keep the social plumbing locked,
  but let cartridges rename the ritual and artifact framing.
- Broader copy-pack coverage for non-English generated themes. The current
  cartridge proves EN/ZH overrides and falls back safely for ja/ko/es.

## Species-Pack Authoring

```bash
npm run gen:species -- --sentence "moon garden animal transformation" --json
npm run gen:species -- --sentence "moon garden animal transformation" --write
npm run gen:species-assets -- --pack src/PetFilter/cartridge/gen-botanical-moon-garden-transformationSpecies.json
npm run gen:species-assets -- --pack src/PetFilter/cartridge/gen-botanical-moon-garden-transformationSpecies.json --generate
```

Supported rule families today:

- `botanical`
- `oceanic`
- `astral`
- `mythic`
- `urban`
- `companion`

The generated file exports a `create...SpeciesPack(imagePrompt)` function and a
`generatedSpeciesPackMeta` block with `coverAssetsRequired` and
`demoPortraitsSuggested`. Do not activate a generated pack until those image
assets exist.

The asset helper plans these files by default:

- `cover_${pet.id}.jpg` for every generated species.
- Frontispiece demo images listed in `demoPortraitsSuggested`.

It supports `--covers-only`, `--demos-only`, `--limit N`, `--force`, and
`--ref-url <public https url>` for demo img2img. Without `--generate`, it only
prints the plan.

Generated proof assets:

- `public/cover_*.jpg`: 12 generated Moon Garden species covers.
- `public/demo_*.jpg`: 3 generated frontispiece demos.
- All generated proof assets are real JPEG, 1024x1024.
- QA note: the first naturalist-plate prompt produced page numbers/signatures;
  the helper now avoids book-page wording and normalizes/crops outputs to keep
  UI-ready, text-free assets.

## Activation Preview

The Moon Garden proof pack can be previewed without replacing the default
Naturalist Society cartridge:

```bash
npm run preview -- --host 127.0.0.1 --port 5195
open "http://127.0.0.1:5195/?cartridge=moon-garden"
```

Useful QA routes:

- `?cartridge=moon-garden&demo=frontispiece`
- `?cartridge=moon-garden&demo=picker`
- `?cartridge=moon-garden&demo=bestiary`
- `?cartridge=moon-garden&demo=processing`
- `?cartridge=moon-garden&demo=result`
- `?cartridge=moon-garden&demo=wall`

Implementation notes:

- `src/PetFilter/cartridge/moonGarden.ts` creates a preview cartridge from the
  generated species pack and the generated cover/demo assets.
- `src/PetFilter/cartridge/index.ts` selects it only for
  `?cartridge=moon-garden` or `?theme=moon-garden`; default traffic still uses
  `naturalistCartridge`.
- The preview uses `gameId: "pet-filter-moon-garden-preview"` so save data is
  isolated from the default Pet Filter game during local QA.
- Demo result and demo wall now derive from the active cartridge instead of
  hard-coded old species.
- `Ticket` reads the top-left house label from cartridge/i18n copy instead of
  hard-coding Natural History.

## QA

- `npm run build`
- `npm run gen:species-assets -- --pack src/PetFilter/cartridge/gen-botanical-moon-garden-transformationSpecies.json --generate`
- Playwright screenshot QA for desktop/mobile:
  - frontispiece, picker, bestiary, processing, result, wall
  - no broken images
  - no console errors
  - mobile CTA overflow fixed by shortening Moon Garden CTA copy
- Demo states still render:
  - `?demo=frontispiece`
  - `?demo=picker`
  - `?demo=processing`
  - `?demo=result`
  - `?demo=result-wall`
  - `?demo=wall`
  - `?demo=bestiary`
- Signed-out archive and download CTA still work.
- Signed-in save, wall, notes, reactions, and notification paths must be
  checked before publishing a generated social game.
