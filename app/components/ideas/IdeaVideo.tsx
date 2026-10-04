import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/lib/i18n';
import { useIdeaSound } from '@/lib/ideaSound';
import { formatDuration } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * The per-idea Notebook video at the top of an idea page.
 *
 * Portrait (9:16 by default — the posters are 720×1280), letterboxed on
 * black inside a rounded box framed in the dimension color, capped at
 * `maxHeight` so the title still peeks above the fold. Streamed from the
 * public `learning-media` bucket with `useCaching` so a re-open doesn't
 * re-download.
 *
 * ## Quiet inline, full when asked (owner, 2026-10-04)
 *
 * Inline it plays with NO controls — the native control bar covered half
 * the frame — and MUTED unless the reader turned sound on (lib/ideaSound:
 * off by default, carried across ideas, reset on leaving them). Two
 * discreet discs bottom-right: sound (the ONLY thing that unmutes) and
 * expand. Expanding — the disc or a tap anywhere on the video — opens a
 * full-screen Modal hosting the same player with the native controls (seek,
 * ±5/15s, fullscreen) and does NOT touch the sound. Only one VideoView holds
 * the player at a time: the inline view unmounts while the Modal is open.
 *
 * Lifecycle is driven by the pager: `isActive` true → play, false → pause;
 * unmount pauses too (the hook releases the native player right after).
 * The poster stays on top until the FIRST `playingChange` with
 * `isPlaying` — that is the moment the surface actually has a frame, so
 * there is never a black flash between poster and video.
 *
 * Same visual language as `VideoPane` (lang badge, error box), plus a
 * duration chip that goes away once playback starts (the native controls
 * show the time from then on).
 */

interface Props {
  uri: string;
  /** Public URL of the poster frame, or null (black box + spinner). */
  poster: string | null;
  /** Only the active pager page plays; flipping to false pauses. */
  isActive: boolean;
  /** e.g. 'EN' when the video language differs from the app language. */
  langBadge?: string | null;
  durationSeconds?: number | null;
  /** Box width — the page's content width. */
  width: number;
  /** Height cap (~55% of the page height). */
  maxHeight: number;
  /** width / height of the video; 9/16 when unknown. */
  aspectRatio?: number;
  /** Dimension color — tints the 1.5px frame. */
  accentColor: string;
}

const DEFAULT_ASPECT = 9 / 16;

export function IdeaVideo({
  uri,
  poster,
  isActive,
  langBadge,
  durationSeconds,
  width,
  maxHeight,
  aspectRatio = DEFAULT_ASPECT,
  accentColor,
}: Props) {
  const { t } = useT();

  // Stable source object: the hook keys the native player on it.
  const source = useMemo(() => ({ uri, useCaching: true }), [uri]);
  const soundOn = useIdeaSound((s) => s.on);
  const setSound = useIdeaSound((s) => s.set);
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = !useIdeaSound.getState().on;
  });
  const [expanded, setExpanded] = useState(false);

  // The shared choice drives every mounted player.
  useEffect(() => {
    try {
      player.muted = !soundOn;
    } catch {
      // Released.
    }
  }, [soundOn, player]);

  const toggleSound = () => {
    Haptics.selectionAsync().catch(() => {});
    setSound(!soundOn);
  };
  const expand = () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      player.play();
    } catch {
      // Released mid-tap.
    }
    setExpanded(true);
  };
  const collapse = () => setExpanded(false);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Once the video has really started the poster is gone for good — a pause
  // afterwards shows the paused frame, not the poster again.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (isPlaying) setStarted(true);
  }, [isPlaying]);

  // Autoplay on the active page, pause when the user swipes away. play() on
  // a still-loading player queues the start (playWhenReady semantics).
  useEffect(() => {
    try {
      if (isActive) player.play();
      else player.pause();
    } catch {
      // Player already released (unmount race) — nothing to do.
    }
    if (!isActive) setExpanded(false);
  }, [isActive, player]);

  // Belt and braces: the hook releases the player on unmount, but if the
  // release cleanup ever runs after ours the explicit pause still wins.
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

  const height = Math.round(Math.min(width / aspectRatio, maxHeight));
  const frameStyle = { width, height, borderColor: accentColor + 'B3' };

  if (status === 'error') {
    return (
      <View style={[styles.wrap, styles.errorBox, { width, borderColor: accentColor + 'B3' }]}>
        <Text style={styles.errorText}>{t('learning.media.videoError')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, frameStyle]}>
      {/* textureView so the rounded corners actually clip on Android — a
         SurfaceView punches through `overflow: hidden` — and so the page
         slides cleanly under the pager's horizontal translation. */}
      {expanded ? null : (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          surfaceType="textureView"
        />
      )}

      {/* The whole frame expands; the corner button is the visible cue. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={expand}
        accessibilityRole="button"
        accessibilityLabel={t('learning.media.videoExpandA11y')}
      />
      <View style={styles.corner}>
        <Pressable
          onPress={toggleSound}
          hitSlop={6}
          style={({ pressed }) => [styles.disc, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityState={{ checked: soundOn }}
          accessibilityLabel={
            soundOn ? t('learning.media.videoMuteA11y') : t('learning.media.videoUnmuteA11y')
          }
        >
          <Ionicons
            name={soundOn ? 'volume-high' : 'volume-mute'}
            size={16}
            color="#FFFFFF"
          />
        </Pressable>
        <Pressable
          onPress={expand}
          hitSlop={6}
          style={({ pressed }) => [styles.disc, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('learning.media.videoExpandA11y')}
        >
          <Ionicons name="expand" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <Modal
        visible={expanded}
        animationType="fade"
        onRequestClose={collapse}
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}
      >
        <SafeAreaView style={styles.full} edges={['top', 'bottom']}>
          <VideoView
            player={player}
            style={styles.fullVideo}
            contentFit="contain"
            nativeControls
            allowsFullscreen
          />
          <View style={styles.fullTop}>
            <Pressable
              onPress={toggleSound}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityState={{ checked: soundOn }}
              accessibilityLabel={
                soundOn ? t('learning.media.videoMuteA11y') : t('learning.media.videoUnmuteA11y')
              }
            >
              <Ionicons name={soundOn ? 'volume-high' : 'volume-mute'} size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={collapse}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Poster + spinner until the first real frame. pointerEvents none so
         a tap still reaches the expand target underneath. */}
      {!started && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {poster ? (
            <Image
              source={{ uri: poster }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              cachePolicy="memory-disk"
              recyclingKey={poster}
              transition={120}
            />
          ) : null}
          <View style={styles.spinner}>
            <ActivityIndicator color={tokens.text.hi} />
          </View>
          {durationSeconds != null && durationSeconds > 0 ? (
            <View style={styles.durationChip}>
              <Text style={styles.durationText}>{formatDuration(durationSeconds)}</Text>
            </View>
          ) : null}
        </View>
      )}

      {langBadge ? (
        <View style={styles.langBadge} pointerEvents="none">
          <Text style={styles.langBadgeText}>{langBadge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  // Discreet: two small dark discs in the corner, the only chrome inline.
  corner: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  disc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  full: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullVideo: {
    flex: 1,
  },
  fullTop: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  durationText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  langBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.42)',
  },
  langBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.6,
    color: tokens.brand.violet2,
  },
  errorBox: {
    padding: tokens.space[4],
    backgroundColor: tokens.bg.glass,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.mid,
    textAlign: 'center',
  },
});
