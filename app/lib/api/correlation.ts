import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { SubId } from '@/lib/db/types';
import { buildDayRecords, type DayActivity, type DayRecord } from '@/lib/correlation';
import { supabase } from '@/lib/supabase';

import { dateKeyFromLocal } from './history';
import { useMoodRange } from './mood';

interface ActivityRow {
  completed_local_date: string | null;
  task_completion_sub: { sub_id: string; xp_granted: number | null }[] | null;
}

/**
 * Per-day activity (subs practiced + XP) over [from, to], keyed on the stored
 * completed_local_date — the authoritative local date, so it joins cleanly
 * against mood_log.logged_for with no timezone drift.
 */
function useActivityByDay(from: Date, to: Date) {
  const fromKey = dateKeyFromLocal(from);
  const toKey = dateKeyFromLocal(to);
  return useQuery({
    queryKey: ['correlation', 'activity', fromKey, toKey] as const,
    queryFn: async (): Promise<Map<string, DayActivity>> => {
      const { data, error } = await supabase
        .from('task_completion')
        .select('completed_local_date, task_completion_sub(sub_id, xp_granted)')
        .gte('completed_local_date', fromKey)
        .lte('completed_local_date', toKey);
      if (error) throw error;
      const map = new Map<string, DayActivity>();
      for (const row of (data ?? []) as unknown as ActivityRow[]) {
        const key = row.completed_local_date;
        if (!key) continue;
        let rec = map.get(key);
        if (!rec) {
          rec = { subs: new Set<SubId>(), xp: 0 };
          map.set(key, rec);
        }
        for (const tcs of row.task_completion_sub ?? []) {
          const xp = tcs.xp_granted ?? 0;
          if (xp <= 0) continue;
          rec.subs.add(tcs.sub_id as SubId);
          rec.xp += xp;
        }
      }
      return map;
    },
  });
}

/**
 * The joined day records (mood + activity) over the trailing `windowDays`,
 * ready for the correlation math. Returns null records until both sides load.
 */
export function useCorrelation(windowDays = 90): {
  records: DayRecord[] | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (windowDays - 1));
    return { from: start, to: end };
  }, [windowDays]);

  const activity = useActivityByDay(from, to);
  const moods = useMoodRange(from, to);

  const records = useMemo(() => {
    if (!activity.data || !moods.data) return null;
    return buildDayRecords(activity.data, moods.data);
  }, [activity.data, moods.data]);

  return {
    records,
    isLoading: activity.isLoading || moods.isLoading,
    refetch: () => {
      activity.refetch();
      moods.refetch();
    },
  };
}
