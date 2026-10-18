import { useMemo } from 'react';

import { dateKeyFromLocal } from '@/lib/api/history';
import { useIdeaCollection, type AbsorbedRow } from '@/lib/ideaCollection';
import type { IdeaLocale } from '@/lib/ideas';

/**
 * Treino de ideias — who is due today, on the client.
 *
 * The SERVER owns the whole schedule (migrations 20261018000003/4):
 * `review_idea` stamps `train_due` = the next local day when an idea is first
 * favorited (recalling a minute after reading is rereading); `train_idea`
 * moves it — a hit to 3, 7 and 21 days, then firm every 60; a miss back to
 * tomorrow; only the day's first answer counts. This file only READS it:
 *
 *   due today ⟺ favorite ∧ train_due ≤ today ∧ trained_on ≠ today
 *
 * The MCP's get_idea_training (supabase/functions/perceva-mcp/learning.ts)
 * deals the same deck with the same rule and the same order — keep the two
 * in step. Dates are local YYYY-MM-DD strings, so string comparison orders them.
 */

/** Ideas dealt per session. "Mais N" deals the next ones. Same rhythm as
 *  the Explorar sets. */
export const TRAIN_SESSION_SIZE = 5;

/** How many times a missed card comes back at the end of the same session. */
export const TRAIN_MAX_RETURNS = 2;

export interface TrainingSummary {
  /** Due today: oldest due first, then catalog order. */
  due: AbsorbedRow[];
  favorites: number;
  /** Favorites with 3 spaced hits in a row (train_box 3). */
  firm: number;
  /** The next day anything comes due after today, or null. */
  nextDue: string | null;
}

function summarizeTraining(absorbed: readonly AbsorbedRow[], today: string): TrainingSummary {
  const due: AbsorbedRow[] = [];
  let favorites = 0;
  let firm = 0;
  let nextDue: string | null = null;
  for (const a of absorbed) {
    const { favorite, trainDue, trainedOn, trainBox } = a.review;
    if (favorite !== true) continue;
    favorites += 1;
    if (trainBox >= 3) firm += 1;
    if (trainDue === null) continue; // not stamped yet (cache before the refetch)
    if (trainDue <= today && trainedOn !== today) due.push(a);
    else if (trainDue > today && (nextDue === null || trainDue < nextDue)) nextDue = trainDue;
  }
  due.sort((a, b) => {
    const da = a.review.trainDue ?? '';
    const db = b.review.trainDue ?? '';
    if (da !== db) return da < db ? -1 : 1;
    if (a.row.slug !== b.row.slug) return a.row.slug < b.row.slug ? -1 : 1;
    return a.row.ordinal - b.row.ordinal;
  });
  return { due, favorites, firm, nextDue };
}

/** The training state for the screens: the collection plus today's deck. */
export function useIdeaTraining(locale: IdeaLocale) {
  const collection = useIdeaCollection(locale);
  const today = dateKeyFromLocal(new Date());
  const summary = useMemo(
    () => summarizeTraining(collection.absorbed, today),
    [collection.absorbed, today],
  );
  return { ...collection, ...summary };
}
