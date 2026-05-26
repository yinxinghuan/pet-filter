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
}

const REACTION_ORDER: ReactionKind[] = ['heart', 'fire', 'mind', 'eye'];

export default function ResultScreen({
  shot, cameFromWall, myReactions, onToggleReaction, onNew, onWall,
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
        <p className="pf-result__subhead"><em>{t('result_subhead')}</em></p>
        <h1 className="pf-result__title">{shot.petName}</h1>
        <p className="pf-result__latin"><em>{pet?.latin ?? ''}</em></p>

        <div className="pf-result__plate" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          <img className="pf-result__img" src={shot.imageUrl} alt={shot.petName} draggable={false} />
        </div>

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
      </div>
    </Ticket>
  );
}
