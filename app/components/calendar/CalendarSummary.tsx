import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarTotals } from '@/lib/calendar/filters';
import { INTENSITY_RAMP } from '@/lib/calendar/intensity';
import { FILTERED_OUT_OPACITY } from '@/lib/calendar/paint';
import type { CalendarFront } from '@/lib/calendar/store';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import type { DimensionId } from '@/lib/db/types';
import { MOOD_LEVELS } from '@/lib/mood';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER } from '@/theme/dimensions';

/**
 * The line under the grid: what the visible range adds up to, and the key to
 * reading the fills.
 *
 * Every number here is computed over the FILTERED days, so the summary and the
 * grid can never quote different totals for the same screen — which is also why
 * it takes a `CalendarTotals` rather than raw days: one `summarize` call feeds
 * this, the quarter view and anything else that needs an aggregate.
 */

interface Props {
  totals: CalendarTotals;
  front: CalendarFront;
  filtering: boolean;
  /** XP per dimension across the filtered days — the expandable breakdown.
   *  Already scoped by the caller, so the cards add up to the headline. */
  dimXp: Record<DimensionId, number>;
  locale: 'pt' | 'en';
  /** The filter's XP scope in words ("Saúde"), or null. When set, the XP
   *  headline names it: a number that changes meaning must say so. */
  scopeLabel: string | null;
}

export function CalendarSummary({
  totals,
  front,
  filtering,
  dimXp,
  locale,
  scopeLabel,
}: Props) {
  const { t } = useT();
  const router = useRouter();
  const meta = useMetaLookup();
  const [open, setOpen] = useState(false);
  const intlTag = locale === 'pt' ? 'pt-BR' : 'en-US';

  let context: string;
  if (front === 'humor') {
    context =
      totals.moodAvg === null
        ? t('calendar.summary.humorEmpty')
        : t('calendar.summary.humor', {
            avg: totals.moodAvg.toLocaleString(intlTag, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
          });
  } else if (front === 'vault') {
    // Days first: with a reward facet active this line is answering "how many
    // days did I do that", and days is a different number from events.
    context = t('calendar.summary.vault', {
      days: totals.redemptionDays,
      count: totals.redemptionCount,
      coins: totals.spent.toLocaleString(intlTag),
    });
  } else {
    const xp = totals.xp.toLocaleString(intlTag);
    context = scopeLabel
      ? t('calendar.summary.rotinaScoped', { days: totals.activeDays, xp, area: scopeLabel })
      : t('calendar.summary.rotina', { days: totals.activeDays, xp });
  }

  const maxDim = Math.max(...Object.values(dimXp), 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.contextRow}>
        {/* 3 lines when scoped: a long scope label used to push the
            'filtrado' marker past the ellipsis. */}
        <Text style={styles.context} numberOfLines={scopeLabel ? 3 : 2}>
          {context}
          {filtering ? (
            <Text style={styles.filtered}>{` · ${t('calendar.summary.filtered')}`}</Text>
          ) : null}
        </Text>
      </View>

      <Legend front={front} />

      {/* The links get their own left-aligned 44dp row. At the right end of
          the context line they were ~13dp tall, and once the day peek pushed
          this summary down they sat in the resting filter FAB's column, where
          a tap opened the filter sheet instead. */}
      {front === 'humor' && (
        // Correlation reads a rolling 90-day window — a different question
        // from "how was this month", which is why it stayed its own screen
        // instead of becoming a fourth front.
        <Pressable
          onPress={() => router.push('/insights')}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
          accessibilityRole="link"
          accessibilityLabel={t('calendar.summary.patterns')}
        >
          <Text style={styles.breakdownLabel}>{t('calendar.summary.patterns')}</Text>
          <Ionicons name="chevron-forward" size={13} color={tokens.brand.violet2} />
        </Pressable>
      )}
      {front === 'rotina' && (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={t('calendar.summary.openBreakdown')}
        >
          <Text style={styles.breakdownLabel}>{t('calendar.summary.openBreakdown')}</Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={tokens.brand.violet2}
          />
        </Pressable>
      )}

      {front === 'rotina' && open && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>{t('calendar.summary.byDimension')}</Text>
          <View style={styles.dimGrid}>
            {DIMENSION_ORDER.map((dim) => {
              const xp = dimXp[dim] ?? 0;
              return (
                <View
                  key={dim}
                  style={[
                    styles.dimCard,
                    // Outside the scope: dimmed like a filtered-out day, never
                    // removed — the six-card grid keeps its shape.
                    scopeLabel !== null && xp === 0 && { opacity: FILTERED_OUT_OPACITY },
                  ]}
                >
                  <View style={styles.dimName}>
                    <View style={[styles.dimDot, { backgroundColor: DIMENSION_META[dim].color }]} />
                    <Text style={styles.dimLabel} numberOfLines={1}>
                      {meta.dim(dim).label}
                    </Text>
                  </View>
                  <View style={styles.dimTrack}>
                    <View
                      style={[
                        styles.dimFill,
                        {
                          width: `${Math.round((xp / maxDim) * 100)}%`,
                          backgroundColor: DIMENSION_META[dim].color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.dimValue}>{`+${xp.toLocaleString(intlTag)} XP`}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.hint}>{t('calendar.summary.longRangeHint')}</Text>
        </View>
      )}
    </View>
  );
}

function Legend({ front }: { front: CalendarFront }) {
  const { t } = useT();

  if (front === 'humor') {
    return (
      <View style={styles.legend}>
        {MOOD_LEVELS.map((level) => (
          <View key={level.value} style={[styles.swatch, { backgroundColor: level.color }]} />
        ))}
        <Text style={styles.legendLabel}>{t('calendar.legend.moodScale')}</Text>
      </View>
    );
  }

  if (front === 'vault') {
    return (
      <View style={styles.legend}>
        <View style={[styles.swatch, { backgroundColor: tokens.semantic.coin }]} />
        <Text style={styles.legendLabel}>{t('calendar.legend.spent')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.legend}>
      <Text style={styles.legendLabel}>{t('calendar.legend.less')}</Text>
      {INTENSITY_RAMP.slice(1).map((step) => (
        <View key={step.bg} style={[styles.swatch, { backgroundColor: step.bg }]} />
      ))}
      <Text style={styles.legendLabel}>{t('calendar.legend.more')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: tokens.space[3] },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
  },
  context: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.base,
  },
  filtered: { color: tokens.brand.violet2, fontFamily: 'Manrope_700Bold' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    minHeight: 44,
    paddingRight: tokens.space[3],
  },
  breakdownLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.dim,
    marginHorizontal: 2,
  },
  breakdown: { marginTop: tokens.space[3] },
  breakdownTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    marginBottom: tokens.space[2],
  },
  dimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[2] },
  dimCard: {
    // Two per row: half the container minus half the gap.
    width: '48.5%',
    backgroundColor: tokens.bg.surface2,
    borderRadius: tokens.radius.sm,
    padding: 9,
  },
  dimName: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dimDot: { width: 7, height: 7, borderRadius: 4 },
  dimLabel: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.base,
  },
  dimTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginTop: 7,
    marginBottom: 4,
    overflow: 'hidden',
  },
  dimFill: { height: '100%', borderRadius: 3 },
  dimValue: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: tokens.text.dim },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    lineHeight: 15,
    color: tokens.text.faint,
    marginTop: tokens.space[2],
  },
});
