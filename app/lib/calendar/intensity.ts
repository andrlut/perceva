/**
 * The calendar's single intensity ramp — one hue, five steps of lightness.
 *
 * ## Why one hue and not the old multi-channel cell
 *
 * The previous month grid painted the cell background with the mood ramp
 * (blue→gold), printed XP in the middle and stacked up to four dimension dots
 * at the bottom: up to eleven hues fighting inside 46dp. Every channel was
 * individually defensible; the sum was not. The calendar now answers ONE
 * question per front, and the Rotina front answers "how much did this day
 * yield?" with a single hue whose LIGHTNESS carries the value — the channel a
 * red-green deficiency preserves intact. Hue here is brand identity, never
 * meaning: the day number is printed on top, so the exact figure never depends
 * on reading the fill at all.
 *
 * ## The hexes are a validated result, not taste
 *
 * Derived with the same OKLCH method as `lib/mood.ts` and checked with a CVD
 * validator against the app background (#0A0E26):
 *
 *   step  fill      OKLab L   ink        contrast(ink)   worst adjacent ΔE
 *   N1    #2E2A5C   0.318     white      13.11
 *   N2    #4A3F9E   0.434     white       8.41           12.9 (deutan)
 *   N3    #6F51F0   0.560     white       5.11
 *   N4    #A78FFF   0.719     bg.deep     7.26
 *   N5    #D9CCFF   0.872     bg.deep    12.71
 *
 * **N3 is #6F51F0 and NOT `tokens.brand.violet` (#7B5CFF).** The brand violet
 * sits at exactly 4.36:1 against BOTH white and near-black — the one lightness
 * where no ink clears the 4.5 floor. #6F51F0 is the nearest step that does
 * (5.11 on white) while keeping the ramp monotonic. Re-run the validator before
 * touching any of these values; changing one re-opens both the contrast and the
 * CVD question.
 *
 * The same ramp is deliberately reused by the Vault front (gold) and the mood
 * front (its own validated ramp) only as a *structure* — each front owns its
 * palette, and no two palettes are ever on screen at once. See
 * `components/calendar/CalendarCell.tsx`.
 */

import { tokens } from '@/theme';

/** 0 = no activity (unfilled cell); 1..5 = the ramp. */
export type IntensityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface RampStep {
  /** Cell fill. */
  bg: string;
  /** Ink for the day number and the XP figure drawn on that fill. */
  ink: string;
  /** Ink for the small corner day number — the same hue, deliberately quieter. */
  inkDim: string;
}

const INK_LIGHT = '#FFFFFF';
const INK_DARK = tokens.bg.deep;

/**
 * Index 0 is the empty cell: it is the page background showing through, so it
 * takes the light ink like any other unfilled surface in the app.
 */
export const INTENSITY_RAMP: readonly RampStep[] = [
  {
    bg: 'rgba(255,255,255,0.03)',
    ink: tokens.text.base,
    inkDim: tokens.text.dim,
  },
  { bg: '#2E2A5C', ink: INK_LIGHT, inkDim: 'rgba(255,255,255,0.70)' },
  { bg: '#4A3F9E', ink: INK_LIGHT, inkDim: 'rgba(255,255,255,0.70)' },
  { bg: '#6F51F0', ink: INK_LIGHT, inkDim: 'rgba(255,255,255,0.72)' },
  { bg: '#A78FFF', ink: INK_DARK, inkDim: 'rgba(10,14,38,0.65)' },
  { bg: '#D9CCFF', ink: INK_DARK, inkDim: 'rgba(10,14,38,0.65)' },
];

export function rampStep(level: IntensityLevel): RampStep {
  return INTENSITY_RAMP[level] ?? INTENSITY_RAMP[0];
}

/**
 * The reference a day's XP is measured against: the 90th percentile of the
 * active days in the **visible month**, floored so a thin month cannot make
 * two completions look like a personal record.
 *
 * Deliberately frozen per calendar month rather than a rolling 60-day window.
 * A rolling reference silently re-tints days the user already looked at — the
 * same Tuesday reads N4 today and N3 next week — which reads as a bug, not as
 * insight. Scoped to the month, a cell's tint is a function of the month you
 * are looking at and nothing else.
 *
 * Note this makes tints comparable WITHIN a month, not across months; that is
 * why the day number (the exact figure) is always printed on top and the
 * quarter view stays deliberately coarse.
 */
const REFERENCE_FLOOR = 100;

export function intensityReference(dailyXp: Iterable<number>): number {
  const active = [...dailyXp].filter((xp) => xp > 0).sort((a, b) => a - b);
  if (active.length === 0) return REFERENCE_FLOOR;
  const idx = Math.min(active.length - 1, Math.floor(0.9 * active.length));
  return Math.max(REFERENCE_FLOOR, active[idx]);
}

/**
 * Quantize a day's XP against `reference`. Thresholds are quarters of the
 * reference, with the top step reserved for days that MEET it — so N5 means
 * "one of this month's best", not merely "a lot".
 */
export function intensityForXp(xp: number, reference: number): IntensityLevel {
  if (xp <= 0) return 0;
  const ratio = xp / Math.max(1, reference);
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  if (ratio < 1) return 4;
  return 5;
}

/**
 * Compact XP for the cell's headline figure. The cell is ~44dp wide with ~38dp
 * of usable width, and Manrope's widest digit ("0") advances 0.674em, so three
 * glyphs at 12.5dp measure ~25dp and fit with room to spare — but four do not
 * once the ramp's inner padding is counted. Four-digit days therefore round to
 * "1k" rather than ellipsizing into a wrong figure ("120…").
 */
export function formatCellXp(xp: number): string {
  if (xp < 1000) return String(xp);
  return `${Math.round(xp / 1000)}k`;
}
