import type { Recurrence, SubId, TaskTemplateWithSubs } from '@/lib/db/types';
import { isEffectivelyDaily } from '@/lib/recurrence';
import { rewardForTaskSubs } from '@/lib/xp';

/**
 * Onboarding starter pack — a CLOSED suggestion, not a catalog browser.
 *
 * The maintainer's rules (2026-09-25/26): one practice per sub-area, all 12,
 * doing each once pays close to 300 of Dedicação (a level is a flat 100 XP),
 * and the screen offers no alternatives — accept the pack, untick some, or
 * skip. It only exists to break the first-day inertia; everything is editable
 * later. With today's catalog: 4 × 3★ (35) + 8 × 2★ (20) = 300.
 *
 * ORDER IS PRIORITY: the screen numbers the rows 1-12 and "Top 3 / Top 6"
 * take a prefix of this list. Foundations first (sleep, movement, attention,
 * reading), then nutrition and relationships, then the rest. The screen sums
 * each template's REAL sub allocations (templateXp), so a catalog or curve
 * rebalance shows up by itself — re-check the ~300 rule here when it does.
 *
 * Catalog adoptions are unlimited on the free plan (migration
 * 20260925000001), so the whole pack fits a free account.
 */
export const STARTER_PACK: readonly { sub: SubId; templateId: string }[] = [
  { sub: 'sleep', templateId: 'sleep_no_phone_22' }, // 3★ · daily
  { sub: 'strength', templateId: 'movement_strength_3x' }, // 3★ · Mon/Wed/Fri
  { sub: 'contemplate', templateId: 'contemplate_meditate_10' }, // 2★ · daily
  { sub: 'learn', templateId: 'learn_read_20min' }, // 2★ · daily
  { sub: 'nutrition', templateId: 'nutrition_no_ultraprocessed' }, // 3★ · 1× a week
  { sub: 'circle', templateId: 'circle_meet_in_person' }, // 2★ · 1× a week
  { sub: 'career', templateId: 'career_skill_30min' }, // 2★ · daily
  { sub: 'dexterity', templateId: 'dexterity_balance' }, // 2★ · daily
  { sub: 'money', templateId: 'money_review_budget' }, // 2★ · monthly
  { sub: 'romance', templateId: 'romance_intentional_date' }, // 3★ · 1× a week
  { sub: 'build', templateId: 'build_30min_project' }, // 2★ · daily
  { sub: 'play', templateId: 'play_sport_1h' }, // 2★ · Wed/Sat
];

export const STARTER_PACK_IDS: readonly string[] = STARTER_PACK.map((p) => p.templateId);

/** Dedicação a template pays when done once — the sum over its real
 *  per-sub star allocations, the same math the server credits. */
export function templateXp(tpl: Pick<TaskTemplateWithSubs, 'subs'>): number {
  return rewardForTaskSubs(tpl.subs).total.xp;
}

export type PackCadence = 'daily' | 'weekly' | 'monthly';

/**
 * The one-word cadence a pack row shows. A weekly row covering all seven
 * days behaves as a daily everywhere else in the app, so it reads as daily.
 */
export function templateCadence(rec: Recurrence): PackCadence {
  if (isEffectivelyDaily(rec)) return 'daily';
  return rec.type === 'monthly' ? 'monthly' : 'weekly';
}
