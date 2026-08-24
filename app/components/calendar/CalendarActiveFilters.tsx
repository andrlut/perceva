import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarFilter } from '@/lib/calendar/filters';
import { useCalendarStore } from '@/lib/calendar/store';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { moodLevel } from '@/lib/mood';
import { tokens } from '@/theme';

/**
 * The echo of the filter, sitting under the front chips.
 *
 * Every active facet gets a chip that says what it is and removes itself when
 * tapped. Without this row a filter is invisible state: the user sees a month
 * where two thirds of the days are dim and has to remember, or go hunting in
 * the sheet, to find out why. One chip per FACET (not per value) so the row
 * stays short — "Mood: Great/Good" is one decision and reads as one chip.
 */

interface Props {
  filter: CalendarFilter;
  /** Task id → title, for the practice facet. */
  taskTitles: Map<string, string>;
  /** Mood-tag slug → translated label. */
  tagLabels: Map<string, string>;
}

export function CalendarActiveFilters({ filter, taskTitles, tagLabels }: Props) {
  const { t } = useT();
  const meta = useMetaLookup();
  const clearFacet = useCalendarStore((s) => s.clearFacet);

  const chips: { facet: keyof CalendarFilter; label: string }[] = [];

  if (filter.moods.length > 0) {
    const names = [...filter.moods]
      .sort((a, b) => a - b)
      .map((m) => t(`mood.levels.${moodLevel(m).key}`));
    chips.push({ facet: 'moods', label: `${t('calendar.filter.moods')}: ${names.join(' / ')}` });
  }
  if (filter.taskIds.length > 0) {
    const names = filter.taskIds.map((id) => taskTitles.get(id) ?? '—');
    chips.push({ facet: 'taskIds', label: names.join(' / ') });
  }
  if (filter.dims.length > 0) {
    chips.push({ facet: 'dims', label: filter.dims.map((d) => meta.dim(d).label).join(' / ') });
  }
  if (filter.subs.length > 0) {
    chips.push({ facet: 'subs', label: filter.subs.map((s) => meta.sub(s).label).join(' / ') });
  }
  if (filter.tagIds.length > 0) {
    const names = filter.tagIds.map((slug) => tagLabels.get(slug) ?? slug);
    chips.push({ facet: 'tagIds', label: names.join(' / ') });
  }
  if (filter.minXp > 0) {
    chips.push({ facet: 'minXp', label: t('calendar.filter.minXpValue', { xp: filter.minXp }) });
  }
  if (filter.withRedemption) {
    chips.push({ facet: 'withRedemption', label: t('calendar.filter.withRedemption') });
  }

  if (chips.length === 0) return null;

  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <Pressable
          key={chip.facet}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            clearFacet(chip.facet);
          }}
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={chip.label}
        >
          <Text style={styles.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
          <Ionicons name="close" size={12} color={tokens.brand.violet2} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: tokens.space[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(123, 92, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.5)',
  },
  chipText: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
  },
});
