import type { ReactionKind } from '../types';

interface Props {
  kind: ReactionKind;
  size?: number;
}

export default function ReactionIcon({ kind, size = 14 }: Props) {
  const s = { width: size, height: size };
  switch (kind) {
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" {...s} fill="currentColor" aria-hidden>
          <path d="M12 21s-7-4.5-9.5-9C1 9 3 5 7 5c2.5 0 4 1.5 5 3 1-1.5 2.5-3 5-3 4 0 6 4 4.5 7-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      );
    case 'fire':
      return (
        <svg viewBox="0 0 24 24" {...s} fill="currentColor" aria-hidden>
          <path d="M12 2 C14 6 18 8 18 13 a6 6 0 0 1 -12 0 c0 -3 2 -5 3 -7 1 3 3 4 3 4 z" />
        </svg>
      );
    case 'mind':
      return (
        <svg viewBox="0 0 24 24" {...s} fill="currentColor" aria-hidden>
          <path d="M12 3 C16 3 19 6 19 10 c0 2 -1 4 -3 5 v2 H8 v-2 c-2 -1 -3 -3 -3 -5 c0 -4 3 -7 7 -7 z M9 19 h6 v2 H9 z" />
        </svg>
      );
    case 'eye':
      return (
        <svg viewBox="0 0 24 24" {...s} fill="currentColor" aria-hidden>
          <path d="M2 12 c4 -7 16 -7 20 0 c-4 7 -16 7 -20 0 z" />
          <circle cx="12" cy="12" r="3.5" fill="#fff" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );
  }
}
