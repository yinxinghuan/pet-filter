import Ticket from './Ticket';
import { t } from '../i18n';
import { petById } from '../utils/pets';
import type { PetShot, ReactionKind } from '../types';
import ReactionIcon from './ReactionIcons';

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
}

const REACTION_ORDER: ReactionKind[] = ['heart', 'fire', 'mind', 'eye'];

export default function ResultScreen({
  shot, cameFromWall, myReactions, onToggleReaction, onNew, onWall, onShare, shareLabel,
}: Props) {
  const pet = petById(shot.petId);

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
          <div className="pf-reactions">
            {REACTION_ORDER.map((kind) => {
              const active = myReactions.has(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  className={`pf-reaction ${active ? 'is-active' : ''}`}
                  disabled={active}
                  onPointerDown={() => onToggleReaction(kind)}
                  aria-pressed={active}
                  aria-label={kind}
                >
                  <ReactionIcon kind={kind} size={18} />
                </button>
              );
            })}
          </div>
        )}

        {/* Share — primary on freshly minted plates, secondary on
            wall views. Surface clipboard copy for now; platform post
            share is a TODO. */}
        {!cameFromWall && onShare && (
          <button type="button"
                  className="pf-result__share"
                  onPointerDown={onShare}
                  disabled={!!shareLabel}>
            <span className="pf-result__share-icon" aria-hidden>✎</span>
            {shareLabel || t('cta_share')}
          </button>
        )}
      </div>
    </Ticket>
  );
}
