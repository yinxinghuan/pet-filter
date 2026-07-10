// Field-guide "plate" shell — heavy double-rule frame, serif header
// reading "ALTERU NATURAL HISTORY · PLATE XII · GENUS UNKNOWN", and a
// minimal footer with imprint + back-action. Mirrors the Plate page of
// a 19th-c. natural history book.

import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { playPop, hapticTap } from '../utils/audio';

interface FooterAction {
  label: string;
  onClick: () => void;
}

interface Props {
  /** Top-center label, e.g. "PLATE XII" or "FIELD STATION". */
  plate?: string;
  /** Top-right small label, italic — e.g. "Genus Unknown" or the
   *  Latin binomial on the result page. */
  rubric?: string;
  children: React.ReactNode;
  /** Bottom action — primary, right side, prepended with an arrow. */
  footerHero?: string;
  onFooterHeroClick?: () => void;
  footerHeroDirection?: 'forward' | 'back';
  footerHeroDisabled?: boolean;
  /** Bottom-left secondary action. */
  footerLeftAction?: FooterAction;
  className?: string;
}

export default function Ticket({
  plate, rubric, children, footerHero, onFooterHeroClick,
  footerHeroDirection = 'forward', footerHeroDisabled = false,
  footerLeftAction, className = '',
}: Props) {
  // Scroll-hint: show 『more below ▼』 when body content overflows AND
  // the user hasn't scrolled near the bottom. Tracked per render.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const NEAR_BOTTOM = 24;  // px tolerance
    const update = () => {
      const overflow = el.scrollHeight - el.clientHeight > 4;
      const atBottom = el.scrollHeight - (el.scrollTop + el.clientHeight) < NEAR_BOTTOM;
      setHasMore(overflow && !atBottom);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    // Re-evaluate on content/layout change.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c as Element));
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [children]);

  return (
    <article className={`pf-plate ${className}`}>
      <div className="pf-plate__rules" aria-hidden />

      <header className="pf-plate__head">
        <span className="pf-plate__house">{t('brand_mark')}</span>
        <span className="pf-plate__plate">{plate ?? t('plate_header_default')}</span>
        <span className="pf-plate__rubric">{rubric ?? t('plate_rubric_default')}</span>
      </header>

      <div className="pf-plate__rule" aria-hidden />

      <div className="pf-plate__body" ref={bodyRef}>{children}</div>

      {/* More-below pill — pulses softly when there's content beneath. */}
      {hasMore && (
        <button
          type="button"
          className="pf-plate__more"
          aria-label={t('scroll_more')}
          onClick={() => bodyRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}
        >
          <em>{t('scroll_more')}</em>
          <span className="pf-plate__more-arrow" aria-hidden>▾</span>
        </button>
      )}

      <div className="pf-plate__rule" aria-hidden />

      {(footerHero || footerLeftAction) && (
        <footer className="pf-plate__foot">
          <div className="pf-plate__foot-left">
            {footerLeftAction ? (
              <button
                type="button"
                className="pf-plate__foot-action"
                onPointerDown={() => {
                  playPop(); hapticTap();
                  footerLeftAction.onClick();
                }}
              >
                {/* Tiny archive-card icon: stacked plates, hinged
                    spine, like a real card-catalog drawer marker. */}
                <svg className="pf-plate__foot-icon"
                     viewBox="0 0 16 16" width="13" height="13"
                     fill="none" stroke="currentColor" strokeWidth="1.1"
                     strokeLinecap="square" strokeLinejoin="miter"
                     aria-hidden>
                  <rect x="2" y="4" width="12" height="9" />
                  <line x1="2" y1="7" x2="14" y2="7" />
                  <line x1="2" y1="10" x2="14" y2="10" />
                  <line x1="6" y1="2" x2="10" y2="2" strokeWidth="1.4" />
                </svg>
                {footerLeftAction.label}
              </button>
            ) : (
              <span className="pf-plate__imprint">A. {t('brand_mark')}</span>
            )}
          </div>
          {footerHero && onFooterHeroClick && (
            <button
              type="button"
              className={`pf-plate__foot-hero ${footerHeroDisabled ? 'is-disabled' : ''}`}
              onPointerDown={footerHeroDisabled ? undefined : () => {
                playPop(); hapticTap();
                onFooterHeroClick();
              }}
              disabled={footerHeroDisabled}
            >
              {footerHeroDirection === 'back' && (
                <span className="pf-plate__foot-arrow">←</span>
              )}
              {footerHero}
              {footerHeroDirection === 'forward' && (
                <span className="pf-plate__foot-arrow">→</span>
              )}
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
