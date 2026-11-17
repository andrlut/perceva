import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { PremiumBadge } from '@/components/PremiumBadge';
import type { PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { ACTIVE_THEME, tokens } from '@/theme';

/** Paker Health's own palette (the partner site's --paker / --pk / --pk2):
 *  deep navy and a bronze gold. The flair that tells a partner coupon apart
 *  from the Vault's own rewards, which wear Perceva's gold. */
export const PARTNER_FLAIR = {
  navy: '#081D32',
  navy2: '#0E2A48',
  bronze: '#B48F41',
  bronze2: '#D8B46A',
  bronzeInk: '#2A1F08',
};

const LIGHT = ACTIVE_THEME === 'light';

interface Props {
  tier: PartnerCouponTier;
  pct: number;
  partner: string;
  claimed: boolean;
  /** The tier's code — after its claim, once the partner released it. */
  code: string | null;
  isPremium: boolean;
  busy: boolean;
  disabled: boolean;
  onRedeem: () => void;
}

/**
 * A partner coupon as a Vault reward card (decision André, 2026-11-16): the
 * same anatomy as `RewardCard` — icon tile + glyph, title, line, footer
 * with the pill — in the partner's colors instead of Perceva's gold. No
 * cost: the coupon is free to take. The Premium tier wears the app's gold
 * Premium badge top right (Artur, 2026-11-16) instead of saying "Premium
 * only" in words. States:
 *
 *   open            → RESGATAR (bronze pill); the Premium tier for a free
 *                     member shows a lock and a ghost PREMIUM pill — the
 *                     tap opens the invite (see `usePartnerRedeem`)
 *   claimed         → the code in a dashed box + COPIAR (system Share
 *                     sheet; Android's has "Copiar", the text is selectable)
 *   claimed, no code→ "code on its way"
 */
export function PartnerCouponCard({
  tier,
  pct,
  partner,
  claimed,
  code,
  isPremium,
  busy,
  disabled,
  onRedeem,
}: Props) {
  const { t } = useT();
  const premiumTier = tier === 'premium';
  const locked = premiumTier && !isPremium && !claimed;
  const title = t('campaign.screen.tierTitle', { pct });
  const line = locked
    ? t('campaign.screen.tierPremiumLocked')
    : t(premiumTier ? 'campaign.screen.tierPremiumSub' : 'campaign.screen.tierFreeSub');

  return (
    <View style={[styles.root, claimed && styles.rootClaimed]}>
      <LinearGradient
        colors={
          LIGHT
            ? ['rgba(244,238,224,0.95)', 'rgba(255,255,255,0.96)']
            : [PARTNER_FLAIR.navy2, 'rgba(8,29,50,0.94)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Bronze wash at the top edge — the partner's identity, like the
          category halo on a normal reward. */}
      <LinearGradient
        colors={[`${PARTNER_FLAIR.bronze}33`, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.5]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={styles.content}
        accessibilityLabel={`${partner}, ${title}. ${line}`}
      >
        <View style={styles.top}>
          <View style={styles.topRow}>
            <View style={styles.iconTile}>
              <Ionicons
                name={locked ? 'lock-closed' : claimed ? 'checkmark' : 'pricetag'}
                size={20}
                color={PARTNER_FLAIR.bronze2}
              />
            </View>
            {premiumTier ? (
              <PremiumBadge size="sm" />
            ) : (
              <Ionicons name="ribbon" size={16} color={PARTNER_FLAIR.bronze2} style={styles.glyph} />
            )}
          </View>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {partner}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {line}
          </Text>
        </View>

        {claimed ? (
          <View style={styles.claimedBlock}>
            {code ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeText} selectable numberOfLines={1}>
                  {code}
                </Text>
              </View>
            ) : (
              <Text style={styles.pending}>{t('campaign.screen.couponPending')}</Text>
            )}
            <View style={styles.footer}>
              <Text style={styles.claimedText} numberOfLines={1}>
                {t('campaign.screen.claimed')}
              </Text>
              {code && (
                <Pressable
                  onPress={() => {
                    Share.share({ message: code }).catch(() => {});
                  }}
                  style={({ pressed }) => [styles.cta, styles.ctaGhost, pressed && { opacity: 0.85 }]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('campaign.screen.couponCopy')}
                >
                  <Ionicons name="share-outline" size={11} color={PARTNER_FLAIR.bronze2} />
                  <Text style={styles.ctaGhostText}>
                    {t('campaign.screen.couponCopyShort').toUpperCase()}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.footer}>
            <Text style={styles.sponsored} numberOfLines={1}>
              {t('campaign.sponsored')}
            </Text>
            <Pressable
              onPress={onRedeem}
              disabled={disabled}
              style={({ pressed }) => [
                styles.cta,
                locked ? styles.ctaGhost : styles.ctaBuy,
                (pressed || busy) && { opacity: 0.85 },
                disabled && !busy && { opacity: 0.7 },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t(locked ? 'campaign.screen.premiumCta' : 'campaign.screen.redeem')}
            >
              {!locked && (
                <LinearGradient
                  colors={[PARTNER_FLAIR.bronze2, PARTNER_FLAIR.bronze, '#8A6A2A']}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              {locked && (
                <Ionicons
                  name="sparkles"
                  size={10}
                  color={PARTNER_FLAIR.bronze2}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={locked ? styles.ctaGhostText : styles.ctaBuyText}>
                {t(locked ? 'campaign.screen.premiumCta' : 'campaign.screen.redeem').toUpperCase()}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${PARTNER_FLAIR.bronze}73`,
    minHeight: 188,
    overflow: 'hidden',
  },
  rootClaimed: {
    borderColor: `${PARTNER_FLAIR.bronze2}99`,
  },
  content: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  top: { gap: 2 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${PARTNER_FLAIR.bronze}50`,
    backgroundColor: `${PARTNER_FLAIR.bronze}26`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glyph: { opacity: 0.75, marginRight: 2 },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: PARTNER_FLAIR.bronze2,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 18,
    color: tokens.text.hi,
    marginBottom: 2,
  },
  description: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: tokens.text.mid,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  sponsored: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  claimedBlock: { marginTop: 10 },
  codeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${PARTNER_FLAIR.bronze2}99`,
    backgroundColor: LIGHT ? 'rgba(28,32,64,0.06)' : 'rgba(0,0,0,0.35)',
  },
  codeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: PARTNER_FLAIR.bronze2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pending: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: tokens.text.mid,
  },
  claimedText: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 0.4,
    color: PARTNER_FLAIR.bronze2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ctaBuy: { borderColor: `${PARTNER_FLAIR.bronze2}8C` },
  ctaBuyText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.7,
    color: PARTNER_FLAIR.bronzeInk,
  },
  ctaGhost: {
    borderColor: `${PARTNER_FLAIR.bronze}66`,
    backgroundColor: `${PARTNER_FLAIR.bronze}1A`,
    paddingHorizontal: 10,
  },
  ctaGhostText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.7,
    color: PARTNER_FLAIR.bronze2,
  },
});
