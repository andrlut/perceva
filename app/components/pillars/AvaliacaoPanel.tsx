import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DimensionCards, type DimCardRow } from '@/components/DimensionCards';
import { HexChart } from '@/components/HexChart';
import { HexGrainToggle, useHexGrain } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { MoodTodayCard } from '@/components/mood/MoodTodayCard';
import { TourTarget } from '@/components/tour/TourTarget';
import type { CharacterSubScore } from '@/lib/db/types';
import { pickSubScores, pickSubScoresDecimal } from '@/lib/api/character';
import { useLastWellbeingSession } from '@/lib/api/psych';
import { daysSince } from '@/lib/api/questionnaire';
import { useT } from '@/lib/i18n';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { M5_EVENTS } from '@/lib/tour/m5Steps';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

/** Contorno da série do questionário no hex. Token, não literal: no tema
 *  claro '#4DD0FF' desaparece sobre a porcelana. */
const QUESTIONNAIRE_COLOR = tokens.dimension.bonds;

interface Props {
  subScores: CharacterSubScore[];
  /** Attached to the "Fazer autoavaliação" CTA's wrapper, so the Eu tab can
   *  scroll it clear of the M5 tooltip that spotlights it. */
  selfAssessmentAnchorRef?: React.RefObject<View | null>;
}

/**
 * Pillar 1 — Avaliação. The standardized layout: the hex leads, then every
 * extra sits below it — the source toggle, the six dimension cards, the
 * self-assessment / questionnaire CTAs, and finally the mood card as a
 * quiet footer. Nothing but the hex sits at the top of the panel.
 *
 * Quiet by design: no XP, no Momentum, no confetti.
 */
export function AvaliacaoPanel({ subScores, selfAssessmentAnchorRef }: Props) {
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

  // Legend cards mirror the active source: dim badge = score/10, sub bars =
  // score/5. Same numbers the hex plots, spelled out per dimension.
  const rows = useMemo<DimCardRow[]>(
    () =>
      DIMENSION_ORDER.map((dim) => {
        const [a, b] = SUBS_BY_DIM[dim];
        const sa = primary.get(a) ?? 0;
        const sb = primary.get(b) ?? 0;
        return {
          dimId: dim,
          badge: { text: formatScore(sa + sb), tone: 'solid' as const },
          subs: [
            { subId: a, fill: sa / 5 },
            { subId: b, fill: sb / 5 },
          ],
        };
      }),
    [primary],
  );

  // Never self-assessed = every "self" score still at the seed 0. The CTA
  // then reads as a first step ("Fazer autoavaliação · 1 min") instead of
  // an update — it is where the M5 tour starts the Percebida portrait.
  const hasSelfAssessment = useMemo(
    () => [...selfScores.values()].some((v) => v > 0),
    [selfScores],
  );

  const lastTaken = lastSession.data?.taken_at ?? null;
  const sinceDays = daysSince(lastTaken);
  const questionnaireLabel =
    sinceDays === null
      ? t('avaliacao.questionnaireFirst')
      : sinceDays === 0
        ? t('avaliacao.questionnaireToday')
        : t('avaliacao.questionnaireDaysAgo', { count: sinceDays });

  return (
    <View style={styles.wrap}>
      <View style={styles.hexWrap}>
        <HexChart
          scores={primary}
          secondaryScores={secondary}
          secondaryColor={QUESTIONNAIRE_COLOR}
          variant={hexMode}
          size={chartSize}
          onDimPress={(dim) =>
            router.push({ pathname: '/dimension/[id]', params: { id: dim } })
          }
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

      <DimensionCards
        rows={rows}
        onDimPress={(dim) =>
          router.push({ pathname: '/dimension/[id]', params: { id: dim } })
        }
      />

      {/* M5 step 3 spotlights this CTA and advances when it is tapped
          (the emit is inert outside that step — the tour only counts
          emissions made while a step waits on them). */}
      <View ref={selfAssessmentAnchorRef} collapsable={false}>
        <TourTarget id="me.self-assessment" radius={tokens.radius.md}>
          <Pressable
            onPress={() => {
              emitTourEvent(M5_EVENTS.SELF_ASSESSMENT_OPENED);
              router.push('/self-assessment');
            }}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
            hitSlop={4}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>
              {hasSelfAssessment
                ? t('avaliacao.selfAssessmentCta')
                : t('avaliacao.selfAssessmentCtaFirst')}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={tokens.brand.violet2} />
          </Pressable>
        </TourTarget>
      </View>

      <Pressable
        onPress={() => router.push('/questionnaire')}
        style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.85 }]}
        hitSlop={4}
        accessibilityRole="button"
      >
        <Ionicons name="clipboard" size={14} color={tokens.brand.violet2} />
        <Text style={styles.ctaSecondaryText}>{questionnaireLabel}</Text>
      </Pressable>

      {hasQuestionnaire && (
        <Pressable
          onPress={() => router.push('/profile-mirror')}
          style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.85 }]}
          hitSlop={4}
          accessibilityRole="button"
        >
          <Ionicons name="person-circle" size={14} color={tokens.brand.violet2} />
          <Text style={styles.ctaSecondaryText}>{t('avaliacao.mirrorCta')}</Text>
        </Pressable>
      )}

      {/* Mood lives at the very bottom — a quiet daily check-in footer, not
          a header. It used to sit above the hex, which broke the standard. */}
      <MoodTodayCard />
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
  cta: {
    minHeight: 44,
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
    color: tokens.brand.violet2,
  },
  ctaSecondary: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.22)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  ctaSecondaryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
    letterSpacing: 0.3,
  },
});
