import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

/**
 * The count on the Recanto's "Minhas ideias" button — ideas absorbed and
 * still waiting for review. The button is gold (every primary floating
 * button is), so the badge is deep violet with white ink: gold on gold
 * vanished. `ringColor` is the surface behind the button (the screen's bg on
 * the tab, the sheet's in the guide's replica), cutting the badge out of
 * the circle. Absolute, top-right of its parent; never takes touches.
 */
export function IdeasCountBadge({
  count,
  ringColor = tokens.bg.deep,
}: {
  count: number;
  ringColor?: string;
}) {
  return (
    <View style={[styles.badge, { borderColor: ringColor }]} pointerEvents="none">
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violetDeep,
  },
  text: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
});
