import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import { PETS, type Pet } from '../utils/pets';
import { t, tCategory } from '../i18n';
import { previewURL } from '../utils/selfie';
import { playClick } from '../utils/audio';

interface Props {
  onSubmit: (file: File, petId: string) => void;
  onWall: () => void;
  errorLabel?: string;
}

export default function PickerScreen({ onSubmit, onWall, errorLabel }: Props) {
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null);
  const [pickedPet, setPickedPet] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ url: previewURL(file), file });
    e.target.value = '';
  };

  const ready = !!preview && !!pickedPet;
  const handleTransfigure = () => {
    if (!preview || !pickedPet) return;
    onSubmit(preview.file, pickedPet);
  };

  const groups: Record<string, Pet[]> = {
    everyday: PETS.filter((p) => p.category === 'everyday'),
    wholesome: PETS.filter((p) => p.category === 'wholesome'),
    uncanny: PETS.filter((p) => p.category === 'uncanny'),
  };

  return (
    <Ticket
      plate={t('plate_header_default')}
      rubric={t('plate_rubric_default')}
      footerHero={ready ? t('cta_transfigure') : t('cta_transfigure_pending')}
      onFooterHeroClick={ready ? handleTransfigure : undefined}
      footerHeroDisabled={!ready}
      footerLeftAction={{ label: t('cta_wall'), onClick: onWall }}
    >
      <h1 className="pf-hero">{t('hero_title')}</h1>
      <p className="pf-deck"><em>{t('hero_sub')}</em></p>

      <div className="pf-section-rule" aria-hidden />

      {/* Specimen-upload row */}
      <section className="pf-specimen">
        <div className="pf-specimen__label">{t('upload_label')}</div>
        <div className="pf-specimen__inner">
          <div className="pf-specimen__slot">
            {preview ? (
              <img className="pf-specimen__img" src={preview.url} alt="" draggable={false} />
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
              <span className="pf-cta-link__text">
                {preview ? t('upload_replace') : t('upload_cta')}
              </span>
            </label>
            <p className="pf-specimen__caption">
              {preview ? t('upload_caption_ready') : t('upload_hint')}
            </p>
          </div>
        </div>
      </section>

      {errorLabel ? <div className="pf-error">{errorLabel}</div> : null}

      <div className="pf-section-rule" aria-hidden />

      {/* Picker */}
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
          <PetIcon id={pet.id} />
        </div>
        <div className="pf-pet-tile__name">{pet.name}</div>
        <div className="pf-pet-tile__latin"><em>{pet.latin}</em></div>
      </button>
    </li>
  );
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 64 64" width={48} height={48} aria-hidden
         fill="none" stroke="currentColor" strokeWidth={1.6}
         strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="16" width="44" height="34" rx="1" />
      <circle cx="32" cy="33" r="9" />
      <circle cx="32" cy="33" r="3.5" />
      <line x1="46" y1="22" x2="50" y2="22" />
      <path d="M10 22 L16 16 L48 16 L54 22" />
    </svg>
  );
}

// Pet icons — engraving-style line glyphs (warm sepia). SVG only.
function PetIcon({ id }: { id: string }) {
  const common = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'cat': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <path d="M10 18 L14 10 L18 18 M30 18 L34 10 L38 18" />
        <path d="M10 18 Q24 12 38 18 Q40 30 32 36 Q24 39 16 36 Q8 30 10 18 Z" />
        <circle cx="20" cy="26" r="1.5" fill="currentColor" />
        <circle cx="28" cy="26" r="1.5" fill="currentColor" />
        <path d="M22 30 Q24 32 26 30" />
      </svg>
    );
    case 'dog': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <path d="M12 18 Q10 12 14 12 Q18 12 20 18" />
        <path d="M28 18 Q30 12 34 12 Q38 12 36 18" />
        <path d="M12 18 Q24 13 36 18 Q40 30 30 36 Q24 38 18 36 Q8 30 12 18 Z" />
        <circle cx="20" cy="26" r="1.5" fill="currentColor" />
        <circle cx="28" cy="26" r="1.5" fill="currentColor" />
        <ellipse cx="24" cy="32" rx="2.5" ry="1.5" fill="currentColor" />
      </svg>
    );
    case 'hamster': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <circle cx="24" cy="26" r="13" />
        <circle cx="13" cy="18" r="4" />
        <circle cx="35" cy="18" r="4" />
        <circle cx="19" cy="25" r="1.4" fill="currentColor" />
        <circle cx="29" cy="25" r="1.4" fill="currentColor" />
        <circle cx="24" cy="30" r="1.2" fill="currentColor" />
        <path d="M22 33 Q24 35 26 33" />
      </svg>
    );
    case 'duck': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <ellipse cx="20" cy="30" rx="14" ry="9" />
        <circle cx="32" cy="20" r="8" />
        <path d="M38 19 L46 21 L38 23 Z" />
        <circle cx="32" cy="19" r="1.2" fill="currentColor" />
      </svg>
    );
    case 'capybara': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <ellipse cx="24" cy="28" rx="18" ry="11" />
        <circle cx="14" cy="20" r="2.4" />
        <circle cx="20" cy="25" r="1.3" fill="currentColor" />
        <circle cx="11" cy="29" r="1.2" fill="currentColor" />
        <path d="M8 31 Q12 34 16 32" />
      </svg>
    );
    case 'sloth': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <circle cx="24" cy="24" r="13" />
        <circle cx="19" cy="24" r="3.5" />
        <circle cx="29" cy="24" r="3.5" />
        <circle cx="19" cy="24" r="1.2" fill="currentColor" />
        <circle cx="29" cy="24" r="1.2" fill="currentColor" />
        <path d="M20 33 Q24 36 28 33" />
        <path d="M14 16 Q12 18 14 20 M34 16 Q36 18 34 20" />
      </svg>
    );
    case 'parrot': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <path d="M16 40 Q12 22 22 12 Q34 8 38 18 Q40 32 30 40 Z" />
        <path d="M22 22 L13 24 L20 27 Z" fill="currentColor" />
        <circle cx="29" cy="19" r="1.6" fill="currentColor" />
        <path d="M24 12 Q26 8 28 12" />
      </svg>
    );
    case 'axolotl': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <ellipse cx="24" cy="28" rx="13" ry="8" />
        <path d="M11 21 Q6 19 8 26 M11 28 Q6 32 10 36" />
        <path d="M37 21 Q42 19 40 26 M37 28 Q42 32 38 36" />
        <circle cx="20" cy="26" r="1.2" fill="currentColor" />
        <circle cx="28" cy="26" r="1.2" fill="currentColor" />
        <path d="M21 30 Q24 33 27 30" />
      </svg>
    );
    case 'hedgehog': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <path d="M8 30 L13 18 L17 28 L21 16 L25 28 L29 18 L33 28 L38 22 Q42 36 24 38 Q10 38 8 30 Z" />
        <circle cx="36" cy="28" r="1.2" fill="currentColor" />
        <circle cx="40" cy="30" r="1" fill="currentColor" />
      </svg>
    );
    case 'clam': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <path d="M6 28 Q24 12 42 28 L24 32 Z" />
        <path d="M6 28 Q24 42 42 28" />
        <path d="M14 28 L14 32 M22 28 L22 32 M30 28 L30 32 M38 28 L38 32" />
        <circle cx="24" cy="30" r="1.2" fill="currentColor" />
      </svg>
    );
    case 'octopus': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <ellipse cx="24" cy="20" rx="12" ry="10" />
        <path d="M14 28 Q10 38 6 41 M18 30 Q16 40 12 44 M24 30 Q24 42 22 44 M30 30 Q32 40 36 44 M34 28 Q38 38 42 41" />
        <circle cx="20" cy="20" r="1.4" fill="currentColor" />
        <circle cx="28" cy="20" r="1.4" fill="currentColor" />
      </svg>
    );
    case 'snail': return (
      <svg viewBox="0 0 48 48" width={36} height={36} {...common} aria-hidden>
        <circle cx="20" cy="22" r="9" />
        <circle cx="20" cy="22" r="5" />
        <circle cx="20" cy="22" r="2" />
        <path d="M28 30 Q40 28 38 38 L8 38 Q6 32 16 32" />
        <line x1="38" y1="22" x2="42" y2="14" />
        <line x1="42" y1="22" x2="46" y2="14" />
        <circle cx="42" cy="14" r="1.1" fill="currentColor" />
        <circle cx="46" cy="14" r="1.1" fill="currentColor" />
      </svg>
    );
    default: return null;
  }
}
