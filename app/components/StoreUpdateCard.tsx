import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { isVersionNewer, useAndroidRelease } from '@/lib/api/appConfig';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * "There's a newer build on the Play Store" — the one update an OTA can
 * never deliver. Compares the BINARY's runtime (Updates.runtimeVersion ==
 * native app version under the appVersion policy; null in Expo Go, which
 * correctly hides the card) against app_config.android_release, kept
 * current by the release ritual. Dismissible per version — a notice, not
 * a nag; the store button is always one tap away.
 */
const DISMISS_KEY = '@perceva/store_update_dismissed';

export function StoreUpdateCard() {
  const { t } = useT();
  const release = useAndroidRelease();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const binaryVersion = Updates.runtimeVersion ?? null;
  const latest = release.data?.version ?? null;
  const outdated =
    Platform.OS === 'android' &&
    latest != null &&
    isVersionNewer(latest, binaryVersion);

  useEffect(() => {
    if (!outdated || latest == null) return;
    let alive = true;
    AsyncStorage.getItem(`${DISMISS_KEY}:${latest}`)
      .then((v) => {
        if (alive) {
          setDismissed(v);
          setHydrated(true);
        }
      })
      .catch(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, [outdated, latest]);

  if (!outdated || !hydrated || dismissed != null || latest == null) return null;

  const openStore = () => {
    const pkg = release.data?.package ?? 'perceva.app';
    Linking.openURL(`market://details?id=${pkg}`).catch(() => {
      Linking.openURL(
        `https://play.google.com/store/apps/details?id=${pkg}`,
      ).catch(() => {});
    });
  };

  const dismiss = () => {
    setDismissed('1');
    AsyncStorage.setItem(`${DISMISS_KEY}:${latest}`, '1').catch(() => {});
  };

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="arrow-up-circle" size={17} color={tokens.brand.violet2} />
      </View>
      <Pressable
        onPress={openStore}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('home.storeUpdate.title')}
      >
        <Text style={styles.title}>{t('home.storeUpdate.title')}</Text>
        <Text style={styles.sub}>{t('home.storeUpdate.sub')}</Text>
      </Pressable>
      <Pressable
        onPress={dismiss}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Ionicons name="close" size={15} color={tokens.text.dim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.4)',
    backgroundColor: 'rgba(123, 92, 255, 0.10)',
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  sub: {
    fontFamily: tokens.font.family,
    fontSize: 11,
    color: tokens.text.mid,
    marginTop: 1,
  },
});
