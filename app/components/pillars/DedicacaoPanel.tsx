import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { HexGrainToggle, HexPill, useHexGrain } from '@/components/HexGrainToggle';
import { PeriodSelector } from '@/components/dedicacao/PeriodSelector';
import { Sparkline } from '@/components/dedicacao/Sparkline';
import { SubBar } from '@/components/dedicacao/SubBar';
import { XpHexChart } from '@/components/dedicacao/XpHexChart';
import { type SubWindow } from '@/lib/api/dedicacao';
import { BAR_SPAN } from '@/lib/dedicacao/scale';
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

const CHART_HEIGHT = 48;

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
 * then the six dimension cards, then the history link.
 *
 * One ruler on the whole screen — the saturation (lib/saturation.ts, 300 XP
 * per 30 days per sub, prorated to the days elapsed):
 *   - the hex fills against it — or, in its second view, against the bars'
 *     end (3× it), never both rims at once;
 *   - each sub bar puts it at a fixed tick a third of the way along, so the
 *     lit part past the tick is what went past 300 — the one thing the
 *     capped hex cannot show;
 *   - each expanded chart draws it dashed (twice it for a dimension).
 *
 * The cards read most-trained first. The hex keeps its fixed axis order; a
 * card finds its vertex by icon and color, not by position.
 */
export function DedicacaoPanel({ dimensions }: Props) {
  const router = useRouter();
  const { t, locale } = useT();
  const metaLookup = useMetaLookup();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const {
    spec,
    setSpec,
    query: windowQuery,
    label,
    chipLabels,
    start: windowStart,
    end: windowEnd,
  } = useWindowScrub();
  const [expanded, setExpanded] = useState<Set<DimensionId>>(new Set());
  const [hexMode, toggleHexMode] = useHexGrain();
  // Two views of the hex, one rim each: up to the ruler (300 in 30 days —
  // "did I cover each area?") or up to the bars' end (900 — "how far past
  // the minimum did each go?"). Per visit, not saved.
  const [capped, setCapped] = useState(true);

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
  const rimLabel = Math.round(subCap * BAR_SPAN).toLocaleString();

  const hexSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));
  const chartWidth = Math.max(160, (screenWidth || 360) - 64);

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
          capped={capped}
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
            icon={capped ? 'contract-outline' : 'expand-outline'}
            label={t('dedicacao.rimLabel', { xp: capped ? capLabel : rimLabel })}
            accent={tokens.semantic.xp2}
            onPress={() => setCapped((v) => !v)}
            selected={!capped}
            a11yLabel={t('dedicacao.rimShow', { xp: capped ? rimLabel : capLabel })}
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
        {capped
          ? isDays30
            ? t('dedicacao.saturation30', { xp: SUB_SATURATION_30D })
            : t('dedicacao.saturationWindow', { xp: capLabel })
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
          const isExpanded = expanded.has(id);

          return (
            <Animated.View
              key={id}
              layout={reduceMotion ? undefined : LinearTransition.duration(220)}
            >
              <Pressable
                onPress={() => toggleExpand(id)}
                style={({ pressed }) => [
                  styles.attribute,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
              >
                {/* Header: icon + name + the period's XP, big and neutral —
                    a sum of two areas, never read against one area's 300. */}
                <View style={styles.attributeTop}>
                  <View style={[styles.iconHalo, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.iconName as never} size={16} color={meta.color} />
                  </View>
                  <Text style={styles.attributeName} numberOfLines={1}>
                    {dimLabel}
                  </Text>
                  <Text style={[styles.dimTotal, winXp === 0 && styles.faint]}>
                    {winXp.toLocaleString()}
                    <Text style={styles.dimTotalUnit}> XP</Text>
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={tokens.text.dim}
                  />
                </View>

                {/* One row per sub: name and XP above, the bar with the
                    ruler's tick below. The number lights with the same
                    threshold that fills a hex vertex. */}
                {subs.map((sub) => {
                  const subLabel = metaLookup.sub(sub.subId).label;
                  const reached = sub.windowXp >= subCap && sub.windowXp > 0;
                  return (
                    <View
                      key={sub.subId}
                      style={styles.subBlock}
                      accessible
                      accessibilityLabel={t(
                        reached ? 'dedicacao.subA11yOver' : 'dedicacao.subA11yUnder',
                        { sub: subLabel, xp: sub.windowXp.toLocaleString(), cap: capLabel },
                      )}
                    >
                      <View style={styles.subLabelRow}>
                        <Text style={styles.subName} numberOfLines={1}>
                          {subLabel}
                        </Text>
                        <Text
                          style={[
                            styles.subXp,
                            reached && [styles.subXpReached, { color: meta.color }],
                            sub.windowXp === 0 && styles.faint,
                          ]}
                        >
                          {sub.windowXp.toLocaleString()}
                        </Text>
                      </View>
                      <SubBar xp={sub.windowXp} cap={subCap} color={meta.color} />
                    </View>
                  );
                })}

                {/* Expanded: when the XP came in — the dimension, then each
                    sub, each against its dashed ruler — plus the all-time
                    reading and the calendar link. */}
                {isExpanded && (
                  <View style={styles.expandWrap}>
                    <View style={styles.divider} />
                    <ChartBlock
                      label={dimLabel}
                      strong
                      cumulative={win?.cumulative ?? []}
                      reference={subCap * SUBS_BY_DIM[id].length}
                      color={meta.color}
                      width={chartWidth}
                      idSuffix={id}
                    />
                    {subs.map((sub) => (
                      <ChartBlock
                        key={sub.subId}
                        label={metaLookup.sub(sub.subId).label}
                        cumulative={sub.cumulative}
                        reference={subCap}
                        color={meta.color}
                        width={chartWidth}
                        idSuffix={`${id}-${sub.subId}`}
                      />
                    ))}
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
                          // calendar's store is session-scoped: without them
                          // this link could land on the Vault quarter map. The
                          // window (granularity/offset) does not travel — the
                          // calendar's period is navigation, not filter state.
                          router.push({
                            pathname: '/history',
                            params: { dims: id, front: 'rotina', view: 'month' },
                          })
                        }
                        style={({ pressed }) => [
                          styles.detailLink,
                          pressed && { opacity: 0.7 },
                        ]}
                        hitSlop={4}
                      >
                        <Text style={[styles.detailLinkText, { color: meta.color }]}>
                          {locale === 'pt' ? `Histórico de ${dimLabel}` : `${dimLabel} history`}
                        </Text>
                        <Ionicons name="arrow-forward" size={12} color={meta.color} />
                      </Pressable>
                    </View>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* History link — after the cards, matching Avaliação's CTA position. */}
      <View style={styles.historyLinkWrap}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/history',
              params: { front: 'rotina', view: 'month' },
            })
          }
          hitSlop={6}
          style={({ pressed }) => [styles.historyLink, pressed && { opacity: 0.6 }]}
          accessibilityRole="link"
        >
          <Text style={styles.historyLinkText}>
            {locale === 'pt' ? 'Ver histórico completo' : 'Open full history'}
          </Text>
          <Ionicons name="arrow-forward" size={12} color={tokens.text.mid} />
        </Pressable>
      </View>
    </View>
  );
}

/** One cumulative chart in the expanded card, titled. */
function ChartBlock({
  label,
  strong = false,
  cumulative,
  reference,
  color,
  width,
  idSuffix,
}: {
  label: string;
  /** The dimension's own chart leads the sub charts under it. */
  strong?: boolean;
  cumulative: number[];
  reference: number;
  color: string;
  width: number;
  idSuffix: string;
}) {
  return (
    <View style={styles.chartBlock}>
      <Text style={[styles.chartLabel, strong && styles.chartLabelStrong]} numberOfLines={1}>
        {label}
      </Text>
      <Sparkline
        cumulative={cumulative}
        color={color}
        reference={reference}
        width={width}
        height={CHART_HEIGHT}
        idSuffix={idSuffix}
      />
    </View>
  );
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
  historyLinkWrap: { alignItems: 'center' },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  historyLinkText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },
  list: { gap: tokens.space[2] },
  attribute: {
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    gap: tokens.space[2],
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  attributeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  iconHalo: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attributeName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  dimTotal: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    letterSpacing: -0.2,
    color: tokens.text.hi,
    fontVariant: ['tabular-nums'],
  },
  dimTotalUnit: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0,
    color: tokens.text.dim,
  },
  faint: { color: tokens.text.faint },
  subBlock: { gap: 3 },
  subLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.space[2],
  },
  subName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  subXp: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
    fontVariant: ['tabular-nums'],
  },
  subXpReached: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
  },
  expandWrap: {
    gap: tokens.space[2],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.border.divider,
  },
  chartBlock: { gap: 2 },
  chartLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  chartLabelStrong: {
    fontFamily: 'Manrope_800ExtraBold',
    color: tokens.text.mid,
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
