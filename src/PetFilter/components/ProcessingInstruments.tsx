// Monochrome copperplate-etching instruments for the Processing
// screen. Single-color ink linework on cream paper — no brass, no
// color accents.

import React from 'react';

const INK = '#261A0F';

// ─── Caliper frame ─────────────────────────────────────────────────
// Wraps the specimen photo. Provides ruler-tick marks on all 4 edges
// like a 19c micrometer viewfinder. Pure ink linework, no metallic
// effects.
export function CaliperFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pf-caliper">
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
      <div className="pf-caliper__inner">{children}</div>
    </div>
  );
}
