import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IdeaPage, type IdeaPageMaterial } from '@/components/ideas/IdeaPage';
import { ScreenBackground } from '@/components/ScreenBackground';
import { type LearningMaterialDetail, useCollectedIdeas, useCollectIdea } from '@/lib/api/learning';
import type { LearningIdea } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { sortedIdeas } from '@/lib/ideas';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * The idea screen — a horizontal pager over the 1..5 ideas of a material,
 * opened as a fullScreenModal from the material page (`/idea/[slug]?idea=n`).
 *
 * Layout: a fixed header (dimension · "Ideia n de N", progress dots, ✕) and
 * below it the pager, one `IdeaPage` per idea, each a vertical scroll. The
 * pager is the ReelsViewer recipe (pagingEnabled + getItemLayout on pageW +
 * onScrollToIndexFailed → scrollToOffset, windowSize 3) WITHOUT the
 * swipe-down dismiss: the only exit is the ✕ (or the last page's button).
 *
 * This is the ONE place in the product that calls `collect_idea`: the first
 * flip of a not-yet-collected card → haptic, optimistic gold rim, RPC. The
 * server closes the material when the last idea lands and reports XP/coins
 * in `CollectIdeaResult`; the client only shows that as an inline banner.
 * An id already in the collected set (server ∪ optimistic) never reaches
 * the RPC — a remounted page re-firing `onFirstFlip` is a no-op here, and
 * the pager does not mount until `useCollectedIdeas` has settled, so a card
 * never renders as "not collected" merely because the read is in flight.
 */

interface Props {
  detail: LearningMaterialDetail;
  /** 1-based ordinal to open on; clamped into range. */
  initialOrdinal: number;
}

const BANNER_MS = 3500;

interface BannerState {
  key: number;
  xp: number;
  coins: number;
}

export function IdeaScreen({ detail: m, initialOrdinal }: Props) {
  const router = useRouter();
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const insets = useSafeAreaInsets();

  const ideas = useMemo(() => sortedIdeas(m.ideas ?? []), [m.ideas]);
  const total = ideas.length;
  const dim = meta.dim(m.dimension_id);
  const dimIcon = dim.iconName as keyof typeof Ionicons.glyphMap;
  const material = useMemo<IdeaPageMaterial>(
    () => ({ id: m.id, slug: m.slug, dimension_id: m.dimension_id }),
    [m.id, m.slug, m.dimension_id],
  );

  // ── Collected = server set ∪ optimistic local set ──────────────────────
  const collectedQuery = useCollectedIdeas();
  const serverSet = collectedQuery.data?.get(m.id);
  const [localSet, setLocalSet] = useState<Set<string>>(() => new Set());
  const collectedSet = useMemo(() => {
    const out = new Set<string>(serverSet ?? []);
    for (const id of localSet) out.add(id);
    return out;
  }, [serverSet, localSet]);
  // Read inside the flip callback without re-creating it on every change.
  const collectedRef = useRef(collectedSet);
  collectedRef.current = collectedSet;

  // ── Completion banner ──────────────────────────────────────────────────
  const [banner, setBanner] = useState<BannerState | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideBanner = useCallback(() => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = null;
    setBanner(null);
  }, []);
  const showBanner = useCallback(
    (xp: number, coins: number) => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      setBanner({ key: Date.now(), xp, coins });
      bannerTimer.current = setTimeout(hideBanner, BANNER_MS);
    },
    [hideBanner],
  );
  useEffect(
    () => () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    },
    [],
  );

  // ── Collect flow — the only caller of the RPC ──────────────────────────
  const { mutateAsync: collectIdea } = useCollectIdea();
  const inFlightRef = useRef(new Set<string>());
  const onFirstFlip = useCallback(
    (idea: LearningIdea) => {
      const id = idea.id;
      if (collectedRef.current.has(id) || inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);
      // Gold rim right away; the server confirms (or we roll back below).
      setLocalSet((prev) => new Set(prev).add(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      collectIdea({ slug: m.slug, ideaId: id })
        .then((result) => {
          if (result.completed && result.xp_awarded > 0) {
            showBanner(result.xp_awarded, result.coins_awarded);
          }
        })
        .catch((e: unknown) => {
          setLocalSet((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          const msg = e instanceof Error ? e.message : 'Unknown error';
          void showInfo(t('learning.ideas.collectFail'), msg);
        })
        .finally(() => {
          inFlightRef.current.delete(id);
        });
    },
    [collectIdea, m.slug, showBanner, t],
  );

  // ── Pager geometry (measured, like ReelsViewer's pageW/pageH) ──────────
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.w === width && prev.h === height ? prev : { w: width, h: height },
    );
  }, []);
  const pageW = size.w;
  const pageH = size.h;
  // The pager also waits for the collection read to settle: a card rendered
  // before the server set is known would flip as "not collected" and send
  // `collect_idea` for an id that is already in — harmless (the RPC is
  // idempotent) but it breaks the "never twice for the same id" rule. The
  // material page and the Learn tab warm this query, so the wait only shows
  // on a cold deep link. A failed read still renders (there is nothing to
  // compare against) — the one case the rule cannot cover client-side.
  const ready = pageW > 0 && pageH > 0 && total > 0 && !collectedQuery.isPending;

  const initialIndex = Math.min(Math.max(0, initialOrdinal - 1), Math.max(0, total - 1));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<LearningIdea>>(null);
  const totalRef = useRef(total);
  totalRef.current = total;

  // Must be a stable reference — FlatList throws if it changes on the fly.
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index == null) return;
      setCurrentIndex(first.index);
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= totalRef.current) return;
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const exit = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(`/material/${m.slug}`);
  }, [router, m.slug]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<LearningIdea>) => (
      <IdeaPage
        idea={item}
        material={material}
        locale={locale}
        pageW={pageW}
        pageH={pageH}
        isActive={index === currentIndex}
        collected={collectedSet.has(item.id)}
        bottomInset={insets.bottom}
        onFirstFlip={onFirstFlip}
        onNext={index < total - 1 ? () => goTo(index + 1) : null}
        onExit={exit}
      />
    ),
    [
      material,
      locale,
      pageW,
      pageH,
      currentIndex,
      collectedSet,
      insets.bottom,
      onFirstFlip,
      total,
      goTo,
      exit,
    ],
  );

  const shownIndex = Math.min(currentIndex, Math.max(0, total - 1));

  return (
    <ScreenBackground>
      <View style={styles.root}>
        {/* ── Header: dimension · Ideia n de N · dots · ✕ ─────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerRow}>
            <View style={[styles.dimChip, { backgroundColor: dim.bg }]}>
              <Ionicons name={dimIcon} size={13} color={dim.color} />
            </View>
            <Text style={styles.headerLabel} numberOfLines={1}>
              {dim.label}
              {' · '}
              {t('learning.ideas.ideaOf', { n: shownIndex + 1, total })}
            </Text>
            <Pressable
              onPress={exit}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={tokens.text.hi} />
            </Pressable>
          </View>
          <View style={styles.dots} accessible={false}>
            {ideas.map((idea, i) => {
              const isCollected = collectedSet.has(idea.id);
              const isCurrent = i === shownIndex;
              const color = isCollected
                ? tokens.semantic.coin
                : isCurrent
                  ? dim.color
                  : 'rgba(255, 255, 255, 0.22)';
              return (
                <View
                  key={idea.id}
                  style={[styles.dot, isCurrent && styles.dotCurrent, { backgroundColor: color }]}
                />
              );
            })}
          </View>
        </View>

        {/* ── Pager ─────────────────────────────────────────────────────── */}
        <View style={styles.pager} onLayout={onLayout}>
          {ready && (
            <FlatList
              ref={listRef}
              data={ideas}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              extraData={collectedSet}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, index) => ({ length: pageW, offset: pageW * index, index })}
              onScrollToIndexFailed={({ index }) => {
                listRef.current?.scrollToOffset({ offset: pageW * index, animated: false });
              }}
              windowSize={3}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              decelerationRate="fast"
              disableIntervalMomentum
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />
          )}
          {!ready && (
            <View style={styles.pagerLoading}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          )}

          {/* Completion banner — inline, over the top of the page, ~3.5s. */}
          {banner && (
            <Animated.View
              key={banner.key}
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={styles.bannerWrap}
              pointerEvents="box-none"
            >
              <Pressable
                onPress={hideBanner}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={styles.banner}
              >
                <View style={styles.bannerIcon}>
                  <Ionicons name="gift" size={16} color={tokens.semantic.coin} />
                </View>
                <Text style={styles.bannerText}>
                  {t('learning.ideas.completedBanner', { xp: banner.xp, coins: banner.coins })}
                </Text>
                <Ionicons name="checkmark-circle" size={18} color={tokens.semantic.coin} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: tokens.space[4],
    paddingBottom: tokens.space[2],
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dimChip: {
    width: 26,
    height: 26,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Aligns with the label: chip (26) + row gap (10).
    paddingLeft: 36,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCurrent: {
    width: 18,
  },
  pager: {
    flex: 1,
  },
  pagerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerWrap: {
    position: 'absolute',
    top: tokens.space[3],
    left: tokens.space[4],
    right: tokens.space[4],
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '100%',
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(20, 24, 60, 0.96)',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    ...tokens.shadow.coinGlowSoft,
  },
  bannerIcon: {
    width: 30,
    height: 30,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.16)',
  },
  bannerText: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  pressed: {
    opacity: 0.75,
  },
});
