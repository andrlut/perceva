import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { GOLD_BADGE_BG, GOLD_TINT_BG } from '@/components/week/gold';
import { track } from '@/lib/analytics';
import { useLearningMaterial } from '@/lib/api/learning';
import {
  useAdoptCampaignPractice,
  useAutoClaimPartnerCoupon,
  useClaimPartnerCoupon,
  useJoinPartnerCampaign,
  usePartnerCampaign,
  usePartnerCampaignStatus,
} from '@/lib/api/partners';
import type { PartnerCampaignSource } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLocalizedPick } from '@/lib/i18n/catalog';
import { hasPercevaReward, rewardCount } from '@/lib/partnerCampaign';
import { freeLimitEntity, useIsPremium } from '@/lib/premium';
import { tokens } from '@/theme';

/**
 * `/campaign/[id]` — the partner campaign (Programa Paker Health). Reached
 * from the Home card (`?source=banner`), the sponsored material's campaign
 * row and the deep link `rpgtasks://campaign/<id>`.
 *
 *   hero         eyebrow "Patrocinado" + title + pitch
 *   Como funciona  3 sibling steps: join · add the practice · check it daily
 *   Suas recompensas progress bar (until the claim — after it the rewards
 *                  are secured and the live streak would only alarm) →
 *                  "unlocks at N" once while locked → the claim (when
 *                  unlocked) → one row per reward, siblings with the same
 *                  anatomy: the Perceva Premium discount and the partner's
 *                  coupon (→ its site). Each row: lock / unlocked / code on
 *                  its way / code + copy. One claim covers both; each code
 *                  shows up once released. The Premium row only links to
 *                  the paywall (`?source=partner`) once its code is in hand,
 *                  on Android (the Play sheet takes the code; the App Store
 *                  redeems it on its own) and for someone not yet Premium —
 *                  never as a full-price shortcut before the code exists.
 *   Leia o material the sponsored material, when the campaign has one
 *   disclosure
 *
 * Once the practice is adopted the reward card moves ABOVE "Como funciona":
 * mid-run, the bar is what the member comes to check, and the steps are
 * already done.
 *
 * Every action is the same gold pill (the two links under the rewards are
 * link rows, not buttons). "Add" and the claim join first when
 * the user hasn't — the server needs membership to claim, and a tap never
 * gains a step. A member's unlock is claimed on sight
 * (`useAutoClaimPartnerCoupon`), so for them the claim pill is only a
 * fallback. Progress is the server's count (see lib/api/partners); nothing
 * here decides an unlock.
 *
 * Copying without a native module: expo-clipboard would need an `eas
 * build`, so "Copiar ou enviar" opens the system Share sheet (Android's has
 * "Copiar") and the code itself stays `selectable` — same as /conector.
 */

const SOURCES: readonly PartnerCampaignSource[] = [
  'banner',
  'material',
  'campaign',
  'deeplink',
  'app',
];

type Running = 'join' | 'adopt' | 'claim';

/** "https://www.pakerhealth.com.br/x" → "pakerhealth.com.br" — shown next
 *  to the partner link so it says where it goes. */
function hostOf(url: string): string | null {
  const m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url.trim());
  return m ? m[1].replace(/^www\./i, '') : null;
}

export default function CampaignScreen() {
  const router = useRouter();
  const { t } = useT();
  const { pick, pickCascadeNullable } = useLocalizedPick();
  const params = useLocalSearchParams<{ id: string; source?: string }>();
  const bottomClearance = useBottomSafeClearance();
  const isPremium = useIsPremium();

  const campaign = usePartnerCampaign(params.id);
  const c = campaign.data ?? null;
  const status = usePartnerCampaignStatus(c?.id, { enabled: c != null });
  useAutoClaimPartnerCoupon(status.data);
  const material = useLearningMaterial(c?.material_slug);
  const join = useJoinPartnerCampaign();
  const adopt = useAdoptCampaignPractice();
  const claim = useClaimPartnerCoupon();
  // `running` drives the spinner and disables the other pills; the ref is
  // the hard guard — a same-frame double tap lands before the re-render.
  const [running, setRunning] = useState<Running | null>(null);
  const busy = useRef(false);

  // One `campaign_opened` per visit, once the campaign is known to exist.
  const opened = useRef(false);
  useEffect(() => {
    if (!c || opened.current) return;
    opened.current = true;
    const source = SOURCES.find((v) => v === params.source);
    track('campaign_opened', source ? { campaign: c.id, source } : { campaign: c.id });
  }, [c, params.source]);

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={24} color={tokens.text.hi} />
      </Pressable>
    </View>
  );

  const shell = (body: ReactNode) => (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        <Stack.Screen options={{ headerShown: false }} />
        {header}
        {body}
      </ScreenBackground>
    </SafeAreaView>
  );

  if (campaign.isLoading || (c != null && status.isLoading)) {
    return shell(
      <View style={styles.center}>
        <ActivityIndicator color={tokens.semantic.coin} />
      </View>,
    );
  }

  // RLS hides ended, inactive, not-yet-started and unknown campaigns the
  // same way — hence "not available", never "ended". The one exception is
  // someone who already claimed: they keep seeing theirs after it ends
  // (migration 20261105000001), since the codes arrive later.
  if (!c) {
    if (campaign.error) {
      return shell(
        <ErrorState
          text={t('common.error')}
          retry={t('common.retry')}
          onRetry={() => campaign.refetch()}
        />,
      );
    }
    return shell(
      <View style={[styles.center, styles.centerPad]}>
        <View style={styles.emptyBadge}>
          <Ionicons name="ribbon-outline" size={26} color={tokens.text.dim} />
        </View>
        <Text style={styles.emptyText}>{t('campaign.screen.notFound')}</Text>
      </View>,
    );
  }

  const s = status.data;
  if (!s) {
    return shell(
      <ErrorState
        text={t('common.error')}
        retry={t('common.retry')}
        onRetry={() => status.refetch()}
      />,
    );
  }

  const run = async (
    action: Running,
    fn: () => Promise<unknown>,
    onError: (err: unknown) => void,
  ) => {
    if (busy.current) return;
    busy.current = true;
    setRunning(action);
    try {
      await fn();
    } catch (err) {
      onError(err);
    } finally {
      busy.current = false;
      setRunning(null);
    }
  };

  const ensureMember = async () => {
    if (!s.member) await join.mutateAsync({ campaignId: c.id, source: 'campaign' });
  };

  const handleJoin = () =>
    run(
      'join',
      async () => {
        await ensureMember();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      () => Alert.alert(t('common.error')),
    );

  const handleAdopt = () =>
    run(
      'adopt',
      async () => {
        await ensureMember();
        await adopt.mutateAsync(c);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      (err) => {
        // Catalog adoptions are unlimited, but a free-cap error still pops
        // the global limit modal (root MutationCache) — no second dialog.
        if (freeLimitEntity(err)) return;
        const e = err as { message?: string };
        Alert.alert(
          t('tasksHub.errors.couldNotAdoptTitle'),
          e.message ?? t('tasksHub.errors.unknown'),
        );
      },
    );

  const handleClaim = () =>
    run(
      'claim',
      async () => {
        await ensureMember();
        await claim.mutateAsync({ campaignId: c.id });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      // `streak_not_reached` (the day turned, an undo elsewhere) converges
      // on its own: the status refetch puts the lock back.
      () => Alert.alert(t('common.error')),
    );

  const title = pick(c.title_en, c.title_pt);
  const ratio = s.goal > 0 ? Math.min(1, s.streak_days / s.goal) : 0;
  const practice = c.practice?.title ?? null;
  const partnerUrl = c.partner_url;
  const partnerHost = partnerUrl ? hostOf(partnerUrl) : null;
  const m = material.data ?? null;
  const showSkips = s.adopted && !s.claimed && s.max_skips > 0;
  // How many rewards the one claim delivers — every line that counts them
  // is a plural fed with this (a campaign without the Premium discount
  // promises one, never "two").
  const count = rewardCount(c);

  // The rewards: the Perceva Premium discount (when the campaign has one),
  // then the partner's coupon — the program's own order of the two.
  // A code only comes back once claimed AND released, so `code` alone says
  // "in hand"; `ready` lets the copy tell the truth before the claim.
  const rewards: Reward[] = [];
  if (hasPercevaReward(c)) {
    const percevaCode = s.claimed ? s.perceva_code : null;
    rewards.push({
      key: 'perceva',
      icon: 'sparkles',
      title: pickCascadeNullable(c.perceva_reward_en, c.perceva_reward_pt) ?? '',
      ready: s.perceva_code_ready,
      code: percevaCode,
      howTo: percevaCode
        ? t(
            Platform.OS === 'ios'
              ? 'campaign.screen.premiumHowTo.ios'
              : 'campaign.screen.premiumHowTo.android',
          )
        : null,
      // The paywall has no code field and preselects the annual plan at
      // full price, so it is only a path once the code is in hand — and
      // only where the store sheet takes it (Play; the App Store redeems
      // offer codes on its own) and for someone who isn't Premium yet.
      link:
        percevaCode && !isPremium && Platform.OS !== 'ios'
          ? {
              icon: 'sparkles-outline',
              label: t('campaign.screen.seePremium'),
              external: false,
              onPress: () => router.push('/premium?source=partner'),
            }
          : null,
    });
  }
  rewards.push({
    key: 'partner',
    icon: 'pricetag',
    title: pick(c.reward_en, c.reward_pt),
    ready: s.coupon_ready,
    code: s.claimed ? s.coupon_code : null,
    howTo: null,
    link: partnerUrl
      ? {
          icon: 'globe-outline',
          label: t('campaign.screen.visitPartner', { name: c.partner_name }),
          meta: partnerHost,
          external: true,
          onPress: () => {
            Linking.openURL(partnerUrl).catch(() => {});
          },
        }
      : null,
  });
  const allReady = rewards.every((r) => r.ready);

  /** A reward row's state line; null once its code is in hand (the code
   *  box takes the line's place) and while locked (the card says "unlocks
   *  at N" once, above both rows, and each row's lock disc says the rest). */
  const rewardState = (r: Reward): string | null => {
    if (r.code) return null;
    if (s.claimed) return t('campaign.screen.couponPending');
    if (s.unlocked) {
      return r.ready ? t('campaign.screen.rewardReady') : t('campaign.screen.rewardOnItsWay');
    }
    return null;
  };

  const howCard = (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{t('campaign.screen.how')}</Text>
      <StepRow
        n={1}
        done={s.member}
        title={t('campaign.screen.step1Title')}
        body={
          s.member ? t('campaign.screen.step1Done') : t('campaign.screen.step1Body', { count })
        }
        action={
          s.member
            ? null
            : {
                label: t('campaign.screen.step1Cta'),
                onPress: handleJoin,
                busy: running === 'join',
                disabled: running != null,
              }
        }
      />
      <StepRow
        n={2}
        done={s.adopted}
        title={t('campaign.screen.step2Title')}
        body={
          s.adopted
            ? t('campaign.screen.step2Done')
            : practice
              ? // "Adicionar" joins too when needed — the copy says so.
                t(s.member ? 'campaign.screen.step2Body' : 'campaign.screen.step2BodyJoin', {
                  practice,
                })
              : null
        }
        action={
          s.adopted
            ? null
            : {
                label: t('campaign.screen.step2Cta'),
                onPress: handleAdopt,
                busy: running === 'adopt',
                disabled: running != null,
              }
        }
      />
      <StepRow
        n={3}
        done={s.done_today}
        title={t('campaign.screen.step3Title')}
        body={t('campaign.screen.step3Body', { count: s.max_skips })}
        action={null}
      />
    </View>
  );

  const rewardCard = (
    <View style={[styles.card, styles.rewardCard]}>
      <Text style={[styles.cardLabel, styles.cardLabelGold]}>
        {rewards.length > 1
          ? t('campaign.screen.rewardsTitle')
          : t('campaign.screen.couponTitle')}
      </Text>

      {/* The bar only while it decides something: after the claim the
         rewards are secured, and a live streak that broke ("0 de 7")
         above codes already in hand would read as if they were at risk —
         the Home card hides its bar on the same rule. */}
      {!s.claimed && (
        <View
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: s.goal, now: Math.min(s.streak_days, s.goal) }}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t('campaign.screen.progress', { days: s.streak_days, goal: s.goal })}
          </Text>
          {showSkips && (
            <Text style={styles.skipsText}>
              {t('campaign.screen.skipsUsed', { used: s.skips_used, count: s.max_skips })}
            </Text>
          )}
        </View>
      )}

      {/* Locked: said once for both rows (each row's lock disc says it). */}
      {!s.unlocked && (
        <Text style={styles.stateText}>
          {t('campaign.screen.couponLocked', { goal: s.goal })}
        </Text>
      )}

      {/* The claim — one tap for every reward. Without some code yet, say
         so before the tap, and why it is worth it: claiming is what keeps
         the rewards if the streak breaks. */}
      {s.unlocked && !s.claimed && (
        <>
          {!allReady && (
            <Text style={styles.stateText}>
              {t('campaign.screen.couponNotReady', { count })}
            </Text>
          )}
          <View style={styles.claimRow}>
            <ActionPill
              icon="gift"
              label={
                allReady
                  ? t('campaign.screen.couponClaim', { count })
                  : t('campaign.screen.couponSecure', { count })
              }
              onPress={handleClaim}
              busy={running === 'claim'}
              disabled={running != null}
            />
          </View>
        </>
      )}

      {rewards.map((r) => (
        <RewardRow
          key={r.key}
          reward={r}
          unlocked={s.unlocked}
          state={rewardState(r)}
          copyLabel={t('campaign.screen.couponCopy')}
          copyA11yLabel={t('campaign.screen.couponCopyA11y', { reward: r.title })}
        />
      ))}
    </View>
  );

  return shell(
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomClearance + tokens.space[4] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="ribbon" size={22} color={tokens.semantic.coin} />
        </View>
        <Text style={styles.eyebrow}>{t('campaign.sponsored')}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.pitch}>{pick(c.pitch_en, c.pitch_pt)}</Text>
      </View>

      {/* ── Sua recompensa / Como funciona — the bar first mid-run ───── */}
      {s.adopted ? (
        <>
          {rewardCard}
          {howCard}
        </>
      ) : (
        <>
          {howCard}
          {rewardCard}
        </>
      )}

      {/* ── Leia o material ──────────────────────────────────────────── */}
      {m && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('campaign.screen.materialTitle')}</Text>
          <Pressable
            onPress={() => router.push(`/material/${m.slug}`)}
            style={({ pressed }) => [styles.materialRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={pick(m.title_en, m.title_pt)}
          >
            {m.hero_image_url ? (
              <Image
                source={m.hero_image_url}
                style={styles.materialThumb}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View style={[styles.materialThumb, styles.materialThumbEmpty]}>
                <Ionicons name="book-outline" size={20} color={tokens.semantic.coinLight} />
              </View>
            )}
            <View style={styles.materialBody}>
              <Text style={styles.materialTitle} numberOfLines={2}>
                {pick(m.title_en, m.title_pt)}
              </Text>
              <Text style={styles.materialSummary} numberOfLines={2}>
                {pick(m.summary_en, m.summary_pt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
          </Pressable>
        </View>
      )}

      <Text style={styles.disclosure}>
        {t('campaign.screen.disclosure', { name: c.partner_name })}
      </Text>
    </ScrollView>,
  );
}

interface PillAction {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  /** Screen-reader label when the visible one repeats (one Copy per code). */
  a11yLabel?: string;
}

/** The screen's ONE action control — Join, Add, the claim, Copy. 36px
 *  tall to sit inside a step row; the hitSlop makes the target 48. */
function ActionPill({
  label,
  onPress,
  busy = false,
  disabled = false,
  a11yLabel,
  icon,
}: PillAction & { icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.pill,
        (disabled || busy) && styles.pillDisabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled: disabled || busy, busy }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={tokens.semantic.coinInk} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={15} color={tokens.semantic.coinInk} />}
          <Text style={styles.pillText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** One "Como funciona" row: number/check disc · title over body · one
 *  trailing pill (or nothing once the step is done). */
function StepRow({
  n,
  done,
  title,
  body,
  action,
}: {
  n: number;
  done: boolean;
  title: string;
  body: string | null;
  action: PillAction | null;
}) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepDisc, done && styles.stepDiscDone]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color={tokens.semantic.coinInk} />
        ) : (
          <Text style={styles.stepNum}>{n}</Text>
        )}
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        {body && <Text style={styles.stepText}>{body}</Text>}
      </View>
      {action && <ActionPill {...action} />}
    </View>
  );
}

interface RewardLink {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  meta?: string | null;
  /** Leaves the app (the partner's site) or opens a screen (the paywall). */
  external: boolean;
  onPress: () => void;
}

interface Reward {
  key: 'perceva' | 'partner';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** The code was already released (the server's `*_ready`). */
  ready: boolean;
  /** In hand: claimed AND released. */
  code: string | null;
  /** Under the code box: where the code is used (null = nothing to add). */
  howTo: string | null;
  link: RewardLink | null;
}

/** One reward — the two are siblings with this same anatomy, which is also
 *  a StepRow's: disc (a lock until unlocked, then the reward's glyph on
 *  solid gold) · title over the state line; the code box + copy pill (and
 *  the how-to line, when the reward has one) once the code is in hand; then
 *  the reward's link row. */
function RewardRow({
  reward,
  unlocked,
  state,
  copyLabel,
  copyA11yLabel,
}: {
  reward: Reward;
  unlocked: boolean;
  state: string | null;
  copyLabel: string;
  copyA11yLabel: string;
}) {
  const { code, howTo, link } = reward;
  return (
    <View style={styles.reward}>
      <View style={styles.step}>
        <View style={[styles.stepDisc, unlocked && styles.stepDiscDone]}>
          <Ionicons
            name={unlocked ? reward.icon : 'lock-closed'}
            size={14}
            color={unlocked ? tokens.semantic.coinInk : tokens.semantic.coinLight}
          />
        </View>
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{reward.title}</Text>
          {state && <Text style={styles.stepText}>{state}</Text>}
        </View>
      </View>

      {code && (
        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text
              style={styles.codeText}
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {code}
            </Text>
          </View>
          <ActionPill
            icon="share-outline"
            label={copyLabel}
            a11yLabel={copyA11yLabel}
            onPress={() => {
              Share.share({ message: code }).catch(() => {});
            }}
          />
        </View>
      )}

      {code && howTo && <Text style={styles.stepText}>{howTo}</Text>}

      {link && (
        <Pressable
          onPress={link.onPress}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          accessibilityRole={link.external ? 'link' : 'button'}
          accessibilityHint={link.meta ?? undefined}
        >
          <View style={styles.linkIcon}>
            <Ionicons name={link.icon} size={16} color={tokens.semantic.coinLight} />
          </View>
          <Text style={styles.linkText} numberOfLines={1}>
            {link.label}
          </Text>
          {link.meta && (
            <Text style={styles.linkMeta} numberOfLines={1}>
              {link.meta}
            </Text>
          )}
          <Ionicons
            name={link.external ? 'open-outline' : 'chevron-forward'}
            size={15}
            color={tokens.text.dim}
          />
        </Pressable>
      )}
    </View>
  );
}

function ErrorState({
  text,
  retry,
  onRetry,
}: {
  text: string;
  retry: string;
  onRetry: () => void;
}) {
  return (
    <View style={[styles.center, styles.centerPad]}>
      <Text style={styles.emptyText}>{text}</Text>
      <ActionPill icon="refresh" label={retry} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[2],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[3],
  },
  centerPad: {
    paddingHorizontal: tokens.space[6],
  },
  emptyBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  emptyText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 16,
    lineHeight: 22,
    color: tokens.text.base,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[1],
    gap: tokens.space[3],
  },
  pressed: {
    opacity: 0.75,
  },

  // Hero
  hero: {
    gap: tokens.space[2],
    marginBottom: tokens.space[2],
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_BADGE_BG,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    marginBottom: tokens.space[1],
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.semantic.coinLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...tokens.type.h1,
    color: tokens.text.hi,
  },
  pitch: {
    ...tokens.type.bodyLg,
    color: tokens.text.base,
  },

  // Cards
  card: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  rewardCard: {
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
  },
  cardLabel: {
    ...tokens.type.eyebrow,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardLabelGold: {
    color: tokens.semantic.coinLight,
  },

  // Steps
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 44,
  },
  stepDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_BADGE_BG,
  },
  stepDiscDone: {
    backgroundColor: tokens.semantic.coin,
  },
  stepNum: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 13,
    color: tokens.semantic.coinLight,
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  stepTitle: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  stepText: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },

  // The one action control
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1,
    borderColor: tokens.semantic.coinPillRim,
  },
  pillDisabled: {
    opacity: 0.55,
  },
  pillText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 13,
    color: tokens.semantic.coinInk,
    letterSpacing: 0.2,
  },

  // Rewards
  reward: {
    gap: tokens.space[2],
    borderTopWidth: 1,
    borderTopColor: tokens.border.divider,
    paddingTop: tokens.space[3],
  },
  progress: {
    gap: 6,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD_BADGE_BG,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.semantic.coin,
  },
  progressText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.semantic.coinLight,
  },
  skipsText: {
    fontFamily: tokens.font.family,
    fontSize: 12,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  stateText: {
    fontFamily: tokens.font.family,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
  },
  claimRow: {
    flexDirection: 'row',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  codeBox: {
    flex: 1,
    minWidth: 0,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_BADGE_BG,
  },
  codeText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 18,
    letterSpacing: 2,
    color: tokens.semantic.coinLight,
    textAlign: 'center',
  },
  // The link row sits in the reward row: its glyph in a disc-wide slot, so
  // the label lines up with the reward's title.
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 44,
  },
  linkIcon: {
    width: 28,
    alignItems: 'center',
  },
  linkText: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.semantic.coinLight,
  },
  linkMeta: {
    flexShrink: 1,
    fontFamily: tokens.font.family,
    fontSize: 12,
    color: tokens.text.dim,
  },

  // Material
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  materialThumb: {
    width: 48,
    height: 64,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.bg.surface2,
  },
  materialThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  materialTitle: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  materialSummary: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },

  disclosure: {
    fontFamily: tokens.font.family,
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
    marginTop: tokens.space[2],
    paddingHorizontal: tokens.space[1],
  },
});
