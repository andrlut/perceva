import { useMemo } from 'react';

import { dateKeyFromLocal } from '@/lib/api/history';
import type { IdeaReview } from '@/lib/db/types';
import { useIdeaCollection, type AbsorbedRow } from '@/lib/ideaCollection';
import type { IdeaLocale } from '@/lib/ideas';

/**
 * Treino de ideias — who is due today, on the client.
 *
 * The SERVER owns the schedule (`train_idea`, migration 20261018000003):
 * a hit moves an idea to 3, 7 and 21 days, then it is firm and comes back
 * every 60; a miss brings it back tomorrow; the day's first answer is the
 * only one that counts. This file only READS that schedule to deal the deck:
 *
 *   in training ⟺ favorite (the reader chose to keep it)
 *   due today   ⟺ train_due ≤ today, or never trained and reviewed before
 *                 today (a favorite joins the day AFTER it was kept: trying
 *                 to recall a minute after reading is rereading)
 *
 * Dates are local YYYY-MM-DD strings, so plain string comparison orders them.
 */

/** Ideas dealt per session. "Mais 5" deals the next five. Same rhythm as
 *  the Explorar sets. */
export const TRAIN_SESSION_SIZE = 5;

/** How many times a missed card comes back at the end of the same session. */
export const TRAIN_MAX_RETURNS = 2;

/** 3 hits in spaced sessions = firm (train_box 3). */
export const TRAIN_FIRM_BOX = 3;

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The day the idea is (or was) due. null = not in training (not a favorite). */
export function effectiveDue(review: IdeaReview): string | null {
  if (review.favorite !== true) return null;
  if (review.trainDue) return review.trainDue;
  if (!review.reviewedAt) return null;
  return addDays(dateKeyFromLocal(new Date(review.reviewedAt)), 1);
}

export function isDue(review: IdeaReview, today: string): boolean {
  if (review.trainedOn === today) return false;
  const due = effectiveDue(review);
  return due !== null && due <= today;
}

export function isFirm(review: IdeaReview): boolean {
  return review.favorite === true && review.trainBox >= TRAIN_FIRM_BOX;
}

export interface TrainingSummary {
  /** Due today, most overdue first. */
  due: AbsorbedRow[];
  favorites: number;
  firm: number;
  /** The next day anything comes due after today, or null. */
  nextDue: string | null;
}

export function summarizeTraining(absorbed: readonly AbsorbedRow[], today: string): TrainingSummary {
  const due: AbsorbedRow[] = [];
  let favorites = 0;
  let firm = 0;
  let nextDue: string | null = null;
  for (const a of absorbed) {
    if (a.review.favorite !== true) continue;
    favorites += 1;
    if (isFirm(a.review)) firm += 1;
    if (isDue(a.review, today)) {
      due.push(a);
      continue;
    }
    const d = effectiveDue(a.review);
    // Answered today and still "due" (an early hit) → next look is tomorrow.
    const next = d !== null && d > today ? d : addDays(today, 1);
    if (nextDue === null || next < nextDue) nextDue = next;
  }
  due.sort((a, b) => {
    const da = effectiveDue(a.review) ?? '';
    const db = effectiveDue(b.review) ?? '';
    if (da !== db) return da < db ? -1 : 1;
    const ra = a.review.reviewedAt ?? '';
    const rb = b.review.reviewedAt ?? '';
    if (ra !== rb) return ra < rb ? -1 : 1;
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
  return { ...collection, ...summary, today };
}
