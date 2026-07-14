/**
 * Mood ↔ activity correlation math — pure, UI-agnostic. The unit is the local
 * calendar day; both mood (mood_log.logged_for) and activity
 * (task_completion.completed_local_date) key on the same stored local date, so
 * the join is a simple day merge with no timezone drift.
 *
 * Guiding principles (from Bearable/Exist/How We Feel research):
 *  - Rank by LIFT (present-vs-absent), never raw frequency — ubiquitous habits
 *    top a count list regardless of effect.
 *  - Gate every output behind a minimum sample; below it, show progress, not a
 *    conclusion.
 *  - Confidence (sample size) is reported SEPARATELY from effect strength.
 *  - Universe for any "feeling" question = days that actually have a mood log
 *    (a day with activity but no mood is N/A, excluded from mood aggregates).
 *  - Co-occurrence, not causation.
 */

import type { MoodLog, SubId } from '@/lib/db/types';

export interface DayActivity {
  /** Subs practiced that day (had a completion granting XP). */
  subs: Set<SubId>;
  xp: number;
}

export interface DayRecord {
  dateKey: string;
  /** 1-5, or null when no mood logged that day. */
  mood: number | null;
  tags: string[];
  subs: Set<SubId>;
  xp: number;
}

/** Need this many mood-logged days before showing ANY insight. */
export const MIN_MOOD_DAYS = 10;
/** A "feeling" group (e.g. Ótimo days) needs at least this many days. */
export const MIN_MATCH_DAYS = 5;
/** A sub needs at least this many co-occurrences to be ranked. */
export const MIN_CO_OCCUR = 3;
/** Por-atividade: minimum days with / without the sub to compare. */
export const MIN_WITH = 3;
export const MIN_WITHOUT = 3;

export function buildDayRecords(
  activity: Map<string, DayActivity>,
  moods: Map<string, MoodLog>,
): DayRecord[] {
  const keys = new Set<string>([...activity.keys(), ...moods.keys()]);
  const out: DayRecord[] = [];
  for (const k of keys) {
    const a = activity.get(k);
    const m = moods.get(k);
    out.push({
      dateKey: k,
      mood: m?.mood ?? null,
      tags: m?.tags ?? [],
      subs: a?.subs ?? new Set<SubId>(),
      xp: a?.xp ?? 0,
    });
  }
  return out;
}

/** 1-5 confidence dots from sample size (co-occurrences), capped. */
export function confidenceDots(sample: number): number {
  if (sample <= 0) return 0;
  if (sample < 4) return 1;
  if (sample < 7) return 2;
  if (sample < 11) return 3;
  if (sample < 16) return 4;
  return 5;
}

export interface FeelingLiftRow {
  subId: SubId;
  /** matchFreq / otherFreq. Infinity when the sub only appears on match days. */
  lift: number;
  matchFreq: number;
  coOccur: number;
  confidence: number;
}

export interface ByFeelingResult {
  rows: FeelingLiftRow[];
  matchN: number;
  moodDays: number;
  /** True when there's enough data to trust the ranking. */
  enough: boolean;
}

/**
 * "Ver por humor/sentimento": given a predicate selecting feeling-days (mood
 * band OR a tag), rank subs by how much more they appear on those days vs the
 * rest of the mood-logged days.
 */
export function computeByFeeling(
  records: DayRecord[],
  match: (r: DayRecord) => boolean,
): ByFeelingResult {
  const moodRecords = records.filter((r) => r.mood !== null);
  const moodDays = moodRecords.length;
  const matchDays = moodRecords.filter(match);
  const otherDays = moodRecords.filter((r) => !match(r));
  const matchN = matchDays.length;
  const otherN = otherDays.length;

  const enough = moodDays >= MIN_MOOD_DAYS && matchN >= MIN_MATCH_DAYS;
  if (!enough) return { rows: [], matchN, moodDays, enough };

  const allSubs = new Set<SubId>();
  moodRecords.forEach((r) => r.subs.forEach((s) => allSubs.add(s)));

  const rows: FeelingLiftRow[] = [];
  for (const sub of allSubs) {
    const coOccur = matchDays.filter((r) => r.subs.has(sub)).length;
    if (coOccur < MIN_CO_OCCUR) continue;
    const matchFreq = coOccur / matchN;
    const otherFreq =
      otherN > 0 ? otherDays.filter((r) => r.subs.has(sub)).length / otherN : 0;
    const lift =
      otherFreq > 0 ? matchFreq / otherFreq : matchFreq > 0 ? Infinity : 0;
    rows.push({
      subId: sub,
      lift,
      matchFreq,
      coOccur,
      confidence: confidenceDots(coOccur),
    });
  }
  rows.sort((a, b) => b.lift - a.lift);
  return { rows, matchN, moodDays, enough };
}

export interface SubMoodStats {
  subId: SubId;
  withN: number;
  withoutN: number;
  avgWith: number;
  avgWithout: number;
  delta: number;
  topTags: { slug: string; count: number }[];
  confidence: number;
  enough: boolean;
  moodDays: number;
}

/**
 * "Ver por atividade": for a chosen sub, average mood on days you practiced it
 * vs days you didn't, plus the tags that most co-occur with it.
 */
export function computeBySub(records: DayRecord[], sub: SubId): SubMoodStats {
  const moodRecords = records.filter((r) => r.mood !== null);
  const withDays = moodRecords.filter((r) => r.subs.has(sub));
  const withoutDays = moodRecords.filter((r) => !r.subs.has(sub));
  const avg = (arr: DayRecord[]) =>
    arr.length ? arr.reduce((s, r) => s + (r.mood as number), 0) / arr.length : 0;
  const avgWith = avg(withDays);
  const avgWithout = avg(withoutDays);

  const tagCount = new Map<string, number>();
  withDays.forEach((r) =>
    r.tags.forEach((tg) => tagCount.set(tg, (tagCount.get(tg) ?? 0) + 1)),
  );
  const topTags = [...tagCount.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const enough =
    moodRecords.length >= MIN_MOOD_DAYS &&
    withDays.length >= MIN_WITH &&
    withoutDays.length >= MIN_WITHOUT;

  return {
    subId: sub,
    withN: withDays.length,
    withoutN: withoutDays.length,
    avgWith,
    avgWithout,
    delta: avgWith - avgWithout,
    topTags,
    confidence: confidenceDots(withDays.length),
    enough,
    moodDays: moodRecords.length,
  };
}
