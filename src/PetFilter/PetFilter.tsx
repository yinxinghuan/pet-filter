import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent, callAigramAPI, isInAigram, telegramId, type AigramResponse } from '@shared/runtime';
import FrontispiecePage from './components/FrontispiecePage';
import PickerScreen from './components/PickerScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultScreen from './components/ResultScreen';
import Wall, { type ScopeMode } from './components/Wall';
import BestiaryPage from './components/BestiaryPage';
import { usePetGen } from './hooks/usePetGen';
import { useWall } from './hooks/useWall';
import { t } from './i18n';
import { playClick, playReveal, unlockAudio } from './utils/audio';
import { PETS } from './utils/pets';
import type { Phase, PetSave, PetShot, ReactionKind } from './types';
import './PetFilter.less';

type Source =
  | { kind: 'file'; file: File; previewUrl: string }
  | { kind: 'url'; url: string }
  | null;

export default function PetFilter() {
  const { savedData, persist } = useGameSave<PetSave>('pet-filter');
  const petGen = usePetGen();
  const wall = useWall();

  const [phase, setPhase] = useState<Phase>('frontispiece');
  const [pendingPet, setPendingPet] = useState<string | null>(null);
  const [current, setCurrent] = useState<PetShot | null>(null);
  const [cameFromWall, setCameFromWall] = useState(false);
  const [error, setError] = useState<string>('');

  // Source state lifted to parent so navigating to wall + back keeps
  // the picked likeness on file.
  const [source, setSource] = useState<Source>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch current user's avatar from Aigram once, pre-fill specimen if
  // available. Off-platform users (or accounts without an avatar) fall
  // through to the upload-first CTA.
  useEffect(() => {
    if (!isInAigram || !telegramId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await callAigramAPI<AigramResponse<{ name?: string; head_url?: string }>>(
          `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(String(telegramId))}`,
          'GET',
        );
        const url = res?.data?.head_url;
        if (cancelled) return;
        if (url) {
          setAvatarUrl(url);
          // Only auto-fill if the user hasn't already picked their own
          // likeness in this session.
          setSource((prev) => prev ?? { kind: 'url', url });
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Demo URL handling — for visual QA / heuristic audit. Lets us
  // deterministically render any phase via ?demo=...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (!demo) return;
    const fakeShot: PetShot = {
      id: 'demo-cap',
      petId: 'capybara',
      petName: 'Capybara',
      imageUrl: '/pet-filter/demo_pet_capybara.jpg',
      selfieUrl: '/pet-filter/demo_pet_cat.jpg',
      judgment: 'The patient bearing and slow, considering gaze of the subject mark this specimen plainly under the order Capybara.',
      createdAt: Date.now(),
    };
    if (demo === 'frontispiece') setPhase('frontispiece');
    else if (demo === 'picker') setPhase('picker');
    else if (demo === 'bestiary') setPhase('bestiary');
    else if (demo === 'processing') {
      setPendingPet('octopus');
      setPhase('processing');
    } else if (demo === 'result') {
      setCurrent(fakeShot);
      setCameFromWall(false);
      setPhase('result');
    } else if (demo === 'wall' || demo === 'wall-empty') {
      setPhase('wall');
    }
  }, []);

  // Populate the wall with sample entries when ?demo=wall so we can
  // QA the populated state. ?demo=wall-empty leaves it empty.
  const demoMode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('demo')
    : null;
  const demoWallEntries = useMemo<typeof wall.entries>(() => {
    if (demoMode !== 'wall') return [];
    const now = Date.now();
    return [
      { userId: '1001', userName: 'jenny', shot: { id: 'd-a', petId: 'octopus', petName: 'Common Octopus', imageUrl: '/pet-filter/demo_pet_octopus.jpg', selfieUrl: '', createdAt: now - 1000 * 60 * 32 } },
      { userId: '1002', userName: 'algram', shot: { id: 'd-b', petId: 'capybara', petName: 'Capybara', imageUrl: '/pet-filter/demo_pet_capybara.jpg', selfieUrl: '', createdAt: now - 1000 * 60 * 90 } },
      { userId: '1003', userName: 'jm·f', shot: { id: 'd-c', petId: 'cat', petName: 'House Cat', imageUrl: '/pet-filter/demo_pet_cat.jpg', selfieUrl: '', createdAt: now - 1000 * 60 * 60 * 3 } },
      { userId: '1004', userName: 'isaya', shot: { id: 'd-d', petId: 'axolotl', petName: 'Axolotl', imageUrl: '/pet-filter/cover_axolotl.jpg', selfieUrl: '', createdAt: now - 1000 * 60 * 60 * 5 } },
      { userId: '1005', userName: 'ghostpixel', shot: { id: 'd-e', petId: 'parrot', petName: 'Scarlet Macaw', imageUrl: '/pet-filter/cover_parrot.jpg', selfieUrl: '', createdAt: now - 1000 * 60 * 60 * 8 } },
      { userId: '1006', userName: 'isabel', shot: { id: 'd-f', petId: 'hedgehog', petName: 'Hedgehog', imageUrl: '/pet-filter/cover_hedgehog.jpg', selfieUrl: '', createdAt: now - 1000 * 60 * 60 * 22 } },
    ];
  }, [demoMode]);

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

  const [localExtra, setLocalExtra] = useState<PetShot[]>([]);
  const shots: PetShot[] = [...localExtra, ...(savedData?.shots ?? [])];

  useEffect(() => {
    if (scopeInitialized.current) return;
    if (savedData === undefined) return;
    scopeInitialized.current = true;
    if (shots.length === 0) setWallScope('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedData]);

  // ─── Reactions ────────────────────────────────────────────────────
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

  // ─── Phase transitions ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!source) return;
    setError('');
    playClick();
    setPetitionCount(0);
    // The Society LLM picks the species during processing — but we
    // need SOMETHING set for the Processing screen's species label
    // before the verdict lands. Pick a temporary random one (it'll
    // be overridden by the real shot when generate() resolves).
    const tentative = PETS[Math.floor(Math.random() * PETS.length)].id;
    setPendingPet(tentative);
    setPhase('processing');
    try {
      const genSource = source.kind === 'file'
        ? { kind: 'file' as const, file: source.file }
        : { kind: 'url' as const, url: source.url };
      const shot = await petGen.generate({ source: genSource });
      setCurrent(shot);
      setCameFromWall(false);
      setPhase('result');
      playReveal();
      const nextShots = [shot, ...(savedData?.shots ?? [])].slice(0, 24);
      persist({ shots: nextShots, reactions: savedData?.reactions });
      setLocalExtra((prev) => [shot, ...prev].slice(0, 12));
    } catch (e) {
      const isCancel = e instanceof Error && e.name === 'CancelledError';
      if (!isCancel) setError(t('err_gen_failed'));
      setPhase('picker');
    }
  };

  const handleCancelGen = () => {
    playClick();
    petGen.cancel();
  };

  // Petition for re-examination — reuse the current shot's selfieUrl
  // as the source (already on platform R2), pick a NEW random species
  // distinct from the current verdict, re-run the gen pipeline.
  const handlePetition = async () => {
    if (!current || petitionCount >= MAX_PETITIONS) return;
    setError('');
    playClick();
    const otherPets = PETS.filter((p) => p.id !== current.petId);
    const nextId = otherPets[Math.floor(Math.random() * otherPets.length)].id;
    setPendingPet(nextId);
    setPhase('processing');
    try {
      const shot = await petGen.generate({
        source: { kind: 'url', url: current.selfieUrl },
        forcePetId: nextId,
      });
      setCurrent(shot);
      setCameFromWall(false);
      setPhase('result');
      playReveal();
      const nextShots = [shot, ...(savedData?.shots ?? [])].slice(0, 24);
      persist({ shots: nextShots, reactions: savedData?.reactions });
      setLocalExtra((prev) => [shot, ...prev].slice(0, 12));
      setPetitionCount((n) => n + 1);
    } catch (e) {
      const isCancel = e instanceof Error && e.name === 'CancelledError';
      if (!isCancel) setError(t('err_gen_failed'));
      setPhase('result');
    }
  };

  // Petition count — how many re-examination requests have been used
  // for the CURRENT submission. Resets on a fresh handleSubmit. Caps
  // at MAX_PETITIONS (2 re-rolls = 3 total verdicts) to keep the
  // Society's authority intact.
  const MAX_PETITIONS = 2;
  const [petitionCount, setPetitionCount] = useState(0);

  // Share — copy a short citation string to clipboard. Platform-side
  // post-share is a future enhancement; clipboard works everywhere.
  const [shareLabel, setShareLabel] = useState('');
  const handleShare = () => {
    if (!current) return;
    playClick();
    const text = `${current.petName} · ${current.imageUrl} · alteru.studio`;
    try { navigator.clipboard?.writeText(text); } catch { /* no-op */ }
    setShareLabel(t('share_copied'));
    setTimeout(() => setShareLabel(''), 1800);
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

  const handleViewFromWall = (shot: PetShot) => {
    playClick();
    setCurrent(shot);
    setCameFromWall(true);
    setPhase('result');
  };

  // The processing screen shows the source thumbnail. Compute it from
  // whichever kind of source we have.
  const procPreview = !source ? undefined
    : source.kind === 'file' ? source.previewUrl
    : source.url;

  const handleOpenVolume = () => {
    playClick();
    setPhase('picker');
  };

  return (
    <div className="pf-root">
      <div className="pf-frame">
        {phase === 'frontispiece' && (
          <FrontispiecePage
            entries={wall.entries}
            myShots={shots}
            loaded={wall.loaded}
            onOpen={handleOpenVolume}
            onArchive={handleWall}
            onView={handleViewFromWall}
          />
        )}
        {phase === 'picker' && (
          <PickerScreen
            source={source}
            onSourceChange={setSource}
            hasAvatarOnFile={!!avatarUrl}
            onSubmit={() => { void handleSubmit(); }}
            onWall={handleWall}
            onBestiary={() => { playClick(); setPhase('bestiary'); }}
            errorLabel={error || undefined}
          />
        )}
        {phase === 'bestiary' && (
          <BestiaryPage
            onBack={() => { playClick(); setPhase('picker'); }}
            onSubmit={() => {
              if (source) { void handleSubmit(); }
              else { playClick(); setPhase('picker'); }
            }}
          />
        )}
        {phase === 'processing' && pendingPet && (
          <ProcessingScreen
            stage={petGen.stage}
            petId={pendingPet}
            selfiePreviewUrl={procPreview}
            startedAt={petGen.startedAt || Date.now()}
            onCancel={handleCancelGen}
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
            onShare={handleShare}
            shareLabel={shareLabel || undefined}
            onPetition={cameFromWall ? undefined : handlePetition}
            petitionCount={petitionCount}
            petitionMax={MAX_PETITIONS}
          />
        )}
        {phase === 'wall' && (
          <Wall
            community={demoWallEntries.length > 0 ? demoWallEntries : wall.entries}
            mine={shots}
            loaded={demoWallEntries.length > 0 ? true : wall.loaded}
            myReactions={myReactions}
            onBack={current ? handleBackFromWall : undefined}
            onView={handleViewFromWall}
            onNew={handleNew}
            scope={demoWallEntries.length > 0 ? 'all' : wallScope}
            onScopeChange={setWallScope}
          />
        )}
      </div>
    </div>
  );
}
