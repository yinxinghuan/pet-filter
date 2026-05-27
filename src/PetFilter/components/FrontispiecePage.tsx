// Frontispiece — minimal Victorian title page.
// One title block + ONE big round portrait + wax-seal signature + CTA.
// The decorative ornaments (laurels, banner, knot, mandala, corners)
// were removed in favor of letterpress restraint.

import { useEffect, useMemo, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { petById, PETS } from '../utils/pets';
import { playClick } from '../utils/audio';
import { WaxSeal } from './FrontispieceArt';
import type { PetShot, WallEntry } from '../types';

interface Props {
  entries: WallEntry[];
  myShots: PetShot[];
  loaded: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onView: (shot: PetShot, author?: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
}

const ROTATE_MS = 6500;

// Curated demo portraits used when no real community data exists yet.
// These are pre-generated img2img outputs (see gen_demo_portraits.py).
const DEMO_PORTRAITS = [
  { src: '/pet-filter/demo_pet_cat.jpg',       petId: 'cat' },
  { src: '/pet-filter/demo_pet_capybara.jpg',  petId: 'capybara' },
  { src: '/pet-filter/demo_pet_octopus.jpg',   petId: 'octopus' },
];

export default function FrontispiecePage({
  entries, myShots, loaded, onOpen, onArchive, onView,
}: Props) {
  const pool: WallEntry[] = useMemo(() => {
    const owns: WallEntry[] = myShots.map((s) => ({ userId: 'self', userName: 'You', shot: s }));
    return [...owns, ...entries];
  }, [entries, myShots]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (pool.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % pool.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [pool.length]);

  useEffect(() => {
    if (idx >= pool.length && pool.length > 0) setIdx(0);
  }, [pool.length, idx]);

  const hero = pool.length > 0 ? pool[idx % pool.length] : null;

  const handleOpen = () => { playClick(); onOpen(); };
  const handleArchive = () => { playClick(); onArchive(); };

  return (
    <Ticket
      plate={t('plate_header_frontispiece')}
      rubric={'MMXXVI'}
      footerHero={t('front_cta_open')}
      onFooterHeroClick={handleOpen}
      footerLeftAction={{ label: t('front_cta_archive'), onClick: handleArchive }}
    >
      <div className="pf-front pf-front--min">
        {/* ─── Title block ─── */}
        <div className="pf-front__title-block">
          <div className="pf-front__house">{t('front_house')}</div>
          <div className="pf-front__rule-thick" aria-hidden />
          <h1 className="pf-front__book-title">{t('front_book_title')}</h1>
          <p className="pf-front__book-sub"><em>{t('front_book_sub')}</em></p>
          <div className="pf-front__rule-thin" aria-hidden />
          <div className="pf-front__year"><em>{t('front_year')}</em></div>
        </div>

        {/* ─── Hero portrait ─── */}
        {!loaded ? (
          <div className="pf-front__portrait pf-front__portrait--placeholder" aria-hidden />
        ) : hero ? (
          <FrontHero key={hero.shot.id} entry={hero} onView={onView} />
        ) : (
          <FrontDemo />
        )}

        {/* ─── Wax seal (single color accent) ─── */}
        <div className="pf-front__seal-wrap" aria-hidden>
          <WaxSeal size={56} />
        </div>

        <span className="pf-page-no">— frontispiece —</span>
      </div>
    </Ticket>
  );
}

// When no real community data exists, cycle through curated demos.
function FrontDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % DEMO_PORTRAITS.length), 3200);
    return () => clearInterval(id);
  }, []);
  const demo = DEMO_PORTRAITS[i];
  const pet = PETS.find((p) => p.id === demo.petId);
  return (
    <button type="button"
            className="pf-front__portrait pf-front__portrait--demo"
            style={{ '--tint': pet?.tint } as React.CSSProperties}
            tabIndex={-1}>
      <div className="pf-front__portrait-circle">
        <img className="pf-front__portrait-img"
             key={demo.src}
             src={demo.src}
             alt={pet?.name}
             draggable={false}
             onError={(e) => {
               // If demo image not yet shipped (e.g. local dev before
               // gen-script ran), keep the placeholder ring visible.
               (e.currentTarget as HTMLImageElement).style.opacity = '0';
             }} />
      </div>
      <div className="pf-front__portrait-cap">
        <div className="pf-front__portrait-name">{pet?.name}</div>
        <div className="pf-front__portrait-latin"><em>{pet?.latin}</em></div>
        <div className="pf-front__portrait-by">an example specimen</div>
      </div>
    </button>
  );
}

function FrontHero({ entry, onView }: { entry: WallEntry; onView: Props['onView'] }) {
  const pet = petById(entry.shot.petId);
  const credit = entry.userName ? entry.userName : 'anonymous';
  return (
    <button type="button"
            className="pf-front__portrait pf-front__portrait--live"
            style={{ '--tint': pet?.tint } as React.CSSProperties}
            onPointerDown={() => onView(entry.shot, {
              userId: entry.userId,
              userName: entry.userName,
              userAvatarUrl: entry.userAvatarUrl,
            })}>
      <div className="pf-front__portrait-circle">
        <img className="pf-front__portrait-img"
             src={entry.shot.imageUrl}
             alt={entry.shot.petName}
             draggable={false} />
      </div>
      <div className="pf-front__portrait-cap">
        <div className="pf-front__portrait-name">{entry.shot.petName}</div>
        <div className="pf-front__portrait-latin"><em>{pet?.latin}</em></div>
        <div className="pf-front__portrait-by">{t('front_credit_label')} <em>{credit}</em></div>
      </div>
    </button>
  );
}
