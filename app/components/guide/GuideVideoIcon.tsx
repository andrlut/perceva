import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useT } from '@/lib/i18n';
import { type DoorVideoScreen, doorVideoHref } from '@/lib/unlock';
import { tokens } from '@/theme';

/**
 * The video door of a screen's guide: a gold play circle, FIRST in the
 * sheet's header (before the AI circle and the X; owner, 2026-11-08). The
 * screen's door video — why it exists, then how to use it — opens to
 * rewatch, closable. Like the AI door, the sheet closes first (`onLeave`),
 * so coming back lands on the screen, not on a stale sheet.
 *
 * Its right hit area is 0: the AI circle's left one covers the 10px gap, so
 * the two never overlap.
 */
export function GuideVideoIcon({ feature, onLeave }: { feature: DoorVideoScreen; onLeave: () => void }) {
  const { t } = useT();
  const router = useRouter();
  const press = () => {
    onLeave();
    router.push(doorVideoHref(feature, 'guide'));
  };
  return (
    <Pressable
      onPress={press}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 0 }}
      accessibilityRole="button"
      accessibilityLabel={t('doorVideo.guideA11y')}
      style={({ pressed }) => [styles.circle, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="play" size={14} color={tokens.semantic.coin} style={styles.glyph} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Same 32px circle as the AI one and the X, in the gold of the app's
  // floating buttons.
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.5)',
  },
  // The play triangle's optical centre sits right of its box.
  glyph: { marginLeft: 2 },
});
