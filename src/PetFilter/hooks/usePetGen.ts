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
    async ({ source, petId }: GenInput): Promise<PetShot> => {
      const pet = petById(petId);
      if (!pet) throw new Error(`unknown pet id: ${petId}`);
      if (inFlight.current) throw new Error('pet-gen: already in flight');
      inFlight.current = true;
      cancelRef.current = false;
      setLoading(true);
      setError(null);
      setStartedAt(Date.now());

      try {
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

        setStage('morphing');
        await new Promise((r) => setTimeout(r, 350));
        checkCancel();
        setStage('rendering');
        const imageUrl = await genImg({ prompt: pet.prompt, ref_url: selfieUrl });
        checkCancel();

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
