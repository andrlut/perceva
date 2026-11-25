import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PARTNER_FLAIR, PartnerCouponCard } from '@/components/PartnerCouponCard';
import { PremiumBadge } from '@/components/PremiumBadge';
import { useActivePartnerCampaign, usePartnerCampaignStatus } from '@/lib/api/partners';
import type { PartnerCampaignStatus, PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import {
  campaignCouponLine,
  campaignTiers,
  tierClaimed,
  tierCode,
  tierPct,
  type CampaignRewards,
} from '@/lib/partnerCampaign';
import { partnerPremiumHref, usePartnerRedeem } from '@/lib/partnerRedeem';
import { useIsPremium } from '@/lib/premium';
import { storeCodeForCampaign } from '@/lib/purchases/storeCodes';
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

/**
 * One partnership on the Parcerias page of Recompensas (André, 2026-11-25:
 * "separar o que é do aplicativo e o que é de parceiro"), the ONE place a
 * partner coupon is redeemed — the flyer in the partner's boxes says
 * "pegue em Recompensas":
 *
 *   header row     the partner's name, where the coupons stand, and
 *                  "Sobre a parceria" → /campaign/<id>
 *   coupon grid    every tier (claimed ones keep the code)
 *   Premium code   for someone not yet Premium, when the campaign hands one
 *                  out (PAKERANUAL): the paywall opens with it typed in
 *   partner site   where the code is used
 *
 * Renders nothing without an active campaign. With more partnerships, each
 * gets its own block on the page.
 */
export function PartnerCouponSection({ enabled = true }: { enabled?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const isPremiumProfile = useIsPremium();
  const campaign = useActivePartnerCampaign({ enabled });
  const c = campaign.data ?? null;
  const campaignId = c?.id ?? null;
  const status = usePartnerCampaignStatus(campaignId, { enabled: enabled && c != null });
  const s = status.data ?? null;
  const { redeem, running } = usePartnerRedeem(c, s);

  if (!enabled || !c || !s || !campaignId) return null;

  const line = campaignCouponLine(c, s, t);
  const premiumCode = storeCodeForCampaign(campaignId);
  const showPremiumCode = premiumCode != null && !s.is_premium && !isPremiumProfile;
  const url = c.partner_url;

  const goAbout = () =>
    router.push({ pathname: '/campaign/[id]', params: { id: campaignId, source: 'app' } });

  return (
    <View style={styles.section}>
      <Pressable
        onPress={goAbout}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel={`${t('rewards.partnerSection', { partner: c.partner_name })}. ${line}`}
        accessibilityHint={t('rewards.partnerAbout')}
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
          <Text style={styles.rowLinkText}>{t('rewards.partnerAbout')}</Text>
          <Ionicons name="chevron-forward" size={12} color={PARTNER_FLAIR.bronze2} />
        </View>
      </Pressable>

      <PartnerCouponGrid campaign={c} status={s} redeem={redeem} running={running} />

      {showPremiumCode && premiumCode && (
        <Pressable
          onPress={() => router.push(partnerPremiumHref(campaignId) as never)}
          style={({ pressed }) => [styles.codeRow, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`${t('rewards.partnerPremiumTitle', { pct: premiumCode.entry.pct })}. ${t('rewards.partnerPremiumBody', { code: premiumCode.code })}`}
        >
          <PremiumBadge size="sm" />
          <View style={styles.rowBody}>
            <Text style={styles.codeTitle} numberOfLines={2}>
              {t('rewards.partnerPremiumTitle', { pct: premiumCode.entry.pct })}
            </Text>
            <Text style={styles.rowLine} numberOfLines={2}>
              {t('rewards.partnerPremiumBody', { code: premiumCode.code })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={tokens.text.mid} />
        </Pressable>
      )}

      {url && (
        <Pressable
          onPress={() => {
            Linking.openURL(url).catch(() => {});
          }}
          style={({ pressed }) => [styles.siteRow, pressed && { opacity: 0.7 }]}
          accessibilityRole="link"
        >
          <Ionicons name="globe-outline" size={15} color={PARTNER_FLAIR.bronze2} />
          <Text style={styles.siteText} numberOfLines={1}>
            {t('campaign.screen.visitPartner', { name: c.partner_name })}
          </Text>
          <Ionicons name="open-outline" size={13} color={tokens.text.dim} />
        </Pressable>
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
  // The Premium code: a quiet row, same anatomy as the header row.
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.glass,
  },
  codeTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 17,
    color: tokens.text.hi,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  siteText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
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
