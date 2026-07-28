import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { tokens } from '@/theme';

export type FabTone = 'neutral' | 'violet';
export type FabSize = 'sm' | 'md' | 'lg';

export interface FabAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  /** sm 38 / md 48 / lg 56 — matches the RewardsFabStack size ladder. */
  size?: FabSize;
  tone?: FabTone;
  /** Override the size-derived icon glyph size. */
  iconSize?: number;
  /** Skip rendering this action entirely (conditional buttons). */
  hidden?: boolean;
  /** Optional wrapper around the rendered button — e.g. a tour TourTarget. */
  wrap?: (node: ReactNode) => ReactNode;
}

interface Props {
  /** Distance from the screen bottom. Pass the RAW bottom-nav clearance,
   *  never a tour-bumped value, or the stack leaps up when a bottom
   *  tooltip shows. */
  bottomOffset: number;
  /** Rendered top → bottom in array order; put the primary action LAST so
   *  it anchors the thumb zone. */
  actions: FabAction[];
}

const DIAMETER: Record<FabSize, number> = { sm: 38, md: 48, lg: 56 };
const DEFAULT_ICON: Record<FabSize, number> = { sm: 18, md: 22, lg: 24 };

const pressedFx = { opacity: 0.85, transform: [{ scale: 0.96 }] };

/**
 * Generic floating action stack — bottom-right thumb zone. The shared
 * primitive behind the app's FAB clusters: a column of circular buttons
 * that grows/shrinks with its `actions` and lets taps fall through the
 * empty gaps (`box-none`). Visually matches the RewardsFabStack spec
 * (38/48/56 diameters, violet primary, neutral utilities) so the Rewards
 * and Tasks stacks read as cousins.
 */
export function FabStack({ bottomOffset, actions }: Props) {
  return (
    <View
      style={[styles.wrap, { bottom: bottomOffset + 16 }]}
      pointerEvents="box-none"
    >
      {actions
        .filter((a) => !a.hidden)
        .map((a) => {
          const size = a.size ?? 'md';
          const tone = a.tone ?? 'neutral';
          const diameter = DIAMETER[size];
          const button = (
            <Pressable
              key={a.key}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.accessibilityLabel}
              hitSlop={8}
              style={({ pressed }) => [
                styles.fab,
                { width: diameter, height: diameter, borderRadius: diameter / 2 },
                tone === 'violet' ? styles.violet : styles.neutral,
                pressed && pressedFx,
              ]}
            >
              <Ionicons
                name={a.icon}
                size={a.iconSize ?? DEFAULT_ICON[size]}
                color={tone === 'violet' ? '#1E1348' : tokens.text.mid}
              />
            </Pressable>
          );
          return a.wrap ? (
            <View key={a.key} pointerEvents="box-none">
              {a.wrap(button)}
            </View>
          ) : (
            button
          );
        })}
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
  // Shared circle-button base; per-tone styles add color + shadow.
  // Shadows are iOS-only by design — Android elevation looks bad against
  // the dark background; borders carry the depth there.
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  neutral: {
    backgroundColor: 'rgba(20, 24, 56, 0.92)',
    borderColor: tokens.border.base,
    shadowOpacity: 0,
  },
  violet: {
    backgroundColor: tokens.brand.violet2,
    borderColor: 'rgba(217, 219, 250, 0.45)',
    shadowColor: tokens.brand.violet2,
  },
});
