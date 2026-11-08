import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PeriodSelector } from '@/components/dedicacao/PeriodSelector';
import {
  GuideGesture,
  GuideGestureRow,
  GuidePlayground,
  GuideTapHint,
  GuideTryIt,
} from '@/components/guide/GuidePlayground';
import { GuideFit } from '@/components/guide/GuideFit';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import { HexChart } from '@/components/HexChart';
import { HexGrainToggle, HexPill } from '@/components/HexGrainToggle';
import { HexSeriesLegend } from '@/components/HexSeriesLegend';
import { PillarSwitcher, type PillarKey } from '@/components/PillarSwitcher';
import { DimensionPillarCard, ScoreBar } from '@/components/pillars/DimensionPillarCard';
import { PillarActions } from '@/components/pillars/PillarActions';
import type { WindowSpec } from '@/lib/api/dedicacao';
import type { DimensionId, SubId } from '@/lib/db/types';
import { windowChipLabels } from '@/lib/dedicacao/windowLabel';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useModules, type ModuleKey } from '@/lib/modules';
import type { HexGrain } from '@/lib/settings';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The guide of the Eu tab — docs/informativo-de-tela.md.
 *
 * The playground is the tab in miniature: the REAL PillarSwitcher driving a
 * REAL HexChart on sample scores, with the 6/12 toggle under it. Switching
 * pillars reshapes the hex (Desejada draws the target over today's
 * outline, like the Norte panel), the toggle flips 6 areas ↔ 12 sub-areas,
 * and tapping an icon around the hex says which area it would open — no
 * navigation from inside the sheet.
 *
 * Steps go top to bottom and then pillar by pillar; the period selector,
 * the ceiling pill and the legend are the screen's own components.
 */

const HELP = 'hero.help';

/** Every option of the Eu tab, in the guide's order. The area cards come
 *  right after the legend: all three portraits share them now. Mood left the
 *  tab (Home and the calendar keep it), so it has no item here. */
export const HERO_GUIDE_ITEMS = [
  'pillars',
  'grain',
  'hexIcons',
  'profile',
  'legend',
  'cards',
  'assessment',
  'period',
  'ruler',
  'history',
  'north',
  'path',
] as const;

type ItemKey = (typeof HERO_GUIDE_ITEMS)[number];
type GestureKey = Extract<ItemKey, 'pillars' | 'grain' | 'hexIcons'>;
type StepKey = Exclude<ItemKey, GestureKey>;

const GESTURES: readonly GestureKey[] = ['pillars', 'grain', 'hexIcons'];
const isGesture = (k: ItemKey): k is GestureKey => (GESTURES as readonly string[]).includes(k);

const GESTURE_ICONS: Record<GestureKey, keyof typeof Ionicons.glyphMap> = {
  pillars: 'swap-horizontal-outline',
  grain: 'grid-outline',
  hexIcons: 'navigate-circle-outline',
};

/** Caminho exists only with Metas or Habilidades on. */
const GATES: Partial<Record<ItemKey, readonly ModuleKey[]>> = {
  path: ['metas', 'skills'],
};

function useVisibleKeys(): ItemKey[] {
  const modules = useModules();
  return useMemo(
    () =>
      HERO_GUIDE_ITEMS.filter((k) => {
        const gate = GATES[k];
        return !gate || gate.some((m) => modules[m]);
      }),
    [modules],
  );
}

/** The AI door's prompt — the options this person actually has on screen. */
export function useHeroGuidePrompt(): string {
  const { t } = useT();
  const keys = useVisibleKeys();
  return useMemo(() => screenGuidePrompt(t, HELP, keys), [t, keys]);
}

const SUBS: readonly SubId[] = [
  'sleep',
  'nutrition',
  'strength',
  'dexterity',
  'learn',
  'contemplate',
  'money',
  'career',
  'circle',
  'romance',
  'play',
  'build',
];

/** Sample 0..5 scores, one shape per pillar, so switching visibly moves. */
const SAMPLE: Record<PillarKey, readonly number[]> = {
  percebida: [3.5, 3, 2.5, 2, 4, 3.5, 2.5, 3, 4, 3, 2, 3.5],
  praticada: [4.5, 2, 3.5, 1.5, 4, 3, 1, 3.5, 2.5, 1.5, 2, 3],
  desejada: [4.5, 4, 4, 3, 4.5, 4, 3.5, 4, 4.5, 4, 3.5, 4],
};

const CENTER: Record<PillarKey, string> = {
  percebida: '6,3',
  praticada: '840',
  desejada: '8,0',
};

const toMap = (values: readonly number[]) =>
  new Map<SubId, number>(SUBS.map((s, i) => [s, values[i] ?? 0]));

export function HeroGuide() {
  const { t } = useT();
  const meta = useMetaLookup();
  const keys = useVisibleKeys();
  const [tried, setTried] = useState(false);
  const [pillar, setPillar] = useState<PillarKey>('praticada');
  const [grain, setGrain] = useState<HexGrain>('dims');
  const [opened, setOpened] = useState<DimensionId | null>(null);
  // The switcher's miniature is laid out a little wider than the sheet:
  // squeezed into it, "Percebida" lost its last letter, and at the tab's
  // full width its 10px labels would shrink to ~8px. ~288dp keeps every
  // label whole at nearly full size.
  const switcherWidth = Math.min(288, useWindowDimensions().width - 32);

  const scores = useMemo(() => toMap(SAMPLE[pillar]), [pillar]);
  const today = useMemo(() => toMap(SAMPLE.percebida), []);

  const steps: Record<
    StepKey,
    { icon: keyof typeof Ionicons.glyphMap; iconColor?: string; replica?: React.ReactNode }
  > = {
    profile: { icon: 'person-circle-outline' },
    legend: {
      icon: 'eye-outline',
      replica: (
        <HexSeriesLegend
          accent={tokens.brand.violet2}
          entries={[
            { key: 'self', label: t('hex.seriesSelf'), shape: 'fill', visible: true, onToggle: () => {} },
            { key: 'quiz', label: t('hex.seriesQuiz'), shape: 'outline', visible: false, onToggle: () => {} },
          ]}
        />
      ),
    },
    cards: { icon: 'albums-outline', replica: <CardReplica /> },
    assessment: { icon: 'create-outline', replica: <AssessmentReplica /> },
    period: {
      icon: 'calendar-outline',
      iconColor: tokens.semantic.xp2,
      replica: <PeriodReplica />,
    },
    ruler: {
      icon: 'expand-outline',
      iconColor: tokens.semantic.xp2,
      replica: (
        <View style={styles.row}>
          <HexPill
            icon="expand-outline"
            label={t('dedicacao.rimLabel', { xp: '300' })}
            accent={tokens.semantic.xp2}
            onPress={() => {}}
            selected={false}
            a11yLabel={t('dedicacao.rimLabel', { xp: '300' })}
          />
        </View>
      ),
    },
    history: {
      icon: 'time-outline',
      iconColor: tokens.semantic.xp2,
      replica: <HistoryReplica />,
    },
    north: { icon: 'compass-outline', iconColor: tokens.semantic.coin },
    path: { icon: 'flag-outline', iconColor: tokens.semantic.coin },
  };

  const gestureKeys = keys.filter(isGesture);
  const stepKeys = keys.filter((k): k is StepKey => !isGesture(k));

  return (
    <>
      <GuideLabel>{t(`${HELP}.cardLabel`)}</GuideLabel>
      <GuidePlayground column>
        <GuideFit naturalWidth={switcherWidth}>
          <View>
            <PillarSwitcher
              active={pillar}
              onChange={(p) => {
                setTried(true);
                setOpened(null);
                setPillar(p);
              }}
            />
            {!tried && <GuideTapHint />}
          </View>
        </GuideFit>
        <View style={styles.hexWrap}>
          <HexChart
            scores={scores}
            variant={grain}
            size={210}
            idSuffix="guide-hero"
            centerValue={CENTER[pillar]}
            secondaryScores={pillar === 'desejada' ? today : undefined}
            secondaryColor={pillar === 'desejada' ? tokens.text.dim : undefined}
            onDimPress={(d) => {
              setTried(true);
              setOpened(d);
            }}
          />
        </View>
        <HexGrainToggle
          mode={grain}
          onToggle={() => {
            setTried(true);
            setGrain((g) => (g === 'dims' ? 'subs' : 'dims'));
          }}
          accent={tokens.brand.violet2}
        />
        {opened && (
          <View style={styles.feedback}>
            <Ionicons name="navigate-circle" size={15} color={tokens.brand.violet2} />
            <Text style={styles.feedbackText}>
              {t(`${HELP}.demoDim`, { dim: meta.dim(opened).label })}
            </Text>
          </View>
        )}

        <GuideTryIt>{t(`${HELP}.tryIt`)}</GuideTryIt>
        <GuideGestureRow>
          {gestureKeys.map((k) => (
            <GuideGesture
              key={k}
              icon={GESTURE_ICONS[k]}
              title={t(`${HELP}.items.${k}.title`)}
              body={t(`${HELP}.items.${k}.body`)}
            />
          ))}
        </GuideGestureRow>
      </GuidePlayground>

      <GuideLabel>{t(`${HELP}.screenLabel`)}</GuideLabel>

      {stepKeys.map((k) => (
        <GuideStep
          key={k}
          icon={steps[k].icon}
          iconColor={steps[k].iconColor}
          title={t(`${HELP}.items.${k}.title`)}
          body={t(`${HELP}.items.${k}.body`)}
        >
          {steps[k].replica}
        </GuideStep>
      ))}
    </>
  );
}

/** Dedicação's period selector, on the current 30 days — the real one, as
 *  a miniature at the tab's real width: its five chips share one row, and
 *  in the guide's narrower column "Trimestre" split mid-word. */
function PeriodReplica() {
  const { t } = useT();
  const naturalWidth = useWindowDimensions().width - 32;
  const spec: WindowSpec = { granularity: 'days30', offset: 0 };
  return (
    <GuideFit naturalWidth={naturalWidth}>
      <PeriodSelector
        spec={spec}
        onChange={() => {}}
        label={t('dedicacaoWindow.last30Days')}
        accent={tokens.semantic.xp2}
        halo="rgba(111, 232, 170, 0.18)"
        border="rgba(61, 214, 140, 0.35)"
        labels={windowChipLabels(t)}
      />
    </GuideFit>
  );
}

const noop = () => {};

/** One area card, Percebida's reading — the real card, on sample scores.
 *  Full-width on the tab, so it goes in as a miniature (GuideFit). */
function CardReplica() {
  const naturalWidth = useWindowDimensions().width - 32;
  const color = DIMENSION_META.health.color;
  return (
    <GuideFit naturalWidth={naturalWidth}>
      <DimensionPillarCard
        dimId="health"
        value={formatScore(6.5)}
        unit="/10"
        onPress={noop}
        subs={[
          { subId: 'sleep', value: formatScore(3.5), bar: <ScoreBar fill={3.5 / 5} color={color} /> },
          { subId: 'nutrition', value: formatScore(3), bar: <ScoreBar fill={3 / 5} color={color} /> },
        ]}
      />
    </GuideFit>
  );
}

/** Percebida's closing card, as it reads once the questionnaire was taken. */
function AssessmentReplica() {
  const { t } = useT();
  const naturalWidth = useWindowDimensions().width - 32;
  return (
    <GuideFit naturalWidth={naturalWidth}>
      <PillarActions
        accent={tokens.brand.violet2}
        actions={[
          { key: 'self', icon: 'create-outline', label: t('avaliacao.actions.self'), onPress: noop },
          {
            key: 'questionnaire',
            icon: 'clipboard-outline',
            label: t('avaliacao.actions.questionnaire'),
            value: t('avaliacao.actions.daysAgo', { count: 12 }),
            onPress: noop,
          },
          { key: 'mirror', icon: 'git-compare-outline', label: t('avaliacao.actions.mirror'), onPress: noop },
        ]}
      />
    </GuideFit>
  );
}

/** Praticada's closing card: the full history. */
function HistoryReplica() {
  const { t } = useT();
  const naturalWidth = useWindowDimensions().width - 32;
  return (
    <GuideFit naturalWidth={naturalWidth}>
      <PillarActions
        accent={tokens.semantic.xp2}
        actions={[
          { key: 'history', icon: 'calendar-outline', label: t('dedicacao.fullHistory'), onPress: noop },
        ]}
      />
    </GuideFit>
  );
}

const styles = StyleSheet.create({
  hexWrap: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  feedbackText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.hi,
  },
});
