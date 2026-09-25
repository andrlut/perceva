import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import type { DimensionId } from '@/lib/db/types';
import type { IdeaCardData, IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * One shelf of "Minhas ideias": a dimension header (icon, label, count) over
 * a horizontal row of that dimension's absorbed cards — the same sideways
 * gesture as the Recanto's rails, so the collection reads as the Recanto's
 * own shelf instead of one mixed grid.
 *
 * Every card here is collected, so they render `quiet` (no gold rim or
 * check: being on the shelf already says it) and carry only their own
 * content — no material kicker. The flip is reveal-only (no `onFirstFlip`,
 * so no RPC ever fires from here) and the round arrow on the back
 * (`openAffordance="corner"`) hands the card to `onOpen`.
 *
 * Cards are sized so ~2⅓ fit across the screen: the cut-off third is the
 * cue that the row scrolls.
 */

/** Gutter between cards; the screen edge inset is `tokens.space[4]`. */
const GAP = 10;
const EDGE = tokens.space[4];
/** Cards visible across the screen, the fraction being the scroll cue. */
const CARDS_ACROSS = 2.35;

/** Shelf card width for a screen width, whole pixels, kept between the rail and a roomy tile. */
export function shelfCardWidth(screenWidth: number): number {
  const raw = Math.floor((screenWidth - EDGE - 2 * GAP) / CARDS_ACROSS);
  return Math.max(132, Math.min(190, raw));
}

interface Props {
  dimensionId: DimensionId;
  /** Localized dimension label. */
  label: string;
  cards: IdeaCardData[];
  cardWidth: number;
  locale: IdeaLocale;
  onOpen: (card: IdeaCardData) => void;
}

const keyExtractor = (c: IdeaCardData) => `${c.materialId}:${c.id}`;

interface CellProps {
  data: IdeaCardData;
  width: number;
  locale: IdeaLocale;
  onOpen: (card: IdeaCardData) => void;
}

/** One card — binds `onOpen` to its data so `IdeaCard`'s memo keeps paying. */
const Cell = memo(function Cell({ data, width, locale, onOpen }: CellProps) {
  const open = useCallback(() => onOpen(data), [onOpen, data]);
  return (
    <IdeaCard
      data={data}
      width={width}
      locale={locale}
      collected
      quiet
      onOpen={open}
      openAffordance="corner"
    />
  );
});

export const IdeaShelf = memo(function IdeaShelf({
  dimensionId,
  label,
  cards,
  cardWidth,
  locale,
  onOpen,
}: Props) {
  const dim = DIMENSION_META[dimensionId];

  const renderItem = useCallback(
    ({ item }: { item: IdeaCardData }) => (
      <Cell data={item} width={cardWidth} locale={locale} onOpen={onOpen} />
    ),
    [cardWidth, locale, onOpen],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons
          name={dim.iconName as keyof typeof Ionicons.glyphMap}
          size={15}
          color={dim.color}
        />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.count}>{cards.length}</Text>
      </View>
      <FlatList
        horizontal
        data={cards}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: tokens.space[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: EDGE,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  count: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.dim,
  },
  row: {
    paddingHorizontal: EDGE,
    gap: GAP,
  },
});
