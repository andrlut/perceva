import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DimensionId, DimensionNote } from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

/**
 * Norte by area — data layer over `dimension_note` (migration
 * 20261118000004). In each area that matters to the person: what they want
 * to be able to choose (`want`, completes "Quero poder escolher…") and,
 * optionally, how it is today. The 0..5 target stays in character_sub_score
 * (source 'desired') and reads under the phrase as a ruler.
 *
 * Core and free: no module, no plan gate. RLS self-only is the boundary;
 * dates are the server's (trigger).
 */

export const NORTH_WANT_LEN = 140;
export const NORTH_TODAY_LEN = 140;
/** "Ainda é isso?" comes back after ~6 months without a write or a yes. */
export const NORTH_REVIEW_DAYS = 182;

export const dimensionNoteKeys = {
  all: ['dimension_note'] as const,
};

export type DimensionNotes = Map<DimensionId, DimensionNote>;

async function fetchNotes(): Promise<DimensionNotes> {
  const { data, error } = await supabase
    .from('dimension_note')
    .select('id,character_id,dimension_id,matters,want,today,created_at,updated_at,reviewed_at');
  if (error) throw error;
  return new Map((data as DimensionNote[]).map((n) => [n.dimension_id, n]));
}

export function useDimensionNotes() {
  return useQuery({ queryKey: dimensionNoteKeys.all, queryFn: fetchNotes });
}

/** The phrase is past its review: written (or last confirmed) ≥ 6 months ago. */
export function reviewDue(note: DimensionNote | undefined, now = Date.now()): boolean {
  if (!note?.matters || !note.want) return false;
  const at = Date.parse(note.reviewed_at);
  return Number.isFinite(at) && now - at >= NORTH_REVIEW_DAYS * 86_400_000;
}

/** One line, no stray spaces — what the server will store. */
export function cleanPhrase(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** The phrase came from "A vida que eu quero": it still reads exactly like a
 *  scene of the same area. Edited, it is the person's own — no seal. */
export function fromVision(want: string | null | undefined, scenes: readonly string[]): boolean {
  if (!want) return false;
  const w = cleanPhrase(want).toLocaleLowerCase();
  return scenes.some((s) => cleanPhrase(s).toLocaleLowerCase() === w);
}

export interface NorthDraft {
  dimension_id: DimensionId;
  matters: boolean;
  want: string;
  today: string;
}

/** Saves the areas that changed, in one transaction. An area unmarked with
 *  both phrases empty is deleted server-side. */
export function useSaveDimensionNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (drafts: NorthDraft[]) => {
      if (drafts.length === 0) return;
      const { error } = await supabase.rpc('set_dimension_notes', {
        p_notes: drafts.map((d) => ({
          dimension_id: d.dimension_id,
          matters: d.matters,
          want: cleanPhrase(d.want) || null,
          today: cleanPhrase(d.today) || null,
        })),
      });
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dimensionNoteKeys.all });
    },
  });
}

/** "Ainda é isso?" → "Ainda é": moves the review date to now (the server
 *  clamps it; the phrase and updated_at stay). Optimistic, so the question
 *  leaves the card on the tap. */
export function useConfirmDimensionNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dim: DimensionId) => {
      const { error } = await supabase
        .from('dimension_note')
        .update({ reviewed_at: new Date().toISOString() })
        .eq('dimension_id', dim);
      if (error) throw error;
    },
    onMutate: async (dim) => {
      await qc.cancelQueries({ queryKey: dimensionNoteKeys.all });
      const prev = qc.getQueryData<DimensionNotes>(dimensionNoteKeys.all);
      if (prev) {
        const next = new Map(prev);
        const n = next.get(dim);
        if (n) next.set(dim, { ...n, reviewed_at: new Date().toISOString() });
        qc.setQueryData(dimensionNoteKeys.all, next);
      }
      return { prev };
    },
    onError: (_e, _dim, ctx) => {
      if (ctx?.prev) qc.setQueryData(dimensionNoteKeys.all, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dimensionNoteKeys.all });
    },
  });
}
