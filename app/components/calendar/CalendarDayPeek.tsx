import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { MoodFace } from '@/components/mood/MoodFace';
import {
  byXpDesc,
  fitLines,
  openDayTarget,
  outsideScope,
  practiceLines,
  type PracticeLine,
} from '@/lib/calendar/dayLines';
import {
  dayPassesFilter,
  hasXpScope,
  isFilterActive,
  scopedXp,
  type CalendarDay,
  type CalendarFilter,
} from '@/lib/calendar/filters';
import type { CalendarFront } from '@/lib/calendar/store';
import { useT } from '@/lib/i18n';
import { moodLevel } from '@/lib/mood';
import { formatHeroDate } from '@/lib/time';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The day peek — "what did I do on this day", answered under the grid on the
 * same frame as the tap.
 *
 * The full day panel starts below the fold, and its list of what was done was
 * its LAST block, collapsed: reading one day cost a scroll down, a tap and a
 * scroll back up, which made browsing a month day by day unworkable. This box
 * reads the month feed the grid is already painted from, so it needs no
 * request, no spinner and no scroll — tap a cell, read, tap the next one.
 *
 * ## Fixed geometry, on purpose
 *
 * The box never changes height from one day to the next: the status row
 * depends only on whether a filter is on (never on the day), the slots have a
 * fixed floor (scaled with the OS font size), and the footer sits under them.
 * So the grid above never moves under the thumb, and the day panel below —
 * whose retro-log TaskCards have no confirm — never shifts when a write lands. That is also why the lines are
 * capped at PEEK_SLOTS with an overflow row instead of growing: the rest of
 * the day is one tap away in the panel ("Abrir o dia completo").
 *
 * ## The numbers add up
 *
 * With an XP scope (Saúde) the lines are the in-scope practices carrying only
 * their scoped XP — the same `practiceLines` the Lista prints — so the column
 * sums to the header, which is the number on the cell. The status row closes
 * the day: header + "+N XP fora de Saúde" = the panel's whole-day total.
 *
 * Pure presentation: no data hooks. The screen hands in the day it already
 * holds from the feed, and whether that feed is ready.
 */

/** Lines the box has room for; the last becomes "e mais N" when they overflow. */
export const PEEK_SLOTS = 5;
const LINE_H = 26;

/**
 * `ready`: the feed holds the visible month. `loading`: a month step is still
 * showing the previous month's data (keepPreviousData), so the box claims
 * nothing. `error`: the feed failed with nothing to show.
 */
export type PeekState = 'ready' | 'loading' | 'error';

interface Props {
  date: Date;
  isToday: boolean;
  /** The selected day from the month feed; undefined when nothing was logged. */
  day: CalendarDay | undefined;
  state: PeekState;
  front: CalendarFront;
  filter: CalendarFilter;
  /** The filter's XP scope in words ("Saúde"), or null. */
  scopeLabel: string | null;
  tagLabels: Map<string, string>;
  tagEmojis: Map<string, string>;
  /** Scroll to the active front's block of the full day panel. */
  onOpenDay: () => void;
  onRetry: () => void;
}

const SKELETON_WIDTHS = ['70%', '55%', '62%'] as const;

export function CalendarDayPeek({
  date,
  isToday,
  day,
  state,
  front,
  filter,
  scopeLabel,
  tagLabels,
  tagEmojis,
  onOpenDay,
  onRetry,
}: Props) {
  const { t, locale } = useT();
  const { fontScale } = useWindowDimensions();
  const intlTag = locale === 'pt' ? 'pt-BR' : 'en-US';
  const fmt = (n: number) => n.toLocaleString(intlTag);

  const hero = formatHeroDate(date, locale);
  const dateText = isToday
    ? t('calendar.peek.todayDate', { date: hero.monthDay })
    : `${hero.weekday} ${hero.monthDay}`;

  const ready = state === 'ready';
  const filtering = isFilterActive(filter);

  // Ranked by XP, not by time: when the lines overflow, the ones kept are the
  // ones that made the day big — the reason he tapped it.
  const lines = useMemo(
    () => (day ? practiceLines(day, filter).sort(byXpDesc) : []),
    [day, filter],
  );
  const outside = useMemo(() => (day ? outsideScope(day, filter) : null), [day, filter]);

  // Every XP figure in the box names its scope, like the cell's label does: a
  // number that changes meaning with the filter has to say so.
  const xpText = (xp: number) =>
    scopeLabel
      ? t('calendar.scope.xpIn', { xp: fmt(xp), area: scopeLabel })
      : t('calendar.peek.dayXp', { xp: fmt(xp) });

  // --- header: the date, and the front's headline for the day ---------------
  let headline: ReactNode = null;
  let headlineA11y: string | null = null;
  if (ready && day) {
    if (front === 'rotina') {
      const figure = scopedXp(day, filter);
      if (figure > 0) {
        headlineA11y = xpText(figure);
        headline = (
          <>
            <Ionicons name="flash" size={12} color={tokens.semantic.xp} />
            <Text style={styles.headlineText} numberOfLines={1}>
              {headlineA11y}
            </Text>
          </>
        );
      }
    } else if (front === 'humor') {
      if (day.mood !== null) {
        const level = moodLevel(day.mood);
        headlineA11y = t(`mood.levels.${level.key}`);
        headline = (
          <>
            <MoodFace value={level.value} size={18} active />
            <Text style={styles.headlineText} numberOfLines={1}>
              {headlineA11y}
            </Text>
          </>
        );
      }
    } else if (day.spent > 0) {
      headlineA11y = t('calendar.peek.spent', { coins: fmt(day.spent) });
      headline = (
        <Text style={styles.headlineText} numberOfLines={1}>
          {headlineA11y}
        </Text>
      );
    }
  }

  // The status row renders whenever a filter is on — never per day — so the
  // box keeps its height while he taps through the month. Right (Rotina): the
  // rest of the day, so header + this = the whole day the panel reports.
  // Left: the grid's dimming rule in words, but only where nothing else says
  // it — a day dimmed for having no XP in the scope already reads "Nada em
  // Saúde" in the body. Short on screen, full for TalkBack.
  const dimmed = ready && !dayPassesFilter(day, filter);
  const explainedByScope = front === 'rotina' && hasXpScope(filter) && lines.length === 0;
  const showFiltered = dimmed && !explainedByScope;
  const statusLeft = showFiltered ? t('calendar.peek.filteredOut') : null;
  const statusLeftA11y = showFiltered ? t('a11y.dayCellFiltered') : null;
  const statusRight =
    ready && front === 'rotina' && outside && outside.xp > 0 && scopeLabel
      ? t('calendar.peek.outside', {
          xp: fmt(outside.xp),
          area: scopeLabel,
          practices: t('calendar.peek.practiceCount', { count: outside.practices }),
        })
      : null;

  const target = openDayTarget(front, day);
  const openHint =
    target === 'done'
      ? t('calendar.peek.openHintDone', {
          title: isToday ? t('home.completedBucket.today') : t('home.completedBucket.day'),
        })
      : target === 'practices'
        ? t('calendar.peek.openHintPractices')
        : target === 'mood'
          ? t('calendar.peek.openHintMood')
          : t('calendar.peek.openHintRewards');

  const headerA11y = [dateText, headlineA11y, statusLeftA11y, statusRight]
    .filter((part): part is string => !!part)
    .join('. ');

  let body: ReactNode;
  if (state === 'loading') {
    body = (
      <View accessible accessibilityLabel={t('calendar.peek.loading')}>
        {SKELETON_WIDTHS.map((w) => (
          <View key={w} style={[styles.skeleton, { width: w }]} />
        ))}
      </View>
    );
  } else if (state === 'error') {
    body = (
      <>
        <Text style={styles.empty}>{t('calendar.peek.loadFailed')}</Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
        >
          <Ionicons name="refresh" size={14} color={tokens.brand.violet2} />
          <Text style={styles.openText}>{t('common.retry')}</Text>
        </Pressable>
      </>
    );
  } else if (front === 'humor') {
    body = (
      <MoodReading day={day} isToday={isToday} tagLabels={tagLabels} tagEmojis={tagEmojis} />
    );
  } else if (front === 'vault') {
    body = <VaultReading day={day} fmt={fmt} onOpenDay={onOpenDay} />;
  } else {
    body = (
      <PracticeReading
        day={day}
        lines={lines}
        isToday={isToday}
        scopeLabel={scopeLabel}
        fmt={fmt}
        xpText={xpText}
        onOpenDay={onOpenDay}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View accessible accessibilityRole="header" accessibilityLabel={headerA11y}>
        <View style={styles.headerRow}>
          <Text style={styles.date} numberOfLines={1}>
            {dateText}
          </Text>
          <View style={styles.headline}>{headline}</View>
        </View>
        {filtering ? (
          <View style={styles.statusRow}>
            {statusLeft ? (
              <Text style={styles.statusLeft} numberOfLines={1}>
                {statusLeft}
              </Text>
            ) : null}
            <Text style={styles.statusRight} numberOfLines={1}>
              {statusRight ?? ''}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.slots, { minHeight: PEEK_SLOTS * LINE_H * Math.max(1, fontScale) }]}>
        {body}
      </View>

      {/* Left-aligned: the resting filter FAB floats over the right edge of
          this part of the card. */}
      <Pressable
        onPress={onOpenDay}
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('calendar.peek.open')}
        accessibilityHint={openHint}
      >
        <Text style={styles.openText}>{t('calendar.peek.open')}</Text>
        <Ionicons name="chevron-down" size={14} color={tokens.brand.violet2} />
      </Pressable>
    </View>
  );
}

/** Rotina: the day's practices as a ledger, the XP column on the left. */
function PracticeReading({
  day,
  lines,
  isToday,
  scopeLabel,
  fmt,
  xpText,
  onOpenDay,
}: {
  day: CalendarDay | undefined;
  lines: PracticeLine[];
  isToday: boolean;
  scopeLabel: string | null;
  fmt: (n: number) => string;
  xpText: (xp: number) => string;
  onOpenDay: () => void;
}) {
  const { t } = useT();

  if (!day || day.practices.length === 0) {
    return (
      <Text style={styles.empty}>
        {isToday ? t('calendar.peek.emptyToday') : t('calendar.peek.emptyDay')}
      </Text>
    );
  }
  if (lines.length === 0) {
    // Only reachable with an XP scope: the day has practices, none inside it.
    return (
      <Text style={styles.empty}>
        {t('calendar.peek.emptyScoped', { area: scopeLabel ?? '' })}
      </Text>
    );
  }

  const { shown, hidden } = fitLines(lines, PEEK_SLOTS, (l) => l.xp);
  const title = (l: PracticeLine) => l.title || t('calendar.peek.untitled');
  // One TalkBack stop for the lines, each read as "Dormir 8h, 40 XP em Saúde".
  const a11y = shown
    .map((l) =>
      l.count > 1
        ? `${title(l)}, ${xpText(l.xp)}, ${t('calendar.peek.a11yReps', { count: l.count })}`
        : `${title(l)}, ${xpText(l.xp)}`,
    )
    .join('. ');
  const more = hidden ? t('calendar.peek.more', { count: hidden.count }) : '';

  return (
    <>
      <View accessible accessibilityLabel={a11y}>
        {shown.map((l) => (
          <View key={l.key} style={styles.line}>
            <Text style={styles.num} numberOfLines={1}>{`+${fmt(l.xp)}`}</Text>
            <View
              style={[
                styles.dot,
                { backgroundColor: l.dim ? DIMENSION_META[l.dim].color : tokens.brand.violet2 },
              ]}
            />
            {/* ×N leads the title instead of trailing it: at rest the filter
                FAB floats over the right end of the lower lines. */}
            <Text style={styles.title} numberOfLines={1}>
              {l.count > 1 ? <Text style={styles.reps}>{`${l.count}× `}</Text> : null}
              {title(l)}
            </Text>
          </View>
        ))}
      </View>
      {hidden ? (
        <Pressable
          onPress={onOpenDay}
          // 26 + 9 + 9 = a 44dp target on a line that keeps the slot rhythm.
          // The footer right below does the same thing, so the two slops
          // overlapping is harmless.
          hitSlop={{ top: 9, bottom: 9 }}
          style={({ pressed }) => [styles.line, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${more}, ${xpText(hidden.total)}`}
        >
          <Text style={styles.num} numberOfLines={1}>{`+${fmt(hidden.total)}`}</Text>
          <View style={styles.dotSpacer} />
          <Text style={styles.more} numberOfLines={1}>
            {more}
          </Text>
          <Ionicons name="chevron-down" size={12} color={tokens.brand.violet2} />
        </Pressable>
      ) : null}
    </>
  );
}

/** Humor: the tags and the note — the check-in behind the colour on the cell. */
function MoodReading({
  day,
  isToday,
  tagLabels,
  tagEmojis,
}: {
  day: CalendarDay | undefined;
  isToday: boolean;
  tagLabels: Map<string, string>;
  tagEmojis: Map<string, string>;
}) {
  const { t } = useT();

  if (!day || day.mood === null) {
    return (
      <Text style={styles.empty}>
        {isToday ? t('calendar.peek.noMoodToday') : t('calendar.peek.noMood')}
      </Text>
    );
  }

  // Emoji + label, the way the check-in shows them; a slug no longer in the
  // catalog still reads as itself instead of vanishing.
  const tags = day.tagIds
    .map((slug) => {
      const label = tagLabels.get(slug) ?? slug;
      const emoji = tagEmojis.get(slug);
      return emoji ? `${emoji} ${label}` : label;
    })
    .join(' · ');

  return (
    <>
      {tags.length > 0 ? (
        <Text style={styles.tags} numberOfLines={1}>
          {tags}
        </Text>
      ) : null}
      {day.note ? (
        // 4 lines under the tags, 6 without — both inside the slots' floor.
        <Text style={styles.note} numberOfLines={tags.length > 0 ? 4 : 6}>
          {day.note}
        </Text>
      ) : (
        <Text style={styles.empty}>{t('calendar.peek.noNote')}</Text>
      )}
    </>
  );
}

/** Vault: the day's reward events, bought and used, in the order they happened. */
function VaultReading({
  day,
  fmt,
  onOpenDay,
}: {
  day: CalendarDay | undefined;
  fmt: (n: number) => string;
  onOpenDay: () => void;
}) {
  const { t } = useT();
  const events = day?.redemptions ?? [];

  if (events.length === 0) {
    return <Text style={styles.empty}>{t('calendar.day.noRewards')}</Text>;
  }

  const { shown, hidden } = fitLines(events, PEEK_SLOTS, (r) => r.cost);
  const more = hidden ? t('calendar.peek.moreRewards', { count: hidden.count }) : '';

  return (
    <>
      {shown.map((r) => {
        const label =
          r.kind === 'redeem'
            ? t('calendar.day.redeemed', { title: r.title })
            : t('calendar.day.used', { title: r.title });
        return (
          <View
            key={r.id}
            style={styles.line}
            accessible
            accessibilityLabel={
              r.kind === 'redeem'
                ? `${label}, ${t('calendar.peek.spent', { coins: fmt(r.cost) })}`
                : label
            }
          >
            {r.kind === 'redeem' ? (
              <Text style={styles.num} numberOfLines={1}>{`−${fmt(r.cost)}`}</Text>
            ) : (
              // A use costs nothing — the coins left when it was bought — so it
              // gets a check, never a "−0".
              <View style={styles.numGlyph}>
                <Ionicons name="checkmark" size={14} color={tokens.semantic.xp} />
              </View>
            )}
            <Ionicons
              name={(r.icon ?? 'gift') as keyof typeof Ionicons.glyphMap}
              size={13}
              color={tokens.semantic.coin}
            />
            <Text style={styles.title} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
      {hidden ? (
        <Pressable
          onPress={onOpenDay}
          hitSlop={{ top: 9, bottom: 9 }}
          style={({ pressed }) => [styles.line, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={
            hidden.total > 0
              ? `${more}, ${t('calendar.peek.spent', { coins: fmt(hidden.total) })}`
              : more
          }
        >
          <Text style={styles.num} numberOfLines={1}>
            {hidden.total > 0 ? `−${fmt(hidden.total)}` : ''}
          </Text>
          <View style={styles.iconSpacer} />
          <Text style={styles.more} numberOfLines={1}>
            {more}
          </Text>
          <Ionicons name="chevron-down" size={12} color={tokens.brand.violet2} />
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: tokens.space[3],
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.border.divider,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    gap: 8,
  },
  date: {
    flexShrink: 0,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.hi,
  },
  headline: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  headlineText: {
    flexShrink: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.hi,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 16,
    gap: 8,
  },
  // The label gives way before the figure: it is the redundant half.
  statusLeft: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  statusRight: {
    flexGrow: 1,
    flexShrink: 0,
    maxWidth: '100%',
    textAlign: 'right',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  // The floor that keeps the box the same height on every day.
  slots: {
    marginTop: 6,
    minHeight: PEEK_SLOTS * LINE_H,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: LINE_H,
    gap: 8,
  },
  // The number column. text.hi, not the XP green: the green measures below AA
  // as 13dp text on the light theme, and here the number IS the content.
  num: {
    minWidth: 44,
    textAlign: 'right',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  numGlyph: {
    width: 44,
    alignItems: 'flex-end',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSpacer: { width: 8 },
  iconSpacer: { width: 13 },
  title: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
  reps: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  more: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    color: tokens.brand.violet2,
  },
  empty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: LINE_H,
    color: tokens.text.mid,
  },
  tags: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: LINE_H,
    color: tokens.text.base,
  },
  // Clear of the resting filter FAB, which floats over the card's right edge
  // at the height of the note's last lines.
  note: {
    paddingRight: 40,
    fontFamily: 'Manrope_500Medium',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.base,
  },
  skeleton: {
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.bg.surface2,
    marginVertical: 8,
  },
  open: {
    marginTop: 4,
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  openText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  retry: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: tokens.space[3],
  },
  pressed: { opacity: 0.7 },
});
