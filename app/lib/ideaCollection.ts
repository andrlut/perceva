import { useMemo } from 'react';

import {
  reviewKey,
  useIdeaCards,
  useIdeaReviews,
  useLearningFeed,
  type LearningFeedCard,
} from '@/lib/api/learning';
import type { IdeaReview, LearningIdeaPublic } from '@/lib/db/types';
import type { IdeaLocale } from '@/lib/ideas';

/**
 * The reader's absorbed ideas, shared by "Minhas ideias" (`/collection`) and
 * the review pile (`/idea-review`).
 *
 * Every published idea (`useIdeaCards()`, the `learning_idea_public` view)
 * joined with the user's review rows (`useIdeaReviews()`, one per absorbed
 * idea). The feed only contributes the material side — its title (the line
 * under the review counter) and its subs (search) — so its failure never
 * blocks either screen; waiting for it just avoids titles popping in late.
 */

export interface AbsorbedRow {
  row: LearningIdeaPublic;
  review: IdeaReview;
}

const EMPTY_REVIEWS: ReadonlyMap<string, IdeaReview> = new Map();
const EMPTY_PENDING: readonly IdeaReview[] = [];

/**
 * Collection order: most recently reviewed first (unreviewed last), then
 * newest release, then reading order inside the material.
 */
export function compareAbsorbed(a: AbsorbedRow, b: AbsorbedRow): number {
  const ra = a.review.reviewedAt ? Date.parse(a.review.reviewedAt) : Number.NEGATIVE_INFINITY;
  const rb = b.review.reviewedAt ? Date.parse(b.review.reviewedAt) : Number.NEGATIVE_INFINITY;
  if (ra !== rb) return rb > ra ? 1 : -1;
  const byRelease = Date.parse(b.row.released_at) - Date.parse(a.row.released_at);
  if (byRelease !== 0) return byRelease;
  return a.row.ordinal - b.row.ordinal;
}

export function useIdeaCollection(locale: IdeaLocale) {
  const ideaCards = useIdeaCards();
  const reviews = useIdeaReviews();
  const feed = useLearningFeed();

  const byKey = reviews.data?.byKey ?? EMPTY_REVIEWS;
  const pendingReviews = reviews.data?.pending ?? EMPTY_PENDING;

  /** material_id → feed card (title, subs). */
  const materials = useMemo(() => {
    const map = new Map<string, LearningFeedCard>();
    for (const card of feed.data ?? []) map.set(card.id, card);
    return map;
  }, [feed.data]);

  /** material_id → title in the app locale, the other language as fallback. */
  const titles = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of materials.values()) {
      const title =
        locale === 'pt' ? card.title_pt || card.title_en : card.title_en || card.title_pt;
      map.set(card.id, title ?? '');
    }
    return map;
  }, [materials, locale]);

  /** Published ideas the user absorbed, each with its review row. */
  const absorbed = useMemo<AbsorbedRow[]>(() => {
    const out: AbsorbedRow[] = [];
    for (const row of ideaCards.data ?? []) {
      const review = byKey.get(reviewKey(row.material_id, row.idea_id));
      if (review) out.push({ row, review });
    }
    return out;
  }, [ideaCards.data, byKey]);

  /**
   * The review pile, oldest absorbed first. A pending row whose idea is no
   * longer published (a re-cut) has no card to show and is skipped.
   */
  const pending = useMemo<AbsorbedRow[]>(() => {
    const rowsByKey = new Map<string, AbsorbedRow>();
    for (const a of absorbed) rowsByKey.set(reviewKey(a.row.material_id, a.row.idea_id), a);
    const out: AbsorbedRow[] = [];
    for (const r of pendingReviews) {
      const hit = rowsByKey.get(reviewKey(r.materialId, r.ideaId));
      if (hit) out.push(hit);
    }
    return out;
  }, [absorbed, pendingReviews]);

  const loading = ideaCards.isLoading || reviews.isLoading || feed.isLoading;
  const failed = ideaCards.isError || reviews.isError;
  const retry = () => {
    ideaCards.refetch();
    reviews.refetch();
    if (feed.isError) feed.refetch();
  };

  return { absorbed, pending, materials, titles, loading, failed, retry };
}
