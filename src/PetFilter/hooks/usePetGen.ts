import { useCallback, useRef, useState } from 'react';
import { useGenImage, useUpload } from '@shared/runtime';
import { prepareSelfie } from '../utils/selfie';
import { petById } from '../utils/pets';
import type { PetShot } from '../types';

export type Stage = '' | 'uploading' | 'morphing' | 'rendering' | 'settling';

interface GenInput {
  /** Either a fresh File the user picked OR a pre-uploaded URL (e.g.
   *  the user's Aigram avatar, already hosted by the platform). The
   *  URL path skips the upload step entirely. */
  source: { kind: 'file'; file: File } | { kind: 'url'; url: string };
  petId: string;
}

export interface UsePetGen {
  generate: (input: GenInput) => Promise<PetShot>;
  loading: boolean;
  stage: Stage;
  error: Error | null;
}

export function usePetGen(): UsePetGen {
  const { generate: genImg } = useGenImage();
  const { upload } = useUpload();

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('');
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const generate = useCallback(
    async ({ source, petId }: GenInput): Promise<PetShot> => {
      const pet = petById(petId);
      if (!pet) throw new Error(`unknown pet id: ${petId}`);
      if (inFlight.current) throw new Error('pet-gen: already in flight');
      inFlight.current = true;
      setLoading(true);
      setError(null);

      try {
        let selfieUrl: string;
        if (source.kind === 'url') {
          // Already hosted (Aigram avatar) — skip upload entirely.
          setStage('uploading');
          await new Promise((r) => setTimeout(r, 240));
          selfieUrl = source.url;
        } else {
          setStage('uploading');
          const prepared = await prepareSelfie(source.file);
          const uploaded = await upload(prepared, 'selfie.jpg');
          selfieUrl = uploaded.url;
        }

        setStage('morphing');
        // tiny beat so the user reads the morphing label
        await new Promise((r) => setTimeout(r, 350));
        setStage('rendering');
        const imageUrl = await genImg({ prompt: pet.prompt, ref_url: selfieUrl });

        // Preload the result image so the swap to the result page
        // doesn't flash an empty box.
        await preloadImage(imageUrl);
        setStage('settling');
        await new Promise((r) => setTimeout(r, 320));

        const shot: PetShot = {
          id: newShotId(),
          petId: pet.id,
          petName: pet.name,
          imageUrl,
          selfieUrl,
          createdAt: Date.now(),
        };
        return shot;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        inFlight.current = false;
        setLoading(false);
        setStage('');
      }
    },
    [genImg, upload],
  );

  return { generate, loading, stage, error };
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
