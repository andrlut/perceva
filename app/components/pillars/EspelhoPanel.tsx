import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIRROR_TONE } from '@/components/PillarSwitcher';
import { PeriodSelector } from '@/components/dedicacao/PeriodSelector';
import { pickSubScoresDecimal } from '@/lib/api/character';
import { dimScoreFromSubs } from '@/lib/assessment/feedback';
import type { CharacterSubScore, DimensionId, SubId } from '@/lib/db/types';
import { pct, windowRatio } from '@/lib/dedicacao/scale';
import { useWindowScrub } from '@/lib/dedicacao/useWindowScrub';
import { useT } from '@/lib/i18n';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

interface Props {
  subScores: CharacterSubScore[];
}

/** Perception bar tone — Percebida violet, matching the pillar register. */
const SELF_COLOR = tokens.brand.violet2;
/** Practice bar tone — Praticada xp green, matching the pillar register. */
const PRACTICE_COLOR = tokens.semantic.xp2;

// Divergence thresholds. Perception is absolute (score out of 10); practice
// is relative to the window's leading dimension (windowRatio, capped 0.85).
// A callout needs BOTH signals — an absolute self-view and a clear practice
// share — so a week with uniform (or zero) practice never floods the panel.
const SEES_WELL_MIN = 6.5; // "você se vê bem aqui" — score ≥ 6,5/10
const PRACTICE_LOW_MAX = 0.3; // …but holds < ~35% of the leader's share
const SEES_LOW_MAX = 4.5; // "melhor do que você acha" — score ≤ 4,5/10
const PRACTICE_HIGH_MIN = 0.55; // …while practice is near the front

interface MirrorRow {
  dimId: DimensionId;
  color: string;
  label: string;
  /** Perceived score, 0..10 (sum of the dim's two subs). */
  perceived: number;
  scoreText: string;
  /** Window XP for the dim. */
  windowXp: number;
  xpText: string;
  /** Practice fill 0..0.85, relative to the window's leading dim. */
  practiceRatio: number;
  a11yLabel: string;
  callout: 'seeMore' | 'doMore' | null;
}

/**
 * Espelho — the cross-pillar mirror the brand promises: for each of the six
 * life areas, how the user SEES themselves (solid violet bar — self scores,
 * questionnaire as fallback) laid over what they PRACTICE (dashed green bar —
 * window XP, sharing Dedicação's leader-relative normalization). Where the
 * two portraits diverge hardest, a soft callout points it out — one per
 * direction at most, adult kindness, never guilt.
 *
 * Visual reference: the #espelho section of perceva.app.
 */
export function EspelhoPanel({ subScores }: Props) {
  const router = useRouter();
  const { t } = useT();
  const { spec, setSpec, query: windowQuery, label, chipLabels } = useWindowScrub();

  // Perception: the deliberate self-portrait when present, the questionnaire
  // as fallback per sub — so a quiz-only user still sees their reflection.
  const perception = useMemo(() => {
    const self = pickSubScoresDecimal(subScores, 'self');
    const quiz = pickSubScoresDecimal(subScores, 'questionnaire');
    const merged = new Map<SubId, number>();
    for (const dim of DIMENSION_ORDER) {
      for (const sub of SUBS_BY_DIM[dim]) {
        const s = self.get(sub) ?? 0;
        merged.set(sub, s > 0 ? s : (quiz.get(sub) ?? 0));
      }
    }
    const hasAny = [...merged.values()].some((v) => v > 0);
    return { merged, hasAny };
  }, [subScores]);

  const totalWindowXp = windowQuery.data?.totalXp ?? 0;

  const rows = useMemo<MirrorRow[]>(() => {
    const perDim = windowQuery.data?.perDim;
    const maxDimWinXp = perDim
      ? Math.max(0, ...perDim.map((d) => d.windowXp))
      : 0;

    const base = DIMENSION_ORDER.map((dimId) => {
      // perDim is 6 entries — a linear find beats building a lookup map.
      const windowXp = perDim?.find((d) => d.dimId === dimId)?.windowXp ?? 0;
      const perceived = dimScoreFromSubs(perception.merged, dimId);
      const dimLabel = t(`dimensions.${dimId}.label`);
      const scoreText = formatScore(perceived);
      const xpText = windowXp.toLocaleString();
      return {
        dimId,
        color: DIMENSION_META[dimId].color,
        label: dimLabel,
        perceived,
        scoreText,
        windowXp,
        xpText,
        practiceRatio: windowRatio(windowXp, maxDimWinXp),
        a11yLabel: t('espelho.rowA11y', {
          dim: dimLabel,
          score: scoreText,
          xp: xpText,
        }),
        callout: null as MirrorRow['callout'],
      };
    });

    // Callouts only when both portraits exist — and at most one per
    // direction, the widest gap each way. The mirror points; it never lists.
    if (perception.hasAny && (windowQuery.data?.totalXp ?? 0) > 0) {
      let seeMore: { row: MirrorRow; gap: number } | null = null;
      let doMore: { row: MirrorRow; gap: number } | null = null;
      for (const row of base) {
        const pRatio = row.perceived / 10;
        if (row.perceived >= SEES_WELL_MIN && row.practiceRatio <= PRACTICE_LOW_MAX) {
          const gap = pRatio - row.practiceRatio;
          if (!seeMore || gap > seeMore.gap) seeMore = { row, gap };
        } else if (
          row.perceived <= SEES_LOW_MAX &&
          row.practiceRatio >= PRACTICE_HIGH_MIN
        ) {
          const gap = row.practiceRatio - pRatio;
          if (!doMore || gap > doMore.gap) doMore = { row, gap };
        }
      }
      if (seeMore) seeMore.row.callout = 'seeMore';
      if (doMore) doMore.row.callout = 'doMore';
    }
    return base;
  }, [perception, windowQuery.data, t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>{t('espelho.intro')}</Text>

      {/* The one input: which practice window the dashed bars read from. */}
      <PeriodSelector
        spec={spec}
        onChange={setSpec}
        label={label}
        accent={MIRROR_TONE.accent}
        halo={MIRROR_TONE.halo}
        border={MIRROR_TONE.border}
        labels={chipLabels}
      />

      <View style={styles.panel}>
        {/* Legend swatches reuse the bar styles so the key can't drift
            from the bars it explains. */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.selfBar, styles.keySize]}>
              <View style={[styles.selfBarFill, styles.keyFill]} />
            </View>
            <Text style={styles.legendText}>{t('espelho.legendSelf')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.practiceBar, styles.keySize]}>
              <View style={[styles.practiceBarFill, styles.keyFill]} />
            </View>
            <Text style={styles.legendText}>{t('espelho.legendPractice')}</Text>
          </View>
        </View>

        {rows.map((row, idx) => (
          <View
            key={row.dimId}
            style={[styles.row, idx > 0 && styles.rowDivider]}
            accessible
            accessibilityLabel={row.a11yLabel}
          >
            <View style={styles.rowHead}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <Text style={styles.rowLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Text style={styles.rowScore}>{row.scoreText}</Text>
              <Text style={styles.rowSep}>·</Text>
              <Text
                style={[
                  styles.rowXp,
                  row.windowXp === 0 && { color: tokens.text.faint },
                ]}
              >
                +{row.xpText} XP
              </Text>
            </View>

            {/* Solid bar — how you see yourself (absolute, /10). */}
            <View style={styles.selfBar}>
              <View
                style={[styles.selfBarFill, { width: pct(row.perceived / 10) }]}
              />
            </View>

            {/* Dashed ghost bar — what you practice (window share). */}
            <View style={styles.practiceBar}>
              <View
                style={[styles.practiceBarFill, { width: pct(row.practiceRatio) }]}
              />
            </View>

            {row.callout && (
              <View style={styles.callout}>
                <Text style={styles.calloutArrow}>↳</Text>
                <Text style={styles.calloutText}>
                  {t(
                    row.callout === 'seeMore'
                      ? 'espelho.gapSeeMore'
                      : 'espelho.gapDoMore',
                  )}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Soft states — the mirror only shows; it never charges. */}
      {!windowQuery.isPending && totalWindowXp === 0 && (
        <Text style={styles.softNote}>{t('espelho.emptyPractice')}</Text>
      )}
      {!perception.hasAny && (
        <>
          <Text style={styles.softNote}>{t('espelho.emptyPerception')}</Text>
          <Pressable
            onPress={() => router.push('/self-assessment')}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
            hitSlop={4}
          >
            <Text style={styles.ctaText}>{t('espelho.perceptionCta')}</Text>
            <Ionicons name="arrow-forward" size={14} color={SELF_COLOR} />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space[3] },
  intro: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[2],
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[3],
    paddingBottom: tokens.space[3],
    alignItems: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
    letterSpacing: 0.2,
  },
  keySize: { width: 22 },
  keyFill: { width: '100%' },
  row: {
    paddingVertical: tokens.space[3],
    gap: 7,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: tokens.border.divider,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowLabel: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  rowScore: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: -0.1,
    color: SELF_COLOR,
  },
  rowSep: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.faint,
  },
  rowXp: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: PRACTICE_COLOR,
    letterSpacing: -0.1,
  },
  selfBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(155,130,255,0.12)',
    overflow: 'hidden',
  },
  selfBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: SELF_COLOR,
  },
  practiceBar: {
    height: 9,
    borderRadius: 3,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(111,232,170,0.55)',
    justifyContent: 'center',
  },
  practiceBarFill: {
    height: 4,
    marginHorizontal: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(111,232,170,0.35)',
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  calloutArrow: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.semantic.coin,
    lineHeight: 16,
  },
  calloutText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.semantic.coin,
  },
  softNote: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
    textAlign: 'center',
    paddingHorizontal: tokens.space[2],
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(123, 92, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.30)',
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.3,
    color: SELF_COLOR,
  },
});
