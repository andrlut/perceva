import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatAudioTime } from '@/lib/learningMedia';
import { tokens } from '@/theme';

/**
 * Podcast player pane for a learning material. Mounted ONCE the user first
 * enters the Listen mode and kept mounted (hidden) afterwards, so switching
 * modes never interrupts playback. Streams straight from the public bucket
 * URL — no download step.
 */

const SPEEDS = [1, 1.25, 1.5] as const;

interface Props {
  uri: string;
  /** DB-cached duration shown before the file metadata arrives. */
  fallbackDurationSeconds?: number | null;
  /** Episode title (from the media row's meta). */
  episodeTitle?: string | null;
  /** e.g. 'EN' when the audio language differs from the app language. */
  langBadge?: string | null;
}

export function AudioPane({ uri, fallbackDurationSeconds, episodeTitle, langBadge }: Props) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);

  // Podcast-grade session: keep playing with the screen locked and through
  // the iPhone mute switch. Requires ios.infoPlist.UIBackgroundModes=audio.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    player.shouldCorrectPitch = true;
  }, [player]);

  const duration =
    status.duration > 0 ? status.duration : (fallbackDurationSeconds ?? 0);
  const position = scrub ?? status.currentTime;
  const busy = status.playing && status.isBuffering;

  const togglePlay = () => {
    if (status.didJustFinish) {
      player.seekTo(0);
      player.play();
      return;
    }
    if (status.playing) player.pause();
    else player.play();
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    player.setPlaybackRate(SPEEDS[next]);
  };

  return (
    <View style={styles.card}>
      {(episodeTitle || langBadge) && (
        <View style={styles.headerRow}>
          {episodeTitle ? (
            <Text style={styles.episode} numberOfLines={1}>
              {episodeTitle}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {langBadge && (
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{langBadge}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.controlsRow}>
        <Pressable
          onPress={togglePlay}
          accessibilityRole="button"
          style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.8 }]}
        >
          {busy ? (
            <ActivityIndicator color={tokens.text.hi} size="small" />
          ) : (
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={26}
              color={tokens.text.hi}
              style={status.playing ? undefined : { marginLeft: 3 }}
            />
          )}
        </Pressable>

        <View style={styles.sliderWrap}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1}
            value={Math.min(position, duration > 0 ? duration : 1)}
            minimumTrackTintColor={tokens.brand.violet2}
            maximumTrackTintColor="rgba(255,255,255,0.16)"
            thumbTintColor={tokens.brand.violet2}
            onSlidingStart={() => setScrub(status.currentTime)}
            onValueChange={(v) => {
              if (scrub !== null) setScrub(v);
            }}
            onSlidingComplete={(v) => {
              player.seekTo(v);
              setScrub(null);
            }}
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatAudioTime(position)}</Text>
            <Text style={styles.time}>{formatAudioTime(duration)}</Text>
          </View>
        </View>

        <Pressable
          onPress={cycleSpeed}
          accessibilityRole="button"
          style={({ pressed }) => [styles.speedChip, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.speedText}>{SPEEDS[speedIdx]}x</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space[4],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episode: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  langBadge: {
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  sliderWrap: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 28,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  time: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
    fontVariant: ['tabular-nums'],
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  speedText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
    fontVariant: ['tabular-nums'],
  },
});
