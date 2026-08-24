/**
 * The calendar's Lista view — the agenda ("Programação") read of the same data
 * the grid paints. It serves all three fronts and obeys the same filter.
 *
 * ## Why this one HIDES what the grid only dims
 *
 * The month grid keeps filtered-out days on screen at FILTERED_OUT_OPACITY
 * because the grid's job is the *shape* of the month: 31 boxes that never
 * reflow, so a filter reads as focus rather than as data loss. An agenda has no
 * shape to preserve — it is a sequence of entries, and an entry that says
 * nothing is just a blank line. So here a day has to clear both gates to
 * appear: it survives `dayMatchesFilter` AND the active front `frontHasContent`
 * has something to say about it. A mood-less day is absent from the Humor
 * agenda, not present-and-empty.
 *
 * ## No sticky month headers
 *
 * The parent owns the vertical ScrollView (this component returns content, not
 * a scroller — nesting a second vertical scroller inside it would break both).
 * `stickyHeaderIndices` belongs to the scroller, so it is not ours to set, and
 * RN has no `position: sticky`. Month headers therefore render inline. If the
 * parent ever wants them pinned, this has to become the scroller itself and
 * flatten the groups into a single index-addressable child list.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMoodTags } from '@/lib/api/mood';
import { dayMatchesFilter, type CalendarDay, type CalendarFilter } from '@/lib/calendar/filters';
import { frontHasContent } from '@/lib/calendar/paint';
import type { CalendarFront } from '@/lib/calendar/store';
import { useT } from '@/lib/i18n';
import { moodLevel } from '@/lib/mood';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

interface Props {
  /** Every day of the loaded period, already ordered newest → oldest. */
  days: CalendarDay[];
  front: CalendarFront;
  filter: CalendarFilter;
  /** Opens the day (the parent switches to the month view and selects it). */
  onSelectDay: (dateKey: string) => void;
  locale: 'pt' | 'en';
}

/** One rendered line under a day — the three fronts all collapse into this. */
interface DayEvent {
  key: string;
  /** 3dp left rail color; the only place a front's palette shows up here. */
  rail: string;
  label: string;
  /** Repetitions of the same task on the day; rendered as ×N when > 1. */
  count?: number;
  /** Quiet second line (mood tags today). */
  sub?: string;
  trailing?: string;
  trailingColor?: string;
  /** Renders a check glyph instead of `trailing` (Vault "used" rows). */
  check?: boolean;
}

interface MonthGroup {
  key: string;
  label: string;
  days: CalendarDay[];
}

/** `YYYY-MM-DD` → a LOCAL Date. `new Date(key)` would parse it as UTC. */
function localDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function CalendarListView({ days, front, filter, onSelectDay, locale }: Props) {
  const { t } = useT();
  const catalog = useMoodTags();

  const intlLocale = locale === 'pt' ? 'pt-BR' : 'en-US';

  const groups = useMemo<MonthGroup[]>(() => {
    const out: MonthGroup[] = [];
    for (const day of days) {
      if (!dayMatchesFilter(day, filter)) continue;
      if (!frontHasContent(day, front)) continue;
      const key = day.dateKey.slice(0, 7);
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.days.push(day);
        continue;
      }
      const raw = localDate(`${key}-01`).toLocaleDateString(intlLocale, {
        month: 'long',
        year: 'numeric',
      });
      out.push({
        key,
        label: raw.charAt(0).toUpperCase() + raw.slice(1),
        days: [day],
      });
    }
    return out;
  }, [days, filter, front, intlLocale]);

  const tagLabel = (slug: string): string => {
    const tag = catalog.data?.find((x) => x.slug === slug);
    if (!tag) return slug;
    return locale === 'en' ? tag.label_en : tag.label_pt;
  };

  const eventsFor = (day: CalendarDay): DayEvent[] => {
    if (front === 'humor') {
      const level = moodLevel(day.mood ?? 3);
      // Tag labels drop their emoji here: the sub-line is 11dp on one line, and
      // the glyphs eat the budget before the second tag is readable.
      const tags = day.tagIds.map(tagLabel).join(' · ');
      return [
        {
          key: `${day.dateKey}-mood`,
          rail: level.color,
          label: t(`mood.levels.${level.key}`),
          sub: tags.length > 0 ? tags : undefined,
        },
      ];
    }

    if (front === 'vault') {
      return [...day.redemptions]
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((r) => ({
          key: r.id,
          rail: tokens.semantic.coin,
          label:
            r.kind === 'redeem'
              ? t('calendar.day.redeemed', { title: r.title })
              : t('calendar.day.used', { title: r.title }),
          trailing: r.kind === 'redeem' ? `−${r.cost}` : undefined,
          trailingColor: tokens.semantic.coin,
          check: r.kind === 'use',
        }));
    }

    return [...day.practices]
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((p) => {
        const dim = p.dims.length > 0 ? p.dims[0] : null;
        return {
          key: `${day.dateKey}-${p.taskId}`,
          rail: dim ? DIMENSION_META[dim].color : tokens.brand.violet2,
          label: p.title,
          count: p.count,
          trailing: p.xp > 0 ? `+${p.xp}` : undefined,
          trailingColor: tokens.semantic.xp,
        };
      });
  };

  const renderDay = (day: CalendarDay) => {
    const date = localDate(day.dateKey);
    const weekday = date
      .toLocaleDateString(intlLocale, { weekday: 'short' })
      .replace(/\.$/, '')
      .toUpperCase();
    const level = day.mood !== null ? moodLevel(day.mood) : null;

    return (
      <View key={day.dateKey} style={styles.dayRow}>
        <Pressable
          style={({ pressed }) => [styles.dayCol, pressed && styles.pressed]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onSelectDay(day.dateKey);
          }}
          accessibilityRole="button"
          accessibilityLabel={date.toLocaleDateString(intlLocale, {
            day: 'numeric',
            month: 'long',
          })}
          hitSlop={4}
        >
          <Text style={styles.weekday}>{weekday}</Text>
          <View
            style={[
              styles.dayDisc,
              level ? { backgroundColor: level.color } : styles.dayDiscBare,
            ]}
          >
            <Text style={[styles.dayNum, { color: level ? level.ink : tokens.text.base }]}>
              {date.getDate()}
            </Text>
          </View>
        </Pressable>

        <View style={styles.events}>
          {eventsFor(day).map((ev) => (
            <View key={ev.key} style={styles.event}>
              <View style={[styles.rail, { backgroundColor: ev.rail }]} />
              <View style={styles.eventBody}>
                <View style={styles.eventLine}>
                  <Text style={styles.eventLabel} numberOfLines={1}>
                    {ev.label}
                  </Text>
                  {ev.count !== undefined && ev.count > 1 ? (
                    <Text style={styles.eventCount}>{`×${ev.count}`}</Text>
                  ) : null}
                </View>
                {ev.sub ? (
                  <Text style={styles.eventSub} numberOfLines={1}>
                    {ev.sub}
                  </Text>
                ) : null}
              </View>
              {ev.check ? (
                <Ionicons name="checkmark" size={14} color={tokens.semantic.xp} />
              ) : ev.trailing ? (
                <Text
                  style={[styles.eventTrailing, { color: ev.trailingColor ?? tokens.text.base }]}
                >
                  {ev.trailing}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{t('calendar.list.hint')}</Text>

      {groups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>{t('calendar.list.empty')}</Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={styles.monthHeader}>{group.label}</Text>
            {group.days.map(renderDay)}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.space[3],
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10.5,
    color: tokens.text.dim,
  },
  group: {
    gap: tokens.space[2],
  },
  monthHeader: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.brand.violet2,
    backgroundColor: tokens.bg.deep,
    paddingVertical: 6,
  },
  dayRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
    marginBottom: tokens.space[2],
  },
  // Fixed 52dp gutter: every event line in the agenda starts at the same x, so
  // the column of day discs reads as a spine down the list.
  dayCol: {
    width: 52,
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  weekday: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: tokens.text.dim,
  },
  dayDisc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDiscBare: {
    backgroundColor: 'transparent',
  },
  dayNum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
  },
  events: {
    flex: 1,
    gap: 5,
  },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  eventBody: {
    flex: 1,
    gap: 1,
  },
  eventLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventLabel: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  eventCount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  eventSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
  },
  eventTrailing: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: tokens.space[7],
  },
  empty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.faint,
    textAlign: 'center',
  },
});
