import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { SubId } from '@/lib/db/types';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

interface CompletionSubRow {
  task_completion_sub: { sub_id: string; xp_granted: number | null }[] | null;
}

export interface SubXp {
  subId: SubId;
  totalXp: number;
}

export const dedicacaoKeys = {
  all: ['dedicacao'] as const,
  totalXpBySub: () => [...dedicacaoKeys.all, 'totalXpBySub'] as const,
};

/**
 * All-time XP grouped by subattribute. Pulls every task_completion row
 * for the current user (RLS-filtered) and aggregates by sub_id.
 *
 * For users with thousands of completions this should be paginated /
 * moved to a SECURITY DEFINER RPC, but at current scale a single
 * fetch is fine.
 */
export function useTotalXpBySub() {
  return useQuery({
    queryKey: dedicacaoKeys.totalXpBySub(),
    queryFn: async (): Promise<SubXp[]> => {
      const { data, error } = await supabase
        .from('task_completion')
        .select('task_completion_sub(sub_id, xp_granted)');
      if (error) throw error;

      // Seed every sub at 0 so subs the user never touched still appear
      // on the hex (otherwise the geometry collapses on new users).
      const totals = new Map<SubId, number>();
      for (const dim of DIMENSION_ORDER) {
        for (const sub of SUBS_BY_DIM[dim]) totals.set(sub, 0);
      }

      for (const row of (data ?? []) as CompletionSubRow[]) {
        for (const tcs of row.task_completion_sub ?? []) {
          const subId = tcs.sub_id as SubId;
          const xp = tcs.xp_granted ?? 0;
          totals.set(subId, (totals.get(subId) ?? 0) + xp);
        }
      }

      return [...totals.entries()].map(([subId, totalXp]) => ({
        subId,
        totalXp,
      }));
    },
  });
}
