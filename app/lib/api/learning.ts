import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CollectIdeaResult,
  IdeaReview,
  LearningIdeaCollectRow,
  LearningIdeaPublic,
  LearningMaterial,
  LearningMaterialCard,
  LearningMaterialMedia,
  LearningMaterialSub,
  MarkMaterialReadResult,
  ReviewIdeaResult,
  SubId,
} from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

import { characterKeys } from './character';
import { dateKeyFromLocal } from './history';

export const learningKeys = {
  all: ['learning'] as const,
  feed: () => [...learningKeys.all, 'feed'] as const,
  detail: (slug: string) => [...learningKeys.all, 'detail', slug] as const,
  views: () => [...learningKeys.all, 'views'] as const,
  myFeedback: (slug: string) => [...learningKeys.all, 'myFeedback', slug] as const,
  ideaCards: () => [...learningKeys.all, 'ideaCards'] as const,
  collected: () => [...learningKeys.all, 'collected'] as const,
  reviews: () => [...learningKeys.all, 'reviews'] as const,
};

/** Media columns the feed loads — enough for format icons AND the reels
 *  deck (path + meta give the viewer its image URLs without a detail
 *  roundtrip per material). Audio/video extras still load with the detail. */
export type LearningFeedMedia = Pick<
  LearningMaterialMedia,
  'kind' | 'locale' | 'path' | 'page_paths' | 'meta'
>;

/**
 * A feed card hydrated with the subs it touches. Body fields are NOT loaded
 * here — kept light so the feed scrolls fast even with long materials.
 */
export interface LearningFeedCard extends LearningMaterialCard {
  subs: SubId[];
  media: LearningFeedMedia[];
}

interface FeedRow extends LearningMaterialCard {
  learning_material_sub: { sub_id: SubId }[] | null;
  learning_material_media: LearningFeedMedia[] | null;
}

/**
 * Newest-first feed of all non-archived, already-released materials, with
 * their sub tags. The `released_at` gate lets the drops pipeline schedule
 * content into the future and have it appear on its own.
 */
export function useLearningFeed() {
  return useQuery({
    // O catálogo é conteúdo publicado, não estado do usuário: refetch a
    // cada foco da aba só rende trabalho de render. Sem staleTime, cada
    // refetch produzia um array novo e invalidava a cadeia inteira de
    // useMemo do feed (filtered -> buckets -> sections).
    staleTime: 5 * 60_000,
    queryKey: learningKeys.feed(),
    queryFn: async (): Promise<LearningFeedCard[]> => {
      const { data, error } = await supabase
        .from('learning_material')
        .select(
          `id, slug, type, dimension_id, topic, reading_minutes,
           title_pt, title_en, summary_pt, summary_en,
           hero_image_url, source_url, source_label_pt, source_label_en,
           cta_action, released_at, version, is_archived, idea_count,
           created_at, updated_at,
           learning_material_sub ( sub_id ),
           learning_material_media ( kind, locale, path, page_paths, meta )`,
        )
        .eq('is_archived', false)
        .lte('released_at', new Date().toISOString())
        .order('released_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as FeedRow[]).map((row) => {
        const { learning_material_sub, learning_material_media, ...card } = row;
        return {
          ...card,
          subs: (learning_material_sub ?? []).map((s) => s.sub_id),
          media: learning_material_media ?? [],
        };
      });
    },
  });
}

interface DetailRow extends LearningMaterial {
  learning_material_sub: { sub_id: SubId }[] | null;
  learning_material_media: LearningMaterialMedia[] | null;
}

export interface LearningMaterialDetail extends LearningMaterial {
  subs: SubId[];
  media: LearningMaterialMedia[];
}

export function useLearningMaterial(slug: string | null | undefined) {
  return useQuery({
    queryKey: slug ? learningKeys.detail(slug) : ['learning', 'detail', 'none'],
    enabled: !!slug,
    queryFn: async (): Promise<LearningMaterialDetail | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('learning_material')
        .select(
          `*, learning_material_sub ( sub_id ), learning_material_media ( * )`,
        )
        .eq('slug', slug)
        .eq('is_archived', false)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as DetailRow;
      const { learning_material_sub, learning_material_media, ...material } = row;
      return {
        ...material,
        subs: (learning_material_sub ?? []).map((s) => s.sub_id),
        media: learning_material_media ?? [],
      };
    },
  });
}

/** Set of material_ids the user has already read. */
export function useReadMaterialIds() {
  return useQuery({
    // Mesmo motivo, com raio de explosão MAIOR: o queryFn devolve um Set
    // novo a cada fetch, então mesmo com os mesmos ids a identidade muda e
    // tudo que depende de `readSet` recalcula.
    staleTime: 60_000,
    queryKey: learningKeys.views(),
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('learning_view')
        .select('material_id');
      if (error) throw error;
      return new Set((data ?? []).map((r: { material_id: string }) => r.material_id));
    },
  });
}

interface MarkReadInput {
  slug: string;
  materialId: string;
}

/** The current user's rating + tags + comment on a single material (null if none yet). */
export function useMyMaterialFeedback(slug: string | null | undefined) {
  return useQuery({
    queryKey: slug ? learningKeys.myFeedback(slug) : ['learning', 'myFeedback', 'none'],
    enabled: !!slug,
    queryFn: async (): Promise<{
      rating: -1 | 1;
      comment: string | null;
      tags: string[];
    } | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('learning_material_feedback')
        .select('rating, comment, tags, material:material_id(slug)')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      // Filter client-side by slug — feedback table is small per-user.
      type Row = {
        rating: -1 | 1;
        comment: string | null;
        tags: string[] | null;
        material: { slug: string } | { slug: string }[] | null;
      };
      const rows = (data ?? []) as Row[];
      for (const row of rows) {
        const mat = Array.isArray(row.material) ? row.material[0] : row.material;
        if (mat?.slug === slug) {
          return {
            rating: row.rating,
            comment: row.comment,
            tags: row.tags ?? [],
          };
        }
      }
      return null;
    },
  });
}

interface RateInput {
  slug: string;
  rating: -1 | 1;
  comment?: string | null;
  tags?: string[] | null;
}

/**
 * 👍/👎 a material with optional comment + tags.
 *
 * Semantics:
 * - First rating: INSERT
 * - Same rating tapped AGAIN with no comment AND no tags → CLEAR (toggle off)
 * - Same rating + comment OR tags → UPDATE (save follow-up from sheet)
 * - Different rating → UPDATE (flip)
 */
export function useRateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: RateInput,
    ): Promise<{ action: string; rating: -1 | 1; tags: string[] }> => {
      const { data, error } = await supabase.rpc('rate_material', {
        p_slug: input.slug,
        p_rating: input.rating,
        p_comment: input.comment ?? null,
        p_tags: input.tags ?? null,
      });
      if (error) throw error;
      return data as { action: string; rating: -1 | 1; tags: string[] };
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: learningKeys.myFeedback(input.slug) });
    },
  });
}

// ── Ideas (Recanto em ideias) ──────────────────────────────────────────────

/**
 * One row per published idea, from the `learning_idea_public` view. Feeds the
 * per-idea Explorar, "Minhas ideias" and the next-idea CTA — never the feed,
 * which stays on `idea_count` only. Loaded on demand by the screens that need
 * it, not by the tab.
 */
export function useIdeaCards() {
  return useQuery({
    staleTime: 5 * 60_000,
    queryKey: learningKeys.ideaCards(),
    queryFn: async (): Promise<LearningIdeaPublic[]> => {
      const { data, error } = await supabase
        .from('learning_idea_public')
        .select('*')
        .order('released_at', { ascending: false })
        .order('ordinal', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LearningIdeaPublic[];
    },
  });
}

/** material_id → set of idea ids the user has absorbed (flipped the card). */
export function useCollectedIdeas() {
  return useQuery({
    // Mesma disciplina de identidade do useReadMaterialIds: cada fetch devolve
    // um Map novo, então o staleTime segura a cadeia de useMemo dos consumidores.
    staleTime: 60_000,
    queryKey: learningKeys.collected(),
    queryFn: async (): Promise<Map<string, Set<string>>> => {
      const { data, error } = await supabase
        .from('learning_idea_collect')
        .select('material_id, idea_id');
      if (error) throw error;
      const out = new Map<string, Set<string>>();
      for (const row of (data ?? []) as { material_id: string; idea_id: string }[]) {
        let set = out.get(row.material_id);
        if (!set) {
          set = new Set<string>();
          out.set(row.material_id, set);
        }
        set.add(row.idea_id);
      }
      return out;
    },
  });
}

interface CollectIdeaInput {
  slug: string;
  ideaId: string;
}

/**
 * Flip the card = absorb the idea (idempotent). When the last live idea of a
 * material is collected the RPC closes the material through
 * mark_material_read, so XP/coins land in the same `already_read`-guarded
 * path the legacy CTA uses.
 */
export function useCollectIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CollectIdeaInput): Promise<CollectIdeaResult> => {
      const { data, error } = await supabase.rpc('collect_idea', {
        p_slug: input.slug,
        p_idea_id: input.ideaId,
      });
      if (error) throw error;
      return data as CollectIdeaResult;
    },
    onSuccess: (result, input) => {
      queryClient.invalidateQueries({ queryKey: learningKeys.collected() });
      // A fresh absorption enters the review pile → the bulb badge moves.
      queryClient.invalidateQueries({ queryKey: learningKeys.reviews() });
      if (result.completed) {
        queryClient.invalidateQueries({ queryKey: characterKeys.me() });
        queryClient.invalidateQueries({ queryKey: learningKeys.views() });
        queryClient.invalidateQueries({ queryKey: learningKeys.detail(input.slug) });
      }
    },
  });
}

// ── Review pile (favorite / release) ───────────────────────────────────────

/** Cache key of one collected idea inside `IdeaReviews.byKey`. */
export function reviewKey(materialId: string, ideaId: string): string {
  return `${materialId}:${ideaId}`;
}

/** The user's collection with review state, pre-shaped for the screens. */
export interface IdeaReviews {
  /** Every absorbed idea, keyed by `reviewKey(materialId, ideaId)`. */
  byKey: Map<string, IdeaReview>;
  /** Not yet reviewed (`reviewedAt` null), oldest absorbed first — the
   *  order the review stack deals them. */
  pending: IdeaReview[];
  pendingCount: number;
  /** Reviewed AND kept (`favorite === true`). */
  favoritesCount: number;
}

/** Shapes a flat list of reviews into the derived buckets. Shared by the
 *  query and the optimistic update so both agree on ordering and counts. */
function buildIdeaReviews(rows: IdeaReview[]): IdeaReviews {
  const byKey = new Map<string, IdeaReview>();
  const pending: IdeaReview[] = [];
  let favoritesCount = 0;
  for (const r of rows) {
    byKey.set(reviewKey(r.materialId, r.ideaId), r);
    if (r.reviewedAt === null) pending.push(r);
    else if (r.favorite === true) favoritesCount += 1;
  }
  pending.sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
  return { byKey, pending, pendingCount: pending.length, favoritesCount };
}

/**
 * Collection + review state (`learning_idea_collect` with `reviewed_at` /
 * `favorite`). Separate from `useCollectedIdeas`, whose Map<materialId,
 * Set<ideaId>> shape is consumed everywhere and stays untouched; this one
 * feeds the review stack, the favorites grid and the bulb FAB badge.
 */
export function useIdeaReviews() {
  return useQuery({
    // Same identity discipline as useCollectedIdeas: fresh Map/arrays per
    // fetch, so the staleTime keeps the consumers' memo chains stable.
    staleTime: 60_000,
    queryKey: learningKeys.reviews(),
    queryFn: async (): Promise<IdeaReviews> => {
      const { data, error } = await supabase
        .from('learning_idea_collect')
        .select('material_id, idea_id, collected_at, reviewed_at, favorite');
      if (error) throw error;
      const rows = ((data ?? []) as LearningIdeaCollectRow[]).map<IdeaReview>((r) => ({
        materialId: r.material_id,
        ideaId: r.idea_id,
        collectedAt: r.collected_at,
        reviewedAt: r.reviewed_at,
        favorite: r.favorite,
      }));
      return buildIdeaReviews(rows);
    },
  });
}

interface ReviewIdeaInput {
  slug: string;
  ideaId: string;
  favorite: boolean;
  /** Optional shortcut for the optimistic update; otherwise resolved from
   *  the `ideaCards` cache by (slug, ideaId). */
  materialId?: string;
}

/**
 * Swipe on the review stack: right = favorite (true), left = release (false).
 * Calls `review_idea`, which is re-callable (a later swipe changes the
 * decision) and raises if the idea was never collected. The reviews cache
 * is updated optimistically — the next card must slide in immediately —
 * and rolled back on error; onSettled reconciles with the server.
 */
export function useReviewIdea() {
  const queryClient = useQueryClient();
  return useMutation<ReviewIdeaResult, Error, ReviewIdeaInput, { previous?: IdeaReviews }>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.rpc('review_idea', {
        p_slug: input.slug,
        p_idea_id: input.ideaId,
        p_favorite: input.favorite,
      });
      if (error) throw error;
      return data as ReviewIdeaResult;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: learningKeys.reviews() });
      const previous = queryClient.getQueryData<IdeaReviews>(learningKeys.reviews());
      if (!previous) return { previous };

      // The RPC is keyed by slug, the cache by material id. Resolve through
      // the ideaCards cache (the screens that review always load it); fall
      // back to an ideaId that matches exactly one collected row.
      let materialId = input.materialId ?? null;
      if (!materialId) {
        const cards = queryClient.getQueryData<LearningIdeaPublic[]>(learningKeys.ideaCards());
        materialId =
          cards?.find((c) => c.slug === input.slug && c.idea_id === input.ideaId)?.material_id ??
          null;
      }
      if (!materialId) {
        const matches = [...previous.byKey.values()].filter((r) => r.ideaId === input.ideaId);
        if (matches.length === 1) materialId = matches[0].materialId;
      }
      const current = materialId ? previous.byKey.get(reviewKey(materialId, input.ideaId)) : null;
      if (!current) return { previous };

      const updated: IdeaReview = {
        ...current,
        reviewedAt: new Date().toISOString(),
        favorite: input.favorite,
      };
      const rows = [...previous.byKey.values()].map((r) => (r === current ? updated : r));
      queryClient.setQueryData<IdeaReviews>(learningKeys.reviews(), buildIdeaReviews(rows));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<IdeaReviews>(learningKeys.reviews(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.reviews() });
      queryClient.invalidateQueries({ queryKey: learningKeys.collected() });
    },
  });
}

/**
 * Marks the material as read (idempotent). Legacy materials award
 * 5 base + 5 per related sub XP; materials with ideas award 10 + 2 per idea
 * (see app/lib/learningXp.ts and migration 20260907000002).
 */
export function useMarkMaterialRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MarkReadInput): Promise<MarkMaterialReadResult> => {
      const { data, error } = await supabase.rpc('mark_material_read', {
        p_slug: input.slug,
      });
      if (error) throw error;
      return data as MarkMaterialReadResult;
    },
    onSuccess: (_result, input) => {
      // Refresh user state — character (XP/coins), views set, dim XP.
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
      queryClient.invalidateQueries({ queryKey: learningKeys.views() });
      queryClient.invalidateQueries({ queryKey: learningKeys.detail(input.slug) });
    },
  });
}

/**
 * Quantos materiais o usuário leu nos últimos `days` dias.
 *
 * Hook separado de `useReadMaterialIds` de propósito: aquele devolve o
 * conjunto inteiro e é consumido pelo feed em cada card, então mudar o
 * shape dele custaria caro. Aqui só o número interessa, e o corte por
 * `read_at` acontece no servidor.
 *
 * A chave inclui só a DATA do corte, não o instante: sem isso a queryKey
 * mudaria a cada render e o cache nunca acertaria.
 */
export function useRecentReadCount(days = 30) {
  // Dia LOCAL, igual ao `dateKeyFromLocal` que a janela de esforço usa.
  // Com `toISOString()` a chave era lida em UTC depois de uma aritmética
  // local: no fuso do Brasil a borda saltava 24h a partir das 21h, e os
  // dois canais do mesmo emblema passavam a medir períodos diferentes.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffKey = dateKeyFromLocal(cutoff);

  return useQuery({
    staleTime: 60_000,
    queryKey: [...learningKeys.all, 'recent-reads', cutoffKey] as const,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('learning_view')
        .select('material_id', { count: 'exact', head: true })
        .gte('read_at', `${cutoffKey}T00:00:00Z`);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
