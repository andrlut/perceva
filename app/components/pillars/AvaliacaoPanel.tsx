import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { HexChart } from '@/components/HexChart';
import { HexGrainToggle, useHexGrain } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { DimensionPillarCard, ScoreBar } from '@/components/pillars/DimensionPillarCard';
import { PillarActions, type PillarAction } from '@/components/pillars/PillarActions';
import { PillarFirstStep } from '@/components/pillars/PillarFirstStep';
import type { CharacterSubScore, DimensionId } from '@/lib/db/types';
import { pickSubScores, pickSubScoresDecimal } from '@/lib/api/character';
import { useLastWellbeingSession } from '@/lib/api/psych';
import { daysSince } from '@/lib/api/questionnaire';
import { useT } from '@/lib/i18n';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

/** Contorno da série do questionário no hex. Token, não literal: no tema
 *  claro '#4DD0FF' desaparece sobre a porcelana. */
const QUESTIONNAIRE_COLOR = tokens.dimension.bonds;

interface Props {
  subScores: CharacterSubScore[];
}

/**
 * Pillar 1 — Avaliação. The standardized layout: the hex leads, then every
 * extra sits below it — the grain toggle, the series legend, the six
 * dimension cards (Praticada's anatomy, fed with 0..5 scores) and, closing
 * the panel, one card with the ways to redraw the portrait. Until the
 * questionnaire is taken, its invitation sits above the hex.
 *
 * Mood used to close this panel; it left the Eu tab (it lives on Home and
 * in the calendar), and its "Ver histórico" link went with it.
 *
 * Quiet by design: no XP, no Momentum, no confetti.
 */
export function AvaliacaoPanel({ subScores }: Props) {
  const router = useRouter();
  const { t } = useT();
  const { width: screenWidth } = useWindowDimensions();
  const lastSession = useLastWellbeingSession();
  // Duas séries independentes em vez de um segmented de 3 estados
  // exclusivos. Os mesmos três estados continuam alcançáveis (self / ambos /
  // só quiz), e "ambos" — o mais útil — passou a custar UM toque.
  const [showSelf, setShowSelf] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  // 'dims' = the 6-dimension hexagon; 'subs' = the 12-sub dodecagon. Opens
  // on the user's default (Ajustes); the small toggle by the hex flips it.
  const [hexMode, toggleHexMode] = useHexGrain();
  // Match the old (pre-pillars) sizing: bleed slightly beyond page padding
  // for visual presence, capped so it doesn't blow up on tablets.
  const chartSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));

  const selfScores = useMemo(
    () => pickSubScores(subScores, 'self'),
    [subScores],
  );
  // Decimal precision when available (rows written by avaliacao_v2+).
  const questionnaireScores = useMemo(
    () => pickSubScoresDecimal(subScores, 'questionnaire'),
    [subScores],
  );
  const hasQuestionnaire = questionnaireScores.size > 0;

  const quizOn = hasQuestionnaire && showQuiz;
  // Regra do último de pé: com o quiz desligado, "como me vejo" não pode
  // sumir, senão o gráfico fica vazio.
  const selfOn = !quizOn || showSelf;

  // Map the visible series to (primary, secondary) score maps.
  const { primary, secondary } = useMemo(() => {
    if (quizOn && selfOn) {
      return { primary: selfScores, secondary: questionnaireScores };
    }
    if (quizOn) {
      return { primary: questionnaireScores, secondary: undefined };
    }
    return { primary: selfScores, secondary: undefined };
  }, [quizOn, selfOn, selfScores, questionnaireScores]);

  // Never self-assessed = every "self" score still at the seed 0. The row
  // then reads as a first step ("Fazer autoavaliação · 1 min") instead of
  // an update.
  const hasSelfAssessment = useMemo(
    () => [...selfScores.values()].some((v) => v > 0),
    [selfScores],
  );

  const lastTaken = lastSession.data?.taken_at ?? null;
  const sinceDays = daysSince(lastTaken);

  const openDim = (dim: DimensionId) =>
    router.push({ pathname: '/dimension/[id]', params: { id: dim } });

  // The questionnaire's rows only exist once it was taken — before that, its
  // invitation is the card above the hex, and a second door would repeat it.
  const actions: PillarAction[] = [
    {
      key: 'self',
      icon: 'create-outline',
      label: hasSelfAssessment
        ? t('avaliacao.actions.self')
        : t('avaliacao.actions.selfFirst'),
      value: hasSelfAssessment ? undefined : t('avaliacao.actions.selfTime'),
      onPress: () => router.push('/self-assessment'),
    },
    ...(hasQuestionnaire
      ? [
          {
            key: 'questionnaire',
            icon: 'clipboard-outline' as const,
            label: t('avaliacao.actions.questionnaire'),
            value:
              sinceDays === null
                ? undefined
                : sinceDays === 0
                  ? t('avaliacao.actions.doneToday')
                  : t('avaliacao.actions.daysAgo', { count: sinceDays }),
            onPress: () => router.push('/questionnaire'),
          },
          {
            key: 'mirror',
            icon: 'git-compare-outline' as const,
            label: t('avaliacao.actions.mirror'),
            onPress: () => router.push('/profile-mirror'),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.wrap}>
      {/* The questionnaire is what draws the Percebida portrait, so until it
          is taken it is the first thing here — a real card, not a dashed
          afterthought under the chart (feedback 24/10: it read as disabled). */}
      {!hasQuestionnaire && (
        <PillarFirstStep
          icon="clipboard-outline"
          title={t('avaliacao.questCardTitle')}
          line={t('avaliacao.questCardLine')}
          cta={t('avaliacao.questCardCta')}
          onPress={() => router.push('/questionnaire')}
        />
      )}
      <View style={styles.hexWrap}>
        <HexChart
          scores={primary}
          secondaryScores={secondary}
          secondaryColor={QUESTIONNAIRE_COLOR}
          variant={hexMode}
          size={chartSize}
          onDimPress={openDim}
        />
      </View>

      <HexGrainToggle
        mode={hexMode}
        accent={tokens.brand.violet2}
        onToggle={toggleHexMode}
      />

      <HexSeriesLegend
        accent={tokens.brand.violet2}
        entries={[
          {
            key: 'self',
            label: t('hex.seriesSelf'),
            shape: 'fill',
            visible: selfOn,
            onToggle: hasQuestionnaire
              ? () => setShowSelf((v) => !v)
              : undefined,
          },
          ...(hasQuestionnaire
            ? [
                {
                  key: 'quiz',
                  label: t('hex.seriesQuiz'),
                  shape: (selfOn ? 'outline' : 'fill') as 'fill' | 'outline',
                  color: QUESTIONNAIRE_COLOR,
                  visible: quizOn,
                  onToggle: () => setShowQuiz((v) => !v),
                },
              ]
            : []),
        ]}
      />

      {/* The cards mirror the primary visible series, in the hex's fixed axis
          order: the dimension out of 10, each sub out of 5 — the same
          numbers the hex plots, spelled out. A tap opens the area. */}
      <View style={styles.list}>
        {DIMENSION_ORDER.map((dim) => {
          const color = DIMENSION_META[dim].color;
          const [a, b] = SUBS_BY_DIM[dim];
          const sa = primary.get(a) ?? 0;
          const sb = primary.get(b) ?? 0;
          return (
            <DimensionPillarCard
              key={dim}
              dimId={dim}
              value={formatScore(sa + sb)}
              unit="/10"
              faint={sa + sb === 0}
              onPress={() => openDim(dim)}
              subs={[a, b].map((subId, i) => {
                const score = i === 0 ? sa : sb;
                return {
                  subId,
                  value: formatScore(score),
                  faint: score === 0,
                  bar: <ScoreBar fill={score / 5} color={color} />,
                };
              })}
            />
          );
        })}
      </View>

      <PillarActions actions={actions} accent={tokens.brand.violet2} />
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
