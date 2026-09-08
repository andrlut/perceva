import { memo, useCallback, type ReactElement } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import type { IdeaCardData, IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * Two-column grid of absorbed idea cards — the body of "Minhas ideias".
 * Every card here is collected (gold rim), the flip is reveal-only (no
 * `onFirstFlip`, so no RPC ever fires from this screen) and the round arrow
 * in the top-right corner of the back (`openAffordance="corner"`) hands the
 * card to `onOpen` — the only surface where a card opens its idea itself.
 *
 * The parent owns filtering and the empty state; this component only lays
 * cards out at `collectionCardWidth(screenWidth)`.
 */

/** Gutter between cards and against the screen edges. */
const GAP = tokens.space[4];

/** Two cards + three gutters across the screen, whole pixels. */
export function collectionCardWidth(screenWidth: number): number {
  return Math.floor((screenWidth - 3 * GAP) / 2);
}

interface Props {
  cards: IdeaCardData[];
  locale: IdeaLocale;
  /** Fired by the corner arrow on the back face. */
  onOpen: (card: IdeaCardData) => void;
  ListEmptyComponent?: ReactElement | null;
  /** Extra bottom padding (safe-area / gesture-bar clearance). */
  paddingBottom?: number;
}

const keyExtractor = (c: IdeaCardData) => `${c.materialId}:${c.id}`;
const RowSep = () => <View style={styles.rowSep} />;

interface CellProps {
  data: IdeaCardData;
  width: number;
  locale: IdeaLocale;
  onOpen: (card: IdeaCardData) => void;
}

/** One cell — binds `onOpen` to its card so `IdeaCard`'s memo keeps paying. */
const Cell = memo(function Cell({ data, width, locale, onOpen }: CellProps) {
  const open = useCallback(() => onOpen(data), [onOpen, data]);
  return (
    <IdeaCard
      data={data}
      width={width}
      locale={locale}
      collected
      onOpen={open}
      openAffordance="corner"
    />
  );
});

export function CollectionGrid({
  cards,
  locale,
  onOpen,
  ListEmptyComponent = null,
  paddingBottom = 0,
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const cardW = collectionCardWidth(screenW);

  const renderItem = useCallback(
    ({ item }: { item: IdeaCardData }) => (
      <Cell data={item} width={cardW} locale={locale} onOpen={onOpen} />
    ),
    [cardW, locale, onOpen],
  );

  return (
    <FlatList
      data={cards}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      ItemSeparatorComponent={RowSep}
      contentContainerStyle={[styles.content, { paddingBottom: paddingBottom + GAP }]}
      ListEmptyComponent={ListEmptyComponent}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={5}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    // flexGrow so an empty component can center itself in the free space.
    flexGrow: 1,
    paddingHorizontal: GAP,
    paddingTop: GAP,
  },
  row: {
    gap: GAP,
  },
  rowSep: {
    height: GAP,
  },
});
