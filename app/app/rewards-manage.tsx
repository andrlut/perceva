import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AddCard } from '@/components/AddCard';
import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { BucketTabsV2 } from '@/components/BucketTabsV2';
import { CoinIcon } from '@/components/CoinIcon';
import { EmptyHero } from '@/components/EmptyHero';
import { ScreenBackground } from '@/components/ScreenBackground';
import { LimitCounterBadge } from '@/components/premium/LimitCounterBadge';
import {
  useAddTemplateToShop,
  useArchivedRewards,
  useDeleteReward,
  useOwnedOneShotIds,
  useReorderRewards,
  useRestoreReward,
  useRewardTemplates,
  useRewards,
} from '@/lib/api/rewards';
import type { Reward, RewardCategory, RewardTemplate } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLocalizedPick } from '@/lib/i18n/catalog';
import {
  freeLimitEntity,
  useLimitModalStore,
  useRewardLimit,
  type EntityLimit,
} from '@/lib/premium';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META, REWARD_CATEGORY_ORDER } from '@/theme/rewards';

type Tab = 'mine' | 'suggested';
type CategoryFilter = RewardCategory | 'all';

/** How far the finger travels after grabbing the handle before the row
 *  starts following it. The handle is the only thing that calls `drag`
 *  and the pan is confined to its column (`dragHitSlop`), so this no
 *  longer has to keep a long-press from stealing the scroll. */
const DRAG_ACTIVATION_DISTANCE = 6;
/** The handle column: 44dp, the row's full height. */
const DRAG_HANDLE_WIDTH = 44;

/** A template already sitting in the user's list (active OR archived — an
 *  archived adoption still "was adopted", its suggestion must not come
 *  back). Matched by template_id, with the title as a net for adoptions
 *  older than the link. */
interface AdoptedIndex {
  ids: Set<string>;
  titles: Set<string>;
}

const normTitle = (s: string) => s.trim().toLowerCase();

function isAdopted(template: RewardTemplate, adopted: AdoptedIndex): boolean {
  return (
    adopted.ids.has(template.id) ||
    adopted.titles.has(normTitle(template.title)) ||
    adopted.titles.has(normTitle(template.title_pt ?? ''))
  );
}

/**
 * Gerenciar recompensas — the curating surface behind the Vault, in the
 * same shape as Gerenciar práticas: Minhas (one ordered list, tap to
 * edit, handle to drag, archived bin at the foot) and Sugeridas (the
 * catalog, by category, adopt as-is or adjust first). Buying and tracking
 * stay on the Vault tab; nothing here spends coins.
 */
export default function RewardsHubScreen() {
  const router = useRouter();
  const { t } = useT();
  const { pick, pickNullable } = useLocalizedPick();
  const params = useLocalSearchParams<{ tab?: string }>();
  const rewardLimit = useRewardLimit();
  const openLimit = useLimitModalStore((s) => s.open);
  const bottomClearance = useBottomSafeClearance();

  const rewards = useRewards();
  const archived = useArchivedRewards();
  const templates = useRewardTemplates();
  const ownedOneShots = useOwnedOneShotIds();
  const reorderRewards = useReorderRewards();
  const addTemplate = useAddTemplateToShop();
  const restoreReward = useRestoreReward();
  const deleteReward = useDeleteReward();

  const handleCreate = () => {
    if (rewardLimit.atLimit) {
      openLimit('reward');
      return;
    }
    router.push('/reward-form');
  };

  // Coming BACK to this screen (from the form, from the Vault) pulls the
  // lists again. Mutations already invalidate, and the root layout
  // refetches on app foreground; this covers the navigation-return case
  // TanStack can't see. The first focus is the mount — already fetching.
  const focusedOnce = useRef(false);
  const refetchRewards = rewards.refetch;
  const refetchArchived = archived.refetch;
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      void refetchRewards();
      void refetchArchived();
    }, [refetchRewards, refetchArchived]),
  );

  const [tab, setTab] = useState<Tab>(params.tab === 'suggested' ? 'suggested' : 'mine');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  /** Archived rows with a restore / delete in flight. A Set, not the
   *  mutation's `variables`: useMutation only reports its LATEST call. */
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const markBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  // ── Counts (drive the tab chips) ──────────────────────────────────────
  const totalRewards = rewards.data?.length ?? 0;

  const adopted = useMemo<AdoptedIndex>(() => {
    const ids = new Set<string>();
    const titles = new Set<string>();
    for (const r of [...(rewards.data ?? []), ...(archived.data ?? [])]) {
      if (r.template_id) ids.add(r.template_id);
      titles.add(normTitle(r.title));
    }
    return { ids, titles };
  }, [rewards.data, archived.data]);

  const suggestedCount = useMemo(
    () => (templates.data ?? []).filter((tp) => !isAdopted(tp, adopted)).length,
    [templates.data, adopted],
  );

  // ── Mine: filter by search ─────────────────────────────────────────────
  const filteredRewards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rewards.data ?? []).filter((r) =>
      q.length === 0 ? true : r.title.toLowerCase().includes(q),
    );
  }, [rewards.data, query]);

  // ── Suggested: filter by search + category, group by category ─────────
  const templatesByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<RewardCategory, RewardTemplate[]>();
    for (const tp of templates.data ?? []) {
      if (categoryFilter !== 'all' && tp.category !== categoryFilter) continue;
      if (q.length > 0) {
        const title = pick(tp.title, tp.title_pt).toLowerCase();
        const desc = (pickNullable(tp.description, tp.description_pt) ?? '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q)) continue;
      }
      const arr = map.get(tp.category) ?? [];
      arr.push(tp);
      map.set(tp.category, arr);
    }
    return map;
  }, [templates.data, query, categoryFilter, pick, pickNullable]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery('');
      return !open;
    });
  };

  const handleAdopt = (template: RewardTemplate) => {
    if (adoptingId || addTemplate.isPending) return;
    if (isAdopted(template, adopted)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAdoptingId(template.id);
    addTemplate.mutate(template, {
      onSettled: () => setAdoptingId(null),
      onError: (err) => {
        // The free cap raises from the insert trigger; the global mutation
        // handler already opened the limit modal.
        if (freeLimitEntity(err)) return;
        const msg = err instanceof Error ? err.message : t('rewardsHub.errors.unknown');
        showInfo(t('rewardsHub.errors.couldNotAdoptTitle'), msg);
      },
    });
  };

  // Tap on a suggestion → the form prefilled, adjust and add in one flow.
  // The saved reward is a fork (template_id null) that counts as the
  // user's own — same convention as práticas.
  const handleCustomize = (template: RewardTemplate) => {
    if (rewardLimit.atLimit) {
      openLimit('reward');
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/reward-form', params: { from_template: template.id } });
  };

  const handleRestore = async (reward: Reward) => {
    if (busyIds.has(reward.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    markBusy(reward.id, true);
    try {
      await restoreReward.mutateAsync(reward.id);
    } catch (e) {
      // Restoring past the free cap: the server refuses and the global
      // handler pops the limit modal — no second dialog on top of it.
      if (freeLimitEntity(e)) return;
      const msg = e instanceof Error ? e.message : t('rewardsHub.errors.unknown');
      showInfo(t('rewardsHub.archived.restoreFail'), msg);
    } finally {
      markBusy(reward.id, false);
    }
  };

  const handleDelete = async (reward: Reward) => {
    if (busyIds.has(reward.id)) return;
    const ok = await confirmAction(
      t('rewardsHub.archived.deleteConfirmTitle', { title: reward.title }),
      t('rewardsHub.archived.deleteConfirmBody'),
      {
        okText: t('rewardsHub.archived.deleteOk'),
        cancelText: t('common.cancel'),
        destructive: true,
      },
    );
    if (!ok) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    markBusy(reward.id, true);
    try {
      await deleteReward.mutateAsync(reward.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('rewardsHub.errors.unknown');
      // The RPC raises a stable English phrase when redemption history
      // blocks the delete. Substring match so the localized copy stays
      // the source of truth for the UI text.
      const friendly = msg.includes('redemption history')
        ? t('rewardsHub.archived.deleteBlockedRedemptions')
        : msg;
      showInfo(t('rewardsHub.archived.deleteFail'), friendly);
    } finally {
      markBusy(reward.id, false);
    }
  };

  const selectCategory = (c: CategoryFilter) => {
    Haptics.selectionAsync().catch(() => {});
    setCategoryFilter(c);
  };

  // Pull indicator is LOCAL state — the queries' isRefetching also flips
  // on every background refetch (drop, restore, return from the form).
  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
    Promise.all([rewards.refetch(), archived.refetch(), templates.refetch()]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        {/* Top bar */}
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
          {/* "Gerenciar recompensas" is ~190px at h3; a 360dp phone leaves
              ~185 next to three 40dp actions, less with the limit badge.
              Shrinks instead of ellipsizing to "Gerenciar recompens…". */}
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {t('rewardsHub.title')}
          </Text>
          <View style={styles.topActions}>
            <Pressable
              onPress={toggleSearch}
              style={({ pressed }) => [
                styles.iconButton,
                searchOpen && styles.iconButtonActive,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                searchOpen ? t('rewardsHub.search.close') : t('rewardsHub.search.open')
              }
            >
              <Ionicons
                name={searchOpen ? 'close' : 'search'}
                size={20}
                color={searchOpen ? tokens.brand.violet2 : tokens.text.hi}
              />
            </Pressable>
            <LimitCounterBadge limit={rewardLimit} />
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('rewardsHub.newReward')}
            >
              <Ionicons name="add" size={22} color={tokens.brand.violet2} />
            </Pressable>
          </View>
        </View>

        {/* Tabs + search live outside the body so they stay put while the
            body container swaps between DraggableFlatList (Minhas) and
            ScrollView (Sugeridas). */}
        <BucketTabsV2<Tab>
          tabs={[
            { value: 'mine', label: t('rewardsHub.tabs.mine'), count: totalRewards },
            { value: 'suggested', label: t('rewardsHub.tabs.suggested'), count: suggestedCount },
          ]}
          value={tab}
          onChange={setTab}
        />

        {searchOpen && (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={tokens.text.dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                tab === 'mine'
                  ? t('rewardsHub.search.placeholderMine')
                  : t('rewardsHub.search.placeholderCatalog')
              }
              placeholderTextColor={tokens.text.faint}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
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

        {tab === 'mine' ? (
          <MineBody
            allActive={rewards.data ?? []}
            rewards={filteredRewards}
            archived={archived.data ?? []}
            ownedOneShots={ownedOneShots.data}
            loading={rewards.isLoading}
            query={query}
            isRefreshing={isRefreshing}
            archivedOpen={archivedOpen}
            onToggleArchived={() => setArchivedOpen((v) => !v)}
            onRefresh={handleRefresh}
            onRewardPress={(id) => router.push({ pathname: '/reward-form', params: { id } })}
            onCreate={handleCreate}
            onHistory={() => router.push('/rewards-history')}
            onReorder={(ids) => reorderRewards.mutate(ids)}
            onRestore={handleRestore}
            onDelete={handleDelete}
            busyIds={busyIds}
            bottomClearance={bottomClearance}
          />
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(tokens.space[10], bottomClearance) + tokens.space[6] },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={tokens.brand.violet2}
                colors={[tokens.brand.violet2]}
              />
            }
          >
            <SuggestedBody
              templatesByCategory={templatesByCategory}
              loading={templates.isLoading}
              query={query}
              categoryFilter={categoryFilter}
              onSelectCategory={selectCategory}
              adopted={adopted}
              onAdopt={handleAdopt}
              onCustomize={handleCustomize}
              adoptingId={adoptingId}
              limit={rewardLimit}
            />
          </ScrollView>
        )}
      </ScreenBackground>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Minhas — one DraggableFlatList of reward rows.
//
// The handle at the right edge of every row is the only thing that starts
// a drag (`onPressIn`), so it responds on touch and the rest of the row
// keeps scrolling and tapping. The dropped order persists to sort_order
// and the Vault's "Disponíveis agora" reads in that order.
// ─────────────────────────────────────────────────────────────────────────────

/** The slice of the drag library's shared-value bundle that its own
 *  reset() zeroes (see react-native-draggable-flatlist DraggableFlatList.tsx). */
interface DragAnimVals {
  activeIndexAnim: { value: number };
  spacerIndexAnim: { value: number };
  touchTranslate: { value: number };
  activeCellSize: { value: number };
  activeCellOffset: { value: number };
}

interface MineBodyProps {
  allActive: Reward[];
  /** Search-filtered slice of `allActive`, in the same order. */
  rewards: Reward[];
  archived: Reward[];
  /** One-shot rewards already bought — hidden from the Vault, still
   *  editable here, so the row says so. undefined while loading. */
  ownedOneShots: Set<string> | undefined;
  loading: boolean;
  query: string;
  isRefreshing: boolean;
  archivedOpen: boolean;
  onToggleArchived: () => void;
  onRefresh: () => void;
  onRewardPress: (id: string) => void;
  onCreate: () => void;
  /** Open the used-rewards log. The Vault's top bar has no room for a
   *  third action, and Banco is the only other door to it. */
  onHistory: () => void;
  onReorder: (orderedIds: string[]) => void;
  onRestore: (reward: Reward) => void;
  onDelete: (reward: Reward) => void;
  /** Archived rows whose restore / delete is in flight. */
  busyIds: Set<string>;
  bottomClearance: number;
}

function MineBody({
  allActive,
  rewards,
  archived,
  ownedOneShots,
  loading,
  query,
  isRefreshing,
  archivedOpen,
  onToggleArchived,
  onRefresh,
  onRewardPress,
  onCreate,
  onHistory,
  onReorder,
  onRestore,
  onDelete,
  busyIds,
  bottomClearance,
}: MineBodyProps) {
  const { t } = useT();

  // Local mirror so the dropped order paints on the release frame. It
  // follows `rewards` by IDENTITY — every refetch, edit, archive or search
  // rebuilds the list, so the mirror can never go stale.
  const [localItems, setLocalItems] = useState<Reward[]>(rewards);
  useEffect(() => {
    setLocalItems(rewards);
  }, [rewards]);

  // The drag library zeroes its shared values (active index, spacer, held
  // translate) ONLY when the row SEQUENCE changes. A release that changes
  // nothing (a tap on the handle, a drop back in place) would leave a
  // stale translate behind: the next press lifts the row displaced, and a
  // press without movement freezes the whole list. On those paths we zero
  // the values ourselves, mirroring the library's own reset(). The library
  // hands the bundle over once, through onAnimValInit.
  const animVals = useRef<DragAnimVals | null>(null);
  const resetDrag = () => {
    const v = animVals.current;
    if (!v) return;
    v.activeIndexAnim.value = -1;
    v.spacerIndexAnim.value = -1;
    v.touchTranslate.value = 0;
    v.activeCellSize.value = -1;
    v.activeCellOffset.value = -1;
  };

  /**
   * Dropped layout → global ordering. Only the rows on screen take their
   * new sequence; anything hidden by the search keeps its exact slot. The
   * server rewrites sort_order 1..N over this list.
   */
  const orderAfterDrop = (next: Reward[]): string[] => {
    const newSequence = next.map((r) => r.id);
    const moving = new Set(newSequence);
    let cursor = 0;
    return allActive.map((r) => (moving.has(r.id) ? (newSequence[cursor++] ?? r.id) : r.id));
  };

  const sameAsCurrent = (order: string[]) =>
    order.length === allActive.length && order.every((id, i) => allActive[i]?.id === id);

  // Screen-reader path. The handle is touch-only (a press-in never reaches
  // assistive tech), so reorder exists as actions on the row itself,
  // through the exact code the drop takes.
  const moveWithin = (rewardId: string, delta: -1 | 1) => {
    const idx = localItems.findIndex((r) => r.id === rewardId);
    if (idx < 0) return;
    const j = idx + delta;
    const neighbour = localItems[j];
    if (!neighbour) return;
    const next = [...localItems];
    next[idx] = neighbour;
    next[j] = localItems[idx]!;
    setLocalItems(next);
    onReorder(orderAfterDrop(next));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Reward>) => (
    <ManageRow
      reward={item}
      bought={item.is_one_shot && (ownedOneShots?.has(item.id) ?? false)}
      drag={drag}
      isActive={isActive}
      onEdit={() => onRewardPress(item.id)}
      onMoveUp={() => moveWithin(item.id, -1)}
      onMoveDown={() => moveWithin(item.id, 1)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={tokens.brand.violet2} />
      </View>
    );
  }

  const nothingActive = allActive.length === 0;
  const nothingMatches = !nothingActive && query.trim().length > 0 && rewards.length === 0;

  const Footer = (
    <View style={styles.footer}>
      {archived.length > 0 && (
        <ArchivedSection
          rewards={archived}
          open={archivedOpen}
          onToggle={onToggleArchived}
          onRestore={onRestore}
          onDelete={onDelete}
          busyIds={busyIds}
        />
      )}
      <Pressable
        onPress={onHistory}
        style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={t('rewardsHub.history.link')}
      >
        <View style={[styles.groupIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Ionicons name="time-outline" size={16} color={tokens.text.mid} />
        </View>
        <View style={styles.groupTitleCol}>
          <Text style={styles.linkRowTitle}>{t('rewardsHub.history.link')}</Text>
          <Text style={styles.linkRowSub} numberOfLines={1}>
            {t('rewardsHub.history.sub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
      </Pressable>
      {!nothingActive && <AddCard label={t('rewardsHub.newReward')} onPress={onCreate} />}
    </View>
  );

  return (
    <DraggableFlatList
      data={nothingActive || nothingMatches ? [] : localItems}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onAnimValInit={(v) => {
        animVals.current = v;
      }}
      onDragEnd={({ data, from, to }) => {
        // Released in place — nothing moved, no RPC; the library still
        // needs its shared values cleared (see resetDrag).
        if (from === to) {
          resetDrag();
          return;
        }
        const order = orderAfterDrop(data);
        if (sameAsCurrent(order)) {
          setLocalItems(data);
          resetDrag();
          return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setLocalItems(data);
        onReorder(order);
      }}
      activationDistance={DRAG_ACTIVATION_DISTANCE}
      // The pan only exists over the rightmost handle column (44dp + the
      // 16dp gutter). Body swipes then have no competing gesture and scroll
      // natively — on Android a 6dp activation would otherwise beat the
      // 8dp scroll slop and eat slow-starting scrolls.
      dragHitSlop={{ right: 0, width: DRAG_HANDLE_WIDTH + tokens.space[4] }}
      ListHeaderComponent={
        nothingActive ? null : <Text style={styles.lead}>{t('rewardsHub.lead')}</Text>
      }
      ListEmptyComponent={
        nothingMatches ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search" size={32} color={tokens.text.dim} />
            <Text style={styles.emptyTitle}>{t('rewardsHub.empty.noMatchesTitle')}</Text>
            <Text style={styles.emptySub}>{t('rewardsHub.empty.noMatchesBody', { query })}</Text>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <EmptyHero tone="coin" iconName="gift" size={120} />
            <Text style={styles.emptyTitle}>{t('rewardsHub.empty.noRewardsTitle')}</Text>
            <Text style={styles.emptySub}>{t('rewardsHub.empty.noRewardsBody')}</Text>
            <Pressable
              onPress={onCreate}
              style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color={tokens.text.hi} />
              <Text style={styles.emptyCtaText}>{t('rewardsHub.empty.cta')}</Text>
            </Pressable>
          </View>
        )
      }
      ListFooterComponent={Footer}
      contentContainerStyle={[
        styles.listContent,
        // Generous bottom padding so the last card clears the OS nav
        // comfortably even when the safe-area inset under-reports.
        { paddingBottom: Math.max(tokens.space[10], bottomClearance) + tokens.space[6] },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={tokens.brand.violet2}
          colors={[tokens.brand.violet2]}
        />
      }
    />
  );
}

interface ManageRowProps {
  reward: Reward;
  /** One-shot already bought: out of the Vault, still yours to edit. */
  bought: boolean;
  drag: () => void;
  isActive: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * Manage row — the Vault card's identity (category-tinted icon tile and
 * left bar, coin cost) on the manage-row chassis shared with práticas:
 * gradient surface, tap the body → edit form, touch the handle → the row
 * lifts at once (`onPressIn`, no long-press wait).
 */
function ManageRow({
  reward,
  bought,
  drag,
  isActive,
  onEdit,
  onMoveUp,
  onMoveDown,
}: ManageRowProps) {
  const { t } = useT();
  const cat = REWARD_CATEGORY_META[reward.category];
  const categoryLabel = t(`rewards.categories.${reward.category}` as const);
  const isCustom = !reward.template_id;
  // Spoken value — the chips are visual only, so a screen reader would
  // otherwise never learn that a one-shot is already bought (and hidden
  // from the Shop).
  const a11yValue = [
    t('rewards.coins', { count: reward.cost }),
    categoryLabel,
    reward.is_one_shot
      ? bought
        ? t('rewardsHub.row.a11yBought')
        : t('rewardsHub.row.a11yOneShot')
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScaleDecorator>
      <View style={styles.rowWrap}>
        <View style={[styles.row, { borderLeftColor: cat.color }, isActive && styles.rowActive]}>
          <LinearGradient
            colors={tokens.gradient.taskCard}
            locations={tokens.gradient.taskCardLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* The label replaces the children for screen readers, so cost
              and category travel as the value; move up / down are custom
              actions here because the handle is touch-only. */}
          <Pressable
            onPress={onEdit}
            disabled={isActive}
            style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={t('rewardsHub.row.editA11y', { title: reward.title })}
            accessibilityValue={{ text: a11yValue }}
            accessibilityActions={[
              { name: 'moveUp', label: t('rewardsHub.row.a11yMoveUp') },
              { name: 'moveDown', label: t('rewardsHub.row.a11yMoveDown') },
            ]}
            onAccessibilityAction={(e) => {
              switch (e.nativeEvent.actionName) {
                case 'moveUp':
                  onMoveUp();
                  break;
                case 'moveDown':
                  onMoveDown();
                  break;
              }
            }}
          >
            <View
              style={[
                styles.iconTile,
                { borderColor: `${cat.color}50`, backgroundColor: `${cat.color}26` },
              ]}
            >
              <AppIcon name={reward.icon} size={17} color={cat.color} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {reward.title}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.costTag}>
                  <CoinIcon size={11} />
                  <Text style={styles.costText}>{reward.cost.toLocaleString()}</Text>
                </View>
                <Text style={[styles.categoryNote, { color: cat.color }]} numberOfLines={1}>
                  · {categoryLabel}
                </Text>
                {reward.is_one_shot && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {bought ? t('rewardsHub.boughtChip') : t('rewardsHub.oneShotChip')}
                    </Text>
                  </View>
                )}
                {isCustom && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{t('rewardsHub.customChip')}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
          {/* The handle: 44dp wide, full row height, drag starts on touch.
              Hidden from assistive tech — a press-in never reaches it; the
              row's custom actions are the accessible path. */}
          <Pressable
            onPressIn={drag}
            disabled={isActive}
            style={({ pressed }) => [styles.dragHandle, pressed && styles.dragHandlePressed]}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Ionicons
              name="reorder-three"
              size={22}
              color={isActive ? tokens.brand.violet2 : tokens.text.mid}
            />
          </Pressable>
        </View>
      </View>
    </ScaleDecorator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Arquivadas — collapsed footer with restore + (guarded) delete
// ─────────────────────────────────────────────────────────────────────────────

interface ArchivedSectionProps {
  rewards: Reward[];
  open: boolean;
  onToggle: () => void;
  onRestore: (reward: Reward) => void;
  onDelete: (reward: Reward) => void;
  busyIds: Set<string>;
}

function ArchivedSection({
  rewards,
  open,
  onToggle,
  onRestore,
  onDelete,
  busyIds,
}: ArchivedSectionProps) {
  const { t } = useT();
  return (
    <View style={styles.archivedBlock}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.groupHeader, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={[styles.groupIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Ionicons name="archive-outline" size={16} color={tokens.text.dim} />
        </View>
        <View style={styles.groupTitleCol}>
          <Text style={[styles.groupEyebrow, { color: tokens.text.mid }]}>
            {t('rewardsHub.archived.section').toUpperCase()}
          </Text>
        </View>
        <View style={[styles.countChip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
          <Text style={[styles.countChipText, { color: tokens.text.mid }]}>{rewards.length}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={tokens.text.dim} />
      </Pressable>

      {open && (
        <View style={styles.archivedList}>
          {rewards.map((reward) => (
            <ArchivedRow
              key={reward.id}
              reward={reward}
              busy={busyIds.has(reward.id)}
              onRestore={() => onRestore(reward)}
              onDelete={() => onDelete(reward)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ArchivedRow({
  reward,
  busy,
  onRestore,
  onDelete,
}: {
  reward: Reward;
  busy: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  return (
    <View style={styles.archivedRow}>
      <View style={[styles.iconTile, styles.iconTileArchived]}>
        <AppIcon name={reward.icon} size={16} color={tokens.text.dim} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: tokens.text.mid }]} numberOfLines={1}>
          {reward.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.costTag}>
            <CoinIcon size={10} />
            <Text style={styles.archivedMeta}>{reward.cost.toLocaleString()}</Text>
          </View>
          <Text style={styles.archivedMeta} numberOfLines={1}>
            · {t(`rewards.categories.${reward.category}` as const)}
          </Text>
        </View>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={tokens.brand.violet2} />
      ) : (
        <>
          <Pressable
            onPress={onRestore}
            hitSlop={8}
            style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={t('rewardsHub.archived.restoreA11y', { title: reward.title })}
          >
            <Ionicons name="refresh" size={14} color={tokens.brand.violet2} />
            <Text style={styles.restoreText}>{t('rewardsHub.archived.restore')}</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={t('rewardsHub.archived.deleteA11y', { title: reward.title })}
          >
            <Ionicons name="trash-outline" size={18} color={tokens.semantic.danger} />
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sugeridas — catalog browse: category chips → category groups → templates
// ─────────────────────────────────────────────────────────────────────────────

interface SuggestedBodyProps {
  templatesByCategory: Map<RewardCategory, RewardTemplate[]>;
  loading: boolean;
  query: string;
  categoryFilter: CategoryFilter;
  onSelectCategory: (c: CategoryFilter) => void;
  adopted: AdoptedIndex;
  onAdopt: (template: RewardTemplate) => void;
  /** Tap on the card body → reward-form prefilled (adjust-then-add). */
  onCustomize: (template: RewardTemplate) => void;
  adoptingId: string | null;
  /** Free-tier reward slots — drives the Premium reinforcement line. */
  limit: EntityLimit;
}

function SuggestedBody({
  templatesByCategory,
  loading,
  query,
  categoryFilter,
  onSelectCategory,
  adopted,
  onAdopt,
  onCustomize,
  adoptingId,
  limit,
}: SuggestedBodyProps) {
  const { t } = useT();

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={tokens.brand.violet2} />
      </View>
    );
  }

  const categoriesWithTemplates = REWARD_CATEGORY_ORDER.filter(
    (c) => (templatesByCategory.get(c)?.length ?? 0) > 0,
  );

  return (
    <View style={styles.suggestedWrap}>
      {/* How-to hint + Premium reinforcement. Adjusting a suggestion forks
          it into the user's own reward, which consumes the free-tier
          slots — surfacing that here is the (soft) Premium funnel. */}
      <View style={styles.suggestedHint}>
        <Ionicons
          name="color-wand-outline"
          size={14}
          color={tokens.text.mid}
          style={{ marginTop: 1 }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.suggestedHintText}>{t('rewardsHub.suggested.hint')}</Text>
          {!limit.unlimited && (
            <Text style={styles.suggestedPremiumText}>
              {t('rewardsHub.suggested.premiumHint', { count: limit.count, limit: limit.limit })}
            </Text>
          )}
        </View>
      </View>

      {/* Category filter — "Todas" + the 3 categories. Bleeds to the screen
          edge (negative margin + inner padding) so chips scroll out under
          the gutter instead of clipping at it. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catChipsScroll}
        contentContainerStyle={styles.catChipsRow}
        keyboardShouldPersistTaps="handled"
      >
        <CategoryChip
          label={t('rewardsHub.suggested.allCategories')}
          color={tokens.brand.violet2}
          bg="rgba(155,130,255,0.16)"
          selected={categoryFilter === 'all'}
          onPress={() => onSelectCategory('all')}
        />
        {REWARD_CATEGORY_ORDER.map((c) => {
          const meta = REWARD_CATEGORY_META[c];
          return (
            <CategoryChip
              key={c}
              label={t(`rewards.categories.${c}` as const)}
              icon={meta.icon}
              color={meta.color}
              bg={meta.bg}
              selected={categoryFilter === c}
              onPress={() => onSelectCategory(c)}
            />
          );
        })}
      </ScrollView>

      {categoriesWithTemplates.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="search" size={32} color={tokens.text.dim} />
          <Text style={styles.emptyTitle}>{t('rewardsHub.empty.noMatchesTitle')}</Text>
          <Text style={styles.emptySub}>{t('rewardsHub.empty.noMatchesCatalog', { query })}</Text>
        </View>
      ) : (
        categoriesWithTemplates.map((c) => {
          const meta = REWARD_CATEGORY_META[c];
          const list = templatesByCategory.get(c) ?? [];
          // Same count the tab chip shows: what is still there to adopt.
          const openCount = list.filter((tp) => !isAdopted(tp, adopted)).length;
          return (
            <View key={c} style={styles.catGroup}>
              <View style={styles.groupHeader} accessibilityRole="header">
                <View style={[styles.groupIcon, { backgroundColor: meta.bg }]}>
                  <AppIcon name={meta.icon} size={16} color={meta.color} />
                </View>
                <View style={styles.groupTitleCol}>
                  <Text style={[styles.groupEyebrow, { color: meta.color }]}>
                    {t(`rewards.categories.${c}` as const).toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.countChip, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.countChipText, { color: meta.color }]}>{openCount}</Text>
                </View>
              </View>
              <View style={styles.catGroupBody}>
                {list.map((tmpl) => (
                  <TemplateRow
                    key={tmpl.id}
                    template={tmpl}
                    isAdopted={isAdopted(tmpl, adopted)}
                    isAdopting={adoptingId === tmpl.id}
                    onAdopt={() => onAdopt(tmpl)}
                    onPress={() => onCustomize(tmpl)}
                  />
                ))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function CategoryChip({
  label,
  icon,
  color,
  bg,
  selected,
  onPress,
}: {
  label: string;
  icon?: string;
  color: string;
  bg: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.catChip,
        selected
          ? { backgroundColor: bg, borderColor: `${color}80` }
          : { backgroundColor: 'transparent', borderColor: tokens.border.base },
        pressed && { opacity: 0.7 },
      ]}
    >
      {icon ? (
        <AppIcon name={icon} size={13} color={selected ? color : tokens.text.mid} />
      ) : (
        <View style={[styles.catChipDot, { backgroundColor: color, opacity: selected ? 1 : 0.6 }]} />
      )}
      <Text
        style={[
          styles.catChipText,
          { color: selected ? color : tokens.text.mid },
          selected && { fontFamily: 'Manrope_800ExtraBold' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface TemplateRowProps {
  template: RewardTemplate;
  isAdopted: boolean;
  isAdopting: boolean;
  onAdopt: () => void;
  /** Tap on the card body — open the prefilled form (adjust-then-add). */
  onPress: () => void;
}

/**
 * Suggestion card in the manage-row vocabulary (category tile, accent
 * left bar, coin cost), so a template reads as "a reward you don't have
 * yet" instead of a distinct species. The whole body is pressable →
 * prefilled form; the gold "+" on the right adopts as-is.
 */
function TemplateRow({ template, isAdopted, isAdopting, onAdopt, onPress }: TemplateRowProps) {
  const { t } = useT();
  const { pick, pickNullable } = useLocalizedPick();
  const cat = REWARD_CATEGORY_META[template.category];
  const title = pick(template.title, template.title_pt);
  const description = pickNullable(template.description, template.description_pt);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.templateCard,
        { borderLeftColor: cat.color },
        isAdopted && styles.templateCardAdopted,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('rewardsHub.suggested.customizeA11y', { title })}
      // The label replaces the children, so cost and the adopted state
      // travel as the value.
      accessibilityValue={{
        text: [t('rewards.coins', { count: template.cost }), isAdopted ? t('rewardsHub.adopt.added') : null]
          .filter(Boolean)
          .join(' · '),
      }}
      accessibilityState={isAdopted ? { selected: true } : undefined}
    >
      <LinearGradient
        colors={tokens.gradient.taskCard}
        locations={tokens.gradient.taskCardLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={[
          styles.iconTile,
          { borderColor: `${cat.color}50`, backgroundColor: `${cat.color}26` },
        ]}
      >
        <AppIcon name={template.icon} size={17} color={cat.color} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.templateDesc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.costTag}>
            <CoinIcon size={11} />
            <Text style={styles.costText}>{template.cost.toLocaleString()}</Text>
          </View>
          {template.is_one_shot && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{t('rewardsHub.oneShotChip')}</Text>
            </View>
          )}
        </View>
      </View>

      {isAdopted ? (
        <View style={styles.adoptedPill}>
          <Ionicons name="checkmark" size={13} color={tokens.semantic.xp} />
          <Text style={styles.adoptedPillText}>{t('rewardsHub.adopt.added')}</Text>
        </View>
      ) : (
        <Pressable
          onPress={isAdopting ? undefined : onAdopt}
          disabled={isAdopting}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('rewardsHub.adopt.adoptA11y', { title })}
          style={({ pressed }) => [styles.adoptBtn, pressed && styles.adoptBtnPressed]}
        >
          {/* Gold gradient — same DNA as COMPRAR on the Vault card. */}
          <LinearGradient
            colors={tokens.gradient.coinBtn as [string, string, string]}
            locations={tokens.gradient.coinBtnLocations as [number, number, number]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {isAdopting ? (
            <ActivityIndicator size="small" color="#3D2A00" />
          ) : (
            <Ionicons name="add" size={20} color="#3D2A00" />
          )}
        </Pressable>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  topActions: {
    flexDirection: 'row',
    gap: tokens.space[2],
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(123,92,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123,92,255,0.4)',
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    flexShrink: 1,
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
    marginTop: tokens.space[3],
  },
  searchInput: {
    flex: 1,
    color: tokens.text.hi,
    ...tokens.type.body,
    paddingVertical: 0,
  },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  listContent: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  lead: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    paddingBottom: tokens.space[2],
  },
  loadingBox: {
    paddingVertical: tokens.space[10],
    alignItems: 'center',
  },

  // ── Group headers (Arquivadas · Sugeridas categories) ─────────────────
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  groupIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitleCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  groupEyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  countChip: {
    minWidth: 24,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.3,
  },

  // ── Manage row ────────────────────────────────────────────────────────
  rowWrap: {
    marginBottom: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  rowActive: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(155,130,255,0.10)',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 4,
  },
  // 44dp wide, the row's full height: a thumb lands on it without aiming.
  dragHandle: {
    width: DRAG_HANDLE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: tokens.border.divider,
  },
  // Sits ABOVE the card gradient (the handle is a sibling of it), so the
  // wash actually shows.
  dragHandlePressed: {
    backgroundColor: tokens.brand.violetGlow,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconTileArchived: {
    borderColor: tokens.border.base,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  costTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.semantic.coinLight,
    letterSpacing: 0.2,
  },
  categoryNote: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  // 9px text.mid — 8px text.dim on the 6% wash sat around 3.3:1.
  chipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: tokens.text.mid,
  },

  // ── Footer: archived + add ────────────────────────────────────────────
  footer: {
    gap: tokens.space[3],
    marginTop: tokens.space[2],
  },
  archivedBlock: {
    gap: 0,
  },
  archivedList: {
    gap: tokens.space[2],
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  archivedMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  linkRowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  linkRowSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155,130,255,0.35)',
    backgroundColor: 'rgba(155,130,255,0.1)',
  },
  restoreText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
    letterSpacing: 0.3,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty states ──────────────────────────────────────────────────────
  emptyBox: {
    paddingVertical: tokens.space[8],
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[5],
  },
  emptyTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  emptySub: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    marginTop: tokens.space[2],
  },
  emptyCtaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },

  // ── Sugeridas ─────────────────────────────────────────────────────────
  suggestedWrap: {
    gap: tokens.space[1],
  },
  suggestedHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: tokens.border.base,
    marginBottom: tokens.space[2],
  },
  suggestedHintText: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  suggestedPremiumText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: tokens.brand.violet2,
  },
  catChipsScroll: {
    marginHorizontal: -tokens.space[4],
    flexGrow: 0,
  },
  catChipsRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
    paddingVertical: tokens.space[1],
    paddingHorizontal: tokens.space[4],
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  catChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  catGroup: {
    gap: 0,
  },
  catGroupBody: {
    gap: tokens.space[2],
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  templateCardAdopted: {
    opacity: 0.6,
  },
  templateDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: tokens.text.mid,
  },
  adoptBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    flexShrink: 0,
  },
  adoptBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
  adoptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 28,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(61,214,140,0.35)',
    backgroundColor: 'rgba(61,214,140,0.10)',
    flexShrink: 0,
  },
  adoptedPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.semantic.xp,
  },
});
