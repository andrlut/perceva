import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import {
  attributeMomentum,
  baseXpForDifficulty,
  type AttributeMomentum,
  type DailyMomentumInput,
  type Difficulty,
} from '@/lib/xp';
import type { SubId } from '@/lib/db/types';

export const momentumKeys = {
  all: ['momentum'] as const,
  me: () => [...momentumKeys.all, 'me'] as const,
};

export interface MomentumState {
  attributes: AttributeMomentum[];
}

interface CompletionRow {
  completed_at: string;
  completed_local_date?: string | null;
  task_completion_sub: { sub_id: string; stars: number }[] | null;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function useMomentum() {
  return useQuery({
    queryKey: momentumKeys.me(),
    queryFn: async (): Promise<MomentumState> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      since.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('task_completion')
        .select('completed_at, completed_local_date, task_completion_sub(sub_id, stars)')
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: false });
      if (error) throw error;

      const effort: DailyMomentumInput[] = [];
      for (const row of (data ?? []) as CompletionRow[]) {
        const dateKey =
          row.completed_local_date ?? localDateKey(new Date(row.completed_at));
        for (const sub of row.task_completion_sub ?? []) {
          const stars = Math.max(1, Math.min(5, sub.stars)) as Difficulty;
          effort.push({
            dateKey,
            subId: sub.sub_id as SubId,
            baseXp: baseXpForDifficulty(stars),
          });
        }
      }

      return {
        attributes: attributeMomentum(effort, localDateKey(new Date())),
      };
    },
  });
}
