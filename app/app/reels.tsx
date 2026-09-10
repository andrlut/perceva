import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReelsViewer } from '@/components/reels/ReelsViewer';
import {
  useCollectedIdeas,
  useIdeaCards,
  useLearningFeed,
  useReadMaterialIds,
} from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { buildReelDeck, isGroupRead, type ReelGroup } from '@/lib/reels';
import { useReelsProgressStore, useReelsProgressReady, reelsToday } from '@/lib/reelsProgress';
import { tokens } from '@/theme';

/**
 * Study Reels — fullscreen story-style pass over the Learning catalog:
 * the legacy materials' infographics plus one native card per idea.
 *
 * The deck is built ONCE per open and frozen in a ref: marking a material
 * read (or absorbing an idea) mid-session updates queries, and a reactive
 * deck would reorder under the user's thumb. A fresh open rebuilds with
 * the latest read/collected/seen state.
 *
 * Optional `slug` param starts on that material; otherwise a same-day
 * session resumes where it left off.
 */
export default function ReelsScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const params = useLocalSearchParams<{ slug?: string }>();

  const feed = useLearningFeed();
  const reads = useReadMaterialIds();
  // Idea cards + the user's collection — both must land before the deck is
  // built, or the ideas would all sort as unread and the first open would
  // freeze that order for the session.
  const ideaCards = useIdeaCards();
  const collected = useCollectedIdeas();
  const storeReady = useReelsProgressReady();

  const deckRef = useRef<ReelGroup[] | null>(null);
  const initialIndexRef = useRef(0);

  const ready =
    !feed.isLoading &&
    !reads.isLoading &&
    !ideaCards.isLoading &&
    !collected.isLoading &&
    storeReady;
  if (ready && deckRef.current === null && feed.data) {
    const { entries, session } = useReelsProgressStore.getState();
    const seenAt = Object.fromEntries(
      Object.values(entries).map((e) => [e.slug, e.seenAt]),
    );
    const readSet = reads.data ?? new Set<string>();
    const collectedMap = collected.data ?? new Map<string, Set<string>>();
    const deck = buildReelDeck(
      feed.data,
      locale === 'pt' ? 'pt' : 'en',
      readSet,
      seenAt,
      ideaCards.data ?? [],
      collectedMap,
    );
    deckRef.current = deck;

    let idx = -1;
    if (params.slug) idx = deck.findIndex((g) => g.slug === params.slug);
    if (idx < 0 && session && session.day === reelsToday()) {
      const i = deck.findIndex((g) => g.slug === session.slug);
      // A concluded material (or an absorbed idea) sorts into the
      // read-replay TAIL of the deck; resuming there would strand the user
      // past every unread group and unlock the whole deck. Resume only
      // while it's still unread — otherwise fall through to index 0, the
      // freshest unread group.
      if (i >= 0 && !isGroupRead(deck[i]!, readSet, collectedMap)) {
        idx = i;
      }
    }
    initialIndexRef.current = Math.max(0, idx);
  }

  const deck = deckRef.current;

  if (!deck) {
    // fullScreenModal with no header: this branch must always offer an
    // exit, and a failed query (offline cold open) must not spin forever.
    const errored =
      feed.isError ||
      reads.isError ||
      ideaCards.isError ||
      collected.isError ||
      (ready && !feed.data);
    return (
      <View style={styles.fallback}>
        {errored ? (
          <>
            <Ionicons name="cloud-offline-outline" size={36} color={tokens.text.dim} />
            <Text style={styles.emptyText}>{t('learning.reels.loadError')}</Text>
            <Pressable
              onPress={() => {
                void feed.refetch();
                void reads.refetch();
                void ideaCards.refetch();
                void collected.refetch();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.closeText}>{t('learning.reels.retry')}</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={tokens.brand.violet2} />
        )}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.closeText}>{t('learning.reels.close')}</Text>
        </Pressable>
      </View>
    );
  }

  if (deck.length === 0) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="images-outline" size={36} color={tokens.text.dim} />
        <Text style={styles.emptyText}>{t('learning.reels.empty')}</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.closeText}>{t('learning.reels.close')}</Text>
        </Pressable>
      </View>
    );
  }

  return <ReelsViewer groups={deck} initialIndex={initialIndexRef.current} />;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#05070F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: tokens.space[7],
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.dim,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: tokens.space[3],
    paddingHorizontal: tokens.space[5],
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  closeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
});
