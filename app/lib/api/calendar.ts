/**
 * The calendar's month feed — one query set, one shape, every surface.
 *
 * The grid, the list, the quarter view and the filter predicate all read the
 * same `CalendarDay` map, so they cannot disagree about what a day contains.
 * That is also what makes switching fronts (Rotina / Humor / Vault) free: no
 * front has a feed of its own, so a chip tap re-renders from cache instead of
 * firing a request.
 *
 * Four reads run in parallel per range:
 *   1. `task_completion` (+ per-sub rows and the task title) — practices & XP
 *   2. `mood_log` — the mood front, and the mood facet of the filter
 *   3. `reward_redemption` by `redeemed_at` — "bought on this day"
 *   4. `reward_redemption` by `used_at`     — "consumed on this day"
 *
 * Reads 3 and 4 are separate on purpose. `reward_redemption` has no local-date
 * column — only two `timestamptz` columns — and one row legitimately produces
 * two events on two different days (redeemed in March, used in April). A single
 * `.or()` over both columns would need a compound PostgREST filter and would
 * still have to be split apart client-side; two plain range queries in the same
 * `Promise.all` cost one round trip together and are obviously correct.
 *
 * Because those two columns are timestamps, their range is built from
 * `startOfLocalDay`/`endOfLocalDay` — comparing them against a 'YYYY-MM-DD' key
 * the way `task_completion.completed_local_date` and `mood_log.logged_for`
 * allow would silently drop the edge days.
 */

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import type {
  CalendarDay,
  CalendarPractice,
  CalendarRedemption,
} from '@/lib/calendar/filters';
import { intensityReference } from '@/lib/calendar/intensity';
import { dimensionForSub } from '@/lib/api/tasks';
import {
  dateKeyFromLocal,
  endOfLocalDay,
  startOfLocalDay,
} from '@/lib/api/history';
import type { DimensionId, MoodLog, SubId } from '@/lib/db/types';
import type { MoodValue } from '@/lib/mood';
import { supabase } from '@/lib/supabase';

/**
 * Nested under `['history']` on purpose. Every retro write in the app —
 * `complete_task`, skip, unskip, undo — already invalidates `historyKeys.all`,
 * and React Query matches by key prefix, so the calendar refreshes itself after
 * a retro-log with no edit to `lib/api/tasks.ts` and no import cycle (this
 * module imports `dimensionForSub` from there).
 *
 * Writes that do NOT pass through those mutations — a mood check-in, a reward
 * redeemed on another screen — are covered by the screen invalidating this key
 * when it regains focus.
 */
export const calendarKeys = {
  all: ['history', 'calendar'] as const,
  range: (fromKey: string, toKey: string) =>
    [...calendarKeys.all, 'range', fromKey, toKey] as const,
};

export interface CalendarRange {
  /** Keyed by local 'YYYY-MM-DD'. Days with nothing at all are absent. */
  days: Map<string, CalendarDay>;
  /**
   * Intensity reference for this range, frozen at fetch time — see
   * `intensityReference`. Lives here so the grid, the quarter view and any
   * legend all quantize against the same number.
   */
  reference: number;
}

/** Shape of the embedded task row PostgREST returns (array or object). */
type Embedded<T> = T | T[] | null;

function unwrap<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * `task_id` is nullable and `template_id` carries the other half: migration
 * 20260517000002 made a completion come from exactly one of the two, so that a
 * catalog template can be logged without adopting it as a personal task. Rows
 * with a null `task_id` are real and present in production — treating the
 * column as the identity would collapse every template completion of a day into
 * one nameless row.
 */
interface CompletionRow {
  id: string;
  task_id: string | null;
  template_id: string | null;
  completed_local_date: string;
  completed_at: string;
  xp_granted: number;
  coins_granted: number;
  task_completion_sub: { sub_id: string; xp_granted: number; coins_granted: number }[] | null;
  task: Embedded<{ id: string; title: string }>;
  // `task_template` is a single-locale catalog — it has `title` and no
  // `title_pt`; asking for one would fail the whole query with a 42703.
  template: Embedded<{ id: string; title: string }>;
}

interface RedemptionRow {
  id: string;
  reward_id: string;
  redeemed_at: string;
  used_at: string | null;
  cost_paid: number;
  reward: Embedded<{ title: string; icon: string | null }>;
}

const REDEMPTION_SELECT =
  'id, reward_id, redeemed_at, used_at, cost_paid, reward:reward_id ( title, icon )';

/** Empty day skeleton — every mutator below assumes these arrays exist. */
function blankDay(dateKey: string): CalendarDay {
  return {
    dateKey,
    xp: 0,
    coins: 0,
    xpByDim: {},
    mood: null,
    hasNote: false,
    tagIds: [],
    practices: [],
    redemptions: [],
    spent: 0,
  };
}

/**
 * Every local day in [from, to] that carries anything, plus the intensity
 * reference for the span. Days are built from four parallel reads and merged
 * client-side; nothing here depends on the caller's front or filter, which is
 * why one cache entry serves all three chips.
 */
export function useCalendarRange(
  from: Date,
  to: Date,
  enabled = true,
): UseQueryResult<CalendarRange, Error> {
  const fromKey = dateKeyFromLocal(from);
  const toKey = dateKeyFromLocal(to);

  return useQuery({
    enabled,
    // Every month is its own key, so without this a month step would drop the
    // query back to `isLoading` and the screen would swap the whole grid for a
    // spinner — collapsing ~700dp to ~100dp, throwing away the scroll position
    // and remounting the summary's expanded state on every arrow tap. Holding
    // the previous month's data keeps the layout mounted; cells are looked up
    // by date key, so the carried-over map yields blank cells rather than wrong
    // paint while the new month lands.
    placeholderData: keepPreviousData,
    queryKey: calendarKeys.range(fromKey, toKey),
    queryFn: async (): Promise<CalendarRange> => {
      const fromIso = startOfLocalDay(from).toISOString();
      const toIso = endOfLocalDay(to).toISOString();

      const [completions, moods, redeemed, used] = await Promise.all([
        supabase
          .from('task_completion')
          .select(
            'id, task_id, template_id, completed_local_date, completed_at, xp_granted, coins_granted, task_completion_sub(sub_id, xp_granted, coins_granted), task:task_id(id, title), template:template_id(id, title)',
          )
          .gte('completed_local_date', fromKey)
          .lte('completed_local_date', toKey)
          .order('completed_at', { ascending: true }),
        supabase
          .from('mood_log')
          .select('*')
          .gte('logged_for', fromKey)
          .lte('logged_for', toKey),
        supabase
          .from('reward_redemption')
          .select(REDEMPTION_SELECT)
          .gte('redeemed_at', fromIso)
          .lte('redeemed_at', toIso),
        supabase
          .from('reward_redemption')
          .select(REDEMPTION_SELECT)
          .not('used_at', 'is', null)
          .gte('used_at', fromIso)
          .lte('used_at', toIso),
      ]);

      if (completions.error) throw completions.error;
      if (moods.error) throw moods.error;
      if (redeemed.error) throw redeemed.error;
      if (used.error) throw used.error;

      const days = new Map<string, CalendarDay>();
      const dayFor = (key: string): CalendarDay => {
        const existing = days.get(key);
        if (existing) return existing;
        const created = blankDay(key);
        days.set(key, created);
        return created;
      };

      // --- practices -------------------------------------------------------
      // Completions collapse per (day, task): logging the same practice twice
      // is one line with a count, not two identical rows.
      const practiceIndex = new Map<string, CalendarPractice>();
      for (const raw of (completions.data ?? []) as unknown as CompletionRow[]) {
        const day = dayFor(raw.completed_local_date);
        day.xp += raw.xp_granted;
        day.coins += raw.coins_granted;

        // One identity for both halves. The two id spaces cannot collide — a
        // task id is a uuid, a template id is a text slug — so this stays a
        // usable key for the practice filter facet. `raw.id` is the last resort
        // so a row that somehow has neither still counts as its own practice
        // instead of merging with every other orphan of the day.
        const sourceId = raw.task_id ?? raw.template_id ?? raw.id;
        const key = `${raw.completed_local_date}::${sourceId}`;
        let practice = practiceIndex.get(key);
        if (!practice) {
          practice = {
            taskId: sourceId,
            title: unwrap(raw.task)?.title ?? unwrap(raw.template)?.title ?? '',
            count: 0,
            xp: 0,
            coins: 0,
            subs: [],
            dims: [],
            at: raw.completed_at,
          };
          practiceIndex.set(key, practice);
          day.practices.push(practice);
        }
        practice.count += 1;
        practice.xp += raw.xp_granted;
        practice.coins += raw.coins_granted;
        if (raw.completed_at > practice.at) practice.at = raw.completed_at;

        for (const sub of raw.task_completion_sub ?? []) {
          const subId = sub.sub_id as SubId;
          // dimensionForSub throws on an unknown sub; a row whose catalog entry
          // was renamed should cost that one dimension chip, not the whole
          // month.
          let dim: DimensionId | null = null;
          try {
            dim = dimensionForSub(subId);
          } catch {
            dim = null;
          }
          if (!practice.subs.includes(subId)) practice.subs.push(subId);
          if (dim) {
            if (!practice.dims.includes(dim)) practice.dims.push(dim);
            // Per-sub XP, not an even split across the task's dimensions: a
            // three-star Strength / one-star Dexterity task is not a 50/50 day.
            day.xpByDim[dim] = (day.xpByDim[dim] ?? 0) + sub.xp_granted;
          }
        }
      }

      // --- mood ------------------------------------------------------------
      for (const row of (moods.data ?? []) as MoodLog[]) {
        const day = dayFor(row.logged_for);
        day.mood = row.mood as MoodValue;
        day.hasNote = !!row.note && row.note.trim().length > 0;
        day.tagIds = row.tags ?? [];
      }

      // --- rewards ---------------------------------------------------------
      const pushRedemption = (
        row: RedemptionRow,
        kind: CalendarRedemption['kind'],
        stamp: string,
      ) => {
        const day = dayFor(dateKeyFromLocal(new Date(stamp)));
        const reward = unwrap(row.reward);
        const cost = kind === 'redeem' ? row.cost_paid : 0;
        day.redemptions.push({
          id: `${row.id}:${kind}`,
          rewardId: row.reward_id,
          title: reward?.title ?? '',
          icon: reward?.icon ?? null,
          cost,
          kind,
          at: stamp,
        });
        day.spent += cost;
      };

      for (const row of (redeemed.data ?? []) as unknown as RedemptionRow[]) {
        pushRedemption(row, 'redeem', row.redeemed_at);
      }
      for (const row of (used.data ?? []) as unknown as RedemptionRow[]) {
        if (row.used_at) pushRedemption(row, 'use', row.used_at);
      }

      for (const day of days.values()) {
        day.practices.sort((a, b) => a.at.localeCompare(b.at));
        day.redemptions.sort((a, b) => a.at.localeCompare(b.at));
      }

      return {
        days,
        reference: intensityReference(
          [...days.values()].map((d) => d.xp),
        ),
      };
    },
  });
}

/** First day of the calendar month containing `d`, at local midnight. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of the calendar month containing `d`, at local end-of-day. */
export function endOfMonth(d: Date): Date {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * The visible month. Deliberately month-scoped rather than grid-scoped: the
 * leading/trailing cells of a 6-week grid belong to neighbouring months and
 * render blank, exactly as the previous heatmap did, so widening the query
 * would buy nothing but a colder cache on every month step.
 */
export function useCalendarMonth(monthDate: Date): UseQueryResult<CalendarRange, Error> {
  return useCalendarRange(startOfMonth(monthDate), endOfMonth(monthDate));
}
