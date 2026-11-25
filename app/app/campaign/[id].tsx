import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { GOLD_BADGE_BG, GOLD_TINT_BG } from '@/components/week/gold';
import { track } from '@/lib/analytics';
import { useLearningMaterial } from '@/lib/api/learning';
import {
  campaignTracks,
  useAdoptCampaignPractice,
  useJoinPartnerCampaign,
  usePartnerCampaign,
  usePartnerCampaignStatus,
} from '@/lib/api/partners';
import type { PartnerCampaignSource } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLocalizedPick } from '@/lib/i18n/catalog';
import { campaignCouponLine } from '@/lib/partnerCampaign';
import { freeLimitEntity } from '@/lib/premium';
import { tokens } from '@/theme';

/**
 * `/campaign/[id]` — about the partnership (Paker Health). Reached from the
 * Parcerias page of Recompensas ("Sobre a parceria"), the sponsored
 * material's row in the Recanto and the deep link `rpgtasks://campaign/<id>`.
 *
 * Since 2026-11-25 (André, caminho B of the partnership review) the coupons
 * are redeemed in ONE place, Recompensas › Parcerias, and the 4-day
 * challenge is gone from the app:
 *
 *   hero          eyebrow "Parceria" + title + pitch
 *   Seus cupons   where the coupons stand + "Ver meus cupons" (opens the
 *                 Parcerias page) + the partner's site
 *   Quer lembrar  the campaign's practices as a plain suggestion: "Adicionar"
 *   todo dia?     puts one in today's list (joining the campaign on the way,
 *                 which is the partner's count); once added, the row says
 *                 so and offers the Práticas tab. No streak, no rule.
 *   Leia o material  the sponsored material, when the campaign has one
 *   disclosure
 *
 * Every action is the same gold pill.
 */

const SOURCES: readonly PartnerCampaignSource[] = [
  'banner',
  'material',
  'campaign',
  'deeplink',
  'app',
];

/** "https://www.pakerhealth.com.br/x" → "pakerhealth.com.br" — shown next
 *  to the partner link so it says where it goes. */
function hostOf(url: string): string | null {
  const m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url.trim());
  return m ? m[1].replace(/^www\./i, '') : null;
}

export default function CampaignScreen() {
  const router = useRouter();
  const { t } = useT();
  const { pick } = useLocalizedPick();
  const params = useLocalSearchParams<{ id: string; source?: string }>();
  const bottomClearance = useBottomSafeClearance();

  const campaign = usePartnerCampaign(params.id);
  const c = campaign.data ?? null;
  const status = usePartnerCampaignStatus(c?.id, { enabled: c != null });
  const material = useLearningMaterial(c?.material_slug);
  const join = useJoinPartnerCampaign();
  const adopt = useAdoptCampaignPractice();
  // Which practice's pill spins while adopting (the others just disable);
  // the ref is the hard guard — a same-frame double tap lands before the
  // re-render.
  const [adopting, setAdopting] = useState<string | null>(null);
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

  const handleAdopt = async (templateId: string) => {
    if (busy.current) return;
    busy.current = true;
    setAdopting(templateId);
    try {
      // Adding joins the campaign too — the partner's count of people who
      // came through it; a tap never gains a step.
      if (!s.member) await join.mutateAsync({ campaignId: c.id, source: 'campaign' });
      await adopt.mutateAsync({ campaign: c, templateId });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (err) {
      // Catalog adoptions are unlimited, but a free-cap error still pops
      // the global limit modal (root MutationCache) — no second dialog.
      if (!freeLimitEntity(err)) {
        const e = err as { message?: string };
        Alert.alert(
          t('tasksHub.errors.couldNotAdoptTitle'),
          e.message ?? t('tasksHub.errors.unknown'),
        );
      }
    } finally {
      busy.current = false;
      setAdopting(null);
    }
  };

  // dismissTo, not navigate: back to the tabs already under this screen.
  // A navigate would stack a second copy of the whole tab navigator.
  const goCoupons = () =>
    router.dismissTo({
      pathname: '/(tabs)/rewards',
      params: { tab: 'parcerias', at: String(Date.now()) },
    });

  const title = pick(c.title_en, c.title_pt);
  const tracks = campaignTracks(c);
  const adoptedTrack = s.adopted
    ? (tracks.find((k) => k.template_id === s.track_template_id) ?? null)
    : null;
  const partnerUrl = c.partner_url;
  const partnerHost = partnerUrl ? hostOf(partnerUrl) : null;
  const m = material.data ?? null;

  const couponsCard = (
    <View style={[styles.card, styles.rewardCard]}>
      <Text style={[styles.cardLabel, styles.cardLabelGold]}>
        {t('campaign.screen.couponsTitle')}
      </Text>
      <Text style={styles.addedText}>{campaignCouponLine(c, s, t)}</Text>
      <Text style={styles.stateText}>{t('campaign.screen.couponsHint')}</Text>
      <View style={styles.pillRow}>
        <ActionPill icon="pricetag" label={t('campaign.screen.seeCoupons')} onPress={goCoupons} />
      </View>

      {partnerUrl && (
        <Pressable
          onPress={() => {
            Linking.openURL(partnerUrl).catch(() => {});
          }}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          accessibilityRole="link"
          accessibilityHint={partnerHost ?? undefined}
        >
          <View style={styles.linkIcon}>
            <Ionicons name="globe-outline" size={16} color={tokens.semantic.coinLight} />
          </View>
          <Text style={styles.linkText} numberOfLines={1}>
            {t('campaign.screen.visitPartner', { name: c.partner_name })}
          </Text>
          {partnerHost && (
            <Text style={styles.linkMeta} numberOfLines={1}>
              {partnerHost}
            </Text>
          )}
          <Ionicons name="open-outline" size={15} color={tokens.text.dim} />
        </Pressable>
      )}
    </View>
  );

  // The campaign's practices as a suggestion — nothing counts, nothing
  // resets. A practice added elsewhere (Gerenciar › Sugeridas) shows here
  // as added too: `adopted` is the server's read of today's list.
  const practiceCard =
    tracks.length === 0 ? null : (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('campaign.screen.practiceTitle')}</Text>
        {adoptedTrack ? (
          <View style={styles.addedRow}>
            <View style={styles.trackIcon}>
              <Ionicons name="checkmark" size={16} color={tokens.semantic.coinLight} />
            </View>
            <Text style={styles.addedText}>
              {t('campaign.screen.practiceAdded', {
                practice: adoptedTrack.practice?.title ?? adoptedTrack.template_id,
              })}
            </Text>
            <ActionPill
              label={t('campaign.screen.practiceGo')}
              a11yLabel={t('campaign.screen.practiceGoA11y')}
              onPress={() => router.dismissTo('/(tabs)')}
            />
          </View>
        ) : (
          <>
            <Text style={styles.stateText}>{t('campaign.screen.practiceBody')}</Text>
            {tracks.map((k) => (
              <TrackRow
                key={k.template_id}
                icon={k.practice?.icon ?? null}
                title={k.practice?.title ?? k.template_id}
                action={{
                  label: t('campaign.screen.practiceAdd'),
                  onPress: () => {
                    void handleAdopt(k.template_id);
                  },
                  busy: adopting === k.template_id,
                  disabled: adopting != null,
                }}
              />
            ))}
          </>
        )}
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

      {couponsCard}
      {practiceCard}

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
  /** Screen-reader label when the visible one repeats. */
  a11yLabel?: string;
}

/** The screen's ONE action control — see my coupons, Add, go to Práticas.
 *  36px tall to sit inside a row; the hitSlop makes the target 48. */
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

/** One of the campaign's practices to add: catalog icon + title + its own
 *  "Adicionar" pill. Siblings with the same anatomy. */
function TrackRow({
  icon,
  title,
  action,
}: {
  icon: string | null;
  title: string;
  action: PillAction;
}) {
  return (
    <View style={styles.trackRow}>
      <View style={styles.trackIcon}>
        <AppIcon name={icon} size={16} color={tokens.semantic.coinLight} />
      </View>
      <Text style={styles.trackTitle} numberOfLines={2}>
        {title}
      </Text>
      <ActionPill {...action} />
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

  // Practices to add
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    marginTop: tokens.space[2],
    paddingVertical: tokens.space[2],
    paddingLeft: tokens.space[2],
    paddingRight: tokens.space[2],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  trackIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_BADGE_BG,
  },
  trackTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.hi,
  },

  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  addedText: {
    flex: 1,
    minWidth: 0,
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.hi,
  },

  pillRow: {
    flexDirection: 'row',
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

  stateText: {
    fontFamily: tokens.font.family,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
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
