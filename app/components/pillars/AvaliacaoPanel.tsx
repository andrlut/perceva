import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  findNodeHandle,
  Platform,
  Pressable,
  type ScrollView as ScrollViewType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DimensionCards, type DimCardRow } from '@/components/DimensionCards';
import { HexChart } from '@/components/HexChart';
import { HexGrainToggle } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { MoodTodayCard } from '@/components/mood/MoodTodayCard';
import type { CharacterSubScore } from '@/lib/db/types';
import { pickSubScores, pickSubScoresDecimal } from '@/lib/api/character';
import { useLastWellbeingSession } from '@/lib/api/psych';
import { daysSince } from '@/lib/api/questionnaire';
import { useT } from '@/lib/i18n';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

/** Contorno da série do questionário no hex. Token, não literal: no tema
 *  claro '#4DD0FF' desaparece sobre a porcelana. */
const QUESTIONNAIRE_COLOR = tokens.dimension.bonds;

interface Props {
  subScores: CharacterSubScore[];
  /** ScrollView wrapping the Eu tab — lets the M5 tour scroll the legend
   *  cards into view by their measured position (robust to reordering). */
  scrollViewRef?: React.RefObject<ScrollViewType | null>;
  /** Reports the legend's absolute Y within the scroll view, so the tour
   *  can scroll to the sub-score cards without a hand-tuned magic number. */
  onLegendMeasured?: (y: number) => void;
}

/**
 * Pillar 1 — Avaliação. The standardized layout: the hex leads, then every
 * extra sits below it — the source toggle, the six dimension cards, the
 * self-assessment / questionnaire CTAs, and finally the mood card as a
 * quiet footer. Nothing but the hex sits at the top of the panel.
 *
 * Quiet by design: no XP, no Momentum, no confetti.
 */
export function AvaliacaoPanel({ subScores, scrollViewRef, onLegendMeasured }: Props) {
  const router = useRouter();
  const { t } = useT();
  const { width: screenWidth } = useWindowDimensions();
  const lastSession = useLastWellbeingSession();
  // Duas séries independentes em vez de um segmented de 3 estados
  // exclusivos. Os mesmos três estados continuam alcançáveis (self / ambos /
  // só quiz), e "ambos" — o mais útil — passou a custar UM toque.
  const [showSelf, setShowSelf] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  // 'dims' = the 6-dimension hexagon (default); 'subs' = the 12-sub
  // dodecagon. A small toggle by the hex flips between them.
  const [hexMode, setHexMode] = useState<'dims' | 'subs'>('dims');
  // Match the old (pre-pillars) sizing: bleed slightly beyond page padding
  // for visual presence, capped so it doesn't blow up on tablets.
  const chartSize = Math.max(240, Math.min((screenWidth || 360) - 16, 360));

  const legendRef = useRef<View>(null);

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

  // Measure the legend's absolute position within the scroll view whenever
  // it lays out, so the tour can scroll to it by real coordinates instead
  // of a fraction of the total scroll range (which shifts when the panel
  // reorders). measureLayout isn't available on web — the tour degrades to
  // no auto-scroll there.
  const measureLegend = useCallback(() => {
    if (Platform.OS === 'web' || !onLegendMeasured) return;
    const node = legendRef.current;
    const sv = scrollViewRef?.current;
    if (!node || !sv) return;
    // Fabric (new arch) requires `measureLayout` to receive a ref to a
    // native component — a findNodeHandle number throws "must be called
    // with a ref to a native component". getNativeScrollRef() hands us
    // the host ScrollView; the node-handle path stays as an old-arch
    // fallback.
    const target =
      (
        sv as unknown as { getNativeScrollRef?: () => unknown }
      ).getNativeScrollRef?.() ?? findNodeHandle(sv);
    if (target == null) return;
    (
      node as unknown as {
        measureLayout: (
          rel: never,
          cb: (x: number, y: number) => void,
          err: () => void,
        ) => void;
      }
    ).measureLayout(target as never, (_x, y) => onLegendMeasured(y), () => {});
  }, [onLegendMeasured, scrollViewRef]);

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
        onToggle={() => setHexMode((m) => (m === 'dims' ? 'subs' : 'dims'))}
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

      <View ref={legendRef} onLayout={measureLegend} collapsable={false}>
        <DimensionCards
          rows={rows}
          onDimPress={(dim) =>
            router.push({ pathname: '/dimension/[id]', params: { id: dim } })
          }
        />
      </View>

      <Pressable
        onPress={() => router.push('/self-assessment')}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        hitSlop={4}
      >
        <Text style={styles.ctaText}>{t('avaliacao.selfAssessmentCta')}</Text>
        <Ionicons name="arrow-forward" size={14} color={tokens.brand.violet2} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/questionnaire')}
        style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.85 }]}
        hitSlop={4}
      >
        <Ionicons name="clipboard" size={14} color={tokens.brand.violet2} />
        <Text style={styles.ctaSecondaryText}>{questionnaireLabel}</Text>
      </Pressable>

      {hasQuestionnaire && (
        <Pressable
          onPress={() => router.push('/profile-mirror')}
          style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.85 }]}
          hitSlop={4}
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
    fontSize: 12,
    color: tokens.brand.violet2,
    letterSpacing: 0.3,
  },
});
