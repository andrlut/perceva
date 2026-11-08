import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fragment, useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { LearningFeedCard } from '@/lib/api/learning';
import type { DimensionId, LearningMaterialCategory, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { CATEGORY_META, CATEGORY_ORDER, categoryOf } from '@/lib/learningCategory';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

/**
 * Category / dimension / sub-area filter of the Recanto feed. Exclusive:
 * one at a time, tapping the lit chip again clears it.
 */
export type PillFilter =
  | { kind: 'dim'; value: DimensionId }
  | { kind: 'category'; value: LearningMaterialCategory }
  | { kind: 'sub'; value: SubId }
  | null;

/**
 * Read-state filter of the Recanto feed. The tab owns the state; the
 * default is `unread` (Pendentes), anything else is a narrowed feed.
 */
export type ReadFilter = 'all' | 'unread' | 'read';

const READ_FILTERS: { key: ReadFilter; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'unread', icon: 'bookmark-outline' },
  { key: 'read', icon: 'checkmark-done-outline' },
  { key: 'all', icon: 'layers-outline' },
];

/**
 * The Recanto's filter, on the screen (owner, 2026-11-07: in #335 it had
 * moved into a floating button + bottom sheet, and he asked for it back).
 * One row of chips right above the carousels it narrows, in three groups:
 *
 *   1. read state — a single choice, always one lit (Pendentes by default);
 *   2. category — Pesquisa / Livro / Fundamentos, in their cover colors;
 *   3. dimension — in its own color. The lit dimension opens its sub-areas
 *      right beside it, so the sub filter costs no row of its own.
 *
 * Groups 2 and 3 share ONE exclusive PillFilter, as in the old sheet: tap a
 * chip to filter, tap the lit one again to clear — except a lit sub-area,
 * which steps back to its dimension. A lit chip is filled in its color and
 * the clearable ones carry an ×, so the state reads without any dot.
 * Categories and dimensions with no material are left out.
 *
 * `layout="scroll"` (the tab) is one horizontal line; `"wrap"` breaks the
 * groups into lines — the guide's replica, which has to show every chip.
 */
export function LearningFilterRow({
  cards,
  readSet,
  filter,
  onFilterChange,
  readFilter,
  onReadFilterChange,
  layout = 'scroll',
  gutter = tokens.space[4],
}: {
  cards: LearningFeedCard[];
  readSet: Set<string>;
  filter: PillFilter;
  onFilterChange: (next: PillFilter) => void;
  readFilter: ReadFilter;
  onReadFilterChange: (next: ReadFilter) => void;
  layout?: 'scroll' | 'wrap';
  /** Side padding of the row (scroll layout) — the screen's gutter. */
  gutter?: number;
}) {
  const { t } = useT();
  const meta = useMetaLookup();
  const clearHint = t('learning.filter.clearHint');

  const stats = useMemo(() => {
    const read = cards.filter((c) => readSet.has(c.id)).length;
    const perDim = new Map<DimensionId, number>();
    const perSub = new Map<SubId, number>();
    const perCategory = new Map<LearningMaterialCategory, number>();
    for (const c of cards) {
      perDim.set(c.dimension_id, (perDim.get(c.dimension_id) ?? 0) + 1);
      const category = categoryOf(c);
      perCategory.set(category, (perCategory.get(category) ?? 0) + 1);
      for (const s of c.subs) perSub.set(s, (perSub.get(s) ?? 0) + 1);
    }
    return { total: cards.length, read, perDim, perSub, perCategory };
  }, [cards, readSet]);

  const readCount = (key: ReadFilter): number =>
    key === 'all' ? stats.total : key === 'read' ? stats.read : stats.total - stats.read;

  // The dimension whose sub-areas show: the lit one, or the parent of the
  // lit sub-area.
  const openDim: DimensionId | null =
    filter?.kind === 'dim'
      ? filter.value
      : filter?.kind === 'sub'
        ? SUB_META[filter.value].dimensionId
        : null;

  const pickRead = (next: ReadFilter) => {
    if (next === readFilter) return;
    Haptics.selectionAsync().catch(() => {});
    onReadFilterChange(next);
  };

  const pick = (next: NonNullable<PillFilter>) => {
    Haptics.selectionAsync().catch(() => {});
    if (filter && filter.kind === next.kind && filter.value === next.value) {
      onFilterChange(
        next.kind === 'sub' ? { kind: 'dim', value: SUB_META[next.value].dimensionId } : null,
      );
    } else {
      onFilterChange(next);
    }
  };

  const isLit = (kind: 'dim' | 'category' | 'sub', value: string) =>
    !!filter && filter.kind === kind && filter.value === value;

  const readGroup = READ_FILTERS.map(({ key, icon }) => (
    <Chip
      key={key}
      icon={icon}
      label={t(`learning.readFilter.${key}`)}
      count={readCount(key)}
      accent={tokens.brand.violet2}
      lit={readFilter === key}
      onPress={() => pickRead(key)}
    />
  ));

  const categoryGroup = CATEGORY_ORDER.filter((c) => (stats.perCategory.get(c) ?? 0) > 0).map(
    (category) => (
      <Chip
        key={category}
        icon={CATEGORY_META[category].glyph}
        iconColor={CATEGORY_META[category].color}
        label={t(`learning.category.${category}`)}
        accent={CATEGORY_META[category].color}
        lit={isLit('category', category)}
        clearHint={clearHint}
        onPress={() => pick({ kind: 'category', value: category })}
      />
    ),
  );

  const dimGroup = DIMENSION_ORDER.filter((d) => (stats.perDim.get(d) ?? 0) > 0).map((dimId) => {
    const dim = meta.dim(dimId);
    const subs =
      openDim === dimId ? SUBS_BY_DIM[dimId].filter((s) => (stats.perSub.get(s) ?? 0) > 0) : [];
    return (
      <Fragment key={dimId}>
        <Chip
          icon={dim.iconName as keyof typeof Ionicons.glyphMap}
          iconColor={dim.color}
          label={dim.label}
          accent={dim.color}
          lit={isLit('dim', dimId)}
          // A lit sub-area keeps its dimension outlined: tapping it widens
          // the filter back to the whole dimension.
          outlined={filter?.kind === 'sub' && openDim === dimId}
          clearHint={clearHint}
          onPress={() => pick({ kind: 'dim', value: dimId })}
        />
        {/* Only worth showing when there is something to tell apart. */}
        {subs.length > 1 &&
          subs.map((subId) => (
            <Chip
              key={subId}
              icon={SUB_META[subId].iconName as keyof typeof Ionicons.glyphMap}
              iconColor={dim.color}
              label={meta.sub(subId).label}
              accent={dim.color}
              lit={isLit('sub', subId)}
              clearHint={clearHint}
              small
              onPress={() => pick({ kind: 'sub', value: subId })}
            />
          ))}
      </Fragment>
    );
  });

  const groups: ReactNode[][] = [readGroup, categoryGroup, dimGroup].filter((g) => g.length > 0);

  if (layout === 'wrap') {
    return (
      <View style={styles.wrapCol}>
        {groups.map((g, i) => (
          <View key={i} style={styles.wrapLine}>
            {g}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollRow, { paddingHorizontal: gutter }]}
    >
      {groups.map((g, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={styles.divider} />}
          {g}
        </Fragment>
      ))}
    </ScrollView>
  );
}

/** One chip — the row's only control. Icon + label (+ count) (+ × when lit
 *  and clearable, i.e. given a `clearHint`). Unlit: glass with the icon in
 *  its domain color; lit: filled and rimmed in that color. */
function Chip({
  icon,
  iconColor = tokens.text.mid,
  label,
  count,
  accent,
  lit,
  outlined = false,
  clearHint,
  small = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  count?: number;
  /** Domain color — hex, so the 18% fill is `accent + '2E'`. */
  accent: string;
  lit: boolean;
  outlined?: boolean;
  /** Set on toggle chips (tap the lit one again to clear); its presence is
   *  what draws the × and announces the hint. */
  clearHint?: string;
  small?: boolean;
  onPress: () => void;
}) {
  const clearable = clearHint != null;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole="button"
      accessibilityState={{ selected: lit }}
      accessibilityLabel={count != null ? `${label}, ${count}` : label}
      accessibilityHint={lit ? clearHint : undefined}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        outlined && { borderColor: accent },
        lit && { backgroundColor: accent + '2E', borderColor: accent },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={small ? 11 : 13} color={lit ? accent : iconColor} />
      <Text
        style={[styles.label, small && styles.labelSmall, (lit || outlined) && { color: accent }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count != null && (
        <Text style={[styles.count, small && styles.labelSmall, lit && { color: accent }]}>
          {count}
        </Text>
      )}
      {lit && clearable && <Ionicons name="close" size={small ? 11 : 13} color={accent} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrapCol: { gap: 6 },
  wrapLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  divider: {
    width: 1,
    height: 18,
    marginHorizontal: 2,
    backgroundColor: tokens.border.strong,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.glassStrong,
  },
  chipSmall: {
    height: 28,
    paddingHorizontal: 10,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  labelSmall: { fontSize: 11 },
  count: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  pressed: { opacity: 0.7 },
});
