import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { tokens } from '@/theme';

/**
 * The way into the full mood check-in, where the tags and the note live.
 *
 * Full width and 52dp tall on purpose: the path used to be a 12px text link
 * (a ~32dp target) that read as decoration, and the owner kept missing it.
 * Even while its card scrolls past the floating stack on the right, most of
 * the button stays clear of it.
 *
 * Shared by the Home's today strip (MoodHubStrip) and the day card
 * (MoodDayDetail — past days on the Home, every day in the calendar), so
 * logging a day in full is equally easy wherever the day is shown.
 */
export function FullCheckinButton({
  icon,
  label,
  onPress,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  /** Layout only (MoodActionsRow shares its row with the Claude door). */
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, style, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={tokens.brand.violet2} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Tinted surface + violet rim + violet label: unmistakably a button. The
  // label is what carries the contrast — violet2 on surface2 measures 4.60:1
  // in the dark theme and 5.81:1 in the light one, both AA for 14px text; the
  // rim is decoration on top. A FILLED violet button was ruled out:
  // brand.violet measures 4.36:1 with white in the dark theme.
  btn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.brand.violet2,
    backgroundColor: tokens.bg.surface2,
  },
  text: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.2,
    color: tokens.brand.violet2,
  },
});
