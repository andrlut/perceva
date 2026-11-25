import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { GuideStep } from '@/components/guide/GuideStep';
import { ScreenInfoButton } from '@/components/guide/ScreenInfoButton';
import { InfoSheet } from '@/components/InfoSheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  AreaRows,
  CoinsBlock,
  DaysStrip,
  KpiRow,
  LifeBlock,
  MoodBlock,
  Muted,
  RewardRows,
  VideoSlot,
  WeekCard,
  keyToDate,
} from '@/components/weekSummary/WeekParts';
import { creditCost, monthLeft, useAiAccess } from '@/lib/api/ai';
import {
  lastClosedWeek,
  mondayOf,
  shiftWeek,
  useGenerateWeekInsight,
  useWeekInsight,
  useWeekSummary,
  type WeekInsight,
  type WeekInsightFailure,
  type WeekSummary,
} from '@/lib/api/weekSummary';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useIsPremium } from '@/lib/premium';
import { tokens } from '@/theme';

/**
 * "Resumo da semana" — the week that closed (Monday to Sunday, the phone's
 * timezone), in exact numbers for everyone, and the AI's 3 observations +
 * 1 practice suggestion for Premium. Opened by the Monday 08:00 local
 * notification and by Eu › Dedicação.
 *
 * A simple card screen on purpose: the presentation waits for the 3D
 * character's style; its celebration video has a reserved spot on top.
 */
export default function WeekScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const bottomClearance = useBottomSafeClearance();
  const [start, setStart] = useState(() => lastClosedWeek());
  const [helpOpen, setHelpOpen] = useState(false);
  const q = useWeekSummary(start);
  const s = q.data;

  const intl = locale === 'pt' ? 'pt-BR' : 'en-US';
  const thisMonday = mondayOf(new Date());
  const weeksBack = Math.round(
    (keyToDate(thisMonday).getTime() - keyToDate(start).getTime()) / (7 * 86_400_000),
  );
  const canPrev = !s || start > s.week.first_week;
  const canNext = start < thisMonday;

  const from = keyToDate(start);
  const to = keyToDate(shiftWeek(start, 1));
  to.setDate(to.getDate() - 1);
  const sameMonth = from.getMonth() === to.getMonth();
  const range = t('weekSummary.range', {
    from: from.toLocaleDateString(intl, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' }),
    to: to.toLocaleDateString(intl, { day: 'numeric', month: 'short' }),
  });
  const relative =
    weeksBack <= 0
      ? t('weekSummary.thisWeek')
      : weeksBack === 1
        ? t('weekSummary.lastWeek')
        : t('weekSummary.weeksAgo', { count: weeksBack });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>{t('weekSummary.eyebrow')}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {range}
            </Text>
          </View>
          <ScreenInfoButton onPress={() => setHelpOpen(true)} a11yLabel={t('weekSummary.help.a11y')} />
        </View>

        <View style={styles.selector}>
          <Pressable
            onPress={() => setStart(shiftWeek(start, -1))}
            disabled={!canPrev}
            style={({ pressed }) => [styles.arrow, !canPrev && styles.arrowOff, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('weekSummary.prevA11y')}
          >
            <Ionicons name="chevron-back" size={18} color={tokens.text.base} />
          </Pressable>
          <Text style={styles.selectorText}>{relative}</Text>
          <Pressable
            onPress={() => setStart(shiftWeek(start, 1))}
            disabled={!canNext}
            style={({ pressed }) => [styles.arrow, !canNext && styles.arrowOff, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('weekSummary.nextA11y')}
          >
            <Ionicons name="chevron-forward" size={18} color={tokens.text.base} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomClearance + tokens.space[6] }]}
          showsVerticalScrollIndicator={false}
        >
          {q.isLoading ? (
            <ActivityIndicator color={tokens.semantic.coin} style={styles.loading} />
          ) : q.isError || !s ? (
            <View style={styles.errorBox}>
              <Muted>{t('weekSummary.loadError')}</Muted>
              <GoldButton label={t('weekSummary.retry')} onPress={() => q.refetch()} />
            </View>
          ) : (
            <>
              {s.week.complete && <VideoSlot />}
              <KpiRow s={s} />
              <WeekCard title={t('weekSummary.daysTitle')}>
                <DaysStrip s={s} />
              </WeekCard>
              <WeekCard title={t('weekSummary.areasTitle')}>
                <AreaRows s={s} />
              </WeekCard>
              <WeekCard title={t('weekSummary.moodTitle')}>
                <MoodBlock s={s} />
              </WeekCard>
              <WeekCard title={t('weekSummary.coinsTitle')}>
                <CoinsBlock s={s} />
              </WeekCard>
              <WeekCard title={t('weekSummary.rewardsTitle')}>
                <RewardRows s={s} />
              </WeekCard>
              {s.life && s.life.scenes.length > 0 && (
                <WeekCard title={t('weekSummary.lifeTitle')}>
                  <LifeBlock life={s.life} />
                </WeekCard>
              )}
              <AiCard s={s} start={start} />
            </>
          )}
        </ScrollView>
      </ScreenBackground>

      <InfoSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('weekSummary.help.title')}
      >
        <View style={styles.guide}>
          {(
            [
              ['week', 'calendar-outline'],
              ['compare', 'swap-vertical-outline'],
              ['days', 'checkmark-circle-outline'],
              ['rewards', 'hourglass-outline'],
              ['ai', 'sparkles-outline'],
            ] as const
          ).map(([key, icon]) => (
            <GuideStep
              key={key}
              icon={icon}
              title={t(`weekSummary.help.items.${key}.title`)}
              body={t(`weekSummary.help.items.${key}.body`)}
            />
          ))}
        </View>
      </InfoSheet>
    </SafeAreaView>
  );
}

// ─── The AI card (Premium) ───────────────────────────────────────────────────

const RETRYABLE: WeekInsightFailure[] = ['ai_failed', 'network', 'server', 'rate_minute'];

function AiCard({ s, start }: { s: WeekSummary; start: string }) {
  const router = useRouter();
  const { t, locale } = useT();
  const isPremium = useIsPremium();
  const access = useAiAccess();
  const insight = useWeekInsight(start, isPremium);
  const gen = useGenerateWeekInsight();
  const [failures, setFailures] = useState<Record<string, WeekInsightFailure>>({});
  const autoTried = useRef(new Set<string>());

  const run = () =>
    gen.mutate(
      { start, locale },
      {
        onSuccess: (r) =>
          setFailures((f) => {
            const next = { ...f };
            if (r.ok) delete next[start];
            else next[start] = r.reason;
            return next;
          }),
      },
    );

  // Monday's summary is about the week that just closed: its observations
  // are written the first time the screen opens on it. Older weeks wait for
  // the button, so browsing back never mints one call per week.
  const shouldAuto =
    isPremium &&
    s.week.complete &&
    access.data?.enabled === true &&
    access.data.consent !== false &&
    // Never spend an AI credit without the tap: the automatic run only
    // happens while the week is free (credit_cost.week = 0, the default).
    (creditCost(access.data, 'week') ?? 0) === 0 &&
    insight.isSuccess &&
    insight.data === null &&
    start === lastClosedWeek() &&
    !gen.isPending &&
    !autoTried.current.has(start);
  useEffect(() => {
    if (!shouldAuto) return;
    autoTried.current.add(start);
    run();
    // run is recreated every render; shouldAuto is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAuto, start]);

  if (!isPremium) {
    return (
      <View style={[styles.aiCard, styles.aiLocked]}>
        <View style={styles.aiHead}>
          <Ionicons name="lock-closed" size={14} color={tokens.semantic.coin} />
          <Text style={styles.aiTitle}>{t('weekSummary.aiTitle')}</Text>
        </View>
        <Text style={styles.aiLockedTitle}>{t('weekSummary.aiLockedTitle')}</Text>
        <Muted>{t('weekSummary.aiLockedBody')}</Muted>
        <GoldButton label={t('weekSummary.aiLockedCta')} onPress={() => router.push('/premium?source=week')} />
      </View>
    );
  }

  const failure = failures[start];
  const generating = gen.isPending && gen.variables?.start === start;

  let body: React.ReactNode;
  if (insight.data) {
    body = <InsightBody insight={insight.data} />;
  } else if (!s.week.complete) {
    body = <Muted>{t('weekSummary.aiWeekOpen')}</Muted>;
  } else if (insight.isLoading || access.isLoading) {
    body = <ActivityIndicator color={tokens.semantic.coin} />;
  } else if (access.data?.enabled !== true) {
    body = <Muted>{t('weekSummary.aiSoon')}</Muted>;
  } else if (generating) {
    body = (
      <View style={styles.generating}>
        <ActivityIndicator color={tokens.semantic.coin} />
        <Muted>{t('weekSummary.aiGenerating')}</Muted>
      </View>
    );
  } else if (access.data.consent === false || failure === 'no_consent') {
    // The consent lives on the "Conte seu dia" screen (AiConsent); its text
    // covers this card too (consent_version 2).
    body = (
      <>
        <Muted>{t('weekSummary.aiNoConsent')}</Muted>
        <GoldButton label={t('weekSummary.aiNoConsentCta')} onPress={() => router.push('/day-voice')} />
      </>
    );
  } else if (failure && !RETRYABLE.includes(failure)) {
    const key =
      failure === 'empty_week'
        ? 'aiEmptyWeek'
        : failure === 'too_old'
          ? 'aiTooOld'
          : failure === 'week_open'
            ? 'aiWeekOpen'
            : failure === 'rate_month'
              ? 'aiNoCredits'
              : failure.startsWith('rate') || failure === 'budget'
              ? 'aiRate'
              : failure === 'premium_required'
                ? 'aiLockedBody'
                : 'aiSoon';
    body = <Muted>{t(`weekSummary.${key}`)}</Muted>;
  } else {
    // The week costs 0 AI credits today (app_config `credit_cost.week`); if
    // it ever costs more, the button says so before the tap.
    const cost = creditCost(access.data, 'week');
    const credits = monthLeft(access.data);
    body = (
      <>
        {failure && <Muted>{t('weekSummary.aiFailed')}</Muted>}
        <GoldButton label={failure ? t('weekSummary.retry') : t('weekSummary.aiGenerate')} onPress={run} />
        {cost != null && cost > 0 && credits ? (
          <Muted>{t('weekSummary.aiCost', { cost, left: credits.left })}</Muted>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiHead}>
        <Ionicons name="sparkles" size={14} color={tokens.semantic.coin} />
        <Text style={styles.aiTitle}>{t('weekSummary.aiTitle')}</Text>
      </View>
      {body}
    </View>
  );
}

function InsightBody({ insight }: { insight: WeekInsight }) {
  const { t } = useT();
  const meta = useMetaLookup();
  const dim = insight.suggestion ? meta.dim(insight.suggestion.dimension_id) : null;
  return (
    <View style={styles.insight}>
      {insight.observations.map((o, i) => (
        <View key={i} style={styles.obsRow}>
          <Text style={styles.obsNum}>{i + 1}</Text>
          <Text style={styles.obsText}>{o}</Text>
        </View>
      ))}
      {insight.suggestion && dim && (
        <View style={[styles.suggestion, { borderColor: dim.color }]}>
          <Text style={styles.suggestionEyebrow}>{t('weekSummary.aiSuggestion')}</Text>
          <Text style={styles.suggestionTitle}>{insight.suggestion.title}</Text>
          <Text style={styles.obsText}>{insight.suggestion.why}</Text>
          <View style={[styles.dimChip, { backgroundColor: dim.bg }]}>
            <Text style={[styles.dimChipText, { color: dim.color }]}>{dim.label}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function GoldButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.goldBtn, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <Text style={styles.goldBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[1],
    gap: tokens.space[3],
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  headerTitle: { ...tokens.type.h2, color: tokens.text.hi },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[3],
    paddingBottom: tokens.space[2],
  },
  selectorText: {
    minWidth: 160,
    textAlign: 'center',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  arrowOff: { opacity: 0.3 },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    gap: tokens.space[3],
  },
  loading: { marginTop: tokens.space[8] },
  errorBox: { gap: tokens.space[3], alignItems: 'flex-start', paddingTop: tokens.space[4] },
  guide: { gap: tokens.space[4] },
  aiCard: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  aiLocked: { backgroundColor: 'rgba(255, 200, 61, 0.06)' },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: tokens.semantic.coin,
  },
  aiLockedTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16, lineHeight: 21, color: tokens.text.hi },
  generating: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  insight: { gap: tokens.space[3] },
  obsRow: { flexDirection: 'row', gap: tokens.space[3] },
  obsNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinInk,
    backgroundColor: tokens.semantic.coin,
  },
  obsText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
  },
  suggestion: {
    gap: 6,
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderLeftWidth: 3,
    backgroundColor: tokens.bg.surface2,
  },
  suggestionEyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  suggestionTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, lineHeight: 20, color: tokens.text.hi },
  dimChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
  },
  dimChipText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 11.5 },
  goldBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  goldBtnText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 13, color: tokens.semantic.coinInk },
});
