// Frontispiece — Victorian title page with laurel-wreathed cartouche
// and wax-seal medallion. Centerpiece is a rotating live community
// plate (or a mandala of engravings when no real plates exist).

import { useEffect, useMemo, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { petById, PETS } from '../utils/pets';
import { playClick } from '../utils/audio';
import PetEngraving from './PetEngraving';
import {
  LaurelBranch, WaxSeal, RibbonBanner, KnotFloret, CornerOrnament,
} from './FrontispieceArt';
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
const MANDALA_MS = 3200;

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
  const thumbs: WallEntry[] = useMemo(() => {
    if (pool.length <= 1) return [];
    const offsets = [1, 2, 3].map((d) => (idx + d) % pool.length);
    return Array.from(new Set(offsets)).slice(0, 3).map((i) => pool[i]);
  }, [pool, idx]);

  const handleOpen = () => { playClick(); onOpen(); };
  const handleArchive = () => { playClick(); onArchive(); };

  return (
    <Ticket
      plate={t('plate_header_frontispiece')}
      rubric={t('plate_rubric_frontispiece') + ' · MMXXVI'}
      footerHero={t('front_cta_open')}
      onFooterHeroClick={handleOpen}
      footerLeftAction={{ label: t('front_cta_archive'), onClick: handleArchive }}
    >
      <div className="pf-front pf-front--v2">
        {/* ─── Title block ─── */}
        <div className="pf-front__title-wrap">
          <CornerOrnament size={24} />
          <div className="pf-front__corner pf-front__corner--tr"><CornerOrnament size={24} flipH /></div>
          <div className="pf-front__title-block">
            <div className="pf-front__house">{t('front_house')}</div>
            <div className="pf-front__year"><em>{t('front_year')} · MMXXVI</em></div>
            <div className="pf-front__rule-thick" aria-hidden />
            <div className="pf-front__dash-line">— {t('front_dash_line')} —</div>
            <h1 className="pf-front__book-title">{t('front_book_title')}</h1>
            <div className="pf-front__rule-thin" aria-hidden />
            <p className="pf-front__book-sub"><em>{t('front_book_sub')}</em></p>
          </div>
          <div className="pf-front__corner pf-front__corner--bl"><CornerOrnament size={24} flipV /></div>
          <div className="pf-front__corner pf-front__corner--br"><CornerOrnament size={24} flipH flipV /></div>
        </div>

        {/* Wax seal — single color accent, drops in last */}
        <div className="pf-front__seal-wrap" aria-hidden>
          <WaxSeal size={60} />
        </div>

        {/* ─── Hero plate framed by laurels ─── */}
        <div className="pf-front__plate-wrap">
          <div className="pf-front__banner" aria-hidden>
            <RibbonBanner text="VOL · I" width={120} height={26} />
          </div>
          <div className="pf-front__laurel pf-front__laurel--l" aria-hidden>
            <LaurelBranch side="left" />
          </div>
          <div className="pf-front__laurel pf-front__laurel--r" aria-hidden>
            <LaurelBranch side="right" />
          </div>

          {!loaded ? (
            <div className="pf-front__hero pf-front__hero--placeholder" aria-hidden>
              <div className="pf-front__hero-oval" />
            </div>
          ) : hero ? (
            <FrontHero key={hero.shot.id} entry={hero} onView={onView} />
          ) : (
            <FrontEmpty />
          )}

          <div className="pf-front__knot" aria-hidden>
            <KnotFloret size={28} />
          </div>
        </div>

        {/* Mandala satellites — only shown in empty state */}
        {loaded && !hero && <MandalaSatellites />}

        {/* Star separator + thumbnails (only if real data) */}
        {thumbs.length > 0 && (
          <>
            <div className="pf-front__stars" aria-hidden>⋆ ⋆ ⋆ ⋆ ⋆</div>
            <div className="pf-front__thumbs-label">{t('front_thumbs_label')}</div>
            <ul className="pf-front__thumbs">
              {thumbs.map((e) => {
                const pet = petById(e.shot.petId);
                return (
                  <li key={e.shot.id}>
                    <button type="button"
                            className="pf-front__thumb"
                            style={{ '--tint': pet?.tint } as React.CSSProperties}
                            onPointerDown={() => {
                              playClick();
                              onView(e.shot, {
                                userId: e.userId,
                                userName: e.userName,
                                userAvatarUrl: e.userAvatarUrl,
                              });
                            }}
                            aria-label={e.shot.petName}>
                      <img className="pf-front__thumb-img"
                           src={e.shot.imageUrl}
                           alt={e.shot.petName}
                           draggable={false} />
                      <span className="pf-front__thumb-cap">{e.shot.petName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <span className="pf-page-no">— frontispiece —</span>
      </div>
    </Ticket>
  );
}

function FrontEmpty() {
  // Big-impact rotating engraving inside the main oval. The 4 satellites
  // (rendered separately) provide visual density around it.
  const sample = useMemo(() => {
    const ids = ['cat', 'capybara', 'axolotl', 'octopus', 'sloth', 'parrot'];
    return ids.map((id) => PETS.find((p) => p.id === id)!).filter(Boolean);
  }, []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % sample.length), 2800);
    return () => clearInterval(id);
  }, [sample.length]);
  const pet = sample[i];
  return (
    <div className="pf-front__hero pf-front__hero--empty"
         style={{ '--tint': pet?.tint } as React.CSSProperties}>
      <div className="pf-front__hero-oval">
        <div className="pf-front__empty-art" key={pet.id}>
          <PetEngraving id={pet.id} size={170} />
        </div>
      </div>
      <div className="pf-front__hero-cap">
        <h2 className="pf-front__empty-title">{t('front_empty_title')}</h2>
        <p className="pf-front__empty-sub"><em>{t('front_empty_sub')}</em></p>
      </div>
    </div>
  );
}

// Four small ovals at NW / NE / SW / SE, each cycling through a
// different sequence of engravings so the user sees ~12 species before
// they tap. Used only when no real wall data exists.
function MandalaSatellites() {
  const setA = ['dog', 'duck', 'snail'];
  const setB = ['hedgehog', 'clam', 'hamster'];
  const setC = ['parrot', 'sloth', 'cat'];
  const setD = ['octopus', 'capybara', 'axolotl'];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), MANDALA_MS);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pf-front__mandala" aria-hidden>
      <Satellite at="nw" id={setA[tick % setA.length]} />
      <Satellite at="ne" id={setB[tick % setB.length]} />
      <Satellite at="sw" id={setC[tick % setC.length]} />
      <Satellite at="se" id={setD[tick % setD.length]} />
    </div>
  );
}

function Satellite({ at, id }: { at: 'nw' | 'ne' | 'sw' | 'se'; id: string }) {
  const pet = PETS.find((p) => p.id === id);
  return (
    <div className={`pf-front__satellite pf-front__satellite--${at}`}
         style={{ '--tint': pet?.tint } as React.CSSProperties}>
      <div className="pf-front__satellite-oval" key={id}>
        <PetEngraving id={id} size={44} />
      </div>
    </div>
  );
}

function FrontHero({ entry, onView }: { entry: WallEntry; onView: Props['onView'] }) {
  const pet = petById(entry.shot.petId);
  const credit = entry.userName ? entry.userName : 'anonymous';
  return (
    <button type="button"
            className="pf-front__hero"
            style={{ '--tint': pet?.tint } as React.CSSProperties}
            onPointerDown={() => onView(entry.shot, {
              userId: entry.userId,
              userName: entry.userName,
              userAvatarUrl: entry.userAvatarUrl,
            })}>
      <div className="pf-front__hero-oval">
        <img className="pf-front__hero-img"
             src={entry.shot.imageUrl}
             alt={entry.shot.petName}
             draggable={false} />
      </div>
      <div className="pf-front__hero-cap">
        <div className="pf-front__hero-name">{entry.shot.petName}</div>
        <div className="pf-front__hero-latin"><em>{pet?.latin}</em></div>
        <div className="pf-front__hero-by">
          {t('front_credit_label')} <em>{credit}</em>
        </div>
      </div>
    </button>
  );
}
