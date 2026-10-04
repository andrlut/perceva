import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/theme';

/**
 * The (i) in a tab's top-right corner — opens the screen's guide (InfoSheet
 * + its `<Tela>Guide`, docs/informativo-de-tela.md).
 *
 * Just the glyph, no chip around it (owner, 2026-10-03): the same 24px
 * outline icon on every main tab, in a 40px touch box pulled 8px into the
 * right gutter so the glyph lines up with the screen's edge content.
 */
export function ScreenInfoButton({
  onPress,
  a11yLabel,
  style,
}: {
  onPress: () => void;
  a11yLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, style, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <Ionicons name="information-circle-outline" size={24} color={tokens.text.mid} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
