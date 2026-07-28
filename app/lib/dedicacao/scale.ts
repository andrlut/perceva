/**
 * Shared window-XP normalization for the Dedicação (Praticada) pillar.
 *
 * The hex and the dimension-card bars must map XP to length the *same* way,
 * or the bars quietly disagree with the chart above them. This is that one
 * mapping — relative to the leading dimension in the current window:
 *
 *   - LEADER_RATIO (0.85): the leader stops at 85% of the track, so it reads
 *     "biggest this window", not "maxed out" — the scale is relative, not an
 *     achievement. Every bar therefore has 15% of headroom; mark it with a
 *     tick to explain the gap.
 *   - MIN_RATIO (0.07): any non-zero value keeps a 7% floor so a token amount
 *     stays visible instead of collapsing to nothing. Applies only to xp > 0.
 *
 * Feed every bar (dim and sub) the same `max` — the leading dimension's
 * window XP — so a dim bar's fill equals its hex vertex radius and its two
 * sub bars read as a decomposition of it.
 */
export const LEADER_RATIO = 0.85;
export const MIN_RATIO = 0.07;

export function windowRatio(xp: number, max: number): number {
  return max > 0 && xp > 0 ? Math.max(MIN_RATIO, (xp / max) * LEADER_RATIO) : 0;
}
