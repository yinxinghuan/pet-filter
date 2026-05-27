import { useCallback, useRef, useState } from 'react';
import { useGenImage, useUpload } from '@shared/runtime';
import { prepareSelfie } from '../utils/selfie';
import { petById, PETS } from '../utils/pets';
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

// LLM-matched classification — single chat returns BOTH the species
// the Society picks AND the matching verdict sentence. Saves a
// round-trip and guarantees the two are consistent with each other.
const CLASSIFY_SYSTEM = (
  'You are a 19th-century natural history society scholar examining ' +
  'an unknown subject. Classify them under ONE of these twelve known ' +
  'orders. Each order has character:\n\n' +
  '- cat (Felis catus) — domestic, alert, gracefully detached\n' +
  '- dog (Canis familiaris) — loyal, warm, easily moved\n' +
  '- hamster (Mesocricetus auratus) — small, busy, cheerful, hoards\n' +
  '- duck (Anas platyrhynchos) — calm, drifty, faintly comic\n' +
  '- capybara (Hydrochoerus hydrochaeris) — supremely relaxed, kind\n' +
  '- sloth (Bradypus tridactylus) — slow, dreamy, mossy, benevolent\n' +
  '- parrot (Ara macao) — vivid, conspicuous, intelligent, vocal\n' +
  '- axolotl (Ambystoma mexicanum) — perpetually amused, otherworldly\n' +
  '- hedgehog (Erinaceus europaeus) — cautious, quietly spiky\n' +
  '- clam (Tridacna gigas) — withdrawn, treasure inside, uncanny\n' +
  '- octopus (Octopus vulgaris) — improvisational, alien, watchful\n' +
  '- snail (Helix aspersa) — patient, unhurried, carries home\n\n' +
  'Output STRICT JSON only, no markdown fences, no commentary:\n' +
  '{"species": "<id>", "verdict": "<one elegant Victorian-voice sentence>"}\n\n' +
  'Where <id> is exactly one of: cat, dog, hamster, duck, capybara, ' +
  'sloth, parrot, axolotl, hedgehog, clam, octopus, snail.\n\n' +
  'The verdict is a single sentence under 24 words in the voice of ' +
  'a 19th-c. naturalist (e.g. "The faint set of the brow betrays..." ' +
  'or "Something in the bearing recalls..."). Do NOT use second ' +
  'person ("you"). Refer to the subject as "the subject" or "this ' +
  'specimen". No quotes inside the verdict.'
);

function buildClassifyUser(selfieUrl: string): string {
  return `The Society is asked to examine the subject. Portrait under consideration: ${selfieUrl}`;
}

interface Classification {
  petId: string;
  verdict: string;
}

async function classify(selfieUrl: string): Promise<Classification | null> {
  const raw = await chatOnce(CLASSIFY_SYSTEM, buildClassifyUser(selfieUrl));
  if (!raw) return null;
  // Strip optional markdown code fences.
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
  return { petId: species, verdict: verdict.trim() };
}

// Fallback judgment when classification fails — used for the
// random-species path so we still have a verdict to show.
const JUDGMENT_SYSTEM = (
  'You are a 19th-century natural history society scholar writing a ' +
  'verdict for an unknown subject. Output ONE single elegant sentence ' +
  'in the voice of a Victorian naturalist (e.g. "The faint set of ' +
  "the brow betrays...\", \"Something in the bearing recalls...\"). " +
  'Do NOT reference photographs, AI, or modern concepts. Do NOT use ' +
  'second person ("you"). Refer to the subject as "the subject" or ' +
  '"this specimen". Maximum 24 words. Plain text, no quotes.'
);

function buildJudgmentUserPrompt(petName: string, latin: string): string {
  return `The Society has classified the subject under the order ${petName} (${latin}). Write the verdict.`;
}

function randomPetId(exclude?: string): string {
  const pool = exclude ? PETS.filter((p) => p.id !== exclude) : PETS;
  return pool[Math.floor(Math.random() * pool.length)].id;
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
    async ({ source, forcePetId }: GenInput): Promise<PetShot> => {
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
          // in one call. Falls back to random + simple judgment if
          // the model fails to return valid JSON.
          const cls = await classify(selfieUrl).catch(() => null);
          checkCancel();
          if (cls) {
            petId = cls.petId;
            judgmentText = cls.verdict;
          } else {
            petId = randomPetId();
            // judgmentText filled by the parallel chat below.
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
        const [imageUrl, fallbackJudgment] = await Promise.all([
          genImg({ prompt: pet.prompt, ref_url: selfieUrl }),
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
