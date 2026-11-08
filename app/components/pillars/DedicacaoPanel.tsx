import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HexGrainToggle, HexPill, useHexGrain } from '@/components/HexGrainToggle';
import { PeriodSelector } from '@/components/dedicacao/PeriodSelector';
import { DayStrip } from '@/components/dedicacao/DayStrip';
import { SubBar } from '@/components/dedicacao/SubBar';
import { XpHexChart } from '@/components/dedicacao/XpHexChart';
import { DimensionPillarCard } from '@/components/pillars/DimensionPillarCard';
import { PillarActions } from '@/components/pillars/PillarActions';
import { type SubWindow } from '@/lib/api/dedicacao';
import { HEX_RIMS, type HexRim } from '@/lib/dedicacao/scale';
import type { CharacterDimension, DimensionId } from '@/lib/db/types';
import { elapsedDays, SUB_SATURATION_30D, subSaturationFor } from '@/lib/saturation';
import { useWindowScrub } from '@/lib/dedicacao/useWindowScrub';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { levelProgress } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

interface Props {
  dimensions: CharacterDimension[];
}

interface DimWindow {
  window: number;
  cumulative: number[];
  perSub: SubWindow[];
}

/** Most-trained first; ties keep the fixed order. */
function byWindowXp(perDimWindow: Map<DimensionId, DimWindow>): DimensionId[] {
  return [...DIMENSION_ORDER].sort(
    (a, b) =>
      (perDimWindow.get(b)?.window ?? 0) - (perDimWindow.get(a)?.window ?? 0) ||
      DIMENSION_ORDER.indexOf(a) - DIMENSION_ORDER.indexOf(b),
  );
}

/**
 * Sub-pillar **Dedicação** (Praticada). The hex leads, then the period
 * selector (the one input, sitting between the two surfaces it drives),
 * then the six dimension cards, then the closing card with the full history.
 * The card anatomy born here (DimensionPillarCard) is the one Percebida and
 * Desejada now share.
 *
 * One ruler on the whole screen — the saturation (lib/saturation.ts, 300 XP
 * per 30 days per sub, prorated to the days elapsed):
 *   - the hex fills against it — or, in its second view, against the bars'
 *     end (3× it), never both rims at once;
 *   - each sub bar puts it at a fixed tick a third of the way along, so the
 *     lit part past the tick is what went past 300 — the one thing the
 *     capped hex cannot show;
 *
 * Opened, a card shows each sub's day strip: one cell per day (week, month),
 * painted by that day's XP — constancy at a glance, which no total carries.
 *
 * The cards read most-trained first. The hex keeps its fixed axis order; a
 * card finds its vertex by icon and color, not by position.
 */
export function DedicacaoPanel({ dimensions }: Props) {
  const router = useRouter();
  const { t } = useT();
  const metaLookup = useMetaLookup();
  const { width: screenWidth } = useWindowDimensions();

  const {
    spec,
    setSpec,
    query: windowQuery,
    label,
    chipLabels,
    start: windowStart,
    end: windowEnd,
    bucketStarts,
    bucketSize,
  } = useWindowScrub();
  const [expanded, setExpanded] = useState<Set<DimensionId>>(new Set());
  const [hexMode, toggleHexMode] = useHexGrain();
  // Three rims for the hex, cycled by the pill: the ruler (300 in 30 days —
  // "did I cover each area?"), 600, and the bars' end (900 — "how far past
  // the minimum did each go?"). Per visit, not saved.
  const [rimIdx, setRimIdx] = useState(0);
  const rim: HexRim = HEX_RIMS[rimIdx];
  const nextRim: HexRim = HEX_RIMS[(rimIdx + 1) % HEX_RIMS.length];

  const dimMap = useMemo(() => {
    const m = new Map<DimensionId, CharacterDimension>();
    for (const d of dimensions) m.set(d.dimension_id, d);
    return m;
  }, [dimensions]);

  const slices = useMemo(
    () =>
      windowQuery.data
        ? windowQuery.data.perDim.map((d) => ({
            dimId: d.dimId,
            xp: d.windowXp,
          }))
        : DIMENSION_ORDER.map((dimId) => ({ dimId, xp: 0 })),
    [windowQuery.data],
  );

  const perDimWindow = useMemo(() => {
    const m = new Map<DimensionId, DimWindow>();
    for (const d of DIMENSION_ORDER) {
      m.set(d, {
        window: 0,
        cumulative: [],
        perSub: SUBS_BY_DIM[d].map((subId) => ({
          subId,
          windowXp: 0,
          cumulative: [],
        })),
      });
    }
    for (const row of windowQuery.data?.perDim ?? []) {
      m.set(row.dimId, {
        window: row.windowXp,
        cumulative: row.cumulative,
        perSub: row.perSub,
      });
    }
    return m;
  }, [windowQuery.data]);

  // The ruler for this window: 300 XP per 30 days per sub, prorated to the
  // days already elapsed (lib/saturation.ts). The hex, the bars and the
  // charts all read this one number.
  const subCap = useMemo(
    () => subSaturationFor(elapsedDays(windowStart, windowEnd)),
    [windowStart, windowEnd],
  );

  // 12 per-sub window slices in dim order — feeds the hex's 'subs' grain.
  const subSlices = useMemo(
    () =>
      DIMENSION_ORDER.flatMap((dim) =>
        (perDimWindow.get(dim)?.perSub ?? []).map((s) => ({
          subId: s.subId,
          dimId: dim,
          xp: s.windowXp,
        })),
      ),
    [perDimWindow],
  );

  // Card order: most-trained first. While a new period loads there is no
  // data to sort by, so the last settled order holds — otherwise every scrub
  // would flash the fixed order before re-sorting.
  const freshOrder = useMemo(
    () => (windowQuery.data ? byWindowXp(perDimWindow) : null),
    [windowQuery.data, perDimWindow],
  );
  const [settledOrder, setSettledOrder] = useState<DimensionId[]>(DIMENSION_ORDER);
  useEffect(() => {
    if (freshOrder) setSettledOrder(freshOrder);
  }, [freshOrder]);
  const order = freshOrder ?? settledOrder;

  const isAll = spec.granularity === 'all';
  const isDays30 = spec.granularity === 'days30';
  const totalWindowXp = windowQuery.data?.totalXp ?? 0;
  const prevTotalXp = windowQuery.data?.prevTotalXp ?? 0;
  const capLabel = Math.round(subCap).toLocaleString();
  const rimLabel = Math.round(subCap * rim).toLocaleString();
  const nextRimLabel = Math.round(subCap * nextRim).toLocaleString();

  const hexSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));

  // Buckets that have started. In a period still running (this week, this
  // month) the rest are future days: hollow in the strip, out of the count.
  const elapsedBuckets = useMemo(() => {
    const now = Date.now();
    return bucketStarts.filter((b) => b.getTime() <= now).length;
  }, [bucketStarts]);
  const activeKey: 'dedicacao.activeDays' | 'dedicacao.activeWeeks' | 'dedicacao.activeMonths' =
    bucketSize === 'day'
      ? 'dedicacao.activeDays'
      : bucketSize === 'week'
        ? 'dedicacao.activeWeeks'
        : 'dedicacao.activeMonths';

  const toggleExpand = (dim: DimensionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  };

  const openDim = (dim: DimensionId) =>
    router.push({ pathname: '/dimension/[id]', params: { id: dim } });

  return (
    <View style={styles.wrap}>
      {/* Hex leads — same position as every pillar. */}
      <View style={styles.hexWrap}>
        <XpHexChart
          slices={slices}
          variant={hexMode}
          subSlices={subSlices}
          saturation={subCap}
          rim={rim}
          totalXp={totalWindowXp}
          prevTotalXp={isAll ? null : prevTotalXp}
          isLoading={windowQuery.isPending}
          size={hexSize}
          onAxisPress={openDim}
          idSuffix="dedicacao"
        />
      </View>

      <HexGrainToggle
        mode={hexMode}
        accent={tokens.semantic.xp2}
        onToggle={toggleHexMode}
        leading={
          <HexPill
            icon={rim === 1 ? 'contract-outline' : 'expand-outline'}
            label={t('dedicacao.rimLabel', { xp: rimLabel })}
            accent={tokens.semantic.xp2}
            onPress={() => setRimIdx((i) => (i + 1) % HEX_RIMS.length)}
            selected={rim !== 1}
            a11yLabel={t('dedicacao.rimShow', { xp: nextRimLabel })}
          />
        }
      />

      {/* First extra below the hex: the period selector — an input that
          drives the hex above and the cards below, so it sits between them. */}
      <PeriodSelector
        spec={spec}
        onChange={setSpec}
        label={label}
        accent={tokens.semantic.xp2}
        halo="rgba(111, 232, 170, 0.18)"
        border="rgba(61, 214, 140, 0.35)"
        labels={chipLabels}
      />

      {/* The ruler in words — the one rule the hex and the bars follow. */}
      <Text style={styles.saturationNote}>
        {rim === 1
          ? isDays30
            ? t('dedicacao.saturation30', { xp: SUB_SATURATION_30D })
            : t('dedicacao.saturationWindow', { xp: capLabel })
          : rim === 2
            ? isDays30
              ? t('dedicacao.double30', { rim: rimLabel })
              : t('dedicacao.doubleWindow', { rim: rimLabel })
            : isDays30
              ? t('dedicacao.uncapped30', { rim: rimLabel })
              : t('dedicacao.uncappedWindow', { rim: rimLabel })}
      </Text>

      <View style={styles.list}>
        {order.map((id) => {
          const meta = DIMENSION_META[id];
          const xp = dimMap.get(id)?.xp ?? 0;
          const lp = levelProgress(xp);
          const win = perDimWindow.get(id);
          const winXp = win?.window ?? 0;
          const dimLabel = metaLookup.dim(id).label;
          // The sub that carried the most sits on top, like the cards.
          const subs = [...(win?.perSub ?? [])].sort(
            (a, b) =>
              b.windowXp - a.windowXp ||
              SUBS_BY_DIM[id].indexOf(a.subId) - SUBS_BY_DIM[id].indexOf(b.subId),
          );

          // Header: the period's XP, big and neutral — a sum of two areas,
          // never read against one area's 300. One row per sub: the bar with
          // the ruler's tick, and the number lights with the same threshold
          // that fills a hex vertex.
          return (
            <DimensionPillarCard
              key={id}
              dimId={id}
              value={winXp.toLocaleString()}
              unit=" XP"
              faint={winXp === 0}
              onPress={() => toggleExpand(id)}
              expanded={expanded.has(id)}
              subs={subs.map((sub) => {
                const reached = sub.windowXp >= subCap && sub.windowXp > 0;
                return {
                  subId: sub.subId,
                  value: sub.windowXp.toLocaleString(),
                  reached,
                  faint: sub.windowXp === 0,
                  bar: <SubBar xp={sub.windowXp} cap={subCap} color={meta.color} />,
                  a11yLabel: t(
                    reached ? 'dedicacao.subA11yOver' : 'dedicacao.subA11yUnder',
                    {
                      sub: metaLookup.sub(sub.subId).label,
                      xp: sub.windowXp.toLocaleString(),
                      cap: capLabel,
                    },
                  ),
                };
              })}
            >
              {/* Expanded: when the XP came in — one strip per sub, one cell
                  per day, both painted on the same scale — plus the all-time
                  reading and the calendar link. */}
              <SubStrips
                subs={subs}
                bucketCount={bucketStarts.length}
                elapsed={elapsedBuckets}
                activeKey={activeKey}
                color={meta.color}
              />
              <View style={styles.footerRow}>
                <Text style={styles.levelTotal} numberOfLines={1}>
                  {t('dedicacao.levelTotal', {
                    level: lp.level,
                    xp: xp.toLocaleString(),
                  })}
                </Text>
                <Pressable
                  onPress={() =>
                    // Straight to the calendar, pre-filtered on this
                    // dimension. Front and view travel too, because the
                    // calendar's store is session-scoped: without them this
                    // link could land on the Vault quarter map. The window
                    // (granularity/offset) does not travel — the calendar's
                    // period is navigation, not filter state.
                    router.push({
                      pathname: '/history',
                      params: { dims: id, front: 'rotina', view: 'month' },
                    })
                  }
                  style={({ pressed }) => [styles.detailLink, pressed && { opacity: 0.7 }]}
                  hitSlop={4}
                >
                  <Text style={[styles.detailLinkText, { color: meta.color }]}>
                    {t('dedicacao.dimHistory', { dim: dimLabel })}
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={meta.color} />
                </Pressable>
              </View>
            </DimensionPillarCard>
          );
        })}
      </View>

      {/* The full history closes the panel as a row of the same card the
          other portraits end with — it used to be a loose link under the
          list, a fourth visual language on one tab. */}
      <PillarActions
        accent={tokens.semantic.xp2}
        actions={[
          {
            key: 'history',
            icon: 'calendar-outline',
            label: t('dedicacao.fullHistory'),
            onPress: () =>
              router.push({
                pathname: '/history',
                params: { front: 'rotina', view: 'month' },
              }),
          },
        ]}
      />
    </View>
  );
}

/**
 * The expanded card's reading: one day strip per sub, painted on one scale
 * (the card's busiest bucket), each with its "N de M dias" count. Future
 * buckets of a running period stay out of both.
 */
function SubStrips({
  subs,
  bucketCount,
  elapsed,
  activeKey,
  color,
}: {
  subs: SubWindow[];
  bucketCount: number;
  elapsed: number;
  activeKey: 'dedicacao.activeDays' | 'dedicacao.activeWeeks' | 'dedicacao.activeMonths';
  color: string;
}) {
  const { t } = useT();
  const metaLookup = useMetaLookup();
  // Cumulative → per bucket.
  const perBucket = subs.map((sub) =>
    Array.from(
      { length: bucketCount },
      (_, i) => (sub.cumulative[i] ?? 0) - (i > 0 ? (sub.cumulative[i - 1] ?? 0) : 0),
    ),
  );
  const max = Math.max(0, ...perBucket.flat());

  return subs.map((sub, j) => {
    const values = perBucket[j];
    const active = t(activeKey, {
      n: values.slice(0, elapsed).filter((v) => v > 0).length,
      total: elapsed,
    });
    const subLabel = metaLookup.sub(sub.subId).label;
    return (
      <View
        key={sub.subId}
        style={styles.stripBlock}
        accessible
        accessibilityLabel={t('dedicacao.stripA11y', { sub: subLabel, active })}
      >
        <View style={styles.stripLabelRow}>
          <Text style={styles.stripLabel} numberOfLines={1}>
            {subLabel}
          </Text>
          <Text style={styles.stripCount}>{active}</Text>
        </View>
        <DayStrip values={values} elapsed={elapsed} max={max} color={color} />
      </View>
    );
  });
}

const styles = StyleSheet.create({
  saturationNote: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    lineHeight: 16,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[2],
  },
  wrap: { gap: tokens.space[3] },
  hexWrap: { alignItems: 'center', gap: tokens.space[2] },
  list: { gap: tokens.space[2] },
  stripBlock: { gap: 4 },
  stripLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.space[2],
  },
  stripLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  stripCount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
    fontVariant: ['tabular-nums'],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
    marginTop: 2,
  },
  levelTotal: {
    flexShrink: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLinkText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
