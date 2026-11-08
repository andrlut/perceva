import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import { learningMediaUrl } from '@/lib/learningMedia';
import { tokens } from '@/theme';

import type { ScreenVideoKey } from '@/lib/unlock';

import { VideoScrubBar } from './VideoScrubBar';

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
 *  - overview r1 (08/11): not a door — the site's Vitrine in its in-app cut (the end card
 *    without the store line), the first thing the intro plays (IntroVideoStage) and the
 *    first row of Ajustes › Tutorial e vídeos (tools/video/scripts/vitrine.mjs render --app).
 */
const DOOR_VIDEO_REV: Record<ScreenVideoKey, number> = { practices: 1, rewards: 4, learning: 2, me: 2, overview: 1 };
const doorAsset = (feature: ScreenVideoKey, lang: 'pt' | 'en', ext: 'mp4' | 'poster.webp') =>
  learningMediaUrl(`doors/${feature}.${lang}.r${DOOR_VIDEO_REV[feature]}.${ext}`);

/** A video that has not shown a frame by then is treated as failed (offline)… */
const START_TIMEOUT_MS = 7000;
/** …unless its source already answered (`sourceLoad`): then it is a slow link
 *  still buffering, not a dead one, and gets this much longer to start. */
const LOADED_START_TIMEOUT_MS = 25000;
/** The poster (a frame ~1 s in) stays until the video has drawn its opening — frame 0 of
 *  a cast intro is the empty room, so dropping the poster on `playing` read as a blink. */
const POSTER_HOLD_S = 0.4;
/** …or this long after playback starts, for players that skip early timeUpdates. */
const POSTER_MAX_MS = 900;
/** The time bar under the frame: its row height, for whoever sizes the frame. */
export const DOOR_VIDEO_BAR_H = 40;

interface Props {
  feature: ScreenVideoKey;
  width: number;
  height: number;
  /**
   * 'door' (default) — a door's opening: loops, and on the FIRST time the bar
   * only seeks back into what was already watched (the whole video is watched
   * once; André, 07/11). 'player' — a rewatch from the (i) or Ajustes: plays
   * once, a tap on the frame pauses, the bar seeks anywhere, the end offers a
   * replay; leaving is the screen's close button.
   */
  variant?: 'door' | 'player';
  /** Door only: the bar seeks anywhere ("Rever as portas" — not a first time). */
  seekAnywhere?: boolean;
  /** 0..1 of the first loop (or of the one play, as a player) — the door's stall watch. */
  onProgress?: (fraction: number) => void;
  /** Player only: it reached the end — `scrubbed` when a drag on the bar jumped
   *  ahead on the way (a skip, not a full watch). */
  onEnd?: (info: { scrubbed: boolean }) => void;
  /** The first loop has played: the button can show. */
  onFirstLoop?: () => void;
  /** Error or no frame in time: the door falls back to the in-code animation. */
  onFail?: () => void;
}

/**
 * Starts MUTED and never unmutes on its own (onboarding rule: a video never
 * starts with sound) — the captions are burned in, so it reads without sound.
 * One small disc turns the voice on for whoever wants it. The poster stays on
 * top until the video has drawn its opening, then fades out. Under the frame,
 * a thin bar with the time (VideoScrubBar): the video reads as short, and a
 * drag moves through it.
 */
export function DoorVideo({
  feature,
  width,
  height,
  variant = 'door',
  seekAnywhere = false,
  onProgress,
  onFirstLoop,
  onEnd,
  onFail,
}: Props) {
  const { t, locale } = useT();
  const isPlayer = variant === 'player';
  const lang = locale === 'pt' ? 'pt' : 'en';
  const source = useMemo(() => ({ uri: doorAsset(feature, lang, 'mp4'), useCaching: true }), [feature, lang]);
  const poster = doorAsset(feature, lang, 'poster.webp');
  const player = useVideoPlayer(source, (p) => {
    p.loop = !isPlayer;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const [soundOn, setSoundOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  // The furthest point played — on a first opening, the bar's reach.
  const [watched, setWatched] = useState(0);
  const [ended, setEnded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // A drag that jumped ahead (more than a couple of seconds): reaching the end
  // after one is a skip, not a full watch.
  const scrubbed = useRef(false);
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
    if (status === 'error') onFail?.();
  }, [status, onFail]);

  useEffect(() => {
    if (started) return;
    const id = setTimeout(() => onFail?.(), loaded ? LOADED_START_TIMEOUT_MS : START_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [started, loaded, onFail]);

  const firstLoopDone = () => {
    if (looped.current) return;
    looped.current = true;
    setWatched(Number.POSITIVE_INFINITY);
    onProgress?.(1);
    onFirstLoop?.();
  };

  useEventListener(player, 'sourceLoad', ({ duration: d }) => {
    setLoaded(true);
    if (d > 0) setDuration(d);
  });
  useEventListener(player, 'playToEnd', () => {
    if (isPlayer) {
      setEnded(true);
      setPosition(player.duration || duration);
      onEnd?.({ scrubbed: scrubbed.current });
    }
    firstLoopDone();
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (currentTime >= POSTER_HOLD_S) setRevealed(true);
    const d = player.duration;
    if (d > 0 && d !== duration) setDuration(d);
    setPosition(currentTime);
    setWatched((w) => Math.max(w, currentTime));
    if (looped.current) return;
    // With loop on, some players wrap without a playToEnd: time jumping back from
    // the very end = one loop. A seek back (the bar) lands mid-video, so it never
    // counts — and the seek resets lastTime itself.
    if (d > 0 && currentTime + 0.5 < lastTime.current && lastTime.current > d - 1.5) {
      return firstLoopDone();
    }
    lastTime.current = currentTime;
    if (d > 0) onProgress?.(Math.min(1, currentTime / d));
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

  const seek = (seconds: number) => {
    try {
      if (seconds > position + 2) scrubbed.current = true;
      lastTime.current = seconds;
      player.currentTime = seconds;
      setPosition(seconds);
      if (ended) {
        setEnded(false);
        player.play();
      }
    } catch {
      // Released mid-drag.
    }
  };

  const togglePlay = () => {
    try {
      if (ended) {
        setEnded(false);
        scrubbed.current = false;
        lastTime.current = 0;
        player.currentTime = 0;
        player.play();
      } else if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // Released mid-tap.
    }
  };

  // First opening: back into what was watched, never ahead. Everything else: anywhere.
  const limit = isPlayer || seekAnywhere ? duration : Math.min(duration, watched);
  const paused = isPlayer && started && (ended || !isPlaying);

  return (
    <View style={{ width, alignSelf: 'center' }}>
      <View style={[styles.frame, { width, height }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
        />
        {isPlayer ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={
              ended
                ? t('doorVideo.replay')
                : isPlaying
                  ? t('doorVideo.pause')
                  : t('doorVideo.play')
            }
          >
            {paused ? (
              <Animated.View entering={FadeIn.duration(140)} style={styles.center} pointerEvents="none">
                <View style={styles.bigDisc}>
                  <Ionicons name={ended ? 'refresh' : 'play'} size={30} color="#FFFFFF" />
                </View>
              </Animated.View>
            ) : null}
          </Pressable>
        ) : null}
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
              <View style={styles.center}>
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
      <View style={styles.bar}>
        <VideoScrubBar
          position={position}
          duration={duration}
          limit={limit}
          width={width}
          onSeek={seek}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: tokens.semantic.coin + '66',
    backgroundColor: tokens.bg.deep,
  },
  video: { width: '100%', height: '100%' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigDisc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
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
  bar: { height: DOOR_VIDEO_BAR_H, justifyContent: 'center', paddingTop: 4 },
});
