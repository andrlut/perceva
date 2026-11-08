import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { HexChart } from '@/components/HexChart';
import { HexGrainToggle, useHexGrain } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { DimensionPillarCard, ScoreBar } from '@/components/pillars/DimensionPillarCard';
import { PillarActions } from '@/components/pillars/PillarActions';
import { PillarFirstStep } from '@/components/pillars/PillarFirstStep';
import { pickSubScoresDecimal } from '@/lib/api/character';
import type { CharacterSubScore, DimensionId, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

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
 * standardized shape (hex → extras → six cards → closing card), but the hex
 * plots the user's DESIRED per-sub scores (filled) over their current self
 * scores (a neutral ghost outline). The cards are Praticada's anatomy: the
 * dimension's target out of 10, and per sub "today → target" over a bar
 * whose lit stretch is the climb still ahead.
 *
 * Empty (no targets set yet): the hex draws only the ghost of today with an
 * em-dash center, the first-step card above it invites the user to chart
 * their north, and the cards show today's bars, faded. Once charted, the
 * invitation leaves and "Atualizar meu norte" closes the panel as a row.
 */
export function NortePanel({ subScores }: Props) {
  const router = useRouter();
  const { t } = useT();
  const metaLookup = useMetaLookup();
  const { width: screenWidth } = useWindowDimensions();
  const chartSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));
  const [hexMode, toggleHexMode] = useHexGrain();
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

  const openEditor = () =>
    router.push({ pathname: '/self-assessment', params: { mode: 'desired' } });
  const openDim = (dim: DimensionId) =>
    router.push({ pathname: '/dimension/[id]', params: { id: dim } });

  return (
    <View style={styles.wrap}>
      {/* Until the north is charted it is the first thing here — the same
          first-step card Percebida shows before the questionnaire. */}
      {!hasDesired && (
        <PillarFirstStep
          icon="flag-outline"
          title={t('norte.emptyTitle')}
          line={t('norte.emptyBody')}
          cta={t('norte.emptyCta')}
          onPress={openEditor}
        />
      )}

      <View style={styles.hexWrap}>
        <HexChart
          scores={hasDesired ? desiredEff : new Map()}
          secondaryScores={showToday ? current : undefined}
          secondaryColor={GHOST_COLOR}
          variant={hexMode}
          centerValue={hasDesired ? undefined : '—'}
          size={chartSize}
          idSuffix="norte"
          onDimPress={openDim}
        />
      </View>

      <HexGrainToggle
        mode={hexMode}
        accent={GOLD}
        onToggle={toggleHexMode}
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

      {/* Fixed axis order, like the hex. A tap opens the area. */}
      <View style={styles.list}>
        {DIMENSION_ORDER.map((dim) => {
          const color = DIMENSION_META[dim].color;
          const [a, b] = SUBS_BY_DIM[dim];
          const curA = current.get(a) ?? 0;
          const curB = current.get(b) ?? 0;

          if (!hasDesired) {
            // Ghost state: today's bars, pale and faded, no target number.
            return (
              <DimensionPillarCard
                key={dim}
                dimId={dim}
                value="—"
                faint
                onPress={() => openDim(dim)}
                subs={[
                  { subId: a, cur: curA },
                  { subId: b, cur: curB },
                ].map(({ subId, cur }) => ({
                  subId,
                  value: formatScore(cur),
                  faint: true,
                  bar: <ScoreBar fill={cur / 5} from={cur / 5} color={color} />,
                }))}
              />
            );
          }

          const desA = desiredEff.get(a) ?? curA;
          const desB = desiredEff.get(b) ?? curB;
          return (
            <DimensionPillarCard
              key={dim}
              dimId={dim}
              value={formatScore(desA + desB)}
              unit="/10"
              onPress={() => openDim(dim)}
              subs={[
                { subId: a, cur: curA, des: desA },
                { subId: b, cur: curB, des: desB },
              ].map(({ subId, cur, des }) => ({
                subId,
                value: `${formatScore(cur)} → ${formatScore(des)}`,
                bar: <ScoreBar fill={des / 5} from={cur / 5} color={color} />,
                a11yLabel: t('norte.subA11y', {
                  sub: metaLookup.sub(subId).label,
                  now: formatScore(cur),
                  target: formatScore(des),
                }),
              }))}
            />
          );
        })}
      </View>

      {hasDesired && (
        <PillarActions
          accent={GOLD}
          actions={[
            {
              key: 'north',
              icon: 'flag-outline',
              label: t('norte.cta'),
              onPress: openEditor,
            },
          ]}
        />
      )}
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
  list: { gap: tokens.space[2] },
});
