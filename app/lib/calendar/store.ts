/**
 * Calendar UI state — which front is painted, which view is showing, and the
 * one filter every surface obeys.
 *
 * Deliberately NOT persisted. A filter that survives an app restart is a bug
 * with a good excuse: the user opens the calendar a week later, sees a
 * half-empty month, and has no memory of the chip that did it. Session-scoped
 * state (a Zustand store with no AsyncStorage) keeps a filter alive across
 * navigation — pushing into a task and coming back — and drops it on relaunch,
 * which is exactly the lifetime a filter should have.
 *
 * The period is not here either: the visible month is component state on the
 * screen, because it is navigation, not a filter. See `lib/calendar/filters.ts`.
 */

import { create } from 'zustand';

import {
  EMPTY_FILTER,
  stepMinXp,
  toggleValue,
  type CalendarFilter,
} from '@/lib/calendar/filters';
import type { DimensionId, SubId } from '@/lib/db/types';
import type { MoodValue } from '@/lib/mood';

/** Which reading of a day the grid paints. */
export type CalendarFront = 'rotina' | 'humor' | 'vault';

/** How the range is laid out. The day panel rides along with all three. */
export type CalendarView = 'month' | 'list' | 'quarter';

interface CalendarState {
  front: CalendarFront;
  view: CalendarView;
  filter: CalendarFilter;
  /**
   * Task id → title, captured when a practice is selected.
   *
   * The filter is global and survives month navigation, but the practice menu
   * is derived from the days currently loaded — so in a month where the chosen
   * practice was never logged there is nothing left to resolve its name from,
   * and the active-filter chip would degrade to a dash while the whole month
   * sits dimmed with no readable explanation. Capturing the label at selection
   * time is the only source that cannot go missing; it also survives a task
   * being archived, which `useActiveTasks` would not.
   */
  taskLabels: Record<string, string>;
  setFront: (front: CalendarFront) => void;
  setView: (view: CalendarView) => void;
  toggleMood: (mood: MoodValue) => void;
  toggleTask: (taskId: string, title: string) => void;
  toggleDim: (dim: DimensionId) => void;
  toggleSub: (sub: SubId) => void;
  toggleTag: (slug: string) => void;
  nudgeMinXp: (direction: 1 | -1) => void;
  toggleWithRedemption: () => void;
  /** Drop one facet whole — what the ✕ on an active-filter chip does. */
  clearFacet: (facet: keyof CalendarFilter) => void;
  clearFilter: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  front: 'rotina',
  view: 'month',
  filter: EMPTY_FILTER,
  taskLabels: {},
  setFront: (front) => set({ front }),
  setView: (view) => set({ view }),
  toggleMood: (mood) =>
    set((s) => ({ filter: { ...s.filter, moods: toggleValue(s.filter.moods, mood) } })),
  toggleTask: (taskId, title) =>
    set((s) => ({
      filter: { ...s.filter, taskIds: toggleValue(s.filter.taskIds, taskId) },
      // Kept on deselect too: it is a label cache, and holding it makes
      // re-selecting the same practice in another month resolve instantly.
      taskLabels: title ? { ...s.taskLabels, [taskId]: title } : s.taskLabels,
    })),
  toggleDim: (dim) =>
    set((s) => ({ filter: { ...s.filter, dims: toggleValue(s.filter.dims, dim) } })),
  toggleSub: (sub) =>
    set((s) => ({ filter: { ...s.filter, subs: toggleValue(s.filter.subs, sub) } })),
  toggleTag: (slug) =>
    set((s) => ({ filter: { ...s.filter, tagIds: toggleValue(s.filter.tagIds, slug) } })),
  nudgeMinXp: (direction) =>
    set((s) => ({ filter: { ...s.filter, minXp: stepMinXp(s.filter.minXp, direction) } })),
  toggleWithRedemption: () =>
    set((s) => ({ filter: { ...s.filter, withRedemption: !s.filter.withRedemption } })),
  clearFacet: (facet) =>
    set((s) => ({ filter: { ...s.filter, [facet]: EMPTY_FILTER[facet] } })),
  clearFilter: () => set({ filter: EMPTY_FILTER, taskLabels: {} }),
}));

/**
 * Seed the filter from a deep link — the retired `/dedicacao-history` route
 * hands its `dims`/`subs`/`minXp` params over on the way in. Replaces the whole
 * filter rather than merging: a link is a destination, not an adjustment.
 */
export function applyFilterSeed(seed: Partial<CalendarFilter>): void {
  useCalendarStore.setState({ filter: { ...EMPTY_FILTER, ...seed } });
}
