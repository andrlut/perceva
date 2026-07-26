import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** Number of banked rewards waiting — feeds the accessibility label.
   *  The wallet button only renders when > 0. */
  bankCount: number;
  /** Distance from the bottom of the screen — caller should pass the
   *  bottom-nav clearance so the stack doesn't sit underneath the tab bar. */
  bottomOffset: number;
  onCreate: () => void;
  onManage: () => void;
  onBank: () => void;
}

/**
 * Floating action stack for the Rewards screen — bottom-right corner,
 * inside the thumb zone. Replaces the old top-right header icons
 * (small, far from the thumb, visually noisy over the hero).
 *
 * Order top→bottom mirrors frequency of use inverted: the rarest
 * (manage, small + discreet) sits highest, create (violet, the main
 * growth action) in the middle, and the gold wallet — continuation of
 * the purchase journey — anchors the corner. The wallet renders only
 * when there's something banked, so the stack gracefully shrinks to
 * two buttons.
 */
export function RewardsFabStack({
  bankCount,
  bottomOffset,
  onCreate,
  onManage,
  onBank,
}: Props) {
  const { t } = useT();
  return (
    <View
      style={[styles.wrap, { bottom: bottomOffset + 16 }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onManage}
        style={({ pressed }) => [
          styles.manageFab,
          pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('rewards.manage.title')}
        hitSlop={8}
      >
        <Ionicons name="settings-outline" size={18} color={tokens.text.mid} />
      </Pressable>

      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [
          styles.createFab,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('reward.form.newTitle')}
        hitSlop={8}
      >
        <Ionicons name="add" size={26} color="#1E1348" />
      </Pressable>

      {bankCount > 0 && (
        <Pressable
          onPress={onBank}
          style={({ pressed }) => [
            styles.bankFab,
            pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('rewards.vault.tabs.bank', { count: bankCount })}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    // bottom is overridden inline per caller offset
    alignItems: 'center',
    gap: tokens.space[2],
  },
  manageFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 24, 56, 0.92)',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  createFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet2,
    borderWidth: 1,
    borderColor: 'rgba(217, 219, 250, 0.45)',
    shadowColor: tokens.brand.violet2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  bankFab: {
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
