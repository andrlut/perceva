import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

/**
 * Local consumption state for Study Reels — sibling of readingProgress.ts.
 *
 * Client-only on purpose: seeing a card in the reel is a soft signal (the
 * hard one stays the explicit "Concluir" → learning_view row), so it isn't
 * worth schema or roundtrips. Losing it on reinstall just resets replay
 * order and the same-day resume — acceptable.
 *
 * Persists under a single `rpgtasks.reels.v1` key:
 * - `entries`  — per-slug last-seen timestamp; drives least-recently-seen
 *               replay ordering and the entry-card badge.
 * - `session`  — where the user left off today (slug, not index, so a
 *               rebuilt deck with a different order still resumes right).
 * - `counters` — throwaway local metrics until the app has real analytics:
 *               does he open it, does he finish sets, does it drive Concluir.
 */

const KEY = 'rpgtasks.reels.v1';
/** Covers the whole catalog (25 materials) with slack for growth. */
const MAX_ENTRIES = 48;

export interface ReelSeenEntry {
  slug: string;
  materialId: string;
  /** Local epoch ms when a card of this material was last on screen. */
  seenAt: number;
}

interface ReelSession {
  /** Local `YYYY-MM-DD` — resume only applies same-day. */
  day: string;
  slug: string;
}

interface ReelCounters {
  setsStarted: number;
  setsCompleted: number;
  concludedFromReel: number;
}

interface ReelsState {
  entries: Record<string, ReelSeenEntry>;
  session: ReelSession | null;
  counters: ReelCounters;
  status: 'unknown' | 'ready';
  hydrate: () => Promise<void>;
  /** Record that a material's card is on screen right now. */
  markSeen: (slug: string, materialId: string) => void;
  bump: (counter: keyof ReelCounters) => void;
}

const ZERO_COUNTERS: ReelCounters = {
  setsStarted: 0,
  setsCompleted: 0,
  concludedFromReel: 0,
};

interface PersistShape {
  entries: Record<string, ReelSeenEntry>;
  session: ReelSession | null;
  counters: ReelCounters;
}

export function reelsToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function persist(state: PersistShape) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Swallow — losing a seen-timestamp isn't worth surfacing.
  }
}

function snapshot(s: ReelsState): PersistShape {
  return { entries: s.entries, session: s.session, counters: s.counters };
}

export const useReelsProgressStore = create<ReelsState>((set, get) => ({
  entries: {},
  session: null,
  counters: ZERO_COUNTERS,
  status: 'unknown',

  hydrate: async () => {
    if (get().status === 'ready') return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistShape>;
        // Defensive — strip malformed rows so a corrupt entry can't brick
        // the viewer.
        const clean: Record<string, ReelSeenEntry> = {};
        for (const [slug, e] of Object.entries(parsed.entries ?? {})) {
          if (e && typeof e.materialId === 'string' && typeof e.seenAt === 'number') {
            clean[slug] = { ...e, slug };
          }
        }
        const session =
          parsed.session &&
          typeof parsed.session.day === 'string' &&
          typeof parsed.session.slug === 'string'
            ? parsed.session
            : null;
        // Per-key sanitize: a corrupt persisted counter (e.g. a string)
        // would otherwise string-concatenate forever on bump() and
        // re-persist itself.
        const rawCounters = (parsed.counters ?? {}) as Record<string, unknown>;
        const counters = { ...ZERO_COUNTERS };
        for (const k of Object.keys(ZERO_COUNTERS) as (keyof ReelCounters)[]) {
          const v = rawCounters[k];
          if (typeof v === 'number' && Number.isFinite(v)) counters[k] = v;
        }
        set({ entries: clean, session, counters, status: 'ready' });
        return;
      }
    } catch {
      // ignore
    }
    set({ status: 'ready' });
  },

  markSeen: (slug, materialId) => {
    const prev = get().entries;
    let entries: Record<string, ReelSeenEntry> = {
      ...prev,
      [slug]: { slug, materialId, seenAt: Date.now() },
    };

    // Evict oldest entries past MAX_ENTRIES — bounded cache.
    const keys = Object.keys(entries);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys
        .map((k) => entries[k]!)
        .sort((a, b) => b.seenAt - a.seenAt)
        .slice(0, MAX_ENTRIES);
      entries = Object.fromEntries(sorted.map((e) => [e.slug, e]));
    }

    const session: ReelSession = { day: reelsToday(), slug };
    set({ entries, session });
    void persist(snapshot(get()));
  },

  bump: (counter) => {
    const counters = { ...get().counters, [counter]: get().counters[counter] + 1 };
    set({ counters });
    void persist(snapshot(get()));
  },
}));

/** Hydrate gate, mirroring useReadingProgressReady. */
export function useReelsProgressReady(): boolean {
  const status = useReelsProgressStore((s) => s.status);
  const hydrate = useReelsProgressStore((s) => s.hydrate);
  const [ready, setReady] = useState(status === 'ready');
  useEffect(() => {
    if (status === 'ready') {
      setReady(true);
      return;
    }
    void hydrate().then(() => setReady(true));
  }, [status, hydrate]);
  return ready;
}
