// Vernier caliper SVG tool that "clamps" the specimen photo.
// Pure copperplate-etching ink linework, no color. One horizontal
// caliper across the top + one vertical caliper down the left, both
// with main beam, fixed jaw, sliding jaw + thumb screw.

import React from 'react';

const INK = '#261A0F';

// ─── Horizontal caliper (above the photo) ─────────────────────────
// SVG viewBox is 200×28. Width scales with container; height fixed.
// Beam runs across the top (y=2-9). Fixed jaw at the LEFT extreme
// hangs down. Sliding jaw near the RIGHT extreme also hangs down,
// inner face aligning with the photo's right edge.
function HorizontalCaliper() {
  return (
    <svg className="pf-caliper__beam pf-caliper__beam--h"
         viewBox="0 0 200 28" preserveAspectRatio="none" aria-hidden>
      {/* Main beam */}
      <rect x="0.5" y="2" width="199" height="7" fill="none"
            stroke={INK} strokeWidth="0.7" />
      {/* Beam ticks — every 4px = minor, every 20px = major */}
      {Array.from({ length: 51 }).map((_, i) => {
        const x = i * 4;
        const major = i % 5 === 0;
        return (
          <line key={i} x1={x} x2={x}
                y1="2" y2={major ? -1 : 0.5}
                stroke={INK} strokeWidth={major ? 0.7 : 0.4} />
        );
      })}
      {/* Numerals at majors */}
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((n) => (
        <text key={n} x={(n / 100) * 200} y="-2"
              fontFamily="'Cormorant Garamond', serif"
              fontSize="2.6" fill={INK} textAnchor="middle">{n}</text>
      ))}

      {/* Fixed jaw at far LEFT — hangs down */}
      <path d="M 0.5 9 L 0.5 26 L 6 26 L 6 14 L 9 14 L 9 9 Z"
            fill="#F4EBD7" stroke={INK} strokeWidth="0.7" />
      {/* Grip teeth on inner face of fixed jaw */}
      <line x1="6" y1="18" x2="9" y2="18" stroke={INK} strokeWidth="0.4" />
      <line x1="6" y1="22" x2="9" y2="22" stroke={INK} strokeWidth="0.4" />

      {/* Sliding jaw near RIGHT — hangs down. Sliding jaw is wider
          because it carries the vernier scale. */}
      <path d="M 184 9 L 184 26 L 199.5 26 L 199.5 9 Z"
            fill="#F4EBD7" stroke={INK} strokeWidth="0.7" />
      {/* Vernier ticks on the sliding jaw face */}
      {Array.from({ length: 11 }).map((_, i) => {
        const x = 184 + i * 1.55;
        return <line key={i} x1={x} x2={x} y1="9" y2="11"
                     stroke={INK} strokeWidth="0.4" />;
      })}
      {/* Inner face of sliding jaw — where it would touch the photo */}
      <line x1="184" y1="14" x2="187" y2="14" stroke={INK} strokeWidth="0.4" />
      <line x1="184" y1="18" x2="187" y2="18" stroke={INK} strokeWidth="0.4" />
      <line x1="184" y1="22" x2="187" y2="22" stroke={INK} strokeWidth="0.4" />
      {/* Thumb screw on top of sliding jaw */}
      <circle cx="192" cy="5.5" r="1.6" fill="#F4EBD7"
              stroke={INK} strokeWidth="0.5" />
      <line x1="190.6" y1="5" x2="193.4" y2="6"
            stroke={INK} strokeWidth="0.4" />
    </svg>
  );
}

// ─── Vertical caliper (along the left side of the photo) ──────────
// Mirror of the horizontal one rotated to be vertical. Main beam
// runs down the left edge; jaws point right.
function VerticalCaliper() {
  return (
    <svg className="pf-caliper__beam pf-caliper__beam--v"
         viewBox="0 0 28 200" preserveAspectRatio="none" aria-hidden>
      {/* Main beam */}
      <rect x="2" y="0.5" width="7" height="199" fill="none"
            stroke={INK} strokeWidth="0.7" />
      {/* Beam ticks */}
      {Array.from({ length: 51 }).map((_, i) => {
        const y = i * 4;
        const major = i % 5 === 0;
        return (
          <line key={i} y1={y} y2={y}
                x1="2" x2={major ? -1 : 0.5}
                stroke={INK} strokeWidth={major ? 0.7 : 0.4} />
        );
      })}

      {/* Fixed jaw at TOP — extends right */}
      <path d="M 9 0.5 L 26 0.5 L 26 6 L 14 6 L 14 9 L 9 9 Z"
            fill="#F4EBD7" stroke={INK} strokeWidth="0.7" />
      <line x1="18" y1="6" x2="18" y2="9" stroke={INK} strokeWidth="0.4" />
      <line x1="22" y1="6" x2="22" y2="9" stroke={INK} strokeWidth="0.4" />

      {/* Sliding jaw at BOTTOM */}
      <path d="M 9 184 L 26 184 L 26 199.5 L 9 199.5 Z"
            fill="#F4EBD7" stroke={INK} strokeWidth="0.7" />
      {/* Vernier ticks on sliding jaw face */}
      {Array.from({ length: 11 }).map((_, i) => {
        const y = 184 + i * 1.55;
        return <line key={i} y1={y} y2={y} x1="9" x2="11"
                     stroke={INK} strokeWidth="0.4" />;
      })}
      {/* Inner face teeth */}
      <line x1="14" y1="184" x2="14" y2="187" stroke={INK} strokeWidth="0.4" />
      <line x1="18" y1="184" x2="18" y2="187" stroke={INK} strokeWidth="0.4" />
      <line x1="22" y1="184" x2="22" y2="187" stroke={INK} strokeWidth="0.4" />
      {/* Thumb screw */}
      <circle cx="5.5" cy="192" r="1.6" fill="#F4EBD7"
              stroke={INK} strokeWidth="0.5" />
      <line x1="5" y1="190.6" x2="6" y2="193.4"
            stroke={INK} strokeWidth="0.4" />
    </svg>
  );
}

// ─── Caliper frame ─────────────────────────────────────────────────
// Photo is wrapped by two actual Vernier calipers: one across the top
// (measuring width) and one down the left (measuring height). Jaws
// visually grip the photo's corners.
export function CaliperFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pf-caliper">
      <HorizontalCaliper />
      <VerticalCaliper />
      <div className="pf-caliper__inner">{children}</div>
    </div>
  );
}
