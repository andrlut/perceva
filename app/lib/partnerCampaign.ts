import type { PartnerCampaign, PartnerCampaignStatus } from '@/lib/db/types';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/** The bit of the campaign row these rules read: whether it also gives a
 *  Perceva Premium discount on top of the partner's coupon. */
export type CampaignRewards = Pick<PartnerCampaign, 'perceva_reward_pt' | 'perceva_reward_en'>;

/**
 * Partner campaign display rules shared by every surface that shows the
 * user's progress — the Home card and the sponsored material's campaign
 * row — so both say the same thing word for word. The numbers are the
 * server's (`partner_campaign_status`); nothing here decides an unlock.
 *
 * A campaign gives the partner's coupon and, when its row carries
 * `perceva_reward_*`, a Perceva Premium discount too (migration
 * 20261105000001). One claim covers both; each code shows up on its own
 * once released.
 */

/** Whether the campaign also gives the Perceva Premium discount. */
export function hasPercevaReward(c: CampaignRewards): boolean {
  return !!(c.perceva_reward_pt?.trim() || c.perceva_reward_en?.trim());
}

/** How many rewards (and codes) the one claim delivers: the partner's
 *  coupon, plus the Premium discount when the row has one. Every copy line
 *  that counts them is a `{ one, other }` plural fed with this. */
export function rewardCount(c: CampaignRewards): 1 | 2 {
  return hasPercevaReward(c) ? 2 : 1;
}

/** Codes the claim delivers, and how many of them are already in hand
 *  (claimed AND released — the server only returns a code after both). */
function codesInHand(c: CampaignRewards, s: PartnerCampaignStatus) {
  const perceva = hasPercevaReward(c);
  const expected = rewardCount(c);
  const inHand = (s.coupon_code ? 1 : 0) + (perceva && s.perceva_code ? 1 : 0);
  return { expected, inHand };
}

/**
 * The one state line, most advanced state first:
 *
 *   claimed, every code → "your codes are ready, tap to see"
 *   claimed, some code  → "one code released, the other on its way"
 *   claimed, no code    → "discounts secured, codes on their way"
 *   unlocked, unclaimed → "you made it, tap to secure them" (claiming is
 *                         what makes them permanent; the streak alone can
 *                         still break, so this works with or without codes)
 *   practice adopted    → "X of N days in a row" (members or not: a practice
 *                         adopted from Sugeridas before joining counts)
 *   member              → "add the practice"
 *   otherwise           → "join and earn the discounts after N days in a row"
 *
 * The codes themselves only show on `/campaign/[id]` — the card and the
 * material row point there ("tap to see"), they never say "here". The
 * codes only come back once claimed, so their presence is the "in hand"
 * test. The goal is always the server's `goal`; `count` is `rewardCount`.
 */
export function campaignStateLine(
  c: CampaignRewards,
  s: PartnerCampaignStatus,
  t: Translator,
): string {
  const count = rewardCount(c);
  if (s.claimed) {
    const { expected, inHand } = codesInHand(c, s);
    if (inHand >= expected) return t('campaign.card.claimed', { count });
    // Only reachable with two codes, so it needs no plural.
    if (inHand > 0) return t('campaign.card.claimedPartial');
    return t('campaign.card.claimedPending', { count });
  }
  if (s.unlocked) return t('campaign.card.unlocked', { count });
  if (s.adopted) {
    return t('campaign.card.progress', { days: s.streak_days, goal: s.goal });
  }
  if (s.member) return t('campaign.card.adopt');
  return t('campaign.card.join', { goal: s.goal, count });
}

/**
 * Whether the Home card may offer its X. Only when there is no live
 * progress to hide: before any involvement (not a member, no practice), or
 * once it is all over (claimed AND every code in hand). A member mid-run,
 * a non-member whose adopted practice is counting, or a claim still
 * waiting on a code never loses the card.
 */
export function canDismissCampaignCard(
  c: CampaignRewards,
  s: PartnerCampaignStatus,
): boolean {
  if (s.claimed) {
    const { expected, inHand } = codesInHand(c, s);
    return inHand >= expected;
  }
  return !s.member && !s.adopted;
}
