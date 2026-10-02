import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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

import { AppIcon } from '@/components/AppIcon';
import { CoinIcon } from '@/components/CoinIcon';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  ONB_BTN_GAP,
  ONB_BTN_H,
  ONB_SECONDARY_H,
  ONB_TEXT_BTN_H,
  OnbPrimaryButton,
  OnbSecondaryButton,
  OnbTextButton,
  FitBox,
  ONB_HEADER_H,
  ONB_PAGE_TOP,
  OnbBadge,
  OnbHeader,
  OnbTopBar,
} from '@/components/tour/OnboardingKit';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { isTerminal } from '@/lib/tour/constants';
import { useTourStore } from '@/lib/tour/store';
import { exitTourToHome, setAfterOnboarding } from '@/lib/tour/navigation';
import { tokens } from '@/theme';
import { DIMENSION_ORDER } from '@/theme/dimensions';

import {
  DedicationExample,
  RewardSamples,
} from './EconomyVisuals';
import { IdeaFlipVisual } from './IdeaFlipVisual';
import {
  IntroPage,
  PageBody,
  PillarCard,
  pillarPalette,
} from './IntroPageLayout';
import { PillarsHero } from './PillarsHero';
import { PracticeVisual } from './PracticeVisual';
import { selfKnowledgeColors, SelfKnowledgeHex } from './SelfKnowledgeHex';

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
const BTN_H = ONB_BTN_H;
const SECONDARY_H = ONB_SECONDARY_H;
const BTN_GAP = ONB_BTN_GAP;
const SKIP_H = ONB_TEXT_BTN_H;
/**
 * The last page's primary button sits exactly where "Continuar" sat, so a
 * double tap on page 5 would start the tour unread. Presses that land this
 * soon after arriving on the last page are dropped.
 */
const ARRIVAL_GUARD_MS = 650;

type Choice = 'tour' | 'assessment' | 'skip';

export function IntroPager() {
  const router = useRouter();
  const { t } = useT();
  const meta = useMetaLookup();
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
        // "Começar PELA autoavaliação" é ordem, não substituição: o tour
        // guiado fica pendente e retoma na Home quando ela fechar a
        // autoavaliação. Só o "pular" descarta o tour de verdade.
        if (choice === 'skip') await skipGuidedTour();
        else await startGuidedTour();
        // "Start with the self-assessment": land on it once onboarding ends
        // (after the starter pack, or straight away on an intro-only replay).
        setAfterOnboarding(choice === 'assessment' ? '/self-assessment' : null);
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
  // Last page: tour (primary) · self-assessment (secondary) · skip (text).
  const footerTall = footerShort + (BTN_GAP + SECONDARY_H) + (BTN_GAP + SKIP_H);
  const padFor = (page: number) => (page === LAST ? footerTall : footerShort) + tokens.space[2];
  const contentW = pageW - tokens.space[6] * 2;
  // One budget for every page's drawing: the page height minus the footer,
  // the top padding, the header band, the two cards and the gaps between.
  const CARDS_H = 2 * 86 + tokens.space[3];
  const GAPS_H = 2 * tokens.space[3];
  const bodyMax = (page: number, withCards = true) =>
    Math.max(
      0,
      pageH - padFor(page) - ONB_PAGE_TOP - ONB_HEADER_H - GAPS_H - (withCards ? CARDS_H : 0),
    );
  const ART_RATIO = 300 / 280; // PillarsHero is 300×280
  const heroSize = Math.round(
    pageH > 0
      ? Math.min(pageW - tokens.space[3] * 2, 400, Math.max(180, bodyMax(0, false) * ART_RATIO))
      : Math.min(pageW - tokens.space[3] * 2, 300),
  );
  const choiceHeroSize = Math.round(
    pageH > 0 ? Math.min(contentW, 300, Math.max(150, bodyMax(LAST, false) * ART_RATIO)) : 220,
  );
  // The redo line is ONE string with the Ajustes path interpolated; split it
  // around the path so the path alone can be styled.
  const redoPath = `${t('tabs.settings')} › ${t('profile.actions.replayOnboarding')}`;
  const redoLine = t('tour.intro.choice.safe', { path: '\u0000' }).split('\u0000');
  // Page 1's first card carries the six area chips — ~24 taller than the rest.
  const hexSize = Math.round(pageH > 0 ? Math.min(contentW, 210, Math.max(120, bodyMax(1) - 24)) : 180);
  // The idea card is 1.18 as tall as it is wide.
  const cardW = Math.round(
    pageH > 0 ? Math.min(contentW, 250, Math.max(150, bodyMax(3) / 1.18)) : 220,
  );
  const onLast = index === LAST;
  const palette = pillarPalette();
  const hexColors = selfKnowledgeColors();

  return (
    <ScreenBackground withGoldHalo>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ── Top bar: brand · Pular introdução ──────────────────────── */}
        <OnbTopBar
          right={
            !onLast ? (
              <Pressable
                onPress={skipIntro}
                hitSlop={8}
                style={({ pressed }) => [styles.skipLink, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('tour.intro.skip')}
              >
                <Text style={styles.skipText}>{t('tour.intro.skip')}</Text>
              </Pressable>
            ) : undefined
          }
        />

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
            {/* Every page: OnbHeader at the same height, the drawing in the
               middle band (PageBody, sized by what is left), cards at the
               bottom. No page centres its content vertically any more. */}

            {/* 0 — Hero: the three pillars */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(0)}>
              <OnbHeader title={t('tour.intro.hero.title')} subtitle={t('tour.intro.hero.body')} />
              <PageBody>
                <View style={styles.heroArt}>
                  <PillarsHero size={heroSize} active={index === 0} idSuffix="hero" />
                </View>
              </PageBody>
            </IntroPage>

            {/* 1 — Autoconhecimento */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(1)}>
              <OnbHeader
                title={t('tour.intro.hero.pillarSelf')}
                subtitle={t('tour.intro.self.subtitle')}
                color={palette.self.ink}
              />
              <PageBody>
                <SelfKnowledgeHex size={hexSize} active={index === 1} />
              </PageBody>
              <PillarCard
                icon="speedometer-outline"
                color={palette.self.fill}
                outline={{ color: hexColors.self }}
                title={t('tour.intro.self.card1Title')}
              >
                {/* The six life areas, shown instead of named in prose. */}
                <View style={styles.areaChips}>
                  {DIMENSION_ORDER.map((id) => {
                    const dim = meta.dim(id);
                    return (
                      <View key={id} style={[styles.areaChip, { backgroundColor: dim.bg }]}>
                        <AppIcon name={dim.iconName} size={12} color={dim.color} />
                        <Text style={[styles.areaChipText, { color: dim.color }]}>{dim.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </PillarCard>
              <PillarCard
                icon="clipboard-outline"
                color={palette.self.fill}
                outline={{ color: hexColors.questionnaire, dashed: true }}
                title={t('tour.intro.self.card2Title')}
                body={t('tour.intro.self.card2Body')}
              />
            </IntroPage>

            {/* 2 — Prática */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(2)}>
              <OnbHeader
                title={t('tour.intro.hero.pillarPractice')}
                subtitle={t('tour.intro.practice.subtitle')}
                color={palette.practice.ink}
              />
              <PageBody>
                <FitBox maxHeight={bodyMax(2)}>
                  <PracticeVisual active={index === 2} />
                </FitBox>
              </PageBody>
              <PillarCard
                icon="checkmark-circle-outline"
                color={palette.practice.fill}
                title={t('tour.intro.practice.card1Title')}
                body={t('tour.intro.practice.card1Body')}
              />
              <PillarCard
                icon="happy-outline"
                color={palette.practice.fill}
                title={t('tour.intro.practice.card2Title')}
                body={t('tour.intro.practice.card2Body')}
              />
            </IntroPage>

            {/* 3 — Aprendizado */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(3)}>
              <OnbHeader
                title={t('tour.intro.hero.pillarLearning')}
                subtitle={t('tour.intro.learning.subtitle')}
                color={palette.learning.ink}
              />
              <PageBody>
                <IdeaFlipVisual width={cardW} active={index === 3} />
              </PageBody>
              <PillarCard
                icon="bulb-outline"
                color={palette.learning.fill}
                title={t('tour.intro.learning.card1Title')}
                body={t('tour.intro.learning.card1Body')}
              />
              <PillarCard
                icon="albums-outline"
                color={palette.learning.fill}
                title={t('tour.intro.learning.card2Title')}
                body={t('tour.intro.learning.card2Body')}
              />
            </IntroPage>

            {/* 4 — Dedicação: the basics and the purpose. How stars turn into
               numbers is left to the practice form's (i) and the guided tour. */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(4)}>
              <OnbHeader
                title={t('tour.intro.dedication.eyebrow')}
                subtitle={t('tour.intro.dedication.title')}
                color={palette.practice.ink}
                badge={
                  <OnbBadge color={palette.practice.ink}>
                    <Ionicons name="flash" size={24} color={tokens.semantic.xp} />
                  </OnbBadge>
                }
              />
              <PageBody>
                <FitBox maxHeight={bodyMax(4)} width={contentW}>
                  <DedicationExample />
                </FitBox>
              </PageBody>
              <PillarCard
                icon="add-circle-outline"
                color={palette.practice.fill}
                title={t('tour.intro.dedication.card1Title')}
                body={t('tour.intro.dedication.card1Body')}
              />
              <PillarCard
                icon="trending-up-outline"
                color={palette.practice.fill}
                title={t('tour.intro.dedication.card2Title')}
                body={t('tour.intro.dedication.card2Body')}
              />
            </IntroPage>

            {/* 5 — Moedas: rewards you define */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(5)}>
              <OnbHeader
                title={t('tour.intro.coins.eyebrow')}
                subtitle={t('tour.intro.coins.title')}
                color={palette.learning.ink}
                badge={
                  <OnbBadge color={palette.learning.ink}>
                    <CoinIcon size={24} />
                  </OnbBadge>
                }
              />
              <PageBody>
                <FitBox maxHeight={bodyMax(5)} width={contentW}>
                  <RewardSamples />
                </FitBox>
              </PageBody>
              <PillarCard
                icon="wallet-outline"
                color={palette.learning.fill}
                title={t('tour.intro.coins.card1Title')}
                body={t('tour.intro.coins.card1Body')}
              />
              <PillarCard
                icon="gift-outline"
                color={palette.learning.fill}
                title={t('tour.intro.coins.card2Title')}
                body={t('tour.intro.coins.card2Body')}
              />
            </IntroPage>

            {/* 6 — How to start: the question, the redo line (Ajustes path in
               gold), the pillars triangle above the three choices. */}
            <IntroPage width={pageW} height={pageH} bottomPad={padFor(6)}>
              <OnbHeader
                title={t('tour.intro.choice.title')}
                subtitle={
                  <>
                    {redoLine[0]}
                    <Text style={styles.choicePath}>{redoPath}</Text>
                    {redoLine[1]}
                  </>
                }
              />
              <PageBody>
                <PillarsHero size={choiceHeroSize} active={index === LAST} idSuffix="choice" />
              </PageBody>
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
                <OnbPrimaryButton label={t('tour.intro.next')} icon="arrow-forward" onPress={next} />
              </Animated.View>
            ) : (
              <Animated.View
                key="choice"
                entering={reduceMotion ? undefined : FadeIn.duration(220)}
                style={styles.choiceButtons}
              >
                <OnbPrimaryButton
                  label={t('tour.intro.choice.primary')}
                  icon="compass-outline"
                  onPress={() => void finish('tour')}
                  busy={busy === 'tour'}
                  disabled={busy != null}
                />
                <OnbSecondaryButton
                  label={t('tour.intro.choice.assessment')}
                  onPress={() => void finish('assessment')}
                  busy={busy === 'assessment'}
                  disabled={busy != null}
                />
                <OnbTextButton
                  label={t('tour.intro.choice.skip')}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
    marginHorizontal: -(tokens.space[6] - tokens.space[3]),
    marginBottom: tokens.space[2],
  },
  // Same size as the pillar names (28) — the page's one headline.
  // A caption, visibly narrower than the button column below.
  choicePath: {
    fontFamily: 'Manrope_700Bold',
    color: tokens.semantic.coinLight,
  },
  areaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  areaChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
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
});
