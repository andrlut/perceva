import { create } from 'zustand';

/**
 * Spotlight target registry for the post-login tour.
 *
 * Screens wrap the element a tour step points at in `<TourTarget id="…">`
 * (components/tour/TourTarget.tsx). While that id is the ACTIVE target —
 * i.e. the visible step declares `target: id` — the wrapper measures
 * itself in window coordinates and publishes the rect here, where the
 * `SpotlightBackdrop` reads it to cut the dim-layer hole.
 *
 * Everything is transient runtime plumbing: nothing persists, and when
 * no tour step is active `activeTargetId` is null so the wrappers are
 * completely inert (no measuring, no re-renders).
 */

export interface TourTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourTargetsState {
  /** The target id the visible tour step points at (null = no spotlight). */
  activeTargetId: string | null;
  /** Measured window-coordinate rects, keyed by target id. */
  rects: Record<string, TourTargetRect>;
  /**
   * Bumped to ask active targets to re-measure — after auto-scroll
   * animations settle, on manual scroll end, on layout changes.
   */
  measureTick: number;
  setActiveTargetId: (id: string | null) => void;
  setRect: (id: string, rect: TourTargetRect) => void;
  clearRect: (id: string) => void;
  requestRemeasure: () => void;
}

export const useTourTargetsStore = create<TourTargetsState>((set, get) => ({
  activeTargetId: null,
  rects: {},
  measureTick: 0,

  setActiveTargetId: (id) => {
    if (get().activeTargetId === id) return;
    set({ activeTargetId: id });
  },

  setRect: (id, rect) => {
    const prev = get().rects[id];
    if (
      prev &&
      prev.x === rect.x &&
      prev.y === rect.y &&
      prev.width === rect.width &&
      prev.height === rect.height
    ) {
      return; // no-op — avoids re-render loops on repeated measures
    }
    set({ rects: { ...get().rects, [id]: rect } });
  },

  clearRect: (id) => {
    if (!(id in get().rects)) return;
    const next = { ...get().rects };
    delete next[id];
    set({ rects: next });
  },

  requestRemeasure: () => set({ measureTick: get().measureTick + 1 }),
}));

/** Convenience for scroll handlers: only bump the tick when a spotlight
 *  is actually active (cheap guard, avoids store churn in normal use). */
export function remeasureActiveTourTarget(): void {
  const s = useTourTargetsStore.getState();
  if (s.activeTargetId) s.requestRemeasure();
}
