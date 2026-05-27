import { useCallback, useRef } from 'react';

interface Options {
  onLongPress: () => void;
  onShortPress?: () => void;
  delayMs?: number;
  moveTolerancePx?: number;
}

interface Handlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
}

// Hook that distinguishes a normal tap from a long-press, and only
// fires onShortPress if the user lifted their finger before the
// long-press threshold (and didn't drift). Used so the same tile can
// both navigate-on-tap AND reveal a delete overlay on long-press.
export function useLongPress({
  onLongPress, onShortPress, delayMs = 500, moveTolerancePx = 8,
}: Options): Handlers {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const longFired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    longFired.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    clear();
    timer.current = window.setTimeout(() => {
      longFired.current = true;
      timer.current = null;
      onLongPress();
    }, delayMs);
  }, [onLongPress, delayMs, clear]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.hypot(dx, dy) > moveTolerancePx) {
      clear();
      start.current = null;
    }
  }, [moveTolerancePx, clear]);

  const onPointerUp = useCallback(() => {
    if (timer.current !== null) {
      clear();
      if (!longFired.current) onShortPress?.();
    }
    start.current = null;
  }, [onShortPress, clear]);

  const onPointerCancel = useCallback(() => {
    clear();
    start.current = null;
  }, [clear]);

  return {
    onPointerDown, onPointerMove, onPointerUp,
    onPointerCancel, onPointerLeave: onPointerCancel,
  };
}
