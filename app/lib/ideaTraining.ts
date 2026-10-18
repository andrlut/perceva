import { useMemo } from 'react';

import { dateKeyFromLocal } from '@/lib/api/history';
import { reviewKey, useIdeaCards } from '@/lib/api/learning';
import { useIdeaCollection, type AbsorbedRow } from '@/lib/ideaCollection';
import type { IdeaLocale } from '@/lib/ideas';
import { useMaterialLock } from '@/lib/premium';

/**
 * Treino de ideias — the deck, on the client.
 *
 * The SERVER owns the whole schedule (migrations 20261018000003/4):
 * `review_idea` stamps `train_due` = the next local day when an idea is first
 * favorited; `train_idea` moves it — a hit to 3, 7 and 21 days, then firm
 * every 60; a miss back to tomorrow; only the day's first answer counts, and
 * an early hit (not due yet) changes nothing. That is what makes training
 * WHENEVER the reader wants safe: the dates only decide the ORDER here.
 *
 *   in the deck ⟺ favorite (every favorite, any day)
 *   due today   ⟺ train_due ≤ today ∧ trained_on ≠ today  (the "N hoje" count)
 *   order       ⟺ not answered today first, then train_due, slug, ordinal —
 *                 so whatever is due leads, then what comes due soonest
 *
 * A favorite stays trainable after its material leaves the free 30-day
 * window: what the reader kept is theirs (Minhas ideias does the same). The
 * free tier's limit is upstream — fewer ideas open to absorb and favorite.
 *
 * The MCP's get_idea_training (supabase/functions/perceva-mcp/learning.ts)
 * uses the same rule and order — keep the two in step. Dates are local
 * YYYY-MM-DD strings, so string comparison orders them.
 */

/** Ideas dealt per session. "Mais N" deals the next ones. Same rhythm as
 *  the Explorar sets. */
export const TRAIN_SESSION_SIZE = 5;

/** How many times a missed card comes back at the end of the same session. */
export const TRAIN_MAX_RETURNS = 2;

/** Favorites needed before the training opens — below it, the screen asks
 *  the reader to favorite more (one session's worth). */
export const TRAIN_MIN_FAVORITES = 5;

export interface TrainingDeckEntry {
  absorbed: AbsorbedRow;
  /** Due today — counts in "N hoje"; the rest is extra practice. */
  due: boolean;
}

export interface TrainingSummary {
  /** Every favorite, in training order. */
  deck: TrainingDeckEntry[];
  /** How many of the deck are due today. */
  dueCount: number;
  favorites: number;
  /** Favorites with 3 spaced hits in a row (train_box 3). */
  firm: number;
}

function summarizeTraining(absorbed: readonly AbsorbedRow[], today: string): TrainingSummary {
  const deck: TrainingDeckEntry[] = [];
  let dueCount = 0;
  let firm = 0;
  for (const a of absorbed) {
    const { favorite, trainDue, trainedOn, trainBox } = a.review;
    if (favorite !== true) continue;
    if (trainBox >= 3) firm += 1;
    const due = trainDue !== null && trainDue <= today && trainedOn !== today;
    if (due) dueCount += 1;
    deck.push({ absorbed: a, due });
  }
  deck.sort((x, y) => {
    const a = x.absorbed;
    const b = y.absorbed;
    const ta = a.review.trainedOn === today;
    const tb = b.review.trainedOn === today;
    if (ta !== tb) return ta ? 1 : -1;
    // Not stamped yet (the cache right after a favorite, before the refetch)
    // sorts last: the server is about to say "tomorrow".
    const da = a.review.trainDue ?? '9999-12-31';
    const db = b.review.trainDue ?? '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    if (a.row.slug !== b.row.slug) return a.row.slug < b.row.slug ? -1 : 1;
    return a.row.ordinal - b.row.ordinal;
  });
  return { deck, dueCount, favorites: deck.length, firm };
}

/**
 * The training state for the screens: the collection, the deck, and what
 * the reader can still do to reach TRAIN_MIN_FAVORITES — ideas waiting in
 * the review pile (`pending`) and ideas open to absorb (`toAbsorb`, published
 * and not locked for this tier).
 */
export function useIdeaTraining(locale: IdeaLocale) {
  const collection = useIdeaCollection(locale);
  const ideaCards = useIdeaCards();
  const isLocked = useMaterialLock();
  const today = dateKeyFromLocal(new Date());
  const summary = useMemo(
    () => summarizeTraining(collection.absorbed, today),
    [collection.absorbed, today],
  );
  const toAbsorb = useMemo(() => {
    const absorbedKeys = new Set(
      collection.absorbed.map((a) => reviewKey(a.row.material_id, a.row.idea_id)),
    );
    return (ideaCards.data ?? []).filter(
      (r) => !absorbedKeys.has(reviewKey(r.material_id, r.idea_id)) && !isLocked(r.released_at),
    ).length;
  }, [collection.absorbed, ideaCards.data, isLocked]);
  return { ...collection, ...summary, toAbsorb };
}
