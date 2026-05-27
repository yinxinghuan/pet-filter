// Frontispiece — the title page of the volume.
// Rotating community plate as the centerpiece, decorative title block,
// row of recent thumbnails, single CTA "Open the volume" → picker.

import { useEffect, useMemo, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { petById, PETS } from '../utils/pets';
import { playClick } from '../utils/audio';
import PetEngraving from './PetEngraving';
import type { PetShot, WallEntry } from '../types';

interface Props {
  entries: WallEntry[];
  /** Local own shots — included in the rotation when community is sparse. */
  myShots: PetShot[];
  /** Whether wall data has actually loaded (vs still being fetched). */
  loaded: boolean;
  onOpen: () => void;
  onArchive: () => void;
  /** Tap a thumbnail = jump straight into wall and view that one. */
  onView: (shot: PetShot, author?: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
}

// Rotate the hero every N ms.
const ROTATE_MS = 6500;

export default function FrontispiecePage({
  entries, myShots, loaded, onOpen, onArchive, onView,
}: Props) {
  // Build a single pool — own shots first, then community. Empty if
  // both are empty (handled by the empty-state branch below).
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

  // Reset index when the pool shrinks below the current cursor.
  useEffect(() => {
    if (idx >= pool.length && pool.length > 0) setIdx(0);
  }, [pool.length, idx]);

  const hero = pool.length > 0 ? pool[idx % pool.length] : null;
  // Show the next three after the hero as thumbnails (wraps around).
  const thumbs: WallEntry[] = useMemo(() => {
    if (pool.length <= 1) return [];
    const offsets = [1, 2, 3].map((d) => (idx + d) % pool.length);
    // De-dupe in case pool is very small.
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
      <div className="pf-front">
        {/* Title block */}
        <div className="pf-front__title-block">
          <div className="pf-front__house">{t('front_house')}</div>
          <div className="pf-front__year"><em>{t('front_year')}</em></div>
          <div className="pf-front__rule" aria-hidden />
          <div className="pf-front__dash-line">— {t('front_dash_line')} —</div>
          <h1 className="pf-front__book-title">{t('front_book_title')}</h1>
          <p className="pf-front__book-sub"><em>{t('front_book_sub')}</em></p>
        </div>

        {/* Hero plate / empty state */}
        {!loaded ? (
          <div className="pf-front__hero pf-front__hero--placeholder" aria-hidden>
            <div className="pf-front__hero-oval" />
          </div>
        ) : hero ? (
          <FrontHero key={hero.shot.id} entry={hero} onView={onView} />
        ) : (
          <FrontEmpty />
        )}

        {/* Star separator */}
        <div className="pf-front__stars" aria-hidden>⋆ ⋆ ⋆ ⋆ ⋆</div>

        {/* Recent thumbnails */}
        {thumbs.length > 0 && (
          <>
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
  // Cycle through a small sample of engravings every 2.4s to hint at
  // what the volume contains, even when no real plates exist.
  const sample = useMemo(() => {
    const ids = ['cat', 'capybara', 'axolotl', 'octopus', 'snail'];
    return ids.map((id) => PETS.find((p) => p.id === id)!).filter(Boolean);
  }, []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % sample.length), 2400);
    return () => clearInterval(id);
  }, [sample.length]);
  const pet = sample[i];
  return (
    <div className="pf-front__hero pf-front__hero--empty"
         style={{ '--tint': pet?.tint } as React.CSSProperties}>
      <div className="pf-front__hero-oval">
        <div className="pf-front__empty-art" key={pet.id}>
          <PetEngraving id={pet.id} size={180} />
        </div>
      </div>
      <div className="pf-front__hero-cap">
        <h2 className="pf-front__empty-title">{t('front_empty_title')}</h2>
        <p className="pf-front__empty-sub"><em>{t('front_empty_sub')}</em></p>
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
