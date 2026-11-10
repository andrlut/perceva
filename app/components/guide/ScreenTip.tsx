import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useSession } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * One-line, dismissible tip shown the FIRST time a user opens a screen —
 * the "dicas contextuais por tela" that replaced the deleted M2…M6 tour
 * walk-throughs (Onboarding simples, 2026-11): each screen explains itself
 * when the person chooses to open it, not before.
 *
 * Per user, per screen, in AsyncStorage (`rpgtasks.tips.v1.<uid>.<id>`).
 * Renders nothing until the flag is read, so it never flashes for someone
 * who already dismissed it. The tabs with an animated door (Recompensas,
 * Aprender, Eu) don't need one — the door is their tip.
 */

const KEY_PREFIX = 'rpgtasks.tips.v1.';

export type ScreenTipId = 'tasks' | 'rewardsManage' | 'history' | 'allPractices' | 'dayVoice';

function key(uid: string | null, id: ScreenTipId): string {
  return `${KEY_PREFIX}${uid ?? 'anonymous'}.${id}`;
}

export function ScreenTip({ id, style }: { id: ScreenTipId; style?: StyleProp<ViewStyle> }) {
  const { t } = useT();
  const { session } = useSession();
  const uid = session?.user?.id ?? null;
  // null = not read yet; true = show; false = dismissed.
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key(uid, id))
      .then((v) => {
        if (!cancelled) setVisible(v == null);
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, id]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(key(uid, id), '1').catch(() => {});
  };

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      style={[styles.card, style]}
      accessibilityRole="text"
    >
      <View style={styles.icon}>
        <Ionicons name="bulb-outline" size={16} color={tokens.brand.violet2} />
      </View>
      <Text style={styles.text}>{t(`tips.${id}`)}</Text>
      <Pressable
        onPress={dismiss}
        hitSlop={10}
        style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={t('tips.dismiss')}
      >
        <Ionicons name="close" size={16} color={tokens.text.mid} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingLeft: tokens.space[3],
    paddingRight: tokens.space[2],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.4)',
    backgroundColor: 'rgba(123, 92, 255, 0.10)',
    marginBottom: tokens.space[3],
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  text: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.base,
  },
  close: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
