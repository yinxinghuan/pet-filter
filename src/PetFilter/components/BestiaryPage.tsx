// Bestiary — full reference page showing all 12 orders. Reached from
// the picker's "peek the orders" ribbon. Each species gets its real
// generated cover plate + name + Latin + a one-line Society character
// read.

import Ticket from './Ticket';
import { PETS, type Pet } from '../utils/pets';
import { t, tCategory } from '../i18n';
import { playClick } from '../utils/audio';
import { FlourishIcon } from './OrnamentIcons';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

export default function BestiaryPage({ onBack, onSubmit }: Props) {
  const groups: Record<string, Pet[]> = {
    everyday: PETS.filter((p) => p.category === 'everyday'),
    wholesome: PETS.filter((p) => p.category === 'wholesome'),
    uncanny: PETS.filter((p) => p.category === 'uncanny'),
  };

  return (
    <Ticket
      plate={t('plate_header_bestiary')}
      rubric={t('plate_rubric_bestiary')}
      footerHero={t('cta_transfigure')}
      onFooterHeroClick={() => { playClick(); onSubmit(); }}
      footerLeftAction={{ label: t('cta_back_to_picker'), onClick: onBack }}
    >
      <h1 className="pf-hero pf-hero--bestiary">
        <span className="pf-dropcap">{t('bestiary_dropcap')}</span>
        {t('bestiary_title')}
      </h1>
      <p className="pf-deck"><em>{t('bestiary_sub')}</em></p>

      <div className="pf-section-rule" aria-hidden>
        <FlourishIcon className="pf-fleuron" />
      </div>

      {(['everyday', 'wholesome', 'uncanny'] as const).map((cat) => (
        <section key={cat} className="pf-bestiary__section">
          <header className="pf-bestiary__section-head">
            <span className="pf-bestiary__section-name">{tCategory(cat)}</span>
            <span className="pf-bestiary__section-rule" aria-hidden />
          </header>
          <ul className="pf-bestiary__list">
            {groups[cat].map((pet) => (
              <BestiaryCard key={pet.id} pet={pet} />
            ))}
          </ul>
        </section>
      ))}
    </Ticket>
  );
}

function BestiaryCard({ pet }: { pet: Pet }) {
  return (
    <li className="pf-bestiary__card" style={{ '--tint': pet.tint } as React.CSSProperties}>
      <div className="pf-bestiary__plate">
        <img className="pf-bestiary__img"
             src={`cover_${pet.id}.jpg`}
             alt={pet.name}
             draggable={false} />
      </div>
      <div className="pf-bestiary__body">
        <div className="pf-bestiary__plate-no">Pl. {pet.plate}</div>
        <div className="pf-bestiary__name">{pet.name}</div>
        <div className="pf-bestiary__latin"><em>{pet.latin}</em></div>
        <p className="pf-bestiary__character"><em>{pet.character}</em></p>
      </div>
    </li>
  );
}
