import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ACTIVE_THEME, tokens } from '@/theme';

const LIGHT = ACTIVE_THEME === 'light';

/**
 * The campaign's coupons as a two-column grid of `PartnerCouponCard`s — the
 * same grid the Vault uses for its own rewards. Lives on the campaign
 * screen; the Vault only shows the row below, which leads there.
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
 * The Vault's partner row (decision Artur, 2026-11-16, after seeing the
 * cards in the test build): one compact line per partnership — the
 * partner's name, where the coupons stand, "see the program" — that opens
 * the campaign screen, where the coupon cards live. The Vault keeps its
 * own rewards in front; with more partnerships coming, a stack of coupon
 * cards here would push people into hiding the partner chip for good.
 * Renders nothing without an active campaign.
 */
export function PartnerProgramRow({ enabled = true }: { enabled?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const campaign = useActivePartnerCampaign({ enabled });
  const c = campaign.data ?? null;
  const status = usePartnerCampaignStatus(c?.id, { enabled: enabled && c != null });
  const s = status.data ?? null;
  useAutoSecurePartnerUnlock(s);

  if (!enabled || !c) return null;

  const tiers = campaignTiers(c);
  const claimed = s ? tiers.filter((tier) => tierClaimed(s, tier)).length : 0;
  const line =
    claimed > 0
      ? t('rewards.partnerRowClaimed', { claimed, total: tiers.length })
      : t('rewards.partnerRowOpen', {
          free: tierPct(c, 'free') ?? '',
          premium: tierPct(c, 'premium') ?? '',
        });

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/campaign/[id]', params: { id: c.id, source: 'app' } })
      }
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${t('rewards.partnerSection', { partner: c.partner_name })}. ${line}. ${t('rewards.partnerSeeProgram')}`}
    >
      <LinearGradient
        colors={
          LIGHT
            ? ['rgba(244,238,224,0.95)', 'rgba(255,255,255,0.96)']
            : [PARTNER_FLAIR.navy2, 'rgba(8,29,50,0.94)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.rowTile}>
        <Ionicons name="ribbon" size={16} color={PARTNER_FLAIR.bronze2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {t('rewards.partnerSection', { partner: c.partner_name })}
        </Text>
        <Text style={styles.rowLine} numberOfLines={1}>
          {line}
        </Text>
      </View>
      <View style={styles.rowLink}>
        <Text style={styles.rowLinkText}>{t('rewards.partnerSeeProgram')}</Text>
        <Ionicons name="chevron-forward" size={12} color={PARTNER_FLAIR.bronze2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${PARTNER_FLAIR.bronze}73`,
    marginBottom: tokens.space[5],
  },
  rowTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${PARTNER_FLAIR.bronze}50`,
    backgroundColor: `${PARTNER_FLAIR.bronze}26`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 17,
    color: tokens.text.hi,
  },
  rowLine: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 14,
    color: tokens.text.mid,
  },
  rowLink: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  rowLinkText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: PARTNER_FLAIR.bronze2,
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
