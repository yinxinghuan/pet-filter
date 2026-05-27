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

        {/* Action row on freshly-minted results — share + petition. */}
        {!cameFromWall && (
          <div className="pf-result__actions">
            {onShare && (
              <button type="button"
                      className="pf-result__share"
                      onPointerDown={onShare}
                      disabled={!!shareLabel}>
                <span className="pf-result__share-icon" aria-hidden>✎</span>
                {shareLabel || t('cta_share')}
              </button>
            )}
            {onPetition && (
              <button type="button"
                      className="pf-result__petition"
                      onPointerDown={petitionsLeft > 0 ? onPetition : undefined}
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
