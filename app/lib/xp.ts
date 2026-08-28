/**
 * XP curve and level math.
 * Mirrors the difficulty -> reward mapping used by the complete_task RPC.
 *
 * Momentum (the 30-day decayed XP bonus) went DORMANT in 2026-08: the
 * server RPCs no longer apply it and the client math/UI were removed —
 * git history (and migration 20260514000002) keep the full mechanics if
 * it ever comes back.
 */

import type { TaskSub } from '@/lib/db/types';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Trivial',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Heroic',
};

/**
 * Per-star XP/coins reward table.
 *
 * Rebalanced from 5/15/40/100/250 (razão 50×) → 10/20/35/55/80 (razão 8×).
 * The old curve was too exponential — 4★ and 5★ tasks felt unreachable in
 * day-to-day use, even though the harder ones should still pay more. New
 * jumps are ~1.45-2× per tier, a gentle, consistent progression. XP and
 * coins stay 1:1 by current convention.
 *
 * Mirror of the SQL `public.base_xp_for_stars` helper — keep both in
 * lockstep (server is authoritative; this table is the optimistic preview).
 */
const REWARD_BY_DIFFICULTY: Record<Difficulty, { xp: number; coins: number }> = {
  1: { xp: 10, coins: 10 },
  2: { xp: 20, coins: 20 },
  3: { xp: 35, coins: 35 },
  4: { xp: 55, coins: 55 },
  5: { xp: 80, coins: 80 },
};

export function rewardForDifficulty(difficulty: Difficulty) {
  return REWARD_BY_DIFFICULTY[difficulty];
}

export function baseXpForDifficulty(difficulty: Difficulty): number {
  return REWARD_BY_DIFFICULTY[difficulty].xp;
}

export interface TaskRewardBreakdown {
  /** Per-sub rewards in the same order as the input list. */
  perSub: { sub_id: TaskSub['sub_id']; stars: Difficulty; xp: number; coins: number }[];
  /** Sum across subs. */
  total: { xp: number; coins: number };
  /** Sum of stars across subs. */
  totalStars: number;
}

export function rewardForTaskSubs(
  subs: TaskSub[],
): TaskRewardBreakdown {
  let totalXp = 0;
  let totalCoins = 0;
  let totalStars = 0;
  const perSub: TaskRewardBreakdown['perSub'] = [];
  for (const s of subs) {
    const base = REWARD_BY_DIFFICULTY[s.stars];
    const xp = base.xp;
    const coins = base.coins;
    perSub.push({ sub_id: s.sub_id, stars: s.stars, xp, coins });
    totalXp += xp;
    totalCoins += coins;
    totalStars += s.stars;
  }
  return {
    perSub,
    total: { xp: totalXp, coins: totalCoins },
    totalStars,
  };
}

/**
 * Linear curve: every level costs a flat 100 XP. Recalibrated from the
 * old quadratic (level-1)²×100, which was tuned for the pre-rebalance
 * reward curve (~3× larger) and left leveling punishingly slow after the
 * XP rebalance (reward ratio 50×→8×). Flat-linear keeps the math trivial
 * and the inverse exact — no off-by-one at level boundaries.
 *
 * level 1 = 0, 2 = 100, 3 = 200, 5 = 400, 10 = 900, 20 = 1900 XP.
 * Inverse: level = floor(xp / 100) + 1
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 100;
}

export function levelForXp(xp: number): number {
  if (xp < 0) return 1;
  return Math.floor(xp / 100) + 1;
}

/**
 * Returns progress toward next level as { xpInLevel, xpNeededForLevel, fraction }.
 */
export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const xpAtLevelStart = xpForLevel(level);
  const xpAtNextLevel = xpForLevel(level + 1);
  const xpInLevel = xp - xpAtLevelStart;
  const xpNeededForLevel = xpAtNextLevel - xpAtLevelStart;
  return {
    level,
    xpInLevel,
    xpNeededForLevel,
    fraction: xpNeededForLevel === 0 ? 0 : xpInLevel / xpNeededForLevel,
  };
}
