import { useCallback, useRef, useState } from 'react';
import { useGenImage, useUpload } from '@shared/runtime';
import { prepareSelfie } from '../utils/selfie';
import { petById, PETS } from '../utils/pets';
import { PET_FILTER_CARTRIDGE } from '../cartridge';
import type { PetShot } from '../types';

const CHAT_URL = 'https://chat.aiwaves.tech/aigram/api/game-chat';

// Single-shot chat helper. Returns the assistant's text or '' on
// any failure — judgment is decorative so we never block the gen
// pipeline on chat completion.
async function chatOnce(system: string, user: string): Promise<string> {
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) return '';
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return (json.choices?.[0]?.message?.content ?? '').trim();
  } catch {
    return '';
  }
}

function buildClassificationCatalog(): string {
  return PETS
    .map((pet) => `- ${pet.id} (${pet.latin}) — ${pet.character}`)
    .join('\n');
}

function buildSpeciesIdList(): string {
  return PETS.map((pet) => pet.id).join(', ');
}

// LLM-matched classification — single chat returns BOTH the species
// the Society picks AND the matching verdict sentence. Saves a
// round-trip and guarantees the two are consistent with each other.
const CLASSIFY_SYSTEM = (
  PET_FILTER_CARTRIDGE.curator.classifySystemIntro + '\n\n' +
  buildClassificationCatalog() + '\n\n' +
  PET_FILTER_CARTRIDGE.curator.outputRules + '\n\n' +
  `Where <id> is exactly one of: ${buildSpeciesIdList()}.`
);

function buildClassifyUser(selfieUrl: string, avoid: string[]): string {
  const nonce = Math.random().toString(36).slice(2, 8);
  let msg = `The Society is asked to examine the subject. Portrait under consideration: ${selfieUrl}`;
  if (avoid.length > 0) {
    msg += `\n\nDO NOT classify under any of these orders — they have already been judged for this subject in previous sittings: ${avoid.join(', ')}. Choose a DIFFERENT order this time.`;
  }
  msg += `\n\nseed: ${nonce}`;
  return msg;
}

interface Classification {
  petId: string;
  verdict: string;
}

async function classify(selfieUrl: string, avoid: string[] = []): Promise<Classification | null> {
  const raw = await chatOnce(CLASSIFY_SYSTEM, buildClassifyUser(selfieUrl, avoid));
  if (!raw) return null;
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  let parsed: unknown;
  try { parsed = JSON.parse(stripped); } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;
  const species = (parsed as { species?: unknown }).species;
  const verdict = (parsed as { verdict?: unknown }).verdict;
  if (typeof species !== 'string' || typeof verdict !== 'string') return null;
  if (!petById(species)) return null;
  // Defense in depth — if the LLM ignores the avoid list, return
  // null so the caller falls back to a random unused species.
  if (avoid.includes(species)) return null;
  return { petId: species, verdict: verdict.trim() };
}

// Fallback judgment when classification fails — used for the
// random-species path so we still have a verdict to show.
const JUDGMENT_SYSTEM = (
  PET_FILTER_CARTRIDGE.curator.judgmentSystem
);

function buildJudgmentUserPrompt(petName: string, latin: string): string {
  return `The Society has classified the subject under the order ${petName} (${latin}). Write the verdict.`;
}

function randomPetId(exclude?: string[]): string {
  const excl = exclude ?? [];
  // Try excluding the avoid list; if everything is excluded (user has
  // all species), fall back to the full pool.
  const pool = PETS.filter((p) => !excl.includes(p.id));
  const final = pool.length > 0 ? pool : PETS;
  return final[Math.floor(Math.random() * final.length)].id;
}

// Same person + same species + same prompt = nearly identical output.
// Each axis below is decorative (does not break species identity or
// the EYE ANCHOR) but rotates the CLIP text embedding enough to push
// img2img into a different region of latent space. We sample one phrase
// from each axis and append a short variation string to the prompt.
function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildVariationSuffix(): string {
  const axes = PET_FILTER_CARTRIDGE.imagePrompt.variationAxes;
  return (
    ` Compositional variation for this plate: ${pickOne(axes.pose)}; ` +
    `${pickOne(axes.light)}; ${pickOne(axes.composition)}; ` +
    `${pickOne(axes.render)}.`
  );
}

function buildIdentitySafePrompt(petName: string, variation: string): string {
  return (
    'HARD FULL-VISUAL-IDENTITY CAST MAP: SUBJECT A is the complete identity from reference image 1. ' +
    'Create a reference-preserving 19th-century natural-history study of exactly SUBJECT A. Reproduce the original visible form and appearance: silhouette, every visible shape and opening, skin or material, hair or fabric, colors, patterns, clothing, accessories, occlusion, pose, and all identity-defining details. Keep these structurally unchanged. ' +
    `Express ${petName} only as restrained flat watercolor markings on the already-visible surfaces plus a small two-dimensional background vignette; never alter SUBJECT A's silhouette or insert a new head, face, body, limb, clothing layer, or creature underneath. Identity fidelity is more important than species strength. ` +
    'Do not assume SUBJECT A is human. If SUBJECT A is non-human, faceless, masked, covered, or lacks any face, skin, hair, hands, arms, legs, feet, or other body part, do not alter its surface at all and express the species only in the background vignette; preserve that exact structure and absence. Absent anatomy MUST NOT be invented, hidden features MUST NOT be revealed, and new markings or accessories MUST NOT be added to SUBJECT A. ' +
    'Fine pen-and-ink linework with a soft watercolor wash on aged cream paper with faint foxing; centered observation portrait in a square composition. ' +
    'Render exactly one SUBJECT A. No generic replacement person or animal, duplicate subject, text, letters, numbers, labels, logos, frames, or borders.' +
    variation
  );
}

export type Stage = '' | 'uploading' | 'morphing' | 'rendering' | 'settling';

interface GenInput {
  /** Either a fresh File the user picked OR a pre-uploaded URL (e.g.
   *  the user's Aigram avatar, already hosted by the platform). The
   *  URL path skips the upload step entirely. */
  source: { kind: 'file'; file: File } | { kind: 'url'; url: string };
  /** Optional override — if set, skip Society classification and use
   *  this species. Used by the petition flow where the caller picks
   *  a random non-current species to challenge the previous verdict. */
  forcePetId?: string;
  /** Species the user has already received — bias both the LLM AND
   *  the random fallback away from these so repeated submissions
   *  don't return 『three parrots in a row』. Pass petIds. */
  avoidPetIds?: string[];
}

export class CancelledError extends Error {
  constructor() { super('cancelled'); this.name = 'CancelledError'; }
}

export interface UsePetGen {
  generate: (input: GenInput) => Promise<PetShot>;
  cancel: () => void;
  loading: boolean;
  stage: Stage;
  error: Error | null;
  /** Monotonic timestamp when the current `generate` started, or 0
   *  when idle. Lets the UI compute elapsed seconds outside React
   *  state to avoid re-render thrashing. */
  startedAt: number;
}

export function usePetGen(): UsePetGen {
  const { generate: genImg } = useGenImage();
  const { upload } = useUpload();

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('');
  const [error, setError] = useState<Error | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const inFlight = useRef(false);
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  function checkCancel() {
    if (cancelRef.current) throw new CancelledError();
  }

  const generate = useCallback(
    async ({ source, forcePetId, avoidPetIds = [] }: GenInput): Promise<PetShot> => {
      if (inFlight.current) throw new Error('pet-gen: already in flight');
      inFlight.current = true;
      cancelRef.current = false;
      setLoading(true);
      setError(null);
      setStartedAt(Date.now());

      try {
        // ─── Stage 1: upload selfie if needed ──────────────────────
        let selfieUrl: string;
        if (source.kind === 'url') {
          setStage('uploading');
          await new Promise((r) => setTimeout(r, 240));
          checkCancel();
          selfieUrl = source.url;
        } else {
          setStage('uploading');
          const prepared = await prepareSelfie(source.file);
          checkCancel();
          const uploaded = await upload(prepared, 'selfie.jpg');
          checkCancel();
          selfieUrl = uploaded.url;
        }

        // ─── Stage 2: classify (Society consults the orders) ──────
        setStage('morphing');
        let petId: string;
        let judgmentText: string | undefined;
        if (forcePetId && petById(forcePetId)) {
          // Petition path — caller picked an explicit non-current species.
          petId = forcePetId;
          // Fire a simple judgment-only chat to match the forced
          // species. Run in parallel with img2img to save wall-clock.
        } else {
          // Classification path — LLM picks species + writes verdict
          // in one call. Passes the avoid list so repeated submissions
          // get different species. Falls back to random (also excluding
          // the avoid list) + simple judgment if the model fails.
          const cls = await classify(selfieUrl, avoidPetIds).catch(() => null);
          checkCancel();
          if (cls) {
            petId = cls.petId;
            judgmentText = cls.verdict;
          } else {
            petId = randomPetId(avoidPetIds);
          }
        }

        const pet = petById(petId);
        if (!pet) throw new Error(`unknown pet id: ${petId}`);

        // ─── Stage 3: img2img + (if needed) separate judgment ──────
        setStage('rendering');
        const needSeparateJudgment = !judgmentText;
        const judgmentPromise = needSeparateJudgment
          ? chatOnce(JUDGMENT_SYSTEM, buildJudgmentUserPrompt(pet.name, pet.latin))
          : Promise.resolve('');
        const variedPrompt = buildIdentitySafePrompt(pet.name, buildVariationSuffix());
        const [imageUrl, fallbackJudgment] = await Promise.all([
          genImg({ prompt: variedPrompt, ref_url: selfieUrl }),
          judgmentPromise,
        ]);
        checkCancel();
        if (!judgmentText) judgmentText = fallbackJudgment || undefined;

        await preloadImage(imageUrl);
        checkCancel();
        setStage('settling');
        await new Promise((r) => setTimeout(r, 320));
        checkCancel();

        const shot: PetShot = {
          id: newShotId(),
          petId: pet.id,
          petName: pet.name,
          imageUrl,
          selfieUrl,
          judgment: judgmentText,
          createdAt: Date.now(),
        };
        return shot;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        inFlight.current = false;
        cancelRef.current = false;
        setLoading(false);
        setStage('');
        setStartedAt(0);
      }
    },
    [genImg, upload],
  );

  return { generate, cancel, loading, stage, error, startedAt };
}

function newShotId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
