import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DimensionId, LifeVision, SubId } from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

/**
 * "A vida que eu quero" (module `vida`) — data layer over `life_vision`.
 *
 * Versioned: every save INSERTS a row and the newest one is the vision. There
 * is no update (no grant, no policy), so editing can never lose the previous
 * version; "Apagar tudo" deletes every version (LGPD art. 18). Validation
 * lives in the table too (lengths, area per scene, ≤ 3 subs/cuts, the first
 * practice must be the person's own).
 */

export const LIFE_SCENES_MAX = 3;
export const LIFE_SCENE_LEN = 140;
export const LIFE_HEADLINE_LEN = 60;
export const LIFE_GUILT_FREE_MAX = 3;
export const LIFE_CUTS_MAX = 3;
export const LIFE_CUT_LEN = 60;

export const lifeVisionKeys = {
  all: ['life_vision'] as const,
  latest: () => [...lifeVisionKeys.all, 'latest'] as const,
};

export interface LifeScene {
  text: string;
  dim: DimensionId;
}

export interface LifeVisionView {
  vision: LifeVision;
  /** The filled scenes, in order. */
  scenes: LifeScene[];
  /** The linked practice as it reads now (null when none, or deleted). */
  firstTask: { id: string; title: string; icon: string | null; is_archived: boolean } | null;
  /** How many versions are kept, this one included. */
  versions: number;
}

export function scenesOf(v: LifeVision): LifeScene[] {
  const out: LifeScene[] = [{ text: v.scene_1, dim: v.scene_1_dim }];
  if (v.scene_2 && v.scene_2_dim) out.push({ text: v.scene_2, dim: v.scene_2_dim });
  if (v.scene_3 && v.scene_3_dim) out.push({ text: v.scene_3, dim: v.scene_3_dim });
  return out;
}

type Row = LifeVision & {
  first_task: { id: string; title: string; icon: string | null; is_archived: boolean } | null;
};

async function fetchLatest(): Promise<LifeVisionView | null> {
  const [latest, count] = await Promise.all([
    supabase
      .from('life_vision')
      .select('*, first_task:task(id,title,icon,is_archived)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('life_vision').select('id', { count: 'exact', head: true }),
  ]);
  if (latest.error) throw latest.error;
  if (count.error) throw count.error;
  const row = latest.data as Row | null;
  if (!row) return null;
  const { first_task, ...vision } = row;
  return {
    vision,
    scenes: scenesOf(vision),
    firstTask: first_task ?? null,
    versions: count.count ?? 1,
  };
}

/** The current vision (null = never written). Pass the module gate as
 *  `enabled` so nothing is fetched while the module is off. */
export function useLifeVision(enabled = true) {
  return useQuery({
    queryKey: lifeVisionKeys.latest(),
    queryFn: fetchLatest,
    enabled,
  });
}

export interface LifeVisionDraft {
  headline: string;
  /** Exactly what the form holds — empty rows are dropped on save. */
  scenes: { text: string; dim: DimensionId | null }[];
  guiltFree: SubId[];
  cuts: string[];
  firstTaskId: string | null;
}

/** The scenes a draft would save: trimmed, empty ones dropped, so a filled
 *  third under an empty second moves up. */
export function draftScenes(draft: LifeVisionDraft): { text: string; dim: DimensionId | null }[] {
  return draft.scenes
    .map((s) => ({ text: s.text.trim(), dim: s.dim }))
    .filter((s) => s.text.length > 0)
    .slice(0, LIFE_SCENES_MAX);
}

/** Why a draft can't be saved yet, or null when it can. */
export function draftProblem(draft: LifeVisionDraft): 'needFirst' | 'needArea' | null {
  const scenes = draftScenes(draft);
  if (scenes.length === 0) return 'needFirst';
  if (scenes.some((s) => s.dim == null)) return 'needArea';
  return null;
}

export function useSaveLifeVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: LifeVisionDraft) => {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error('Not authenticated');

      const scenes = draftScenes(draft);
      if (draftProblem(draft)) throw new Error('Incomplete vision');
      const at = (i: number) => scenes[i] ?? null;
      const headline = draft.headline.trim();
      const cuts = draft.cuts.map((c) => c.trim()).filter(Boolean).slice(0, LIFE_CUTS_MAX);

      const { error } = await supabase.from('life_vision').insert({
        character_id: userId,
        headline: headline || null,
        scene_1: at(0)!.text,
        scene_1_dim: at(0)!.dim,
        scene_2: at(1)?.text ?? null,
        scene_2_dim: at(1)?.dim ?? null,
        scene_3: at(2)?.text ?? null,
        scene_3_dim: at(2)?.dim ?? null,
        guilt_free: [...new Set(draft.guiltFree)].slice(0, LIFE_GUILT_FREE_MAX),
        cuts,
        first_task_id: draft.firstTaskId,
      });
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: lifeVisionKeys.all });
    },
  });
}

/** Deletes every version. The linked practice stays. */
export function useDeleteLifeVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase.from('life_vision').delete().eq('character_id', userId);
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: lifeVisionKeys.all });
    },
  });
}
