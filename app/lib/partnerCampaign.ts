import type { PartnerCampaign, PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/** The bit of the campaign row these rules read: the two coupon tiers. */
export type CampaignRewards = Pick<PartnerCampaign, 'reward_free_pct' | 'reward_premium_pct'>;

/**
 * Partner campaign display rules shared by every surface that shows the
 * person's state — the Home card, the Vault's coupon cards and the campaign
 * screen — so all say the same thing word for word. The numbers are the
 * server's (`partner_campaign_status`); nothing here decides anything.
 *
 * Since 2026-11-16 (migration partner_coupons_open) the coupons are OPEN:
 * the basic tier (`reward_free_pct`) is anyone's for the taking, the
 * Premium tier (`reward_premium_pct`) is for subscribers, and one person
 * may hold both — one claim per tier. The challenge (join, pick a
 * practice, keep the streak) is an extra on the side; `unlocked` only says
 * it was completed.
 */

/** The tiers the campaign offers, basic first. Everyone sees every tier:
 *  the Premium one is the invite for a free member. */
export function campaignTiers(c: CampaignRewards): PartnerCouponTier[] {
  const tiers: PartnerCouponTier[] = [];
  if (c.reward_free_pct != null) tiers.push('free');
  if (c.reward_premium_pct != null) tiers.push('premium');
  return tiers;
}

export function tierPct(c: CampaignRewards, tier: PartnerCouponTier): number | null {
  return tier === 'premium' ? c.reward_premium_pct : c.reward_free_pct;
}

export function tierClaimed(s: PartnerCampaignStatus, tier: PartnerCouponTier): boolean {
  return tier === 'premium' ? s.claimed_premium : s.claimed_free;
}

/** The tier's code: only after its claim, and once the partner filled it in. */
export function tierCode(s: PartnerCampaignStatus, tier: PartnerCouponTier): string | null {
  return tier === 'premium' ? s.code_premium : s.code_free;
}

/**
 * The one state line of the challenge, most advanced state first:
 *
 *   challenge done      → "challenge complete"
 *   practice adopted    → "X of N days in a row"
 *   member              → "pick the practice"
 *   otherwise           → "coupons in Rewards · the challenge as an extra"
 */
export function campaignStateLine(
  _c: CampaignRewards,
  s: PartnerCampaignStatus,
  t: Translator,
): string {
  if (s.unlocked) return t('campaign.card.done');
  if (s.adopted) {
    return t('campaign.card.progress', { days: s.streak_days, goal: s.goal });
  }
  if (s.member) return t('campaign.card.adopt');
  return t('campaign.card.join', { goal: s.goal });
}

/**
 * Whether the Home card may offer its X. Only when there is no live
 * progress to hide: before any involvement (not a member, no practice), or
 * once the challenge is done.
 */
export function canDismissCampaignCard(
  _c: CampaignRewards,
  s: PartnerCampaignStatus,
): boolean {
  return s.unlocked || (!s.member && !s.adopted);
}
