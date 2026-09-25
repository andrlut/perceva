import { usePathname } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSession } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { useTourFinished, useTourStore } from '@/lib/tour/store';
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
 *
 * The banner only speaks to someone already USING the app: signed in, tour
 * finished (and already finished when this session started), and not on a
 * /tour screen. A fresh install fetches the latest
 * update during its very first launch, so a "restart to update" used to pop
 * up before the user had even finished onboarding (first-user feedback,
 * 2026-09). Everywhere else it stays silent — a downloaded update applies by
 * itself on the next cold start, so nothing is lost by not asking.
 */
export function OtaUpdateGate() {
  const { t } = useT();
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const lastCheckRef = useRef(0);
  const { user, isAuthenticated } = useSession();
  // Fails closed while the tour store hydrates and during a replay.
  const tourFinished = useTourFinished();
  const pathname = usePathname();
  const onTourRoute = pathname === '/tour' || pathname.startsWith('/tour/');

  // Was THIS user's tour already finished the first time the store held
  // their data in this JS session? A tour that finishes later means a
  // brand-new install — prompting a restart right after the closing screen
  // is the same "banner the moment I installed" the feedback was about.
  // Their update applies on the next cold start instead. Keyed by user id
  // so an account switch re-evaluates, and read only once the store holds
  // this user's data (not the anonymous pre-session state).
  const userId = user?.id ?? null;
  const hydratedForUser = useTourStore(
    (s) => s.status === 'ready' && userId != null && s.characterId === userId,
  );
  const [bootState, setBootState] = useState<{ userId: string; finished: boolean } | null>(
    null,
  );
  useEffect(() => {
    if (!hydratedForUser || userId == null || bootState?.userId === userId) return;
    setBootState({ userId, finished: tourFinished });
  }, [hydratedForUser, userId, bootState, tourFinished]);
  const finishedAtBoot = bootState?.userId === userId && bootState.finished;

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
  if (!isAuthenticated || !finishedAtBoot || !tourFinished || onTourRoute) return null;

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
          hitSlop={6}
          accessibilityRole="button"
        >
          <Text style={styles.restartText}>{t('profile.update.restart')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={13}
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
    fontSize: 13,
    lineHeight: 17,
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
