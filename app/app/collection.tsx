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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import {
  FilterPill,
  IdeaSearchBox,
  ReviewStrip,
} from '@/components/ideas/CollectionControls';
import { CollectionGuide, useCollectionGuidePrompt } from '@/components/ideas/CollectionGuide';
import { IdeaActionSheet } from '@/components/ideas/IdeaActionSheet';
import { IdeaNoteSheet } from '@/components/ideas/IdeaNoteSheet';
import { IdeaShelf, shelfCardWidth } from '@/components/ideas/IdeaShelf';
import { InfoSheet } from '@/components/InfoSheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useReviewIdea, useSetIdeaNote } from '@/lib/api/learning';
import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { compareAbsorbed, useIdeaCollection } from '@/lib/ideaCollection';
import {
  pickLocalized,
  toCardDataFromPublic,
  type IdeaCardData,
  type IdeaLocale,
} from '@/lib/ideas';
import { buildHaystack, matchesQuery } from '@/lib/learningSearch';
import { showInfo } from '@/lib/util/confirm';
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
 * Tap flips a card (reveal-only). Press-and-hold opens `IdeaActionSheet`:
 * open the whole idea, or add/remove it from the favorites — the one write
 * here, `review_idea` (re-reviewable; on a still-pending idea it also takes
 * it out of the pile).
 */

type Card = IdeaCardData & { haystack: string; favorite: boolean; note: string | null };

const cardKey = (c: IdeaCardData) => `${c.materialId}:${c.id}`;

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
  // The (i) top right: how the screen works — above all the hold, which
  // nothing on screen reveals.
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const { mutate: reviewIdea } = useReviewIdea();
  const { mutate: setIdeaNote } = useSetIdeaNote();
  const searching = query.trim().length > 0;

  // Every absorbed idea, in collection order, with its search haystack.
  const cards = useMemo<Card[]>(
    () =>
      [...absorbed].sort(compareAbsorbed).map(({ row, review }) => {
        const material = materials.get(row.material_id);
        return {
          ...toCardDataFromPublic(row),
          favorite: review.favorite === true,
          note: review.note ?? null,
          haystack: buildHaystack([
            row.title_pt,
            row.title_en,
            row.claim_pt,
            row.claim_en,
            material?.title_pt,
            material?.title_en,
            meta.dim(row.dimension_id).label,
            ...(material?.subs ?? []).map((s) => meta.sub(s).label),
            // A nota é texto dele: quem escreveu "whey" procura por "whey".
            review.note,
          ]),
        };
      }),
    [absorbed, materials, meta],
  );

  // Resolved from the live list, so the menu shows the current decision.
  const menuCard = useMemo(
    () => (menuKey ? (cards.find((c) => cardKey(c) === menuKey) ?? null) : null),
    [cards, menuKey],
  );

  const favoriteCount = useMemo(() => cards.filter((c) => c.favorite).length, [cards]);

  // The guide's playground card: their first favorite, else their first
  // idea (null → the guide's sample). Its shelf is the one the guide's
  // shelf replica imitates.
  const guideCard = useMemo(
    () => cards.find((c) => c.favorite) ?? cards[0] ?? null,
    [cards],
  );
  // Built from the same item list the guide renders, so it names every option.
  const guidePrompt = useCollectionGuidePrompt();
  const guideShelf = useMemo(() => {
    const dimensionId: DimensionId = guideCard?.dimensionId ?? 'mind';
    return {
      dimensionId,
      label: meta.dim(dimensionId).label,
      count: guideCard ? cards.filter((c) => c.dimensionId === dimensionId).length : 3,
    };
  }, [guideCard, cards, meta]);

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

  const openMenu = useCallback((card: IdeaCardData) => setMenuKey(cardKey(card)), []);
  const closeMenu = () => setMenuKey(null);

  const openFromMenu = () => {
    if (!menuCard) return;
    setMenuKey(null);
    openIdea(menuCard);
  };

  // Optimistic like the review pile: the card moves at once, a failed RPC
  // puts it back and says why.
  const toggleFavorite = () => {
    if (!menuCard) return;
    setMenuKey(null);
    Haptics.selectionAsync().catch(() => {});
    reviewIdea(
      {
        slug: menuCard.slug,
        ideaId: menuCard.id,
        favorite: !menuCard.favorite,
        materialId: menuCard.materialId,
      },
      {
        onError: (e) =>
          showInfo(t('learning.ideas.menu.fail'), e instanceof Error ? e.message : ''),
      },
    );
  };

  // O menu fecha e a folha da nota abre; `menuKey` fica, porque é dele que
  // a folha tira a ideia (e o texto atual) — fechar os dois é o cancelar.
  const openNote = () => setNoteOpen(true);
  const closeNote = () => {
    setNoteOpen(false);
    setMenuKey(null);
  };
  const saveNote = (note: string) => {
    if (!menuCard) return;
    closeNote();
    Haptics.selectionAsync().catch(() => {});
    setIdeaNote(
      { slug: menuCard.slug, ideaId: menuCard.id, note, materialId: menuCard.materialId },
      {
        onError: (e) =>
          showInfo(t('learning.ideas.note.fail'), e instanceof Error ? e.message : ''),
      },
    );
  };

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
          {/* Same 40px chip as the back button — the header's one control kind. */}
          <Pressable
            onPress={() => setHelpOpen(true)}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('learning.ideas.help.a11y')}
          >
            <Ionicons name="information-circle-outline" size={22} color={tokens.text.hi} />
          </Pressable>
        </View>

        {/* The screen's guide — the template for every screen's (i): the
            AI door first, then the playground and one step per element. */}
        <InfoSheet
          visible={helpOpen}
          onClose={() => setHelpOpen(false)}
          title={t('learning.ideas.help.title')}
          aiPrompt={guidePrompt}
        >
          <CollectionGuide
            demoCard={guideCard}
            pendingCount={pending.length}
            shelf={guideShelf}
            locale={ideaLocale}
          />
        </InfoSheet>

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
              <IdeaSearchBox value={query} onChangeText={setQuery} style={styles.searchWrap} />
            )}

            {pending.length > 0 && !searching && (
              <ReviewStrip
                count={pending.length}
                onPress={openReview}
                style={styles.reviewStrip}
              />
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
                    onLongPress={openMenu}
                  />
                ))}
              </View>
            ) : (
              empty
            )}
          </ScrollView>
        )}

        <IdeaActionSheet
          visible={menuCard != null && !noteOpen}
          ideaTitle={menuCard ? pickLocalized(menuCard.title, ideaLocale) : ''}
          favorite={menuCard?.favorite ?? false}
          note={menuCard?.note ?? null}
          onCancel={closeMenu}
          onOpen={openFromMenu}
          onToggleFavorite={toggleFavorite}
          onEditNote={openNote}
        />

        <IdeaNoteSheet
          visible={noteOpen && menuCard != null}
          ideaTitle={menuCard ? pickLocalized(menuCard.title, ideaLocale) : ''}
          note={menuCard?.note ?? null}
          onCancel={closeNote}
          onSave={saveNote}
        />
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
  // The search box, the review strip and the pills are CollectionControls
  // (shared with the guide); only their placement lives here.
  searchWrap: {
    marginHorizontal: tokens.space[4],
  },
  reviewStrip: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
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
