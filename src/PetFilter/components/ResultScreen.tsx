import { useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { petById } from '../utils/pets';
import type { PetShot, ReactionKind } from '../types';
import ReactionIcon from './ReactionIcons';
import { playPop, hapticTap } from '../utils/audio';

interface Props {
  shot: PetShot;
  cameFromWall: boolean;
  myReactions: Set<ReactionKind>;
  onToggleReaction?: (kind: ReactionKind) => void;
  onNew: () => void;
  onWall: () => void;
  onShare?: () => void;
  /** Transient label shown next to the share button after a copy. */
  shareLabel?: string;
  /** Re-run gen with same photo, different species. Omit on wall views. */
  onPetition?: () => void;
  /** How many petitions used so far. */
  petitionCount?: number;
  /** Max petitions allowed (currently 2). */
  petitionMax?: number;
}

const REACTION_ORDER: ReactionKind[] = ['heart', 'fire', 'mind', 'eye'];

export default function ResultScreen({
  shot, cameFromWall, myReactions, onToggleReaction, onNew, onWall, onShare,
  shareLabel, onPetition, petitionCount = 0, petitionMax = 2,
}: Props) {
  const pet = petById(shot.petId);
  const petitionsLeft = petitionMax - petitionCount;
  const petitionLabel = petitionsLeft <= 0
    ? t('cta_petition_final')
    : petitionCount === 0 ? t('cta_petition')
    : t('cta_petition_used');

  return (
    <Ticket
      plate={`${t('plate_header_result')} ${pet?.plate ?? ''}`}
      rubric={pet?.latin ?? shot.petName}
      footerHero={cameFromWall ? t('cta_back_to_wall') : t('cta_new_pet')}
      footerHeroDirection={cameFromWall ? 'back' : 'forward'}
      onFooterHeroClick={cameFromWall ? onWall : onNew}
      footerLeftAction={cameFromWall ? undefined : { label: t('cta_wall'), onClick: onWall }}
    >
      <div className="pf-result">
        <h1 className="pf-result__title">{shot.petName}</h1>
        <p className="pf-result__latin"><em>{pet?.latin ?? ''}</em></p>

        <div className="pf-result__plate" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          <img className="pf-result__img" src={shot.imageUrl} alt={shot.petName} draggable={false} />
        </div>

        {/* Society's judgment — one-sentence verdict in 19c naturalist
            voice. Reads as a personal classification even though the
            species itself was randomly assigned. */}
        {shot.judgment && (
          <blockquote className="pf-result__judgment">
            <span className="pf-result__judgment-quote">“</span>
            <em>{shot.judgment}</em>
            <span className="pf-result__judgment-quote pf-result__judgment-quote--close">”</span>
            <footer className="pf-result__judgment-sig"><em>— the Society</em></footer>
          </blockquote>
        )}

        <p className="pf-result__caption"><em>{t('result_below_image')}</em></p>

        {cameFromWall && onToggleReaction && (
          <ReactionRow
            myReactions={myReactions}
            onToggle={onToggleReaction}
          />
        )}

        {/* Action row on freshly-minted results — share + petition. */}
        {!cameFromWall && (
          <div className="pf-result__actions">
            {onShare && (
              <button type="button"
                      className="pf-result__share"
                      onPointerDown={() => {
                        if (shareLabel) return;
                        playPop(); hapticTap();
                        onShare();
                      }}
                      disabled={!!shareLabel}>
                <span className="pf-result__share-icon" aria-hidden>✎</span>
                {shareLabel || t('cta_share')}
              </button>
            )}
            {onPetition && (
              <button type="button"
                      className="pf-result__petition"
                      onPointerDown={() => {
                        if (petitionsLeft <= 0) return;
                        playPop(); hapticTap();
                        onPetition();
                      }}
                      disabled={petitionsLeft <= 0}>
                <svg className="pf-result__petition-icon" viewBox="0 0 16 16"
                     width="13" height="13" fill="none" stroke="currentColor"
                     strokeWidth="1.1" aria-hidden>
                  <path d="M3 13 L13 3 M3 13 L3 9 M3 13 L7 13" />
                  <path d="M11 5 L13 7" />
                </svg>
                {petitionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </Ticket>
  );
}

// Reaction row with full tap feedback: spring scale on the tapped
// button, a floating burst of the icon that scales up + fades, a
// soft pop sound, and a haptic buzz on mobile.
function ReactionRow({
  myReactions, onToggle,
}: {
  myReactions: Set<ReactionKind>;
  onToggle: (kind: ReactionKind) => void;
}) {
  // Each burst is a one-shot animation overlay. We track an array of
  // them so several can be in flight at once if the user double-taps.
  const [bursts, setBursts] = useState<{ id: number; kind: ReactionKind }[]>([]);

  const handleTap = (kind: ReactionKind, active: boolean) => {
    if (active) return;
    // Fire feedback before the state change so it feels immediate.
    playPop();
    hapticTap();
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, kind }]);
    // Clear after animation finishes (900ms).
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 900);
    onToggle(kind);
  };

  return (
    <div className="pf-reactions">
      {REACTION_ORDER.map((kind) => {
        const active = myReactions.has(kind);
        const myBursts = bursts.filter((b) => b.kind === kind);
        return (
          <span key={kind} className="pf-reaction-wrap">
            <button
              type="button"
              className={`pf-reaction ${active ? 'is-active' : ''}`}
              disabled={active}
              onPointerDown={() => handleTap(kind, active)}
              aria-pressed={active}
              aria-label={kind}
            >
              <ReactionIcon kind={kind} size={18} />
            </button>
            {myBursts.map((b) => (
              <span key={b.id} className="pf-reaction-burst" aria-hidden>
                <ReactionIcon kind={kind} size={22} />
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}
