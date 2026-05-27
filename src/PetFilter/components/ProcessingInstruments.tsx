// Brass-era scientific instruments for the Processing screen.
// Steam-age scientific instrument vibe: pressure gauge, caliper frame,
// filament valves for stage indicators, chronometer dial. Drawn in
// inline SVG so the needle / hands / glow can animate to React state.

import React from 'react';

const BRASS = '#8C6A2E';
const BRASS_DEEP = '#5A3F18';
const BRASS_HIGH = '#D4A75A';
const BRASS_GLOW = '#E8C77A';
const PAPER = '#EBDFC2';
const INK = '#261A0F';
const SEAL = '#8A2E22';

// ─── Pressure gauge ─────────────────────────────────────────────────
// Half-circle dial that sweeps from 0% (far left) to 100% (far right).
// Brass rim + screw heads at the corners, paper face with engraved
// hash marks, a single seal-red needle.
interface PressureGaugeProps {
  /** Normalized 0..1 progress. */
  progress: number;
  /** Stage label baked into the dial face. */
  label: string;
}
export function PressureGauge({ progress, label }: PressureGaugeProps) {
  // Needle sweeps from -100° (left) to +100° (right) — ~200° travel.
  const minA = -100;
  const maxA = 100;
  const a = minA + Math.min(1, Math.max(0, progress)) * (maxA - minA);
  // Major tick angles every 25° from -100 to +100.
  const majors = [-100, -75, -50, -25, 0, 25, 50, 75, 100];
  const minors: number[] = [];
  for (let t = -95; t <= 100; t += 5) if (!majors.includes(t)) minors.push(t);

  // Polar → cartesian helpers (center at 100,100; gauge radius 78).
  const cx = 100, cy = 100;
  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <svg viewBox="0 0 200 130" width="100%" height="auto" aria-hidden>
      {/* Outer brass plate w/ rounded rivets */}
      <rect x="2" y="2" width="196" height="126" rx="6"
            fill={PAPER} stroke={BRASS_DEEP} strokeWidth="1.2" />
      <rect x="4" y="4" width="192" height="122" rx="5"
            fill="none" stroke={BRASS} strokeWidth="0.6" />
      {/* Corner screws */}
      {([[10, 10], [190, 10], [10, 120], [190, 120]] as const).map(([sx, sy], i) => (
        <g key={i}>
          <circle cx={sx} cy={sy} r="3.4" fill={BRASS_HIGH} stroke={BRASS_DEEP} strokeWidth="0.5" />
          <line x1={sx - 2} y1={sy - 1} x2={sx + 2} y2={sy + 1}
                stroke={BRASS_DEEP} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      ))}
      {/* Dial face circle */}
      <circle cx={cx} cy={cy} r="80" fill={PAPER}
              stroke={BRASS_DEEP} strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r="78" fill="none"
              stroke={BRASS} strokeWidth="2.8" />
      <circle cx={cx} cy={cy} r="72" fill={PAPER}
              stroke={BRASS_DEEP} strokeWidth="0.4" />

      {/* Hash marks */}
      {majors.map((deg) => {
        const [x1, y1] = polar(deg, 70);
        const [x2, y2] = polar(deg, 60);
        return <line key={`M${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
                     stroke={INK} strokeWidth="1.3" strokeLinecap="round" />;
      })}
      {minors.map((deg) => {
        const [x1, y1] = polar(deg, 70);
        const [x2, y2] = polar(deg, 65);
        return <line key={`m${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
                     stroke={INK} strokeWidth="0.5" />;
      })}

      {/* Engraved labels every 25% */}
      {[0, 25, 50, 75, 100].map((pct) => {
        const deg = minA + (pct / 100) * (maxA - minA);
        const [lx, ly] = polar(deg, 52);
        return (
          <text key={pct} x={lx} y={ly}
                fontFamily="'Cormorant Garamond', serif"
                fontSize="9" fontWeight="600" fill={INK}
                textAnchor="middle" dominantBaseline="central">
            {pct}
          </text>
        );
      })}

      {/* Dial label arc text */}
      <text x={cx} y={cy + 18}
            fontFamily="'Cormorant Garamond', serif"
            fontStyle="italic"
            fontSize="10" fontWeight="500"
            fill={BRASS_DEEP}
            textAnchor="middle">
        Transfiguration pressure
      </text>
      <text x={cx} y={cy + 30}
            fontFamily="'Source Serif 4', serif"
            fontStyle="italic"
            fontSize="8" fill={INK}
            textAnchor="middle"
            opacity="0.6">
        {label}
      </text>

      {/* Needle — pinned at center, sweeps to angle a. */}
      <g transform={`rotate(${a} ${cx} ${cy})`}
         style={{ transition: 'transform 900ms cubic-bezier(0.45, 0.05, 0.5, 0.95)' }}>
        {/* Counterweight bottom side */}
        <rect x={cx - 1.2} y={cy - 4} width="2.4" height="14"
              fill={BRASS_DEEP} />
        {/* Pointer */}
        <polygon points={`${cx - 2},${cy} ${cx + 2},${cy} ${cx},${cy - 60}`}
                 fill={SEAL} stroke={BRASS_DEEP} strokeWidth="0.4" />
      </g>
      {/* Center cap */}
      <circle cx={cx} cy={cy} r="6" fill={BRASS_HIGH}
              stroke={BRASS_DEEP} strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r="2.4" fill={BRASS_DEEP} />
    </svg>
  );
}

// ─── Caliper frame ─────────────────────────────────────────────────
// Wraps the specimen photo. Provides ruler-tick marks on all 4 edges
// like a brass micrometer viewfinder. Children render inside.
export function CaliperFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pf-caliper">
      {/* SVG tick rulers along each edge */}
      <svg className="pf-caliper__rule pf-caliper__rule--top"
           viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 41 }).map((_, i) => {
          const x = i * 5;
          const major = i % 5 === 0;
          return <line key={i} x1={x} x2={x}
                       y1="8" y2={major ? 0 : 4}
                       stroke={INK} strokeWidth={major ? 0.8 : 0.4} />;
        })}
      </svg>
      <svg className="pf-caliper__rule pf-caliper__rule--bottom"
           viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 41 }).map((_, i) => {
          const x = i * 5;
          const major = i % 5 === 0;
          return <line key={i} x1={x} x2={x}
                       y1="0" y2={major ? 8 : 4}
                       stroke={INK} strokeWidth={major ? 0.8 : 0.4} />;
        })}
      </svg>
      <svg className="pf-caliper__rule pf-caliper__rule--left"
           viewBox="0 0 8 200" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 41 }).map((_, i) => {
          const y = i * 5;
          const major = i % 5 === 0;
          return <line key={i} y1={y} y2={y}
                       x1="8" x2={major ? 0 : 4}
                       stroke={INK} strokeWidth={major ? 0.8 : 0.4} />;
        })}
      </svg>
      <svg className="pf-caliper__rule pf-caliper__rule--right"
           viewBox="0 0 8 200" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 41 }).map((_, i) => {
          const y = i * 5;
          const major = i % 5 === 0;
          return <line key={i} y1={y} y2={y}
                       x1="0" x2={major ? 8 : 4}
                       stroke={INK} strokeWidth={major ? 0.8 : 0.4} />;
        })}
      </svg>
      {/* Brass screws at corners */}
      <span className="pf-caliper__screw pf-caliper__screw--tl" aria-hidden />
      <span className="pf-caliper__screw pf-caliper__screw--tr" aria-hidden />
      <span className="pf-caliper__screw pf-caliper__screw--bl" aria-hidden />
      <span className="pf-caliper__screw pf-caliper__screw--br" aria-hidden />
      <div className="pf-caliper__inner">{children}</div>
    </div>
  );
}

// ─── Stage indicators ─────────────────────────────────────────────
// 4 valves / filament tubes in a row — light up as the gen progresses
// through reading → morphing → rendering → settling.
interface StageIndicatorsProps {
  current: 'uploading' | 'morphing' | 'rendering' | 'settling' | '';
}
const STAGE_ORDER: Array<StageIndicatorsProps['current']> = [
  'uploading', 'morphing', 'rendering', 'settling',
];
const STAGE_LABEL: Record<string, string> = {
  uploading: 'INTAKE',
  morphing: 'ASSIGN',
  rendering: 'ETCH',
  settling: 'MOUNT',
};
export function StageIndicators({ current }: StageIndicatorsProps) {
  const ix = STAGE_ORDER.indexOf(current);
  return (
    <div className="pf-stages">
      {STAGE_ORDER.map((s, i) => {
        const state = i < ix ? 'done' : i === ix ? 'live' : 'pending';
        return (
          <div key={s} className={`pf-stages__valve pf-stages__valve--${state}`}>
            <svg viewBox="0 0 20 36" width="20" height="36" aria-hidden>
              {/* Filament tube — rounded glass cylinder */}
              <rect x="2" y="6" width="16" height="22" rx="8"
                    fill={PAPER} stroke={BRASS_DEEP} strokeWidth="1" />
              {/* Brass caps top/bottom */}
              <rect x="3" y="2" width="14" height="6" rx="1.5"
                    fill={BRASS} stroke={BRASS_DEEP} strokeWidth="0.6" />
              <rect x="3" y="28" width="14" height="6" rx="1.5"
                    fill={BRASS} stroke={BRASS_DEEP} strokeWidth="0.6" />
              {/* Filament line + glow disc when active */}
              <line x1="10" y1="9" x2="10" y2="25"
                    stroke={state === 'pending' ? BRASS_DEEP : SEAL}
                    strokeWidth={state === 'pending' ? 0.6 : 1.4}
                    opacity={state === 'pending' ? 0.4 : 0.85} />
              {state !== 'pending' && (
                <circle cx="10" cy="17" r="5"
                        fill={state === 'live' ? BRASS_GLOW : BRASS_HIGH}
                        opacity={state === 'live' ? 0.85 : 0.55} />
              )}
            </svg>
            <span className="pf-stages__label">{STAGE_LABEL[s]}</span>
          </div>
        );
      })}
    </div>
  );
}
