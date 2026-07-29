import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View, type ViewToken } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReelChrome } from '@/components/reels/ReelChrome';
import { ReelGroupPage } from '@/components/reels/ReelGroupPage';
import { SetEndCard } from '@/components/reels/SetEndCard';
import { useMarkMaterialRead, useReadMaterialIds } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { REEL_SET_SIZE, type ReelGroup } from '@/lib/reels';
import { useReadingProgressStore } from '@/lib/readingProgress';
import { useReelsProgressStore } from '@/lib/reelsProgress';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * The Study Reels pager.
 *
 * Two-level navigation: this outer FlatList pages horizontally across
 * MATERIAL groups (native interactive swipe); cards inside a group swap by
 * state in ReelGroupPage (instant cut on tap). The deck is bounded into
 * sets of REEL_SET_SIZE with a SetEndCard between them — never an infinite
 * feed. No timers anywhere: every advance is the user's.
 *
 * The deck prop is expected to be FROZEN for the session (the route builds
 * it once) — mid-session reorders would teleport the user.
 */

type ReelItem = { type: 'group'; group: ReelGroup } | { type: 'end' };

interface Props {
  groups: ReelGroup[];
  initialIndex: number;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

export function ReelsViewer({ groups, initialIndex }: Props) {
  const router = useRouter();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { width: pageW, height: pageH } = useWindowDimensions();

  const reads = useReadMaterialIds();
  const readSet = reads.data ?? new Set<string>();
  const markRead = useMarkMaterialRead();
  const [busySlug, setBusySlug] = useState<string | null>(null);

  // First set that covers the resume point.
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(
      groups.length,
      Math.max(REEL_SET_SIZE, Math.ceil((initialIndex + 1) / REEL_SET_SIZE) * REEL_SET_SIZE),
    ),
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const items = useMemo<ReelItem[]>(
    () => [
      ...groups.slice(0, visibleCount).map((group) => ({ type: 'group' as const, group })),
      { type: 'end' as const },
    ],
    [groups, visibleCount],
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const listRef = useRef<FlatList<ReelItem>>(null);
  const endSeenRef = useRef(false);

  useEffect(() => {
    useReelsProgressStore.getState().bump('setsStarted');
  }, []);

  // ── Viewability → current index, seen tracking, set completion ────────
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index == null) return;
      setCurrentIndex(first.index);
      const item = itemsRef.current[first.index];
      if (item?.type === 'group') {
        useReelsProgressStore.getState().markSeen(item.group.slug, item.group.materialId);
      } else if (item?.type === 'end' && !endSeenRef.current) {
        endSeenRef.current = true;
        useReelsProgressStore.getState().bump('setsCompleted');
      }
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // ── Prefetch the next two groups' first cards ─────────────────────────
  useEffect(() => {
    const uris: string[] = [];
    for (const i of [currentIndex + 1, currentIndex + 2]) {
      const item = items[i];
      if (item?.type === 'group') uris.push(item.group.cards[0]!.uri);
    }
    if (uris.length > 0) {
      Image.prefetch(uris, { cachePolicy: 'memory-disk' }).catch(() => {});
    }
  }, [currentIndex, items]);

  // ── Navigation ────────────────────────────────────────────────────────
  const goTo = useCallback((index: number) => {
    const max = itemsRef.current.length - 1;
    if (index < 0 || index > max) return;
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const exit = useCallback(() => {
    router.back();
  }, [router]);

  const onContinueSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    endSeenRef.current = false;
    // The end card's slot becomes the next set's first group — the user is
    // already parked on it, no scroll needed.
    setVisibleCount((c) => Math.min(c + REEL_SET_SIZE, groups.length));
  };

  // ── Mark read (same contract as the detail screen's sticky CTA) ───────
  const onMarkRead = async (group: ReelGroup) => {
    if (readSet.has(group.materialId) || busySlug) return;
    setBusySlug(group.slug);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await markRead.mutateAsync({ slug: group.slug, materialId: group.materialId });
      useReadingProgressStore.getState().clear(group.slug);
      useReelsProgressStore.getState().bump('concludedFromReel');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showInfo(t('learning.detail.markFail'), msg);
    } finally {
      setBusySlug(null);
    }
  };

  // ── Hold-to-hide chrome ───────────────────────────────────────────────
  const [chromeHidden, setChromeHidden] = useState(false);
  const chromeSv = useSharedValue(1);
  const hideChrome = useCallback(() => {
    setChromeHidden(true);
    chromeSv.value = withTiming(0, { duration: tokens.motion.durFast });
  }, [chromeSv]);
  const showChrome = useCallback(() => {
    setChromeHidden(false);
    chromeSv.value = withTiming(1, { duration: tokens.motion.durFast });
  }, [chromeSv]);
  const chromeStyle = useAnimatedStyle(() => ({ opacity: chromeSv.value }));

  // ── Swipe-down dismiss ────────────────────────────────────────────────
  // Vertical-only pan: horizontal motion fails fast so the FlatList keeps
  // its native swipe (TaskCard.tsx idiom, orthogonal axis).
  const ty = useSharedValue(0);
  const dismissPan = Gesture.Pan()
    .activeOffsetY(24)
    .failOffsetX([-16, 16])
    .onUpdate((e) => {
      ty.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(exit)();
      } else {
        ty.value = withSpring(0, tokens.motion.springSnappy);
      }
    });
  const dismissStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: ty.value },
      { scale: interpolate(ty.value, [0, 300], [1, 0.94], 'clamp') },
    ],
    opacity: interpolate(ty.value, [0, 300], [1, 0.7], 'clamp'),
  }));

  // ── Chrome state for the current position ─────────────────────────────
  const groupIdx = Math.min(currentIndex, visibleCount - 1);
  const currentItem = items[Math.min(currentIndex, items.length - 1)];
  const currentGroup = currentItem?.type === 'group' ? currentItem.group : null;
  const setStart = Math.floor(groupIdx / REEL_SET_SIZE) * REEL_SET_SIZE;
  const setLen = Math.min(REEL_SET_SIZE, groups.length - setStart);
  const setActiveIndex = currentItem?.type === 'end' ? setLen - 1 : groupIdx - setStart;

  const renderItem = ({ item, index }: { item: ReelItem; index: number }) => {
    if (item.type === 'end') {
      return (
        <SetEndCard
          pageW={pageW}
          pageH={pageH}
          seenCount={visibleCount}
          remaining={groups.length - visibleCount}
          onContinue={onContinueSet}
          onClose={exit}
        />
      );
    }
    return (
      <ReelGroupPage
        group={item.group}
        isActive={index === currentIndex}
        pageW={pageW}
        pageH={pageH}
        onPrevGroup={() => goTo(index - 1)}
        onNextGroup={() => goTo(index + 1)}
        onChromeHide={hideChrome}
        onChromeShow={showChrome}
      />
    );
  };

  return (
    <View style={styles.root}>
      <GestureDetector gesture={dismissPan}>
        <Animated.View style={[styles.sheet, dismissStyle]}>
          <FlatList
            ref={listRef}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => (item.type === 'group' ? item.group.materialId : 'end')}
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
          <Animated.View
            style={[StyleSheet.absoluteFill, chromeStyle]}
            pointerEvents={chromeHidden ? 'none' : 'box-none'}
          >
            <ReelChrome
              group={currentGroup}
              isRead={currentGroup ? readSet.has(currentGroup.materialId) : false}
              busy={currentGroup ? busySlug === currentGroup.slug : false}
              setCount={setLen}
              setActiveIndex={setActiveIndex}
              counterText={t('learning.reels.counter', {
                current: groupIdx + 1,
                total: groups.length,
              })}
              topInset={insets.top}
              bottomInset={insets.bottom}
              onClose={exit}
              onReadFull={() => {
                if (currentGroup) router.push(`/material/${currentGroup.slug}`);
              }}
              onMarkRead={() => {
                if (currentGroup) void onMarkRead(currentGroup);
              }}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05070F',
  },
  sheet: {
    flex: 1,
  },
});
