import { useCallback, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/ScreenBackground';
import { OnbTopBar } from '@/components/tour/OnboardingKit';
import { DOOR_VIDEO_BAR_H, DoorVideo } from '@/components/unlock/DoorVideo';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/** end = watched through · scrub = reached the end by dragging the bar ahead ·
 *  skip = "Pular" · fail = could not play (or broke mid-way). */
export type IntroVideoOutcome = 'end' | 'scrub' | 'skip' | 'fail';

/**
 * The intro's opening (owner, 2026-11-08): the app overview video — the site's
 * Vitrine in its in-app cut — plays on its own, the first time and on every
 * replay of the intro. It is not offered behind a button: it opens, and
 * "Pular" (top right, where the slides keep their own) is the way out. The
 * time bar under it says it is under a minute, which is what keeps people
 * watching.
 *
 * It tells what the slides tell, so it stands in for them: the end — or a
 * skip — lands on the intro's last page (the choice). If it can't play
 * (offline, an error, no frame in time), the slides take over from page 0.
 *
 * Starts muted like every video in the app (captions are burned in); a tap
 * pauses, the bar seeks anywhere. Drawn over the pager (which stays mounted
 * under it), so the jump to the choice page is instant.
 */
export function IntroVideoStage({
  onDone,
}: {
  onDone: (how: IntroVideoOutcome, fraction: number) => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const fraction = useRef(0);
  const done = useRef(false);

  const finish = useCallback(
    (how: IntroVideoOutcome) => {
      if (done.current) return;
      done.current = true;
      onDone(how, fraction.current);
    },
    [onDone],
  );
  const onProgress = useCallback((f: number) => {
    fraction.current = f;
  }, []);
  const onEnd = useCallback(
    ({ scrubbed }: { scrubbed: boolean }) => finish(scrubbed ? 'scrub' : 'end'),
    [finish],
  );
  const onFail = useCallback(() => finish('fail'), [finish]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: Math.round(width), h: Math.round(height) });
  };

  // As big as the area allows, 9:16, with the time bar under it.
  const videoH =
    box.h > 0
      ? Math.round(Math.min(box.h - DOOR_VIDEO_BAR_H - tokens.space[3], ((box.w - tokens.space[4] * 2) * 16) / 9))
      : 0;
  const videoW = Math.round((videoH * 9) / 16);

  return (
    // Modal for assistive tech: the pager under it is hidden too (IntroPager).
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <ScreenBackground withGoldHalo>
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, tokens.space[3]) }]}>
          <OnbTopBar
            right={
              <Pressable
                onPress={() => finish('skip')}
                hitSlop={8}
                style={({ pressed }) => [styles.skipLink, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('tour.intro.videoSkip')}
              >
                <Text style={styles.skipText}>{t('tour.intro.videoSkip')}</Text>
              </Pressable>
            }
          />
          <View style={styles.body} onLayout={onLayout}>
            {videoH > 0 ? (
              <DoorVideo
                feature="overview"
                variant="player"
                width={videoW}
                height={videoH}
                onProgress={onProgress}
                onEnd={onEnd}
                onFail={onFail}
              />
            ) : null}
          </View>
        </View>
      </ScreenBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Same link as the slides' "Pular introdução" (IntroPager).
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
  pressed: { opacity: 0.6 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
