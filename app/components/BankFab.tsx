import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/lib/i18n';

interface Props {
  /** Number of banked rewards waiting — feeds the accessibility label. */
  count: number;
  /** Distance from the bottom of the screen — caller should pass the
   *  bottom-nav clearance so the FAB doesn't sit underneath the tab bar. */
  bottomOffset: number;
  onPress: () => void;
}

/**
 * Floating action button for the Bank — sits in the bottom-right corner
 * where the thumb naturally lands. Renders only when the user actually
 * has something to retrieve; otherwise the caller should omit it entirely
 * so it doesn't waste touch real estate.
 *
 * Visual language: gold gradient pill mirroring the affordable BUY
 * button, so the FAB reads as "open this reward" — a continuation of
 * the purchase journey rather than a separate navigation surface.
 */
export function BankFab({ count, bottomOffset, onPress }: Props) {
  const { t } = useT();
  return (
    <View
      style={[styles.wrap, { bottom: bottomOffset + 16 }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.fab,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('rewards.vault.tabs.bank', { count })}
        hitSlop={8}
      >
        <LinearGradient
          colors={['#FFE890', '#FFC83D', '#C8881C']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="wallet" size={24} color="#3D2A00" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    // bottom is overridden inline per caller offset
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,224,138,0.6)',
    overflow: 'hidden',
    // Soft drop shadow (iOS only — Android elevation looks bad against
    // the dark background; the gold gradient + light border carry the
    // depth on their own).
    shadowColor: '#FFC83D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
