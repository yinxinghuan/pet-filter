import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import type { Stage } from '../hooks/usePetGen';
import { petById, PETS } from '../utils/pets';
import { CaliperFrame } from './ProcessingInstruments';

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

  // The Society publicly considers each of the 12 known orders during
  // the wait — uses the real generated cover plates so the user sees
  // beautiful Audubon illustrations rolling by. Builds anticipation
  // and answers 『what could I become?』 in the most engaging moment.
  const [considerIdx, setConsiderIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setConsiderIdx((i) => (i + 1) % PETS.length), 3200);
    return () => clearInterval(id);
  }, []);
  const considered = PETS[considerIdx];

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

        <div className="pf-proc__step"><em>{stageLabel}</em></div>

        {/* The Society publicly considers each known order in turn —
            shows the actual generated cover plate rotating through all
            12 species with name + Latin underneath. */}
        <div className="pf-proc__consider">
          <div className="pf-proc__consider-label">
            <em>{t('proc_considering')}</em>
          </div>
          <div className="pf-proc__consider-plate" key={considered.id}
               style={{ '--tint': considered.tint } as React.CSSProperties}>
            <img className="pf-proc__consider-img"
                 src={`/pet-filter/cover_${considered.id}.jpg`}
                 alt={considered.name}
                 draggable={false} />
          </div>
          <div className="pf-proc__consider-name">{considered.name}</div>
          <div className="pf-proc__consider-latin"><em>{considered.latin}</em></div>
        </div>

        {/* Thin engraved progress rule — ink only, no brass. */}
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
