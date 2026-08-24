/**
 * How a day is painted on each front — the single source the grid, the list
 * and the quarter view all read.
 *
 * Each front owns a palette and never borrows another's, which is the rule
 * that keeps the calendar from collapsing back into the old confetti cell:
 *
 *   Rotina  → the violet intensity ramp (lib/calendar/intensity.ts)
 *   Humor   → the validated blue→gold mood ramp (lib/mood.ts)
 *   Vault   → gold, and gold appears nowhere else
 *
 * Only one front is on screen at a time, so the three palettes never share a
 * pixel. Note what does NOT vary: cell geometry. A front swaps the fill and the
 * figure inside a box whose size, radius and position are fixed, so switching
 * chips re-tints the month instead of relaying it out — no reflow, no reflowing
 * scroll position, and nothing to re-measure.
 */

import type { CalendarDay } from '@/lib/calendar/filters';
import { intensityForXp, rampStep } from '@/lib/calendar/intensity';
import type { CalendarFront } from '@/lib/calendar/store';
import { moodLevel } from '@/lib/mood';
import { tokens } from '@/theme';

export interface DayPaint {
  /** Cell background. */
  bg: string;
  /** Ink for the headline figure drawn on `bg`. */
  ink: string;
  /** Ink for the small corner day number. */
  inkDim: string;
  /** True when the cell carries a real fill (vs. the empty slot). */
  filled: boolean;
  /** Border color; only the empty slot draws one. */
  border: string;
}

const EMPTY_BG = 'rgba(255,255,255,0.03)';

/** Gold at the same alpha the reward chips use, so the Vault reads as Vault. */
const VAULT_BG = 'rgba(255, 200, 61, 0.14)';
const VAULT_BORDER = 'rgba(255, 200, 61, 0.38)';

function emptyPaint(): DayPaint {
  return {
    bg: EMPTY_BG,
    ink: tokens.text.base,
    inkDim: tokens.text.dim,
    filled: false,
    border: tokens.border.base,
  };
}

export function paintForFront(
  day: CalendarDay | undefined,
  front: CalendarFront,
  reference: number,
): DayPaint {
  if (!day) return emptyPaint();

  if (front === 'humor') {
    if (day.mood === null) return emptyPaint();
    const level = moodLevel(day.mood);
    return {
      bg: level.color,
      ink: level.ink,
      // The mood ramp spans light and dark fills, so the quiet corner ink has
      // to be derived from the level's own ink rather than fixed.
      inkDim: level.ink === '#FFFFFF' ? 'rgba(255,255,255,0.72)' : 'rgba(10,14,38,0.62)',
      filled: true,
      border: 'transparent',
    };
  }

  if (front === 'vault') {
    if (day.redemptions.length === 0) return emptyPaint();
    return {
      bg: VAULT_BG,
      ink: tokens.semantic.coin,
      inkDim: tokens.text.dim,
      filled: true,
      border: VAULT_BORDER,
    };
  }

  const level = intensityForXp(day.xp, reference);
  if (level === 0) return emptyPaint();
  const step = rampStep(level);
  return {
    bg: step.bg,
    ink: step.ink,
    inkDim: step.inkDim,
    filled: true,
    border: 'transparent',
  };
}

/**
 * Does this front have anything to say about this day? Drives the list view
 * (which shows only days the front can speak to) and the quarter tint.
 */
export function frontHasContent(day: CalendarDay | undefined, front: CalendarFront): boolean {
  if (!day) return false;
  if (front === 'humor') return day.mood !== null;
  if (front === 'vault') return day.redemptions.length > 0;
  return day.practices.length > 0;
}

/**
 * Opacity for a day that survived the filter vs. one that did not. Dimming
 * rather than hiding is load-bearing: the month keeps its shape, so a filter
 * reads as focus instead of as missing data, and the grid never reflows.
 */
export const FILTERED_OUT_OPACITY = 0.22;
