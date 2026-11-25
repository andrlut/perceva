import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { track } from '@/lib/analytics';
import { useClaimPartnerCoupon, useJoinPartnerCampaign } from '@/lib/api/partners';
import type { PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tierClaimed, tierCode, tierPct, type CampaignRewards } from '@/lib/partnerCampaign';
import { useIsPremium } from '@/lib/premium';
import { storeCodeForCampaign } from '@/lib/purchases/storeCodes';

type RedeemCampaign = CampaignRewards & {
  id: string;
  partner_name: string;
  partner_url: string | null;
};

/** The paywall for a partner visit: `?source=partner`, and the campaign's
 *  Premium code (PAKERANUAL) already typed in the code field when it has one. */
export function partnerPremiumHref(campaignId: string): string {
  const code = storeCodeForCampaign(campaignId)?.code;
  return code ? `/premium?source=partner&code=${encodeURIComponent(code)}` : '/premium?source=partner';
}

/**
 * The redemption flow of a partner coupon (Recompensas › Parcerias; decision
 * Artur/André, 2026-11-16 — coupons open, no challenge in the way):
 *
 *   basic tier              → claim, straight away.
 *   Premium tier, Premium   → claim, straight away.
 *   Premium tier, free      → the invite: "this coupon is for Premium
 *       subscribers", with the campaign's code for the annual plan when it
 *       has one — [Not now] / [See Premium]. Nothing is claimed.
 *
 * One claim per tier; a Premium member may hold both. The server enforces
 * the same rules (`premium_required`); the invite is the sales moment, not
 * the gate. Premium is read from the profile too (`useIsPremium`), so
 * someone who just subscribed is not sent back to the invite while the
 * campaign status catches up. A successful claim says so out loud (Artur,
 * 2026-11-16): an alert with the code and where to use it, or "on its way"
 * while the partner has not released it.
 */
export function usePartnerRedeem(
  campaign: RedeemCampaign | null,
  status: PartnerCampaignStatus | null | undefined,
) {
  const router = useRouter();
  const { t } = useT();
  const isPremium = useIsPremium();
  const claim = useClaimPartnerCoupon();
  const join = useJoinPartnerCampaign();
  const [running, setRunning] = useState<PartnerCouponTier | null>(null);
  const busy = useRef(false);

  // The paywall tracks its own open (premium_opened, source=partner).
  const goPremium = () => {
    if (campaign) router.push(partnerPremiumHref(campaign.id) as never);
  };

  const showPremiumInvite = () => {
    if (!campaign) return;
    const code = storeCodeForCampaign(campaign.id);
    const body = t('campaign.redeem.premiumRequiredBody', {
      premium: tierPct(campaign, 'premium') ?? '',
      partner: campaign.partner_name,
    });
    Alert.alert(
      t('campaign.redeem.premiumRequiredTitle'),
      code
        ? `${body} ${t('campaign.redeem.premiumCodeLine', { code: code.code, pct: code.entry.pct })}`
        : body,
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
      // The server joins on claim too; joining first records where the
      // person came from (the partner's count).
      if (!status?.member) await join.mutateAsync({ campaignId: campaign.id, source: 'app' });
      const next = await claim.mutateAsync({ campaignId: campaign.id, tier });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const code = next ? tierCode(next, tier) : null;
      const url = campaign.partner_url;
      Alert.alert(
        t('campaign.redeem.claimedTitle', { pct: tierPct(campaign, tier) ?? '' }),
        code
          ? t('campaign.redeem.claimedBody', { code, partner: campaign.partner_name })
          : t('campaign.redeem.claimedBodyPending', { partner: campaign.partner_name }),
        code && url
          ? [
              { text: t('common.ok'), style: 'cancel' },
              {
                text: t('campaign.redeem.openSite'),
                onPress: () => {
                  Linking.openURL(url).catch(() => {});
                },
              },
            ]
          : [{ text: t('common.ok') }],
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
    if (tier === 'premium' && !status.is_premium && !isPremium) {
      track('campaign_premium_tier_blocked', { campaign: campaign.id });
      showPremiumInvite();
      return;
    }
    void doClaim(tier);
  };

  return { redeem, running, goPremium };
}
