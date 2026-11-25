import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { todayDateKey } from './mood';

/**
 * The app's native AI (Edge Function `perceva-ai`). First feature: "Conte seu
 * dia" — the person dictates the day, the AI returns a DRAFT (mood, tags,
 * note, practices done/skipped today) and the app writes only after the tap
 * on Registrar, with the hooks it already has. Nothing here writes data.
 *
 * Gate: `ai_access()` says whether this account has the AI at all (the
 * `ai` row of app_config, server-only: kill-switch + Premium once
 * `premium_open` is on, the allowlist before that), whether the person
 * accepted the consent, and the AI CREDITS: 40 a month for Premium, renewed
 * on the 1st (America/Sao_Paulo) without rolling over, plus — later — the
 * balance of bought packs. Each feature has a price (`credit_cost`: Conte
 * seu dia = 1, Resumo da semana = 0). Only a request that produced a draft
 * spends: a failure or "didn't understand" gives the credit back.
 * Migration 20261125000001.
 */

export const aiKeys = {
  all: ['ai'] as const,
  access: () => [...aiKeys.all, 'access'] as const,
};

/**
 * The consent text version this build shows (components/dayVoice/AiConsent).
 * Bump it together with a material change of that text AND the server's
 * `consent_version` (app_config `ai`): whoever accepted an older text sees the
 * screen again.
 */
// 2 (18/11/2026): the text now covers the "Resumo da semana" — the week's
// numbers, mood notes and redeemed rewards go to the model, and the AI's
// observations are kept for the person (migration 20261118000005).
export const AI_CONSENT_VERSION = 2;

export interface AiAccess {
  enabled: boolean;
  /** A current consent (LGPD) is on file. Without it the server refuses. */
  consent?: boolean;
  consent_version?: number;
  used_today?: number;
  per_day?: number;
  /** This month's credits spent / granted (America/Sao_Paulo). The builds
   *  before the credits read only these two, so they stay. */
  used_month?: number;
  per_month?: number;
  /** Everything the person can spend now: what is left of the month plus
   *  the paid balance (packs, none sold yet). */
  credits_left?: number;
  /** The month's credits (the grant), e.g. 40. */
  credits_month?: number;
  credits_month_left?: number;
  credits_paid?: number;
  /** Credits per request, by feature (`day_voice`, `week`). */
  credit_cost?: Record<string, number>;
  /** The day the month's credits renew (YYYY-MM-DD). */
  renews_on?: string;
  max_chars?: number;
}

export function useAiAccess() {
  return useQuery({
    queryKey: aiKeys.access(),
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<AiAccess> => {
      const { data, error } = await supabase.rpc('ai_access');
      if (error) throw error;
      return (data ?? { enabled: false }) as AiAccess;
    },
  });
}

export interface DayVoicePractice {
  task_id: string;
  title: string;
  icon: string | null;
}

export interface DayVoiceDraft {
  date: string;
  mood: { value: number | null; tags: string[] } | null;
  note: string | null;
  complete: DayVoicePractice[];
  skip: DayVoicePractice[];
}

export type DayVoiceFailure =
  | 'disabled'
  | 'not_allowed'
  | 'no_consent'
  | 'rate_minute'
  | 'rate_day'
  | 'rate_month'
  | 'budget'
  | 'too_long'
  | 'empty_text'
  | 'not_understood'
  | 'ai_failed'
  | 'not_configured'
  | 'network';

export type DayVoiceResult =
  | {
      ok: true;
      request_id: string;
      draft: DayVoiceDraft;
      remark: string | null;
      lines: number;
      used_today?: number;
      per_day?: number;
      used_month?: number;
      per_month?: number;
      credits_left?: number;
      credits_month?: number;
    }
  | {
      ok: false;
      /** `rate_month` = no AI credits left (the month's and the paid). */
      reason: DayVoiceFailure;
      remark?: string | null;
      used_today?: number;
      per_day?: number;
      used_month?: number;
      per_month?: number;
      credits_left?: number;
      credits_month?: number;
      max_chars?: number;
    };

/** Sends the transcript; resolves with the draft or a typed failure (never
 *  throws for a business outcome, so the screen maps every reason to copy). */
export function useDayVoiceDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { text: string; locale: string }): Promise<DayVoiceResult> => {
      const { data, error } = await supabase.functions.invoke('perceva-ai', {
        body: {
          action: 'day_voice',
          text: params.text,
          today: todayDateKey(),
          locale: params.locale === 'en' ? 'en' : 'pt',
        },
      });
      if (error || !data) return { ok: false, reason: 'network' };
      return data as DayVoiceResult;
    },
    // The quota moved (or came back): refresh the counter under the box.
    onSettled: () => qc.invalidateQueries({ queryKey: aiKeys.access() }),
  });
}

/**
 * The card's assertiveness metrics — numbers only, never text: how many
 * lines the AI proposed, how many the person unchecked, how many they
 * changed, and whether they confirmed without touching anything. Once per
 * request, own requests only (the RPC checks both). Fire and forget.
 */
export function recordAiOutcome(params: {
  requestId: string;
  proposed: number;
  unchecked: number;
  edited: number;
}): void {
  supabase
    .rpc('ai_record_outcome', {
      p_ref: params.requestId,
      p_proposed: params.proposed,
      p_unchecked: params.unchecked,
      p_edited: params.edited,
      p_untouched: params.unchecked === 0 && params.edited === 0,
    })
    .then(({ error }) => {
      if (error && __DEV__) console.warn('ai_record_outcome', error.message);
    });
}

/**
 * The LGPD consent. What the person tells about the day (sleep, mood,
 * smoking…) is health data, so nothing reaches the model before an explicit
 * yes on the consent screen — the server checks it on every request
 * (ai_begin → `no_consent`). Granting records the text version the person
 * read; revoking (Ajustes) keeps the record as proof and switches the AI off.
 */
export function useGrantAiConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ ok: boolean; reason?: string }> => {
      const { data, error } = await supabase.rpc('ai_consent_grant', { p_version: AI_CONSENT_VERSION });
      if (error) throw error;
      return (data ?? { ok: false }) as { ok: boolean; reason?: string };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: aiKeys.access() }),
  });
}

export function useRevokeAiConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.rpc('ai_consent_revoke');
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: aiKeys.access() }),
  });
}

/**
 * AI credits the person can spend now (`left`) out of the month's grant
 * (`total`), or null before the access loads. `left` includes the paid
 * balance once packs exist, so it can exceed `total` then.
 */
export function monthLeft(access: AiAccess | undefined): { left: number; total: number } | null {
  if (!access?.enabled) return null;
  if (access.credits_left != null && access.credits_month != null) {
    return { left: Math.max(access.credits_left, 0), total: access.credits_month };
  }
  // A server before the credits (20261125000001): the month's quota.
  if (access.per_month == null) return null;
  return {
    left: Math.max(access.per_month - (access.used_month ?? 0), 0),
    total: access.per_month,
  };
}

/** What one request of `feature` costs, in credits: null before the access
 *  loads (or from a server without prices), 1 for a feature the table does
 *  not list — the server's own default. */
export function creditCost(access: AiAccess | undefined, feature: 'day_voice' | 'week'): number | null {
  if (!access?.enabled || !access.credit_cost) return null;
  const c = access.credit_cost[feature];
  return typeof c === 'number' && c >= 0 ? c : 1;
}
