import type {
  DimensionId,
  Recurrence,
  SubId,
  TaskTemplateWithSubs,
} from '@/lib/db/types';
import { isEffectivelyDaily } from '@/lib/recurrence';
import { rewardForTaskSubs } from '@/lib/xp';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

/**
 * Onboarding starter pack — the catalog practices the `pack` screen
 * (/tour/pack) opens with pre-selected. It replaced the old "pick exactly
 * 3" grid, whose arbitrary count was the first-user complaint.
 *
 * The rule (maintainer, 2026-09-25): ONE practice per sub-area, all 12,
 * and doing each of them once pays close to 300 of Dedicação — three
 * levels' worth, since a level is a flat 100 XP. With today's catalog:
 *
 *     4 × 3★ (35) + 8 × 2★ (20) = 140 + 160 = 300
 *
 * The screen never hardcodes those numbers: it sums each template's REAL
 * sub allocations through `templateXp` (→ rewardForTaskSubs), so a catalog
 * or curve rebalance shows up on screen by itself. When that happens,
 * re-check the ~300 rule here — `starterPackXp` does the sum.
 *
 * Keyed by sub so the type itself guarantees exactly one per sub-area.
 * Adoptions are unlimited on the free plan (migration 20260925000001:
 * only custom practices count toward the cap), so the whole pack fits a
 * free account.
 */
export const STARTER_PACK: Record<SubId, string> = {
  sleep: 'sleep_no_phone_22', // 3★ · daily
  // 3★ · stored as weekly on all 7 days, so the app reads it as daily
  nutrition: 'nutrition_no_ultraprocessed',
  strength: 'movement_strength_3x', // 3★ · weekly (id predates movement → strength)
  dexterity: 'dexterity_balance', // 2★ · daily
  learn: 'learn_read_20min', // 2★ · daily
  contemplate: 'contemplate_meditate_10', // 2★ · daily
  money: 'money_review_budget', // 2★ · monthly
  career: 'career_skill_30min', // 2★ · daily
  circle: 'circle_meet_in_person', // 2★ · weekly
  romance: 'romance_intentional_date', // 3★ · weekly
  play: 'play_sport_1h', // 2★ · weekly
  build: 'build_30min_project', // 2★ · daily
};

/** Area → sub-area display order: the order the pack lists AND adopts in,
 *  so the new practices land in the list grouped the way they were shown. */
export const PACK_SUB_ORDER: readonly SubId[] = DIMENSION_ORDER.flatMap(
  (dim) => SUBS_BY_DIM[dim],
);

export const STARTER_PACK_IDS: readonly string[] = PACK_SUB_ORDER.map(
  (sub) => STARTER_PACK[sub],
);

const PACK_ID_SET = new Set(STARTER_PACK_IDS);

/** Dedicação a template pays when done once — the sum over its real
 *  per-sub star allocations, the same math the server credits. */
export function templateXp(tpl: Pick<TaskTemplateWithSubs, 'subs'>): number {
  return rewardForTaskSubs(tpl.subs).total.xp;
}

/** Sum for the pack as the catalog stands (templates missing from the
 *  catalog simply don't count). */
export function starterPackXp(templates: readonly TaskTemplateWithSubs[]): number {
  let total = 0;
  for (const tpl of templates) {
    if (PACK_ID_SET.has(tpl.id)) total += templateXp(tpl);
  }
  return total;
}

export type PackCadence = 'daily' | 'weekly' | 'monthly';

/**
 * The one-word cadence the pack card shows. A weekly row that covers all
 * seven days behaves as a daily everywhere else in the app (Hoje, the
 * buckets), so it reads as daily here too — the card must name what the
 * practice will actually do on the Home.
 */
export function templateCadence(rec: Recurrence): PackCadence {
  if (isEffectivelyDaily(rec)) return 'daily';
  return rec.type === 'monthly' ? 'monthly' : 'weekly';
}

export interface PackSubGroup {
  subId: SubId;
  /** The pack's pick first, then the rest in catalog order. */
  templates: TaskTemplateWithSubs[];
}

export interface PackAreaGroup {
  dimId: DimensionId;
  subs: PackSubGroup[];
}

/**
 * Catalog → 6 areas × 2 sub-areas. A template sits under its primary sub
 * (the one with the most stars). Input order is kept inside each sub —
 * useTaskTemplates already sorts by sort_order — except that the pack's
 * pick is pulled to the front, so the pre-selected card always leads.
 */
export function groupTemplatesForPack(
  templates: readonly TaskTemplateWithSubs[],
): PackAreaGroup[] {
  const bySub = new Map<SubId, TaskTemplateWithSubs[]>();
  for (const tpl of templates) {
    const list = bySub.get(tpl.primary_sub_id);
    if (list) list.push(tpl);
    else bySub.set(tpl.primary_sub_id, [tpl]);
  }
  return DIMENSION_ORDER.map((dimId) => ({
    dimId,
    subs: SUBS_BY_DIM[dimId].map((subId) => {
      const all = bySub.get(subId) ?? [];
      const packId = STARTER_PACK[subId];
      return {
        subId,
        templates: [
          ...all.filter((tpl) => tpl.id === packId),
          ...all.filter((tpl) => tpl.id !== packId),
        ],
      };
    }),
  }));
}
