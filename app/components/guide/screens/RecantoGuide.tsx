import { Ionicons } from '@expo/vector-icons';
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
import { ContinueLendoCard } from '@/components/learning/ContinueLendoCard';
import { CoverCard } from '@/components/learning/CoverCard';
import type { LearningFeedCard } from '@/lib/api/learning';
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
 * Steps follow the screen top to bottom; the cover and the "continue" card
 * are drawn with the screen's own components on sample data.
 */

const HELP = 'learning.help';

/** Every option of the Recanto tab, in the guide's order. */
export const RECANTO_GUIDE_ITEMS = [
  'absorb',
  'explore',
  'continue',
  'rows',
  'cover',
  'lamp',
  'filters',
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
 *  these fields only; imagePath-less covers draw the dimension art). */
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
    continue: {
      icon: 'book-outline',
      replica: (
        <ContinueLendoCard
          card={feed}
          percent={33}
          subtitle={t('learning.ideas.nextIdeaLabel', { title: sampleTitle })}
          metaText={t('learning.ideas.progress', { collected: 1, total: 3 })}
          onPress={() => {}}
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
    filters: { icon: 'options-outline', replica: <FiltersReplica /> },
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

/** The bulb button with its gold count — same look as the tab's FAB. */
function LampReplica() {
  return (
    <View style={styles.fab}>
      <Ionicons name="bulb-outline" size={22} color={tokens.text.hi} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>3</Text>
      </View>
    </View>
  );
}

/** The filter button with its gold dot, and the sheet's state control. */
function FiltersReplica() {
  const { t } = useT();
  return (
    <View style={styles.filters}>
      <View style={styles.fab}>
        <Ionicons name="options-outline" size={22} color={tokens.text.hi} />
        <View style={styles.dot} />
      </View>
      <View style={styles.segment}>
        {(['unread', 'read', 'all'] as const).map((k) => (
          <View key={k} style={[styles.segmentItem, k === 'unread' && styles.segmentOn]}>
            <Text style={[styles.segmentText, k === 'unread' && styles.segmentTextOn]}>
              {t(`learning.readFilter.${k}`)}
            </Text>
          </View>
        ))}
      </View>
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
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
    borderWidth: 2,
    borderColor: tokens.bg.surface,
  },
  badgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    lineHeight: 12,
    color: '#3D2A00',
  },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 2,
    borderColor: tokens.bg.surface,
  },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  segment: {
    flexDirection: 'row',
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    overflow: 'hidden',
  },
  segmentItem: { paddingHorizontal: 8, paddingVertical: 5 },
  segmentOn: { backgroundColor: 'rgba(123, 92, 255, 0.18)' },
  segmentText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  segmentTextOn: { color: tokens.brand.violet2 },
});
