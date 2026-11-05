import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/ScreenBackground';
import { ONB_BTN_H, OnbPrimaryButton } from '@/components/tour/OnboardingKit';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { useDoorPending, useUnlockStore } from '@/lib/unlock';
import { tokens } from '@/theme';

import { LearningDoorVisual } from './LearningDoorVisual';
import { MeDoorVisual } from './MeDoorVisual';
import { RewardsDoorVisual } from './RewardsDoorVisual';

export type DoorFeature = 'rewards' | 'learning' | 'me';

/** The button appears once the first loop has played — 4 s, decided 19/10. */
const DOOR_MIN_MS = 4000;

/**
 * The door of a feature's first opening (doc "Onboarding simples", Fase 2):
 * a looping in-code animation of the feature in use, one line, one button.
 * It is the explanation — there is no tour behind it. The button shows up
 * after the first loop; from then on, one tap opens. Renders nothing once
 * the door has been seen on this device (or for grandfathered accounts).
 *
 * Mounted next to the real screen, as an RN Modal, so the content is
 * already there the moment the door closes.
 */
export function UnlockDoor({ feature }: { feature: DoorFeature }) {
  const { t } = useT();
  const pending = useDoorPending(feature);
  const markDoorSeen = useUnlockStore((s) => s.markDoorSeen);
  const { width } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  const openedAt = useRef(0);
  // The wait is deliberate (one loop), so it must not read as lag: a thin
  // line fills over DOOR_MIN_MS under the text, then the button fades in.
  const wait = useSharedValue(0);
  const waitStyle = useAnimatedStyle(() => ({ width: `${wait.value * 100}%` }));

  useEffect(() => {
    if (!pending) return;
    openedAt.current = Date.now();
    setReady(false);
    wait.value = 0;
    wait.value = withTiming(1, { duration: DOOR_MIN_MS, easing: Easing.linear });
    const id = setTimeout(() => setReady(true), DOOR_MIN_MS);
    return () => clearTimeout(id);
  }, [pending, wait]);

  if (!pending) return null;

  const enter = () => {
    track('door_seen', { tab: feature, ms: Date.now() - openedAt.current });
    void markDoorSeen(feature);
  };

  const visualW = Math.min(width - tokens.space[5] * 2, 360);

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenBackground withGoldHalo>
          <View style={styles.center}>
            <View style={styles.visual}>
              {feature === 'rewards' ? (
                <RewardsDoorVisual width={visualW} />
              ) : feature === 'learning' ? (
                <LearningDoorVisual width={Math.min(visualW, 340)} />
              ) : (
                <MeDoorVisual width={Math.min(visualW, 300)} />
              )}
            </View>
            <Text style={styles.title}>{t(`unlock.door.${feature}.title`)}</Text>
            <Text style={styles.line}>{t(`unlock.door.${feature}.line`)}</Text>
            {!ready ? (
              <View style={styles.waitWrap}>
                <View style={styles.waitTrack}>
                  <Animated.View style={[styles.waitFill, waitStyle]} />
                </View>
                <Text style={styles.waitText}>{t('unlock.door.wait')}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.footer}>
            {ready ? (
              <Animated.View entering={FadeIn.duration(260)}>
                <OnbPrimaryButton
                  label={t('unlock.door.enter')}
                  icon="arrow-forward"
                  onPress={enter}
                />
              </Animated.View>
            ) : (
              <View style={{ height: ONB_BTN_H }} />
            )}
          </View>
        </ScreenBackground>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[5],
    gap: tokens.space[3],
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.space[4],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  line: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15.5,
    lineHeight: 23,
    color: tokens.text.base,
    textAlign: 'center',
    maxWidth: 340,
  },
  waitWrap: { alignItems: 'center', gap: 6, marginTop: tokens.space[2] },
  waitTrack: {
    width: 160,
    height: 3,
    borderRadius: 2,
    backgroundColor: tokens.bg.surface3,
    overflow: 'hidden',
  },
  waitFill: { height: '100%', backgroundColor: tokens.semantic.coin },
  waitText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.text.mid },
  footer: {
    paddingHorizontal: tokens.space[5],
    paddingBottom: tokens.space[4],
  },
});
