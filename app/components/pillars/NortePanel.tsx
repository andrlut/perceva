import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DimensionCards, type DimCardRow } from '@/components/DimensionCards';
import { HexChart } from '@/components/HexChart';
import { HexGrainToggle } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { pickSubScoresDecimal } from '@/lib/api/character';
import type { CharacterSubScore, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

// Neutral gray for the "today" ghost outline. Deliberately not gold (that's
// the desired fill's accent) and not cyan (that means "questionnaire" on the
// Avaliação hex) — the current-vs-desired distinction rides on fill-vs-outline,
// not hue, so the ghost stays chromatically quiet.
const GHOST_COLOR = tokens.text.mid;
const GOLD = tokens.semantic.coin;

interface Props {
  subScores: CharacterSubScore[];
}

/**
 * Desejada · Norte — the aspirational counterpart to Avaliação. Same
 * standardized shape (hex → extras → six cards), but the hex plots the
 * user's DESIRED per-sub scores (filled) over their current self scores
 * (a neutral ghost outline), and the cards show a stacked current→target
 * bar with a gold delta chip.
 *
 * Empty (no targets set yet): the hex draws only the ghost of today with an
 * em-dash center, a dashed hero CTA invites the user to chart their north,
 * and the cards show today's bars with a "set" chip.
 */
export function NortePanel({ subScores }: Props) {
  const router = useRouter();
  const { t } = useT();
  const metaLookup = useMetaLookup();
  const { width: screenWidth } = useWindowDimensions();
  const chartSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));
  const [hexMode, setHexMode] = useState<'dims' | 'subs'>('dims');
  // A legenda do Norte era inerte — uma View copiada dos outros painéis.
  // Agora ela liga/desliga o contorno "hoje", que é o que ela sempre
  // descreveu sem controlar.
  const [showToday, setShowToday] = useState(true);

  const current = useMemo(
    () => pickSubScoresDecimal(subScores, 'self'),
    [subScores],
  );
  const desired = useMemo(
    () => pickSubScoresDecimal(subScores, 'desired'),
    [subScores],
  );
  const hasDesired = desired.size > 0;

  // Effective desired per sub: an absent target means "no goal beyond today",
  // so it falls back to the current score — never a fake negative gap.
  const desiredEff = useMemo(() => {
    const m = new Map<SubId, number>();
    for (const dim of DIMENSION_ORDER) {
      for (const sub of SUBS_BY_DIM[dim]) {
        const cur = current.get(sub) ?? 0;
        m.set(sub, desired.get(sub) ?? cur);
      }
    }
    return m;
  }, [current, desired]);

  const arrow = (from: number, to: number) =>
    `${formatScore(from)} → ${formatScore(to)}`;

  const rows = useMemo<DimCardRow[]>(
    () =>
      DIMENSION_ORDER.map((dim) => {
        const [a, b] = SUBS_BY_DIM[dim];
        const curA = current.get(a) ?? 0;
        const curB = current.get(b) ?? 0;

        if (!hasDesired) {
          // Ghost state: today's bars, muted, inviting a target.
          return {
            dimId: dim,
            badge: { text: t('norte.setChip'), tone: 'chip' as const },
            subs: [
              { subId: a, fill: curA / 5 },
              { subId: b, fill: curB / 5 },
            ],
          };
        }

        const desA = desiredEff.get(a) ?? curA;
        const desB = desiredEff.get(b) ?? curB;
        const delta = desA + desB - (curA + curB);
        return {
          dimId: dim,
          badge:
            delta > 0.05
              ? { text: `+${formatScore(delta)}`, tone: 'chip' as const }
              : { icon: 'checkmark', tone: 'chip' as const },
          caption: `${metaLookup.sub(a).label} ${arrow(curA, desA)} · ${
            metaLookup.sub(b).label
          } ${arrow(curB, desB)}`,
          subs: [
            { subId: a, fill: desA / 5, baseFill: curA / 5 },
            { subId: b, fill: desB / 5, baseFill: curB / 5 },
          ],
        };
      }),
    [current, desiredEff, hasDesired, t, metaLookup],
  );

  const openEditor = () =>
    router.push({ pathname: '/self-assessment', params: { mode: 'desired' } });

  return (
    <View style={styles.wrap}>
      <View style={styles.hexWrap}>
        <HexChart
          scores={hasDesired ? desiredEff : new Map()}
          secondaryScores={showToday ? current : undefined}
          secondaryColor={GHOST_COLOR}
          variant={hexMode}
          centerValue={hasDesired ? undefined : '—'}
          size={chartSize}
          idSuffix="norte"
          onDimPress={(dim) =>
            router.push({ pathname: '/dimension/[id]', params: { id: dim } })
          }
        />
      </View>

      <HexGrainToggle
        mode={hexMode}
        accent={GOLD}
        onToggle={() => setHexMode((m) => (m === 'dims' ? 'subs' : 'dims'))}
      />

      <HexSeriesLegend
        accent={GOLD}
        entries={[
          {
            key: 'desired',
            label: t('hex.seriesDesired'),
            shape: 'fill',
            // Sem meta definida a série não existe no gráfico: a entrada fica
            // apagada e sem toque, lendo como "ainda não definido".
            visible: hasDesired,
          },
          {
            key: 'today',
            label: t('hex.seriesToday'),
            shape: 'outline',
            color: GHOST_COLOR,
            visible: showToday,
            onToggle: hasDesired ? () => setShowToday((v) => !v) : undefined,
          },
        ]}
      />

      {!hasDesired && (
        <Pressable
          onPress={openEditor}
          style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="flag" size={18} color={GOLD} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.heroTitle}>{t('norte.emptyTitle')}</Text>
            <Text style={styles.heroBody}>{t('norte.emptyBody')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={GOLD} />
        </Pressable>
      )}

      <DimensionCards
        rows={rows}
        accent={GOLD}
        onDimPress={(dim) =>
          router.push({ pathname: '/dimension/[id]', params: { id: dim } })
        }
      />

      <Pressable
        onPress={openEditor}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        hitSlop={4}
      >
        <Ionicons name="flag" size={14} color={GOLD} />
        <Text style={styles.ctaText}>
          {hasDesired ? t('norte.cta') : t('norte.emptyCta')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[3],
  },
  hexWrap: {
    alignItems: 'center',
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,200,61,0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,200,61,0.06)',
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,200,61,0.14)',
  },
  heroTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  heroBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.text.mid,
    marginTop: 2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255,200,61,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,61,0.30)',
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.3,
    color: GOLD,
  },
});
