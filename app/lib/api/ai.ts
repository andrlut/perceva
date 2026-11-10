import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { todayDateKey } from './mood';

/**
 * The app's native AI (Edge Function `perceva-ai`). First feature: "Conte seu
 * dia" — the person dictates the day, the AI returns a DRAFT (mood, tags,
 * note, practices done/skipped today) and the app writes only after the tap
 * on Registrar, with the hooks it already has. Nothing here writes data.
 *
 * Gate: `ai_access()` says whether this account sees the box at all (the
 * `ai` row of app_config: on/off + allowlist, server-only) and how much of
 * today's quota is used. The quota only counts requests that produced a
 * draft — a failure or "didn't understand" gives the credit back.
 */

export const aiKeys = {
  all: ['ai'] as const,
  access: () => [...aiKeys.all, 'access'] as const,
};

export interface AiAccess {
  enabled: boolean;
  used_today?: number;
  per_day?: number;
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
  | 'rate_minute'
  | 'rate_day'
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
    }
  | {
      ok: false;
      reason: DayVoiceFailure;
      remark?: string | null;
      used_today?: number;
      per_day?: number;
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
