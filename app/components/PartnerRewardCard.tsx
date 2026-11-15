import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { GOLD_BADGE_BG, GOLD_TINT_BG } from '@/components/week/gold';
import {
  useActivePartnerCampaign,
  useAutoSecurePartnerUnlock,
  usePartnerCampaignStatus,
} from '@/lib/api/partners';
import type { PartnerCouponTier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLocalizedPick } from '@/lib/i18n/catalog';
import { campaignStateLine, campaignTiers, tierPct } from '@/lib/partnerCampaign';
import { usePartnerRedeem } from '@/lib/partnerRedeem';
import { tokens } from '@/theme';

/**
 * The partner coupon as a reward in the Vault (decision Artur, 2026-11-15):
 * a gold card under the "Parceria" chip with the campaign's state line, the
 * streak bar while it runs, and the TWO redemption options — the basic tier
 * (anyone who closed the streak) and the Premium tier (subscribers only).
 * Both stay locked until the streak is done; the choice is final and the
 * flows (last Premium offer before the basic claim, the invite when a free
 * member taps the Premium tier) live in `usePartnerRedeem`, shared with the
 * campaign screen. The header opens `/campaign/<id>` for the full program.
 *
 * Renders nothing without an active campaign.
 */
export function PartnerRewardCard({ enabled = true }: { enabled?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { pick } = useLocalizedPick();
  const campaign = useActivePartnerCampaign({ enabled });
  const c = campaign.data ?? null;
  const status = usePartnerCampaignStatus(c?.id, { enabled: enabled && c != null });
  const s = status.data ?? null;
  useAutoSecurePartnerUnlock(s);
  const { redeem, running } = usePartnerRedeem(c, s);

  if (!enabled || !c || !s) return null;
  const tiers = campaignTiers(c);
  if (tiers.length === 0) return null;

  const title = pick(c.title_en, c.title_pt);
  const line = campaignStateLine(c, s, t);
  const showBar = s.adopted && !s.unlocked;
  const ratio = s.goal > 0 ? Math.min(1, s.streak_days / s.goal) : 0;
  const open = () =>
    router.push({ pathname: '/campaign/[id]', params: { id: c.id, source: 'app' } });

  return (
    <View style={styles.card}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('campaign.card.a11y', { sponsored: t('campaign.sponsored'), title })}
        accessibilityHint={line}
      >
        <View style={styles.icon}>
          <Ionicons name={s.unlocked ? 'gift' : 'ribbon'} size={18} color={tokens.semantic.coinLight} />
        </View>
        <View style={styles.body}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {t('campaign.sponsored')} · {c.partner_name}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {line}
          </Text>
          {showBar && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={15} color={tokens.text.dim} />
      </Pressable>

      {s.unlocked && !s.claimed && (
        <Text style={styles.choose}>{t('campaign.screen.choose')}</Text>
      )}

      {tiers.map((tier) => (
        <PartnerTierRow
          key={tier}
          tier={tier}
          pct={tierPct(c, tier) ?? 0}
          partner={c.partner_name}
          goal={s.goal}
          unlocked={s.unlocked}
          claimed={s.claimed}
          chosen={s.claimed && s.tier === tier}
          code={s.claimed && s.tier === tier ? s.coupon_code : null}
          isPremium={s.is_premium}
          busy={running === tier}
          disabled={running != null}
          onRedeem={() => redeem(tier)}
        />
      ))}
    </View>
  );
}

export function PartnerTierRow({
  tier,
  pct,
  partner,
  goal,
  unlocked,
  claimed,
  chosen,
  code,
  isPremium,
  busy,
  disabled,
  onRedeem,
}: {
  tier: PartnerCouponTier;
  pct: number;
  partner: string;
  goal: number;
  unlocked: boolean;
  claimed: boolean;
  chosen: boolean;
  code: string | null;
  isPremium: boolean;
  busy: boolean;
  disabled: boolean;
  onRedeem: () => void;
}) {
  const { t } = useT();
  const premiumTier = tier === 'premium';
  // Visually locked: the streak, or (Premium tier) the subscription. The
  // tap still goes through — it is how the invite shows up.
  const locked = !unlocked || (premiumTier && !isPremium);
  const muted = claimed && !chosen;
  const state = claimed
    ? chosen
      ? code
        ? null
        : t('campaign.screen.couponPending')
      : t('campaign.screen.notChosen')
    : !unlocked
      ? t('campaign.screen.couponLocked', { goal })
      : premiumTier && !isPremium
        ? t('campaign.screen.tierPremiumLocked')
        : null;

  return (
    <View style={[styles.tier, muted && styles.tierMuted]}>
      <View style={styles.tierTop}>
        <View style={[styles.disc, !locked && !muted && styles.discOn]}>
          <Ionicons
            name={locked ? 'lock-closed' : chosen ? 'checkmark' : 'pricetag'}
            size={14}
            color={!locked && !muted ? tokens.semantic.coinInk : tokens.semantic.coinLight}
          />
        </View>
        <View style={styles.tierBody}>
          <Text style={styles.tierTitle}>
            {t(premiumTier ? 'campaign.screen.tierPremium' : 'campaign.screen.tierFree', {
              pct,
              partner,
            })}
          </Text>
          <Text style={styles.tierSub}>
            {t(premiumTier ? 'campaign.screen.tierPremiumSub' : 'campaign.screen.tierFreeSub', {
              goal,
            })}
          </Text>
          {state && <Text style={styles.tierState}>{state}</Text>}
        </View>
        {unlocked && !claimed && (
          <Pressable
            onPress={onRedeem}
            disabled={disabled}
            style={({ pressed }) => [
              styles.pill,
              premiumTier && !isPremium && styles.pillGhost,
              (pressed || busy) && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('campaign.screen.redeem')}
          >
            <Ionicons
              name={premiumTier && !isPremium ? 'sparkles' : 'gift'}
              size={14}
              color={premiumTier && !isPremium ? tokens.semantic.coinLight : tokens.semantic.coinInk}
            />
            <Text style={[styles.pillText, premiumTier && !isPremium && styles.pillTextGhost]}>
              {t('campaign.screen.redeem')}
            </Text>
          </Pressable>
        )}
      </View>

      {code && (
        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} selectable numberOfLines={1}>
              {code}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Share.share({ message: code }).catch(() => {});
            }}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('campaign.screen.couponCopy')}
          >
            <Ionicons name="share-outline" size={14} color={tokens.semantic.coinInk} />
            <Text style={styles.pillText}>{t('campaign.screen.couponCopy')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space[4],
    marginBottom: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
    paddingBottom: tokens.space[2],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[3],
  },
  pressed: { opacity: 0.8 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_BADGE_BG,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  track: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    backgroundColor: 'rgba(255, 200, 61, 0.18)',
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: tokens.semantic.coin },
  choose: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.semantic.coinLight,
    paddingHorizontal: tokens.space[3],
    paddingBottom: tokens.space[2],
  },
  tier: {
    marginHorizontal: tokens.space[2],
    marginTop: tokens.space[1],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    gap: tokens.space[2],
  },
  tierMuted: { opacity: 0.5 },
  tierTop: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[3] },
  disc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_BADGE_BG,
  },
  discOn: { backgroundColor: tokens.semantic.coin },
  tierBody: { flex: 1, minWidth: 0, gap: 2 },
  tierTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.hi,
  },
  tierSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  tierState: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.semantic.coinLight,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: tokens.space[3],
    borderRadius: 18,
    backgroundColor: tokens.semantic.coin,
  },
  pillGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  pillText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinInk,
  },
  pillTextGhost: { color: tokens.semantic.coinLight },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  codeBox: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.semantic.coinRim,
    backgroundColor: tokens.bg.deep,
  },
  codeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1.5,
    color: tokens.semantic.coinLight,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
