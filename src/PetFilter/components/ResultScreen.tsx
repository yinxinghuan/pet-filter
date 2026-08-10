import { useState } from 'react';
import Ticket from './Ticket';
import { t, tLocale } from '../i18n';
import { petById } from '../utils/pets';
import type { PetShot, ReactionKind } from '../types';
import ReactionIcon from './ReactionIcons';
import { playPop, hapticTap } from '../utils/audio';
import { openAigramProfile, isInAigramNow } from '@shared/runtime/bridge';
import { MAX_LEN, timeAgo, type GuestMessage } from '@shared/social/guestbook';
import { PET_FILTER_CARTRIDGE } from '../cartridge';

const ALTERU_APP_URL = 'https://alteru.app';

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
  /** Guestbook thread for this plate (best-effort wall notes ∪ own),
   *  oldest-first. Always supplied — may be empty. */
  notes?: GuestMessage[];
  /** Current player's id — own notes render as "you", no profile button. */
  myUserId?: string;
  /** Compose box only shows when in Aigram (we can persist + notify). */
  canCompose?: boolean;
  /** Leave a note on this plate. */
  onSendNote?: (text: string) => void;
}

const REACTION_ORDER: ReactionKind[] = PET_FILTER_CARTRIDGE.social.reactionOrder;

export default function ResultScreen({
  shot, cameFromWall, author, myReactions, onToggleReaction, onNew, onWall, onShare,
  shareLabel, onPetition, petitionCount = 0, petitionMax = 2, onDelete,
  notes, myUserId, canCompose, onSendNote,
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
              <em className="pf-result__author-by">{t('result_author_by')}</em>
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
            <footer className="pf-result__judgment-sig"><em>— {t('result_judgment_signature')}</em></footer>
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

        {/* Guestbook — public marginalia left on this plate. Shown on any
            plate (own or another's). The author is pinged when a note is
            inscribed (handled upstream). */}
        {onSendNote && (
          <Guestbook
            notes={notes ?? []}
            myUserId={myUserId}
            canCompose={!!canCompose}
            onSend={onSendNote}
          />
        )}
      </div>
    </Ticket>
  );
}

// In-game guestbook section: a thread of marginalia + a compose box.
// Each note row is avatar + name (tappable → author's Aigram profile,
// self shows "you") + text + relative time. Inside a scrollable detail,
// so rows use onClick (scroll-vs-click); the send button is an action.
function Guestbook({
  notes, myUserId, canCompose, onSend,
}: {
  notes: GuestMessage[];
  myUserId?: string;
  canCompose: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const trimmed = draft.trim();
  const submit = () => {
    if (!trimmed) return;
    playPop(); hapticTap();
    onSend(trimmed);
    setDraft('');
  };
  return (
    <section className="pf-notes" aria-label={t('notes_heading')}>
      <h2 className="pf-notes__heading">{t('notes_heading')}</h2>
      <p className="pf-notes__sub"><em>{t('notes_sub')}</em></p>

      {notes.length === 0 ? (
        <p className="pf-notes__empty"><em>{t('notes_empty')}</em></p>
      ) : (
        <ul className="pf-notes__list">
          {notes.map((m) => {
            const isSelf = !!myUserId && m.fromUserId === myUserId;
            const name = isSelf
              ? t('note_you')
              : (m.userName || (m.fromUserId ? `user ${m.fromUserId.slice(0, 6)}` : ''));
            return (
              <li key={m.id} className="pf-note">
                <button
                  type="button"
                  className={`pf-note__who ${isSelf ? 'is-self' : ''}`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (!isSelf && isInAigramNow() && m.fromUserId) openAigramProfile(m.fromUserId);
                  }}
                  disabled={isSelf || !isInAigramNow() || !m.fromUserId}
                  aria-label={isSelf ? undefined : `Open ${name || 'naturalist'}'s profile`}
                >
                  {isSelf ? (
                    <span className="pf-note__avatar pf-note__avatar--self" aria-hidden>
                      <span className="pf-note__letter">{t('note_you')[0]?.toUpperCase()}</span>
                    </span>
                  ) : m.userAvatarUrl ? (
                    <span className="pf-note__avatar" aria-hidden>
                      <img src={m.userAvatarUrl} alt="" draggable={false} referrerPolicy="no-referrer" />
                    </span>
                  ) : (
                    <span className="pf-note__avatar" aria-hidden>
                      <span className="pf-note__letter">{(name || '?')[0]?.toUpperCase()}</span>
                    </span>
                  )}
                  <span className={`pf-note__name ${isSelf ? 'is-self' : ''}`}>{name}</span>
                </button>
                <span className="pf-note__text">{m.text}</span>
                <span className="pf-note__time"><em>{timeAgo(m.ts, tLocale)}</em></span>
              </li>
            );
          })}
        </ul>
      )}

      {canCompose ? (
        <div className="pf-notes__compose">
          <input
            className="pf-notes__input"
            type="text"
            value={draft}
            maxLength={MAX_LEN}
            placeholder={t('note_placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            aria-label={t('note_placeholder')}
          />
          <button
            type="button"
            className="pf-notes__send"
            onPointerDown={submit}
            disabled={!trimmed}
            aria-label={t('note_send')}
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
                 stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden>
              <path d="M2 8 L13 3 L9 13 L7.5 9 Z" />
            </svg>
            <span>{t('note_send')}</span>
          </button>
        </div>
      ) : (
        <p className="pf-notes__hint pf-notes__download">
          <em>{t('note_signed_in_only')}</em>
          <a href={ALTERU_APP_URL} target="_blank" rel="noopener noreferrer">
            {t('download_alteru')}
          </a>
        </p>
      )}
    </section>
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
              aria-label={PET_FILTER_CARTRIDGE.social.reactionAriaLabels[kind]}
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
