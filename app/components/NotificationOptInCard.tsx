import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { useLoadedSettings, useSettingsStore } from '@/lib/settings';
import { tokens } from '@/theme';

/** AsyncStorage once-EVER stamp — user already saw (and acted on or
 *  dismissed) the opt-in card. Unlike the mood prompt's day-stamp,
 *  this never re-shows: nagging about notifications reads as spam,
 *  and Settings keeps the toggle discoverable afterwards. */
const OPTIN_SHOWN_KEY = '@perceva/notif_optin';

interface Props {
  /** Suppress while a tour or other overlay owns the screen. */
  enabled?: boolean;
}

/**
 * Contextual notification opt-in — inline dismissible card on the Today
 * Hub. The notifications master-switch defaults OFF (Android 13+ makes a
 * cold-boot permission prompt a sticky-denial risk), so without this card
 * users never discover the feature: `useNotificationsSetup` only requests
 * OS permission once the switch is ON.
 *
 * The CTA just flips the settings switch — the always-mounted
 * `useNotificationsSetup` effect reacts and fires the OS permission
 * prompt itself; we deliberately do NOT call the permissions API here.
 * Both CTA and dismiss stamp AsyncStorage so the card shows once ever.
 */
export function NotificationOptInCard({ enabled = true }: Props) {
  const { t } = useT();
  const settings = useLoadedSettings();
  const settingsStatus = useSettingsStore((s) => s.status);
  const setSetting = useSettingsStore((s) => s.set);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // expo-notifications has no web shim (see useNotificationsSetup) —
    // offering the switch on web would flip a setting that does nothing.
    if (Platform.OS === 'web') return;
    if (!enabled) return;
    if (settingsStatus !== 'ready') return;
    if (settings.notificationsEnabled) return;

    let active = true;
    (async () => {
      const shown = await AsyncStorage.getItem(OPTIN_SHOWN_KEY);
      if (active && shown === null) setVisible(true);
    })();
    return () => {
      active = false;
    };
  }, [enabled, settingsStatus, settings.notificationsEnabled]);

  const stamp = () => {
    AsyncStorage.setItem(OPTIN_SHOWN_KEY, '1').catch(() => {
      // best-effort; worst case the card shows again next session
    });
  };

  const handleActivate = () => {
    setVisible(false);
    stamp();
    // useNotificationsSetup watches this flag and requests OS permission.
    void setSetting('notificationsEnabled', true);
  };

  const handleDismiss = () => {
    setVisible(false);
    stamp();
  };

  if (!visible || !enabled) return null;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="notifications-outline"
          size={18}
          color={tokens.semantic.coinLight}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('home.notifOptIn.title')}</Text>
        <Text style={styles.body}>{t('home.notifOptIn.body')}</Text>
        <Pressable
          onPress={handleActivate}
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('home.notifOptIn.cta')}
        >
          <Text style={styles.ctaText}>{t('home.notifOptIn.cta')}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleDismiss}
        // 28px box + 8px hitSlop all around = 44px effective target.
        hitSlop={8}
        style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={t('home.notifOptIn.dismissA11y')}
      >
        <Ionicons name="close" size={16} color={tokens.text.dim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Same footprint grammar as the other Home cards: space[4] gutters,
  // radius 16, surface + subtle border.
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    padding: 14,
    borderRadius: 16,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    // Gold inset rim on top, echoing the reward card's accent.
    borderTopColor: 'rgba(255, 224, 138, 0.18)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
    letterSpacing: 0.2,
  },
  body: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    marginTop: tokens.space[2],
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.brand.violetGlow,
  },
  ctaPressed: {
    opacity: 0.7,
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.text.hi,
    letterSpacing: 0.3,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
