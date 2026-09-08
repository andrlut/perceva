import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { formatDuration } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * The per-idea Notebook video at the top of an idea page.
 *
 * Portrait (9:16 by default — the posters are 720×1280), letterboxed on
 * black inside a rounded box framed in the dimension color, capped at
 * `maxHeight` so the title still peeks above the fold. Native controls,
 * fullscreen allowed, streamed from the public `learning-media` bucket with
 * `useCaching` so a re-open doesn't re-download.
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
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
  });
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
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        surfaceType="textureView"
      />

      {/* Poster + spinner until the first real frame. pointerEvents none so
         a tap still reaches the native controls underneath. */}
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
  spinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChip: {
    position: 'absolute',
    right: 10,
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
