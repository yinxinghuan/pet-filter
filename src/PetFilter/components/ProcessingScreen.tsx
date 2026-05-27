import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import type { Stage } from '../hooks/usePetGen';
import { petById } from '../utils/pets';

interface Props {
  stage: Stage;
  petId: string;
  selfiePreviewUrl?: string;
  /** Unix-ms timestamp when generate() started, or 0 when idle. */
  startedAt: number;
  /** Estimated total wall-clock for the generation. Used for the
   *  faux-progress bar — the API doesn't expose true %. */
  estimatedTotalMs?: number;
  onCancel: () => void;
}

export default function ProcessingScreen({
  stage, petId, selfiePreviewUrl, startedAt, estimatedTotalMs = 60_000, onCancel,
}: Props) {
  const pet = petById(petId);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second for the elapsed counter + progress bar fill.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = startedAt > 0 ? Math.max(0, now - startedAt) : 0;
  const elapsedS = Math.floor(elapsedMs / 1000);
  // Asymptote at 95% so the bar doesn't appear "done" while we wait
  // for the slowest leg (gen-image) to finish; the result transition
  // snaps to 100%.
  const progress = Math.min(0.95, elapsedMs / estimatedTotalMs);
  const stage99 = stage === 'settling' ? 1 : progress;

  const stageLabel = (() => {
    switch (stage) {
      case 'uploading': return t('proc_step_reading');
      case 'morphing': return t('proc_step_morphing');
      case 'rendering': return t('proc_step_rendering');
      case 'settling': return t('proc_step_settling');
      default: return t('proc_step_reading');
    }
  })();

  return (
    <Ticket
      plate={t('plate_header_processing')}
      rubric={pet ? pet.latin : '…'}
    >
      <div className="pf-proc">
        <div className="pf-proc__photo" style={{ '--tint': pet?.tint } as React.CSSProperties}>
          {selfiePreviewUrl ? (
            <img className="pf-proc__photo-img" src={selfiePreviewUrl} alt="" draggable={false} />
          ) : (
            // Fallback ornament so the slot never appears empty.
            <div className="pf-proc__photo-fallback" aria-hidden>
              <svg viewBox="0 0 48 48" width={40} height={40}
                   fill="none" stroke="currentColor" strokeWidth={1.2}
                   strokeLinecap="round" strokeLinejoin="round">
                <circle cx="24" cy="20" r="8" />
                <path d="M10 40 Q10 30 24 30 Q38 30 38 40" />
              </svg>
            </div>
          )}
          <div className="pf-proc__scan" />
          <span className="pf-proc__corner pf-proc__corner--tl" />
          <span className="pf-proc__corner pf-proc__corner--tr" />
          <span className="pf-proc__corner pf-proc__corner--bl" />
          <span className="pf-proc__corner pf-proc__corner--br" />
        </div>

        <div className="pf-proc__step">{stageLabel}</div>

        {/* Ink-fill progress vial */}
        <div className="pf-proc__progress" aria-label={`${Math.round(stage99 * 100)} percent`}>
          <div className="pf-proc__progress-fill"
               style={{ width: `${stage99 * 100}%` }} />
        </div>
        <div className="pf-proc__elapsed">
          <span><em>elapsed</em> {String(elapsedS).padStart(2, '0')}<span className="pf-proc__sep">″</span></span>
          <span><em>est. total</em> ~{Math.round(estimatedTotalMs / 1000)}<span className="pf-proc__sep">″</span></span>
        </div>

        <div className="pf-proc__fineprint"><em>{t('proc_fineprint')}</em></div>

        <button type="button"
                className="pf-proc__cancel"
                onPointerDown={onCancel}>
          <em>{t('proc_cancel')}</em>
        </button>
      </div>
    </Ticket>
  );
}
