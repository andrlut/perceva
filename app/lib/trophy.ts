import type { TaskWithSubs } from '@/lib/db/types';

/**
 * Days since a one-shot was last completed, measured from `now` (or a
 * caller-provided reference date for the History day view). Returns
 * `null` for tasks that have never been completed OR aren't one-shots.
 */
export function daysSinceCompletion(
  task: TaskWithSubs,
  now: Date = new Date(),
): number | null {
  if (task.recurrence.type !== 'one_shot') return null;
  if (!task.lastCompletedAt) return null;
  const last = new Date(task.lastCompletedAt);
  const diff = now.getTime() - last.getTime();
  return Math.floor(diff / 86_400_000); // 24h in ms
}

/**
 * Threshold beyond which a recently-completed one-shot looks "normal"
 * again. 7 days picks up the user's "outra semana" cue — after a week
 * the trophy fades and the task reads as a fresh candidate.
 */
export const TROPHY_DIM_DAYS = 7;

/**
 * True when the task should render in the dimmed "trophy" state — a
 * one-shot completed within the last `TROPHY_DIM_DAYS` days. Same
 * test used by sort comparators so the two stay in sync.
 */
export function isInTrophyWindow(
  task: TaskWithSubs,
  now: Date = new Date(),
): boolean {
  const d = daysSinceCompletion(task, now);
  if (d === null) return false;
  return d >= 0 && d < TROPHY_DIM_DAYS;
}

/**
 * Stable sort comparator for one-shots: fresh (never completed OR
 * older than the trophy window) come first, then trophies sorted by
 * most-recently-completed last. The user wanted the dimmed ones at
 * the BOTTOM of the list.
 */
export function compareOneShotsByFreshness(
  a: TaskWithSubs,
  b: TaskWithSubs,
  now: Date = new Date(),
): number {
  const aTrophy = isInTrophyWindow(a, now);
  const bTrophy = isInTrophyWindow(b, now);
  if (aTrophy !== bTrophy) return aTrophy ? 1 : -1;
  // Both fresh or both trophy — preserve creation order as fallback.
  return a.created_at.localeCompare(b.created_at);
}
