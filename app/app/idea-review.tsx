import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ReviewStack, type ReviewStackItem } from '@/components/ideas/ReviewStack';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useReviewIdea } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { useIdeaCollection } from '@/lib/ideaCollection';
import { toCardDataFromPublic, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * "Revisar ideias" — the review pile, on its own screen.
 *
 * Every absorbed idea waits here once (`reviewed_at IS NULL`); the reader
 * decides, one card at a time, whether it is a favorite (swipe right) or gets
 * released (swipe left — still absorbed, still counts for XP and the MCP,
 * just out of the favorites). It used to sit on top of "Minhas ideias" and
 * had to be emptied before the collection was reachable; now the collection
 * shows a compact "N pra revisar" strip that opens this screen, and
 * reviewing is something the reader chooses to do.
 *
 * The only write is `review_idea` through `useReviewIdea()` (optimistic, so
 * the stack advances the moment the card flies off). When the pile empties
 * the screen says so and offers the way back.
 */
export default function IdeaReviewScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const bottomClearance = useBottomSafeClearance();
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  const { pending, titles, loading, failed, retry } = useIdeaCollection(ideaLocale);
  const { mutate: reviewIdea } = useReviewIdea();

  const items = useMemo<ReviewStackItem[]>(
    () =>
      pending.map(({ row }) => ({
        card: toCardDataFromPublic(row),
        kicker: titles.get(row.material_id) ?? '',
        slug: row.slug,
      })),
    [pending, titles],
  );

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
  const openStackItem = useCallback((item: ReviewStackItem) => openIdea(item.card), [openIdea]);

  // Optimistic: the reviews cache drops the item at once and the stack shows
  // the next card; a failed RPC rolls it back and the card returns to the pile.
  const onDecision = useCallback(
    (item: ReviewStackItem, favorite: boolean) => {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
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
          <Text style={styles.title} numberOfLines={1}>
            {t('learning.ideas.review.title')}
          </Text>
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
        ) : items.length > 0 ? (
          <ScrollView
            contentContainerStyle={[styles.stackContent, { paddingBottom: bottomClearance }]}
            showsVerticalScrollIndicator={false}
          >
            <ReviewStack
              items={items}
              locale={ideaLocale}
              onDecision={onDecision}
              onOpen={openStackItem}
            />
          </ScrollView>
        ) : (
          <View style={styles.centerBox}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark" size={22} color={tokens.text.hi} />
            </View>
            <Text style={styles.doneTitle}>{t('learning.ideas.review.done')}</Text>
            <Text style={styles.emptyText}>{t('learning.ideas.review.doneBody')}</Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>{t('learning.ideas.review.backToCollection')}</Text>
            </Pressable>
          </View>
        )}
      </ScreenBackground>
    </SafeAreaView>
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
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    flex: 1,
  },
  stackContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.space[8],
    paddingHorizontal: tokens.space[6],
  },
  doneIcon: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.5)',
    marginBottom: tokens.space[1],
  },
  doneTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: tokens.text.hi,
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
