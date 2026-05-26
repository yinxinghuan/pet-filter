import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import type { Stage } from '../hooks/usePetGen';
import { petById } from '../utils/pets';

interface Props {
  stage: Stage;
  petId: string;
  selfiePreviewUrl?: string;
}

export default function ProcessingScreen({ stage, petId, selfiePreviewUrl }: Props) {
  const pet = petById(petId);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 420);
    return () => clearInterval(id);
  }, []);

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
          {selfiePreviewUrl && (
            <img className="pf-proc__photo-img" src={selfiePreviewUrl} alt="" draggable={false} />
          )}
          <div className="pf-proc__scan" />
          <span className="pf-proc__corner pf-proc__corner--tl" />
          <span className="pf-proc__corner pf-proc__corner--tr" />
          <span className="pf-proc__corner pf-proc__corner--bl" />
          <span className="pf-proc__corner pf-proc__corner--br" />
        </div>
        <div className="pf-proc__step">
          {stageLabel}<span className="pf-proc__dots">{dots}</span>
        </div>
        <div className="pf-proc__fineprint"><em>{t('proc_fineprint')}</em></div>
      </div>
    </Ticket>
  );
}
