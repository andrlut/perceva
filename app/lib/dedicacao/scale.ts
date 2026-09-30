/**
 * Shared XP → length mapping for the Dedicação (Praticada) pillar.
 *
 * The scale is ABSOLUTE: everything is measured against the window's
 * saturation (lib/saturation.ts — 300 XP per 30 days, the minimum of a 1★
 * practice every day, prorated to the days elapsed). Two readings of it:
 *
 *   The hex, with its teto (the default) — `saturationRatio`:
 *     sub → min(xp, cap) / cap
 *     dim → the mean of its two subs: a dimension is full only when BOTH of
 *           its subs are, which is the balance the app is about.
 *   A full vertex means "trained enough here"; past it, more XP in one area
 *   no longer grows the shape.
 *
 *   The bars under the hex — `barSegments`: the track runs to BAR_SPAN × the
 *   ruler, so the ruler always sits at the same third of the length ("o
 *   traço é o 300", in every period) and the other two thirds show what went
 *   PAST it — the one thing the capped hex cannot. The hex's other views
 *   (`rimRatio`) move its rim out to 2× or 3× the ruler — 600 or 900 in 30
 *   days, the last being the bars' own end.
 *
 * It replaced a leader-relative scale (the leading axis at 85%, everything
 * else proportional to it), which let one heavy sub squash the other eleven
 * toward the center.
 *
 * MIN_RATIO keeps any non-zero value visible on the hex as a sliver.
 */
export const MIN_RATIO = 0.05;

/** How many rulers fit on a bar (and on the hex without its teto). */
export const BAR_SPAN = 3;

export function saturationRatio(xp: number, cap: number): number {
  if (cap <= 0 || xp <= 0) return 0;
  return Math.max(MIN_RATIO, Math.min(1, xp / cap));
}

/**
 * The hex's rims, as multiples of the ruler: 300 (the teto — "did I cover each
 * area?"), 600 and 900 (the bars' end — "how far past the minimum?"). 600 is
 * the owner's experiment (2026-09-29): with it, a 1★-a-day practice alone
 * only half-fills an area.
 */
export const HEX_RIMS = [1, 2, BAR_SPAN] as const;
export type HexRim = (typeof HEX_RIMS)[number];

/** XP against `rim` × the ruler. `rim` 1 is `saturationRatio`. */
export function rimRatio(xp: number, cap: number, rim: number): number {
  return saturationRatio(xp, cap * rim);
}

/**
 * A bar's two segments, as fractions of the whole track: `base` runs up to
 * the ruler (what the capped hex already shows), `over` is what went past it,
 * and `clipped` flags XP beyond the track's end (BAR_SPAN × the ruler) —
 * there the number beside the bar carries the true value.
 */
export function barSegments(
  xp: number,
  cap: number,
): { base: number; over: number; clipped: boolean } {
  if (cap <= 0 || xp <= 0) return { base: 0, over: 0, clipped: false };
  const span = cap * BAR_SPAN;
  return {
    base: Math.min(xp, cap) / span,
    over: xp > cap ? (Math.min(xp, span) - cap) / span : 0,
    clipped: xp > span,
  };
}

/** A dimension's fill: the mean of its subs' fills. */
export function meanRatio(ratios: number[]): number {
  return ratios.length ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length : 0;
}

/** Ratio (0..1) → clamped CSS percentage width for bar fills. */
export function pct(ratio: number): `${number}%` {
  return `${Math.max(0, Math.min(100, ratio * 100))}%`;
}
