import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReelsViewer } from '@/components/reels/ReelsViewer';
import { useLearningFeed, useReadMaterialIds } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { buildReelDeck, type ReelGroup } from '@/lib/reels';
import { useReelsProgressStore, useReelsProgressReady, reelsToday } from '@/lib/reelsProgress';
import { tokens } from '@/theme';

/**
 * Study Reels — fullscreen story-style pass over the Learning infographics.
 *
 * The deck is built ONCE per open and frozen in a ref: marking a material
 * read mid-session updates queries, and a reactive deck would reorder under
 * the user's thumb. A fresh open rebuilds with the latest read/seen state.
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
  const storeReady = useReelsProgressReady();

  const deckRef = useRef<ReelGroup[] | null>(null);
  const initialIndexRef = useRef(0);

  const ready = !feed.isLoading && !reads.isLoading && storeReady;
  if (ready && deckRef.current === null && feed.data) {
    const { entries, session } = useReelsProgressStore.getState();
    const seenAt = Object.fromEntries(
      Object.values(entries).map((e) => [e.slug, e.seenAt]),
    );
    const deck = buildReelDeck(
      feed.data,
      locale === 'pt' ? 'pt' : 'en',
      reads.data ?? new Set<string>(),
      seenAt,
    );
    deckRef.current = deck;

    let idx = -1;
    if (params.slug) idx = deck.findIndex((g) => g.slug === params.slug);
    if (idx < 0 && session && session.day === reelsToday()) {
      const i = deck.findIndex((g) => g.slug === session.slug);
      // A concluded material sorts into the read-replay TAIL of the deck;
      // resuming there would strand the user past every unread group and
      // unlock the whole deck. Resume only while it's still unread —
      // otherwise fall through to index 0, the freshest unread material.
      if (i >= 0 && !(reads.data ?? new Set<string>()).has(deck[i]!.materialId)) {
        idx = i;
      }
    }
    initialIndexRef.current = Math.max(0, idx);
  }

  const deck = deckRef.current;

  if (!deck) {
    // fullScreenModal with no header: this branch must always offer an
    // exit, and a failed query (offline cold open) must not spin forever.
    const errored = feed.isError || reads.isError || (ready && !feed.data);
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
