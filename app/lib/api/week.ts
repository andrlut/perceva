import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dateKeyFromLocal } from '@/lib/api/history';
import type { WeekItem } from '@/lib/db/types';
import type { WeekStart } from '@/lib/settings';
import { supabase } from '@/lib/supabase';

/**
 * "Minha Semana" data layer — the weekly sheet (3 bigs + life-admin items).
 *
 * Week doctrine: the week is a USER-LOCAL concept. The client computes the
 * week's first day from `settings.weekStart` (sunday|monday) with local date
 * components and freezes it per row; the server never derives weeks and never
 * knows timezones (task_skip / mood_log precedent).
 */

// ─── Local-date helpers (day keys come from history's dateKeyFromLocal) ──────

/** Local YYYY-MM-DD of the first day of the week containing `d`. */
export function weekStartKey(d: Date, weekStart: WeekStart): string {
  const dow = d.getDay(); // 0 = Sunday
  const offset = weekStart === 'monday' ? (dow + 6) % 7 : dow;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return dateKeyFromLocal(start);
}

/** Shift a YYYY-MM-DD key by `days`, in local-calendar arithmetic. */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKeyFromLocal(new Date(y, m - 1, d + days));
}

/**
 * Which week the "Montar a semana" ritual should build. The current week —
 * except on the week's LAST day, when planning ahead is the natural gesture
 * and the ritual targets the next one.
 */
export function ritualTargetWeek(
  now: Date,
  weekStart: WeekStart,
): { weekStartKey: string; isNext: boolean } {
  const current = weekStartKey(now, weekStart);
  const dow = now.getDay();
  const offset = weekStart === 'monday' ? (dow + 6) % 7 : dow;
  if (offset === 6) {
    return { weekStartKey: addDaysToKey(current, 7), isNext: true };
  }
  return { weekStartKey: current, isNext: false };
}

// ─── Query layer ─────────────────────────────────────────────────────────────

export const weekKeys = {
  all: ['week'] as const,
  items: (weekStart: string) => ['week', 'items', weekStart] as const,
};

async function fetchWeekItems(weekStart: string): Promise<WeekItem[]> {
  const { data, error } = await supabase
    .from('week_item')
    .select('*')
    .eq('week_start', weekStart)
    .order('slot', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeekItem[];
}

export function useWeekItems(weekStart: string, enabled = true) {
  return useQuery({
    queryKey: weekKeys.items(weekStart),
    queryFn: () => fetchWeekItems(weekStart),
    enabled,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export interface AddWeekItemInput {
  weekStart: string;
  title: string;
  slot?: 1 | 2 | 3;
  firstAction?: string | null;
}

export function useAddWeekItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddWeekItemInput): Promise<WeekItem> => {
      // getSession reads the stored JWT locally — no auth round-trip per add.
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('week_item')
        .insert({
          character_id: userId,
          week_start: input.weekStart,
          title: input.title.trim(),
          slot: input.slot ?? null,
          first_action: input.firstAction?.trim() || null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as WeekItem;
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: weekKeys.items(input.weekStart) });
    },
  });
}

export interface UpdateWeekItemInput {
  id: string;
  /** Week the item currently lives in — the list cache to patch. */
  weekStart: string;
  patch: Partial<
    Pick<
      WeekItem,
      'title' | 'first_action' | 'day' | 'done_at' | 'slot' | 'week_start'
    >
  >;
}

export function useUpdateWeekItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateWeekItemInput) => {
      const { error } = await supabase
        .from('week_item')
        .update({ ...input.patch, updated_at: new Date().toISOString() })
        .eq('id', input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const key = weekKeys.items(input.weekStart);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WeekItem[]>(key);
      if (prev) {
        const movedAway =
          input.patch.week_start != null &&
          input.patch.week_start !== input.weekStart;
        qc.setQueryData<WeekItem[]>(
          key,
          movedAway
            ? prev.filter((i) => i.id !== input.id)
            : prev.map((i) => (i.id === input.id ? { ...i, ...input.patch } : i)),
        );
      }
      return { prev, key };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: weekKeys.items(input.weekStart) });
      // A carry moves the row into another week's cache — refresh that one too.
      const movedTo = input.patch.week_start;
      if (movedTo && movedTo !== input.weekStart) {
        qc.invalidateQueries({ queryKey: weekKeys.items(movedTo) });
      }
    },
  });
}

export function useDeleteWeekItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; weekStart: string }) => {
      const { error } = await supabase
        .from('week_item')
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const key = weekKeys.items(input.weekStart);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WeekItem[]>(key);
      if (prev) {
        qc.setQueryData<WeekItem[]>(
          key,
          prev.filter((i) => i.id !== input.id),
        );
      }
      return { prev, key };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: weekKeys.items(input.weekStart) });
    },
  });
}

// ─── Row gestures ────────────────────────────────────────────────────────────

/**
 * The row gestures bound to one week's cache — shared by the sheet and the
 * ritual so the two screens can't drift apart on behavior.
 */
export function useWeekItemActions(weekStart: string) {
  const updateItem = useUpdateWeekItem();
  const deleteItem = useDeleteWeekItem();
  return {
    toggleDone: (item: WeekItem) =>
      updateItem.mutate({
        id: item.id,
        weekStart,
        patch: { done_at: item.done_at ? null : new Date().toISOString() },
      }),
    setDay: (item: WeekItem, day: number | null) =>
      updateItem.mutate({ id: item.id, weekStart, patch: { day } }),
    setFirstAction: (item: WeekItem, firstAction: string) =>
      updateItem.mutate({
        id: item.id,
        weekStart,
        patch: { first_action: firstAction || null },
      }),
    remove: (item: WeekItem) => deleteItem.mutate({ id: item.id, weekStart }),
  };
}
