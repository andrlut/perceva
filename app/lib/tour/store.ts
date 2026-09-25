import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { create } from 'zustand';

import {
  GUIDED_MODULES,
  isTerminal,
  ROUTE_MODULES,
  TOUR_MODULES,
  type RouteModule,
  type TourModule,
  type TourModuleStatus,
} from './constants';

/**
 * Per-device, per-user onboarding + tour state.
 *
 * Persistence is AsyncStorage (one key per auth user id — the same value as
 * character.id, since handle_new_user inserts character with id = auth uid).
 * The shape is JSON-serialisable so moving it to a `profile` JSONB column
 * later is a swap of the persist layer.
 *
 * v2 (2026-09): the old M0 / M0_5 routes became `intro` / `pack`, M3 left
 * the tour, and the store gained an in-memory `replaying` slot so replaying
 * one module from Settings no longer rewrites every other module's status.
 */

const KEY_PREFIX = 'rpgtasks.tour.v1.';

interface TourEntry {
  status: TourModuleStatus;
  /** Local ISO timestamp the entry was last updated. */
  updatedAt: string;
}

type ModuleMap = Partial<Record<TourModule, TourEntry>>;

interface TourState {
  /** Which user's data is currently loaded. null = nothing loaded yet. */
  characterId: string | null;
  /** Hydration sentinel. */
  status: 'unknown' | 'ready';
  /** Per-module status map. Missing entry = `pending`. */
  modules: ModuleMap;
  /**
   * Per-module step index — in memory only. Shared across every
   * `<TourModule>` mount for the same module, so steps can live on
   * different screens without each mount carrying its own counter.
   */
  stepIndices: Partial<Record<TourModule, number>>;
  /**
   * Module being replayed from Settings (in memory only). While set, it is
   * the ONLY current module, whatever the others' statuses say — so a
   * replay no longer has to stamp every other module `completed`. Cleared
   * when that module finishes, on hydrate and on resetAll.
   */
  replaying: TourModule | null;
  hydrate: (characterId: string | null) => Promise<void>;
  setStatus: (module: TourModule, status: TourModuleStatus) => Promise<void>;
  setStepIndex: (module: TourModule, index: number) => void;
  /** Wipe everything back to a first-run state ("Refazer onboarding"). */
  resetAll: () => Promise<void>;
  /**
   * Replay ONE module: mark it pending (index 0) and make it the only
   * current module until it ends. Other statuses are left untouched.
   */
  replayModule: (module: TourModule) => Promise<void>;
  /** "Fazer o tour": every guided module + wrap back to pending. */
  startGuidedTour: () => Promise<void>;
  /** "Pular": every guided module + wrap that is still unfinished → skipped. */
  skipGuidedTour: () => Promise<void>;
}

function storageKey(characterId: string | null): string {
  return `${KEY_PREFIX}${characterId ?? 'anonymous'}`;
}

async function persistModules(characterId: string | null, modules: ModuleMap): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(characterId), JSON.stringify(modules));
  } catch {
    // Best-effort — losing tour state is acceptable, the user can always
    // replay from Settings.
  }
}

/**
 * v1 → v2 key mapping. Installs that already went through the old tour
 * carry M0 / M0_5 and no `intro` — they must NOT be dragged through the new
 * intro on update. A finished M0 maps to a finished intro, M0_5 to pack.
 * Unknown legacy keys (M0, M0_5, M3) are simply ignored by every reader.
 */
function migrateLegacy(raw: Record<string, TourEntry>): ModuleMap {
  const out: ModuleMap = { ...(raw as ModuleMap) };
  const m0 = raw.M0;
  if (!out.intro && m0 && isTerminal(m0.status)) {
    out.intro = { status: 'completed', updatedAt: m0.updatedAt };
    const m05 = raw.M0_5;
    out.pack = {
      status: m05 && isTerminal(m05.status) ? m05.status : 'completed',
      updatedAt: m05?.updatedAt ?? m0.updatedAt,
    };
  }
  // Every guided module done but the closing screen never marked: v1 only
  // stamped `wrap` from its button, so backing out of it left the tour
  // unfinished forever (mood prompt and OTA banner stay off). v2 can reach
  // the same state if the app dies between M6's end and /tour/wrap mounting.
  // Nothing routes back to wrap by itself, so close it here.
  if (
    GUIDED_MODULES.every((m) => isTerminal(out[m]?.status)) &&
    !isTerminal(out.wrap?.status)
  ) {
    out.wrap = { status: 'completed', updatedAt: new Date().toISOString() };
  }
  return out;
}

function stamp(status: TourModuleStatus): TourEntry {
  return { status, updatedAt: new Date().toISOString() };
}

export const useTourStore = create<TourState>((set, get) => ({
  characterId: null,
  status: 'unknown',
  modules: {},
  stepIndices: {},
  replaying: null,

  hydrate: async (characterId) => {
    if (get().status === 'ready' && get().characterId === characterId) return;
    // Step indices and the replay slot belong to the previous account —
    // an account switch without an app restart must not inherit them.
    try {
      const raw = await AsyncStorage.getItem(storageKey(characterId));
      const parsed = raw ? migrateLegacy(JSON.parse(raw) as Record<string, TourEntry>) : {};
      set({ characterId, status: 'ready', modules: parsed, stepIndices: {}, replaying: null });
    } catch {
      set({ characterId, status: 'ready', modules: {}, stepIndices: {}, replaying: null });
    }
  },

  setStatus: async (module, status) => {
    const next: ModuleMap = { ...get().modules, [module]: stamp(status) };
    const replaying =
      get().replaying === module && isTerminal(status) ? null : get().replaying;
    set({ modules: next, replaying });
    await persistModules(get().characterId, next);
  },

  setStepIndex: (module, index) => {
    set({ stepIndices: { ...get().stepIndices, [module]: index } });
  },

  resetAll: async () => {
    set({ modules: {}, stepIndices: {}, replaying: null });
    await persistModules(get().characterId, {});
  },

  replayModule: async (module) => {
    const next: ModuleMap = { ...get().modules, [module]: stamp('pending') };
    set({
      modules: next,
      stepIndices: { ...get().stepIndices, [module]: 0 },
      replaying: module,
    });
    await persistModules(get().characterId, next);
  },

  startGuidedTour: async () => {
    const next: ModuleMap = { ...get().modules };
    for (const m of [...GUIDED_MODULES, 'wrap'] as const) next[m] = stamp('pending');
    const stepIndices = { ...get().stepIndices };
    for (const m of GUIDED_MODULES) stepIndices[m] = 0;
    set({ modules: next, stepIndices });
    await persistModules(get().characterId, next);
  },

  skipGuidedTour: async () => {
    const next: ModuleMap = { ...get().modules };
    for (const m of [...GUIDED_MODULES, 'wrap'] as const) {
      if (!isTerminal(next[m]?.status)) next[m] = stamp('skipped');
    }
    set({ modules: next });
    await persistModules(get().characterId, next);
  },
}));

/**
 * Hydrates the store for the given user (call once, in AuthGate) and returns
 * true when the store holds THIS user's data.
 */
export function useTourReady(characterId: string | null | undefined): boolean {
  const normalizedId = characterId ?? null;
  const status = useTourStore((s) => s.status);
  const currentCharacterId = useTourStore((s) => s.characterId);
  const hydrate = useTourStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate(normalizedId);
  }, [normalizedId, hydrate]);

  // Derived straight from the store so it can NEVER report ready while the
  // store still holds another account's data (the cold-boot race that sent
  // onboarded users back into the tour on every launch).
  return status === 'ready' && currentCharacterId === normalizedId;
}

/** Status for a single module (defaults to `pending`). */
export function useModuleStatus(module: TourModule): TourModuleStatus {
  return useTourStore((s) => s.modules[module]?.status ?? 'pending');
}

function currentModuleOf(s: Pick<TourState, 'modules' | 'replaying'>): TourModule | null {
  if (s.replaying) return s.replaying;
  for (const m of TOUR_MODULES) {
    if (!isTerminal(s.modules[m]?.status)) return m;
  }
  return null;
}

/**
 * True only when `module` is THE current module: the one being replayed,
 * or else the first unfinished module in TOUR_MODULES order. Every inline
 * `<TourModule>` mount gates on this so only one module's tooltips render.
 */
export function useIsCurrentTourModule(module: TourModule): boolean {
  return useTourStore((s) => currentModuleOf(s) === module);
}

/** Non-hook read of the current module (event handlers, effects). */
export function getCurrentTourModule(): TourModule | null {
  return currentModuleOf(useTourStore.getState());
}

/**
 * The full-screen module the AuthGate must open, if any: the first of
 * intro / pack that is not finished. Null while hydrating.
 */
export function useNextRouteModule(): RouteModule | null {
  return useTourStore((s) => {
    if (s.status !== 'ready') return null;
    for (const m of ROUTE_MODULES) {
      if (!isTerminal(s.modules[m]?.status)) return m;
    }
    return null;
  });
}

/** True when the closing screen still has to run (pending, never seen). */
export function isWrapPending(): boolean {
  const s = useTourStore.getState();
  return !isTerminal(s.modules.wrap?.status) && s.replaying == null;
}

/**
 * True only when the whole tour is over: hydrated, nothing being replayed,
 * every module completed or skipped. Fails CLOSED while hydrating, so
 * overlays that stay quiet during the tour (mood check-in, OTA banner)
 * never flash over it on cold boot.
 */
export function useTourFinished(): boolean {
  return useTourStore((s) => {
    if (s.status !== 'ready' || s.replaying) return false;
    return TOUR_MODULES.every((m) => isTerminal(s.modules[m]?.status));
  });
}

/**
 * Transient "what's on screen right now" descriptor for the active tour
 * step, set by `<TourModule>`. Screens read it to reserve scroll room for
 * the tooltip card.
 */
export interface ActiveTourStep {
  module: TourModule;
  position: 'top' | 'bottom';
}

interface ActiveTourStepState {
  active: ActiveTourStep | null;
  /** Measured height of the visible tooltip card (px), or null. */
  cardHeight: number | null;
  set: (next: ActiveTourStep | null) => void;
  setCardHeight: (height: number | null) => void;
}

export const useActiveTourStepStore = create<ActiveTourStepState>((set) => ({
  active: null,
  cardHeight: null,
  set: (next) => set({ active: next }),
  setCardHeight: (height) => set({ cardHeight: height }),
}));

export function useActiveTourStep(): ActiveTourStep | null {
  return useActiveTourStepStore((s) => s.active);
}
