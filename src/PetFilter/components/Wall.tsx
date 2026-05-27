import { useRef, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { useGameStats } from '@shared/runtime/useGameStats';
import { isInAigram, telegramId } from '@shared/runtime/bridge';
import { fallbackTotal, dominantReaction, reactionAggregateEvent } from '../utils/reactions';
import { useLongPress } from '../hooks/useLongPress';
import { playPop, hapticTap } from '../utils/audio';
import ReactionIcon from './ReactionIcons';
import { petById } from '../utils/pets';
import type { WallDiagnostics } from '../hooks/useWall';
import type { PetShot, ReactionKind, WallEntry } from '../types';

export type ScopeMode = 'my' | 'all';
type ViewMode = 'list' | 'grid';

interface Props {
  community: WallEntry[];
  mine: PetShot[];
  loaded: boolean;
  myReactions: Map<string, Set<ReactionKind>>;
  onBack?: () => void;
  onView: (shot: PetShot, author?: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
  onNew: () => void;
  scope: ScopeMode;
  onScopeChange: (next: ScopeMode) => void;
  /** Long-press deletion of own tiles. Called once the user confirms
   *  via the in-tile overlay. */
  onDelete?: (shotId: string) => void;
  /** Wall diagnostics from useWall — shown inline when ?debug=1. */
  diagnostics?: WallDiagnostics;
}

export default function Wall({
  community, mine, loaded, myReactions, onBack, onView, onNew, scope, onScopeChange,
  onDelete, diagnostics,
}: Props) {
  const [view, setView] = useState<ViewMode>('list');
  // Which own-tile is currently displaying the delete overlay. Long-
  // press arms it; a confirm tap completes deletion, anything else
  // (overlay timeout, tap outside) cancels. Only one tile can be
  // armed at a time — arming another auto-cancels the previous.
  const [armedId, setArmedId] = useState<string | null>(null);
  const armTimer = useRef<number | null>(null);
  const armDelete = (id: string) => {
    playPop();
    hapticTap();
    setArmedId(id);
    if (armTimer.current !== null) window.clearTimeout(armTimer.current);
    armTimer.current = window.setTimeout(() => setArmedId(null), 5000);
  };
  const cancelArm = () => {
    if (armTimer.current !== null) {
      window.clearTimeout(armTimer.current);
      armTimer.current = null;
    }
    setArmedId(null);
  };
  const confirmDelete = (id: string) => {
    playPop();
    hapticTap();
    onDelete?.(id);
    cancelArm();
  };
  // ?debug=1 reveals an inline diagnostic panel up top — useful for
  // production verification of why the wall might look empty.
  const debugOn = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('debug') === '1';

  const reactionsOf = (id: string): Set<ReactionKind> =>
    myReactions.get(id) ?? new Set<ReactionKind>();

  const myTid = telegramId ? String(telegramId) : '';
  const myEntries: WallEntry[] = mine.map((s) => ({ userId: 'self', userName: 'You', shot: s }));
  const others = myTid ? community.filter((e) => e.userId !== myTid) : community;
  const entries: WallEntry[] = (() => {
    if (scope === 'my') return myEntries;
    return [...myEntries, ...others].sort(
      (a, b) => (b.shot.createdAt || 0) - (a.shot.createdAt || 0),
    );
  })();
  // When viewing 『All』 but no other naturalist has submitted yet,
  // we surface a small banner that explains the state — otherwise
  // the wall just shows the user's own plates and they wonder where
  // everyone else is.
  const aloneInArchive = scope === 'all' && loaded && others.length === 0;

  const total = entries.length;
  // Stats — how many of these are from today, vs total. Gives the
  // wall the "live archive" feel.
  const oneDayMs = 1000 * 60 * 60 * 24;
  const now = Date.now();
  const todayCount = entries.filter((e) => now - (e.shot.createdAt || 0) < oneDayMs).length;

  return (
    <Ticket
      plate={t('plate_header_wall')}
      rubric={`${String(total).padStart(2, '0')} ${t('on_file')}`}
      footerHero={t('cta_new_pet')}
      onFooterHeroClick={onNew}
      footerLeftAction={onBack ? { label: t('wall_back'), onClick: onBack } : undefined}
    >
      <div className="pf-wall-head">
        <h1 className="pf-wall-head__title">{t('wall_heading')}</h1>
        <p className="pf-wall-head__sub"><em>{t('wall_sub')}</em></p>
      </div>

      {debugOn && diagnostics && (
        <div className="pf-wall-debug" role="note">
          <div className="pf-wall-debug__title">WALL · DEBUG</div>
          <div className="pf-wall-debug__row">
            <span>isInAigram</span>
            <strong>{String(diagnostics.isInAigram)}</strong>
          </div>
          <div className="pf-wall-debug__row">
            <span>telegram_id</span>
            <strong>{diagnostics.telegramId || '—'}</strong>
          </div>
          <div className="pf-wall-debug__row">
            <span>session_id</span>
            <strong>{diagnostics.sessionId?.slice(0, 8) || '—'}…</strong>
          </div>
          <div className="pf-wall-debug__row">
            <span>fetch status</span>
            <strong>{diagnostics.fetchStatus}</strong>
          </div>
          <div className="pf-wall-debug__row">
            <span>rows returned</span>
            <strong>{diagnostics.rowsFromPlatform}</strong>
          </div>
          <div className="pf-wall-debug__row">
            <span>parsed shots</span>
            <strong>{diagnostics.parsedShots}</strong>
          </div>
          {diagnostics.userIdsFromPlatform.length > 0 && (
            <div className="pf-wall-debug__list">
              user_ids: {diagnostics.userIdsFromPlatform.join(', ')}
            </div>
          )}
          {diagnostics.error && (
            <div className="pf-wall-debug__err">err: {diagnostics.error}</div>
          )}
        </div>
      )}

      {/* Stats banner — three cells separated by hairline rules,
          like the masthead of a Victorian periodical. */}
      <div className="pf-wall-stats" aria-label="archive statistics">
        <div className="pf-wall-stats__cell">
          <span className="pf-wall-stats__n">{String(total).padStart(2, '0')}</span>
          <span className="pf-wall-stats__l"><em>on file</em></span>
        </div>
        <div className="pf-wall-stats__cell">
          <span className="pf-wall-stats__n">{String(todayCount).padStart(2, '0')}</span>
          <span className="pf-wall-stats__l"><em>today</em></span>
        </div>
        <div className="pf-wall-stats__cell">
          <span className="pf-wall-stats__n">XX</span>
          <span className="pf-wall-stats__l"><em>orders</em></span>
        </div>
      </div>

      <div className="pf-wall-nav">
        <div className="pf-scope-tabs" role="tablist" aria-label="scope">
          <button
            type="button"
            role="tab"
            className={`pf-scope-tab ${scope === 'my' ? 'is-active' : ''}`}
            onPointerDown={() => onScopeChange('my')}
            aria-selected={scope === 'my'}
          >
            {t('scope_my')}
          </button>
          <button
            type="button"
            role="tab"
            className={`pf-scope-tab ${scope === 'all' ? 'is-active' : ''}`}
            onPointerDown={() => onScopeChange('all')}
            aria-selected={scope === 'all'}
          >
            {t('scope_all')}
          </button>
        </div>
        <div className="pf-view-switch" role="group" aria-label="view mode">
          <button
            type="button"
            className={`pf-view-switch__btn ${view === 'list' ? 'is-active' : ''}`}
            onPointerDown={() => setView('list')}
            aria-pressed={view === 'list'}
            aria-label={t('view_list')}
          >
            <IconList />
          </button>
          <button
            type="button"
            className={`pf-view-switch__btn ${view === 'grid' ? 'is-active' : ''}`}
            onPointerDown={() => setView('grid')}
            aria-pressed={view === 'grid'}
            aria-label={t('view_grid')}
          >
            <IconGrid />
          </button>
        </div>
      </div>

      {aloneInArchive && entries.length > 0 && (
        <div className="pf-wall-alone" role="note">
          <span className="pf-wall-alone__icon" aria-hidden>✶</span>
          <em>{t('wall_alone')}</em>
        </div>
      )}

      {!loaded ? (
        <div className="pf-wall-empty">…</div>
      ) : entries.length === 0 ? (
        <button type="button"
                className="pf-wall-empty pf-wall-empty--cta"
                onPointerDown={onNew}>
          <span className="pf-wall-empty__ghost" aria-hidden>
            <svg viewBox="0 0 80 80" width={64} height={64}
                 fill="none" stroke="currentColor" strokeWidth={1.2}
                 strokeLinecap="round" strokeLinejoin="round">
              <circle cx="40" cy="40" r="32" strokeDasharray="3 3" />
              <text x="40" y="48" textAnchor="middle"
                    fontFamily="'Cormorant Garamond', serif"
                    fontStyle="italic" fontSize="24"
                    fill="currentColor" stroke="none">+</text>
            </svg>
          </span>
          <span className="pf-wall-empty__text"><em>{t('wall_empty')}</em></span>
          <span className="pf-wall-empty__hint"><em>— {t('cta_new_pet')} →</em></span>
        </button>
      ) : view === 'list' ? (
        <ListView entries={entries}
                  reactionsOf={reactionsOf}
                  scope={scope}
                  onSelect={onView}
                  armedId={armedId}
                  canDelete={!!onDelete}
                  onArm={armDelete}
                  onConfirmDelete={confirmDelete}
                  onCancelArm={cancelArm} />
      ) : (
        <GridView entries={entries}
                  reactionsOf={reactionsOf}
                  scope={scope}
                  onSelect={onView}
                  armedId={armedId}
                  canDelete={!!onDelete}
                  onArm={armDelete}
                  onConfirmDelete={confirmDelete}
                  onCancelArm={cancelArm} />
      )}
    </Ticket>
  );
}

interface ViewProps {
  entries: WallEntry[];
  reactionsOf: (id: string) => Set<ReactionKind>;
  scope: ScopeMode;
  onSelect: (shot: PetShot, author?: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
  /** Long-press deletion plumbing. */
  armedId: string | null;
  canDelete: boolean;
  onArm: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelArm: () => void;
}

function ListView({ entries, reactionsOf, scope, onSelect, armedId, canDelete, onArm, onConfirmDelete, onCancelArm }: ViewProps) {
  return (
    <ul className="pf-wall-list">
      {entries.map((e, i) => (
        <WallRow key={`${e.userId}-${e.shot.id}`}
                 entry={e} idx={i + 1} scope={scope}
                 mine={reactionsOf(e.shot.id)}
                 onSelect={onSelect}
                 armed={armedId === e.shot.id}
                 canDelete={canDelete && e.userId === 'self'}
                 onArm={onArm}
                 onConfirmDelete={onConfirmDelete}
                 onCancelArm={onCancelArm} />
      ))}
    </ul>
  );
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function WallRow({ entry, idx, scope, mine, onSelect, armed, canDelete, onArm, onConfirmDelete, onCancelArm }: {
  entry: WallEntry;
  idx: number;
  scope: ScopeMode;
  mine: Set<ReactionKind>;
  onSelect: ViewProps['onSelect'];
  armed: boolean;
  canDelete: boolean;
  onArm: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelArm: () => void;
}) {
  const shot = entry.shot;
  const pet = petById(shot.petId);
  const agg = useGameStats(reactionAggregateEvent(shot.id));
  const real = agg.stats.total_user_count;
  const total = isInAigram ? real : fallbackTotal(shot.id, mine);
  const dominant: ReactionKind = isInAigram ? 'heart' : dominantReaction(shot.id, mine);
  const authorMeta = scope === 'all'
    ? { userId: entry.userId, userName: entry.userName, userAvatarUrl: entry.userAvatarUrl }
    : undefined;

  // Long-press only meaningful for own rows. Non-own rows keep the
  // original onClick navigation (a simple tap → open the plate).
  const longPress = useLongPress({
    onLongPress: () => onArm(shot.id),
    onShortPress: () => onSelect(shot, authorMeta),
  });

  const interactive = canDelete
    ? longPress
    : { onClick: () => onSelect(shot, authorMeta) };

  return (
    <li>
      <div role="button" tabIndex={0} className={`pf-wall-row ${armed ? 'is-armed' : ''}`}
           {...interactive}>
        <div className="pf-wall-row__cover" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          <img className="pf-wall-row__img" src={shot.imageUrl} alt={shot.petName} draggable={false} />
        </div>
        <div className="pf-wall-row__info">
          <div className="pf-wall-row__topline">
            <span className="pf-wall-row__plate">Pl. {String(idx).padStart(2, '0')}</span>
            <span className="pf-wall-row__pet">{shot.petName}</span>
          </div>
          <div className="pf-wall-row__latin"><em>{pet?.latin ?? ''}</em></div>
          <div className="pf-wall-row__byline">
            {entry.userId === 'self' ? (
              <em>your specimen</em>
            ) : (
              // Even if the profile fetch fails (userName undefined),
              // we still need to attribute the plate to *someone* —
              // fall back to a short userId so the row never reads
              // 『your specimen』 for somebody else's work.
              <em>
                collected by{' '}
                <span className="pf-wall-row__by-name">
                  {entry.userName || `user ${entry.userId.slice(0, 6)}`}
                </span>
              </em>
            )}
            {shot.createdAt > 0 && (
              <span className="pf-wall-row__time"><em>· {relativeTime(shot.createdAt)}</em></span>
            )}
          </div>
        </div>
        <span className={`pf-like-badge ${mine.size > 0 ? 'is-liked' : ''}`}>
          <ReactionIcon kind={dominant} size={11} />
          <span>{total}</span>
        </span>

        {armed && canDelete && (
          <DeleteOverlay
            onConfirm={(ev) => { ev.stopPropagation(); onConfirmDelete(shot.id); }}
            onCancel={(ev) => { ev.stopPropagation(); onCancelArm(); }}
          />
        )}
      </div>
    </li>
  );
}

function GridView({ entries, reactionsOf, scope, onSelect, armedId, canDelete, onArm, onConfirmDelete, onCancelArm }: ViewProps) {
  return (
    <ul className="pf-wall-grid">
      {entries.map((e, i) => (
        <WallTile key={`${e.userId}-${e.shot.id}`}
                  entry={e} idx={i + 1} scope={scope}
                  mine={reactionsOf(e.shot.id)}
                  onSelect={onSelect}
                  armed={armedId === e.shot.id}
                  canDelete={canDelete && e.userId === 'self'}
                  onArm={onArm}
                  onConfirmDelete={onConfirmDelete}
                  onCancelArm={onCancelArm} />
      ))}
    </ul>
  );
}

function WallTile({ entry, mine, onSelect, scope, armed, canDelete, onArm, onConfirmDelete, onCancelArm }: {
  entry: WallEntry;
  idx: number;
  scope: ScopeMode;
  mine: Set<ReactionKind>;
  onSelect: ViewProps['onSelect'];
  armed: boolean;
  canDelete: boolean;
  onArm: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelArm: () => void;
}) {
  const shot = entry.shot;
  const pet = petById(shot.petId);
  const agg = useGameStats(reactionAggregateEvent(shot.id));
  const total = isInAigram ? agg.stats.total_user_count : fallbackTotal(shot.id, mine);
  const dominant: ReactionKind = isInAigram ? 'heart' : dominantReaction(shot.id, mine);
  const authorMeta = scope === 'all'
    ? { userId: entry.userId, userName: entry.userName, userAvatarUrl: entry.userAvatarUrl }
    : undefined;

  const longPress = useLongPress({
    onLongPress: () => onArm(shot.id),
    onShortPress: () => onSelect(shot, authorMeta),
  });
  const interactive = canDelete
    ? longPress
    : { onClick: () => onSelect(shot, authorMeta) };

  return (
    <li>
      <div role="button" tabIndex={0} className={`pf-wall-tile ${armed ? 'is-armed' : ''}`}
           {...interactive}>
        <div className="pf-wall-tile__cover" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          <img className="pf-wall-tile__img" src={shot.imageUrl} alt={shot.petName} draggable={false} />
          <span className="pf-wall-tile__like">
            <ReactionIcon kind={dominant} size={10} />
            {total}
          </span>
        </div>
        <div className="pf-wall-tile__name">{shot.petName}</div>
        <div className="pf-wall-tile__latin"><em>{pet?.latin ?? ''}</em></div>
        <div className="pf-wall-tile__by">
          {entry.userId === 'self' ? (
            <em>yours</em>
          ) : (
            <em>by {entry.userName || `user ${entry.userId.slice(0, 6)}`}</em>
          )}
        </div>

        {armed && canDelete && (
          <DeleteOverlay
            onConfirm={(ev) => { ev.stopPropagation(); onConfirmDelete(shot.id); }}
            onCancel={(ev) => { ev.stopPropagation(); onCancelArm(); }}
          />
        )}
      </div>
    </li>
  );
}

// Sepia-on-red overlay that veils a row/tile after long-press. Two
// explicit buttons (Discard / Cancel) — no ambiguity with the parent
// tile's tap target. Tap outside the overlay → upstream timer dismisses.
function DeleteOverlay({ onConfirm, onCancel }: {
  onConfirm: (e: React.PointerEvent | React.MouseEvent) => void;
  onCancel: (e: React.PointerEvent | React.MouseEvent) => void;
}) {
  return (
    <div className="pf-wall-overlay" onClick={(e) => e.stopPropagation()}>
      <em className="pf-wall-overlay__label">{t('discard_plate')}?</em>
      <div className="pf-wall-overlay__actions">
        <button type="button"
                className="pf-wall-overlay__btn pf-wall-overlay__btn--confirm"
                onPointerDown={onConfirm}>
          <em>{t('discard_yes')}</em>
        </button>
        <button type="button"
                className="pf-wall-overlay__btn pf-wall-overlay__btn--cancel"
                onPointerDown={onCancel}>
          <em>{t('discard_cancel')}</em>
        </button>
      </div>
    </div>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden>
      <rect x="2" y="3" width="3" height="3" />
      <rect x="6" y="3" width="8" height="3" />
      <rect x="2" y="10" width="3" height="3" />
      <rect x="6" y="10" width="8" height="3" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </svg>
  );
}
