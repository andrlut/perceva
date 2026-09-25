import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useT } from '@/lib/i18n';
import { isTerminal } from '@/lib/tour/constants';
import { useTourStore } from '@/lib/tour/store';
import { exitTourToHome } from '@/lib/tour/navigation';
import { tokens } from '@/theme';

import {
  CoinDial,
  DedicationExample,
  RewardSamples,
  StarTable,
} from './EconomyVisuals';
import { IdeaFlipVisual } from './IdeaFlipVisual';
import {
  IntroBody,
  IntroEyebrow,
  IntroPage,
  IntroPayoff,
  IntroTitle,
  pillarPalette,
} from './IntroPageLayout';
import { PillarsHero } from './PillarsHero';
import { PracticeVisual } from './PracticeVisual';
import { SelfKnowledgeHex } from './SelfKnowledgeHex';
import { SkipIsSafe, TourChecklist } from './TourChoice';

/**
 * The method intro — the first thing a new account sees after login.
 *
 * One route, one horizontal pager, seven pages:
 *   0 hero (the three pillars) · 1 Autoconhecimento · 2 Prática ·
 *   3 Aprendizado · 4 Dedicação (stars → XP) · 5 Moedas · 6 tour or skip.
 *
 * Navigation: swipe, the Continuar button, or the page dots as position.
 * Android hardware back goes to the previous page and is SWALLOWED on page
 * 0 — this route is re-opened by the AuthGate until answered, so backing
 * out would only bounce the user straight back here. "Pular introdução"
 * (pages 0–5) jumps to page 6; it never skips the decision itself.
 *
 * Only page 6 writes state, and it writes all of it in one go (guided
 * modules pending or skipped, then `intro` completed) before leaving, so
 * there is no half-answered state for a killed app to strand.
 *
 * Deliberately no greeting by name: `display_name` defaults to the email's
 * local part for every email signup, and the profile query can still be in
 * flight here (it used to flash "Bem-vindo, aí").
 */

const PAGE_COUNT = 7;
const LAST = PAGE_COUNT - 1;

// Footer geometry — fixed heights so each page can reserve exactly the
// room its own footer takes (page 6 has two buttons, the rest one).
const FADE = 28;
const DOTS_BLOCK = 8 + 14;
const BTN_H = 54;
const SECONDARY_H = 50;
const BTN_GAP = 10;
/**
 * The last page's primary button sits exactly where "Continuar" sat, so a
 * double tap on page 5 would start the tour unread. Presses that land this
 * soon after arriving on the last page are dropped.
 */
const ARRIVAL_GUARD_MS = 650;

type Choice = 'tour' | 'skip';

export function IntroPager() {
  const router = useRouter();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const window = useWindowDimensions();

  const startGuidedTour = useTourStore((s) => s.startGuidedTour);
  const skipGuidedTour = useTourStore((s) => s.skipGuidedTour);
  const setStatus = useTourStore((s) => s.setStatus);

  const [pageW, setPageW] = useState(window.width);
  const [pageH, setPageH] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  // The current page flips at the half-way point of a swipe, so the footer
  // and the back handler always agree with what is mostly on screen.
  useAnimatedReaction(
    () => (pageW > 0 ? Math.round(scrollX.value / pageW) : 0),
    (cur, prev) => {
      if (cur !== prev) {
        runOnJS(setIndex)(Math.min(Math.max(cur, 0), LAST));
      }
    },
    [pageW],
  );

  const goTo = useCallback(
    (target: number) => {
      const next = Math.min(Math.max(target, 0), LAST);
      // A neighbour glides; a long jump (Pular introdução) cuts, so the
      // five pages in between don't flash past and start their animations.
      const animated = !reduceMotion && Math.abs(next - indexRef.current) === 1;
      scrollRef.current?.scrollTo({ x: next * pageW, animated });
      setIndex(next);
    },
    [pageW, reduceMotion, scrollRef],
  );

  const onPagerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = Math.round(e.nativeEvent.layout.width);
      const h = Math.round(e.nativeEvent.layout.height);
      if (h > 0) setPageH(h);
      if (w <= 0 || w === pageW) return;
      setPageW(w);
      // Re-anchor the current page if the width ever changes under us.
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: indexRef.current * w, animated: false });
      });
    },
    [pageW, scrollRef],
  );

  // ── Final choice ────────────────────────────────────────────────────────
  const [busy, setBusy] = useState<Choice | null>(null);
  const busyRef = useRef(false);
  const arrivedAtRef = useRef(0);
  useEffect(() => {
    if (index === LAST) arrivedAtRef.current = Date.now();
  }, [index]);

  const finish = useCallback(
    async (choice: Choice) => {
      if (busyRef.current) return;
      if (Date.now() - arrivedAtRef.current < ARRIVAL_GUARD_MS) return;
      busyRef.current = true;
      setBusy(choice);
      Haptics.selectionAsync().catch(() => {});
      try {
        if (choice === 'tour') await startGuidedTour();
        else await skipGuidedTour();
        await setStatus('intro', 'completed');
        // Replaying only the intro from Ajustes reaches this page with the
        // starter pack already answered — then there is nothing to pick.
        const pack = useTourStore.getState().modules.pack?.status;
        if (isTerminal(pack)) exitTourToHome();
        else router.replace('/tour/pack');
      } finally {
        busyRef.current = false;
        setBusy(null);
      }
    },
    [router, setStatus, skipGuidedTour, startGuidedTour],
  );

  // ── Android hardware back ──────────────────────────────────────────────
  const onBack = useCallback(() => {
    if (busyRef.current) return true;
    const i = indexRef.current;
    if (i > 0) goTo(i - 1);
    // Page 0: swallowed. The AuthGate would re-open this route anyway.
    return true;
  }, [goTo]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [onBack]),
  );

  const next = () => {
    Haptics.selectionAsync().catch(() => {});
    goTo(indexRef.current + 1);
  };
  const skipIntro = () => {
    Haptics.selectionAsync().catch(() => {});
    goTo(LAST);
  };

  // ── Layout ─────────────────────────────────────────────────────────────
  const bottomInset = Math.max(insets.bottom, tokens.space[3]) + tokens.space[2];
  const footerShort = FADE + DOTS_BLOCK + BTN_H + bottomInset;
  const footerTall = footerShort + BTN_GAP + SECONDARY_H;
  const padFor = (page: number) => (page === LAST ? footerTall : footerShort) + tokens.space[2];
  const contentW = pageW - tokens.space[6] * 2;
  // Visual sizes follow the measured page height, so a 640dp phone still
  // gets the hero and its text on one screen. ~250px is the hero's text
  // block (eyebrow, two-line title, body) plus the loop caption; the art
  // is 300×252, hence the ratio. Before the first layout, a safe default.
  const heroSize = Math.round(
    pageH > 0
      ? Math.min(contentW, 330, Math.max(190, (pageH - padFor(0) - 262) * (300 / 252)))
      : Math.min(contentW, 280),
  );
  const hexSize = Math.round(Math.min(contentW * 0.72, 210, Math.max(150, pageH * 0.27)));
  const cardW = Math.round(Math.min(contentW, 250, Math.max(200, pageH * 0.34)));
  const onLast = index === LAST;
  const palette = pillarPalette();

  return (
    <ScreenBackground withGoldHalo>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ── Top bar: brand · Pular introdução ──────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <PercevaGlyph size={24} palette="primary" idSuffix="intro-topbar" />
            <Text style={styles.brandText}>Perceva</Text>
          </View>
          {!onLast && (
            <Pressable
              onPress={skipIntro}
              hitSlop={8}
              style={({ pressed }) => [styles.skipLink, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('tour.intro.skip')}
            >
              <Text style={styles.skipText}>{t('tour.intro.skip')}</Text>
            </Pressable>
          )}
        </View>

        {/* ── Pager ──────────────────────────────────────────────────── */}
        <View style={styles.pagerArea} onLayout={onPagerLayout}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            decelerationRate="fast"
            disableIntervalMomentum
            bounces={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
          >
            {/* 0 — Hero: the three pillars */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(0)}>
              <View style={styles.heroArt}>
                <PillarsHero size={heroSize} active={index === 0} />
                <Text style={styles.loop}>{t('tour.intro.hero.loop')}</Text>
              </View>
              <IntroEyebrow>{t('tour.intro.hero.eyebrow')}</IntroEyebrow>
              <IntroTitle hero>{t('tour.intro.hero.title')}</IntroTitle>
              <IntroBody>{t('tour.intro.hero.body')}</IntroBody>
            </IntroPage>

            {/* 1 — Autoconhecimento: the Avaliação is where you start */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(1)}>
              <SelfKnowledgeHex size={hexSize} active={index === 1} />
              <IntroEyebrow color={palette.self.ink}>{t('tour.intro.self.eyebrow')}</IntroEyebrow>
              <IntroTitle>{t('tour.intro.self.title')}</IntroTitle>
              <IntroBody>{t('tour.intro.self.body')}</IntroBody>
              <IntroPayoff color={palette.self.fill} icon="git-compare-outline">
                {t('tour.intro.self.payoff')}
              </IntroPayoff>
            </IntroPage>

            {/* 2 — Prática */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(2)}>
              <PracticeVisual active={index === 2} />
              <IntroEyebrow color={palette.practice.ink}>
                {t('tour.intro.practice.eyebrow')}
              </IntroEyebrow>
              <IntroTitle>{t('tour.intro.practice.title')}</IntroTitle>
              <IntroBody>{t('tour.intro.practice.body')}</IntroBody>
              <IntroPayoff color={palette.practice.fill} icon="play-skip-forward-outline">
                {t('tour.intro.practice.payoff')}
              </IntroPayoff>
            </IntroPage>

            {/* 3 — Aprendizado */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(3)}>
              <IdeaFlipVisual width={cardW} active={index === 3} />
              <IntroEyebrow color={palette.learning.ink}>
                {t('tour.intro.learning.eyebrow')}
              </IntroEyebrow>
              <IntroTitle>{t('tour.intro.learning.title')}</IntroTitle>
              <IntroBody>{t('tour.intro.learning.body')}</IntroBody>
              <IntroPayoff color={palette.learning.fill} icon="flag-outline">
                {t('tour.intro.learning.payoff')}
              </IntroPayoff>
            </IntroPage>

            {/* 4 — Dedicação: what the stars are */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(4)}>
              <IntroEyebrow color={palette.practice.ink}>
                {t('tour.intro.dedication.eyebrow')}
              </IntroEyebrow>
              <IntroTitle>{t('tour.intro.dedication.title')}</IntroTitle>
              <IntroBody>{t('tour.intro.dedication.body')}</IntroBody>
              <StarTable />
              <DedicationExample />
              <IntroBody>{t('tour.intro.dedication.after')}</IntroBody>
              <IntroPayoff color={palette.self.fill} icon="star-outline">
                {t('tour.intro.dedication.bridge')}
              </IntroPayoff>
            </IntroPage>

            {/* 5 — Moedas: rewards you define */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(5)}>
              <IntroEyebrow color={palette.learning.ink}>
                {t('tour.intro.coins.eyebrow')}
              </IntroEyebrow>
              <IntroTitle>{t('tour.intro.coins.title')}</IntroTitle>
              <IntroBody>
                {t('tour.intro.coins.body', {
                  none: t('tasks.coinMultiplier.none'),
                  half: t('tasks.coinMultiplier.half'),
                  same: t('tasks.coinMultiplier.same'),
                  double: t('tasks.coinMultiplier.double'),
                })}
              </IntroBody>
              <CoinDial />
              <IntroBody>{t('tour.intro.coins.rewardsBody')}</IntroBody>
              <RewardSamples />
              <View style={styles.neutralNote}>
                <Ionicons name="time-outline" size={18} color={tokens.text.mid} />
                <Text style={styles.neutralNoteText}>{t('tour.intro.coins.penalty')}</Text>
              </View>
            </IntroPage>

            {/* 6 — Tour or skip */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(6)}>
              <IntroEyebrow>{t('tour.intro.choice.eyebrow')}</IntroEyebrow>
              <IntroTitle>{t('tour.intro.choice.title')}</IntroTitle>
              <IntroBody>{t('tour.intro.choice.body')}</IntroBody>
              <TourChecklist />
              <SkipIsSafe />
            </IntroPage>
          </Animated.ScrollView>

          {/* ── Footer (overlays the pager; pages reserve its height) ── */}
          <View
            style={[styles.footer, { paddingBottom: bottomInset }]}
            pointerEvents="box-none"
          >
            <LinearGradient
              colors={[`${tokens.bg.deep}00`, tokens.bg.deep]}
              locations={[0, 0.45]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              style={styles.dots}
              accessible
              accessibilityRole="text"
              accessibilityLabel={t('tour.intro.pageOf', { n: index + 1, total: PAGE_COUNT })}
            >
              {Array.from({ length: PAGE_COUNT }, (_, i) => (
                <Dot key={i} i={i} scrollX={scrollX} pageW={pageW} />
              ))}
            </View>

            {!onLast ? (
              <Animated.View key="next" entering={reduceMotion ? undefined : FadeIn.duration(180)}>
                <PrimaryButton label={t('tour.intro.next')} icon="arrow-forward" onPress={next} />
              </Animated.View>
            ) : (
              <Animated.View
                key="choice"
                entering={reduceMotion ? undefined : FadeIn.duration(220)}
                style={styles.choiceButtons}
              >
                <PrimaryButton
                  label={t('tour.intro.choice.primary')}
                  icon="compass-outline"
                  onPress={() => void finish('tour')}
                  busy={busy === 'tour'}
                  disabled={busy != null}
                />
                <SecondaryButton
                  label={t('tour.intro.choice.secondary')}
                  onPress={() => void finish('skip')}
                  busy={busy === 'skip'}
                  disabled={busy != null}
                />
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

function Dot({ i, scrollX, pageW }: { i: number; scrollX: SharedValue<number>; pageW: number }) {
  const style = useAnimatedStyle(() => {
    const p = pageW > 0 ? scrollX.value / pageW : 0;
    const on = interpolate(p, [i - 1, i, i + 1], [0, 1, 0], Extrapolation.CLAMP);
    return {
      width: 8 + 16 * on,
      opacity: 0.35 + 0.65 * on,
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function PrimaryButton({
  label,
  icon,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.primaryWrap,
        pressed && styles.primaryPressed,
        disabled && !busy && styles.dimmed,
      ]}
    >
      <LinearGradient
        colors={tokens.gradient.completeBtn}
        locations={tokens.gradient.completeBtnLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.primary}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.primaryText} numberOfLines={1}>
              {label}
            </Text>
            <Ionicons name={icon} size={19} color="#FFFFFF" />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.secondary,
        pressed && styles.pressed,
        disabled && !busy && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={tokens.text.hi} />
      ) : (
        <Text style={styles.secondaryText} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: tokens.space[5],
    paddingRight: tokens.space[3],
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  brandText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    lineHeight: 21,
    color: tokens.text.hi,
    letterSpacing: 0.2,
  },
  skipLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: tokens.space[2],
  },
  skipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  pressed: {
    opacity: 0.6,
  },
  pagerArea: {
    flex: 1,
  },
  heroArt: {
    alignItems: 'center',
    gap: tokens.space[2],
    marginBottom: tokens.space[2],
  },
  loop: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0.6,
    color: tokens.text.dim,
    textAlign: 'center',
  },
  neutralNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[1],
  },
  neutralNoteText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.mid,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: FADE,
    paddingHorizontal: tokens.space[5],
  },
  dots: {
    height: 8,
    marginBottom: 14,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.brand.violet2,
  },
  choiceButtons: {
    gap: BTN_GAP,
  },
  primaryWrap: {
    borderRadius: tokens.radius.md,
    ...tokens.shadow.violetGlowSoft,
  },
  primaryPressed: {
    transform: [{ scale: 0.98 }],
  },
  dimmed: {
    opacity: 0.55,
  },
  primary: {
    height: BTN_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: tokens.space[4],
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  secondary: {
    height: SECONDARY_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.glass,
    paddingHorizontal: tokens.space[4],
  },
  secondaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: tokens.text.hi,
  },
});
