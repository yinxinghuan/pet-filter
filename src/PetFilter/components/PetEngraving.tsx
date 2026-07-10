// Engraving-style pet portraits. Each in a 80×80 viewBox, designed to
// sit inside an oval cartouche on the picker tile. Aesthetic notes:
//  - Variable stroke widths (0.5 → 1.6) for hierarchy
//  - Cross-hatching in shadow areas (stroke="currentColor", strokeOpacity=0.5)
//  - Stipple dots (small fills) for tonal grain
//  - More anatomy than the prior line icons
//
// Color comes from `currentColor` so the cartouche tint flows in.

import React from 'react';

interface Props {
  id: string;
  size?: number;
}

export default function PetEngraving({ id, size = 64 }: Props) {
  const Cmp = ENGRAVINGS[id] ?? BotanicalFallbackEng;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size}
         fill="none" stroke="currentColor"
         strokeLinecap="round" strokeLinejoin="round"
         aria-hidden>
      <Cmp />
    </svg>
  );
}

function BotanicalFallbackEng() {
  return (
    <>
      <circle cx="40" cy="42" r="18" strokeWidth={1.2} />
      <path d="M40 24 C34 16 28 12 22 12 C22 22 28 28 40 32" strokeWidth={1.1} />
      <path d="M40 24 C46 16 52 12 58 12 C58 22 52 28 40 32" strokeWidth={1.1} />
      <path d="M24 46 C30 38 50 38 56 46" strokeWidth={0.8} strokeOpacity={0.55} />
      <path d="M32 54 C36 57 44 57 48 54" strokeWidth={0.8} strokeOpacity={0.55} />
      <circle cx="33" cy="39" r="1.6" fill="currentColor" />
      <circle cx="47" cy="39" r="1.6" fill="currentColor" />
      <path d="M40 44 C37 45 37 48 40 49 C43 48 43 45 40 44" strokeWidth={0.7} />
      <path d="M18 58 C24 50 32 48 40 58 C48 48 56 50 62 58" strokeWidth={1} />
      <g fill="currentColor" fillOpacity={0.45}>
        <circle cx="29" cy="25" r="1" />
        <circle cx="51" cy="25" r="1" />
        <circle cx="40" cy="19" r="1" />
      </g>
    </>
  );
}

// Reusable hatch group — short parallel lines for cross-hatching.
function Hatch({ x, y, w, h, angle = 35, gap = 1.8, opacity = 0.40 }:
  { x: number; y: number; w: number; h: number; angle?: number; gap?: number; opacity?: number }) {
  const lines: React.ReactElement[] = [];
  // Render parallel lines clipped to a box by inscribing the (x,y,w,h) and
  // letting the SVG group's clip-path mask. For simplicity we'll just
  // draw lines clipped via a rect clip.
  const id = `h-${x}-${y}-${w}-${h}`.replace(/\./g, '_');
  // Generate enough lines to cover the diagonal extent.
  const max = Math.ceil((w + h) / gap);
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  // Start lines along the top-left edge of the box.
  for (let i = -max; i <= max; i++) {
    const cx = x + w / 2 + i * gap * dy;
    const cy = y + h / 2 - i * gap * dx;
    const r = Math.max(w, h);
    const x1 = cx - r * dx;
    const y1 = cy - r * dy;
    const x2 = cx + r * dx;
    const y2 = cy + r * dy;
    lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                     strokeWidth={0.35} strokeOpacity={opacity} />);
  }
  return (
    <g clipPath={`url(#${id})`}>
      <defs>
        <clipPath id={id}><rect x={x} y={y} width={w} height={h} /></clipPath>
      </defs>
      {lines}
    </g>
  );
}

// Stipple dots — random-looking but deterministic.
function Stipple({ points, r = 0.5, opacity = 0.55 }:
  { points: [number, number][]; r?: number; opacity?: number }) {
  return (
    <g>
      {points.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
                fill="currentColor" stroke="none" fillOpacity={opacity} />
      ))}
    </g>
  );
}

// ─── Cat ───────────────────────────────────────────────────────────────
function CatEng() {
  return (
    <>
      {/* Head outline */}
      <path d="M14 38 Q12 22 22 16 L26 24 Q40 18 54 24 L58 16 Q68 22 66 38 Q64 58 50 64 Q40 67 30 64 Q16 58 14 38 Z"
            strokeWidth={1.4} />
      {/* Ears inner detail */}
      <path d="M20 22 L24 30 M60 22 L56 30" strokeWidth={0.7} />
      {/* Eyes — almond */}
      <path d="M28 38 Q32 35 36 38 Q32 41 28 38 Z" fill="currentColor" strokeWidth={0.5} />
      <path d="M44 38 Q48 35 52 38 Q48 41 44 38 Z" fill="currentColor" strokeWidth={0.5} />
      {/* Pupil slits */}
      <line x1="32" y1="36.6" x2="32" y2="39.4" strokeWidth={0.5} />
      <line x1="48" y1="36.6" x2="48" y2="39.4" strokeWidth={0.5} />
      {/* Nose */}
      <path d="M37 46 L40 49 L43 46 Z" fill="currentColor" strokeWidth={0.4} />
      {/* Mouth */}
      <path d="M40 49 L40 52 M40 52 Q36 56 32 53 M40 52 Q44 56 48 53" strokeWidth={0.7} />
      {/* Whiskers */}
      <path d="M20 50 L32 51 M22 54 L32 53 M48 51 L60 50 M48 53 L58 54" strokeWidth={0.4} strokeOpacity={0.6} />
      {/* Cross-hatching on right cheek */}
      <Hatch x={52} y={42} w={10} h={14} angle={45} gap={1.4} opacity={0.30} />
      <Hatch x={52} y={42} w={10} h={14} angle={-45} gap={2.2} opacity={0.22} />
      {/* Stipple on forehead and cheek */}
      <Stipple points={[[28,28],[32,26],[36,28],[40,25],[44,27],[48,26],[52,28],[26,32]]} r={0.45} opacity={0.40} />
    </>
  );
}

// ─── Dog ───────────────────────────────────────────────────────────────
function DogEng() {
  return (
    <>
      {/* Floppy ears */}
      <path d="M16 22 Q12 16 16 14 Q22 14 22 22 L20 38 Q18 32 16 22 Z" strokeWidth={1.2} />
      <path d="M64 22 Q68 16 64 14 Q58 14 58 22 L60 38 Q62 32 64 22 Z" strokeWidth={1.2} />
      {/* Head */}
      <path d="M18 32 Q22 18 40 18 Q58 18 62 32 Q64 50 50 60 Q40 64 30 60 Q16 50 18 32 Z" strokeWidth={1.4} />
      {/* Snout */}
      <path d="M30 50 Q40 56 50 50 L48 60 Q40 64 32 60 Z" strokeWidth={1.0} />
      {/* Eyes */}
      <circle cx="32" cy="38" r="2" fill="currentColor" strokeWidth={0.4} />
      <circle cx="48" cy="38" r="2" fill="currentColor" strokeWidth={0.4} />
      <circle cx="32.6" cy="37.4" r="0.5" fill="#fff" stroke="none" />
      <circle cx="48.6" cy="37.4" r="0.5" fill="#fff" stroke="none" />
      {/* Nose */}
      <ellipse cx="40" cy="52" rx="3" ry="2" fill="currentColor" strokeWidth={0.4} />
      {/* Mouth */}
      <path d="M40 54 L40 58 M40 58 Q36 60 34 58 M40 58 Q44 60 46 58" strokeWidth={0.7} />
      {/* Tongue */}
      <path d="M38 58 Q40 62 42 58 Z" strokeWidth={0.5} strokeOpacity={0.6} />
      {/* Shading */}
      <Hatch x={18} y={30} w={12} h={18} angle={45} gap={1.6} opacity={0.30} />
      <Hatch x={50} y={30} w={12} h={18} angle={-45} gap={1.6} opacity={0.30} />
      <Stipple points={[[26,26],[30,24],[34,22],[40,22],[46,22],[50,24],[54,26]]} r={0.45} opacity={0.40} />
    </>
  );
}

// ─── Hamster ──────────────────────────────────────────────────────────
function HamsterEng() {
  return (
    <>
      {/* Round body */}
      <circle cx="40" cy="44" r="22" strokeWidth={1.4} />
      {/* Ears */}
      <circle cx="24" cy="28" r="6" strokeWidth={1.0} />
      <circle cx="56" cy="28" r="6" strokeWidth={1.0} />
      <circle cx="24" cy="28" r="3" strokeWidth={0.6} />
      <circle cx="56" cy="28" r="3" strokeWidth={0.6} />
      {/* Cheek pouches (puffy) */}
      <path d="M20 46 Q14 50 22 56" strokeWidth={0.7} />
      <path d="M60 46 Q66 50 58 56" strokeWidth={0.7} />
      {/* Eyes */}
      <circle cx="32" cy="42" r="2" fill="currentColor" />
      <circle cx="48" cy="42" r="2" fill="currentColor" />
      <circle cx="32.5" cy="41.4" r="0.5" fill="#fff" stroke="none" />
      <circle cx="48.5" cy="41.4" r="0.5" fill="#fff" stroke="none" />
      {/* Nose + mouth */}
      <ellipse cx="40" cy="50" rx="1.4" ry="1" fill="currentColor" strokeWidth={0.3} />
      <path d="M40 51 L40 53 M40 53 Q37 55 36 53 M40 53 Q43 55 44 53" strokeWidth={0.5} />
      {/* Whiskers */}
      <path d="M22 50 L32 51 M22 53 L32 52 M48 51 L58 50 M48 52 L58 53" strokeWidth={0.3} strokeOpacity={0.6} />
      {/* Fur texture — stipple */}
      <Stipple points={[
        [30,30],[34,30],[38,30],[42,30],[46,30],[50,30],
        [28,34],[32,34],[36,34],[44,34],[48,34],[52,34],
        [26,58],[30,60],[34,62],[40,62],[46,62],[50,60],[54,58],
      ]} r={0.4} opacity={0.45} />
      <Hatch x={50} y={42} w={14} h={18} angle={45} gap={1.6} opacity={0.22} />
    </>
  );
}

// ─── Duck ─────────────────────────────────────────────────────────────
function DuckEng() {
  return (
    <>
      {/* Body */}
      <ellipse cx="32" cy="48" rx="22" ry="14" strokeWidth={1.4} />
      {/* Head */}
      <circle cx="52" cy="32" r="12" strokeWidth={1.2} />
      {/* Bill */}
      <path d="M58 30 L72 32 L58 34 Z" strokeWidth={1.0} fill="currentColor" fillOpacity={0.10} />
      <line x1="60" y1="32" x2="70" y2="32" strokeWidth={0.5} />
      {/* Eye */}
      <circle cx="50" cy="30" r="1.5" fill="currentColor" />
      <circle cx="50.4" cy="29.6" r="0.5" fill="#fff" stroke="none" />
      {/* Tail */}
      <path d="M12 44 Q8 42 10 48 Q14 50 16 46" strokeWidth={0.9} />
      {/* Feather lines */}
      <path d="M18 50 Q26 56 38 56 Q48 58 52 54" strokeWidth={0.6} />
      <path d="M20 54 Q28 60 40 60" strokeWidth={0.5} strokeOpacity={0.7} />
      <path d="M22 48 Q28 52 36 52" strokeWidth={0.5} strokeOpacity={0.7} />
      <Hatch x={14} y={48} w={18} h={12} angle={20} gap={1.4} opacity={0.30} />
      <Hatch x={32} y={50} w={20} h={10} angle={-15} gap={1.6} opacity={0.22} />
      <Stipple points={[[44,26],[48,24],[54,24],[58,26]]} r={0.4} opacity={0.40} />
    </>
  );
}

// ─── Capybara ─────────────────────────────────────────────────────────
function CapyEng() {
  return (
    <>
      {/* Big rounded body */}
      <path d="M10 48 Q10 30 28 26 Q42 22 56 28 Q72 32 70 48 Q68 60 58 64 L20 64 Q12 60 10 48 Z" strokeWidth={1.4} />
      {/* Small ears */}
      <ellipse cx="22" cy="24" rx="3" ry="2.5" strokeWidth={0.8} />
      <ellipse cx="52" cy="22" rx="3" ry="2.5" strokeWidth={0.8} />
      {/* Tiny eyes — sleepy */}
      <path d="M28 36 L34 36" strokeWidth={1.2} />
      <path d="M48 36 L54 36" strokeWidth={1.2} />
      <line x1="29" y1="34" x2="33" y2="36" strokeWidth={0.4} strokeOpacity={0.6} />
      {/* Blunt snout */}
      <path d="M10 50 Q4 52 8 56 L18 58 Q24 56 22 50" strokeWidth={1.0} />
      <circle cx="10" cy="53" r="1" fill="currentColor" />
      {/* Smile */}
      <path d="M12 56 Q16 58 20 56" strokeWidth={0.7} />
      {/* Coarse fur — hatching dense across the back */}
      <Hatch x={30} y={28} w={36} h={26} angle={-65} gap={1.4} opacity={0.30} />
      <Hatch x={30} y={28} w={36} h={26} angle={25} gap={2.4} opacity={0.20} />
      <Stipple points={[
        [36,32],[42,32],[48,30],[54,32],[60,34],
        [34,42],[40,44],[48,46],[56,46],
      ]} r={0.45} opacity={0.45} />
    </>
  );
}

// ─── Sloth ────────────────────────────────────────────────────────────
function SlothEng() {
  return (
    <>
      {/* Round face */}
      <circle cx="40" cy="40" r="22" strokeWidth={1.4} />
      {/* Large dark eye-patches */}
      <ellipse cx="30" cy="38" rx="6" ry="5" strokeWidth={0.8} />
      <ellipse cx="50" cy="38" rx="6" ry="5" strokeWidth={0.8} />
      <Hatch x={24} y={33} w={12} h={10} angle={45} gap={1.0} opacity={0.55} />
      <Hatch x={44} y={33} w={12} h={10} angle={-45} gap={1.0} opacity={0.55} />
      {/* Eyes */}
      <circle cx="30" cy="38" r="1.6" fill="currentColor" />
      <circle cx="50" cy="38" r="1.6" fill="currentColor" />
      <circle cx="30.4" cy="37.4" r="0.5" fill="#fff" stroke="none" />
      <circle cx="50.4" cy="37.4" r="0.5" fill="#fff" stroke="none" />
      {/* Tiny nose triangle */}
      <path d="M38 48 L40 50 L42 48 Z" fill="currentColor" />
      {/* Slow smile */}
      <path d="M34 54 Q40 58 46 54" strokeWidth={1.0} />
      {/* Shaggy fur outline */}
      <path d="M22 22 Q24 19 26 22 M30 18 Q32 15 34 18 M40 16 Q42 13 44 16 M50 18 Q52 15 54 18 M58 22 Q60 19 62 22"
            strokeWidth={0.7} />
      <path d="M20 56 Q22 60 24 56 M28 60 Q30 64 32 60 M48 60 Q50 64 52 60 M56 56 Q58 60 60 56"
            strokeWidth={0.7} />
      <Stipple points={[[40,20],[36,24],[44,24],[48,28],[32,28],[40,30]]} r={0.4} opacity={0.45} />
    </>
  );
}

// ─── Scarlet Macaw ────────────────────────────────────────────────────
function MacawEng() {
  return (
    <>
      {/* Body / wing arc */}
      <path d="M22 64 Q14 38 24 22 Q38 12 52 18 Q66 28 64 46 Q60 60 50 64 Z" strokeWidth={1.4} />
      {/* Beak — large hook */}
      <path d="M22 32 L10 36 L20 40 Z" strokeWidth={1.0} fill="currentColor" fillOpacity={0.10} />
      <path d="M16 36 Q14 38 14 40" strokeWidth={0.7} />
      {/* Eye with white ring */}
      <circle cx="32" cy="28" r="3.5" strokeWidth={0.6} />
      <circle cx="32" cy="28" r="1.6" fill="currentColor" />
      <circle cx="32.4" cy="27.4" r="0.5" fill="#fff" stroke="none" />
      {/* Wing feathers */}
      <path d="M30 36 L60 30 M30 42 L62 38 M32 48 L60 46 M34 54 L56 54 M38 60 L52 60"
            strokeWidth={0.7} strokeOpacity={0.7} />
      {/* Head crown */}
      <path d="M28 16 Q32 12 36 16" strokeWidth={0.6} />
      {/* Tail */}
      <path d="M46 64 L52 76 M50 64 L56 74 M54 64 L58 72" strokeWidth={1.0} />
      <Hatch x={36} y={36} w={26} h={22} angle={20} gap={1.4} opacity={0.30} />
      <Stipple points={[[40,22],[48,22],[52,24],[44,26],[56,32]]} r={0.4} opacity={0.45} />
    </>
  );
}

// ─── Axolotl ──────────────────────────────────────────────────────────
function AxolotlEng() {
  return (
    <>
      {/* Body */}
      <ellipse cx="40" cy="48" rx="22" ry="11" strokeWidth={1.4} />
      {/* Gill fronds (one set per side, feathery) */}
      <g strokeWidth={0.7}>
        <path d="M18 38 Q12 34 14 30 M16 40 Q8 38 8 32 M18 42 Q10 44 6 38 M20 44 Q14 48 10 46" />
        <path d="M62 38 Q68 34 66 30 M64 40 Q72 38 72 32 M62 42 Q70 44 74 38 M60 44 Q66 48 70 46" />
      </g>
      {/* Eyes — tiny dots */}
      <circle cx="30" cy="44" r="1.2" fill="currentColor" />
      <circle cx="50" cy="44" r="1.2" fill="currentColor" />
      {/* Perpetual smile */}
      <path d="M32 52 Q40 56 48 52" strokeWidth={1.0} />
      {/* Mouth crease */}
      <path d="M40 52 L40 50" strokeWidth={0.5} />
      {/* Water ripples below */}
      <path d="M20 62 Q26 65 32 62 Q40 65 48 62 Q54 65 60 62" strokeWidth={0.5} strokeOpacity={0.6} />
      <path d="M18 68 Q26 70 34 68 Q42 70 50 68 Q58 70 62 68" strokeWidth={0.5} strokeOpacity={0.4} />
      {/* Stipple — wet shine on body */}
      <Stipple points={[[26,46],[34,46],[42,44],[48,46],[54,46]]} r={0.35} opacity={0.55} />
      <Hatch x={22} y={48} w={36} h={10} angle={-15} gap={2.0} opacity={0.20} />
    </>
  );
}

// ─── Hedgehog ─────────────────────────────────────────────────────────
function HedgehogEng() {
  return (
    <>
      {/* Spine ridge — sharp zigzag fur */}
      <path d="M8 42 L14 26 L18 36 L22 22 L26 36 L30 20 L34 34 L38 18 L42 32 L46 18 L50 32 L54 22 L58 34 L62 24 L66 38 L72 30 Q74 50 56 56 Q34 60 22 56 Q10 52 8 42 Z"
            strokeWidth={1.4} />
      {/* Face — bottom right, small */}
      <ellipse cx="64" cy="44" rx="10" ry="9" strokeWidth={0.9} />
      <circle cx="62" cy="44" r="1.5" fill="currentColor" />
      <circle cx="62.4" cy="43.4" r="0.4" fill="#fff" stroke="none" />
      <ellipse cx="70" cy="48" rx="1.4" ry="1" fill="currentColor" />
      <path d="M70 49 Q66 52 64 49" strokeWidth={0.6} />
      {/* Many small hatches inside spines for texture */}
      <Hatch x={10} y={32} w={50} h={20} angle={-70} gap={1.0} opacity={0.30} />
      <Stipple points={[
        [14,40],[20,42],[26,42],[32,42],[38,42],[44,42],[50,42],[56,42],
        [16,48],[22,50],[28,50],[34,50],[40,50],[46,50],[52,50],
      ]} r={0.4} opacity={0.50} />
    </>
  );
}

// ─── Giant Clam ───────────────────────────────────────────────────────
function ClamEng() {
  return (
    <>
      {/* Top shell half */}
      <path d="M6 36 Q40 12 74 36 L40 42 Z" strokeWidth={1.4} />
      {/* Bottom shell half */}
      <path d="M6 36 Q40 60 74 36" strokeWidth={1.4} />
      {/* Hinge dot */}
      <circle cx="40" cy="36" r="1" fill="currentColor" />
      {/* Mantle ridges inside */}
      <path d="M16 38 Q40 50 64 38" strokeWidth={0.7} strokeOpacity={0.7} />
      {/* Ribs running radially on the shell */}
      <g strokeWidth={0.7}>
        <path d="M14 32 L18 34" /> <path d="M22 26 L24 32" /> <path d="M30 22 L31 30" />
        <path d="M40 20 L40 30" /> <path d="M50 22 L49 30" /> <path d="M58 26 L56 32" />
        <path d="M66 32 L62 34" />
      </g>
      {/* Eye-spots along the mantle edge — alien feel */}
      <g fill="currentColor">
        <circle cx="14" cy="40" r="0.7" />
        <circle cx="22" cy="42" r="0.7" />
        <circle cx="30" cy="43" r="0.7" />
        <circle cx="40" cy="43.5" r="0.7" />
        <circle cx="50" cy="43" r="0.7" />
        <circle cx="58" cy="42" r="0.7" />
        <circle cx="66" cy="40" r="0.7" />
      </g>
      {/* Hatching on shell halves */}
      <Hatch x={10} y={20} w={60} h={14} angle={60} gap={1.4} opacity={0.30} />
      <Hatch x={10} y={40} w={60} h={14} angle={-60} gap={1.4} opacity={0.30} />
    </>
  );
}

// ─── Common Octopus ──────────────────────────────────────────────────
function OctopusEng() {
  return (
    <>
      {/* Bulbous mantle / head */}
      <path d="M14 32 Q14 12 40 12 Q66 12 66 32 Q66 42 60 46 L20 46 Q14 42 14 32 Z" strokeWidth={1.4} />
      {/* Tentacles — eight curling */}
      <g strokeWidth={1.0}>
        <path d="M16 46 Q12 56 6 60 Q4 64 8 66" />
        <path d="M22 48 Q18 60 14 70" />
        <path d="M30 48 Q26 60 30 72" />
        <path d="M38 48 Q36 62 40 74" />
        <path d="M46 48 Q48 62 44 74" />
        <path d="M54 48 Q58 60 56 70" />
        <path d="M60 48 Q66 58 70 64" />
        <path d="M64 46 Q72 54 74 60" />
      </g>
      {/* Suckers — small circles on a few tentacles */}
      <g strokeWidth={0.4}>
        <circle cx="14" cy="58" r="0.7" /> <circle cx="12" cy="62" r="0.7" />
        <circle cx="26" cy="58" r="0.7" /> <circle cx="22" cy="64" r="0.7" />
        <circle cx="38" cy="60" r="0.7" /> <circle cx="40" cy="66" r="0.7" />
        <circle cx="52" cy="60" r="0.7" /> <circle cx="58" cy="58" r="0.7" />
        <circle cx="68" cy="58" r="0.7" />
      </g>
      {/* Slit-pupil eyes */}
      <ellipse cx="28" cy="28" rx="4" ry="2.6" strokeWidth={0.7} />
      <ellipse cx="52" cy="28" rx="4" ry="2.6" strokeWidth={0.7} />
      <rect x="26" y="27.4" width="4" height="1.4" fill="currentColor" rx={0.5} />
      <rect x="50" y="27.4" width="4" height="1.4" fill="currentColor" rx={0.5} />
      {/* Mantle chromatophore stippling */}
      <Stipple points={[
        [22,22],[30,22],[40,20],[50,22],[58,22],
        [20,32],[34,32],[46,32],[58,32],
        [26,40],[40,40],[54,40],
      ]} r={0.5} opacity={0.50} />
      <Hatch x={14} y={36} w={52} h={12} angle={20} gap={1.6} opacity={0.18} />
    </>
  );
}

// ─── Garden Snail ────────────────────────────────────────────────────
function SnailEng() {
  return (
    <>
      {/* Spiral shell — concentric arcs */}
      <g strokeWidth={1.0}>
        <circle cx="30" cy="32" r="16" />
        <circle cx="30" cy="32" r="11" />
        <circle cx="30" cy="32" r="7" />
        <circle cx="30" cy="32" r="3.5" />
        <circle cx="30" cy="32" r="1.2" fill="currentColor" />
      </g>
      {/* Body — long curving foot */}
      <path d="M44 38 Q60 38 62 52 L14 52 Q12 46 18 44" strokeWidth={1.4} />
      {/* Eye-stalks (extended) */}
      <line x1="60" y1="38" x2="68" y2="24" strokeWidth={0.9} />
      <line x1="64" y1="38" x2="72" y2="24" strokeWidth={0.9} />
      <circle cx="68" cy="24" r="1.5" fill="currentColor" />
      <circle cx="72" cy="24" r="1.5" fill="currentColor" />
      {/* Mouth */}
      <path d="M60 46 Q62 48 64 46" strokeWidth={0.5} />
      {/* Foot underside */}
      <path d="M16 56 Q40 58 60 56" strokeWidth={0.6} strokeOpacity={0.6} />
      {/* Slime trail dots */}
      <g fill="currentColor" fillOpacity={0.4}>
        <circle cx="10" cy="58" r="0.5" />
        <circle cx="14" cy="60" r="0.5" />
        <circle cx="20" cy="60" r="0.5" />
      </g>
      {/* Shell hatching for shadow on lower half */}
      <Hatch x={30} y={32} w={16} h={16} angle={-30} gap={1.4} opacity={0.30} />
      <Hatch x={14} y={46} w={48} h={8} angle={10} gap={1.6} opacity={0.20} />
    </>
  );
}

const ENGRAVINGS: Record<string, React.ComponentType> = {
  cat: CatEng,
  dog: DogEng,
  hamster: HamsterEng,
  duck: DuckEng,
  capybara: CapyEng,
  sloth: SlothEng,
  parrot: MacawEng,
  axolotl: AxolotlEng,
  hedgehog: HedgehogEng,
  clam: ClamEng,
  octopus: OctopusEng,
  snail: SnailEng,
};
