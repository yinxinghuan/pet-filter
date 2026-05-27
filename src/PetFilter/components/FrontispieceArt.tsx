// Decorative SVG art for the frontispiece — laurel branches, wax-seal
// medallion, ribbon banner, knot floret, and corner ornaments. All in
// engraving line style (variable strokes, no fill except for the seal).

import React from 'react';

// ─── Laurel branch ────────────────────────────────────────────────────
// Curves UP+OUT from the bottom-anchor toward the top of the oval.
// Mirrored via the `side` prop. Uses currentColor for stroke.
export function LaurelBranch({ side = 'left' as 'left' | 'right' }: { side?: 'left' | 'right' }) {
  const flip = side === 'right' ? 'scale(-1, 1) translate(-100, 0)' : '';
  return (
    <svg viewBox="0 0 100 260" width={56} height={146}
         fill="none" stroke="currentColor"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g transform={flip}>
        {/* Main curving stem from bottom-right up to top-left */}
        <path d="M88 252 Q72 210 60 170 Q48 130 40 92 Q34 60 26 32 Q22 18 18 10"
              strokeWidth={1.2} />
        {/* Leaves — pairs along the stem, alternating sides */}
        <g strokeWidth={1.0}>
          {/* Outer leaves (to the left, away from oval) */}
          <path d="M82 240 Q66 240 60 230 Q60 222 70 222 Q80 226 82 240 Z" fill="currentColor" fillOpacity={0.55} />
          <path d="M73 220 Q60 222 54 212 Q56 204 65 204 Q74 208 73 220 Z" fill="currentColor" fillOpacity={0.5} />
          <path d="M64 200 Q52 204 48 192 Q52 184 60 186 Q66 192 64 200 Z" fill="currentColor" fillOpacity={0.55} />
          <path d="M56 180 Q44 184 42 174 Q46 166 53 168 Q58 174 56 180 Z" fill="currentColor" fillOpacity={0.5} />
          <path d="M50 158 Q40 162 38 152 Q42 144 49 146 Q53 152 50 158 Z" fill="currentColor" fillOpacity={0.55} />
          <path d="M44 138 Q34 142 32 132 Q36 124 43 126 Q47 132 44 138 Z" fill="currentColor" fillOpacity={0.5} />
          <path d="M38 116 Q28 120 26 110 Q30 102 37 104 Q41 110 38 116 Z" fill="currentColor" fillOpacity={0.55} />
          <path d="M32 94 Q24 98 22 88 Q26 82 33 84 Q36 90 32 94 Z" fill="currentColor" fillOpacity={0.5} />
          <path d="M28 74 Q20 78 18 68 Q22 62 29 64 Q33 70 28 74 Z" fill="currentColor" fillOpacity={0.55} />
          <path d="M24 54 Q16 58 14 48 Q18 42 25 44 Q29 50 24 54 Z" fill="currentColor" fillOpacity={0.5} />
          <path d="M22 36 Q14 40 12 30 Q16 24 23 26 Q27 32 22 36 Z" fill="currentColor" fillOpacity={0.55} />
          {/* Inner leaves (to the right, toward the oval) — smaller */}
          <path d="M96 244 Q104 240 102 232 Q94 230 90 238 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M84 224 Q92 220 90 212 Q82 210 78 218 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M74 202 Q82 198 80 190 Q72 188 68 196 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M66 180 Q74 176 72 168 Q64 166 60 174 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M58 158 Q66 154 64 146 Q56 144 52 152 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M52 136 Q60 132 58 124 Q50 122 46 130 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M46 114 Q54 110 52 102 Q44 100 40 108 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M40 92 Q48 88 46 80 Q38 78 34 86 Z" fill="currentColor" fillOpacity={0.45} />
          <path d="M34 70 Q42 66 40 58 Q32 56 28 64 Z" fill="currentColor" fillOpacity={0.45} />
        </g>
      </g>
    </svg>
  );
}

// ─── Wax-seal medallion (the SINGLE color accent in the page) ─────────
export function WaxSeal({ size = 56 }: { size?: number }) {
  // Scalloped rim is approximated with a daisy of small circles around
  // a slightly larger filled circle, all rendered in seal-crimson.
  const radius = size / 2;
  const inner = radius * 0.72;
  const scallops = 18;
  const scallops_r = radius * 0.085;
  const scallop_dist = radius - scallops_r * 0.6;
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < scallops; i++) {
    const a = (i / scallops) * 2 * Math.PI;
    dots.push(
      <circle key={i}
              cx={radius + scallop_dist * Math.cos(a)}
              cy={radius + scallop_dist * Math.sin(a)}
              r={scallops_r}
              fill="currentColor" />
    );
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
         aria-hidden style={{ color: '#8A2E22' }}>
      {/* Outer scalloped rim */}
      {dots}
      {/* Solid disc */}
      <circle cx={radius} cy={radius} r={radius * 0.92}
              fill="currentColor" />
      {/* Subtle inner highlight ring */}
      <circle cx={radius} cy={radius} r={inner}
              fill="none" stroke="rgba(255,224,210,0.30)" strokeWidth={0.8} />
      {/* Letterforms ("AN" "MMXXVI") — two stacked, centered. */}
      <g fill="#F3D9CF">
        <text x={radius} y={radius - 2}
              fontFamily="'Cormorant Garamond', serif"
              fontSize={size * 0.18}
              fontStyle="italic"
              textAnchor="middle"
              dominantBaseline="central">an</text>
        <text x={radius} y={radius + size * 0.16}
              fontFamily="'Cormorant Garamond', serif"
              fontSize={size * 0.16}
              fontWeight={600}
              letterSpacing="0.08em"
              textAnchor="middle"
              dominantBaseline="central">MMXXVI</text>
      </g>
      {/* Bite marks suggesting the seal was pressed */}
      <path d={`M ${radius * 0.7} ${radius * 0.55} Q ${radius * 0.9} ${radius * 0.5} ${radius * 1.1} ${radius * 0.6}`}
            fill="none" stroke="rgba(255,224,210,0.20)" strokeWidth={0.8} />
    </svg>
  );
}

// ─── Ribbon banner ────────────────────────────────────────────────────
// Stretched banner shape with two notched tails. Hangs above the oval.
export function RibbonBanner({ text = 'VOL · I', width = 140, height = 28 }:
  { text?: string; width?: number; height?: number }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}
         fill="none" stroke="currentColor" aria-hidden>
      {/* Center panel */}
      <path d={`M ${width * 0.20} 2
               L ${width * 0.80} 2
               L ${width * 0.86} ${height * 0.5}
               L ${width * 0.80} ${height - 4}
               L ${width * 0.20} ${height - 4}
               L ${width * 0.14} ${height * 0.5} Z`}
            strokeWidth={1} fill="rgba(255,255,255,0.10)" />
      {/* Left tail */}
      <path d={`M ${width * 0.14} ${height * 0.5}
               L 2 ${height * 0.18}
               L 2 ${height * 0.82} Z`}
            strokeWidth={1} fill="rgba(255,255,255,0.06)" />
      {/* Right tail */}
      <path d={`M ${width * 0.86} ${height * 0.5}
               L ${width - 2} ${height * 0.18}
               L ${width - 2} ${height * 0.82} Z`}
            strokeWidth={1} fill="rgba(255,255,255,0.06)" />
      {/* Tail notches (V cut into ends) */}
      <path d={`M 2 ${height * 0.18} L 12 ${height * 0.50} L 2 ${height * 0.82}`}
            strokeWidth={1} />
      <path d={`M ${width - 2} ${height * 0.18} L ${width - 12} ${height * 0.50} L ${width - 2} ${height * 0.82}`}
            strokeWidth={1} />
      {/* Text */}
      <text x={width / 2} y={height / 2 + 1}
            fontFamily="'Cormorant Garamond', serif"
            fontSize={height * 0.46}
            fontStyle="italic"
            fontWeight={600}
            fill="currentColor"
            stroke="none"
            letterSpacing="0.14em"
            textAnchor="middle"
            dominantBaseline="central">
        {text}
      </text>
    </svg>
  );
}

// ─── Knot floret ──────────────────────────────────────────────────────
// Small decorative knot/rosette under the oval where the laurel
// branches "join."
export function KnotFloret({ size = 32 }: { size?: number }) {
  const r = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
         fill="none" stroke="currentColor"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* Four-petal flower */}
      <g strokeWidth={1}>
        <path d={`M ${r} ${r * 0.2} Q ${r * 1.4} ${r} ${r} ${r * 1.8} Q ${r * 0.6} ${r} ${r} ${r * 0.2}`} />
        <path d={`M ${r * 0.2} ${r} Q ${r} ${r * 1.4} ${r * 1.8} ${r} Q ${r} ${r * 0.6} ${r * 0.2} ${r}`} />
      </g>
      <circle cx={r} cy={r} r={2} fill="currentColor" />
      {/* Side flourishes (small dashes) */}
      <g strokeWidth={0.7}>
        <line x1={r - 14} y1={r} x2={r - 8} y2={r} />
        <line x1={r + 8} y1={r} x2={r + 14} y2={r} />
        <line x1={r - 12} y1={r - 2} x2={r - 10} y2={r - 4} />
        <line x1={r + 10} y1={r - 4} x2={r + 12} y2={r - 2} />
      </g>
    </svg>
  );
}

// ─── Corner ornament ──────────────────────────────────────────────────
// Small floral/scroll motif for the title-block corners. `flip` lets
// callers mirror H or V.
export function CornerOrnament({ size = 32, flipH = false, flipV = false }:
  { size?: number; flipH?: boolean; flipV?: boolean }) {
  const transform = `translate(${flipH ? size : 0}, ${flipV ? size : 0}) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
         fill="none" stroke="currentColor"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g transform={transform} strokeWidth={0.9}>
        {/* A small scroll + leaf curl */}
        <path d="M2 2 Q14 2 14 14 Q14 26 2 26" />
        <path d="M2 2 L26 2" />
        <path d="M2 14 Q8 10 10 18" />
        <circle cx="16" cy="16" r="1.4" fill="currentColor" />
        <path d="M22 6 Q26 6 26 10" />
      </g>
    </svg>
  );
}
