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
 * **Practice, dimension and sub also select WHICH XP counts.** Those three are
 * attributes of the XP itself — where it came from — so with any of them set,
 * every XP figure on the screen (cell, tint, summary, breakdown, list, the XP
 * floor) counts only that scope and says so ("340 XP em Saúde"). Mood, tags and
 * rewards are attributes of the DAY: they pick days and never touch a number.
 * Dimension and sub read as one tree, like the filter sheet draws them — see
 * `areaSubs`. And the two halves agree: a day passes an XP-scope filter exactly
 * when it has XP inside the scope, so a lit cell never shows an empty figure.
 *
 * (Filtering "Saúde" used to light the right days and then print their WHOLE
 * XP — "840 XP · filtrado" over a number that was not filtered. The screen this
 * replaced counted per sub; the unification kept the facets and lost the cut.)
 *
 * Deliberately NOT here: the period. The visible month IS the period — the
 * Dedicação screen's granularity chips (semana/mês/trimestre/total) become
 * navigation (month arrows and the quarter view), not filter state. Keeping
 * period out of this object is what stops the calendar from having two
 * competing notions of "when".
 */

import type { DimensionId, SubId } from '@/lib/db/types';
import type { MoodValue } from '@/lib/mood';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

/** Sub -> its dimension, from the one catalog the whole app draws the tree from. */
const DIM_OF_SUB = new Map<SubId, DimensionId>(
  DIMENSION_ORDER.flatMap((d) => SUBS_BY_DIM[d].map((s) => [s, d] as const)),
);

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
  /**
   * XP of this practice on this day PER SUB, summed across its completions —
   * the finest grain the feed has (practice x sub), straight from the per-sub
   * completion snapshots. Every scoped figure on the screen derives from it.
   * Sums to `xp` exactly: complete_task writes each sub's XP as an integer and
   * the completion total is their sum, never a rounded split.
   */
  xpBySub: Partial<Record<SubId, number>>;
  /** Latest completion timestamp of the day, ISO — drives the day panel order. */
  at: string;
}

/** A reward event on a day. `use` rows carry no cost (the coins left earlier). */
export interface CalendarRedemption {
  id: string;
  /** The reward this came from — the identity the filter facet selects on. */
  rewardId: string;
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
  /**
   * Minimum XP for the day — inside the XP scope when one is set: "Saúde + 50"
   * means 50 XP in Saúde, not 50 XP on a day that merely touched Saúde.
   * 0 = no floor.
   */
  minXp: number;
  /** Keep only days carrying at least one reward event. */
  withRedemption: boolean;
  /**
   * Specific rewards to keep. Empty = any.
   *
   * Not redundant with `withRedemption`: rewards are not only treats. Charging
   * yourself for a cigarette makes the reward a ledger of the habit, and then
   * "which days did I smoke" is a question about ONE reward, not about spending
   * in general.
   */
  rewardIds: string[];
}

export const EMPTY_FILTER: CalendarFilter = {
  moods: [],
  taskIds: [],
  dims: [],
  subs: [],
  tagIds: [],
  minXp: 0,
  withRedemption: false,
  rewardIds: [],
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
    (f.withRedemption ? 1 : 0) +
    (f.rewardIds.length > 0 ? 1 : 0)
  );
}

export function isFilterActive(f: CalendarFilter): boolean {
  return activeFacetCount(f) > 0;
}

// ---------------------------------------------------------------------------
// XP scope
// ---------------------------------------------------------------------------

/**
 * Does the filter say WHERE the XP came from? Practice, dimension and sub are
 * attributes of the XP; mood, tags, the XP floor and rewards are attributes of
 * the day. Only the first kind can narrow a number.
 */
export function hasXpScope(f: CalendarFilter): boolean {
  return f.taskIds.length > 0 || f.dims.length > 0 || f.subs.length > 0;
}

/**
 * The subs an area filter keeps, reading dimensions and subs as ONE tree — the
 * way the filter sheet draws them (a dimension, then its two subs):
 *
 *   a checked sub narrows its own dimension     Saúde + Sono  = Sono
 *   a dimension with no checked sub keeps both  Saúde         = Sono + Nutrição
 *   different branches add up                   Saúde + Força = all three
 *
 * A literal intersection would read "Saúde + Força" as 0 on days that plainly
 * passed; a literal union would ignore the refinement the user just made.
 * `null` = no area facet at all.
 */
export function areaSubs(f: CalendarFilter): Set<SubId> | null {
  if (f.dims.length === 0 && f.subs.length === 0) return null;
  const out = new Set<SubId>(f.subs);
  for (const d of f.dims) {
    const own = SUBS_BY_DIM[d];
    if (!own.some((s) => f.subs.includes(s))) own.forEach((s) => out.add(s));
  }
  return out;
}

/** Does this practice yield XP inside the scope? */
export function practiceInScope(
  p: CalendarPractice,
  f: CalendarFilter,
  area: Set<SubId> | null = areaSubs(f),
): boolean {
  if (f.taskIds.length > 0 && !f.taskIds.includes(p.taskId)) return false;
  return area === null || p.subs.some((s) => area.has(s));
}

/** XP this practice yielded inside the scope. "Treino + Saúde" = the part of
 *  Treino's XP that went to Saúde — exact, because XP is stored per sub. */
export function scopedPracticeXp(
  p: CalendarPractice,
  f: CalendarFilter,
  area: Set<SubId> | null = areaSubs(f),
): number {
  if (f.taskIds.length > 0 && !f.taskIds.includes(p.taskId)) return 0;
  if (area === null) return p.xp;
  let n = 0;
  for (const [s, xp] of Object.entries(p.xpBySub) as [SubId, number | undefined][]) {
    if (area.has(s)) n += xp ?? 0;
  }
  return n;
}

/**
 * The day's XP inside the scope — what every XP figure on the screen prints.
 * Without a scope this is `day.xp`, bit for bit: no filter, and filters on
 * mood, tags or rewards, render exactly as they always did.
 */
export function scopedXp(day: CalendarDay, f: CalendarFilter): number {
  if (!hasXpScope(f)) return day.xp;
  const area = areaSubs(f);
  return day.practices.reduce((n, p) => n + scopedPracticeXp(p, f, area), 0);
}

/** Per-dimension split of `scopedXp` — the "Resumo do mês" breakdown, so its
 *  cards add up to the headline instead of listing the other dimensions. */
export function scopedXpByDim(
  day: CalendarDay,
  f: CalendarFilter,
): Partial<Record<DimensionId, number>> {
  if (!hasXpScope(f)) return day.xpByDim;
  const area = areaSubs(f);
  const out: Partial<Record<DimensionId, number>> = {};
  for (const p of day.practices) {
    if (f.taskIds.length > 0 && !f.taskIds.includes(p.taskId)) continue;
    for (const [s, xp] of Object.entries(p.xpBySub) as [SubId, number | undefined][]) {
      if (area !== null && !area.has(s)) continue;
      const d = DIM_OF_SUB.get(s);
      if (d) out[d] = (out[d] ?? 0) + (xp ?? 0);
    }
  }
  return out;
}

/**
 * The EFFECTIVE scope in words — "Saúde", "Sono", "Treino · Saúde". Saúde +
 * Sono reads "Sono", because Sono is what is being counted. At most two names
 * per group, then "+N". `null` without a scope.
 */
export function xpScopeLabel(
  f: CalendarFilter,
  names: {
    practice: (id: string) => string;
    dim: (d: DimensionId) => string;
    sub: (s: SubId) => string;
  },
): string | null {
  if (!hasXpScope(f)) return null;
  const clip = (list: string[]) =>
    list.length <= 2 ? list.join(' / ') : list.slice(0, 2).join(' / ') + ' +' + (list.length - 2);
  const groups: string[] = [];
  if (f.taskIds.length > 0) groups.push(clip(f.taskIds.map(names.practice)));
  const area: string[] = [];
  for (const d of DIMENSION_ORDER) {
    const checked = SUBS_BY_DIM[d].filter((s) => f.subs.includes(s));
    if (checked.length > 0) area.push(...checked.map(names.sub));
    else if (f.dims.includes(d)) area.push(names.dim(d));
  }
  if (area.length > 0) groups.push(clip(area));
  return groups.join(' · ');
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
  // Practice, dimension and sub are ONE question — "did this day yield XP
  // there?" — so they are answered together (see `areaSubs` for the tree).
  // With a single one of them active this is exactly the old per-facet test:
  // a practice's subs contain a sub of a dimension iff its dims contain that
  // dimension. Combined, it now agrees with the numbers — a day passes iff it
  // has XP inside the scope, so no lit cell ever prints an empty figure.
  if (hasXpScope(f)) {
    const area = areaSubs(f);
    if (!day.practices.some((p) => practiceInScope(p, f, area))) return false;
  }
  if (f.tagIds.length > 0 && !day.tagIds.some((t) => f.tagIds.includes(t))) {
    return false;
  }
  if (f.minXp > 0 && scopedXp(day, f) < f.minXp) return false;
  if (f.withRedemption && day.redemptions.length === 0) return false;
  if (
    f.rewardIds.length > 0 &&
    !day.redemptions.some((r) => f.rewardIds.includes(r.rewardId))
  ) {
    return false;
  }
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
  /** XP of the surviving days — inside the XP scope when one is set. */
  xp: number;
  /** Day level, deliberately NOT scoped: no surface reads it today. Scope it
   *  the same way before putting it on screen next to a scoped XP. */
  coins: number;
  practiceCount: number;
  /** Mean of the mood entries among surviving days; null when none carry one. */
  moodAvg: number | null;
  redemptionCount: number;
  /**
   * Surviving days on which at least one counted reward was **paid for**. With
   * a reward facet active this is the answer to "how many days did I do that" —
   * a different number from `redemptionCount` whenever it happened twice in one
   * day, but never larger than it.
   *
   * Purchases only, deliberately: consuming something banked earlier is a
   * separate event on a separate day (`use_reward` stamps `used_at` whenever it
   * happens), and counting those here would report days you did not do the
   * thing — the exact number this field exists to get right.
   */
  redemptionDays: number;
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
    redemptionDays: 0,
    spent: 0,
  };
  let moodSum = 0;
  let moodDays = 0;
  for (const day of days) {
    if (!dayMatchesFilter(day, f)) continue;
    totals.matchedDays += 1;
    // The fix that motivated the scope: "840 XP · filtrado" used to quote the
    // whole day's XP for a Saúde filter.
    totals.xp += scopedXp(day, f);
    totals.coins += day.coins;

    // With a reward facet active the reward figures narrow to that reward. A
    // day kept because you charged yourself for a cigarette should not also
    // count the pizza you bought the same evening — otherwise "12 days, 19
    // redemptions" reads as smoking more than you did.
    const counted =
      f.rewardIds.length > 0
        ? day.redemptions.filter((r) => f.rewardIds.includes(r.rewardId))
        : day.redemptions;
    const redeems = counted.filter((r) => r.kind === 'redeem');
    totals.redemptionCount += redeems.length;
    totals.spent += redeems.reduce((sum, r) => sum + r.cost, 0);
    // `redeems`, not `counted`: all three figures on the Vault line have to sit
    // on one base, or a month spent consuming the bank reads "4 days · 0
    // redemptions · 0 coins".
    if (redeems.length > 0) totals.redemptionDays += 1;
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
