import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PARTNER_FLAIR, PartnerCouponCard } from '@/components/PartnerCouponCard';
import {
  useActivePartnerCampaign,
  useAutoSecurePartnerUnlock,
  usePartnerCampaignStatus,
} from '@/lib/api/partners';
import type { PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { campaignTiers, tierClaimed, tierCode, tierPct, type CampaignRewards } from '@/lib/partnerCampaign';
import { usePartnerRedeem } from '@/lib/partnerRedeem';
import { tokens } from '@/theme';

/**
 * The campaign's coupons as a two-column grid of `PartnerCouponCard`s — the
 * same grid the Vault uses for its own rewards. Shared by the Vault section
 * below and the campaign screen so the cards are the same in both places.
 */
export function PartnerCouponGrid({
  campaign,
  status,
  redeem,
  running,
  disabled = false,
}: {
  campaign: CampaignRewards & { partner_name: string };
  status: PartnerCampaignStatus;
  redeem: (tier: PartnerCouponTier) => void;
  running: PartnerCouponTier | null;
  disabled?: boolean;
}) {
  const tiers = campaignTiers(campaign);
  if (tiers.length === 0) return null;
  return (
    <View style={styles.grid}>
      {tiers.map((tier) => (
        <View key={tier} style={styles.item}>
          <PartnerCouponCard
            tier={tier}
            pct={tierPct(campaign, tier) ?? 0}
            partner={campaign.partner_name}
            claimed={tierClaimed(status, tier)}
            code={tierCode(status, tier)}
            isPremium={status.is_premium}
            busy={running === tier}
            disabled={disabled || running != null}
            onRedeem={() => redeem(tier)}
          />
        </View>
      ))}
    </View>
  );
}

/**
 * The Vault's "Parceria" section (decision Artur/André, 2026-11-16): a
 * section header in the partner's colors with a door to the program, then
 * the coupon grid. Coupons are open — no challenge in the way — so the
 * section is just rewards with a different flair. Renders nothing without
 * an active campaign.
 */
export function PartnerCouponSection({ enabled = true }: { enabled?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const campaign = useActivePartnerCampaign({ enabled });
  const c = campaign.data ?? null;
  const status = usePartnerCampaignStatus(c?.id, { enabled: enabled && c != null });
  const s = status.data ?? null;
  useAutoSecurePartnerUnlock(s);
  const { redeem, running } = usePartnerRedeem(c, s);

  if (!enabled || !c || !s) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="ribbon" size={14} color={PARTNER_FLAIR.bronze2} />
          <Text style={styles.title} numberOfLines={1}>
            {t('rewards.partnerSection', { partner: c.partner_name })}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/campaign/[id]', params: { id: c.id, source: 'app' } })
          }
          hitSlop={8}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>{t('rewards.partnerSeeProgram')}</Text>
          <Ionicons name="chevron-forward" size={12} color={tokens.text.mid} />
        </Pressable>
      </View>
      <PartnerCouponGrid campaign={c} status={s} redeem={redeem} running={running} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: tokens.space[5] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.space[3],
    gap: tokens.space[2],
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    textTransform: 'uppercase',
  },
  // Same grid as the Vault's rewards (rewards.tsx: grid / gridItem).
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[3],
  },
  item: {
    width: '48%',
    flexGrow: 1,
  },
});
