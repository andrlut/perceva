import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/ScreenBackground';
import { DOOR_VIDEO_BAR_H, DoorVideo } from '@/components/unlock/DoorVideo';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import { DOOR_VIDEO_SCREENS } from '@/lib/unlock';
import { tokens } from '@/theme';

const HEADER_H = 56;

/**
 * A screen's door video, to rewatch (owner, 2026-11-08). Same video as the
 * door, but this one is the person's choice, so it can be left at any moment
 * (the X, the back gesture), paused with a tap, and moved through freely on
 * the time bar. Only the door itself — the first opening of a screen — makes
 * you watch it to the end.
 */
export default function DoorVideoScreen() {
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ feature?: string; source?: string }>();
  const feature = DOOR_VIDEO_SCREENS.find((f) => f === params.feature) ?? null;
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!feature) {
      router.back();
      return;
    }
    track('door_video_opened', { tab: feature, source: params.source ?? null });
    // Once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFail = useCallback(() => setFailed(true), []);

  if (!feature) return null;

  // As big as the screen allows, 9:16, with the header and the time bar around it.
  const availH = winH - insets.top - insets.bottom - HEADER_H - DOOR_VIDEO_BAR_H - tokens.space[6];
  const maxW = winW - tokens.space[4] * 2;
  const videoH = Math.round(Math.min(availH, (maxW * 16) / 9));
  const videoW = Math.round((videoH * 9) / 16);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground withGoldHalo>
        <View style={styles.header}>
          <View style={styles.side} />
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {t(`unlock.door.${feature}.title`)}
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={22} color={tokens.text.hi} />
          </Pressable>
        </View>
        <View style={styles.body}>
          {failed ? (
            <View style={styles.failed}>
              <Ionicons name="cloud-offline-outline" size={36} color={tokens.text.mid} />
              <Text style={styles.failedText}>{t('doorVideo.failed')}</Text>
            </View>
          ) : (
            <DoorVideo
              feature={feature}
              width={videoW}
              height={videoH}
              variant="player"
              onFail={onFail}
            />
          )}
        </View>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  header: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[3],
  },
  side: { width: 40 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    color: tokens.text.hi,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: tokens.space[4],
  },
  failed: {
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[6],
  },
  failedText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: tokens.text.base,
    textAlign: 'center',
  },
});
