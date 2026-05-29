// Wall fetch — returns recent PetShots across the 6 most-recent users.
//
// Each row's resource_data is a PetSave (cap 20 shots per user).
// We flatten ALL shots across ALL users, sort newest-first across
// authors, cap the display count, and resolve each unique user's
// profile once.
//
// We throttle at filter generation (the cost), never at display —
// older pet portraits stay in the wall. See
// feedback_throttle_at_input_not_output.

import { useCallback, useEffect, useState } from 'react';
import {
  callAigramAPI,
  isInAigram,
  telegramId,
  type AigramResponse,
} from '@shared/runtime/bridge';
import { getGameUuid } from '@shared/runtime/game-id';
import type { PetSave, PetShot, WallEntry } from '../types';

interface SaveRow {
  user_id: string;
  time?: string;
  resource_data?: string;
}

/** Diagnostic info from the last fetch — used by the wall's
 *  ?debug=1 panel to show what the platform actually returned. */
export interface WallDiagnostics {
  isInAigram: boolean;
  sessionId: string | null;
  telegramId: string | null;
  rowsFromPlatform: number;
  userIdsFromPlatform: string[];
  parsedShots: number;
  error: string | null;
  fetchStatus: 'idle' | 'loading' | 'ok' | 'failed' | 'skipped';
}

export interface UseWall {
  entries: WallEntry[];
  loaded: boolean;
  refresh: () => void;
  diagnostics: WallDiagnostics;
}

export function useWall(): UseWall {
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [diagnostics, setDiagnostics] = useState<WallDiagnostics>({
    isInAigram, sessionId: null, telegramId,
    rowsFromPlatform: 0, userIdsFromPlatform: [],
    parsedShots: 0, error: null, fetchStatus: 'idle',
  });

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const sessionId = getGameUuid();
    // Always log boot diagnostics so we can verify in production
    // devtools whether the wall hook even fires + what it sees.
    // tslint:disable-next-line:no-console
    console.info('[pet-filter wall]', {
      isInAigram, sessionId, telegramId,
      reason: !isInAigram ? 'not in Aigram (api_origin/telegram_id missing)'
        : !sessionId ? 'no game UUID resolved'
        : 'will fetch',
    });
    if (!isInAigram || !sessionId) {
      setLoaded(true);
      setDiagnostics({
        isInAigram, sessionId, telegramId,
        rowsFromPlatform: 0, userIdsFromPlatform: [],
        parsedShots: 0, error: null,
        fetchStatus: 'skipped',
      });
      return;
    }
    setDiagnostics((d) => ({ ...d, fetchStatus: 'loading', sessionId, telegramId }));
    let cancelled = false;
    (async () => {
      try {
        const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
          `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
          'GET',
        );
        const rows = Array.isArray(res?.data) ? res.data : [];
        // tslint:disable-next-line:no-console
        console.info('[pet-filter wall] get/data/list →', {
          rowCount: rows.length,
          userIds: rows.map((r) => r.user_id),
        });

        // Flatten ALL shots from each user's save row. Older pattern
        // only took shots[0] per user, hiding every author's older
        // portraits behind their newest. Throttle at publish, never
        // display.
        const pairs: Array<{ userId: string; shot: PetShot }> = [];
        for (const row of rows) {
          if (!row.user_id || !row.resource_data) continue;
          try {
            const save = JSON.parse(row.resource_data) as PetSave;
            for (const shot of save.shots || []) {
              if (shot && shot.imageUrl) {
                pairs.push({ userId: row.user_id, shot });
              }
            }
          } catch { /* skip */ }
        }
        // Newest first across all authors, cap visible count.
        pairs.sort((a, b) => (b.shot.createdAt ?? 0) - (a.shot.createdAt ?? 0));
        const limited = pairs.slice(0, 24);
        // tslint:disable-next-line:no-console
        console.info('[pet-filter wall] flattened shots →', pairs.length,
                     'across', rows.length, 'rows; displayed:', limited.length);

        // Resolve each unique author's profile once.
        const uniqueIds = Array.from(new Set(limited.map(p => p.userId)));
        const profileEntries = await Promise.all(
          uniqueIds.map(async uid => {
            try {
              const r = await callAigramAPI<
                AigramResponse<{ name?: string; head_url?: string }>
              >(
                `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(uid)}`,
                'GET',
              );
              return [uid, r?.data ?? null] as const;
            } catch {
              return [uid, null] as const;
            }
          }),
        );
        const profileMap = new Map<string, { name?: string; head_url?: string } | null>(profileEntries);

        if (cancelled) return;
        setEntries(
          limited.map(({ userId, shot }) => {
            const p = profileMap.get(userId) || null;
            return {
              userId,
              userName: p?.name,
              userAvatarUrl: p?.head_url,
              shot,
            };
          }),
        );
        setDiagnostics({
          isInAigram, sessionId, telegramId,
          rowsFromPlatform: rows.length,
          userIdsFromPlatform: rows.map((r) => r.user_id),
          parsedShots: pairs.length,
          error: null,
          fetchStatus: 'ok',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // tslint:disable-next-line:no-console
        console.warn('[pet-filter wall] fetch failed', err);
        if (!cancelled) {
          setEntries([]);
          setDiagnostics((d) => ({
            ...d, error: msg, fetchStatus: 'failed',
          }));
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [nonce]);

  return { entries, loaded, refresh, diagnostics };
}

export function isSelf(entry: WallEntry): boolean {
  return !!telegramId && entry.userId === String(telegramId);
}
