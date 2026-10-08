import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useT } from '@/lib/i18n';
import { useIdeaCollection } from '@/lib/ideaCollection';
import { toCardDataFromPublic, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * "Estudar favoritas" — a deck of the reader's favorite ideas, in a random
 * order fixed for the visit, to keep studying what they saved. One big card
 * per page: tap flips it (front: the hook, back: the answer you can use),
 * swipe sideways for the next one, the round arrow on the back opens the
 * whole idea. Nothing is written — no grading, no schedule (phase 1; spaced
 * repetition is the follow-up if the deck gets used).
 */

const MAX_CARD_W = 340;

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export default function IdeaStudyScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const bottomClearance = useBottomSafeClearance();
  const { width: screenW } = useWindowDimensions();
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  const { absorbed, loading } = useIdeaCollection(ideaLocale);

  // The order is drawn once, when the favorites first land: a refetch while
  // studying must not reshuffle the deck under the reader's thumb.
  const orderRef = useRef<string[] | null>(null);
  const deck = useMemo<IdeaCardData[]>(() => {
    const favs = absorbed
      .filter((a) => a.review.favorite === true)
      .map((a) => toCardDataFromPublic(a.row));
    if (favs.length === 0) return [];
    const key = (c: IdeaCardData) => `${c.materialId}:${c.id}`;
    if (!orderRef.current) orderRef.current = shuffled(favs).map(key);
    const byKey = new Map(favs.map((c) => [key(c), c]));
    const ordered = orderRef.current.map((k) => byKey.get(k)).filter((c): c is IdeaCardData => !!c);
    // Favorites added meanwhile go to the end.
    const known = new Set(orderRef.current);
    return [...ordered, ...favs.filter((c) => !known.has(key(c)))];
  }, [absorbed]);

  const [index, setIndex] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const cardW = Math.min(MAX_CARD_W, screenW - 2 * tokens.space[6]);

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
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {t('learning.ideas.study.title')}
            </Text>
            {deck.length > 0 ? (
              <Text style={styles.subtitle}>
                {t('learning.ideas.study.counter', {
                  n: Math.min(index + 1, deck.length),
                  total: deck.length,
                })}
              </Text>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : deck.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="star-outline" size={36} color={tokens.text.dim} />
            <Text style={styles.empty}>{t('learning.ideas.study.empty')}</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={deck}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => `${c.materialId}:${c.id}`}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              getItemLayout={(_, i) => ({ length: screenW, offset: screenW * i, index: i })}
              renderItem={({ item }) => (
                <View style={[styles.page, { width: screenW }]}>
                  <IdeaCard
                    data={item}
                    width={cardW}
                    locale={ideaLocale}
                    collected
                    quiet
                    onOpen={() => openIdea(item)}
                    openAffordance="corner"
                  />
                </View>
              )}
            />
            <Text style={[styles.hint, { marginBottom: bottomClearance + tokens.space[4] }]}>
              {t('learning.ideas.study.hint')}
            </Text>
          </>
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
  titleCol: { flex: 1, minWidth: 0 },
  title: { ...tokens.type.h3, color: tokens.text.hi },
  subtitle: { ...tokens.type.caption, color: tokens.text.mid, marginTop: 1 },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    textAlign: 'center',
    paddingHorizontal: tokens.space[6],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[6],
  },
  empty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.dim,
    textAlign: 'center',
  },
});
