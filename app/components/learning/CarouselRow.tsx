import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';

import type { LearningFeedCard } from '@/lib/api/learning';
import { tokens } from '@/theme';

import { COVER_WIDTH, CoverCard } from './CoverCard';

/**
 * Espaço entre cards. Vive aqui e NÃO em `styles.scroll` como `gap`:
 * o separador da FlatList já o desenha, e um `gap` somando por cima faria
 * o `getItemLayout` mentir sobre o offset de cada célula.
 */
const GAP = 12;
const STRIDE = COVER_WIDTH + GAP;

const Sep = () => <View style={{ width: GAP }} />;
const keyExtractor = (c: LearningFeedCard) => c.id;
const getItemLayout = (_: unknown, index: number) => ({
  length: COVER_WIDTH,
  offset: STRIDE * index,
  index,
});

/**
 * A Netflix/Headway-style horizontal carousel. Section header + horizontal
 * scroll of CoverCards. Empty rows are dropped by the parent (don't pass
 * them in).
 */

interface Props {
  title: string;
  /** Optional small icon shown beside the header text. */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Optional accent color for the icon + a faint left-bar on the header. */
  accentColor?: string;
  cards: LearningFeedCard[];
  readSet: Set<string>;
  onCardPress: (card: LearningFeedCard) => void;
  /** Optional small count shown next to the title (e.g. "12"). */
  count?: number;
}

export const CarouselRow = memo(function CarouselRow({
  title,
  iconName,
  accentColor,
  cards,
  readSet,
  onCardPress,
  count,
}: Props) {
  const renderItem = useCallback(
    ({ item }: { item: LearningFeedCard }) => (
      <CoverCard
        card={item}
        read={readSet.has(item.id)}
        onPress={onCardPress}
      />
    ),
    [readSet, onCardPress],
  );

  if (cards.length === 0) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {iconName && (
          <View style={[styles.iconWrap, { backgroundColor: (accentColor ?? tokens.brand.violet2) + '22' }]}>
            <Ionicons
              name={iconName}
              size={14}
              color={accentColor ?? tokens.brand.violet2}
            />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {count !== undefined && (
          <Text style={styles.count}>{count}</Text>
        )}
      </View>

      {/* FlatList, não ScrollView: com o catálogo cheio o ScrollView montava
          TODOS os cards de TODAS as linhas de uma vez. Aqui ficam ~4 vivos
          por linha, que é de onde vem o grosso do ganho de memória. */}
      <FlatList
        horizontal
        data={cards}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        ItemSeparatorComponent={Sep}
        getItemLayout={getItemLayout}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    marginBottom: tokens.space[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[4],
    marginBottom: 10,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
    letterSpacing: 0.2,
  },
  count: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.dim,
    backgroundColor: tokens.bg.glass,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  scroll: {
    paddingHorizontal: tokens.space[4],
  },
});
