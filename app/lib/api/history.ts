import { useQuery } from '@tanstack/react-query';

import { dimensionForSub } from '@/lib/api/tasks';
import type { SubId, TaskSub, TaskWithSubs } from '@/lib/db/types';
import { isOpenOnDay, parseRecurrence } from '@/lib/recurrence';
import type { WeekStart } from '@/lib/settings';
import { supabase } from '@/lib/supabase';

export const historyKeys = {
  all: ['history'] as const,
  daily: (fromKey: string, toKey: string) =>
    [...historyKeys.all, 'daily', fromKey, toKey] as const,
  day: (dateKey: string, weekStart: WeekStart = 'monday') =>
    [...historyKeys.all, 'day', dateKey, weekStart] as const,
};

export interface DailySummaryEntry {
  /** Local-date key in `YYYY-MM-DD` form — the stored `completed_local_date`. */
  dateKey: string;
  totalXp: number;
  totalCoins: number;
  completionCount: number;
  /** XP per sub actually practiced that day, from the completion snapshots. */
  bySub: Partial<Record<SubId, number>>;
}

interface CompletionTaskJoin {
  id: string;
  title: string;
}

interface CompletionSubJoin {
  sub_id: string;
  stars: number;
  xp_granted: number;
  coins_granted: number;
}

interface DailyCompletionRow {
  id: string;
  task_id: string;
  completed_at: string;
  xp_granted: number;
  coins_granted: number;
  total_stars: number;
  task_completion_sub: CompletionSubJoin[] | null;
  task: CompletionTaskJoin | null;
}

/**
 * Convert a Date to a "YYYY-MM-DD" key in the device's *local* timezone.
 * Local-day keys are how the user thinks about days, not UTC.
 */
export function dateKeyFromLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Dias inteiros entre duas chaves 'YYYY-MM-DD'.
 *
 * Via Date.UTC de propósito: as chaves já foram resolvidas no fuso local
 * por `dateKeyFromLocal`, então reinterpretá-las como datas locais aqui
 * reintroduziria o horário de verão na subtração.
 */
export function daysBetweenKeys(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy!, fm! - 1, fd!);
  const b = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((b - a) / 86400000);
}

/** Local start-of-day for the given date. */
export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Local end-of-day for the given date (next day's 00:00 minus 1 ms). */
export function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Aggregate completions per local day across [from, to]. Used to render
 * the History calendar heatmap. Per-sub XP comes from the completion
 * snapshots so multi-sub tasks split honestly across pillars.
 *
 * Grouping is on the stored `completed_local_date`, not on `completed_at`
 * re-derived client-side: `mood_log.logged_for` and the Dedicação windows
 * both key off that column, so a late-evening completion has to land in
 * the same cell as the mood the user logged for the same day.
 */
export function useDailySummary(from: Date, to: Date) {
  const fromKey = dateKeyFromLocal(from);
  const toKey = dateKeyFromLocal(to);

  return useQuery({
    queryKey: historyKeys.daily(fromKey, toKey),
    queryFn: async (): Promise<Map<string, DailySummaryEntry>> => {
      const { data: completions, error: compErr } = await supabase
        .from('task_completion')
        .select(
          'id, completed_local_date, xp_granted, coins_granted, task_completion_sub(sub_id, xp_granted)',
        )
        .gte('completed_local_date', fromKey)
        .lte('completed_local_date', toKey);
      if (compErr) throw compErr;

      const map = new Map<string, DailySummaryEntry>();
      ((completions ?? []) as unknown as Array<{
        id: string;
        completed_local_date: string;
        xp_granted: number;
        coins_granted: number;
        task_completion_sub: { sub_id: string; xp_granted: number }[] | null;
      }>).forEach((c) => {
        const key = c.completed_local_date;
        const entry = map.get(key) ?? {
          dateKey: key,
          totalXp: 0,
          totalCoins: 0,
          completionCount: 0,
          bySub: {},
        };
        entry.totalXp += c.xp_granted;
        entry.totalCoins += c.coins_granted;
        entry.completionCount += 1;
        for (const subRow of c.task_completion_sub ?? []) {
          const sub = subRow.sub_id as SubId;
          entry.bySub[sub] = (entry.bySub[sub] ?? 0) + subRow.xp_granted;
        }
        map.set(key, entry);
      });

      return map;
    },
  });
}

export interface DayCompletion {
  id: string;
  taskId: string;
  taskTitle: string;
  /** Per-sub stars actually used, pulled from the snapshot. */
  subs: TaskSub[];
  /** Sum of stars across subs (cached on the row). */
  totalStars: number;
  xpGranted: number;
  coinsGranted: number;
  completedAt: string;
}

/**
 * Rebuild a minimal renderable task purely from a completion snapshot, for
 * rows whose live task is no longer in the active list — it was archived,
 * or deleted outright. The snapshot already carries everything a completed
 * row needs to draw (title + subs → primary dimension), so an archived
 * task's past completions keep rendering (and stay undoable) instead of
 * silently vanishing from the drawer while the day's XP hero still counts
 * their XP. The non-visual fields are placeholders; only `title`, `id`, and
 * the derived `primary_dimension_id` reach the UI.
 */
export function taskFromCompletionSnapshot(c: DayCompletion): TaskWithSubs {
  const subs = c.subs; // already sorted stars-desc by useDayDetail
  const primary = subs[0]?.sub_id ?? ('sleep' as SubId);
  return {
    id: c.taskId,
    character_id: '',
    title: c.taskTitle,
    description: null,
    task_type: 'one_shot',
    recurrence: { type: 'one_shot' },
    target_count: 1,
    is_archived: true,
    created_at: c.completedAt,
    updated_at: c.completedAt,
    template_id: null,
    icon: null,
    subs,
    primary_sub_id: primary,
    primary_dimension_id: dimensionForSub(primary),
    total_stars: c.totalStars,
  };
}

export interface DayDetail {
  dateKey: string;
  completions: DayCompletion[];
  /**
   * Practices still open on this day — candidates for (retro) logging.
   *
   * Decided by the single shared predicate `isOpenOnDay`: scheduled on the
   * day AND zero completions on the day AND not skipped on the day. The
   * schedule filter lives HERE (it used to be re-applied, identically, by
   * every consumer) so this list is directly renderable; consumers only
   * strip one-shots when their surface doesn't show them.
   */
  openTasks: TaskWithSubs[];
  /** Tasks skipped on this specific day (task_skip rows). Each entry is
   *  hydrated to the live task; rows whose task no longer exists are
   *  filtered out. Used by the History "Skipped" drawer and the day
   *  stats row. */
  skipped: TaskWithSubs[];
  totalXp: number;
  totalCoins: number;
}

interface TaskRowFull {
  id: string;
  character_id: string;
  title: string;
  description: string | null;
  task_type: 'one_shot' | 'daily' | 'weekly';
  recurrence: unknown;
  target_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  template_id: string | null;
  icon: string | null;
  task_sub: { sub_id: string; stars: number }[] | null;
}

function hydrateTask(raw: TaskRowFull, recurrence: TaskWithSubs['recurrence']): TaskWithSubs {
  const subs: TaskSub[] = (raw.task_sub ?? [])
    .map((r) => ({
      sub_id: r.sub_id as SubId,
      stars: Math.max(1, Math.min(5, r.stars)) as TaskSub['stars'],
    }))
    .sort((a, b) => b.stars - a.stars);
  const primary = subs[0]?.sub_id ?? ('sleep' as SubId);
  const totalStars = subs.reduce((s, x) => s + x.stars, 0);
  return {
    id: raw.id,
    character_id: raw.character_id,
    title: raw.title,
    description: raw.description,
    task_type: raw.task_type,
    recurrence,
    target_count: raw.target_count ?? 1,
    is_archived: raw.is_archived,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    template_id: raw.template_id,
    icon: raw.icon,
    subs,
    primary_sub_id: primary,
    primary_dimension_id: dimensionForSub(primary),
    total_stars: totalStars,
  };
}

/**
 * For a single local day: the completions logged that day plus the
 * currently-active tasks that haven't been completed for that day yet
 * (retro-logging candidates).
 */
export function useDayDetail(date: Date, weekStart: WeekStart = 'monday') {
  const dayEnd = endOfLocalDay(date);
  const dateKey = dateKeyFromLocal(date);

  return useQuery({
    queryKey: historyKeys.day(dateKey, weekStart),
    queryFn: async (): Promise<DayDetail> => {
      const { data: comps, error: compErr } = await supabase
        .from('task_completion')
        .select(
          'id, task_id, completed_at, xp_granted, coins_granted, total_stars, task_completion_sub(sub_id, stars, xp_granted, coins_granted), task:task_id(id, title)',
        )
        .eq('completed_local_date', dateKey)
        .order('completed_at', { ascending: true });
      if (compErr) throw compErr;

      const compRows = (comps ?? []) as unknown as DailyCompletionRow[];

      const completions: DayCompletion[] = compRows.map((c) => {
        const subs: TaskSub[] = (c.task_completion_sub ?? [])
          .map((s) => ({
            sub_id: s.sub_id as SubId,
            stars: Math.max(1, Math.min(5, s.stars)) as TaskSub['stars'],
          }))
          .sort((a, b) => b.stars - a.stars);
        return {
          id: c.id,
          taskId: c.task_id,
          taskTitle: c.task?.title ?? '(deleted task)',
          subs,
          totalStars: c.total_stars ?? subs.reduce((s, x) => s + x.stars, 0),
          xpGranted: c.xp_granted,
          coinsGranted: c.coins_granted,
          completedAt: c.completed_at,
        };
      });

      const completionCountThisDay = new Map<string, number>();
      compRows.forEach((c) => {
        completionCountThisDay.set(
          c.task_id,
          (completionCountThisDay.get(c.task_id) ?? 0) + 1,
        );
      });

      // Active tasks created on or before this day. Ordered by the
      // user's drag-reorder sort_order (set on the /tasks Alocadas
      // screen) so the History day view follows the same sequence as
      // the home buckets — created_at is the defensive tiebreaker.
      const { data: tasks, error: taskErr } = await supabase
        .from('task')
        .select('*, task_sub(sub_id, stars)')
        .eq('is_archived', false)
        .lte('created_at', dayEnd.toISOString())
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (taskErr) throw taskErr;

      const taskRows = (tasks ?? []) as TaskRowFull[];
      const oneShotIds = taskRows
        .filter((t) => parseRecurrence(t.recurrence).type === 'one_shot')
        .map((t) => t.id);
      /** Latest completion per one-shot — used for the trophy dim
       *  behavior (matches useHomeBuckets). */
      const oneShotLatest = new Map<string, string>();
      if (oneShotIds.length > 0) {
        const { data: anyComp, error: anyErr } = await supabase
          .from('task_completion')
          .select('task_id, completed_at')
          .in('task_id', oneShotIds)
          .order('completed_at', { ascending: false });
        if (anyErr) throw anyErr;
        (anyComp ?? []).forEach((c) => {
          if (!oneShotLatest.has(c.task_id)) {
            oneShotLatest.set(c.task_id, c.completed_at);
          }
        });
      }

      // Skips for the selected day — tasks the user explicitly opted
      // out of go to the Skipped drawer, not the open list.
      const { data: skipsThisDay, error: skipDayErr } = await supabase
        .from('task_skip')
        .select('task_id')
        .eq('skipped_for', dateKey);
      if (skipDayErr) throw skipDayErr;
      const skippedThisDayIds = new Set(
        (skipsThisDay ?? []).map((s) => s.task_id),
      );

      // One completion on the day closes the practice for that day, for
      // every recurrence type — the same predicate fetchHomeBuckets uses
      // for today, so the two surfaces cannot drift. This used to ask a
      // PERIOD question here ("doneWeek < target"), which is what kept a
      // weekly target-5 practice on the list after it was already logged
      // three times that day.
      const openTasks: TaskWithSubs[] = taskRows
        .map((t) => ({ raw: t, recurrence: parseRecurrence(t.recurrence) }))
        .filter(({ raw, recurrence }) =>
          isOpenOnDay({
            recurrence,
            day: date,
            completionsOnDay: completionCountThisDay.get(raw.id) ?? 0,
            skippedOnDay: skippedThisDayIds.has(raw.id),
          }),
        )
        .map(({ raw, recurrence }) => {
          const task = hydrateTask(raw, recurrence);
          if (recurrence.type === 'one_shot') {
            task.lastCompletedAt = oneShotLatest.get(raw.id) ?? null;
          }
          return task;
        });

      // Hydrate skip rows for the Skipped drawer — reuses the same
      // skippedThisDayIds set already fetched for the openTasks filter.
      const tasksById = new Map(
        taskRows.map((t) => [t.id, hydrateTask(t, parseRecurrence(t.recurrence))]),
      );
      const skipped: TaskWithSubs[] = [];
      for (const id of skippedThisDayIds) {
        const t = tasksById.get(id);
        if (t) skipped.push(t);
      }

      const totalXp = completions.reduce((s, c) => s + c.xpGranted, 0);
      const totalCoins = completions.reduce((s, c) => s + c.coinsGranted, 0);

      return { dateKey, completions, openTasks, skipped, totalXp, totalCoins };
    },
  });
}
