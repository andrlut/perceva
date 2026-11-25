import type { PartnerCampaign, PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/** The bit of the campaign row these rules read: the two coupon tiers. */
export type CampaignRewards = Pick<PartnerCampaign, 'reward_free_pct' | 'reward_premium_pct'>;

/**
 * Partner campaign display rules shared by every surface that shows the
 * person's coupons — the Parcerias page of Recompensas, the campaign screen
 * and the sponsored material's row in the Recanto — so all say the same
 * thing word for word. The numbers are the server's
 * (`partner_campaign_status`); nothing here decides anything.
 *
 * Since 2026-11-16 (migration partner_coupons_open) the coupons are OPEN:
 * the basic tier (`reward_free_pct`) is anyone's for the taking, the
 * Premium tier (`reward_premium_pct`) is for subscribers, and one person
 * may hold both — one claim per tier. Since 2026-11-25 the app no longer
 * shows the 4-day challenge: its server side (streak, `unlocked`,
 * `secure_partner_unlock`) stays in the database, dormant, and the
 * campaign's practices are offered as a plain suggestion.
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
 * The one line about the person's coupons:
 *
 *   some tier still open → "10% e 17% pra resgatar em Recompensas"
 *   every tier claimed   → "Cupons resgatados · códigos em Recompensas"
 */
export function campaignCouponLine(
  c: CampaignRewards,
  s: PartnerCampaignStatus,
  t: Translator,
): string {
  const open = campaignTiers(c).filter((tier) => !tierClaimed(s, tier));
  if (open.length === 0) return t('campaign.line.claimed');
  return t('campaign.line.open', {
    pcts: open.map((tier) => `${tierPct(c, tier) ?? ''}%`).join(t('campaign.line.and')),
  });
}
