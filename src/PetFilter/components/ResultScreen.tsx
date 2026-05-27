import { useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { petById } from '../utils/pets';
import type { PetShot, ReactionKind } from '../types';
import ReactionIcon from './ReactionIcons';
import { playPop, hapticTap } from '../utils/audio';
import { openAigramProfile } from '@shared/runtime/bridge';

interface Props {
  shot: PetShot;
  cameFromWall: boolean;
  /** Author of the plate — only present when viewed via wall. */
  author?: { userId: string; userName?: string; userAvatarUrl?: string } | null;
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
  /** When this plate is the user's own, allow them to discard it. */
  onDelete?: () => void;
}

const REACTION_ORDER: ReactionKind[] = ['heart', 'fire', 'mind', 'eye'];

export default function ResultScreen({
  shot, cameFromWall, author, myReactions, onToggleReaction, onNew, onWall, onShare,
  shareLabel, onPetition, petitionCount = 0, petitionMax = 2, onDelete,
}: Props) {
  // Confirmation state for the discard action — first tap arms it,
  // second tap within 5s confirms. Avoids accidental deletion.
  const [discardArmed, setDiscardArmed] = useState(false);
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

        {/* Author attribution — only when viewed via wall AND it's
            someone else's plate. Tap → opens the author's Aigram
            profile. Avatar + name chip. */}
        {cameFromWall && author && author.userId !== 'self' && (
          <button type="button"
                  className="pf-result__author"
                  onPointerDown={() => {
                    playPop(); hapticTap();
                    openAigramProfile(author.userId);
                  }}>
            {author.userAvatarUrl ? (
              <img className="pf-result__author-avatar"
                   src={author.userAvatarUrl}
                   alt=""
                   draggable={false} />
            ) : (
              <span className="pf-result__author-initial">
                {(author.userName?.[0] ?? '?').toUpperCase()}
              </span>
            )}
            <span className="pf-result__author-meta">
              <em className="pf-result__author-by">a plate by</em>
              <span className="pf-result__author-name">
                {author.userName || `user ${author.userId.slice(0, 6)}`}
              </span>
            </span>
            <span className="pf-result__author-arrow" aria-hidden>›</span>
          </button>
        )}

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

        {/* Action row when viewing OWN plate via wall — share-again
            + discard. Lets the user re-share an old plate (the share
            button was previously only on fresh results) and remove
            ones they don't want anymore. */}
        {cameFromWall && onDelete && (
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
                {shareLabel || t('cta_share_again')}
              </button>
            )}
            <button type="button"
                    className={`pf-result__discard ${discardArmed ? 'is-armed' : ''}`}
                    onPointerDown={() => {
                      playPop(); hapticTap();
                      if (discardArmed) {
                        onDelete();
                      } else {
                        setDiscardArmed(true);
                        setTimeout(() => setDiscardArmed(false), 5000);
                      }
                    }}>
              <em>{discardArmed ? t('discard_confirm') : t('discard_plate')}</em>
            </button>
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
