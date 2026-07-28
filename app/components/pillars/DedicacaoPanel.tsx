import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { InsightCard } from '@/components/InsightCard';
import { PeriodSelector } from '@/components/dedicacao/PeriodSelector';
import { Sparkline } from '@/components/dedicacao/Sparkline';
import { XpHexChart } from '@/components/dedicacao/XpHexChart';
import {
  computeWindow,
  useDedicacaoWindow,
  type SubWindow,
  type WindowSpec,
} from '@/lib/api/dedicacao';
import type { CharacterDimension, DimensionId } from '@/lib/db/types';
import { LEADER_RATIO, windowRatio } from '@/lib/dedicacao/scale';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useLoadedSettings } from '@/lib/settings';
import { levelProgress } from '@/lib/xp';
import { tokens } from '@/theme';
import {
  DIMENSION_META,
  DIMENSION_ORDER,
  SUB_META,
  SUBS_BY_DIM,
} from '@/theme/dimensions';

interface Props {
  dimensions: CharacterDimension[];
}

const CHIP_LABELS_PT = {
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  all: 'Total',
};
const CHIP_LABELS_EN = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  all: 'All',
};

function localeTag(language: 'pt' | 'en'): string {
  return language === 'pt' ? 'pt-BR' : 'en-US';
}

function formatWindowLabel(
  spec: WindowSpec,
  start: Date,
  end: Date,
  language: 'pt' | 'en',
): string {
  const loc = localeTag(language);
  if (spec.granularity === 'all') {
    return language === 'pt' ? 'últimos 12 meses' : 'last 12 months';
  }
  if (spec.granularity === 'week') {
    const day = new Intl.DateTimeFormat(loc, { day: 'numeric' });
    const month = new Intl.DateTimeFormat(loc, { month: 'short' });
    return `${day.format(start)} – ${day.format(end)} ${month
      .format(end)
      .replace('.', '')}`;
  }
  if (spec.granularity === 'month') {
    return new Intl.DateTimeFormat(loc, {
      month: 'long',
      year: 'numeric',
    }).format(start);
  }
  // quarter
  const month = new Intl.DateTimeFormat(loc, { month: 'short' });
  const year = new Intl.DateTimeFormat(loc, { year: 'numeric' });
  return `${month.format(start).replace('.', '')} – ${month
    .format(end)
    .replace('.', '')} ${year.format(end)}`;
}

const SPARK_HEIGHT = 64;

function pct(ratio: number): `${number}%` {
  return `${Math.max(0, Math.min(100, ratio * 100))}%`;
}

/**
 * Sub-pillar **Dedicação** (Praticada). Standardized layout: the hex leads,
 * then the period selector (the one input, sitting between the two surfaces
 * it drives), then the six dimension cards in fixed order, then the history
 * link, and the insight teaser as a footer.
 *
 * Every bar shares the hex's exact normalization (`windowRatio` against the
 * leading dimension's window XP), so a dim bar's fill equals its hex vertex
 * radius and its two sub bars decompose it — one scale on the whole screen
 * instead of the four that used to coexist. The leader tops out at 85% of
 * the track (relative scale, not "maxed"), marked by a tick.
 *
 * Level and all-time XP stay in the LV pill and on the dim detail screen —
 * only the window bars, sub bars, and the expanded trend sparkline change
 * with the selector. Tapping a hex vertex opens that dimension's detail,
 * matching the Avaliação hex.
 */
export function DedicacaoPanel({ dimensions }: Props) {
  const router = useRouter();
  const { locale } = useT();
  const metaLookup = useMetaLookup();
  const settings = useLoadedSettings();
  const { width: screenWidth } = useWindowDimensions();

  const [spec, setSpec] = useState<WindowSpec>({
    granularity: 'month',
    offset: 0,
  });
  const [expanded, setExpanded] = useState<Set<DimensionId>>(new Set());

  const windowQuery = useDedicacaoWindow(spec, settings.weekStart);

  const dimMap = useMemo(() => {
    const m = new Map<DimensionId, CharacterDimension>();
    for (const d of dimensions) m.set(d.dimension_id, d);
    return m;
  }, [dimensions]);

  const computed = useMemo(
    () => computeWindow(spec, settings.weekStart),
    [spec, settings.weekStart],
  );
  const label = useMemo(
    () => formatWindowLabel(spec, computed.start, computed.end, locale),
    [spec, computed, locale],
  );

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
    const m = new Map<
      DimensionId,
      { window: number; cumulative: number[]; perSub: SubWindow[] }
    >();
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

  // One ceiling for every bar on this panel: the leading dimension's window
  // XP — identical to the hex's own denominator. This is what makes the dim
  // bars and sub bars agree with the chart above them.
  const maxDimWinXp = useMemo(
    () => slices.reduce((m, s) => Math.max(m, s.xp), 0),
    [slices],
  );

  // The expanded trend sparkline keeps its own cumulative ceiling so a
  // sub-leading dim reads short next to the leader's full-height climb.
  const sparkGlobalMax = useMemo(() => {
    let max = 0;
    for (const win of perDimWindow.values()) {
      const last = win.cumulative.length
        ? win.cumulative[win.cumulative.length - 1]
        : 0;
      if (last > max) max = last;
    }
    return max;
  }, [perDimWindow]);

  const labels = locale === 'pt' ? CHIP_LABELS_PT : CHIP_LABELS_EN;
  const isAll = spec.granularity === 'all';
  const totalWindowXp = windowQuery.data?.totalXp ?? 0;
  const prevTotalXp = windowQuery.data?.prevTotalXp ?? 0;

  const hexSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));
  const sparkWidth = Math.max(160, (screenWidth || 360) - 64);

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
          totalXp={totalWindowXp}
          prevTotalXp={isAll ? null : prevTotalXp}
          isLoading={windowQuery.isPending}
          size={hexSize}
          onAxisPress={openDim}
          idSuffix="dedicacao"
        />
      </View>

      {/* First extra below the hex: the period selector — an input that
          drives the hex above and the cards below, so it sits between them. */}
      <PeriodSelector
        spec={spec}
        onChange={setSpec}
        label={label}
        accent={tokens.semantic.xp2}
        halo="rgba(111, 232, 170, 0.18)"
        border="rgba(61, 214, 140, 0.35)"
        labels={labels}
      />

      {/* Six dimension cards, fixed order so the layout is stable while
          scrubbing periods and each card maps 1:1 to a hex vertex. */}
      <View style={styles.list}>
        {DIMENSION_ORDER.map((id) => {
          const meta = DIMENSION_META[id];
          const xp = dimMap.get(id)?.xp ?? 0;
          const lp = levelProgress(xp);
          const win = perDimWindow.get(id);
          const winXp = win?.window ?? 0;
          const cumulative = win?.cumulative ?? [];
          const perSub = win?.perSub ?? [];
          const isExpanded = expanded.has(id);

          return (
            <Pressable
              key={id}
              onPress={() => toggleExpand(id)}
              style={({ pressed }) => [
                styles.attribute,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
            >
              {/* Header: icon + name + all-time total + LV pill + chevron */}
              <View style={styles.attributeTop}>
                <View style={[styles.iconHalo, { backgroundColor: meta.bg }]}>
                  <Ionicons
                    name={meta.iconName as never}
                    size={18}
                    color={meta.color}
                  />
                </View>
                <View style={styles.attributeCopy}>
                  <Text style={styles.attributeName} numberOfLines={1}>
                    {metaLookup.dim(id).label}
                  </Text>
                  <Text style={styles.xpHint}>
                    {xp.toLocaleString()} XP total
                  </Text>
                </View>
                <View
                  style={[styles.levelPill, { borderColor: `${meta.color}55` }]}
                >
                  <Text style={[styles.levelLabel, { color: meta.color }]}>
                    LV
                  </Text>
                  <Text style={styles.levelValue}>{lp.level}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tokens.text.dim}
                />
              </View>

              {/* Dim window bar — the hex vertex, as a bar. Fills to the same
                  windowRatio; the tick marks the 85% leader ceiling so the
                  headroom reads as "relative scale", not an unfinished bar. */}
              <View style={styles.dimBarRow}>
                <View style={[styles.dimBar, { backgroundColor: `${meta.color}1A` }]}>
                  <View
                    style={[
                      styles.dimBarFill,
                      {
                        width: pct(windowRatio(winXp, maxDimWinXp)),
                        backgroundColor: meta.color,
                      },
                    ]}
                  />
                  <View style={[styles.dimTick, { left: pct(LEADER_RATIO) }]} />
                </View>
                <Text
                  style={[
                    styles.dimWinXp,
                    { color: winXp > 0 ? meta.color : tokens.text.faint },
                  ]}
                >
                  {winXp > 0 ? `+${winXp.toLocaleString()}` : '0'} XP
                </Text>
              </View>

              {/* Two always-visible sub bars, same scale as the dim bar so
                  they read as a decomposition of it. */}
              {perSub.map((sub) => {
                const subMeta = SUB_META[sub.subId];
                return (
                  <View key={sub.subId} style={styles.subBarRow}>
                    <Ionicons
                      name={subMeta.iconName as never}
                      size={12}
                      color={meta.color}
                    />
                    <View
                      style={[styles.subBar, { backgroundColor: `${meta.color}1A` }]}
                    >
                      <View
                        style={[
                          styles.subBarFill,
                          {
                            width: pct(windowRatio(sub.windowXp, maxDimWinXp)),
                            backgroundColor: meta.color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.subBarXp,
                        sub.windowXp === 0 && { color: tokens.text.faint },
                      ]}
                      numberOfLines={1}
                    >
                      +{sub.windowXp.toLocaleString()}
                    </Text>
                  </View>
                );
              })}

              {/* Expanded: the cumulative trend the bars can't carry, plus a
                  deep link to this dimension's full history. */}
              {isExpanded && (
                <View style={styles.expandWrap}>
                  <View style={styles.divider} />
                  <View style={styles.sparkBlock}>
                    <Sparkline
                      cumulative={cumulative}
                      color={meta.color}
                      globalMax={sparkGlobalMax}
                      height={SPARK_HEIGHT}
                      width={sparkWidth}
                      idSuffix={id}
                    />
                    <View style={styles.sparkOverlay} pointerEvents="none">
                      {winXp > 0 ? (
                        <Text style={[styles.sparkXp, { color: meta.color }]}>
                          +{winXp.toLocaleString()} XP
                        </Text>
                      ) : (
                        <Text style={styles.sparkXpDim}>0 XP</Text>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/dedicacao-history',
                        params: {
                          granularity: spec.granularity,
                          offset: String(spec.offset),
                          dims: id,
                        },
                      })
                    }
                    style={({ pressed }) => [
                      styles.detailLink,
                      pressed && { opacity: 0.7 },
                    ]}
                    hitSlop={4}
                  >
                    <Text style={[styles.detailLinkText, { color: meta.color }]}>
                      {locale === 'pt'
                        ? `Histórico de ${metaLookup.dim(id).label}`
                        : `${metaLookup.dim(id).label} history`}
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color={meta.color} />
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* History link — after the cards, matching Avaliação's CTA position. */}
      <View style={styles.historyLinkWrap}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/dedicacao-history',
              params: {
                granularity: spec.granularity,
                offset: String(spec.offset),
              },
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

      {/* Window-independent teaser — a footer, not part of the window block. */}
      <InsightCard />
    </View>
  );
}

const styles = StyleSheet.create({
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
  attributeCopy: { flex: 1, minWidth: 0 },
  iconHalo: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attributeName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  xpHint: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
    letterSpacing: 0.3,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    backgroundColor: tokens.bg.glass,
  },
  levelLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  levelValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  dimBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    marginTop: 2,
  },
  dimBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  dimBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  dimTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dimWinXp: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: -0.1,
    minWidth: 64,
    textAlign: 'right',
  },
  subBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  subBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    opacity: 0.7,
  },
  subBarXp: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: tokens.text.dim,
    letterSpacing: -0.1,
    minWidth: 52,
    textAlign: 'right',
  },
  sparkBlock: {
    position: 'relative',
    marginTop: 2,
  },
  sparkOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 2,
  },
  sparkXp: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.2,
  },
  sparkXpDim: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: tokens.text.faint,
    letterSpacing: -0.1,
  },
  expandWrap: {
    gap: tokens.space[2],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.border.divider,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  detailLinkText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
