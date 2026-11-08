import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/theme';

/**
 * The shell of the Recanto's entry tiles — Explorar, Treinar and Continue
 * lendo are siblings at the top of the tab, so they share one anatomy: an
 * art slot on the left, a title and one line of detail on the right, glass
 * with the gold rim. The art slot has a fixed height (ENTRY_TILE_ART_HEIGHT)
 * that every art sizes itself to, so two tiles side by side always come out
 * the same height. `progress` adds a thin gold bar under the detail line
 * (Continue lendo's how-far-along).
 *
 * Kept compact on purpose: the tab is about the materials below, and the
 * entry row must not eat the first screen. The row's gutter lives in the
 * parent. Without `onPress` the tile is inert (the guides' replica).
 */

export const ENTRY_TILE_ART_HEIGHT = 42;

export function EntryTile({
  art,
  title,
  subtitle,
  progress,
  a11yLabel,
  onPress,
  style,
}: {
  art: ReactNode;
  title: string;
  subtitle: string;
  /** 0..100 — draws the gold progress bar under the subtitle. */
  progress?: number;
  a11yLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? `${title} · ${subtitle}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
        <View style={styles.art}>{art}</View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          {progress != null ? (
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]}
              >
                <LinearGradient
                  colors={tokens.gradient.rewardBarFill}
                  locations={tokens.gradient.rewardBarFillLocations}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  art: {
    height: ENTRY_TILE_ART_HEIGHT,
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
    marginTop: 1,
  },
  barTrack: {
    height: 3,
    marginTop: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: tokens.border.divider,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
});
