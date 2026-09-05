import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HexGrainToggle } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { InsightCard } from '@/components/InsightCard';
import { PeriodSelector } from '@/components/dedicacao/PeriodSelector';
import { Sparkline } from '@/components/dedicacao/Sparkline';
import { XpHexChart } from '@/components/dedicacao/XpHexChart';
import { pickSubScoresDecimal } from '@/lib/api/character';
import { type SubWindow } from '@/lib/api/dedicacao';
import type {
  CharacterDimension,
  CharacterSubScore,
  DimensionId,
  SubId,
} from '@/lib/db/types';
import { LEADER_RATIO, pct, windowRatio } from '@/lib/dedicacao/scale';
import { useWindowScrub } from '@/lib/dedicacao/useWindowScrub';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
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
  /** All character_sub_score rows — feeds the mirror outline on the hex. */
  subScores: CharacterSubScore[];
}

const SPARK_HEIGHT = 64;

/** Perception outline tone — Percebida's violet, because that is exactly
 *  what the line is: the Percebida portrait visiting the Praticada hex. */
const MIRROR_COLOR = tokens.brand.violet2;

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
export function DedicacaoPanel({ dimensions, subScores }: Props) {
  const router = useRouter();
  const { t, locale } = useT();
  const metaLookup = useMetaLookup();
  const { width: screenWidth } = useWindowDimensions();

  const {
    spec,
    setSpec,
    query: windowQuery,
    label,
    chipLabels,
  } = useWindowScrub();
  const [expanded, setExpanded] = useState<Set<DimensionId>>(new Set());
  const [hexMode, setHexMode] = useState<'dims' | 'subs'>('dims');
  const [showMirror, setShowMirror] = useState(true);

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

  // ── The mirror outline ──────────────────────────────────────────────
  // How the user SEES themselves, plotted over what they practice. Self
  // scores lead; a sub the user never rated falls back to the questionnaire
  // so a quiz-only user still gets a reflection.
  //
  // Normalized the SAME relative way as the XP it overlays (windowRatio
  // against the leading axis), never as an absolute /5. That is the whole
  // point: both silhouettes then answer "how is this spread across my six
  // areas", so where the violet line reaches past the filled shape the user
  // sees themselves strong in an area they are not currently feeding — and
  // where it falls short, they are practicing more than they give
  // themselves credit for. Mixing an absolute scale with a relative one
  // would make the two outlines uncomparable and the reading a lie.
  const perception = useMemo(() => {
    const self = pickSubScoresDecimal(subScores, 'self');
    const quiz = pickSubScoresDecimal(subScores, 'questionnaire');
    const perSub = new Map<SubId, number>();
    for (const dim of DIMENSION_ORDER) {
      for (const sub of SUBS_BY_DIM[dim]) {
        const s = self.get(sub) ?? 0;
        perSub.set(sub, s > 0 ? s : (quiz.get(sub) ?? 0));
      }
    }
    const perDim = new Map<DimensionId, number>();
    for (const dim of DIMENSION_ORDER) {
      perDim.set(
        dim,
        SUBS_BY_DIM[dim].reduce((sum, sub) => sum + (perSub.get(sub) ?? 0), 0),
      );
    }
    const hasAny = [...perSub.values()].some((v) => v > 0);
    return { perSub, perDim, hasAny };
  }, [subScores]);

  // Ratios in the active grain's axis order — 6 dims or 12 subs, matching
  // whatever the hex is currently plotting.
  const mirrorSeries = useMemo(() => {
    if (!perception.hasAny) return undefined;
    if (hexMode === 'subs') {
      const values = DIMENSION_ORDER.flatMap((dim) =>
        SUBS_BY_DIM[dim].map((sub) => perception.perSub.get(sub) ?? 0),
      );
      const max = Math.max(0, ...values);
      return values.map((v) => windowRatio(v, max));
    }
    const values = DIMENSION_ORDER.map((dim) => perception.perDim.get(dim) ?? 0);
    const max = Math.max(0, ...values);
    return values.map((v) => windowRatio(v, max));
  }, [perception, hexMode]);

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
          variant={hexMode}
          subSlices={subSlices}
          totalXp={totalWindowXp}
          prevTotalXp={isAll ? null : prevTotalXp}
          isLoading={windowQuery.isPending}
          secondary={showMirror ? mirrorSeries : undefined}
          secondaryColor={MIRROR_COLOR}
          size={hexSize}
          onAxisPress={openDim}
          idSuffix="dedicacao"
        />
      </View>

      <HexGrainToggle
        mode={hexMode}
        accent={tokens.semantic.xp2}
        onToggle={() => setHexMode((m) => (m === 'dims' ? 'subs' : 'dims'))}
      />

      {/* The mirror legend — same shape as Norte's: fill vs outline, named.
          Tappable so the outline can be dismissed when the user just wants
          to read the window's XP shape on its own. */}
      <HexSeriesLegend
        accent={tokens.semantic.xp2}
        entries={[
          {
            key: 'xp',
            label: t('hex.seriesPracticed'),
            shape: 'fill',
            visible: true,
          },
          ...(mirrorSeries
            ? [
                {
                  key: 'mirror',
                  label: t('hex.seriesSelf'),
                  shape: 'outline' as const,
                  color: MIRROR_COLOR,
                  visible: showMirror,
                  onToggle: () => setShowMirror((v) => !v),
                },
              ]
            : []),
        ]}
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
