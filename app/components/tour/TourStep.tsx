import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  useBottomNavClearance,
  useBottomSafeClearance,
} from '@/components/BottomNavBar';
import { SpotlightBackdrop } from '@/components/tour/SpotlightBackdrop';
import { useT } from '@/lib/i18n';
import { useActiveTourStepStore } from '@/lib/tour/store';
import { tokens } from '@/theme';

/**
 * In-app tour spotlight tooltip — interactive version.
 *
 * Renders as a positioned overlay (NOT a Modal) so the user can still
 * tap the UI underneath. When a step declares `target`, a dim backdrop
 * with a transparent cut-out spotlights the matching `<TourTarget>`
 * (which also glows a pulsing ring) — both purely cosmetic
 * (`pointerEvents: 'none'`); only the tooltip card catches touches.
 * When a step declares `awaitEvent`, the tour advances on a real
 * gesture (tap a task, expand the drawer, etc) and the card surfaces a
 * hint of what action will continue; `awaitCtaLabel` optionally adds a
 * "take me there" button that advances (and auto-navigates) for users
 * who'd rather be driven.
 */

export interface TourStepData {
  title: string;
  body: string;
  /** Which half of the screen the card pins to. Defaults to bottom. */
  position?: 'top' | 'bottom';
  /** Primary CTA label. Defaults to "Próximo". */
  primaryLabel?: string;
  /**
   * When set, advance when the matching event fires on the
   * `useTourEventBus`. The card surfaces a hint ("Faça isso pra
   * continuar") and we still expose an escape so the user is never
   * trapped: either `awaitCtaLabel` (a visible assisted-navigation
   * button) or a small "Pular este passo" link.
   */
  awaitEvent?: string;
  /**
   * Milliseconds after mount before the step auto-advances. Used for
   * timed steps (e.g. the XP animation moment in M1 step 5). Mutually
   * exclusive with `awaitEvent` — if both set, the event wins.
   */
  autoAdvanceMs?: number;
  /**
   * `<TourTarget>` id this step points at. Dims the screen with a
   * cut-out around the target and pulses a gold ring on it.
   */
  target?: string;
  /**
   * Force a uniform dim even without a target (default: dim only when
   * `target` is set, so content-showcase steps keep the screen bright).
   */
  dim?: boolean;
  /**
   * On `awaitEvent` steps: label for an assisted-navigation button
   * ("Me leva lá") that advances the step — TourModule's advance path
   * then auto-navigates to the next step's screen. Replaces the
   * low-visibility "Pular este passo" link on navigation steps.
   */
  awaitCtaLabel?: string;
}

interface Props extends TourStepData {
  /** 1-indexed step number for the N/M progress label. */
  stepIndex: number;
  totalSteps: number;
  /**
   * When true, use the smaller safe-area clearance instead of the
   * floating-nav clearance — for screens without a BottomNavBar.
   */
  flatNav?: boolean;
  onNext: () => void;
  /** Called by both the X button and the "Pular este módulo" link. */
  onSkip: () => void;
  /**
   * Called when the user uses the inline "Pular este passo" escape
   * inside an awaitEvent step. Same effect as onNext (advance) but
   * lets us track that the user didn't actually do the gesture if we
   * want to analyse it later. Defaults to onNext when omitted.
   */
  onSkipStep?: () => void;
}

export function TourStep({
  title,
  body,
  position = 'bottom',
  primaryLabel,
  awaitEvent,
  target,
  dim,
  awaitCtaLabel,
  stepIndex,
  totalSteps,
  flatNav = false,
  onNext,
  onSkip,
  onSkipStep,
}: Props) {
  const { t } = useT();
  // Tooltips pinned to the bottom must clear whatever sits at the
  // bottom of THIS screen: the floating BottomNavBar on tab screens,
  // or just the safe-area inset on Stack-pushed screens (task-form,
  // /tasks) that don't render the bar. Both hooks run unconditionally
  // (rules-of-hooks); we pick the value with `flatNav`.
  const navClearance = useBottomNavClearance();
  const safeClearance = useBottomSafeClearance();
  const bottomClearance = flatNav ? safeClearance : navClearance;

  // Report the real card height so screens can size scroll bumps off it
  // instead of magic constants. Cleared when the card leaves.
  const setCardHeight = useActiveTourStepStore((s) => s.setCardHeight);
  useEffect(() => () => setCardHeight(null), [setCardHeight]);

  const handleNext = () => {
    Haptics.selectionAsync().catch(() => {});
    onNext();
  };
  const handleSkip = () => {
    Haptics.selectionAsync().catch(() => {});
    onSkip();
  };
  const handleSkipStep = () => {
    Haptics.selectionAsync().catch(() => {});
    (onSkipStep ?? onNext)();
  };

  return (
    <View
      style={[
        styles.overlay,
        position === 'top' ? styles.alignTop : styles.alignBottom,
      ]}
      pointerEvents="box-none"
    >
      {/* Dim + spotlight cut-out. Only renders when the step declares a
         `target` (or forces `dim`), keeping content-showcase steps
         bright. Visual-only — every touch passes through. */}
      <SpotlightBackdrop targetId={target} enabled={!!target || dim === true} />

      {/* Tooltip card — the only interactive layer. */}
      <View
        style={[
          styles.cardWrap,
          position === 'bottom'
            ? { paddingBottom: bottomClearance + tokens.space[2] }
            : { paddingTop: tokens.space[8] },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={styles.card}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.progress}>
              {stepIndex} / {totalSteps}
            </Text>
            <Pressable
              onPress={handleSkip}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('tour.common.skipModule')}
            >
              <Ionicons name="close" size={18} color={tokens.text.mid} />
            </Pressable>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          {awaitEvent ? (
            <View style={styles.awaitGroup}>
              <View style={styles.awaitRow}>
                <Ionicons
                  name="hand-left"
                  size={16}
                  color={tokens.semantic.coinLight}
                />
                <Text style={styles.awaitText}>{t('tour.common.tryIt')}</Text>
              </View>
              {awaitCtaLabel ? (
                <Pressable
                  onPress={handleSkipStep}
                  style={({ pressed }) => [
                    styles.assistBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={awaitCtaLabel}
                >
                  <Text style={styles.assistText}>{awaitCtaLabel}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={tokens.semantic.coinLight}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSkipStep}
                  hitSlop={6}
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                  <Text style={styles.skipLink}>
                    {t('tour.common.skipStep')}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel ?? t('tour.common.next')}
            >
              <Text style={styles.primaryText}>
                {primaryLabel ?? t('tour.common.next')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#3D2A00" />
            </Pressable>
          )}

          <Pressable
            onPress={handleSkip}
            hitSlop={6}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={styles.skipModule}>
              {t('tour.common.skipModule')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // The container itself is "see-through" for gestures — we lift only
    // the card to auto-pointer-events below.
  },
  alignTop: {
    justifyContent: 'flex-start',
  },
  alignBottom: {
    justifyContent: 'flex-end',
  },
  cardWrap: {
    paddingHorizontal: tokens.space[4],
    // paddingTop/paddingBottom are set inline based on `position` +
    // the floating BottomNavBar clearance.
  },
  card: {
    backgroundColor: 'rgba(26, 31, 68, 0.98)',
    borderRadius: tokens.radius.lg,
    padding: tokens.space[5],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 61, 0.55)',
    gap: tokens.space[3],
    // The dim backdrop already separates tour from screen; the shadow
    // keeps the card floating above the spotlight hole area too.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progress: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.6,
    color: tokens.semantic.coinLight,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: tokens.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tester feedback (1.1.0): the old 17/13px card read as ignorable
  // noise. Bigger type + brighter body so the tour actually registers.
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 21,
    lineHeight: 26,
    color: tokens.semantic.coinLight,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.base,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[5],
    paddingVertical: tokens.space[3],
    borderRadius: 999,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 138, 0.55)',
    marginTop: tokens.space[1],
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: '#3D2A00',
    letterSpacing: 0.3,
  },
  awaitGroup: {
    marginTop: tokens.space[1],
    gap: tokens.space[2],
  },
  awaitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: tokens.space[1],
  },
  awaitText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.semantic.coinLight,
    letterSpacing: 0.3,
  },
  /** Assisted-navigation button on awaitEvent steps ("Me leva lá") —
   *  outline gold, deliberately quieter than the solid primary so the
   *  real gesture stays the star. */
  assistBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2] + 2,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 61, 0.55)',
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
  },
  assistText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.semantic.coinLight,
    letterSpacing: 0.3,
  },
  skipLink: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.dim,
    textDecorationLine: 'underline',
  },
  skipModule: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.dim,
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
