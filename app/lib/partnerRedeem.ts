import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { track } from '@/lib/analytics';
import { useClaimPartnerCoupon, useJoinPartnerCampaign } from '@/lib/api/partners';
import type { PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tierPct, type CampaignRewards } from '@/lib/partnerCampaign';

/**
 * The redemption flow of a partner coupon, shared by the campaign screen and
 * the Vault card so the two never disagree (decision Artur, 2026-11-15):
 *
 *   basic tier, not Premium → one last offer before the claim: "sure? this
 *       is your last chance to change your mind and get the bigger bonus"
 *       — [See Premium] / [Take the X%].
 *   basic tier, Premium → the same pause, since the bigger one is already
 *       theirs: "you are Premium, the Y% is yours — sure you want the X%?"
 *       — [Take the Y%] (claims the Premium tier) / [Take the X%].
 *       (Artur, 2026-11-15: the pause is for everyone.)
 *   Premium tier, not Premium → the invite: "this coupon is for Premium
 *       subscribers" — [Not now] / [See Premium]. Nothing is claimed.
 *   Premium tier, Premium → claim.
 *
 * The server enforces the same rules (`premium_required`,
 * `streak_not_reached`); the dialogs are the sales moment, not the gate.
 * The paywall opens with `?source=partner` so the funnel is measurable.
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

  const doClaim = async (tier: PartnerCouponTier) => {
    if (!campaign || busy.current) return;
    busy.current = true;
    setRunning(tier);
    try {
      if (!status?.member) await join.mutateAsync({ campaignId: campaign.id, source: 'app' });
      await claim.mutateAsync({ campaignId: campaign.id, tier });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('premium_required')) {
        showPremiumInvite();
      } else {
        // `streak_not_reached` converges on its own: the status refetch
        // puts the lock back.
        Alert.alert(t('common.error'));
      }
    } finally {
      busy.current = false;
      setRunning(null);
    }
  };

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

  const redeem = (tier: PartnerCouponTier) => {
    if (!campaign || !status || !status.unlocked || status.claimed) return;
    if (tier === 'premium') {
      if (!status.is_premium) {
        track('campaign_premium_tier_blocked', { campaign: campaign.id });
        showPremiumInvite();
        return;
      }
      void doClaim('premium');
      return;
    }
    // Basic tier: the last pause, whenever there is a bigger one to miss.
    const premiumPct = tierPct(campaign, 'premium');
    const freePct = tierPct(campaign, 'free') ?? '';
    if (premiumPct != null && status.is_premium) {
      Alert.alert(
        t('campaign.redeem.freeConfirmTitle'),
        t('campaign.redeem.freeConfirmBodyPremium', { free: freePct, premium: premiumPct }),
        [
          {
            text: t('campaign.redeem.takePremium', { premium: premiumPct }),
            onPress: () => void doClaim('premium'),
          },
          {
            text: t('campaign.redeem.freeConfirmOk', { free: freePct }),
            onPress: () => void doClaim('free'),
          },
        ],
      );
      return;
    }
    if (premiumPct != null) {
      Alert.alert(
        t('campaign.redeem.freeConfirmTitle'),
        t('campaign.redeem.freeConfirmBody', { free: freePct, premium: premiumPct }),
        [
          {
            text: t('campaign.redeem.seePremium'),
            onPress: () => {
              track('campaign_upsell_accepted', { campaign: campaign.id });
              goPremium();
            },
          },
          {
            text: t('campaign.redeem.freeConfirmOk', { free: freePct }),
            onPress: () => void doClaim('free'),
          },
        ],
      );
      return;
    }
    void doClaim('free');
  };

  return { redeem, running, goPremium };
}
