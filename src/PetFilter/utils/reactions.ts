// Procedural counts when off-platform; aggregate event names when on.

import type { ReactionKind } from '../types';

export function reactionAggregateEvent(shotId: string): string {
  return `react:${shotId}`;
}

export function reactionKindEvent(shotId: string, kind: ReactionKind): string {
  return `react:${shotId}:${kind}`;
}

// djb2-ish stable hash → small positive count.
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i);
  return Math.abs(h);
}

const KIND_SKEW: Record<ReactionKind, number> = {
  heart: 1.6,
  fire: 2.4,
  mind: 3.0,
  eye: 3.4,
};

export function fallbackCount(shotId: string, kind: ReactionKind, mine: Set<ReactionKind>): number {
  const base = (hash(shotId + ':' + kind) % 17) / KIND_SKEW[kind];
  return Math.max(0, Math.floor(base) + (mine.has(kind) ? 1 : 0));
}

export function fallbackTotal(shotId: string, mine: Set<ReactionKind>): number {
  let total = 0;
  (['heart', 'fire', 'mind', 'eye'] as ReactionKind[]).forEach((k) => {
    total += fallbackCount(shotId, k, mine);
  });
  return total;
}

export function dominantReaction(shotId: string, mine: Set<ReactionKind>): ReactionKind {
  let best: ReactionKind = 'heart';
  let bestN = -1;
  (['heart', 'fire', 'mind', 'eye'] as ReactionKind[]).forEach((k) => {
    const n = fallbackCount(shotId, k, mine);
    if (n > bestN) { best = k; bestN = n; }
  });
  return best;
}
