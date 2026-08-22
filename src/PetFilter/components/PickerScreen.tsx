import Ticket from './Ticket';
import { PETS, type Pet } from '../utils/pets';
import { t } from '../i18n';
import { previewURL } from '../utils/selfie';
import { playClick } from '../utils/audio';
import PetEngraving from './PetEngraving';
import { FlourishIcon, StarburstIcon } from './OrnamentIcons';

interface Props {
  source: { kind: 'file'; file: File; previewUrl: string } | { kind: 'url'; url: string } | null;
  onSourceChange: (next: { kind: 'file'; file: File; previewUrl: string } | { kind: 'url'; url: string } | null) => void;
  hasAvatarOnFile: boolean;
  onSubmit: () => void;
  onWall: () => void;
  onBestiary: () => void;
  /** Unix-ms timestamp of the user's most recent verdict, or 0 if
   *  they've never submitted. Used for the soft daily-ritual badge. */
  lastSubmissionAt: number;
  errorLabel?: string;
}

export default function PickerScreen({
  source, onSourceChange, hasAvatarOnFile, onSubmit, onWall, onBestiary,
  lastSubmissionAt, errorLabel,
}: Props) {
  // Soft daily-ritual badge. If the user submitted in the last 24h,
  // show a small "your last application was received" line above the
  // hero — purely informational, doesn't block.
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sinceLast = lastSubmissionAt > 0 ? Date.now() - lastSubmissionAt : Infinity;
  const recentSubmission = sinceLast < oneDayMs;
  const hoursAgo = Math.floor(sinceLast / (1000 * 60 * 60));
  const minutesAgo = Math.floor(sinceLast / (1000 * 60));
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    const file = e.target.files?.[0];
    if (!file) return;
    const url = previewURL(file);
    onSourceChange({ kind: 'file', file, previewUrl: url });
    e.target.value = '';
  };

  const ready = !!source;
  const handleTransfigure = () => {
    if (!source) return;
    onSubmit();
  };
  const heroLabel = ready
    ? t('cta_transfigure')
    : t('cta_need_specimen');

  const specimenSrc = !source ? null
    : source.kind === 'file' ? source.previewUrl
    : source.url;

  const captionKey: 'upload_caption_avatar_default' | 'upload_caption_ready' | 'upload_caption_empty' =
    source ? (source.kind === 'url' ? 'upload_caption_avatar_default' : 'upload_caption_ready')
           : (hasAvatarOnFile ? 'upload_caption_ready' : 'upload_caption_empty');
  const ctaKey: 'upload_cta' | 'upload_replace' | 'upload_cta_no_avatar' =
    source ? 'upload_replace'
           : (hasAvatarOnFile ? 'upload_cta' : 'upload_cta_no_avatar');

  return (
    <Ticket
      plate={t('plate_header_default')}
      rubric={t('plate_rubric_default')}
      footerHero={heroLabel}
      onFooterHeroClick={ready ? handleTransfigure : undefined}
      footerHeroDisabled={!ready}
      footerLeftAction={{ label: t('cta_wall'), onClick: onWall }}
    >
      {recentSubmission && (
        <div className="pf-daily-badge" role="note">
          <StarburstIcon className="pf-daily-badge__icon" />
          <span className="pf-daily-badge__text">
            <em>{t('daily_recent')}</em>
            {' · '}
            <span className="pf-daily-badge__time">
              {hoursAgo > 0 ? `${hoursAgo}h ago` : `${minutesAgo}m ago`}
            </span>
          </span>
          <span className="pf-daily-badge__hint">
            <em>{t('daily_next')}</em>
          </span>
        </div>
      )}

      <h1 className="pf-hero">
        <span className="pf-dropcap">{t('hero_dropcap')}</span>
        {t('hero_title')}
      </h1>
      <p className="pf-deck"><em>{t('hero_sub')}</em></p>

      {errorLabel ? (
        <div className="pf-error pf-error--persistent" role="alert">
          <StarburstIcon className="pf-error__icon" />
          <span><em>{errorLabel}</em></span>
        </div>
      ) : null}

      <div className="pf-section-rule" aria-hidden>
        <FlourishIcon className="pf-fleuron" />
      </div>

      {/* Specimen — the only required input. Centered, prominent. */}
      <section className="pf-specimen pf-specimen--centered">
        <div className="pf-specimen__label">{t('upload_label')}</div>

        {specimenSrc ? (
          <div className="pf-specimen__slot pf-specimen__slot--big">
            <img className="pf-specimen__img" src={specimenSrc} alt="" draggable={false} />
          </div>
        ) : (
          <label className="pf-specimen__slot pf-specimen__slot--big pf-specimen__slot--empty">
            <input
              type="file"
              accept="image/*"
              name="pf-photo-slot"
              className="pf-specimen__slot-file"
              onChange={onFile}
            />
            <UploadGlyph />
            <span className="pf-specimen__slot-hint"><em>{t('upload_tap_hint')}</em></span>
          </label>
        )}

        <p className="pf-specimen__caption pf-specimen__caption--centered">
          <em>{t(captionKey)}</em>
        </p>

        {/* Replace link — only show when a specimen is on file, so
            user can swap. Quieter than the primary upload prompt. */}
        {source && (
          <label className="pf-cta-link pf-cta-link--small">
            <input
              type="file"
              accept="image/*"
              name="pf-photo-replace"
              className="pf-cta-link__file"
              onChange={onFile}
            />
            <span className="pf-cta-link__text">{t(ctaKey)}</span>
          </label>
        )}
      </section>

      <div className="pf-section-rule" aria-hidden>
        <FlourishIcon className="pf-fleuron" />
      </div>

      {/* Tap-target "peek the orders" — opens the Bestiary for a full
          catalog read. Read-only here. */}
      <button type="button" className="pf-orders-peek"
              onPointerDown={() => { playClick(); onBestiary(); }}>
        <div className="pf-orders-peek__label">
          <em>{t('catalog_note')}</em>
        </div>
        <ul className="pf-orders-peek__row" aria-hidden>
          {PETS.map((pet) => (
            <li key={pet.id} title={`${pet.name} · ${pet.latin}`}>
              <span className="pf-orders-peek__icon" style={{ color: pet.tint }}>
                <PetEngraving id={pet.id} size={20} />
              </span>
            </li>
          ))}
        </ul>
        <div className="pf-orders-peek__link"><em>{t('bestiary_link')}</em></div>
      </button>
    </Ticket>
  );
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden
         fill="none" stroke="currentColor" strokeWidth={1.2}
         strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="18" width="44" height="32" rx="0" />
      <circle cx="32" cy="34" r="11" />
      <circle cx="32" cy="34" r="4" />
      <line x1="46" y1="22" x2="50" y2="22" />
      <path d="M10 22 L16 16 L26 16 L30 22" />
    </svg>
  );
}

// Pet definitions imported for the orders-peek row.
export type { Pet };
