import type { PartnerCampaignStatus } from '@/lib/db/types';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * Partner campaign display rules shared by every surface that shows the
 * user's progress — the Home card and the sponsored material's campaign
 * row — so both say the same thing word for word. The numbers are the
 * server's (`partner_campaign_status`); nothing here decides an unlock.
 */

/**
 * The one state line, most advanced state first:
 *
 *   claimed + code      → "your coupon is here"
 *   claimed, no code    → "coupon secured, the code isn't here yet"
 *   unlocked, unclaimed → "you made it, tap to secure it" (claiming is what
 *                         makes it permanent; the streak alone can still
 *                         break, so this works with or without a code)
 *   practice adopted    → "X of N days in a row" (members or not: a practice
 *                         adopted from Sugeridas before joining counts)
 *   member              → "add the practice"
 *   otherwise           → "join and earn a coupon after N days in a row"
 *
 * `coupon_code` only comes back once claimed, so its presence is the
 * "claimed + code" test.
 */
export function campaignStateLine(s: PartnerCampaignStatus, t: Translator): string {
  if (s.claimed) {
    return s.coupon_code ? t('campaign.card.claimed') : t('campaign.card.claimedPending');
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
 * once it is all over (claimed AND the code is in hand). A member mid-run,
 * or a non-member whose adopted practice is counting, never loses the card.
 */
export function canDismissCampaignCard(s: PartnerCampaignStatus): boolean {
  if (s.claimed && s.coupon_code != null) return true;
  return !s.member && !s.adopted;
}
