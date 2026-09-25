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
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { IdeaShelf, shelfCardWidth } from '@/components/ideas/IdeaShelf';
import { ScreenBackground } from '@/components/ScreenBackground';
import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { compareAbsorbed, useIdeaCollection } from '@/lib/ideaCollection';
import { toCardDataFromPublic, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { buildHaystack, matchesQuery } from '@/lib/learningSearch';
import { tokens } from '@/theme';
import { DIMENSION_ORDER } from '@/theme/dimensions';

/**
 * "Minhas ideias" — the reader's shelf of absorbed ideas.
 *
 * Top to bottom: a search box, the "N pra revisar" strip (only while the
 * review pile has cards; it opens `/idea-review` — the pile no longer sits
 * in front of the collection), the Favoritas / Ver todas toggle, then one
 * horizontal shelf per dimension (`IdeaShelf`), in the app's dimension
 * order, each holding that dimension's cards newest decision first. The
 * shelves are the organization; there are no dimension pills any more.
 *
 * Search runs in memory over each idea's title and claim (both languages),
 * its material's title, and its dimension and sub labels — per word,
 * accent-blind, one typo tolerated (`lib/learningSearch`). It narrows the
 * shelves in place and ignores the Favoritas toggle: someone looking for
 * an idea by name wants it wherever it is.
 *
 * Nothing here writes: the flip is reveal-only and the round arrow on the
 * back of a card opens its idea.
 */

type Card = IdeaCardData & { haystack: string; favorite: boolean };

export default function CollectionScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const bottomClearance = useBottomSafeClearance();
  const { width: screenW } = useWindowDimensions();
  const cardWidth = shelfCardWidth(screenW);

  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  const { absorbed, pending, materials, loading, failed, retry } = useIdeaCollection(ideaLocale);

  const [onlyFavorites, setOnlyFavorites] = useState(true);
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  // Every absorbed idea, in collection order, with its search haystack.
  const cards = useMemo<Card[]>(
    () =>
      [...absorbed].sort(compareAbsorbed).map(({ row, review }) => {
        const material = materials.get(row.material_id);
        return {
          ...toCardDataFromPublic(row),
          favorite: review.favorite === true,
          haystack: buildHaystack([
            row.title_pt,
            row.title_en,
            row.claim_pt,
            row.claim_en,
            material?.title_pt,
            material?.title_en,
            meta.dim(row.dimension_id).label,
            ...(material?.subs ?? []).map((s) => meta.sub(s).label),
          ]),
        };
      }),
    [absorbed, materials, meta],
  );

  const favoriteCount = useMemo(() => cards.filter((c) => c.favorite).length, [cards]);

  const visible = useMemo(
    () =>
      searching
        ? cards.filter((c) => matchesQuery(c.haystack, query))
        : onlyFavorites
          ? cards.filter((c) => c.favorite)
          : cards,
    [cards, searching, query, onlyFavorites],
  );

  const shelves = useMemo(() => {
    const byDim = new Map<DimensionId, IdeaCardData[]>();
    for (const c of visible) {
      const list = byDim.get(c.dimensionId);
      if (list) list.push(c);
      else byDim.set(c.dimensionId, [c]);
    }
    return DIMENSION_ORDER.filter((d) => byDim.has(d)).map((d) => ({
      dimensionId: d,
      cards: byDim.get(d) as IdeaCardData[],
    }));
  }, [visible]);

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

  const openReview = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/idea-review');
  };

  const selectOnlyFavorites = (value: boolean) => {
    if (value === onlyFavorites) return;
    Haptics.selectionAsync().catch(() => {});
    setOnlyFavorites(value);
  };

  const subtitle = t('learning.ideas.review.countSummary', {
    favorites: favoriteCount,
    total: cards.length,
  });

  const empty =
    absorbed.length === 0 ? (
      <EmptyState icon="albums-outline" text={t('learning.ideas.myIdeasEmpty')} />
    ) : searching ? (
      <EmptyState icon="search" text={t('learning.ideas.searchEmpty', { query: query.trim() })} />
    ) : onlyFavorites && favoriteCount === 0 ? (
      <EmptyState icon="star-outline" text={t('learning.ideas.review.emptyFavorites')} />
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        {/* Header — back chevron + title with the counts underneath. */}
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
              onPress={retry}
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>{t('learning.reels.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: bottomClearance + 16 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {absorbed.length > 0 && (
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color={tokens.text.dim} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('learning.ideas.searchPlaceholder')}
                  placeholderTextColor={tokens.text.faint}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable
                    onPress={() => setQuery('')}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.clear')}
                  >
                    <Ionicons name="close-circle" size={16} color={tokens.text.dim} />
                  </Pressable>
                )}
              </View>
            )}

            {pending.length > 0 && !searching && (
              <Pressable
                onPress={openReview}
                accessibilityRole="button"
                style={({ pressed }) => [styles.reviewStrip, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.reviewIcon}>
                  <Ionicons name="layers-outline" size={17} color={tokens.brand.violet2} />
                </View>
                <View style={styles.reviewText}>
                  <Text style={styles.reviewTitle}>
                    {t('learning.ideas.review.fabPending', { count: pending.length })}
                  </Text>
                  <Text style={styles.reviewBody} numberOfLines={1}>
                    {t('learning.ideas.review.stripBody')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={tokens.text.mid} />
              </Pressable>
            )}

            {absorbed.length > 0 && !searching && (
              <View style={styles.pillRow}>
                <FilterPill
                  label={t('learning.ideas.review.onlyFavorites')}
                  iconName="star"
                  active={onlyFavorites}
                  onPress={() => selectOnlyFavorites(true)}
                />
                <FilterPill
                  label={t('learning.ideas.review.showAll')}
                  active={!onlyFavorites}
                  onPress={() => selectOnlyFavorites(false)}
                />
              </View>
            )}

            {shelves.length > 0 ? (
              <View style={styles.shelves}>
                {shelves.map((s) => (
                  <IdeaShelf
                    key={s.dimensionId}
                    dimensionId={s.dimensionId}
                    label={meta.dim(s.dimensionId).label}
                    cards={s.cards}
                    cardWidth={cardWidth}
                    locale={ideaLocale}
                    onOpen={openIdea}
                  />
                ))}
              </View>
            ) : (
              empty
            )}
          </ScrollView>
        )}
      </ScreenBackground>
    </SafeAreaView>
  );
}

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.centerBox}>
      <Ionicons name={icon} size={36} color={tokens.text.dim} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter pill — tinted fill + solid rim in violet when selected.
// ─────────────────────────────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, iconName, active, onPress }: FilterPillProps) {
  const accent = tokens.brand.violet2;
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
    color: tokens.text.mid,
    marginTop: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: tokens.space[2],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: tokens.space[3],
    marginHorizontal: tokens.space[4],
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: tokens.text.hi,
    ...tokens.type.body,
    paddingVertical: 0,
  },
  /** "N pra revisar" — opens the review pile. */
  reviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.35)',
    backgroundColor: 'rgba(123, 92, 255, 0.10)',
  },
  reviewIcon: {
    width: 34,
    height: 34,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
  },
  reviewText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  reviewTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  reviewBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
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
  shelves: {
    gap: tokens.space[6],
    marginTop: tokens.space[5],
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
