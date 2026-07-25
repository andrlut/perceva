import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Short complementary video for a learning material, streamed straight from
 * the public `learning-media` bucket. Unlike AudioPane this is NOT kept
 * mounted across mode switches — leaving the View mode unmounts the player
 * and stops playback, which is the right behavior for video.
 */

interface Props {
  uri: string;
  /** width/height from the media row's meta; 16:9 when absent. */
  aspectRatio: number;
  /** e.g. 'EN' when the video language differs from the app language. */
  langBadge?: string | null;
}

export function VideoPane({ uri, aspectRatio, langBadge }: Props) {
  const { t } = useT();
  const player = useVideoPlayer(uri);
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  if (status === 'error') {
    return (
      <View style={[styles.wrap, styles.errorBox]}>
        <Text style={styles.errorText}>{t('learning.media.videoError')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <VideoView
        player={player}
        style={[styles.video, { aspectRatio }]}
        contentFit="contain"
        nativeControls
        allowsFullscreen
      />
      {langBadge && (
        <View style={styles.langBadge}>
          <Text style={styles.langBadgeText}>{langBadge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: tokens.space[4],
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
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
