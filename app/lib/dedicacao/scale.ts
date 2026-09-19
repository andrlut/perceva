/**
 * Shared XP → length mapping for the Dedicação (Praticada) pillar. The hex
 * and every card bar map XP the SAME way, so a bar's fill always equals its
 * hex vertex.
 *
 * The scale is ABSOLUTE: each sub fills against the window's saturation
 * (lib/saturation.ts — 300 XP per 30 days, the minimum of a 1★ practice every
 * day, prorated to the days elapsed). A full vertex means "trained enough
 * here"; past it, more XP in one area no longer grows the shape.
 *
 *   sub → min(xp, cap) / cap
 *   dim → the mean of its two subs: a dimension is full only when BOTH of
 *         its subs are, which is the balance the app is about.
 *
 * It replaced a leader-relative scale (the leading axis at 85%, everything
 * else proportional to it), which let one heavy sub squash the other eleven
 * toward the center.
 *
 * MIN_RATIO keeps any non-zero value visible as a sliver.
 */
export const MIN_RATIO = 0.05;

export function saturationRatio(xp: number, cap: number): number {
  if (cap <= 0 || xp <= 0) return 0;
  return Math.max(MIN_RATIO, Math.min(1, xp / cap));
}

/** A dimension's fill: the mean of its subs' fills. */
export function meanRatio(ratios: number[]): number {
  return ratios.length ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length : 0;
}

/** Ratio (0..1) → clamped CSS percentage width for bar fills. */
export function pct(ratio: number): `${number}%` {
  return `${Math.max(0, Math.min(100, ratio * 100))}%`;
}
