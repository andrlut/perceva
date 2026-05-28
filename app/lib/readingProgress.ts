import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

/**
 * Per-material scroll progress for the Learn tab's "Continue lendo" hero.
 *
 * Client-only on purpose — keeps the feature lightweight (no schema, no
 * roundtrip on every scroll event) at the cost of not syncing across
 * devices. If the user installs the app fresh the hero is empty, which
 * is acceptable behaviour: re-opening any in-progress article will
 * populate the store again on the next scroll.
 *
 * Persistence: a single `rpgtasks.reading.v1` key in AsyncStorage,
 * holding the full Record<slug, ReadingEntry>. Reads are O(1) and writes
 * are debounced upstream in material/[slug].tsx (every 500ms while the
 * user is actively scrolling — see useReadingProgressTracker).
 */

const KEY = 'rpgtasks.reading.v1';
/** Anything below this stays "not started" — pure interaction noise. */
const MIN_PERSIST_PERCENT = 5;
/**
 * The maximum value we ever store. Even if the user scrolls to the
 * absolute bottom (100%), we cap at 99 — finishing the article is
 * the explicit "Mark as read" action, not a side-effect of scrolling.
 * Keeping the hero at 99% nudges the user to claim the XP.
 */
const MAX_PERSIST_PERCENT = 99;
/** How many in-progress entries we keep around. Older ones evict on write. */
const MAX_ENTRIES = 12;

export interface ReadingEntry {
  /** Material slug — used to navigate back to /material/[slug]. */
  slug: string;
  /** Material UUID — passed back to mark_material_read. */
  materialId: string;
  /** 0..100 — last reported scroll position. */
  percent: number;
  /** Local epoch ms when this entry was last updated. */
  updatedAt: number;
}

interface ReadingState {
  /** Map keyed by slug. */
  entries: Record<string, ReadingEntry>;
  status: 'unknown' | 'ready';
  hydrate: () => Promise<void>;
  /**
   * Update progress for a material. No-op below MIN_PERSIST_PERCENT,
   * deletes the entry once it crosses COMPLETE_PERCENT (user finished
   * the article — the read log on the server is the source of truth
   * from here).
   */
  update: (slug: string, materialId: string, percent: number) => void;
  /** Drop a material's entry — called when the user taps "Mark as read". */
  clear: (slug: string) => void;
}

async function persist(entries: Record<string, ReadingEntry>) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Swallow — losing a scroll-percent isn't worth surfacing.
  }
}

export const useReadingProgressStore = create<ReadingState>((set, get) => ({
  entries: {},
  status: 'unknown',

  hydrate: async () => {
    if (get().status === 'ready') return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, ReadingEntry>;
        // Defensive — strip any malformed rows so a corrupt entry can't
        // brick the hero.
        const clean: Record<string, ReadingEntry> = {};
        for (const [slug, e] of Object.entries(parsed)) {
          if (
            e &&
            typeof e.percent === 'number' &&
            typeof e.materialId === 'string' &&
            typeof e.updatedAt === 'number'
          ) {
            clean[slug] = { ...e, slug };
          }
        }
        set({ entries: clean, status: 'ready' });
        return;
      }
    } catch {
      // ignore
    }
    set({ status: 'ready' });
  },

  update: (slug, materialId, rawPercent) => {
    // Cap at 99 so even scrolling to the very bottom keeps the entry
    // alive at 99% — finishing the article is the user's explicit
    // "Mark as read" action, not a scroll side-effect.
    const percent = Math.max(
      0,
      Math.min(MAX_PERSIST_PERCENT, Math.round(rawPercent)),
    );
    const prev = get().entries;

    // Floor below the noise threshold: only persist once the user
    // has actually engaged with the content.
    if (percent < MIN_PERSIST_PERCENT) {
      // If we already had a row (user re-opened and scrolled UP),
      // keep the highest watermark — don't downgrade.
      const cur = prev[slug];
      if (!cur) return;
      if (cur.percent >= MIN_PERSIST_PERCENT) return;
    }

    const next: ReadingEntry = {
      slug,
      materialId,
      percent: Math.max(percent, prev[slug]?.percent ?? 0),
      updatedAt: Date.now(),
    };

    let entries = { ...prev, [slug]: next };

    // Evict oldest entries past MAX_ENTRIES — bounded cache.
    const keys = Object.keys(entries);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys
        .map((k) => entries[k]!)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_ENTRIES);
      entries = Object.fromEntries(sorted.map((e) => [e.slug, e]));
    }

    set({ entries });
    void persist(entries);
  },

  clear: (slug) => {
    const prev = get().entries;
    if (!prev[slug]) return;
    const { [slug]: _drop, ...rest } = prev;
    set({ entries: rest });
    void persist(rest);
  },
}));

/**
 * Tap-friendly hydrate hook for components that depend on the store
 * being ready. Mirrors the settings store pattern. Returns nothing —
 * components read state via `useReadingProgressStore` directly.
 */
export function useReadingProgressReady(): boolean {
  const status = useReadingProgressStore((s) => s.status);
  const hydrate = useReadingProgressStore((s) => s.hydrate);
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

/**
 * Hero pick: the single in-progress entry to surface. We pick the
 * most-recently-touched one with `percent >= MIN_PERSIST_PERCENT` —
 * the user's last reading session. Empty when none exist.
 */
export function useContinueReading(): ReadingEntry | null {
  const entries = useReadingProgressStore((s) => s.entries);
  let best: ReadingEntry | null = null;
  for (const e of Object.values(entries)) {
    if (e.percent < MIN_PERSIST_PERCENT) continue;
    if (!best || e.updatedAt > best.updatedAt) best = e;
  }
  return best;
}

/**
 * Lookup the user's progress for a specific slug — used by CoverCard
 * to draw the gold rim + progress bar when an article is in-flight.
 * Returns 0 when the user hasn't started yet.
 */
export function useMaterialProgress(slug: string): number {
  const entry = useReadingProgressStore((s) => s.entries[slug]);
  return entry?.percent ?? 0;
}
