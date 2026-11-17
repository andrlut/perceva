import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { ACTIVE_THEME, tokens } from '@/theme';

const LIGHT = ACTIVE_THEME === 'light';

/**
 * The campaign's coupons as a two-column grid of `PartnerCouponCard`s — the
 * same grid the Vault uses for its own rewards. Every tier, always: a
 * claimed coupon stays as the card that holds its code (Artur, 2026-11-16:
 * a card that vanishes on redeem reads as "something went wrong").
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

const COLLAPSE_KEY = '@perceva/partner_section_collapsed';

/**
 * The Vault's "Parceria" section (decision Artur, 2026-11-16, three
 * rounds): a header row in the partner's colors — name, where the coupons
 * stand, "see the program" — and under it the coupon cards with the
 * partner flair, claimed ones included (they hold the code and COPIAR; a
 * card that vanished on redeem gave no sign the coupon was taken). The row
 * collapses the block on tap, remembered per campaign, so someone can fold
 * this one partnership without dropping the partner chip — with more
 * partnerships coming, each folds on its own. Renders nothing without an
 * active campaign.
 */
export function PartnerCouponSection({ enabled = true }: { enabled?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const campaign = useActivePartnerCampaign({ enabled });
  const c = campaign.data ?? null;
  const campaignId = c?.id ?? null;
  const status = usePartnerCampaignStatus(campaignId, { enabled: enabled && c != null });
  const s = status.data ?? null;
  useAutoSecurePartnerUnlock(s);
  const { redeem, running } = usePartnerRedeem(c, s);

  // Keyed by campaign id: a new campaign opens unfolded.
  const [collapsed, setCollapsed] = useState<{ id: string; value: boolean } | null>(null);
  useEffect(() => {
    if (!campaignId) return;
    let alive = true;
    AsyncStorage.getItem(`${COLLAPSE_KEY}:${campaignId}`)
      .then((v) => {
        if (alive) setCollapsed({ id: campaignId, value: v != null });
      })
      .catch(() => {
        if (alive) setCollapsed({ id: campaignId, value: false });
      });
    return () => {
      alive = false;
    };
  }, [campaignId]);

  if (!enabled || !c || !s || !campaignId) return null;

  const tiers = campaignTiers(c);
  const open = tiers.filter((tier) => !tierClaimed(s, tier));
  const folded = collapsed?.id === campaignId ? collapsed.value : false;
  const canFold = tiers.length > 0;
  const showGrid = canFold && !folded;
  const line =
    open.length > 0
      ? t('rewards.partnerRowOpen', {
          pcts: open
            .map((tier) => `${tierPct(c, tier) ?? ''}%`)
            .join(t('rewards.partnerRowAnd')),
        })
      : t('rewards.partnerRowClaimed');

  const toggle = () => {
    if (!canFold) return;
    const next = !folded;
    setCollapsed({ id: campaignId, value: next });
    const key = `${COLLAPSE_KEY}:${campaignId}`;
    (next ? AsyncStorage.setItem(key, '1') : AsyncStorage.removeItem(key)).catch(() => {});
  };
  const goProgram = () =>
    router.push({ pathname: '/campaign/[id]', params: { id: campaignId, source: 'app' } });

  return (
    <View style={styles.section}>
      <Pressable
        onPress={canFold ? toggle : goProgram}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={canFold ? { expanded: showGrid } : undefined}
        accessibilityLabel={`${t('rewards.partnerSection', { partner: c.partner_name })}. ${line}`}
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
        <Pressable
          onPress={goProgram}
          hitSlop={8}
          style={({ pressed }) => [styles.rowLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('rewards.partnerSeeProgram')}
        >
          <Text style={styles.rowLinkText}>{t('rewards.partnerSeeProgram')}</Text>
          <Ionicons name="chevron-forward" size={12} color={PARTNER_FLAIR.bronze2} />
        </Pressable>
        {canFold && (
          <Ionicons
            name={showGrid ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={tokens.text.mid}
            style={styles.rowFold}
          />
        )}
      </Pressable>
      {showGrid && (
        <PartnerCouponGrid campaign={c} status={s} redeem={redeem} running={running} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: tokens.space[5], gap: tokens.space[3] },
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
  },
  rowFold: { marginLeft: 2 },
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
  rowLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    paddingVertical: 6,
    paddingLeft: 4,
  },
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
