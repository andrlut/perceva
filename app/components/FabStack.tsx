import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ACTIVE_THEME, tokens } from '@/theme';

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

/** Button diameters. Exported because the scroll a stack floats over has
 *  to reserve the stack's height — see `fabStackClearance`. */
export const FAB_DIAMETER: Record<FabSize, number> = { sm: 38, md: 48, lg: 56 };
const DEFAULT_ICON: Record<FabSize, number> = { sm: 18, md: 22, lg: 24 };

/** Space between stacked buttons. */
export const FAB_GAP = tokens.space[2];

/** Space between `bottomOffset` and the lowest button. */
export const FAB_BOTTOM_GAP = 16;

/**
 * How much screen a FAB stack occupies ABOVE its `bottomOffset`. Add it to
 * the `paddingBottom` of the scroll the stack floats over — otherwise the
 * scroll's last item ends up under the buttons.
 *
 * Why this exists: the stack is `position: 'absolute'`, outside the scroll,
 * and nothing ever told the scroll how tall it is. The only contract was
 * `bottomOffset`, which places the stack's BASE; the buttons then grow
 * upward from there. Screens reserved `bottomOffset` and nothing else, so
 * the whole stack sat over the end of the content — 128px on Home and 174
 * on Rewards, with the mood check-in (Home's last card) entirely under it.
 * History was the only screen that got it right, by a hand-computed `+ 72`
 * — which is exactly this function for one `lg` button.
 *
 * Pure and static on purpose: the sizes are already in the `actions` the
 * screen writes, so measuring with onLayout would only add a first-frame
 * jump. It covers the VISUAL stack; each button's `hitSlop={8}` still
 * reaches a few px above it.
 *
 * On screens with a bottom tour tooltip use
 * `Math.max(tourBottomBump, fabStackClearance(...))`, NEVER the sum — the
 * tooltip gap already clears the stack, and summing pushes tour targets
 * that auto-scroll to the end out of their calibrated spot. That only holds
 * because `bottomOffset` is the RAW nav clearance (see Props): a stack that
 * rose with the tooltip would need the sum.
 */
export function fabStackClearance(sizes: readonly FabSize[]): number {
  if (sizes.length === 0) return 0;
  const buttons = sizes.reduce((sum, s) => sum + FAB_DIAMETER[s], 0);
  return FAB_BOTTOM_GAP + buttons + FAB_GAP * (sizes.length - 1);
}

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
      style={[styles.wrap, { bottom: bottomOffset + FAB_BOTTOM_GAP }]}
      pointerEvents="box-none"
    >
      {actions
        .filter((a) => !a.hidden)
        .map((a) => {
          const size = a.size ?? 'md';
          const tone = a.tone ?? 'neutral';
          const diameter = FAB_DIAMETER[size];
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
                color={
                  tone === 'violet'
                    ? // Dark ink pops on the pale dark-theme violet; the
                      // deeper light-theme violet needs white.
                      ACTIVE_THEME === 'light'
                      ? '#FFFFFF'
                      : '#1E1348'
                    : tokens.text.mid
                }
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
    gap: FAB_GAP,
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
    // Glass token — navy on dark, porcelain on light (the hardcoded navy
    // was the "calendário escuro" of the light-theme test).
    backgroundColor: tokens.bg.glassStrong,
    borderColor: tokens.border.base,
    shadowOpacity: 0,
  },
  violet: {
    backgroundColor: tokens.brand.violet2,
    borderColor: 'rgba(217, 219, 250, 0.45)',
    shadowColor: tokens.brand.violet2,
  },
});
