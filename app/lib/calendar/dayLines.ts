/**
 * A calendar day as LINES — the one builder the Lista view and the day peek
 * share, so the two readings of the same day cannot drift apart.
 *
 * Pure on purpose (no React, no i18n): every figure here is arithmetic over the
 * month feed, and these identities are what the screen promises —
 *
 *   Σ practiceLines(day, f).xp                  = scopedXp(day, f)  (the cell)
 *   scopedXp(day, f) + outsideScope(day, f).xp  = day.xp            (the day)
 *   Σ fitLines(…).shown + hidden.total          = Σ lines           (overflow)
 *
 * The first holds because a practice outside the scope yields 0 inside it, so
 * dropping it from the lines costs the sum nothing.
 */

import {
  areaSubs,
  dimensionOfSub,
  hasXpScope,
  outsideScopeXp,
  practiceInScope,
  scopedPracticeXp,
  type CalendarDay,
  type CalendarFilter,
  type CalendarPractice,
} from '@/lib/calendar/filters';
import type { CalendarFront } from '@/lib/calendar/store';
import type { DimensionId, SubId } from '@/lib/db/types';

/** One practice of one day, as the Lista and the peek print it. */
export interface PracticeLine {
  /** `${dateKey}-${taskId}` — the Lista's row key. */
  key: string;
  taskId: string;
  /** '' when the feed could not resolve a title (a removed practice). */
  title: string;
  /** Completions of this practice on the day; printed as ×N when > 1. */
  count: number;
  /** XP inside the filter's scope when it has one; the practice's whole XP otherwise. */
  xp: number;
  /** The dimension that colours the line — see `railDim`. */
  dim: DimensionId | null;
  /** Latest completion of the day, ISO. */
  at: string;
}

/**
 * The dimension that colours a practice's line: its OWN sub that yielded the
 * most XP inside the scope. Picking "the first of its dimensions whose catalog
 * touches the scope" painted a Força line in Saúde's colour when the practice
 * had Sono (out of scope) and Força (in scope).
 */
function railDim(p: CalendarPractice, area: Set<SubId> | null): DimensionId | null {
  if (area) {
    let best: SubId | null = null;
    let bestXp = -1;
    for (const s of p.subs) {
      if (!area.has(s)) continue;
      const x = p.xpBySub[s] ?? 0;
      if (x > bestXp) {
        best = s;
        bestXp = x;
      }
    }
    const dim = best ? dimensionOfSub(best) : undefined;
    if (dim) return dim;
  }
  return p.dims.length > 0 ? p.dims[0] : null;
}

/**
 * The day's practices as lines, newest first. With an XP scope, a practice
 * that yielded nothing inside it is a line that says nothing, so it is dropped,
 * and the rest carry only their scoped part — which is what makes the lines
 * add up to the number on the cell.
 */
export function practiceLines(day: CalendarDay, filter: CalendarFilter): PracticeLine[] {
  const scoped = hasXpScope(filter);
  const area = scoped ? areaSubs(filter) : null;
  return [...day.practices]
    .filter((p) => !scoped || practiceInScope(p, filter, area))
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((p) => ({
      key: `${day.dateKey}-${p.taskId}`,
      taskId: p.taskId,
      title: p.title,
      count: p.count,
      xp: scoped ? scopedPracticeXp(p, filter, area) : p.xp,
      dim: railDim(p, area),
      at: p.at,
    }));
}

/** Biggest first, ties to the latest — a truncated list keeps what made the day big. */
export function byXpDesc(a: PracticeLine, b: PracticeLine): number {
  return b.xp - a.xp || b.at.localeCompare(a.at);
}

/**
 * The rest of the day, outside the scope: its XP and how many practices earned
 * some of it. A practice split across the scope (Sono in, Força out) is on a
 * line AND counted here — its XP is not: every point lands on exactly one side.
 * `null` without an XP scope, where there is no outside.
 */
export function outsideScope(
  day: CalendarDay,
  filter: CalendarFilter,
): { xp: number; practices: number } | null {
  if (!hasXpScope(filter)) return null;
  const area = areaSubs(filter);
  let xp = 0;
  let practices = 0;
  for (const p of day.practices) {
    const out = outsideScopeXp(p, filter, area);
    if (out > 0) {
      xp += out;
      practices += 1;
    }
  }
  return { xp, practices };
}

/**
 * Fit lines into a fixed number of slots. When they overflow, the last slot
 * becomes a summary of the rest — their count and summed value — so a column
 * of numbers still adds up to the figure above it.
 */
export function fitLines<T>(
  lines: readonly T[],
  slots: number,
  value: (line: T) => number,
): { shown: T[]; hidden: { count: number; total: number } | null } {
  if (lines.length <= slots) return { shown: [...lines], hidden: null };
  const shown = lines.slice(0, slots - 1);
  const rest = lines.slice(slots - 1);
  return {
    shown,
    hidden: { count: rest.length, total: rest.reduce((n, l) => n + value(l), 0) },
  };
}

/** The blocks of the day panel the peek can take the user to. */
export type DayPanelTarget = 'practices' | 'done' | 'mood' | 'rewards';

/**
 * Where "Abrir o dia completo" lands: the active front's block of the day
 * panel. On Rotina that is the Concluídas drawer (opened on the way) when the
 * day has practices — the undo/+1 surface behind the peek's lines — and the
 * retro-log otherwise, where a practice-less day's next action lives.
 */
export function openDayTarget(
  front: CalendarFront,
  day: CalendarDay | undefined,
): DayPanelTarget {
  if (front === 'humor') return 'mood';
  if (front === 'vault') return 'rewards';
  return day && day.practices.length > 0 ? 'done' : 'practices';
}
