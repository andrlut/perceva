import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { CollectionGrid } from '@/components/ideas/CollectionGrid';
import { ReviewStack, type ReviewStackItem } from '@/components/ideas/ReviewStack';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  reviewKey,
  useIdeaCards,
  useIdeaReviews,
  useLearningFeed,
  useReviewIdea,
} from '@/lib/api/learning';
import type { DimensionId, IdeaReview, LearningIdeaPublic } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { showInfo } from '@/lib/util/confirm';
import { useMetaLookup } from '@/lib/i18n/meta';
import { toCardDataFromPublic, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER } from '@/theme/dimensions';

/**
 * "Minhas ideias" — the review pile, then the favorites.
 *
 * Absorbing (the flip at the end of the idea screen) is irreversible and
 * stays where it is. What this screen adds is the REVIEW: every absorbed
 * idea waits here once (`reviewed_at IS NULL`) and the reader decides, one
 * card at a time, whether it is a favorite (swipe right) or gets released
 * (swipe left — still absorbed, still counts for XP and the MCP, just not in
 * the grid). While the pile has cards the `ReviewStack` sits at the top of
 * the list; when it empties on this visit a small "Revisão em dia" card
 * takes its place until the reader leaves.
 *
 * Data: every published idea (`useIdeaCards()`, the `learning_idea_public`
 * view) joined with the user's review rows (`useIdeaReviews()`, one per
 * absorbed idea); material titles come from the feed cards for the kicker
 * above each headline. The grid shows favorites by default, newest decision
 * first; "Ver todas" widens it to everything absorbed. Dimension pills
 * narrow whatever is shown. Nothing here ever calls `collect_idea`; the
 * only write is `review_idea` through `useReviewIdea()` (optimistic, so
 * the stack advances the moment the card flies off).
 */

const EMPTY_REVIEWS: ReadonlyMap<string, IdeaReview> = new Map();
const EMPTY_PENDING: readonly IdeaReview[] = [];

interface AbsorbedRow {
  row: LearningIdeaPublic;
  review: IdeaReview;
}

/**
 * Grid order: most recently reviewed first (unreviewed last), then newest
 * release, then reading order inside the material.
 */
function compareAbsorbed(a: AbsorbedRow, b: AbsorbedRow): number {
  const ra = a.review.reviewedAt ? Date.parse(a.review.reviewedAt) : Number.NEGATIVE_INFINITY;
  const rb = b.review.reviewedAt ? Date.parse(b.review.reviewedAt) : Number.NEGATIVE_INFINITY;
  if (ra !== rb) return rb > ra ? 1 : -1;
  const byRelease = Date.parse(b.row.released_at) - Date.parse(a.row.released_at);
  if (byRelease !== 0) return byRelease;
  return a.row.ordinal - b.row.ordinal;
}

export default function CollectionScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const bottomClearance = useBottomSafeClearance();
  const ideaCards = useIdeaCards();
  const reviews = useIdeaReviews();
  const feed = useLearningFeed();
  const { mutate: reviewIdea } = useReviewIdea();

  const [dimFilter, setDimFilter] = useState<DimensionId | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(true);
  // Flips on the first decision of this visit — once the pile is empty the
  // "Revisão em dia" card shows instead of the stack, until the screen
  // unmounts. A reader arriving with nothing pending sees the grid straight
  // away, no ceremony.
  const [reviewedThisVisit, setReviewedThisVisit] = useState(false);

  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  const byKey = reviews.data?.byKey ?? EMPTY_REVIEWS;
  const pendingReviews = reviews.data?.pending ?? EMPTY_PENDING;

  // material_id → title in the app locale (other language as fallback) —
  // the kicker above every headline shown outside its material.
  const titles = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of feed.data ?? []) {
      const title =
        ideaLocale === 'pt' ? card.title_pt || card.title_en : card.title_en || card.title_pt;
      map.set(card.id, title ?? '');
    }
    return map;
  }, [feed.data, ideaLocale]);

  // Published ideas the user absorbed, each with its review row.
  const absorbed = useMemo<AbsorbedRow[]>(() => {
    const out: AbsorbedRow[] = [];
    for (const row of ideaCards.data ?? []) {
      const review = byKey.get(reviewKey(row.material_id, row.idea_id));
      if (review) out.push({ row, review });
    }
    return out;
  }, [ideaCards.data, byKey]);

  // The pile, oldest absorbed first. A pending row whose idea is no longer
  // published (a re-cut) has no card to show and is skipped.
  const pendingItems = useMemo<ReviewStackItem[]>(() => {
    const rowsByKey = new Map<string, LearningIdeaPublic>();
    for (const a of absorbed) rowsByKey.set(reviewKey(a.row.material_id, a.row.idea_id), a.row);
    const out: ReviewStackItem[] = [];
    for (const r of pendingReviews) {
      const row = rowsByKey.get(reviewKey(r.materialId, r.ideaId));
      if (!row) continue;
      out.push({
        card: toCardDataFromPublic(row),
        kicker: titles.get(row.material_id) ?? '',
        slug: row.slug,
      });
    }
    return out;
  }, [absorbed, pendingReviews, titles]);

  const favorites = useMemo<IdeaCardData[]>(
    () =>
      absorbed
        .filter((a) => a.review.favorite === true)
        .sort(compareAbsorbed)
        .map((a) => toCardDataFromPublic(a.row)),
    [absorbed],
  );
  const everything = useMemo<IdeaCardData[]>(
    () => [...absorbed].sort(compareAbsorbed).map((a) => toCardDataFromPublic(a.row)),
    [absorbed],
  );
  const shown = onlyFavorites ? favorites : everything;

  // Only dimensions that actually hold a shown card get a pill.
  const dims = useMemo(() => {
    const present = new Set(shown.map((c) => c.dimensionId));
    return DIMENSION_ORDER.filter((d) => present.has(d));
  }, [shown]);

  // A filter pointing at a dimension with no cards (toggled to favorites,
  // or a re-cut dropped its last idea) silently falls back to "Todas".
  const activeDim = dimFilter && dims.includes(dimFilter) ? dimFilter : null;
  const visible = useMemo(
    () => (activeDim ? shown.filter((c) => c.dimensionId === activeDim) : shown),
    [shown, activeDim],
  );

  const stackActive = pendingItems.length > 0;
  const showDone = !stackActive && reviewedThisVisit;

  const openIdea = useCallback(
    (card: IdeaCardData) => {
      Haptics.selectionAsync().catch(() => {});
      router.push({
        pathname: '/idea/[slug]',
        params: { slug: card.slug, idea: String(card.ordinal) },
      });
    },
    [router],
  );
  const openStackItem = useCallback(
    (item: ReviewStackItem) => openIdea(item.card),
    [openIdea],
  );

  // Optimistic: the reviews cache drops the item at once and the stack shows
  // the next card; a failed RPC rolls it back and the card returns to the pile.
  const onDecision = useCallback(
    (item: ReviewStackItem, favorite: boolean) => {
      setReviewedThisVisit(true);
      reviewIdea(
        {
          slug: item.slug,
          ideaId: item.card.id,
          favorite,
          // Lets the optimistic update hit the cache row directly instead of
          // resolving the material through the ideaCards cache.
          materialId: item.card.materialId,
        },
        {
          // The optimistic rollback already puts the card back in the pile;
          // say why, or the reader thinks the swipe did not register.
          onError: (e) =>
            showInfo(t('learning.ideas.review.fail'), e instanceof Error ? e.message : ''),
        },
      );
    },
    [reviewIdea, t],
  );

  const selectDim = (dim: DimensionId | null) => {
    Haptics.selectionAsync().catch(() => {});
    setDimFilter(dim);
  };
  const selectOnlyFavorites = (value: boolean) => {
    if (value === onlyFavorites) return;
    Haptics.selectionAsync().catch(() => {});
    setOnlyFavorites(value);
  };

  // The feed only feeds the kickers; waiting for it avoids the titles
  // popping in a beat after the cards, but its failure never blocks the grid.
  const loading = ideaCards.isLoading || reviews.isLoading || feed.isLoading;
  const failed = ideaCards.isError || reviews.isError;

  const subtitle = stackActive
    ? t('learning.ideas.review.pending', { count: pendingItems.length })
    : `${t('learning.ideas.review.favoritesTitle')} · ${favorites.length}`;

  const header = (
    <View>
      {stackActive ? (
        <ReviewStack
          items={pendingItems}
          locale={ideaLocale}
          onDecision={onDecision}
          onOpen={openStackItem}
        />
      ) : showDone ? (
        <View style={styles.doneCard}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={18} color={tokens.bg.deep} />
          </View>
          <View style={styles.doneText}>
            <Text style={styles.doneTitle}>{t('learning.ideas.review.done')}</Text>
            <Text style={styles.doneBody}>{t('learning.ideas.review.doneBody')}</Text>
          </View>
        </View>
      ) : null}

      {/* Pills — favorites toggle, then "Todas" + one per dimension with a card. */}
      {absorbed.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillRow}
        >
          <FilterPill
            label={t('learning.ideas.review.onlyFavorites')}
            iconName="star"
            accent={tokens.semantic.coin}
            active={onlyFavorites}
            onPress={() => selectOnlyFavorites(true)}
          />
          <FilterPill
            label={t('learning.ideas.review.showAll')}
            accent={tokens.semantic.coin}
            active={!onlyFavorites}
            onPress={() => selectOnlyFavorites(false)}
          />
          {dims.length > 0 && (
            <>
              <View style={styles.pillDivider} />
              <FilterPill
                label={t('learning.ideas.allDims')}
                accent={tokens.brand.violet2}
                active={activeDim === null}
                onPress={() => selectDim(null)}
              />
              {dims.map((dimId) => {
                const dim = meta.dim(dimId);
                return (
                  <FilterPill
                    key={dimId}
                    label={dim.label}
                    iconName={dim.iconName as keyof typeof Ionicons.glyphMap}
                    accent={DIMENSION_META[dimId].color}
                    active={activeDim === dimId}
                    onPress={() => selectDim(dimId)}
                  />
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );

  const empty =
    absorbed.length === 0 ? (
      <View style={styles.centerBox}>
        <Ionicons name="albums-outline" size={36} color={tokens.text.dim} />
        <Text style={styles.emptyText}>{t('learning.ideas.myIdeasEmpty')}</Text>
      </View>
    ) : onlyFavorites && favorites.length === 0 ? (
      <View style={styles.centerBox}>
        <Ionicons name="star-outline" size={36} color={tokens.text.dim} />
        <Text style={styles.emptyText}>{t('learning.ideas.review.emptyFavorites')}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground withGoldHalo>
        {/* Header — back chevron + title with the count underneath. */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {t('learning.ideas.myIdeas')}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {loading || failed ? ' ' : subtitle}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : failed ? (
          <View style={styles.centerBox}>
            <Ionicons name="cloud-offline-outline" size={36} color={tokens.text.dim} />
            <Text style={styles.emptyText}>{t('learning.reels.loadError')}</Text>
            <Pressable
              onPress={() => {
                ideaCards.refetch();
                reviews.refetch();
                if (feed.isError) feed.refetch();
              }}
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>{t('learning.reels.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <CollectionGrid
            cards={visible}
            locale={ideaLocale}
            kickers={titles}
            onOpen={openIdea}
            paddingBottom={bottomClearance}
            ListHeaderComponent={header}
            ListEmptyComponent={empty}
          />
        )}
      </ScreenBackground>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter pill — same vocabulary as the Learn tab's active-filter chip:
// tinted fill + solid rim in the accent color when selected.
// ─────────────────────────────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  accent: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, iconName, accent, active, onPress }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.pill,
        active && { backgroundColor: accent + '22', borderColor: accent },
        pressed && { opacity: 0.8 },
      ]}
    >
      {iconName && (
        <Ionicons name={iconName} size={13} color={active ? accent : tokens.text.mid} />
      )}
      <Text style={[styles.pillText, active && { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  subtitle: {
    ...tokens.type.caption,
    color: tokens.semantic.coinLight,
    marginTop: 1,
  },
  /** "Revisão em dia" — takes the stack's place after the last decision. */
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: tokens.bg.glass,
    marginBottom: tokens.space[2],
  },
  doneIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
  },
  doneText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  doneTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  doneBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.mid,
  },
  pillScroll: {
    // flexGrow 0: a ScrollView defaults to flexGrow 1 and would otherwise
    // stretch inside the list header. The negative margin lets the row bleed
    // to the screen edges past the grid's own inset.
    flexGrow: 0,
    marginHorizontal: -tokens.space[4],
    marginBottom: tokens.space[1],
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[1],
    paddingBottom: tokens.space[2],
  },
  pillDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 2,
    backgroundColor: tokens.border.strong,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.glass,
  },
  pillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
    color: tokens.text.mid,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.space[8],
    paddingHorizontal: tokens.space[6],
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.dim,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: tokens.space[2],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.42)',
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.brand.violet2,
  },
});
