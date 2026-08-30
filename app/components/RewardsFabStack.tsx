import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
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
  /** Render the wallet even with an empty bank — the M4 tour spotlights
   *  it, and a fresh user hasn't bought anything yet. */
  forceBank?: boolean;
  /** Wrapper around the wallet FAB — the Rewards screen passes a
   *  TourTarget here so M4 step 3 can anchor its spotlight (same
   *  pattern as TasksFabStack's seeAllWrap). */
  bankWrap?: (node: ReactNode) => ReactNode;
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
const pressedFx = { opacity: 0.85, transform: [{ scale: 0.96 }] };

export function RewardsFabStack({
  bankCount,
  bottomOffset,
  onCreate,
  onManage,
  onBank,
  forceBank = false,
  bankWrap = (node) => node,
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
          styles.fab,
          styles.manageFab,
          pressed && pressedFx,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('rewards.manage.title')}
        hitSlop={8}
      >
        {/* Sliders, not gear — gear is reserved for the Settings tab so
            "manage" surfaces don't read as app settings. */}
        <Ionicons name="options-outline" size={18} color={tokens.text.mid} />
      </Pressable>

      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [
          styles.fab,
          styles.createFab,
          pressed && pressedFx,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('reward.form.newTitle')}
        hitSlop={8}
      >
        <Ionicons name="add" size={26} color="#1E1348" />
      </Pressable>

      {(bankCount > 0 || forceBank) &&
        bankWrap(
          <Pressable
            onPress={onBank}
            style={({ pressed }) => [
              styles.fab,
              styles.bankFab,
              pressed && pressedFx,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('rewards.vault.tabs.bank', { count: bankCount })}
            hitSlop={8}
          >
            <LinearGradient
              colors={tokens.gradient.coinBtn}
              locations={tokens.gradient.coinBtnLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="wallet" size={24} color="#3D2A00" />
          </Pressable>,
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
  // Shared circle-button base; per-button styles add size + color.
  // Shadows are iOS-only by design — Android elevation looks bad
  // against the dark background; borders carry the depth there.
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  manageFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20, 24, 56, 0.92)',
    borderColor: tokens.border.base,
    shadowOpacity: 0,
  },
  createFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.brand.violet2,
    borderColor: 'rgba(217, 219, 250, 0.45)',
    shadowColor: tokens.brand.violet2,
  },
  bankFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderColor: 'rgba(255,224,138,0.6)',
    overflow: 'hidden',
    shadowColor: '#FFC83D',
  },
});
