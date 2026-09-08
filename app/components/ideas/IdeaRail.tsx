import { memo, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import type { DimensionId, LearningIdea } from '@/lib/db/types';
import type { IdeaLocale } from '@/lib/ideas';
import { IDEA_CARD_RAIL_WIDTH, sortedIdeas, toCardData } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * Horizontal rail of a material's idea cards (the "[card][card][card]" line
 * on the material screen). Reveal-only by design: cards flip to show the
 * claim but NEVER collect from here — `onFirstFlip` is deliberately left
 * undefined so `collect_idea` only ever fires from the card at the end of
 * the idea screen. Collected cards show the gold rim from the set the
 * parent passes in. The rail does NOT open ideas either: no `onOpen`, no
 * `openAffordance` — the back face is the claim alone, and the list rows
 * under the rail are what open an idea.
 */

const GAP = 10;

export interface IdeaRailProps {
  ideas: LearningIdea[];
  material: { id: string; slug: string; dimension_id: DimensionId };
  /** `useCollectedIdeas().data?.get(material.id)` — may be undefined while loading. */
  collected: Set<string> | undefined;
  locale: IdeaLocale;
  /** Defaults to `IDEA_CARD_RAIL_WIDTH`. */
  cardWidth?: number;
}

export const IdeaRail = memo(function IdeaRail({
  ideas,
  material,
  collected,
  locale,
  cardWidth = IDEA_CARD_RAIL_WIDTH,
}: IdeaRailProps) {
  const { id, slug, dimension_id } = material;
  const cards = useMemo(
    () =>
      sortedIdeas(ideas).map((idea) => ({
        idea,
        data: toCardData(idea, { id, slug, dimension_id }),
      })),
    [ideas, id, slug, dimension_id],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
    >
      {cards.map(({ idea, data }) => (
        <IdeaCard
          key={idea.id}
          data={data}
          width={cardWidth}
          locale={locale}
          collected={collected?.has(idea.id) ?? false}
          testID={`idea-rail-card-${idea.ordinal}`}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: tokens.space[4],
    gap: GAP,
    // Room for the gold glow of a collected card — the ScrollView clips
    // shadows that escape its bounds otherwise.
    paddingVertical: 6,
  },
});
