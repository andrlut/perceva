import type { PartnerCampaign, PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/** The bit of the campaign row these rules read: the two coupon tiers. */
export type CampaignRewards = Pick<PartnerCampaign, 'reward_free_pct' | 'reward_premium_pct'>;

/**
 * Partner campaign display rules shared by every surface that shows the
 * user's progress — the Home card, the Vault card and the sponsored
 * material's campaign row — so all say the same thing word for word. The
 * numbers are the server's (`partner_campaign_status`); nothing here
 * decides an unlock.
 *
 * Since 2026-11-15 (migration partner_campaign_tiers) a campaign gives ONE
 * coupon from the partner with TWO redemption options: the basic tier
 * (`reward_free_pct`, anyone who closed the streak) and the Premium tier
 * (`reward_premium_pct`, subscribers only). One choice per campaign — the
 * first claim is final. The streak unlocks the choice; `secured` means the
 * unlock was written down, so breaking the streak afterwards changes
 * nothing.
 */

/** The tiers the campaign offers, basic first. */
export function campaignTiers(c: CampaignRewards): PartnerCouponTier[] {
  const tiers: PartnerCouponTier[] = [];
  if (c.reward_free_pct != null) tiers.push('free');
  if (c.reward_premium_pct != null) tiers.push('premium');
  return tiers;
}

/**
 * The tiers the person actually sees (Artur, 2026-11-15): a Premium member
 * never sees the smaller coupon — less to misread, nothing to regret — so
 * for them it is the Premium tier alone (or, once claimed, whichever tier
 * the claim holds, e.g. a basic one from before). Everyone else sees every
 * tier: the basic one to take and the Premium one as the invite.
 */
export function visibleTiers(c: CampaignRewards, s: PartnerCampaignStatus): PartnerCouponTier[] {
  const tiers = campaignTiers(c);
  if (!s.is_premium || !tiers.includes('premium')) return tiers;
  if (s.claimed && s.tier) return tiers.includes(s.tier) ? [s.tier] : tiers;
  return ['premium'];
}

export function tierPct(c: CampaignRewards, tier: PartnerCouponTier): number | null {
  return tier === 'premium' ? c.reward_premium_pct : c.reward_free_pct;
}

/** The percentage the person ended up with (after the claim), or the best
 *  one they could still get. */
export function pctInHand(c: CampaignRewards, s: PartnerCampaignStatus): number | null {
  if (s.claimed && s.tier) return tierPct(c, s.tier);
  return null;
}

/**
 * The one state line, most advanced state first:
 *
 *   claimed, code in hand → "your X% coupon is ready, tap to see"
 *   claimed, no code yet  → "coupon secured, code on its way"
 *   unlocked, unclaimed   → "you made it, tap to choose your coupon"
 *   practice adopted      → "X of N days in a row"
 *   member                → "add the practice"
 *   otherwise             → "join and earn a coupon after N days in a row"
 */
export function campaignStateLine(
  c: CampaignRewards,
  s: PartnerCampaignStatus,
  t: Translator,
): string {
  if (s.claimed) {
    const pct = pctInHand(c, s);
    if (s.coupon_code) return t('campaign.card.claimed', { pct: pct ?? '' });
    return t('campaign.card.claimedPending');
  }
  if (s.unlocked) return t('campaign.card.unlocked');
  if (s.adopted) {
    return t('campaign.card.progress', { days: s.streak_days, goal: s.goal });
  }
  if (s.member) return t('campaign.card.adopt');
  return t('campaign.card.join', { goal: s.goal });
}

/**
 * Whether the Home card may offer its X. Only when there is no live
 * progress to hide: before any involvement (not a member, no practice), or
 * once it is all over (claimed AND the code in hand).
 */
export function canDismissCampaignCard(
  _c: CampaignRewards,
  s: PartnerCampaignStatus,
): boolean {
  if (s.claimed) return !!s.coupon_code;
  return !s.member && !s.adopted;
}
