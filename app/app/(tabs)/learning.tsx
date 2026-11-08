import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavClearance } from '@/components/BottomNavBar';
import { FabStack, fabStackClearance, type FabSize } from '@/components/FabStack';
import { ScreenInfoButton } from '@/components/guide/ScreenInfoButton';
import { RecantoGuide, useRecantoGuidePrompt } from '@/components/guide/screens/RecantoGuide';
import { InfoSheet } from '@/components/InfoSheet';
import { LockedScreen } from '@/components/unlock/LockedScreen';
import { UnlockDoor } from '@/components/unlock/UnlockDoor';
import { useMaterialLock } from '@/lib/premium';
import { useIsLocked } from '@/lib/unlock';
import { CarouselRow } from '@/components/learning/CarouselRow';
import { ContinueLendoCard } from '@/components/learning/ContinueLendoCard';
import type { CoverIdeaMeta } from '@/components/learning/CoverCard';
import { IdeasCountBadge } from '@/components/learning/IdeasCountBadge';
import {
  LearningFilterRow,
  type PillFilter,
  type ReadFilter,
} from '@/components/learning/LearningFilterRow';
import { TrainEntryTile } from '@/components/ideas/TrainEntryTile';
import { ReelsEntryCard } from '@/components/reels/ReelsEntryCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  useCollectedIdeas,
  useIdeaCards,
  useIdeaReviews,
  useLearningFeed,
  useReadMaterialIds,
  type LearningFeedCard,
} from '@/lib/api/learning';
import type { DimensionId, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useIdeaTraining } from '@/lib/ideaTraining';
import type { IdeaLocale } from '@/lib/ideas';
import { categoryOf } from '@/lib/learningCategory';
import { buildHaystack, matchesQuery } from '@/lib/learningSearch';
import { sponsorOf } from '@/lib/learningSponsor';
import {
  useContinueReading,
  useReadingProgressReady,
} from '@/lib/readingProgress';
import { buildReelDeck, isGroupRead } from '@/lib/reels';
import { useReelsProgressReady, useReelsProgressStore } from '@/lib/reelsProgress';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { tokens } from '@/theme';
import { DIMENSION_ORDER } from '@/theme/dimensions';

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Stable empty collection so the idea memos don't churn while loading. */
const EMPTY_COLLECTION: Map<string, Set<string>> = new Map();

/** The Continue pick for a material with ideas (0 < absorbed < total). */
interface IdeaContinuePick {
  card: LearningFeedCard;
  /** absorbed / total, 0..100, rounded. */
  percent: number;
}

/** The one floating button of this screen ("Minhas ideias"). The feed
 *  reserves exactly its height (fabStackClearance), so resize it here, not
 *  inline. */
const IDEAS_FAB_SIZE: FabSize = 'lg';
const LEARNING_FAB_CLEARANCE = fabStackClearance([IDEAS_FAB_SIZE]);

/** Progressive lock (doc "Onboarding simples", Fase 2): locked → the
 *  "what opens it" screen; first opening → the animated door over the
 *  real content; after that, the tab as it always was. */
export default function LearningScreen() {
  const locked = useIsLocked('learning');
  if (locked) return <LockedScreen feature="learning" />;
  return (
    <>
      <LearningScreenContent />
      <UnlockDoor feature="learning" />
    </>
  );
}

function LearningScreenContent() {
  const router = useRouter();
  const isMaterialLocked = useMaterialLock();
  const isLockedCard = useCallback(
    (card: LearningFeedCard) => isMaterialLocked(card.released_at, sponsorOf(card) != null),
    [isMaterialLocked],
  );
  const { t, locale } = useT();
  const feed = useLearningFeed();
  // Pull indicator is local state — the feed's isFetching also flips on
  // background refetches (app foreground), which would show the spinner
  // without a pull.
  const pull = usePullToRefresh(() => feed.refetch());
  const reads = useReadMaterialIds();
  // Ideas: one row per published idea + the user's collection. Both cheap
  // (a view select and a two-column self-only select) and cached 5 min /
  // 1 min; they feed the cover cards' "N ideias · c/N" and the Continue
  // card. The review state (a third self-only select, cached 1 min) only
  // drives the badge on the "Minhas ideias" bulb FAB: ideas absorbed but
  // not yet reviewed. Hidden at 0 and while loading — no flash.
  const ideaCards = useIdeaCards();
  const collectedIdeas = useCollectedIdeas();
  const ideaReviews = useIdeaReviews();
  const pendingReviews = ideaReviews.data?.pendingCount ?? 0;
  const meta = useMetaLookup();
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  // Treino do dia: favorites due today. Rides the same three queries as
  // above (cache hits), so the "Treinar" tile costs no extra request.
  const training = useIdeaTraining(ideaLocale);

  const [readFilter, setReadFilter] = useState<ReadFilter>('unread');
  const [pillFilter, setPillFilter] = useState<PillFilter>(null);
  const [query, setQuery] = useState('');
  // The magnifier top right opens the search field above the filter row;
  // closing it clears the query (as in Gerenciar práticas), so a search can
  // never stay applied out of sight.
  const [searchOpen, setSearchOpen] = useState(false);
  const toggleSearch = () => {
    Haptics.selectionAsync().catch(() => {});
    setSearchOpen((open) => {
      if (open) setQuery('');
      return !open;
    });
  };
  // The (i) top right: the tab's guide.
  const [helpOpen, setHelpOpen] = useState(false);
  const guidePrompt = useRecantoGuidePrompt();
  const bottomClearance = useBottomNavClearance();

  // Hydrate the persisted scroll-progress store on first paint so the
  // ContinueLendoCard can pick the right material without flashing an
  // empty state on cold start.
  useReadingProgressReady();
  // Hydrate the reels store too — the entry card's deck order (seenAt for
  // the replay tail) must match what the viewer builds on open.
  useReelsProgressReady();
  const continueEntry = useContinueReading();
  // Match the in-progress entry to a card from the feed (the entry
  // alone has slug + materialId; we need the title/dim/etc).
  const continueCard = useMemo<LearningFeedCard | null>(() => {
    if (!continueEntry) return null;
    const card = (feed.data ?? []).find((c) => c.slug === continueEntry.slug) ?? null;
    // A stale scroll entry for a material that has since gained ideas is not
    // a legacy candidate: those measure progress in absorbed ideas, never in
    // scroll (the new screen does not write the readingProgress store).
    return card && card.idea_count === 0 ? card : null;
  }, [continueEntry, feed.data]);

  // Chronological: newest released material first. Sorting once at the
  // source means every derived bucket (filtered, byDim, novidades)
  // inherits the order without each carousel re-sorting.
  const all = useMemo(
    () =>
      (feed.data ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.released_at).getTime() - new Date(a.released_at).getTime(),
        ),
    [feed.data],
  );
  const readSet = useMemo(() => reads.data ?? new Set<string>(), [reads.data]);

  // ── Ideas ───────────────────────────────────────────────────────────
  const collectedMap = collectedIdeas.data ?? EMPTY_COLLECTION;

  // material_id → { collected, total, hasVideo }. `total` counts the view's
  // rows (published ideas), `collected` only the ids still present in them,
  // so a re-cut that dropped an idea never over-counts. Insertion order is
  // the view's order (released_at desc), which the Continue pick relies on.
  const ideaMetaByMaterial = useMemo(() => {
    const out = new Map<string, CoverIdeaMeta>();
    for (const row of ideaCards.data ?? []) {
      let m = out.get(row.material_id);
      if (!m) {
        m = { collected: 0, total: 0, hasVideo: false };
        out.set(row.material_id, m);
      }
      m.total += 1;
      if (collectedMap.get(row.material_id)?.has(row.idea_id)) m.collected += 1;
      if (row.video_pt_path || row.video_en_path) m.hasVideo = true;
    }
    return out;
  }, [ideaCards.data, collectedMap]);

  // material_id → everything a reader might type from memory. Both locales
  // go in (people remember the title they read, whichever it was), and so do
  // the ideas' titles and claims: an idea ("25 vezes o gasto") sticks more
  // than the material it sits in.
  const haystacks = useMemo(() => {
    const byMaterial = new Map<string, string[]>();
    for (const row of ideaCards.data ?? []) {
      const parts = byMaterial.get(row.material_id) ?? [];
      parts.push(row.title_pt, row.title_en, row.claim_pt, row.claim_en);
      byMaterial.set(row.material_id, parts);
    }
    const out = new Map<string, string>();
    for (const c of all) {
      out.set(
        c.id,
        buildHaystack([
          c.title_pt,
          c.title_en,
          c.summary_pt,
          c.summary_en,
          c.topic,
          c.slug.replace(/-/g, ' '),
          meta.dim(c.dimension_id).label,
          ...c.subs.map((s) => meta.sub(s).label),
          // "Paker" finds the partner's material.
          sponsorOf(c)?.name,
          ...(byMaterial.get(c.id) ?? []),
        ]),
      );
    }
    return out;
  }, [all, ideaCards.data, meta]);

  // Continue pick for ideas: the most recently released material with some
  // but not all ideas absorbed (the map keeps the view's released_at desc
  // order). Wins over the legacy scroll candidate.
  const ideaContinue = useMemo<IdeaContinuePick | null>(() => {
    for (const [materialId, m] of ideaMetaByMaterial) {
      if (m.collected <= 0 || m.collected >= m.total) continue;
      const card = all.find((c) => c.id === materialId);
      if (!card) continue;
      return { card, percent: Math.round((m.collected / m.total) * 100) };
    }
    return null;
  }, [ideaMetaByMaterial, all]);

  // Study Reels deck — drives the entry card (thumbnails + unread count).
  // The viewer builds its own frozen copy when it opens; this one is only
  // presentation state for the card. Legacy materials and one card per
  // idea mix in the same deck (`ideaCards` rows + the collection decide
  // which ideas still count as fresh).
  const reelSeen = useReelsProgressStore((s) => s.entries);
  const reelDeck = useMemo(() => {
    const seenAt = Object.fromEntries(
      Object.values(reelSeen).map((e) => [e.slug, e.seenAt]),
    );
    return buildReelDeck(
      all,
      locale === 'pt' ? 'pt' : 'en',
      readSet,
      seenAt,
      ideaCards.data,
      collectedMap,
    );
  }, [all, locale, readSet, reelSeen, ideaCards.data, collectedMap]);
  // Unread materials + ideas not yet absorbed.
  const reelUnread = useMemo(
    () => reelDeck.filter((g) => !isGroupRead(g, readSet, collectedMap)).length,
    [reelDeck, readSet, collectedMap],
  );
  // The entry row waits for every query either tile reads (the reads and
  // the idea/collection/review queries), so the Explorar count never
  // flashes inflated and Treinar never draws full width before Explorar
  // lands beside it. Treinar is always there once ready — below five
  // favorites it is how the reader finds out the training exists.
  const entryRowReady =
    !feed.isLoading &&
    !reads.isLoading &&
    !ideaCards.isLoading &&
    !collectedIdeas.isLoading &&
    !training.loading;
  const showExplore = entryRowReady && reelDeck.length > 0;
  const showTrain = entryRowReady;

  // Apply both filters (read-state AND pill). Each carousel reads from
  // the same filtered set, so empty groups drop out naturally.
  const filtered = useMemo(() => {
    return all.filter((c) => {
      // Read-state filter
      if (readFilter !== 'all') {
        const r = readSet.has(c.id);
        if (readFilter === 'read' && !r) return false;
        if (readFilter === 'unread' && r) return false;
      }
      // Pill filter — exclusive (only one active at a time)
      if (pillFilter) {
        if (pillFilter.kind === 'dim' && c.dimension_id !== pillFilter.value) return false;
        if (pillFilter.kind === 'category' && categoryOf(c) !== pillFilter.value) return false;
        if (pillFilter.kind === 'sub' && !c.subs.includes(pillFilter.value as SubId)) return false;
      }
      // Free-text search — stacks on top of the pill and read filters
      if (query.trim() && !matchesQuery(haystacks.get(c.id) ?? '', query)) return false;
      return true;
    });
  }, [all, readFilter, readSet, pillFilter, query, haystacks]);

  // Group buckets for the carousel rows. We compute against `filtered`
  // so empty groups drop out naturally.
  // Partner content gets its own first row and leaves Novidades, so the two
  // top rows never repeat the same cover; it stays in its dimension row,
  // like every material.
  const buckets = useMemo(() => {
    const now = Date.now();
    const partner: LearningFeedCard[] = [];
    const novidades: LearningFeedCard[] = [];
    for (const c of filtered) {
      if (sponsorOf(c)) partner.push(c);
      else if (now - new Date(c.released_at).getTime() < NEW_WINDOW_MS) novidades.push(c);
    }

    const byDim = new Map<DimensionId, LearningFeedCard[]>();
    for (const c of filtered) {
      const arr = byDim.get(c.dimension_id) ?? [];
      arr.push(c);
      byDim.set(c.dimension_id, arr);
    }

    return { partner, novidades, byDim };
  }, [filtered]);

  // useCallback obrigatorio: e dep do renderItem da CarouselRow, e uma
  // identidade nova a cada render anularia o memo de todos os CoverCard.
  const onCardPress = useCallback(
    (card: LearningFeedCard) => {
      Haptics.selectionAsync().catch(() => {});
      router.push(`/material/${card.slug}`);
    },
    [router],
  );

  /** Uma entrada por carrossel — os dados da FlatList vertical. */
  const sections = useMemo(() => {
    const out: {
      key: string;
      title: string;
      iconName: keyof typeof Ionicons.glyphMap;
      accentColor: string;
      cards: LearningFeedCard[];
      groupLabel?: string;
    }[] = [];

    if (buckets.partner.length > 0) {
      out.push({
        key: 'partner',
        title: t('learning.sectionPartner'),
        iconName: 'ribbon',
        accentColor: tokens.semantic.coin,
        cards: buckets.partner,
      });
    }

    if (buckets.novidades.length > 0) {
      out.push({
        key: 'novidades',
        title: t('learning.section.new'),
        iconName: 'sparkles',
        accentColor: tokens.semantic.coinLight,
        cards: buckets.novidades,
      });
    }

    let first = true;
    for (const dimId of DIMENSION_ORDER) {
      const list = buckets.byDim.get(dimId);
      if (!list || list.length === 0) continue;
      const dim = meta.dim(dimId);
      out.push({
        key: dimId,
        title: dim.label,
        iconName: dim.iconName as keyof typeof Ionicons.glyphMap,
        accentColor: dim.color,
        cards: list,
        // O rotulo "Por dimensao" acompanha a PRIMEIRA linha de dimensao em
        // vez de um wrapper fixo: sem nenhuma linha ele simplesmente nao
        // aparece, em vez de ficar orfao como acontecia antes.
        groupLabel: first ? t('learning.section.byDim') : undefined,
      });
      first = false;
    }

    return out;
  }, [buckets, meta, t]);

  const listRef = useRef<FlatList<(typeof sections)[number]>>(null);

  const renderSection = useCallback(
    ({ item }: { item: (typeof sections)[number] }) => {
      const row = (
        <CarouselRow
          title={item.title}
          iconName={item.iconName}
          accentColor={item.accentColor}
          cards={item.cards}
          readSet={readSet}
          onCardPress={onCardPress}
          count={item.cards.length}
          ideaMetaByMaterial={ideaMetaByMaterial}
          isLockedCard={isLockedCard}
        />
      );
      return (
        <View>
          {item.groupLabel && (
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionGroupTitle}>{item.groupLabel}</Text>
            </View>
          )}
          {row}
        </View>
      );
    },
    [readSet, onCardPress, ideaMetaByMaterial, isLockedCard],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground withGoldHalo>
        {/* FlatList e nao ScrollView: com o catalogo cheio, montar as 8
           linhas de uma vez (cada uma com todos os seus cards) era o que
           travava a aba. Sem removeClippedSubviews e com windowSize 5 de
           proposito: desmontar uma CarouselRow zera o offset horizontal
           dela, entao rolar pra baixo e voltar jogaria a linha de volta no
           primeiro card. Sao no maximo 8 linhas — o ganho grande vem da
           FlatList horizontal dentro de cada uma. */}
        <FlatList
          ref={listRef}
          data={sections}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true });
          }}
          keyExtractor={(s) => s.key}
          renderItem={renderSection}
          contentContainerStyle={{ paddingBottom: bottomClearance + LEARNING_FAB_CLEARANCE }}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={5}
          // The search field lives in the header: a tap on its clear button
          // or on a chip must land while the keyboard is up.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={pull.refreshing}
              onRefresh={pull.onRefresh}
              tintColor={tokens.text.mid}
            />
          }
          ListHeaderComponent={
            <>
          {/* Header — the magnifier beside the (i), the same corner pair as
             Gerenciar práticas. Tab headers draw bare glyphs like their (i)
             (40px box); the stack screens' chips are ManageTopBar's. */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('learning.title')}</Text>
            {!feed.isLoading && all.length > 0 && (
              <Pressable
                onPress={toggleSearch}
                hitSlop={10}
                style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityState={{ expanded: searchOpen }}
                accessibilityLabel={
                  searchOpen ? t('learning.search.close') : t('learning.search.open')
                }
              >
                <Ionicons
                  name={searchOpen ? 'close' : 'search-outline'}
                  size={23}
                  color={searchOpen ? tokens.brand.violet2 : tokens.text.mid}
                />
              </Pressable>
            )}
            <ScreenInfoButton
              onPress={() => setHelpOpen(true)}
              a11yLabel={t('learning.help.a11y')}
            />
          </View>

          {/* Entry row: Explorar (Study Reels, the story-mode pass over the
             idea cards; hidden when nothing is story-ready) and Treinar beside
             it, always. One compact row, so
             the entry cards never eat the first screen — the tab is about
             the materials below. */}
          {(showExplore || showTrain) && (
            <View style={styles.entryRow}>
              {showExplore && (
                <ReelsEntryCard
                  groups={reelDeck}
                  unreadCount={reelUnread}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/reels');
                  }}
                  style={styles.entryExplore}
                />
              )}
              {showTrain && (
                <TrainEntryTile
                  due={training.dueCount}
                  favorites={training.favorites}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/idea-train');
                  }}
                  style={styles.entryTrain}
                />
              )}
            </View>
          )}

          {/* Continue lendo — the third entry tile, full width under the
             row and in the same chassis. Ideas first: a material with some
             but not all ideas absorbed (bar = absorbed/total). Otherwise
             the legacy pick — at least 5% scroll progress on an article,
             most recently touched one. */}
          {ideaContinue ? (
            <ContinueLendoCard
              card={ideaContinue.card}
              percent={ideaContinue.percent}
              onPress={() => router.push(`/material/${ideaContinue.card.slug}`)}
              style={styles.continueTile}
            />
          ) : continueCard && continueEntry ? (
            <ContinueLendoCard
              card={continueCard}
              percent={continueEntry.percent}
              onPress={() => router.push(`/material/${continueCard.slug}`)}
              style={styles.continueTile}
            />
          ) : null}

          {/* Search field — opened by the magnifier in the header, right
             above what it narrows. It stacks on the filter row below. */}
          {searchOpen && (
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={tokens.text.dim} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('learning.search.placeholder')}
                placeholderTextColor={tokens.text.faint}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
                returnKeyType="search"
                accessibilityLabel={t('learning.search.open')}
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('learning.search.clear')}
                >
                  <Ionicons name="close-circle" size={16} color={tokens.text.dim} />
                </Pressable>
              )}
            </View>
          )}

          {/* The filter, on the screen: read state, category, dimension
             (and its sub-areas) as one row of chips. A lit chip is its own
             "filter on" mark. */}
          {!feed.isLoading && all.length > 0 && (
            <View style={styles.filterRow}>
              <LearningFilterRow
                cards={all}
                readSet={readSet}
                filter={pillFilter}
                onFilterChange={setPillFilter}
                readFilter={readFilter}
                onReadFilterChange={setReadFilter}
              />
            </View>
          )}

          {/* Breathing room between the controls and the first row. */}
          <View style={styles.headerGap} />

          {/* Loading */}
          {feed.isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          )}

          {/* Empty (after filtering) */}
          {!feed.isLoading && filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons
                name={query.trim() ? 'search-outline' : 'book-outline'}
                size={36}
                color={tokens.text.dim}
              />
              <Text style={styles.emptyText}>
                {query.trim()
                  ? t('learning.search.empty', { q: query.trim() })
                  : t('learning.empty')}
              </Text>
            </View>
          )}

            </>
          }
        />
      </ScreenBackground>

      {/* One floating button: the "Minhas ideias" bulb, gold like every
         primary floating button in the app (the filter went back on the
         screen, 2026-11-07). Always shown once the feed has content — the
         collection has its own empty state — with a violet count while
         ideas wait for review (absorbed, no verdict yet). */}
      {!feed.isLoading && all.length > 0 && (
        <FabStack
          bottomOffset={bottomClearance}
          actions={[
            {
              key: 'ideas',
              icon: 'bulb-outline',
              tone: 'gold',
              size: IDEAS_FAB_SIZE,
              accessibilityLabel:
                pendingReviews > 0
                  ? `${t('learning.ideas.myIdeas')} · ${t('learning.ideas.review.fabPending', {
                      count: pendingReviews,
                    })}`
                  : t('learning.ideas.myIdeas'),
              onPress: () => {
                Haptics.selectionAsync().catch(() => {});
                router.push('/collection');
              },
              wrap: (node) =>
                pendingReviews > 0 ? (
                  <View>
                    {node}
                    <IdeasCountBadge count={pendingReviews} />
                  </View>
                ) : (
                  node
                ),
            },
          ]}
        />
      )}

      {/* The tab's guide (docs/informativo-de-tela.md). */}
      <InfoSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('learning.help.title')}
        aiPrompt={guidePrompt}
        video="learning"
      >
        <RecantoGuide locale={locale === 'pt' ? 'pt' : 'en'} />
      </InfoSheet>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  entryRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  entryExplore: { flex: 1.35 },
  entryTrain: { flex: 1 },
  // Same gutter and gap as the entry row above it: the three tiles read as
  // one group.
  continueTile: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[2],
  },
  // The (i)'s box, so the two glyphs sit as a pair in the corner.
  searchBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    height: 40,
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  searchInput: {
    flex: 1,
    color: tokens.text.hi,
    ...tokens.type.body,
    paddingVertical: 0,
  },
  filterRow: {
    paddingTop: tokens.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    color: tokens.text.hi,
  },
  headerGap: {
    height: tokens.space[3],
  },
  loading: {
    paddingVertical: tokens.space[7],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: tokens.space[8],
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.dim,
    textAlign: 'center',
  },
  sectionGroup: {
    marginTop: tokens.space[2],
  },
  sectionGroupTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    paddingHorizontal: tokens.space[4],
    marginBottom: tokens.space[3],
    marginTop: tokens.space[2],
  },
});
