import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PARTNER_FLAIR, PartnerCouponCard } from '@/components/PartnerCouponCard';
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
  isPremium,
}: {
  campaign: CampaignRewards & { partner_name: string };
  status: PartnerCampaignStatus;
  redeem: (tier: PartnerCouponTier) => void;
  running: PartnerCouponTier | null;
  disabled?: boolean;
  /** Premium as the redeem flow reads it (status OR profile), so a card
   *  never says "subscribe" while its tap already redeems. */
  isPremium?: boolean;
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
            isPremium={isPremium ?? status.is_premium}
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

  if (!enabled || !c || !campaignId) return null;
  // The page is this block alone: never blank while loading or failed.
  if (!s) {
    return status.isError ? (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>{t('common.error')}</Text>
        <Pressable
          onPress={() => {
            void status.refetch();
          }}
          style={({ pressed }) => [styles.retry, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={14} color={PARTNER_FLAIR.bronze2} />
          <Text style={styles.siteText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    ) : (
      <View style={styles.stateBox}>
        <ActivityIndicator color={PARTNER_FLAIR.bronze2} />
      </View>
    );
  }

  const isPremium = s.is_premium || isPremiumProfile;
  const line = campaignCouponLine(c, s, t, { here: true });
  const premiumCode = storeCodeForCampaign(campaignId);
  const showPremiumCode = premiumCode != null && !isPremium;
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
        <Ionicons name="chevron-forward" size={16} color={tokens.text.mid} />
      </Pressable>

      <PartnerCouponGrid
        campaign={c}
        status={s}
        redeem={redeem}
        running={running}
        isPremium={isPremium}
      />

      {showPremiumCode && premiumCode && (
        <Pressable
          onPress={() => router.push(partnerPremiumHref(campaignId) as never)}
          style={({ pressed }) => [styles.codeRow, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`${t('rewards.partnerPremiumTitle', { pct: premiumCode.entry.pct })}. ${t('rewards.partnerPremiumBody', { code: premiumCode.code })}`}
        >
          <View style={[styles.rowTile, styles.codeTile]}>
            <Ionicons name="sparkles" size={16} color={tokens.semantic.coin} />
          </View>
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
  // The Premium code: a quiet row, same anatomy as the header row (tile ·
  // title over line · chevron), in the app's gold — it sells Perceva.
  codeTile: {
    borderColor: `${tokens.semantic.coin}50`,
    backgroundColor: `${tokens.semantic.coin}1F`,
  },
  stateBox: {
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[6],
  },
  stateText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
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
