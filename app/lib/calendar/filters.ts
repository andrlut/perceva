/**
 * The calendar's filter model — the one idea the whole screen is built on.
 *
 * **A filter selects DAYS; the front selects what to show about them.**
 *
 * Every facet below (mood, practice, dimension, sub, tag, XP floor, redemption)
 * narrows the same set of days. The front chips (Rotina / Humor / Vault) never
 * touch that set — they only decide what each surviving day renders. That is
 * what makes the cross-cutting reads work without a single special case:
 *
 *   mood = Ótimo, front = Vault    → what I redeemed on my good days
 *   practice = Treino, front = Humor → how I felt on the days I trained
 *
 * Days outside the set are dimmed, never removed: the month keeps its shape, so
 * a filter reads as focus rather than as data loss, and the grid never reflows.
 *
 * Composition rule: **OR inside a facet, AND across facets.** Picking "Ótimo"
 * and "Bom" means either; adding a practice means either mood AND that practice.
 * That is the only rule a user has to internalise, and it is the one every
 * faceted filter on the web already teaches.
 *
 * Deliberately NOT here: the period. The visible month IS the period — the
 * Dedicação screen's granularity chips (semana/mês/trimestre/total) become
 * navigation (month arrows and the quarter view), not filter state. Keeping
 * period out of this object is what stops the calendar from having two
 * competing notions of "when".
 */

import type { DimensionId, SubId } from '@/lib/db/types';
import type { MoodValue } from '@/lib/mood';

/** One practice actually completed on a day, collapsed across repetitions. */
export interface CalendarPractice {
  taskId: string;
  title: string;
  /** Completions of this task on this day (a task can be logged more than once). */
  count: number;
  /** XP earned from this task on this day, summed across its completions. */
  xp: number;
  coins: number;
  /** Subs this task's completions touched, deduped. */
  subs: SubId[];
  /** Dimensions those subs belong to, deduped. */
  dims: DimensionId[];
  /** Latest completion timestamp of the day, ISO — drives the day panel order. */
  at: string;
}

/** A reward event on a day. `use` rows carry no cost (the coins left earlier). */
export interface CalendarRedemption {
  id: string;
  title: string;
  icon: string | null;
  /** Coins debited. Always 0 for `kind: 'use'`. */
  cost: number;
  kind: 'redeem' | 'use';
  at: string;
}

/**
 * Everything the calendar knows about one local day, already merged from the
 * three month queries (daily XP summary, mood log, reward redemptions). One
 * shape for the grid, the list, the quarter view and the filter predicate, so
 * the four surfaces can never disagree about what a day contains.
 */
export interface CalendarDay {
  dateKey: string;
  xp: number;
  coins: number;
  /**
   * XP per dimension for the day, summed from the per-sub completion snapshots.
   * Carried here rather than derived from `practices` because a multi-sub task
   * splits unevenly — three stars on Strength and one on Dexterity is not a
   * 50/50 day — and only the snapshot knows the real split.
   */
  xpByDim: Partial<Record<DimensionId, number>>;
  mood: MoodValue | null;
  /** The mood entry carries a written note. */
  hasNote: boolean;
  /** Mood tag ids on the entry (emotion + context alike). */
  tagIds: string[];
  practices: CalendarPractice[];
  redemptions: CalendarRedemption[];
  /** Coins spent on this day — the Vault front's headline figure. */
  spent: number;
}

export interface CalendarFilter {
  /** Mood levels to keep. Empty = any (including days with no mood). */
  moods: MoodValue[];
  /** Task ids to keep. Empty = any. */
  taskIds: string[];
  dims: DimensionId[];
  subs: SubId[];
  /** Mood tag ids to keep. Empty = any. */
  tagIds: string[];
  /** Minimum XP for the day. 0 = no floor. */
  minXp: number;
  /** Keep only days carrying at least one reward event. */
  withRedemption: boolean;
}

export const EMPTY_FILTER: CalendarFilter = {
  moods: [],
  taskIds: [],
  dims: [],
  subs: [],
  tagIds: [],
  minXp: 0,
  withRedemption: false,
};

/**
 * How many facets are engaged — the FAB badge, and the cheap "is anything on?"
 * test. Counts FACETS, not values: picking three moods is one active filter to
 * the user, and a badge reading "3" for one decision would be a lie.
 */
export function activeFacetCount(f: CalendarFilter): number {
  return (
    (f.moods.length > 0 ? 1 : 0) +
    (f.taskIds.length > 0 ? 1 : 0) +
    (f.dims.length > 0 ? 1 : 0) +
    (f.subs.length > 0 ? 1 : 0) +
    (f.tagIds.length > 0 ? 1 : 0) +
    (f.minXp > 0 ? 1 : 0) +
    (f.withRedemption ? 1 : 0)
  );
}

export function isFilterActive(f: CalendarFilter): boolean {
  return activeFacetCount(f) > 0;
}

/**
 * Does this day survive the filter?
 *
 * A day with no mood entry fails an active mood facet — "show me my great days"
 * must not hand back days that were never rated. Same reasoning for every other
 * facet: an active facet is a positive assertion about the day.
 */
export function dayMatchesFilter(day: CalendarDay, f: CalendarFilter): boolean {
  if (f.moods.length > 0 && (day.mood === null || !f.moods.includes(day.mood))) {
    return false;
  }
  if (f.taskIds.length > 0 && !day.practices.some((p) => f.taskIds.includes(p.taskId))) {
    return false;
  }
  if (f.dims.length > 0 && !day.practices.some((p) => p.dims.some((d) => f.dims.includes(d)))) {
    return false;
  }
  if (f.subs.length > 0 && !day.practices.some((p) => p.subs.some((s) => f.subs.includes(s)))) {
    return false;
  }
  if (f.tagIds.length > 0 && !day.tagIds.some((t) => f.tagIds.includes(t))) {
    return false;
  }
  if (f.minXp > 0 && day.xp < f.minXp) return false;
  if (f.withRedemption && day.redemptions.length === 0) return false;
  return true;
}

/** Toggle one value inside a facet array — the sheet's only mutation shape. */
export function toggleValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** XP floor stepper. Kept coarse on purpose: a fine slider invites fiddling. */
export const MIN_XP_STEP = 25;
export const MIN_XP_MAX = 200;

export function stepMinXp(current: number, delta: number): number {
  return Math.max(0, Math.min(MIN_XP_MAX, current + delta * MIN_XP_STEP));
}

/**
 * Aggregate of the days that survived — every summary line on the screen reads
 * from this, so the month header, the front context line and the quarter view
 * can never quote different totals for the same filter.
 */
export interface CalendarTotals {
  /** Days that both survived the filter and carry at least one completion. */
  activeDays: number;
  /** Days that survived, whether or not anything was logged. */
  matchedDays: number;
  xp: number;
  coins: number;
  practiceCount: number;
  /** Mean of the mood entries among surviving days; null when none carry one. */
  moodAvg: number | null;
  redemptionCount: number;
  spent: number;
}

export function summarize(days: Iterable<CalendarDay>, f: CalendarFilter): CalendarTotals {
  const totals: CalendarTotals = {
    activeDays: 0,
    matchedDays: 0,
    xp: 0,
    coins: 0,
    practiceCount: 0,
    moodAvg: null,
    redemptionCount: 0,
    spent: 0,
  };
  let moodSum = 0;
  let moodDays = 0;
  for (const day of days) {
    if (!dayMatchesFilter(day, f)) continue;
    totals.matchedDays += 1;
    totals.xp += day.xp;
    totals.coins += day.coins;
    totals.spent += day.spent;
    totals.redemptionCount += day.redemptions.filter((r) => r.kind === 'redeem').length;
    const reps = day.practices.reduce((sum, p) => sum + p.count, 0);
    totals.practiceCount += reps;
    if (reps > 0) totals.activeDays += 1;
    if (day.mood !== null) {
      moodSum += day.mood;
      moodDays += 1;
    }
  }
  totals.moodAvg = moodDays > 0 ? moodSum / moodDays : null;
  return totals;
}
