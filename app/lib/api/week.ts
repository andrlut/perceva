import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dateKeyFromLocal } from '@/lib/api/history';
import type { WeekItem } from '@/lib/db/types';
import type { WeekStart } from '@/lib/settings';
import { supabase } from '@/lib/supabase';

/**
 * "Minha Semana" data layer — pool model.
 *
 * Items live in a general POOL (week_start null, "Pra depois"); each week is
 * a SELECTION over it: pick 3 bigs (slot 1..3), give days to the rest.
 * Undone items flow back to the pool at the next ritual and get re-allocated.
 * A big can hold sub-steps (parent_id) that inherit the parent's week.
 *
 * Caches hold RAW WeekItem[] rows (pool and per-week); screens consume the
 * shaped WeekSheet via `select`, so optimistic patches stay trivial.
 *
 * Week doctrine: the week is a USER-LOCAL concept — the client computes and
 * freezes week_start (task_skip precedent); the server never derives weeks.
 */

// ─── Local-date helpers ──────────────────────────────────────────────────────

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
  pool: () => ['week', 'pool'] as const,
};

function keyFor(weekStart: string | null) {
  return weekStart == null ? weekKeys.pool() : weekKeys.items(weekStart);
}

/** A big with its sub-steps attached. */
export interface WeekBig {
  item: WeekItem;
  steps: WeekItem[];
}

export interface WeekSheet {
  /** Top-level rows of the week (subs excluded). */
  items: WeekItem[];
  /** slot → big with steps. */
  bigs: Map<number, WeekBig>;
  /** Regular (non-big) open items. */
  rest: WeekItem[];
  restDone: WeekItem[];
}

export function shapeSheet(rows: WeekItem[]): WeekSheet {
  const tops = rows.filter((r) => r.parent_id == null);
  const bigs = new Map<number, WeekBig>();
  for (const r of tops) {
    if (r.slot != null) {
      bigs.set(r.slot, {
        item: r,
        steps: rows.filter((s) => s.parent_id === r.id),
      });
    }
  }
  const regular = tops.filter((r) => r.slot == null);
  return {
    items: tops,
    bigs,
    rest: regular.filter((r) => r.done_at == null),
    restDone: regular.filter((r) => r.done_at != null),
  };
}

async function fetchWeekRows(weekStart: string): Promise<WeekItem[]> {
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

export function useWeekSheet(weekStart: string, enabled = true) {
  return useQuery({
    queryKey: weekKeys.items(weekStart),
    queryFn: () => fetchWeekRows(weekStart),
    select: shapeSheet,
    enabled,
  });
}

/** The pool — "Pra depois": open top-level items with no week allocated. */
async function fetchPoolRows(): Promise<WeekItem[]> {
  const { data, error } = await supabase
    .from('week_item')
    .select('*')
    .is('week_start', null)
    .is('parent_id', null)
    .is('done_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeekItem[];
}

export function usePool(enabled = true) {
  return useQuery({
    queryKey: weekKeys.pool(),
    queryFn: fetchPoolRows,
    enabled,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export interface AddWeekItemInput {
  /** null/omitted = straight into the pool. */
  weekStart?: string | null;
  title: string;
  slot?: 1 | 2 | 3;
  /** Set to create a sub-step under a big (weekStart must match the parent's). */
  parentId?: string;
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
          week_start: input.weekStart ?? null,
          title: input.title.trim(),
          slot: input.slot ?? null,
          parent_id: input.parentId ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as WeekItem;
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: keyFor(input.weekStart ?? null) });
    },
  });
}

export interface UpdateWeekItemInput {
  id: string;
  /** Cache the row currently lives in: a week key, or null for the pool. */
  weekStart: string | null;
  patch: Partial<
    Pick<WeekItem, 'title' | 'day' | 'done_at' | 'slot' | 'week_start'>
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
      const key = keyFor(input.weekStart);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WeekItem[]>(key);
      if (prev) {
        const movedAway =
          input.patch.week_start !== undefined &&
          input.patch.week_start !== input.weekStart;
        qc.setQueryData<WeekItem[]>(
          key,
          movedAway
            ? prev.filter((r) => r.id !== input.id)
            : prev.map((r) => (r.id === input.id ? { ...r, ...input.patch } : r)),
        );
      }
      return { prev, key };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: keyFor(input.weekStart) });
      if (
        input.patch.week_start !== undefined &&
        input.patch.week_start !== input.weekStart
      ) {
        qc.invalidateQueries({
          queryKey: keyFor(input.patch.week_start ?? null),
        });
      }
    },
  });
}

export function useDeleteWeekItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; weekStart: string | null }) => {
      const { error } = await supabase
        .from('week_item')
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const key = keyFor(input.weekStart);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WeekItem[]>(key);
      if (prev) {
        // Removes the row AND its steps (DB cascades; mirror it locally).
        qc.setQueryData<WeekItem[]>(
          key,
          prev.filter((r) => r.id !== input.id && r.parent_id !== input.id),
        );
      }
      return { prev, key };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: keyFor(input.weekStart) });
    },
  });
}

/**
 * Move a top-level item between pool and week (or across weeks), carrying
 * its sub-steps along (steps mirror the parent's week_start). Allocating
 * always clears the day; `slot` places it as one of the 3.
 */
export function useAllocateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      item: WeekItem;
      /** Cache the row currently lives in. */
      fromWeek: string | null;
      /** null = back to the pool. */
      toWeek: string | null;
      slot?: 1 | 2 | 3 | null;
    }) => {
      const slot = input.slot === undefined ? null : input.slot;
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = {
        week_start: input.toWeek,
        slot,
        updated_at: now,
      };
      // Changing weeks resets the day; promoting within the same week keeps it.
      if (input.toWeek !== input.fromWeek) patch.day = null;
      const { error } = await supabase
        .from('week_item')
        .update(patch)
        .eq('id', input.item.id);
      if (error) throw error;
      const { error: stepErr } = await supabase
        .from('week_item')
        .update({ week_start: input.toWeek, updated_at: now })
        .eq('parent_id', input.item.id);
      if (stepErr) throw stepErr;
    },
    onSettled: (_d, _e, input) => {
      qc.invalidateQueries({ queryKey: keyFor(input.fromWeek) });
      qc.invalidateQueries({ queryKey: keyFor(input.toWeek) });
    },
  });
}

// ─── Row gestures ────────────────────────────────────────────────────────────

/**
 * The row gestures bound to one cache (a week key, or null for the pool) —
 * shared by the sheet and the ritual so the screens can't drift apart.
 */
export function useWeekItemActions(weekStart: string | null) {
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
    remove: (item: WeekItem) => deleteItem.mutate({ id: item.id, weekStart }),
  };
}
