import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { track } from '@/lib/analytics';
import { useClaimPartnerCoupon, useJoinPartnerCampaign } from '@/lib/api/partners';
import type { PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tierClaimed, tierCode, tierPct, type CampaignRewards } from '@/lib/partnerCampaign';

/**
 * The redemption flow of a partner coupon, shared by the campaign screen and
 * the Vault's coupon cards so the two never disagree (decision Artur/André,
 * 2026-11-16 — coupons open, no challenge in the way):
 *
 *   basic tier              → claim, straight away.
 *   Premium tier, Premium   → claim, straight away.
 *   Premium tier, free      → the invite: "this coupon is for Premium
 *       subscribers" — [Not now] / [See Premium]. Nothing is claimed.
 *
 * One claim per tier; a Premium member may hold both. The server enforces
 * the same rules (`premium_required`); the invite is the sales moment, not
 * the gate. The paywall opens with `?source=partner` so the funnel is
 * measurable. A successful claim says so out loud (Artur, 2026-11-16: the
 * card changing state alone read as nothing happening): an alert with the
 * code, or "on its way" while the partner has not released it.
 */
export function usePartnerRedeem(
  campaign: (CampaignRewards & { id: string; partner_name: string }) | null,
  status: PartnerCampaignStatus | null | undefined,
) {
  const router = useRouter();
  const { t } = useT();
  const claim = useClaimPartnerCoupon();
  const join = useJoinPartnerCampaign();
  const [running, setRunning] = useState<PartnerCouponTier | null>(null);
  const busy = useRef(false);

  // The paywall tracks its own open (premium_opened, source=partner).
  const goPremium = () => router.push('/premium?source=partner');

  const showPremiumInvite = () => {
    if (!campaign) return;
    Alert.alert(
      t('campaign.redeem.premiumRequiredTitle'),
      t('campaign.redeem.premiumRequiredBody', {
        premium: tierPct(campaign, 'premium') ?? '',
        partner: campaign.partner_name,
      }),
      [
        { text: t('campaign.redeem.notNow'), style: 'cancel' },
        { text: t('campaign.redeem.seePremium'), onPress: goPremium },
      ],
    );
  };

  const doClaim = async (tier: PartnerCouponTier) => {
    if (!campaign || busy.current) return;
    busy.current = true;
    setRunning(tier);
    try {
      // The server joins on claim too; joining here first keeps the
      // optimistic `member` flag honest for the Home card.
      if (!status?.member) await join.mutateAsync({ campaignId: campaign.id, source: 'app' });
      const next = await claim.mutateAsync({ campaignId: campaign.id, tier });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const code = next ? tierCode(next, tier) : null;
      Alert.alert(
        t('campaign.redeem.claimedTitle', { pct: tierPct(campaign, tier) ?? '' }),
        code
          ? t('campaign.redeem.claimedBody', { code })
          : t('campaign.redeem.claimedBodyPending', { partner: campaign.partner_name }),
        [{ text: t('common.ok') }],
      );
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('premium_required')) {
        showPremiumInvite();
      } else {
        Alert.alert(t('common.error'));
      }
    } finally {
      busy.current = false;
      setRunning(null);
    }
  };

  const redeem = (tier: PartnerCouponTier) => {
    if (!campaign || !status || tierClaimed(status, tier)) return;
    if (tier === 'premium' && !status.is_premium) {
      track('campaign_premium_tier_blocked', { campaign: campaign.id });
      showPremiumInvite();
      return;
    }
    void doClaim(tier);
  };

  return { redeem, running, goPremium };
}
