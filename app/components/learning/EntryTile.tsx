import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { TourTarget } from '@/components/tour/TourTarget';
import { tokens } from '@/theme';

/**
 * The shell of the Recanto's entry tiles — Explorar and Treinar share one
 * row, so they share one anatomy: an art slot on the left, a title and one
 * line of count on the right, glass with the gold rim. The art slot has a
 * fixed height (ENTRY_TILE_ART_HEIGHT) that every art sizes itself to, so
 * two tiles side by side always come out the same height.
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
  a11yLabel,
  onPress,
  tourTargetId,
  style,
}: {
  art: ReactNode;
  title: string;
  subtitle: string;
  a11yLabel?: string;
  onPress?: () => void;
  /** Tour spotlight id for the tile (inside the screen padding). */
  tourTargetId?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const card = (
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
      </View>
    </Pressable>
  );
  return (
    <View style={style}>
      {tourTargetId ? (
        <TourTarget id={tourTargetId} radius={tokens.radius.lg}>
          {card}
        </TourTarget>
      ) : (
        card
      )}
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
});
