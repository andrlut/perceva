import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  GuideGesture,
  GuidePlayground,
  GuideTapHint,
  GuideTryIt,
} from '@/components/guide/GuidePlayground';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { TrainEntryTile } from '@/components/ideas/TrainEntryTile';
import { ContinueLendoCard } from '@/components/learning/ContinueLendoCard';
import { CoverCard } from '@/components/learning/CoverCard';
import { IdeasCountBadge } from '@/components/learning/IdeasCountBadge';
import { LearningFilterRow } from '@/components/learning/LearningFilterRow';
import type { LearningFeedCard } from '@/lib/api/learning';
import type { DimensionId, LearningMaterialCategory, SubId } from '@/lib/db/types';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import type { IdeaCardData, IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * The guide of the Recanto tab (Learning) — docs/informativo-de-tela.md.
 *
 * The one thing nobody finds on their own is how an idea gets SAVED: you
 * absorb it by flipping the card at the END of the idea's page — rail flips
 * and Explorar only reveal. The playground is exactly that card: a sample
 * IdeaCard whose first flip turns it "collected" (gold rim and check), the
 * look it takes when absorbed — no RPC, just the card's own state.
 *
 * Steps follow the screen top to bottom; the "continue" tile, the filter
 * row, the cover and the bulb are drawn with the screen's own components on
 * sample data.
 */

const HELP = 'learning.help';

/** Every option of the Recanto tab, in the guide's order. */
export const RECANTO_GUIDE_ITEMS = [
  'absorb',
  'explore',
  'train',
  'continue',
  'search',
  'filters',
  'rows',
  'cover',
  'lamp',
] as const;

type ItemKey = (typeof RECANTO_GUIDE_ITEMS)[number];
type StepKey = Exclude<ItemKey, 'absorb'>;

/** The AI door's prompt — every option, with its mechanics. */
export function useRecantoGuidePrompt(): string {
  const { t } = useT();
  return useMemo(() => screenGuidePrompt(t, HELP, RECANTO_GUIDE_ITEMS), [t]);
}

const DEMO_WIDTH = 116;

/** A sample feed row, enough for CoverCard / ContinueLendoCard (they read
 *  these fields only; image-less covers draw the dimension art). */
function sampleFeedCard(title: string, summary: string): LearningFeedCard {
  return {
    slug: 'guide-sample',
    title_pt: title,
    title_en: title,
    summary_pt: summary,
    summary_en: summary,
    dimension_id: 'mind',
    subs: ['learn'],
    hero_image_url: null,
    idea_count: 3,
    media: [],
    category: 'research',
    reading_minutes: 6,
  } as unknown as LearningFeedCard;
}

/** A small sample library for the filter row's replica: every category and
 *  six dimensions, with both of Mente's sub-areas so the lit dimension
 *  shows its sub-area chips. Ids only matter for the read count. */
const FILTER_SAMPLE: LearningFeedCard[] = (
  [
    ['g1', 'mind', 'learn', 'research'],
    ['g2', 'mind', 'contemplate', 'book'],
    ['g3', 'health', 'sleep', 'research'],
    ['g4', 'body', 'strength', 'research'],
    ['g5', 'wealth', 'money', 'book'],
    ['g6', 'bonds', 'circle', 'foundation'],
    ['g7', 'craft', 'build', 'research'],
  ] as const
).map(
  ([id, dim, sub, category]) =>
    ({
      id,
      dimension_id: dim as DimensionId,
      subs: [sub as SubId],
      category: category as LearningMaterialCategory,
    }) as unknown as LearningFeedCard,
);
const FILTER_SAMPLE_READ = new Set(['g3']);

export function RecantoGuide({ locale }: { locale: IdeaLocale }) {
  const { t } = useT();
  const [absorbed, setAbsorbed] = useState(false);

  const sampleTitle = t(`${HELP}.sampleTitle`);
  const sampleClaim = t(`${HELP}.sampleClaim`);
  const card = useMemo<IdeaCardData>(
    () => ({
      id: 'guide-sample',
      materialId: 'guide-sample',
      slug: 'guide-sample',
      dimensionId: 'mind',
      ordinal: 1,
      title: { pt: sampleTitle, en: sampleTitle },
      claim: { pt: sampleClaim, en: sampleClaim },
      imagePath: null,
      sourceLabel: null,
    }),
    [sampleTitle, sampleClaim],
  );

  const feed = useMemo(
    () => sampleFeedCard(t(`${HELP}.sampleMaterial`), t(`${HELP}.sampleSummary`)),
    [t],
  );

  const steps: Record<
    StepKey,
    { icon: keyof typeof Ionicons.glyphMap; iconColor?: string; replica?: React.ReactNode }
  > = {
    explore: { icon: 'play-circle-outline' },
    train: {
      icon: 'school-outline',
      iconColor: tokens.semantic.coin,
      replica: <TrainEntryTile due={5} favorites={12} />,
    },
    continue: {
      icon: 'book-outline',
      replica: <ContinueLendoCard card={feed} percent={33} />,
    },
    search: { icon: 'search-outline' },
    filters: {
      icon: 'options-outline',
      // Wrapped, not scrolled: the guide must show every chip, and the
      // lit Mente shows how a dimension opens its sub-areas.
      replica: (
        <LearningFilterRow
          cards={FILTER_SAMPLE}
          readSet={FILTER_SAMPLE_READ}
          filter={{ kind: 'dim', value: 'mind' }}
          onFilterChange={() => {}}
          readFilter="unread"
          onReadFilterChange={() => {}}
          layout="wrap"
        />
      ),
    },
    rows: { icon: 'swap-horizontal-outline' },
    cover: {
      icon: 'albums-outline',
      replica: (
        <CoverCard
          card={feed}
          read={false}
          onPress={() => {}}
          ideaMeta={{ collected: 1, total: 3, hasVideo: false }}
        />
      ),
    },
    lamp: { icon: 'bulb-outline', iconColor: tokens.semantic.coin, replica: <LampReplica /> },
  };

  const stepKeys = RECANTO_GUIDE_ITEMS.filter((k): k is StepKey => k !== 'absorb');

  return (
    <>
      <GuideLabel>{t(`${HELP}.cardLabel`)}</GuideLabel>
      <GuidePlayground>
        <View>
          <IdeaCard
            data={card}
            width={DEMO_WIDTH}
            locale={locale}
            collected={absorbed}
            onFirstFlip={() => setAbsorbed(true)}
          />
          {!absorbed && <GuideTapHint />}
        </View>
        <View style={styles.gestures}>
          <GuideTryIt>{t(`${HELP}.tryIt`)}</GuideTryIt>
          <GuideGesture
            icon="sync-outline"
            title={t(`${HELP}.items.absorb.title`)}
            body={t(`${HELP}.items.absorb.body`)}
          />
          {absorbed && (
            <View style={styles.absorbed}>
              <Ionicons name="checkmark-circle" size={15} color={tokens.semantic.coin} />
              <Text style={styles.absorbedText}>{t(`${HELP}.demoAbsorbed`)}</Text>
            </View>
          )}
        </View>
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

/** The tab's one floating button: the gold bulb, with the same count badge
 *  (ringed in the sheet's surface instead of the screen's). */
function LampReplica() {
  return (
    <View style={styles.fabWrap}>
      <View style={styles.fab}>
        <LinearGradient
          colors={tokens.gradient.coinBtn as [string, string, string]}
          locations={tokens.gradient.coinBtnLocations as [number, number, number]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="bulb-outline" size={24} color={tokens.semantic.coinInk} />
      </View>
      {/* Outside the clipped circle, as in the tab's FabStack wrap. */}
      <IdeasCountBadge count={3} ringColor={tokens.bg.surface} />
    </View>
  );
}

const styles = StyleSheet.create({
  gestures: { flex: 1, minWidth: 0, gap: 10 },
  absorbed: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  absorbedText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.semantic.coin,
  },
  // FabStack's lg gold button, drawn by hand (the stack itself is
  // absolutely positioned over the screen).
  fabWrap: { alignSelf: 'flex-start' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,224,138,0.6)',
  },
});
