import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import type { Stage } from '../hooks/usePetGen';
import { petById } from '../utils/pets';
import { PressureGauge, CaliperFrame, StageIndicators } from './ProcessingInstruments';

interface Props {
  stage: Stage;
  petId: string;
  selfiePreviewUrl?: string;
  startedAt: number;
  estimatedTotalMs?: number;
  onCancel: () => void;
}

export default function ProcessingScreen({
  stage, petId, selfiePreviewUrl, startedAt, estimatedTotalMs = 60_000, onCancel,
}: Props) {
  const pet = petById(petId);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = startedAt > 0 ? Math.max(0, now - startedAt) : 0;
  const elapsedS = Math.floor(elapsedMs / 1000);
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
        {/* Specimen plate framed by caliper rulers + brass corners */}
        <CaliperFrame>
          {selfiePreviewUrl ? (
            <img className="pf-proc__photo-img" src={selfiePreviewUrl} alt="" draggable={false} />
          ) : (
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
        </CaliperFrame>

        {/* Stage indicators — 4 valves */}
        <StageIndicators current={stage} />

        {/* Pressure gauge replacing the linear bar */}
        <div className="pf-proc__gauge">
          <PressureGauge progress={stage99} label={stageLabel} />
        </div>

        {/* Brass chronometer line */}
        <div className="pf-proc__chrono">
          <span className="pf-proc__chrono-cell">
            <em>elapsed</em>
            <strong>{String(elapsedS).padStart(2, '0')}<span className="pf-proc__sep">″</span></strong>
          </span>
          <span className="pf-proc__chrono-bar" aria-hidden />
          <span className="pf-proc__chrono-cell">
            <em>est. total</em>
            <strong>~{Math.round(estimatedTotalMs / 1000)}<span className="pf-proc__sep">″</span></strong>
          </span>
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
