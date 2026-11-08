import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import { learningMediaUrl } from '@/lib/learningMedia';
import { tokens } from '@/theme';

import type { DoorFeature } from './UnlockDoor';

/**
 * The door's video, one per tab and language, in the public `learning-media`
 * bucket under `doors/`. Immutable paths — a new cut is a new `rev` for THAT
 * door, bumped here (each door moves on its own).
 *  - r1: the illustrated story (tools/video molde, learning-drops/video-specs/doors.json).
 *  - r2+: the screen tutorial — a replica of the real tab with a tapping finger,
 *    ending on the (i) (tools/video/TOUR.md, tools/video/tours/<tab>.json).
 *  - rewards r3: the why first (the cast, ~20 s: positive reinforcement, your own
 *    reward and price), then the same tutorial — one file, ~59 s (never shipped).
 *  - the four doors (08/11): each screen opens with its why/benefit told by the
 *    cast and then its tutorial, in the requinte-phase-2 look (Hexa Limpo):
 *    practices r1 (right after the first-run tour), rewards r4, learning r2, me r2.
 */
const DOOR_VIDEO_REV: Record<DoorFeature, number> = { practices: 1, rewards: 4, learning: 2, me: 2 };
const doorAsset = (feature: DoorFeature, lang: 'pt' | 'en', ext: 'mp4' | 'poster.webp') =>
  learningMediaUrl(`doors/${feature}.${lang}.r${DOOR_VIDEO_REV[feature]}.${ext}`);

/** A video that has not shown a frame by then is treated as failed (offline). */
const START_TIMEOUT_MS = 7000;
/** The poster (a frame ~1 s in) stays until the video has drawn its opening — frame 0 of
 *  a cast intro is the empty room, so dropping the poster on `playing` read as a blink. */
const POSTER_HOLD_S = 0.4;
/** …or this long after playback starts, for players that skip early timeUpdates. */
const POSTER_MAX_MS = 900;

interface Props {
  feature: DoorFeature;
  width: number;
  height: number;
  /** 0..1 of the first loop — drives the door's wait line. */
  onProgress: (fraction: number) => void;
  /** The first loop has played: the button can show. */
  onFirstLoop: () => void;
  /** Error or no frame in time: the door falls back to the in-code animation. */
  onFail: () => void;
}

/**
 * Loops, starts MUTED and never unmutes on its own (onboarding rule: a video
 * never starts with sound) — the captions are burned in, so it reads without
 * sound. One small disc turns the voice on for whoever wants it. The poster
 * stays on top until the video has drawn its opening, then fades out.
 */
export function DoorVideo({ feature, width, height, onProgress, onFirstLoop, onFail }: Props) {
  const { t, locale } = useT();
  const lang = locale === 'pt' ? 'pt' : 'en';
  const source = useMemo(() => ({ uri: doorAsset(feature, lang, 'mp4'), useCaching: true }), [feature, lang]);
  const poster = doorAsset(feature, lang, 'poster.webp');
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const [soundOn, setSoundOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const looped = useRef(false);
  const lastTime = useRef(0);

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (isPlaying) setStarted(true);
  }, [isPlaying]);

  useEffect(() => {
    if (!started || revealed) return;
    const id = setTimeout(() => setRevealed(true), POSTER_MAX_MS);
    return () => clearTimeout(id);
  }, [started, revealed]);

  useEffect(() => {
    if (status === 'error') onFail();
  }, [status, onFail]);

  useEffect(() => {
    if (started) return;
    const id = setTimeout(onFail, START_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [started, onFail]);

  const firstLoopDone = () => {
    if (looped.current) return;
    looped.current = true;
    onProgress(1);
    onFirstLoop();
  };

  useEventListener(player, 'playToEnd', firstLoopDone);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (currentTime >= POSTER_HOLD_S) setRevealed(true);
    if (looped.current) return;
    // With loop on, some players wrap without a playToEnd: time going back = one loop.
    if (currentTime + 0.5 < lastTime.current) return firstLoopDone();
    lastTime.current = currentTime;
    const duration = player.duration;
    if (duration > 0) onProgress(Math.min(1, currentTime / duration));
  });

  useEffect(
    () => () => {
      try {
        player.pause();
      } catch {
        // Already released.
      }
    },
    [player],
  );

  const toggleSound = () => {
    Haptics.selectionAsync().catch(() => {});
    const next = !soundOn;
    setSoundOn(next);
    try {
      player.muted = !next;
    } catch {
      // Released mid-tap.
    }
  };

  return (
    <View style={[styles.wrap, { width, height }]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
      {!revealed && (
        <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none" exiting={FadeOut.duration(180)}>
          <Image
            source={{ uri: poster }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
          />
          {!started && (
            <View style={styles.spinner}>
              <ActivityIndicator color={tokens.text.hi} />
            </View>
          )}
        </Animated.View>
      )}
      <Pressable
        onPress={toggleSound}
        hitSlop={8}
        style={({ pressed }) => [styles.disc, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityState={{ checked: soundOn }}
        accessibilityLabel={
          soundOn ? t('learning.media.videoMuteA11y') : t('learning.media.videoUnmuteA11y')
        }
      >
        <Ionicons name={soundOn ? 'volume-high' : 'volume-mute'} size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: tokens.semantic.coin + '66',
    backgroundColor: tokens.bg.deep,
  },
  video: { width: '100%', height: '100%' },
  spinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
});
