import { useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { useGameStats } from '@shared/runtime/useGameStats';
import { isInAigram, telegramId } from '@shared/runtime/bridge';
import { fallbackTotal, dominantReaction, reactionAggregateEvent } from '../utils/reactions';
import ReactionIcon from './ReactionIcons';
import { petById } from '../utils/pets';
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
}

export default function Wall({
  community, mine, loaded, myReactions, onBack, onView, onNew, scope, onScopeChange,
}: Props) {
  const [view, setView] = useState<ViewMode>('list');

  const reactionsOf = (id: string): Set<ReactionKind> =>
    myReactions.get(id) ?? new Set<ReactionKind>();

  const myTid = telegramId ? String(telegramId) : '';
  const myEntries: WallEntry[] = mine.map((s) => ({ userId: 'self', userName: 'You', shot: s }));
  const entries: WallEntry[] = (() => {
    if (scope === 'my') return myEntries;
    const others = myTid ? community.filter((e) => e.userId !== myTid) : community;
    return [...myEntries, ...others].sort(
      (a, b) => (b.shot.createdAt || 0) - (a.shot.createdAt || 0),
    );
  })();

  const total = entries.length;

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

      <div className="pf-section-rule" aria-hidden />

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
        <ListView entries={entries} reactionsOf={reactionsOf} scope={scope} onSelect={onView} />
      ) : (
        <GridView entries={entries} reactionsOf={reactionsOf} scope={scope} onSelect={onView} />
      )}
    </Ticket>
  );
}

interface ViewProps {
  entries: WallEntry[];
  reactionsOf: (id: string) => Set<ReactionKind>;
  scope: ScopeMode;
  onSelect: (shot: PetShot, author?: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
}

function ListView({ entries, reactionsOf, scope, onSelect }: ViewProps) {
  return (
    <ul className="pf-wall-list">
      {entries.map((e, i) => (
        <WallRow key={`${e.userId}-${e.shot.id}`}
                 entry={e} idx={i + 1} scope={scope}
                 mine={reactionsOf(e.shot.id)}
                 onSelect={onSelect} />
      ))}
    </ul>
  );
}

function WallRow({ entry, idx, scope, mine, onSelect }: {
  entry: WallEntry;
  idx: number;
  scope: ScopeMode;
  mine: Set<ReactionKind>;
  onSelect: ViewProps['onSelect'];
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

  return (
    <li>
      <div role="button" tabIndex={0} className="pf-wall-row"
           onClick={() => onSelect(shot, authorMeta)}>
        <span className="pf-wall-row__plate">Pl. {String(idx).padStart(2, '0')}</span>
        <div className="pf-wall-row__cover" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          <img className="pf-wall-row__img" src={shot.imageUrl} alt={shot.petName} draggable={false} />
        </div>
        <div className="pf-wall-row__info">
          <div className="pf-wall-row__pet">{shot.petName}</div>
          <div className="pf-wall-row__latin"><em>{pet?.latin ?? ''}</em></div>
          {scope === 'all' && entry.userName && (
            <div className="pf-wall-row__by"><em>collected by {entry.userName}</em></div>
          )}
        </div>
        <span className={`pf-like-badge ${mine.size > 0 ? 'is-liked' : ''}`}>
          <ReactionIcon kind={dominant} size={11} />
          <span>{total}</span>
        </span>
      </div>
    </li>
  );
}

function GridView({ entries, reactionsOf, scope, onSelect }: ViewProps) {
  return (
    <ul className="pf-wall-grid">
      {entries.map((e, i) => (
        <WallTile key={`${e.userId}-${e.shot.id}`}
                  entry={e} idx={i + 1} scope={scope}
                  mine={reactionsOf(e.shot.id)}
                  onSelect={onSelect} />
      ))}
    </ul>
  );
}

function WallTile({ entry, mine, onSelect, scope }: {
  entry: WallEntry;
  idx: number;
  scope: ScopeMode;
  mine: Set<ReactionKind>;
  onSelect: ViewProps['onSelect'];
}) {
  const shot = entry.shot;
  const pet = petById(shot.petId);
  const agg = useGameStats(reactionAggregateEvent(shot.id));
  const total = isInAigram ? agg.stats.total_user_count : fallbackTotal(shot.id, mine);
  const dominant: ReactionKind = isInAigram ? 'heart' : dominantReaction(shot.id, mine);
  const authorMeta = scope === 'all'
    ? { userId: entry.userId, userName: entry.userName, userAvatarUrl: entry.userAvatarUrl }
    : undefined;
  return (
    <li>
      <div role="button" tabIndex={0} className="pf-wall-tile"
           onClick={() => onSelect(shot, authorMeta)}>
        <div className="pf-wall-tile__cover" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          <img className="pf-wall-tile__img" src={shot.imageUrl} alt={shot.petName} draggable={false} />
          <span className="pf-wall-tile__like">
            <ReactionIcon kind={dominant} size={10} />
            {total}
          </span>
        </div>
        <div className="pf-wall-tile__name">{shot.petName}</div>
        <div className="pf-wall-tile__latin"><em>{pet?.latin ?? ''}</em></div>
      </div>
    </li>
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
