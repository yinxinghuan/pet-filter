import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent, callAigramAPI, isInAigramNow, getTelegramId, type AigramResponse } from '@shared/runtime';
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
import { PET_FILTER_CARTRIDGE } from './cartridge';
import {
  appendMessage,
  guestbookNotifyConfig,
  newMessage,
  threadFor,
} from '@shared/social/guestbook';
import type { Phase, PetSave, PetShot, ReactionKind } from './types';
import './PetFilter.less';

type Source =
  | { kind: 'file'; file: File; previewUrl: string }
  | { kind: 'url'; url: string }
  | null;

function demoAssetForPet(petId: string): string {
  const demo = PET_FILTER_CARTRIDGE.frontispiece.demoPortraits.find((item) => item.petId === petId);
  return demo?.asset ?? `cover_${petId}.jpg`;
}

function makeDemoShot(index: number, id: string, createdAt: number): PetShot {
  const pet = PETS[index % PETS.length] ?? PETS[0];
  const asset = demoAssetForPet(pet.id);
  return {
    id,
    petId: pet.id,
    petName: pet.name,
    imageUrl: (new URL(import.meta.env.BASE_URL + asset, location.href).href),
    selfieUrl: (new URL(import.meta.env.BASE_URL + asset, location.href).href),
    judgment: `${pet.character}`,
    createdAt,
  };
}

export default function PetFilter() {
  const { savedData, persist } = useGameSave<PetSave>(PET_FILTER_CARTRIDGE.gameId);
  const petGen = usePetGen();
  const wall = useWall();

  const [phase, setPhase] = useState<Phase>('frontispiece');
  const [pendingPet, setPendingPet] = useState<string | null>(null);
  const [current, setCurrent] = useState<PetShot | null>(null);
  const [cameFromWall, setCameFromWall] = useState(false);
  // Author of the plate currently shown on result page (only set
  // when we navigated in from the wall — own plates don't need it).
  const [currentAuthor, setCurrentAuthor] = useState<
    { userId: string; userName?: string; userAvatarUrl?: string } | null
  >(null);
  const [error, setError] = useState<string>('');

  // Source state lifted to parent so navigating to wall + back keeps
  // the picked likeness on file.
  const [source, setSource] = useState<Source>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch current user's avatar from Aigram once, pre-fill specimen if
  // available. Off-platform users (or accounts without an avatar) fall
  // through to the upload-first CTA.
  useEffect(() => {
    if (!isInAigramNow() || !getTelegramId()!) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await callAigramAPI<AigramResponse<{ name?: string; head_url?: string }>>(
          `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(String(getTelegramId()!))}`,
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
    const fakeShot = makeDemoShot(0, 'demo-primary', Date.now());
    if (demo === 'frontispiece') setPhase('frontispiece');
    else if (demo === 'picker') setPhase('picker');
    else if (demo === 'bestiary') setPhase('bestiary');
    else if (demo === 'processing') {
      setPendingPet(PETS[0]?.id ?? fakeShot.petId);
      setPhase('processing');
    } else if (demo === 'result') {
      setCurrent(fakeShot);
      setCameFromWall(false);
      setPhase('result');
    } else if (demo === 'result-wall') {
      // Wall-tapped-into-result: shows the reaction buttons.
      setCurrent(fakeShot);
      setCameFromWall(true);
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
    const names = ['jenny', 'algram', 'jm·f', 'isaya', 'ghostpixel', 'isabel'];
    return PETS.slice(0, 6).map((pet, index) => ({
      userId: String(1001 + index),
      userName: names[index] ?? PET_FILTER_CARTRIDGE.archive.authorFallback,
      shot: {
        ...makeDemoShot(index, `d-${index}`, now - 1000 * 60 * [32, 90, 180, 300, 480, 1320][index]),
        petId: pet.id,
        petName: pet.name,
        imageUrl: (new URL(import.meta.env.BASE_URL + demoAssetForPet(pet.id), location.href).href),
      },
    }));
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

  // Local mirror — useGameSave.savedData does NOT update after persist(),
  // so handleSubmit/handlePetition's [shot, ...savedData?.shots] saw the
  // pre-first-publish (stale) base on subsequent publishes and quietly
  // overwrote older shots. See feedback_useGameSave_local_mirror.md.
  const [mirror, setMirror] = useState<PetSave | undefined>(undefined);
  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      setMirror(savedData ?? { shots: [], reactions: {} });
    }
  }, [savedData, mirror]);

  const shots: PetShot[] = mirror?.shots ?? [];

  useEffect(() => {
    if (scopeInitialized.current) return;
    if (savedData === undefined) return;
    scopeInitialized.current = true;
    if (shots.length === 0) setWallScope('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedData]);

  // ─── Reactions ────────────────────────────────────────────────────
  // useGameSave doesn't echo savedData back synchronously on persist
  // (known issue, also documented in Album Cover Generator). So we
  // keep a local mirror that the UI reads first; saved data merges in
  // when it eventually rehydrates.
  const myReactions = (() => {
    const out = new Map<string, Set<ReactionKind>>();
    const reactions = mirror?.reactions ?? {};
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
    // The wall-view setter wires `setCurrent(shot)` + `setCurrentAuthor`,
    // so when the reaction fires we always know whose plate this is.
    const shot = current;
    const authorId = currentAuthor?.userId;
    const selfId = getTelegramId()! || 'self';
    const isOther = !!authorId && authorId !== 'self' && authorId !== selfId;
    const reactTmpl = PET_FILTER_CARTRIDGE.social.reactionNotifyTemplates[kind];
    const config = (isOther && shot && shot.imageUrl)
      ? {
          actions: [
            {
              type: 'notify',
              target_user_id: authorId!,
              image: {
                ref_url: shot.imageUrl,
                prompt: `${shot.petName ?? 'specimen'} ${PET_FILTER_CARTRIDGE.social.reactionImagePromptSuffix}`,
              },
              message: { template: reactTmpl, variables: ['sender_name'] },
            },
          ],
        }
      : undefined;
    events.trigger(`react:${shotId}:${kind}`, config);
    if (isFirstReactionOnShot) events.trigger(`react:${shotId}`);
    const reactions: Record<string, ReactionKind[]> = {};
    for (const [id, kinds] of myReactions) {
      reactions[id] = id === shotId ? [...set] : [...kinds];
    }
    if (!reactions[shotId]) reactions[shotId] = [...set];
    const nextSave: PetSave = {
      shots: mirror?.shots ?? [],
      reactions,
      messages: mirror?.messages,
    };
    setMirror(nextSave);
    persist(nextSave);
  };

  // ─── Guestbook (留言) ──────────────────────────────────────────────
  // Public text notes left on a plate (the artifact = PetShot, keyed by
  // shot.id). Stored in our OWN blob (full RMW so it never clobbers
  // shots/reactions), displayed best-effort across blobs via the wall,
  // and the plate's author is pinged once per plate per session.
  const noteNotified = useRef<Set<string>>(new Set());
  const sendMessage = (
    shot: PetShot,
    author: { userId: string; userName?: string; userAvatarUrl?: string } | null | undefined,
    text: string,
  ) => {
    const selfId = getTelegramId()! ? String(getTelegramId()!) : '';
    const authorId = author?.userId;
    // The artifact's author — undefined for self/anon (no notify target).
    const toUserId = authorId && authorId !== 'self' ? authorId : undefined;
    const msg = newMessage(shot.id, toUserId, text);
    if (!msg) return;
    playClick();
    // Full read-modify-write through the mirror so the note rides
    // alongside shots + reactions (partial-persist would wipe them).
    const base: PetSave = mirror ?? { shots: [], reactions: {} };
    const nextSave = appendMessage(base, msg);
    setMirror(nextSave);
    persist(nextSave);
    // Ping the plate's author at most once per plate per session;
    // skip self and unattributable (self/AI-fallback) targets.
    if (toUserId && toUserId !== selfId && !noteNotified.current.has(shot.id)) {
      noteNotified.current.add(shot.id);
      events.trigger(
        'petfilter_note',
        guestbookNotifyConfig({
          toUserId,
          refUrl: shot.imageUrl,
          note: text,
          template: '{sender_name} left a note on your specimen',
          imagePrompt: `${shot.petName ?? 'specimen'} field-guide plate, 19th-c. natural-history engraving`,
        }),
      );
    }
  };

  // ─── Phase transitions ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!source) return;
    setError('');
    playClick();
    setPetitionCount(0);
    // Recent species the user has received — bias the next gen away.
    // Take the last 6 (or fewer if they have fewer); if user has
    // already received all 12 we wrap and allow repeats.
    const recentlyReceived = shots.slice(0, 6).map((s) => s.petId);
    const tentative = PETS[Math.floor(Math.random() * PETS.length)].id;
    setPendingPet(tentative);
    setPhase('processing');
    try {
      const genSource = source.kind === 'file'
        ? { kind: 'file' as const, file: source.file }
        : { kind: 'url' as const, url: source.url };
      const shot = await petGen.generate({
        source: genSource,
        avoidPetIds: recentlyReceived,
      });
      setCurrent(shot);
      setCameFromWall(false);
      setPhase('result');
      playReveal();
      const nextSave: PetSave = {
        shots: [shot, ...(mirror?.shots ?? [])].slice(0, 24),
        reactions: mirror?.reactions ?? {},
        messages: mirror?.messages,
      };
      setMirror(nextSave);
      persist(nextSave);
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
      const nextSave: PetSave = {
        shots: [shot, ...(mirror?.shots ?? [])].slice(0, 24),
        reactions: mirror?.reactions ?? {},
        messages: mirror?.messages,
      };
      setMirror(nextSave);
      persist(nextSave);
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
    setCurrentAuthor(null);
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
    author?: { userId: string; userName?: string; userAvatarUrl?: string },
  ) => {
    playClick();
    setCurrent(shot);
    setCurrentAuthor(author ?? null);
    setCameFromWall(true);
    setPhase('result');
  };

  // Delete one of the user's OWN plates by id. Filters it out of both
  // the cloud-persisted list and the local mirror. Used both by the
  // Result-page discard button (when viewing your own plate) and by
  // the Wall long-press overlay.
  const handleDeleteById = (shotId: string) => {
    playClick();
    const nextSave: PetSave = {
      shots: (mirror?.shots ?? []).filter((s) => s.id !== shotId),
      reactions: mirror?.reactions ?? {},
      messages: mirror?.messages,
    };
    setMirror(nextSave);
    persist(nextSave);
    // If we were viewing the deleted plate, bounce back to wall.
    if (current && current.id === shotId) {
      setCurrent(null);
      setCameFromWall(false);
      setCurrentAuthor(null);
      setPhase('wall');
    }
  };
  const handleDeleteCurrent = () => {
    if (current) handleDeleteById(current.id);
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
            lastSubmissionAt={shots[0]?.createdAt ?? 0}
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
        {phase === 'result' && current && (() => {
          // A plate is "mine" if its id appears in our local discography.
          const mineIds = new Set((mirror?.shots ?? []).map((s) => s.id));
          const isMine = mineIds.has(current.id);
          const myUid = getTelegramId()! ? String(getTelegramId()!) : undefined;
          // Best-effort wall notes ∪ my own outgoing notes for this plate.
          const thread = threadFor(
            current.id,
            wall.messagesByTarget,
            mirror?.messages,
            myUid,
          );
          // Author to attribute a note to: the wall author when we came
          // from the wall, else (own freshly-minted plate) ourselves.
          const noteAuthor = currentAuthor
            ?? (isMine && myUid ? { userId: myUid } : null);
          return (
            <ResultScreen
              shot={current}
              cameFromWall={cameFromWall}
              author={currentAuthor}
              myReactions={reactionsFor(current.id)}
              onToggleReaction={cameFromWall ? (k) => toggleReaction(current.id, k) : undefined}
              onNew={handleNew}
              onWall={handleWall}
              onShare={handleShare}
              shareLabel={shareLabel || undefined}
              onPetition={cameFromWall ? undefined : handlePetition}
              petitionCount={petitionCount}
              petitionMax={MAX_PETITIONS}
              onDelete={isMine ? handleDeleteCurrent : undefined}
              notes={thread}
              myUserId={myUid}
              canCompose={isInAigramNow()}
              onSendNote={(text) => sendMessage(current, noteAuthor, text)}
            />
          );
        })()}
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
            onDelete={handleDeleteById}
            diagnostics={wall.diagnostics}
          />
        )}
      </div>
    </div>
  );
}
