import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Minimum interval between foreground update checks. Rapid app switches
 * (notification peek, share sheet, etc.) fire 'active' repeatedly —
 * without a cooldown every switch would hit the update server.
 */
const CHECK_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Global OTA update gate, mounted once in the root layout.
 *
 * Closes the "user who never cold-starts the app" gap left by
 * expo-updates' default ON_LOAD behavior:
 *   1. every time the app returns to the foreground (throttled), check
 *      for a new update and download it silently;
 *   2. once a downloaded update is pending — whether fetched here or by
 *      the native launch check — show a small banner offering to restart
 *      now instead of waiting for the next cold start.
 *
 * The manual "check for updates" button in Settings stays as the
 * immediate/explicit path; this component is the passive one.
 */
export function OtaUpdateGate() {
  const { t } = useT();
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    // Expo Go / dev builds have no update pipeline — isEnabled is false
    // there and checkForUpdateAsync would throw.
    if (__DEV__ || !Updates.isEnabled) return;

    const maybeCheck = async () => {
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_COOLDOWN_MS) return;
      lastCheckRef.current = now;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // Silent — this is a passive background path; the Settings
        // button surfaces errors for users who explicitly ask.
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeCheck();
    });
    return () => sub.remove();
  }, []);

  if (!isUpdatePending || dismissed) return null;

  return (
    <View style={styles.banner} pointerEvents="box-none">
      <View style={styles.card}>
        <Ionicons name="cloud-download" size={18} color={tokens.brand.violet2} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{t('profile.update.ready')}</Text>
          <Text style={styles.body}>{t('profile.update.readyBody')}</Text>
        </View>
        <Pressable
          onPress={() => Updates.reloadAsync()}
          style={({ pressed }) => [styles.restartBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <Text style={styles.restartText}>{t('profile.update.restart')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={8}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          accessibilityRole="button"
          accessibilityLabel={t('profile.update.later')}
        >
          <Ionicons name="close" size={18} color={tokens.text.mid} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: tokens.space[4],
    right: tokens.space[4],
    // Sits above the floating bottom nav on tab screens; on modal
    // screens it simply floats near the bottom edge.
    bottom: 96,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.35)',
    backgroundColor: tokens.bg.surface,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
    marginTop: 1,
  },
  restartBtn: {
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.brand.violet2,
  },
  restartText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: '#1E1348',
    letterSpacing: 0.3,
  },
});
