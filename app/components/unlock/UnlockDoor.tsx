import { useCallback, useEffect, useRef, useState } from 'react';
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

import { DOOR_VIDEO_BAR_H, DoorVideo } from './DoorVideo';
import { LearningDoorVisual } from './LearningDoorVisual';
import { MeDoorVisual } from './MeDoorVisual';
import { RewardsDoorVisual } from './RewardsDoorVisual';

export type DoorFeature = 'practices' | 'rewards' | 'learning' | 'me';

/** The button appears once the first loop has played — 4 s for the in-code
 *  animation, decided 19/10. With the video, the first loop IS the video: the
 *  first opening is watched to the end (André, 07/11: "quero que vejam tudo").
 *  There is no time cap any more — the old 40 s net cut a ~60 s door in half. */
const DOOR_MIN_MS = 4000;
/** Safety net, and only for a STALLED video: no playback progress for this long
 *  (buffering forever, a frozen decoder) releases the button. A video that plays
 *  never trips it, however long it is. */
const DOOR_STALL_MS = 12000;

/**
 * The door of a feature's first opening (doc "Onboarding simples", Fase 2):
 * a looping video of the feature (Remotion molde, DoorVideo — muted, burned-in
 * captions) with the in-code animation as the fallback when it can't load,
 * one line, one button.
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
  // Left over from the old Ajustes › "Rever as portas" (replaced 08/11 by the
  // videos in Ajustes › Tutorial): whoever pressed it may skip — the
  // watch-it-all rule is for the first time only.
  const replay = useUnlockStore((s) => s.replayDoors);
  const { width, height: winH } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  // Video first; an error or no frame in time drops to the in-code animation
  // (and its 4 s loop) for the rest of this opening.
  const [useVideo, setUseVideo] = useState(true);
  const openedAt = useRef(0);
  const lastProgressAt = useRef(0);
  // The wait is deliberate (one loop), so it must not read as lag: a thin
  // line fills over DOOR_MIN_MS under the text, then the button fades in.
  const wait = useSharedValue(0);
  const waitStyle = useAnimatedStyle(() => ({ width: `${wait.value * 100}%` }));

  useEffect(() => {
    if (!pending) return;
    openedAt.current = Date.now();
    setReady(false);
    wait.value = 0;
    if (useVideo && replay) {
      const id = setTimeout(() => setReady(true), DOOR_MIN_MS);
      return () => clearTimeout(id);
    }
    if (useVideo) {
      // The video drives the line (onProgress) and the button (onFirstLoop); this
      // only watches for a stall (no progress for DOOR_STALL_MS).
      lastProgressAt.current = Date.now();
      const id = setInterval(() => {
        if (Date.now() - lastProgressAt.current > DOOR_STALL_MS) setReady(true);
      }, 1000);
      return () => clearInterval(id);
    }
    wait.value = withTiming(1, { duration: DOOR_MIN_MS, easing: Easing.linear });
    const id = setTimeout(() => setReady(true), DOOR_MIN_MS);
    return () => clearTimeout(id);
  }, [pending, wait, useVideo, replay]);

  const onVideoProgress = useCallback(
    (f: number) => {
      lastProgressAt.current = Date.now();
      wait.value = withTiming(f, { duration: 250, easing: Easing.linear });
    },
    [wait],
  );
  const onVideoLoop = useCallback(() => setReady(true), []);
  const onVideoFail = useCallback(() => setUseVideo(false), []);

  if (!pending) return null;

  const enter = () => {
    track('door_seen', { tab: feature, ms: Date.now() - openedAt.current });
    void markDoorSeen(feature);
  };

  const visualW = Math.min(width - tokens.space[5] * 2, 360);
  // 9:16, capped so the time bar, the title, the line and the button still fit below it.
  const videoH = Math.round(Math.min(winH * 0.52 - DOOR_VIDEO_BAR_H, (visualW * 16) / 9));
  const videoW = Math.round((videoH * 9) / 16);

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenBackground withGoldHalo>
          <View style={styles.center}>
            <View style={styles.visual}>
              {useVideo ? (
                <DoorVideo
                  feature={feature}
                  width={videoW}
                  height={videoH}
                  seekAnywhere={replay}
                  onProgress={onVideoProgress}
                  onFirstLoop={onVideoLoop}
                  onFail={onVideoFail}
                />
              ) : feature === 'practices' ? null : feature === 'rewards' ? (
                <RewardsDoorVisual width={visualW} />
              ) : feature === 'learning' ? (
                <LearningDoorVisual width={Math.min(visualW, 340)} />
              ) : (
                <MeDoorVisual width={Math.min(visualW, 300)} />
              )}
            </View>
            <Text style={styles.title}>{t(`unlock.door.${feature}.title`)}</Text>
            <Text style={styles.line}>{t(`unlock.door.${feature}.line`)}</Text>
            {/* With the video, its own time bar is the wait line; the in-code
                animation keeps the thin line for its 4 s. */}
            {!ready ? (
              <View style={styles.waitWrap}>
                {useVideo ? null : (
                  <View style={styles.waitTrack}>
                    <Animated.View style={[styles.waitFill, waitStyle]} />
                  </View>
                )}
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
