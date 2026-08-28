import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/ScreenBackground';
import { characterKeys } from '@/lib/api/character';
import { useT } from '@/lib/i18n';
import {
  normalizePremiumSource,
  PREMIUM_PLANS,
  PURCHASES_ENABLED,
  useIsPremium,
  type PlanId,
} from '@/lib/premium';
import {
  packageForPlan,
  purchasePremium,
  purchasesAvailable,
  restorePremium,
  useOffering,
} from '@/lib/purchases';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * Effective sell switch: the P2 kill switch AND this binary actually being
 * able to sell (native module + platform API key). Expo Go, pre-1.3.0
 * binaries and iOS-before-Apple-products all fall back to "Em breve".
 */
const CAN_SELL = PURCHASES_ENABLED && purchasesAvailable();

/**
 * Perceva Premium paywall — the P1 conversion surface. Reachable from the
 * limit modal (P1.1), the ≥80% badge (P1.1), locked instrument teasers,
 * Settings and (later) Learn cards, via `?source=…`.
 *
 * P1 has no payment gateway: while `PURCHASES_ENABLED` is false the CTA is a
 * disabled "Em breve" button and "Restaurar compras" is hidden — the funnel
 * is fully navigable in preview so the flow can be validated visually before
 * RevenueCat lands (P2). If the user is already premium the screen flips to a
 * "you're Premium" thank-you with no pitch — subscribers never see a sell.
 */
export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useT();
  const isPremium = useIsPremium();
  const params = useLocalSearchParams<{ source?: string }>();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const offering = useOffering();
  const queryClient = useQueryClient();

  // Origin of the visit. P1: dev-log only. P3: becomes an analytics event.
  useEffect(() => {
    const source = normalizePremiumSource(params.source);
    if (source) console.log(`[premium] opened from: ${source}`);
  }, [params.source]);

  // The store confirmed the purchase but our DB flag flips asynchronously
  // (RevenueCat webhook → subscription_tier). Poll the character query for
  // up to ~15s so the screen transitions to the thank-you state on its own;
  // if the webhook is slower than that, the flag still lands on the next
  // refetch — nothing is lost.
  const syncTierAfterPurchase = async () => {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      await queryClient.invalidateQueries({ queryKey: characterKeys.me() });
      const data = queryClient.getQueryData<{
        profile: { subscription_tier: string };
      }>(characterKeys.me());
      if (data?.profile.subscription_tier === 'premium') return;
    }
  };

  const handlePurchase = async () => {
    if (busy) return;
    const pkg = packageForPlan(offering.data, selectedPlan);
    if (!pkg) {
      showInfo(t('premium.purchase.failTitle'), t('premium.purchase.noOffering'));
      return;
    }
    setBusy('purchase');
    try {
      const outcome = await purchasePremium(pkg);
      if (outcome === 'premium') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await syncTierAfterPurchase();
      } else if (outcome === 'pending') {
        showInfo(t('premium.purchase.pendingTitle'), t('premium.purchase.pendingBody'));
      }
      // 'cancelled' → silent; the user changed their mind, no dialog needed.
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      showInfo(t('premium.purchase.failTitle'), msg);
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy('restore');
    try {
      const restored = await restorePremium();
      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await syncTierAfterPurchase();
        showInfo(t('premium.purchase.restoreOkTitle'), t('premium.purchase.restoreOkBody'));
      } else {
        showInfo(t('premium.purchase.restoreNoneTitle'), t('premium.purchase.restoreNoneBody'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      showInfo(t('premium.purchase.failTitle'), msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.topTitle}>{t('premium.screenTitle')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Hero />
          {isPremium ? (
            <ActiveState />
          ) : (
            <>
              <Benefits />
              <Comparison />
              <PlanPicker
                selected={selectedPlan}
                onSelect={setSelectedPlan}
                livePrices={{
                  annual: offering.data?.annual?.product.priceString ?? null,
                  monthly: offering.data?.monthly?.product.priceString ?? null,
                }}
              />
              <Cta onPress={handlePurchase} busy={busy === 'purchase'} />
              <Footer onRestore={handleRestore} restoring={busy === 'restore'} />
            </>
          )}
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  const { t } = useT();
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={[tokens.brand.violet2, tokens.brand.violet, tokens.brand.violetDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroIcon}
      >
        <Ionicons name="sparkles" size={30} color={tokens.text.hi} />
      </LinearGradient>
      <Text style={styles.heroTitle}>{t('premium.hero.title')}</Text>
      <Text style={styles.heroSubtitle}>{t('premium.hero.subtitle')}</Text>
    </View>
  );
}

/* ───────────────────────── Benefits ───────────────────────── */

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; descKey: string }[] = [
  { icon: 'cube-outline', titleKey: 'premium.benefit.instrumentsTitle', descKey: 'premium.benefit.instrumentsDesc' },
  { icon: 'infinite-outline', titleKey: 'premium.benefit.unlimitedTitle', descKey: 'premium.benefit.unlimitedDesc' },
  { icon: 'book-outline', titleKey: 'premium.benefit.learnTitle', descKey: 'premium.benefit.learnDesc' },
  { icon: 'heart-outline', titleKey: 'premium.benefit.supportTitle', descKey: 'premium.benefit.supportDesc' },
];

function Benefits() {
  const { t } = useT();
  return (
    <View style={styles.benefits}>
      {BENEFITS.map((b) => (
        <View key={b.titleKey} style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Ionicons name={b.icon} size={20} color={tokens.brand.violet2} />
          </View>
          <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>{t(b.titleKey)}</Text>
            <Text style={styles.benefitDesc}>{t(b.descKey)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ──────────────────────── Comparison ──────────────────────── */

function Comparison() {
  const { t } = useT();
  const unlimited = t('premium.compare.unlimited');
  const rows: { label: string; free: string; premium: string }[] = [
    { label: t('premium.compare.tasksLabel'), free: t('premium.compare.tasksFree'), premium: unlimited },
    { label: t('premium.compare.rewardsLabel'), free: t('premium.compare.rewardsFree'), premium: unlimited },
    { label: t('premium.compare.skillsLabel'), free: t('premium.compare.skillsFree'), premium: unlimited },
    { label: t('premium.compare.questsLabel'), free: t('premium.compare.questsFree'), premium: unlimited },
    { label: t('premium.compare.instrumentsLabel'), free: t('premium.compare.instrumentsFree'), premium: t('premium.compare.instrumentsPremium') },
    { label: t('premium.compare.articlesLabel'), free: t('premium.compare.articlesFree'), premium: t('premium.compare.articlesPremium') },
  ];

  return (
    <View style={styles.compareCard}>
      <View style={styles.compareHeadRow}>
        <Text style={[styles.compareCell, styles.compareLabelCell, styles.compareHeadText]}>
          {t('premium.compare.title')}
        </Text>
        <Text style={[styles.compareCell, styles.compareHeadText, styles.compareValueCell]}>
          {t('premium.compare.freeHeader')}
        </Text>
        <Text style={[styles.compareCell, styles.compareHeadText, styles.compareValueCell, styles.comparePremiumHead]}>
          {t('premium.compare.premiumHeader')}
        </Text>
      </View>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={[styles.compareRow, i < rows.length - 1 && styles.compareRowBorder]}
        >
          <Text style={[styles.compareCell, styles.compareLabelCell, styles.compareLabelText]}>
            {r.label}
          </Text>
          <Text style={[styles.compareCell, styles.compareValueCell, styles.compareFreeText]}>
            {r.free}
          </Text>
          <Text style={[styles.compareCell, styles.compareValueCell, styles.comparePremiumText]}>
            {r.premium}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ─────────────────────── Plan picker ──────────────────────── */

function PlanPicker({
  selected,
  onSelect,
  livePrices,
}: {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  /** Store-localized prices from the live offering; null → i18n fallback.
   *  The store is the source of truth once purchases are live — hardcoded
   *  strings drift the moment a price changes in the console. */
  livePrices: Record<PlanId, string | null>;
}) {
  const { t } = useT();
  return (
    <View style={styles.plans}>
      <Text style={styles.planPickerLabel}>{t('premium.plan.selectLabel')}</Text>
      {PREMIUM_PLANS.map((plan) => {
        const active = plan.id === selected;
        const name = t(`premium.plan.${plan.id}Name`);
        const live = livePrices[plan.id];
        const price = live
          ? t(`premium.plan.${plan.id}PriceLive`, { price: live })
          : t(`premium.plan.${plan.id}Price`);
        return (
          <Pressable
            key={plan.id}
            onPress={() => onSelect(plan.id)}
            style={[styles.planCard, active && styles.planCardActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.planRadio}>
              <View style={[styles.planRadioOuter, active && styles.planRadioOuterActive]}>
                {active && <View style={styles.planRadioDot} />}
              </View>
            </View>
            <View style={styles.planBody}>
              <View style={styles.planNameRow}>
                <Text style={styles.planName}>{name}</Text>
                {plan.highlighted && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{t('premium.plan.annualBadge')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>{price}</Text>
              {plan.id === 'annual' && (
                <Text style={styles.planEquiv}>{t('premium.plan.annualEquiv')}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─────────────────────────── CTA ──────────────────────────── */

function Cta({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  const { t } = useT();
  // "Em breve" whenever this binary can't sell (kill switch off, Expo Go,
  // old binary, or platform without an API key yet) — the funnel stays
  // navigable without a dead purchase path.
  if (!CAN_SELL) {
    return (
      <View style={[styles.cta, styles.ctaDisabled]} accessibilityRole="button">
        <Ionicons name="time-outline" size={18} color={tokens.text.mid} />
        <Text style={styles.ctaDisabledText}>{t('premium.cta.soon')}</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={tokens.gradient.completeBtn}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {busy ? (
        <ActivityIndicator color={tokens.text.hi} />
      ) : (
        <Text style={styles.ctaText}>{t('premium.cta.subscribe')}</Text>
      )}
    </Pressable>
  );
}

/* ────────────────────────── Footer ────────────────────────── */

function Footer({
  onRestore,
  restoring,
}: {
  onRestore: () => void;
  restoring: boolean;
}) {
  const { t } = useT();
  return (
    <View style={styles.footer}>
      <Text style={styles.footerCancel}>{t('premium.footer.cancel')}</Text>
      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>{t('premium.footer.terms')}</Text>
        <Text style={styles.footerSep}>{t('premium.footer.separator')}</Text>
        <Text style={styles.footerLink}>{t('premium.footer.privacy')}</Text>
      </View>
      {/* "Restaurar compras" only where this binary can actually sell. */}
      {CAN_SELL && (
        <Pressable onPress={onRestore} disabled={restoring} hitSlop={8}>
          <Text style={[styles.footerRestore, restoring && { opacity: 0.5 }]}>
            {t('premium.footer.restore')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* ───────────────────── Premium-active state ───────────────── */

function ActiveState() {
  const { t } = useT();
  return (
    <View style={styles.activeWrap}>
      <View style={styles.activeBadge}>
        <Ionicons name="checkmark-circle" size={22} color={tokens.semantic.xp} />
        <Text style={styles.activeTitle}>{t('premium.active.title')}</Text>
      </View>
      <Text style={styles.activeDesc}>{t('premium.active.desc')}</Text>
      <Text style={styles.activeBenefitsTitle}>{t('premium.active.benefitsTitle')}</Text>
      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.titleKey} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon} size={20} color={tokens.brand.violet2} />
            </View>
            <Text style={[styles.benefitTitle, { flex: 1 }]}>{t(b.titleKey)}</Text>
            <Ionicons name="checkmark" size={18} color={tokens.semantic.xp} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    gap: tokens.space[3],
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    ...tokens.type.h3,
    color: tokens.text.hi,
    textAlign: 'center',
    marginRight: 44,
  },
  content: {
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[8],
    gap: tokens.space[5],
  },

  hero: {
    alignItems: 'center',
    gap: tokens.space[2],
    paddingVertical: tokens.space[3],
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: tokens.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.space[2],
    ...tokens.shadow.violetGlow,
  },
  heroTitle: {
    ...tokens.type.h1,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...tokens.type.bodyLg,
    color: tokens.text.mid,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  benefits: { gap: tokens.space[3] },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(155, 130, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.24)',
  },
  benefitText: { flex: 1, gap: 2 },
  benefitTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  benefitDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.mid,
  },

  compareCard: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    overflow: 'hidden',
  },
  compareHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  compareRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.divider,
  },
  compareCell: { fontSize: 12 },
  compareLabelCell: { flex: 1.4 },
  compareValueCell: { flex: 1, textAlign: 'center' },
  compareHeadText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  comparePremiumHead: { color: tokens.brand.violet2 },
  compareLabelText: {
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.base,
  },
  compareFreeText: {
    fontFamily: 'Manrope_500Medium',
    color: tokens.text.mid,
  },
  comparePremiumText: {
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.hi,
  },

  plans: { gap: tokens.space[3] },
  planPickerLabel: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  planCardActive: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(155, 130, 255, 0.06)',
  },
  planRadio: { width: 22, alignItems: 'center' },
  planRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.text.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioOuterActive: { borderColor: tokens.brand.violet2 },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.brand.violet2,
  },
  planBody: { flex: 1, gap: 2 },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  planName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(61, 214, 140, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.4)',
  },
  planBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.3,
    color: tokens.semantic.xp2,
  },
  planPrice: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.base,
  },
  planEquiv: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },

  cta: {
    height: 54,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: tokens.space[2],
    overflow: 'hidden',
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
    letterSpacing: 0.3,
  },
  ctaDisabled: {
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  ctaDisabledText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },

  footer: { alignItems: 'center', gap: tokens.space[2], paddingTop: tokens.space[1] },
  footerCancel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  footerLink: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.dim,
  },
  footerSep: { color: tokens.text.faint, fontSize: 12 },
  footerRestore: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.brand.violet2,
    marginTop: tokens.space[1],
  },

  activeWrap: { gap: tokens.space[4], alignItems: 'stretch' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
  },
  activeTitle: {
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  activeDesc: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  activeBenefitsTitle: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: tokens.space[2],
  },
});
