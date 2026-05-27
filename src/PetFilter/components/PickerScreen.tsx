import { useState } from 'react';
import Ticket from './Ticket';
import { PETS, type Pet } from '../utils/pets';
import { t, tCategory } from '../i18n';
import { previewURL } from '../utils/selfie';
import { playClick } from '../utils/audio';
import PetEngraving from './PetEngraving';

interface Props {
  /** Source of the specimen photo. Either a freshly uploaded file OR a
   *  pre-uploaded URL (typically the user's Aigram avatar). */
  source: { kind: 'file'; file: File; previewUrl: string } | { kind: 'url'; url: string } | null;
  onSourceChange: (next: { kind: 'file'; file: File; previewUrl: string } | { kind: 'url'; url: string } | null) => void;
  /** Whether we're on platform AND fetched a real user avatar. Drives
   *  copy: "your avatar is on file" vs. "submit a likeness please". */
  hasAvatarOnFile: boolean;
  onSubmit: (petId: string) => void;
  onWall: () => void;
  errorLabel?: string;
}

export default function PickerScreen({
  source, onSourceChange, hasAvatarOnFile, onSubmit, onWall, errorLabel,
}: Props) {
  const [pickedPet, setPickedPet] = useState<string | null>(null);

  // When a fresh file is picked, swap source (parent owns it). Revoking
  // the old preview URL is delegated to the parent so navigating away
  // doesn't lose the photo.
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    const file = e.target.files?.[0];
    if (!file) return;
    const url = previewURL(file);
    onSourceChange({ kind: 'file', file, previewUrl: url });
    e.target.value = '';
  };

  const ready = !!source && !!pickedPet;
  const handleTransfigure = () => {
    if (!source || !pickedPet) return;
    onSubmit(pickedPet);
  };

  const groups: Record<string, Pet[]> = {
    everyday: PETS.filter((p) => p.category === 'everyday'),
    wholesome: PETS.filter((p) => p.category === 'wholesome'),
    uncanny: PETS.filter((p) => p.category === 'uncanny'),
  };

  const specimenSrc = !source ? null
    : source.kind === 'file' ? source.previewUrl
    : source.url;

  // Caption + CTA copy keys depend on whether a source is on file.
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
      footerHero={ready ? t('cta_transfigure') : t('cta_transfigure_pending')}
      onFooterHeroClick={ready ? handleTransfigure : undefined}
      footerHeroDisabled={!ready}
      footerLeftAction={{ label: t('cta_wall'), onClick: onWall }}
    >
      <h1 className="pf-hero">
        <span className="pf-dropcap">{t('hero_dropcap')}</span>
        {t('hero_title')}
      </h1>
      <p className="pf-deck"><em>{t('hero_sub')}</em></p>

      {/* Persistent error bar — re-entry from a failed gen leaves the
          error visible here until the user starts a new attempt. */}
      {errorLabel ? (
        <div className="pf-error pf-error--persistent" role="alert">
          <span className="pf-error__icon" aria-hidden>✶</span>
          <span><em>{errorLabel}</em></span>
        </div>
      ) : null}

      <div className="pf-section-rule" aria-hidden>
        <span className="pf-fleuron">❦</span>
      </div>

      {/* Specimen — avatar pre-filled or upload */}
      <section className="pf-specimen">
        <div className="pf-specimen__label">{t('upload_label')}</div>
        <div className="pf-specimen__inner">
          <div className="pf-specimen__slot">
            {specimenSrc ? (
              <img className="pf-specimen__img" src={specimenSrc} alt="" draggable={false} />
            ) : (
              <UploadGlyph />
            )}
          </div>
          <div className="pf-specimen__side">
            <label className="pf-cta-link">
              <input
                type="file"
                accept="image/*"
                name="pf-photo"
                className="pf-cta-link__file"
                onChange={onFile}
              />
              <span className="pf-cta-link__text">{t(ctaKey)}</span>
            </label>
            <p className="pf-specimen__caption"><em>{t(captionKey)}</em></p>
          </div>
        </div>
      </section>


      <div className="pf-section-rule" aria-hidden>
        <span className="pf-fleuron">❦</span>
      </div>

      <div className="pf-pick-head">
        <h2 className="pf-pick-head__title">{t('pick_heading')}</h2>
        <span className="pf-pick-head__sub"><em>{t('pick_sub')}</em></span>
      </div>

      {(['everyday', 'wholesome', 'uncanny'] as const).map((cat) => (
        <section key={cat} className="pf-pet-section">
          <header className="pf-pet-section__head">
            <span className="pf-pet-section__name">{tCategory(cat)}</span>
            <span className="pf-pet-section__rule" aria-hidden />
          </header>
          <ul className="pf-pet-grid">
            {groups[cat].map((pet) => (
              <PetTile
                key={pet.id}
                pet={pet}
                active={pickedPet === pet.id}
                onPick={(id) => { playClick(); setPickedPet(id); }}
              />
            ))}
          </ul>
        </section>
      ))}

      <span className="pf-page-no">— xii —</span>
    </Ticket>
  );
}

function PetTile({ pet, active, onPick }: { pet: Pet; active: boolean; onPick: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        className={`pf-pet-tile ${active ? 'is-active' : ''}`}
        style={{ '--tile-tint': pet.tint } as React.CSSProperties}
        onPointerDown={() => onPick(pet.id)}
      >
        <span className="pf-pet-tile__plate">Pl. {pet.plate}</span>
        <div className="pf-pet-tile__icon" aria-hidden>
          <PetEngraving id={pet.id} size={62} />
        </div>
        <div className="pf-pet-tile__name">{pet.name}</div>
        <div className="pf-pet-tile__latin"><em>{pet.latin}</em></div>
      </button>
    </li>
  );
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 64 64" width={44} height={44} aria-hidden
         fill="none" stroke="currentColor" strokeWidth={1.4}
         strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="18" width="44" height="32" rx="0" />
      <circle cx="32" cy="34" r="9" />
      <circle cx="32" cy="34" r="3" />
      <line x1="46" y1="22" x2="50" y2="22" />
      <path d="M10 22 L16 16 L26 16 L30 22" />
    </svg>
  );
}
