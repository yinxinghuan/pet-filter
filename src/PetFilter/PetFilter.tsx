import { useEffect, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent } from '@shared/runtime';
import PickerScreen from './components/PickerScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultScreen from './components/ResultScreen';
import Wall, { type ScopeMode } from './components/Wall';
import { usePetGen } from './hooks/usePetGen';
import { useWall } from './hooks/useWall';
import { t } from './i18n';
import { playClick, playReveal, unlockAudio } from './utils/audio';
import { previewURL } from './utils/selfie';
import type { Phase, PetSave, PetShot, ReactionKind } from './types';
import './PetFilter.less';

export default function PetFilter() {
  const { savedData, persist } = useGameSave<PetSave>('pet-filter');
  const petGen = usePetGen();
  const wall = useWall();

  const [phase, setPhase] = useState<Phase>('picker');
  const [pendingPet, setPendingPet] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [current, setCurrent] = useState<PetShot | null>(null);
  const [cameFromWall, setCameFromWall] = useState(false);
  const [error, setError] = useState<string>('');

  // First-touch audio unlock.
  const firstTouchRef = useRef(false);
  useEffect(() => {
    function onPointer() {
      if (firstTouchRef.current) return;
      firstTouchRef.current = true;
      unlockAudio();
    }
    window.addEventListener('pointerdown', onPointer, { once: true });
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  // Lifted scope (see feedback_lifted_tab_state_across_remount.md).
  const [wallScope, setWallScope] = useState<ScopeMode>('my');
  const scopeInitialized = useRef(false);

  // Local mirror of own shots so a freshly generated one shows up
  // immediately (useGameSave doesn't echo back on persist).
  const [localExtra, setLocalExtra] = useState<PetShot[]>([]);
  const shots: PetShot[] = [...localExtra, ...(savedData?.shots ?? [])];

  useEffect(() => {
    if (scopeInitialized.current) return;
    if (savedData === undefined) return;
    scopeInitialized.current = true;
    if (shots.length === 0) setWallScope('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedData]);

  // ─── Reactions ───────────────────────────────────────────────────────
  const myReactions = (() => {
    const out = new Map<string, Set<ReactionKind>>();
    const reactions = savedData?.reactions ?? {};
    for (const [id, kinds] of Object.entries(reactions)) {
      out.set(id, new Set(kinds));
    }
    return out;
  })();
  const events = useGameEvent();
  const reactionsFor = (id: string) => myReactions.get(id) ?? new Set<ReactionKind>();
  const toggleReaction = (shotId: string, kind: ReactionKind) => {
    const set = new Set(myReactions.get(shotId) ?? []);
    if (set.has(kind)) return;
    const isFirstReactionOnShot = set.size === 0;
    set.add(kind);
    events.trigger(`react:${shotId}:${kind}`);
    if (isFirstReactionOnShot) events.trigger(`react:${shotId}`);
    const reactions: Record<string, ReactionKind[]> = {};
    for (const [id, kinds] of myReactions) {
      reactions[id] = id === shotId ? [...set] : [...kinds];
    }
    if (!reactions[shotId]) reactions[shotId] = [...set];
    persist({ shots: savedData?.shots ?? [], reactions });
  };

  // ─── Phase transitions ───────────────────────────────────────────────
  const handleSubmit = async (file: File, petId: string) => {
    setError('');
    playClick();
    setPendingPet(petId);
    const url = previewURL(file);
    setPendingPreviewUrl(url);
    setPhase('processing');
    try {
      const shot = await petGen.generate({ file, petId });
      setCurrent(shot);
      setCameFromWall(false);
      setPhase('result');
      playReveal();
      const nextShots = [shot, ...(savedData?.shots ?? [])].slice(0, 24);
      persist({ shots: nextShots, reactions: savedData?.reactions });
      setLocalExtra((prev) => [shot, ...prev].slice(0, 12));
    } catch (e) {
      setError(t('err_gen_failed'));
      setPhase('picker');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setPendingPreviewUrl(null);
    }
  };

  const handleNew = () => {
    playClick();
    setCameFromWall(false);
    setPhase('picker');
  };

  const handleWall = () => {
    playClick();
    wall.refresh();
    setPhase('wall');
  };

  const handleBackFromWall = () => {
    playClick();
    setPhase(current ? 'result' : 'picker');
  };

  const handleViewFromWall = (
    shot: PetShot,
    _author?: { userId: string; userName?: string; userAvatarUrl?: string },
  ) => {
    playClick();
    setCurrent(shot);
    setCameFromWall(true);
    setPhase('result');
  };

  return (
    <div className="pf-root">
      <div className="pf-frame">
        {phase === 'picker' && (
          <PickerScreen
            onSubmit={handleSubmit}
            onWall={handleWall}
            errorLabel={error || undefined}
          />
        )}
        {phase === 'processing' && pendingPet && (
          <ProcessingScreen
            stage={petGen.stage}
            petId={pendingPet}
            selfiePreviewUrl={pendingPreviewUrl ?? undefined}
          />
        )}
        {phase === 'result' && current && (
          <ResultScreen
            shot={current}
            cameFromWall={cameFromWall}
            myReactions={reactionsFor(current.id)}
            onToggleReaction={cameFromWall ? (k) => toggleReaction(current.id, k) : undefined}
            onNew={handleNew}
            onWall={handleWall}
          />
        )}
        {phase === 'wall' && (
          <Wall
            community={wall.entries}
            mine={shots}
            loaded={wall.loaded}
            myReactions={myReactions}
            onBack={current ? handleBackFromWall : undefined}
            onView={handleViewFromWall}
            onNew={handleNew}
            scope={wallScope}
            onScopeChange={setWallScope}
          />
        )}
      </div>
    </div>
  );
}
