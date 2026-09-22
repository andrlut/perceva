import type { Recurrence, TaskType } from '@/lib/db/types';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * Is the task **scheduled** on the given local date?
 *
 * Scheduling = "show in Today as a reminder". For weekly/monthly with no
 * days/day set, this returns false (no schedule hint, only This Week/Month).
 */
export function isScheduledOn(rec: Recurrence, date: Date): boolean {
  switch (rec.type) {
    case 'daily':
      return true;
    case 'weekly':
      return Array.isArray(rec.days) && rec.days.includes(date.getDay());
    case 'monthly': {
      if (typeof rec.day !== 'number') return false;
      const dayInMonth = date.getDate();
      if (dayInMonth === rec.day) return true;
      // Day > last-day-of-month fallback: a task scheduled for day 31
      // in February runs on day 28/29 instead of silently skipping.
      if (rec.day > 28) {
        const lastDay = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
        ).getDate();
        if (rec.day > lastDay && dayInMonth === lastDay) return true;
      }
      return false;
    }
  }
}

// Backwards-compatible alias — earlier code calls isDueOn. Same semantics
// as isScheduledOn under the new model.
export const isDueOn = isScheduledOn;

/**
 * THE day-contract predicate. One definition of "is this practice still
 * open on local day D", shared by fetchHomeBuckets (today), useDayDetail
 * (Home past day + Calendar) and all-practices.
 *
 *   open(D) ⟺ scheduledOn(D) ∧ completionsOn(D) === 0 ∧ ¬skippedOn(D)
 *
 * `target_count` plays NO part: ONE completion closes the practice for that
 * day, for every recurrence type ("se eu já fiz ela 1x no dia ela precisa
 * sumir"). Extra reps go through the completed drawer's "+1" pill.
 *
 * The PERIOD target is expressed by the SCHEDULE, not by re-listing a card
 * on a day it was already done. Judging a day against a week's count is what
 * made "Trabalho Extra" (3 done on Jul 27, target 5) reappear after every
 * retro completion — and, in the other direction, hid a `weekly [1,3,5]
 * target 1` on Wednesday just because Monday was already logged.
 *
 * isScheduledOn returns true for daily, so this is one expression. Keep it
 * one expression.
 */
export function isOpenOnDay(args: {
  recurrence: Recurrence;
  /** Any time on the local day being judged. */
  day: Date;
  /** Completions whose `completed_local_date` is that day. */
  completionsOnDay: number;
  /** A `task_skip` row exists for (task, that day). */
  skippedOnDay: boolean;
}): boolean {
  return (
    args.completionsOnDay === 0 &&
    !args.skippedOnDay &&
    isScheduledOn(args.recurrence, args.day)
  );
}

/**
 * True when a recurrence behaves as an everyday routine: a plain `daily`,
 * or a `weekly` whose schedule covers all 7 weekdays (which collapses to
 * Daily in the buckets). These are the practices that live on the Hoje
 * screen and are therefore EXCLUDED from the "Todas as práticas" see-all
 * surface. Shared by bucketFor (Manage) and the all-practices filter.
 */
export function isEffectivelyDaily(rec: Recurrence): boolean {
  if (rec.type === 'daily') return true;
  if (rec.type === 'weekly' && (rec.days?.length ?? 0) === 7) return true;
  return false;
}

/**
 * Map a Recurrence to the legacy `task_type` column (kept for compat —
 * `monthly` has no legacy value and rides as `daily`). Shared by the form
 * and the manage screen's periodicity sheet so the two can't disagree.
 */
export function legacyTaskTypeFor(r: Recurrence): TaskType {
  if (r.type === 'weekly') return 'weekly';
  return 'daily';
}

/**
 * Human-readable, LOCALIZED summary of a recurrence. Takes the app's `t`
 * so this module stays free of React; every string lives under the
 * `recurrence.*` i18n block.
 *
 *   short (chip)                          long (card meta line)
 *   daily, n=1        → "Todo dia"        "Todo dia"
 *   daily, n=3        → "3× por dia"      "3× por dia"
 *   weekly, no days   → "3×/sem"          "3× por semana"
 *   weekly, [1,3,5]   → "Seg · Qua · Sex" "3× por semana · Seg, Qua, Sex"
 *   weekly, [1,2,4,5] → "4 dias"          "4× por semana · Seg, Ter, Qui, Sex"
 *   weekly, [1..5]    → "Seg a Sex"       "5× por semana · Seg a Sex"
 *   weekly, [0,6]     → "Fim de semana"   "2× por semana · Fim de semana"
 *   weekly, all 7     → "Todo dia"        "Todo dia"
 *   monthly, day 15   → "Dia 15"          "Uma vez por mês · dia 15"
 *   monthly, no day   → "2×/mês"          "2× por mês"
 */
export function describeRecurrence(
  rec: Recurrence,
  targetCount: number,
  t: Translator,
  opts: { short?: boolean } = {},
): string {
  const short = opts.short === true;
  const count = Math.max(1, targetCount);
  switch (rec.type) {
    case 'daily':
      return count > 1 ? t('recurrence.timesPerDay', { count }) : t('recurrence.everyDay');
    case 'weekly': {
      const days = [...(rec.days ?? [])].sort((a, b) => a - b);
      if (days.length === 7) return t('recurrence.everyDay');
      if (days.length === 0) {
        return short
          ? t('recurrence.perWeekShort', { count })
          : t('recurrence.perWeek', { count });
      }
      const daysLabel = describeWeekdays(days, t, short);
      if (short) return daysLabel;
      return `${t('recurrence.perWeek', { count })} · ${daysLabel}`;
    }
    case 'monthly': {
      if (rec.day) {
        if (short) return t('recurrence.monthDayShort', { day: rec.day });
        const base =
          count === 1 ? t('recurrence.onceAMonth') : t('recurrence.perMonth', { count });
        return `${base} · ${t('recurrence.monthDay', { day: rec.day })}`;
      }
      if (short) return t('recurrence.perMonthShort', { count });
      return count === 1 ? t('recurrence.onceAMonth') : t('recurrence.perMonth', { count });
    }
  }
}

/** "Seg · Qua · Sex" / "Seg, Qua, Sex", with the two everyday shapes named
 *  instead of spelled out: Mon–Fri and the weekend. `days` sorted, 0=Sun.
 *  The short form has ~92px in the manage chip: three names fit, four do
 *  not, so from four days on it says "4 dias" rather than clipping the
 *  last one — a chip must always name something true. */
function describeWeekdays(days: number[], t: Translator, short: boolean): string {
  const key = days.join(',');
  if (key === '1,2,3,4,5') return t('recurrence.weekdaysMonFri');
  if (key === '0,6') return t('recurrence.weekend');
  if (short && days.length >= 4) return t('recurrence.daysShort', { count: days.length });
  const names = t('recurrence.weekdaysShort').split(',');
  const labels = days.map((d) => names[d]).filter(Boolean);
  return labels.join(short ? ' · ' : ', ');
}

/**
 * Parse a recurrence value coming from the DB; defaults to daily on garbage.
 * A legacy `one_shot` (the type retired on 2026-09-22; migration
 * 20260922000004 rewrote every row) reads as flex weekly: "do it once,
 * whenever" never sat on Hoje, and flex weekly is the shape that keeps it
 * off Hoje — a stale bundle must not turn an old one-off into a daily.
 */
export function parseRecurrence(raw: unknown): Recurrence {
  if (raw && typeof raw === 'object' && 'type' in raw) {
    const r = raw as { type: string; days?: number[]; day?: number };
    if (r.type === 'one_shot') return { type: 'weekly' };
    if (r.type === 'daily') return { type: 'daily' };
    if (r.type === 'weekly') {
      const days = Array.isArray(r.days)
        ? r.days.filter((d) => d >= 0 && d <= 6)
        : undefined;
      // Empty array collapses to "no schedule" semantically.
      return days && days.length > 0 ? { type: 'weekly', days } : { type: 'weekly' };
    }
    if (r.type === 'monthly') {
      const day =
        typeof r.day === 'number' && r.day >= 1 && r.day <= 31 ? r.day : undefined;
      return day ? { type: 'monthly', day } : { type: 'monthly' };
    }
  }
  return { type: 'daily' };
}
