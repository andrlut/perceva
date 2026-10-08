/**
 * XP curve and level math.
 * Mirrors the difficulty -> reward mapping used by the complete_task RPC.
 *
 * Momentum (the 30-day decayed XP bonus) went DORMANT in 2026-08: the
 * server RPCs no longer apply it and the client math/UI were removed —
 * git history (and migration 20260514000002) keep the full mechanics if
 * it ever comes back.
 */

import type { CoinMultiplier, TaskSub } from '@/lib/db/types';

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
 * Linear since 2026-09-27: every star is worth 10 XP (10/20/30/40/50). It
 * explains itself in one sentence — "XP = stars × 10" — and 2★ + 3★ across
 * two subs now pays the same as 5★ on one sub (the old 10/20/35/55/80 curve
 * paid 55 vs 80, the first thing a new user would question). History:
 * 5/15/40/100/250 → 10/20/35/55/80 (2026-05-28) → linear. Missions already
 * paid 10 XP per star (`lib/quests/reward.ts`). Coins = XP × the practice's
 * coin multiplier.
 *
 * Mirror of the SQL `public.base_xp_for_stars` helper — keep both in
 * lockstep (server is authoritative; this table is the optimistic preview).
 */
const REWARD_BY_DIFFICULTY: Record<Difficulty, { xp: number; coins: number }> = {
  1: { xp: 10, coins: 10 },
  2: { xp: 20, coins: 20 },
  3: { xp: 30, coins: 30 },
  4: { xp: 40, coins: 40 },
  5: { xp: 50, coins: 50 },
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
  /** Coins relative to XP for this log (0 / 0.5 / 1 / 2). XP is untouched. */
  coinMultiplier: number = 1,
): TaskRewardBreakdown {
  let totalXp = 0;
  let totalCoins = 0;
  let totalStars = 0;
  const perSub: TaskRewardBreakdown['perSub'] = [];
  for (const s of subs) {
    const base = REWARD_BY_DIFFICULTY[s.stars];
    const xp = base.xp;
    // Per sub, rounded half up — the same rule as round() in complete_task,
    // so the preview matches what the server credits (1 star at half = 5).
    const coins = Math.round(base.coins * coinMultiplier);
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
 * How many coins a practice pays relative to its XP — Nada / Metade / Igual /
 * Dobro. XP stays the stars (the effort spent); coins are what the practice is
 * worth in the reward economy. Mirrors the closed set of the migration
 * `coin_multiplier` (CHECK on the columns + validation in complete_task).
 */
export const COIN_MULTIPLIER_BY_KEY = {
  none: 0,
  half: 0.5,
  same: 1,
  double: 2,
} as const satisfies Record<string, CoinMultiplier>;

export type CoinMultiplierKey = keyof typeof COIN_MULTIPLIER_BY_KEY;

export function coinMultiplierKey(m: number): CoinMultiplierKey {
  if (m === 0) return 'none';
  if (m === 0.5) return 'half';
  if (m === 2) return 'double';
  return 'same';
}

/** A row's `numeric` value → the closed set. Anything unexpected reads as 1,
 *  the old coins == XP rule, never as a bigger payout. */
export function asCoinMultiplier(v: unknown): CoinMultiplier {
  const n = Number(v);
  return (n === 0 || n === 0.5 || n === 2 ? n : 1) as CoinMultiplier;
}

/**
 * Level curve in TIERS of ten (owner, 2026-10-08): levels 1→11 cost 100 XP
 * each, 11→21 cost 200 each, 21→31 cost 300 each, and so on — "every ten
 * levels, a level costs 100 more". Fast for someone starting (a month of
 * daily practice ≈ level 23), genuinely harder as time goes by (a year ≈ 89).
 * Replaced the flat 100-per-level (2026-07-01), which put a months-long daily
 * user past level 120.
 *
 * Cost of going from level L to L+1: 100 × ceil(L / 10).
 * XP to REACH level L (n = L − 1, t = floor(n/10) full tiers, r = n mod 10):
 *   100 × (5·t·(t+1) + r·(t+1))
 * level 1 = 0, 11 = 1 000, 21 = 3 000, 31 = 6 000, 41 = 10 000 XP.
 *
 * Mirrored in supabase/functions/perceva-mcp (get_profile_summary) — keep
 * both in lockstep.
 */
const XP_TIER_SIZE = 10;
const XP_TIER_STEP = 100;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  const t = Math.floor(n / XP_TIER_SIZE);
  const r = n % XP_TIER_SIZE;
  return XP_TIER_STEP * ((XP_TIER_SIZE / 2) * t * (t + 1) + r * (t + 1));
}

export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  // Full tiers first (tier t costs 1 000·t), then the levels inside the
  // current one (each costs 100·(t + 1)).
  let t = 0;
  while (xpForLevel((t + 1) * XP_TIER_SIZE + 1) <= xp) t += 1;
  const rest = xp - xpForLevel(t * XP_TIER_SIZE + 1);
  const r = Math.floor(rest / (XP_TIER_STEP * (t + 1)));
  return t * XP_TIER_SIZE + Math.min(r, XP_TIER_SIZE - 1) + 1;
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
