import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavClearance } from '@/components/BottomNavBar';
import { FabStack } from '@/components/FabStack';
import { TourModule } from '@/components/tour/TourModule';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { buildM6Steps, M6_EVENTS } from '@/lib/tour/m6Steps';
import { useIsCurrentTourModule, useTourStore } from '@/lib/tour/store';
import { MyIdeasStrip } from '@/components/ideas/MyIdeasStrip';
import { CarouselRow } from '@/components/learning/CarouselRow';
import { ContinueLendoCard } from '@/components/learning/ContinueLendoCard';
import type { CoverIdeaMeta } from '@/components/learning/CoverCard';
import { LearningFilterSheet, type PillFilter } from '@/components/learning/LearningFilterSheet';
import { ReelsEntryCard } from '@/components/reels/ReelsEntryCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  useCollectedIdeas,
  useIdeaCards,
  useLearningFeed,
  useReadMaterialIds,
  type LearningFeedCard,
} from '@/lib/api/learning';
import type {
  DimensionId,
  LearningIdeaPublic,
  LearningMaterialType,
  SubId,
} from '@/lib/db/types';
import { useT, type TranslateOptions } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { pickLocalized, type IdeaLocale } from '@/lib/ideas';
import {
  useContinueReading,
  useReadingProgressReady,
} from '@/lib/readingProgress';
import { buildReelDeck } from '@/lib/reels';
import { useReelsProgressReady, useReelsProgressStore } from '@/lib/reelsProgress';
import { ACTIVE_THEME, tokens } from '@/theme';
import { DIMENSION_ORDER, SUB_META } from '@/theme/dimensions';

type Translator = (key: string, options?: TranslateOptions) => string;
type ReadFilter = 'all' | 'unread' | 'read';

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Stable empty collection so the idea memos don't churn while loading. */
const EMPTY_COLLECTION: Map<string, Set<string>> = new Map();

/** The Continue hero pick for a material with ideas (0 < absorbed < total). */
interface IdeaContinuePick {
  card: LearningFeedCard;
  /** absorbed / total, 0..100, rounded. */
  percent: number;
  /** Absorbed ideas of the material (0 < collected < total by construction). */
  collected: number;
  /** Published ideas of the material. */
  total: number;
  /** Localized title of the lowest-ordinal idea not yet absorbed. */
  nextTitle: string;
}

export default function LearningScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const feed = useLearningFeed();
  const reads = useReadMaterialIds();
  // Ideas: one row per published idea + the user's collection. Both cheap
  // (a view select and a two-column self-only select) and cached 5 min /
  // 1 min; they feed the cover cards' "N ideias · c/N", the Continue hero
  // and the "Minhas ideias" strip.
  const ideaCards = useIdeaCards();
  const collectedIdeas = useCollectedIdeas();
  const meta = useMetaLookup();
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';

  const [readFilter, setReadFilter] = useState<ReadFilter>('unread');
  const [pillFilter, setPillFilter] = useState<PillFilter>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const bottomClearance = useBottomNavClearance();

  // ── M6 tour plumbing ────────────────────────────────────────────────
  const isM6Current = useIsCurrentTourModule('M6');
  // M6 step 1 lives on Home and waits for the user to reach this tab.
  // Emit LEARN_NAVIGATED on focus while step 1 is still current so the
  // Home tooltip advances to step 2 (which renders here).
  useFocusEffect(
    useCallback(() => {
      const state = useTourStore.getState();
      const status = state.modules.M6?.status ?? 'pending';
      const idx = state.stepIndices.M6 ?? 0;
      if (isM6Current && idx === 0 && status !== 'completed' && status !== 'skipped') {
        emitTourEvent(M6_EVENTS.LEARN_NAVIGATED);
      }
    }, [isM6Current]),
  );
  // M6 step 2 (Next) ends the module → Wrap-up. Guard on wrap still being
  // pending so an isolated M6 replay returns Home instead.
  const finishM6 = () => {
    const wrapPending =
      (useTourStore.getState().modules.wrap?.status ?? 'pending') === 'pending';
    if (wrapPending) router.push('/tour/wrap');
    else router.navigate('/(tabs)');
  };

  // Hydrate the persisted scroll-progress store on first paint so the
  // ContinueLendoCard hero can pick the right material without flashing
  // an empty state on cold start.
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

  // Absorbed ideas, newest release first — the strip's count + thumbs.
  const collectedRows = useMemo(
    () =>
      (ideaCards.data ?? []).filter((r) =>
        collectedMap.get(r.material_id)?.has(r.idea_id),
      ),
    [ideaCards.data, collectedMap],
  );

  // Continue hero for ideas: the most recently released material with some
  // but not all ideas absorbed, and the title of its next idea (lowest
  // ordinal not yet collected). Wins over the legacy scroll candidate.
  const ideaContinue = useMemo<IdeaContinuePick | null>(() => {
    const rows = ideaCards.data;
    if (!rows || rows.length === 0) return null;
    for (const [materialId, m] of ideaMetaByMaterial) {
      if (m.collected <= 0 || m.collected >= m.total) continue;
      const card = all.find((c) => c.id === materialId);
      if (!card) continue;
      const done = collectedMap.get(materialId);
      let next: LearningIdeaPublic | null = null;
      for (const row of rows) {
        if (row.material_id !== materialId || done?.has(row.idea_id)) continue;
        if (next === null || row.ordinal < next.ordinal) next = row;
      }
      if (!next) continue;
      return {
        card,
        percent: Math.round((m.collected / m.total) * 100),
        collected: m.collected,
        total: m.total,
        nextTitle: pickLocalized({ pt: next.title_pt, en: next.title_en }, ideaLocale),
      };
    }
    return null;
  }, [ideaCards.data, ideaMetaByMaterial, collectedMap, all, ideaLocale]);

  // Study Reels deck — drives the entry card (thumbnails + unread count).
  // The viewer builds its own frozen copy when it opens; this one is only
  // presentation state for the card.
  const reelSeen = useReelsProgressStore((s) => s.entries);
  const reelDeck = useMemo(() => {
    const seenAt = Object.fromEntries(
      Object.values(reelSeen).map((e) => [e.slug, e.seenAt]),
    );
    return buildReelDeck(all, locale === 'pt' ? 'pt' : 'en', readSet, seenAt);
  }, [all, locale, readSet, reelSeen]);
  const reelUnread = useMemo(
    () => reelDeck.filter((g) => !readSet.has(g.materialId)).length,
    [reelDeck, readSet],
  );

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
        if (pillFilter.kind === 'type' && c.type !== pillFilter.value) return false;
        if (pillFilter.kind === 'sub' && !c.subs.includes(pillFilter.value as SubId)) return false;
      }
      return true;
    });
  }, [all, readFilter, readSet, pillFilter]);

  // Group buckets for the carousel rows. We compute against `filtered`
  // so empty groups drop out naturally.
  const buckets = useMemo(() => {
    const now = Date.now();
    const novidades = filtered.filter(
      (c) => now - new Date(c.released_at).getTime() < NEW_WINDOW_MS,
    );

    const byDim = new Map<DimensionId, LearningFeedCard[]>();
    for (const c of filtered) {
      const arr = byDim.get(c.dimension_id) ?? [];
      arr.push(c);
      byDim.set(c.dimension_id, arr);
    }

    return { novidades, byDim };
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

  const renderSection = useCallback(
    ({ item }: { item: (typeof sections)[number] }) => (
      <View>
        {item.groupLabel && (
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionGroupTitle}>{item.groupLabel}</Text>
          </View>
        )}
        <CarouselRow
          title={item.title}
          iconName={item.iconName}
          accentColor={item.accentColor}
          cards={item.cards}
          readSet={readSet}
          onCardPress={onCardPress}
          count={item.cards.length}
          ideaMetaByMaterial={ideaMetaByMaterial}
        />
      </View>
    ),
    [readSet, onCardPress, ideaMetaByMaterial],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground withGoldHalo>
        {/* FlatList e nao ScrollView: com o catalogo cheio, montar as 7
           linhas de uma vez (cada uma com todos os seus cards) era o que
           travava a aba. Sem removeClippedSubviews e com windowSize 5 de
           proposito: desmontar uma CarouselRow zera o offset horizontal
           dela, entao rolar pra baixo e voltar jogaria a linha de volta no
           primeiro card. Sao no maximo 7 linhas — o ganho grande vem da
           FlatList horizontal dentro de cada uma. */}
        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          renderItem={renderSection}
          contentContainerStyle={{ paddingBottom: bottomClearance }}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={feed.isFetching && !feed.isLoading}
              onRefresh={() => feed.refetch()}
              tintColor={tokens.text.mid}
            />
          }
          ListHeaderComponent={
            <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t('learning.eyebrow')}</Text>
            <Text style={styles.title}>{t('learning.title')}</Text>
            <Text style={styles.subtitle}>{t('learning.subtitle')}</Text>
          </View>

          {/* Study Reels — story-mode pass over the infographics. Hidden
             when no material has a story-ready visual. Waits for the reads
             query too so the unread count never flashes inflated. */}
          {!feed.isLoading && !reads.isLoading && reelDeck.length > 0 && (
            <ReelsEntryCard
              groups={reelDeck}
              unreadCount={reelUnread}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push('/reels');
              }}
            />
          )}

          {/* Active filter chip — shown when pillFilter is set */}
          {pillFilter && (
            <ActiveFilterChip
              filter={pillFilter}
              onClear={() => setPillFilter(null)}
            />
          )}

          {/* Read-state filter */}
          <View style={styles.readFilterWrap}>
            <ReadFilterRow value={readFilter} onChange={setReadFilter} t={t} />
          </View>

          {/* Continue hero. Ideas first: a material with some but not all
             ideas absorbed shows "Próxima: <ideia>" and absorbed/total.
             Otherwise the legacy pick — at least 5% scroll progress on an
             article, most recently touched one. */}
          {ideaContinue ? (
            <ContinueLendoCard
              card={ideaContinue.card}
              percent={ideaContinue.percent}
              subtitle={t('learning.ideas.nextIdeaLabel', { title: ideaContinue.nextTitle })}
              metaText={t('learning.ideas.progress', {
                collected: ideaContinue.collected,
                total: ideaContinue.total,
              })}
              onPress={() => router.push(`/material/${ideaContinue.card.slug}`)}
            />
          ) : continueCard && continueEntry ? (
            <ContinueLendoCard
              card={continueCard}
              percent={continueEntry.percent}
              onPress={() => router.push(`/material/${continueCard.slug}`)}
            />
          ) : null}

          {/* "Minhas ideias" — entry to the collection, once the user has
             absorbed at least one idea. */}
          {collectedRows.length >= 1 && (
            <MyIdeasStrip
              count={collectedRows.length}
              recent={collectedRows}
              onPress={() => router.push('/collection')}
            />
          )}

          {/* Loading */}
          {feed.isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          )}

          {/* Empty (after filtering) */}
          {!feed.isLoading && filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={36} color={tokens.text.dim} />
              <Text style={styles.emptyText}>{t('learning.empty')}</Text>
            </View>
          )}

            </>
          }
        />
      </ScreenBackground>

      {/* Floating filter button — opens the filter sheet, matching the
         Tasks/Rewards FAB vocabulary. A gold dot marks an active filter.
         Only shown once the feed has content to filter. */}
      {!feed.isLoading && all.length > 0 && (
        <FabStack
          bottomOffset={bottomClearance}
          actions={[
            {
              key: 'filter',
              icon: 'options-outline',
              tone: 'violet',
              size: 'lg',
              accessibilityLabel: t('learning.filter.open'),
              onPress: () => {
                Haptics.selectionAsync().catch(() => {});
                setFilterOpen(true);
              },
              wrap: pillFilter
                ? (node) => (
                    <View>
                      {node}
                      <View style={styles.fabDot} pointerEvents="none" />
                    </View>
                  )
                : undefined,
            },
          ]}
        />
      )}

      <LearningFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        cards={all}
        readSet={readSet}
        filter={pillFilter}
        onFilterChange={setPillFilter}
      />

      {/* M6 step 2 lives here (Learn explainer). Step 1 is on Home (Learn
         tab spotlight). Next ends the module → Wrap-up. Tab screen, so no
         `flatNav`. */}
      <TourModule
        module="M6"
        screen="learn"
        steps={buildM6Steps(t)}
        enabled={isM6Current}
        onComplete={finishM6}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active-filter chip — surfaces a non-null PillFilter at the top of the feed
// with the option to clear it. Uses the dim/sub color where applicable so
// the chip reads as "filtered by Craft" visually, not just textually.
// ─────────────────────────────────────────────────────────────────────────────

interface ActiveFilterChipProps {
  filter: NonNullable<PillFilter>;
  onClear: () => void;
}

function ActiveFilterChip({ filter, onClear }: ActiveFilterChipProps) {
  const { t } = useT();
  const meta = useMetaLookup();

  let label = '';
  let iconName: keyof typeof Ionicons.glyphMap = 'funnel';
  let accent: string = tokens.brand.violet2;

  if (filter.kind === 'dim') {
    const dim = meta.dim(filter.value as DimensionId);
    label = dim.label;
    iconName = dim.iconName as keyof typeof Ionicons.glyphMap;
    accent = dim.color;
  } else if (filter.kind === 'sub') {
    const subId = filter.value as SubId;
    const sub = meta.sub(subId);
    const dim = meta.dim(SUB_META[subId].dimensionId);
    label = sub.label;
    iconName = SUB_META[subId].iconName as keyof typeof Ionicons.glyphMap;
    accent = dim.color;
  } else {
    label = t(`learning.type.${filter.value as LearningMaterialType}`);
  }

  return (
    <View style={activeChipStyles.wrap}>
      <View
        style={[
          activeChipStyles.chip,
          { backgroundColor: accent + '22', borderColor: accent },
        ]}
      >
        <Ionicons name={iconName} size={13} color={accent} />
        <Text style={[activeChipStyles.label, { color: accent }]}>
          {t('learning.filteringBy', { what: label })}
        </Text>
        <Pressable
          hitSlop={6}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onClear();
          }}
          style={({ pressed }) => [
            activeChipStyles.clearBtn,
            { backgroundColor: accent + '33' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="close" size={12} color={accent} />
        </Pressable>
      </View>
    </View>
  );
}

const activeChipStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 11,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Read-state filter — segmented pill control.
// ─────────────────────────────────────────────────────────────────────────────

interface ReadFilterRowProps {
  value: ReadFilter;
  onChange: (v: ReadFilter) => void;
  t: Translator;
}

function ReadFilterRow({ value, onChange, t }: ReadFilterRowProps) {
  const opts: { key: ReadFilter; label: string }[] = [
    { key: 'unread', label: t('learning.readFilter.unread') },
    { key: 'read', label: t('learning.readFilter.read') },
    { key: 'all', label: t('learning.readFilter.all') },
  ];
  return (
    <View style={readFilterStyles.row}>
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(o.key);
            }}
            style={({ pressed }) => [
              readFilterStyles.seg,
              pressed && { opacity: 0.8 },
            ]}
          >
            {/* Active pill: gradient fill + gold rim, clipped to its
               own rounded box. Sits inside the seg without overflow on
               the seg itself, so inactive Text is never clipped. */}
            {active && (
              <View style={readFilterStyles.activeBg} pointerEvents="none">
                <LinearGradient
                  colors={tokens.gradient.coinBtn as [string, string, string]}
                  locations={[0, 0.6, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            )}
            <Text
              style={[
                readFilterStyles.segText,
                active && readFilterStyles.segTextActive,
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const readFilterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    // Glass token — same navy family on dark, porcelain glass on light.
    backgroundColor: tokens.bg.glass,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    // Pale-gold rim — mirrors the Vault chip vocabulary.
    borderColor:
      ACTIVE_THEME === 'light'
        ? 'rgba(166, 111, 14, 0.30)'
        : 'rgba(255, 200, 61, 0.22)',
  },
  seg: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    // No overflow:hidden here — that was clipping inactive Text in some
    // Android RN builds. The active pill's gradient is clipped via its
    // own wrapper (activeBg) instead.
  },
  /** Absolutely-positioned gradient pill underlay for the active segment. */
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    overflow: 'hidden',
  },
  segText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    // Bump from text.mid → text.base for higher contrast over the dark
    // glass background.
    color: tokens.text.base,
  },
  segTextActive: {
    color: '#3D2A00',
    fontFamily: 'Manrope_800ExtraBold',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  /** Gold dot on the filter FAB when a pill filter is active. */
  fabDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 2,
    borderColor: tokens.bg.deep,
  },
  header: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.8,
    // Perceva pale-gold — sibling of the Rewards "Sua via" vocabulary.
    color: tokens.semantic.coinLight,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    color: tokens.text.hi,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.mid,
    marginTop: 2,
  },
  readFilterWrap: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[4],
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
