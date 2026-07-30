import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { LearningFeedCard } from '@/lib/api/learning';
import type { DimensionId, LearningMaterialType, SubId } from '@/lib/db/types';
import { useT, type TranslateOptions } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * Filter applied to the Learn feed via a tap inside the filter sheet.
 * Selecting an active filter again clears it. (Type moved here from the
 * retired inline LearningStatsPanel.)
 */
export type PillFilter =
  | { kind: 'dim'; value: DimensionId }
  | { kind: 'type'; value: LearningMaterialType }
  | { kind: 'sub'; value: SubId }
  | null;

/**
 * Bottom-sheet filter for the Learn feed — opened by the floating filter
 * button, mirroring the app's TrackPickerSheet vocabulary (Modal +
 * slide-up + backdrop/handle/close). Every counter is a clickable filter:
 * tap a dim / type / sub to filter, tap the active one again to clear.
 * Picking applies + closes; the applied filter surfaces via the inline
 * ActiveFilterChip on the feed.
 */

interface Props {
  visible: boolean;
  onClose: () => void;
  cards: LearningFeedCard[];
  readSet: Set<string>;
  filter: PillFilter;
  onFilterChange: (next: PillFilter) => void;
}

const TYPES: LearningMaterialType[] = ['explainer', 'summary', 'news'];

function typeLabel(type: LearningMaterialType, t: Translator): string {
  return t(`learning.type.${type}`);
}

function isActive(filter: PillFilter, kind: 'dim' | 'type' | 'sub', value: string): boolean {
  return !!filter && filter.kind === kind && filter.value === value;
}

export function LearningFilterSheet({
  visible,
  onClose,
  cards,
  readSet,
  filter,
  onFilterChange,
}: Props) {
  const { t } = useT();
  const meta = useMetaLookup();

  const stats = useMemo(() => {
    const total = cards.length;
    const read = cards.filter((c) => readSet.has(c.id)).length;

    const perSub = new Map<SubId, { read: number; total: number }>();
    for (const c of cards) {
      for (const sub of c.subs) {
        const slot = perSub.get(sub) ?? { read: 0, total: 0 };
        slot.total += 1;
        if (readSet.has(c.id)) slot.read += 1;
        perSub.set(sub, slot);
      }
    }

    const perType = new Map<LearningMaterialType, { read: number; total: number }>();
    for (const c of cards) {
      const slot = perType.get(c.type) ?? { read: 0, total: 0 };
      slot.total += 1;
      if (readSet.has(c.id)) slot.read += 1;
      perType.set(c.type, slot);
    }

    return { total, read, perSub, perType };
  }, [cards, readSet]);

  // Tap a filter → apply (or clear if re-tapping the active one) → close.
  const pick = (next: NonNullable<PillFilter>) => {
    Haptics.selectionAsync().catch(() => {});
    if (filter && filter.kind === next.kind && filter.value === next.value) {
      onFilterChange(null);
    } else {
      onFilterChange(next);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('learning.filter.title')}</Text>
              <Text style={styles.subtitle}>
                {t('learning.filter.subtitle', {
                  read: stats.read,
                  total: stats.total,
                })}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={tokens.text.mid} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Per-dim grid */}
            <Text style={styles.section}>{t('learning.stats.byDim')}</Text>
            <View style={styles.grid}>
              {DIMENSION_ORDER.map((dimId: DimensionId) => {
                const dim = meta.dim(dimId);
                const subs = SUBS_BY_DIM[dimId];
                const read = subs.reduce(
                  (acc, s) => acc + (stats.perSub.get(s)?.read ?? 0),
                  0,
                );
                const total = subs.reduce(
                  (acc, s) => acc + (stats.perSub.get(s)?.total ?? 0),
                  0,
                );
                const active = isActive(filter, 'dim', dimId);
                return (
                  <Pressable
                    key={dimId}
                    onPress={() => pick({ kind: 'dim', value: dimId })}
                    style={({ pressed }) => [
                      styles.cell,
                      {
                        borderColor: active ? dim.color : dim.color + '55',
                        backgroundColor: active ? dim.bg : tokens.bg.glassStrong,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={dim.iconName as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={dim.color}
                    />
                    <Text style={[styles.cellLabel, { color: active ? dim.color : tokens.text.base }]}>
                      {dim.label}
                    </Text>
                    <Text style={styles.cellRatio}>
                      <Text style={{ color: dim.color }}>{read}</Text>
                      <Text style={styles.ratioSep}>/{total}</Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Per-type row */}
            <Text style={styles.section}>{t('learning.stats.byType')}</Text>
            <View style={styles.typeRow}>
              {TYPES.map((type) => {
                const slot = stats.perType.get(type) ?? { read: 0, total: 0 };
                const active = isActive(filter, 'type', type);
                const disabled = slot.total === 0;
                return (
                  <Pressable
                    key={type}
                    disabled={disabled}
                    onPress={() => pick({ kind: 'type', value: type })}
                    style={({ pressed }) => [
                      styles.typePill,
                      active && styles.typePillActive,
                      disabled && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                      {typeLabel(type, t)}
                    </Text>
                    <Text style={styles.typeRatio}>
                      <Text style={{ color: tokens.brand.violet2 }}>{slot.read}</Text>
                      <Text style={styles.ratioSep}>/{slot.total}</Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Subs with content */}
            {stats.perSub.size > 0 && (
              <>
                <Text style={styles.section}>{t('learning.stats.bySub')}</Text>
                <View style={styles.subRow}>
                  {Array.from(stats.perSub.entries()).map(([subId, slot]) => {
                    const sub = meta.sub(subId);
                    const dim = meta.dim(SUB_META[subId].dimensionId);
                    const active = isActive(filter, 'sub', subId);
                    return (
                      <Pressable
                        key={subId}
                        onPress={() => pick({ kind: 'sub', value: subId })}
                        style={({ pressed }) => [
                          styles.subPill,
                          {
                            borderColor: active ? dim.color : dim.color + '44',
                            backgroundColor: active ? dim.bg : tokens.bg.glassStrong,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name={SUB_META[subId].iconName as keyof typeof Ionicons.glyphMap}
                          size={11}
                          color={dim.color}
                        />
                        <Text style={[styles.subLabel, active && { color: dim.color }]}>
                          {sub.label}
                        </Text>
                        <Text style={styles.subRatio}>
                          <Text style={{ color: dim.color }}>{slot.read}</Text>
                          <Text style={styles.ratioSep}>/{slot.total}</Text>
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Clear — only when a filter is set */}
            {filter && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onFilterChange(null);
                  onClose();
                }}
                style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close-circle" size={16} color={tokens.text.mid} />
                <Text style={styles.clearText}>{t('learning.filter.clear')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    borderTopWidth: 1,
    borderColor: tokens.border.strong,
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[6],
    maxHeight: '82%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.text.faint,
    marginBottom: tokens.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
    marginBottom: tokens.space[3],
  },
  title: {
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  subtitle: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  body: {
    gap: 10,
    paddingBottom: tokens.space[2],
  },
  section: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexBasis: '48%',
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
  },
  cellLabel: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  cellRatio: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },
  ratioSep: {
    color: tokens.text.dim,
    fontFamily: 'Manrope_500Medium',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  typePillActive: {
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
    borderColor: tokens.brand.violet2,
  },
  typeLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  typeLabelActive: {
    color: tokens.brand.violet2,
  },
  typeRatio: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  subLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.mid,
  },
  subRatio: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  clearText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
});
