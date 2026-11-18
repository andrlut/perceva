import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DimensionId } from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

import { aiKeys } from './ai';
import { dateKeyFromLocal } from './history';

/**
 * "Resumo da semana" — the week that closed (Monday to Sunday, in the
 * device's timezone), in exact numbers from the `week_summary` RPC (no AI,
 * same for everyone), plus the AI's 3 observations and 1 suggestion for
 * Premium (Edge Function `perceva-ai`, action `week`, cached server-side in
 * `week_insight` — generated once per week).
 *
 * Rewards can be a PENALTY here (the owner pays coins to smoke or drink), so
 * the reward block speaks in DAYS since the last redemption and the screen
 * never celebrates one.
 */

export interface WeekCmp {
  this: number;
  /** null when the account did not exist the week before. */
  prev: number | null;
  /** Average of the 4 weeks before (or as many as the account lived). */
  avg4: number | null;
}

export type DayState = 'complete' | 'cleared' | 'settled' | 'none' | 'open' | 'future';

export interface WeekSummary {
  week: {
    start: string;
    end: string;
    today: string;
    tz: string;
    complete: boolean;
    days_elapsed: number;
    first_week: string;
    avg_weeks: number;
  };
  practices: {
    completions: WeekCmp;
    active_days: WeekCmp;
    by_dimension: { dimension_id: DimensionId; completions: WeekCmp; xp: WeekCmp }[];
    coins_only: number;
  };
  dedication: { xp: WeekCmp };
  days: {
    closed: WeekCmp;
    complete: number;
    list: { date: string; state: DayState; done: number; skipped: number; open: number }[];
  };
  coins: { earned: WeekCmp; spent: WeekCmp; balance: number | null };
  rewards: {
    reward_id: string;
    title: string;
    icon: string | null;
    times: number;
    coins: number;
    last_in_week: string;
    days_since_last: number;
    days_without_before: number | null;
    previous_best_gap_days: number | null;
    is_longest_streak_ever: boolean;
    redemptions_total: number;
  }[];
  mood: {
    days_logged: number;
    avg: { this: number | null; prev: number | null; avg4: number | null };
    best: { date: string; mood: number } | null;
    worst: { date: string; mood: number } | null;
    days: { date: string; mood: number }[];
    top_tags: {
      tag: string;
      label_pt: string | null;
      label_en: string | null;
      valence: number | null;
      days: number;
    }[];
  };
  life: null | {
    scenes: { n: number; text: string; dimension_id: DimensionId; completions: number }[];
    in_scenes: number;
    total: number;
  };
}

export interface WeekInsight {
  week_start: string;
  locale: 'pt' | 'en';
  observations: string[];
  suggestion: { title: string; why: string; dimension_id: DimensionId } | null;
  created_at: string;
}

export type WeekInsightFailure =
  | 'week_open'
  | 'premium_required'
  | 'too_old'
  | 'empty_week'
  | 'no_consent'
  | 'not_allowed'
  | 'disabled'
  | 'rate_minute'
  | 'rate_day'
  | 'rate_month'
  | 'budget'
  | 'ai_failed'
  | 'not_configured'
  | 'server'
  | 'network';

export type WeekInsightResult =
  | { ok: true; cached: boolean; insight: WeekInsight }
  | { ok: false; reason: WeekInsightFailure };

export const weekSummaryKeys = {
  all: ['weekSummary'] as const,
  summary: (start: string) => [...weekSummaryKeys.all, 'summary', start] as const,
  insight: (start: string) => [...weekSummaryKeys.all, 'insight', start] as const,
};

// ─── Dates ───────────────────────────────────────────────────────────────────

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Monday (YYYY-MM-DD, local) of the week that contains `d`. */
export function mondayOf(d: Date): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  const isoDow = (local.getDay() + 6) % 7; // Monday = 0
  local.setDate(local.getDate() - isoDow);
  return dateKeyFromLocal(local);
}

export function shiftWeek(start: string, weeks: number): string {
  const d = parseKey(start);
  d.setDate(d.getDate() + weeks * 7);
  return dateKeyFromLocal(d);
}

/** The week that closed most recently — what Monday's summary is about. */
export function lastClosedWeek(now = new Date()): string {
  return shiftWeek(mondayOf(now), -1);
}

/** The device's IANA zone; the server falls back to São Paulo on anything odd. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export function useWeekSummary(start: string) {
  return useQuery({
    queryKey: weekSummaryKeys.summary(start),
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<WeekSummary> => {
      const { data, error } = await supabase.rpc('week_summary', {
        p_week_start: start,
        p_tz: deviceTimeZone(),
      });
      if (error) throw error;
      return data as WeekSummary;
    },
  });
}

/** The cached observations of a week, or null. RLS: own rows only. */
export function useWeekInsight(start: string, enabled: boolean) {
  return useQuery({
    queryKey: weekSummaryKeys.insight(start),
    enabled,
    staleTime: Infinity,
    queryFn: async (): Promise<WeekInsight | null> => {
      const { data, error } = await supabase
        .from('week_insight')
        .select('week_start,locale,observations,suggestion,created_at')
        .eq('week_start', start)
        .limit(1);
      if (error) throw error;
      return (data?.[0] as WeekInsight | undefined) ?? null;
    },
  });
}

/** Asks the AI for the week's observations (Premium). Resolves with the
 *  insight or a typed failure — never throws for a business outcome. */
export function useGenerateWeekInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { start: string; locale: string }): Promise<WeekInsightResult> => {
      const { data, error } = await supabase.functions.invoke('perceva-ai', {
        body: {
          action: 'week',
          week_start: params.start,
          locale: params.locale === 'en' ? 'en' : 'pt',
          tz: deviceTimeZone(),
        },
      });
      if (error || !data) return { ok: false, reason: 'network' };
      return data as WeekInsightResult;
    },
    onSuccess: (res, params) => {
      if (res.ok) qc.setQueryData(weekSummaryKeys.insight(params.start), res.insight);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: aiKeys.access() }),
  });
}
