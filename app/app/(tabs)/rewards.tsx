import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AddCard } from '@/components/AddCard';
import { useBottomNavClearance } from '@/components/BottomNavBar';
import { BuyCelebrationModal } from '@/components/BuyCelebrationModal';
import { BuyConfirmModal } from '@/components/BuyConfirmModal';
import { FabStack, fabStackClearance, type FabSize } from '@/components/FabStack';
import { RewardActionSheet } from '@/components/RewardActionSheet';
import { RewardCard } from '@/components/RewardCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { TrackedRewardCard } from '@/components/TrackedRewardCard';
import { TrackPickerSheet } from '@/components/TrackPickerSheet';
import { VaultHero } from '@/components/VaultHero';
import { useCharacter } from '@/lib/api/character';
import {
  useArchiveReward,
  useRedeemRewardN,
  useOwnedOneShotIds,
  useRewards,
  useSetTrackedReward,
  useTrackedRewardId,
  useUndoRedemption,
} from '@/lib/api/rewards';
import type { Reward, RewardCategory } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLimitGuard, useRewardLimit } from '@/lib/premium';
import { TourModule } from '@/components/tour/TourModule';
import { TourTarget } from '@/components/tour/TourTarget';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { buildM4Steps, M4_EVENTS, M4_MANAGE_STEP } from '@/lib/tour/m4Steps';
import {
  useActiveTourStep,
  useActiveTourStepStore,
  useIsCurrentTourModule,
  useTourStore,
} from '@/lib/tour/store';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META, REWARD_CATEGORY_ORDER } from '@/theme/rewards';

/**
 * Bucket threshold for "Almost there". A reward lands in Almost when the
 * user already has ≥(1 - ALMOST_RATIO) of its cost — i.e. the remaining
 * deficit is at most ALMOST_RATIO of the price.
 *
 * Proportional (vs. a fixed coin amount) so the bucketing scales with the
 * user's stage: a 50-coin reward needs 35 to be "almost", a 5000-coin
 * reward needs ~3500. Fixed thresholds either trivialize small rewards
 * for rich users or make everything "big" for poor users.
 */
const ALMOST_RATIO = 0.3;

/** The floating stack mirrors the Home's: a neutral calendar on top and the
 *  gold primary below — Gerenciar recompensas (create, adopt, order, edit;
 *  Resgates hangs off its header). */
const CALENDAR_FAB_SIZE: FabSize = 'md';
const MANAGE_FAB_SIZE: FabSize = 'lg';
/** Height the stack occupies above the nav — the scroll reserves it. */
const REWARDS_FAB_CLEARANCE = fabStackClearance([CALENDAR_FAB_SIZE, MANAGE_FAB_SIZE]);

export default function RewardsScreen() {
  const router = useRouter();
  const { t } = useT();
  const character = useCharacter();
  const rewards = useRewards();
  // Compras únicas já adquiridas — saem da vitrine, mas continuam existindo
  // (a tela de gerenciar lista; o resgate fica em Resgates).
  const ownedOneShots = useOwnedOneShotIds();
  const redeem = useRedeemRewardN();
  const undoRedemption = useUndoRedemption();
  const archiveReward = useArchiveReward();
  const trackedId = useTrackedRewardId();
  const setTracked = useSetTrackedReward();
  const rewardLimit = useRewardLimit();
  const guardCreate = useLimitGuard(rewardLimit, 'reward');

  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  // Additive category filter. Empty set = no filter active (everything
  // shows). Tapping a chip adds it to the filter; tapping it again
  // removes it. When the user empties the set back out, they're "back to
  // showing everything" — same state as the initial render.
  // Chips render in 3 states: rest (no filter active), selected (in
  // filter), and ghosted (filter active but this chip not selected).
  const [selectedCategories, setSelectedCategories] = useState<Set<RewardCategory>>(
    () => new Set(),
  );
  const filterActive = selectedCategories.size > 0;
  const [pickerOpen, setPickerOpen] = useState(false);
  // Long-press → open this reward's action sheet. Single source of truth
  // for the sheet so it stays bound to one reward across re-renders.
  const [actionSheetReward, setActionSheetReward] = useState<Reward | null>(null);
  // Custom in-aesthetic confirm modal — replaces the system Alert that
  // used to pop on BUY. Single state holds the reward; null = closed.
  const [confirmingPurchase, setConfirmingPurchase] = useState<Reward | null>(null);
  // Celebration modal payload — set after a successful purchase.
  const [celebration, setCelebration] = useState<{
    reward: Reward;
    qty: number;
    costPaid: number;
    /** Redemption ids created by this purchase — "Desfazer" undoes exactly these. */
    redemptionIds: string[];
  } | null>(null);
  const navClearance = useBottomNavClearance();
  // Bottom-positioned M4 tooltip cards need scroll room above them —
  // same device Home/Eu/task-form already use. Floor at 160, grow with
  // the real measured card height so restyles can't eat the gap.
  const activeTourStep = useActiveTourStep();
  const tourCardHeight = useActiveTourStepStore((s) => s.cardHeight);
  const tourBottomBump =
    activeTourStep?.position === 'bottom'
      ? Math.max(160, (tourCardHeight ?? 0) + 24)
      : 0;

  // ── M4 tour plumbing ────────────────────────────────────────────────
  const isM4Current = useIsCurrentTourModule('M4');
  const m4StepIndex = useTourStore((s) => s.stepIndices.M4 ?? 0);
  const m4Status = useTourStore((s) => s.modules.M4?.status);
  const scrollRef = useRef<ScrollView>(null);

  // M4 step 1 lives on Home and waits for the user to reach this tab.
  // Emit REWARDS_NAVIGATED when the screen gains focus while step 1 is
  // still current, so the Home tooltip advances to step 2 (which renders
  // here). Guarded by step index 0 so re-focusing later doesn't re-fire.
  useFocusEffect(
    useCallback(() => {
      const state = useTourStore.getState();
      const status = state.modules.M4?.status ?? 'pending';
      const idx = state.stepIndices.M4 ?? 0;
      if (isM4Current && idx === 0 && status !== 'completed' && status !== 'skipped') {
        emitTourEvent(M4_EVENTS.REWARDS_NAVIGATED);
      }
    }, [isM4Current]),
  );

  // M4 step 3 completes by OPENING Gerenciar: every door into it (the gold
  // FAB, the empty state's "Ver sugestões") sets the flag, and when this
  // screen regains focus (Gerenciar closed) we finish the module and hand
  // the user back to Home so M5's Home-anchored step 1 can show.
  //
  // The finish is synchronous and happens BEFORE navigating: Home rewinds
  // any module still mid-flight on another screen when it regains focus
  // (`rewindOnFocus`), and the event path alone would only finish M4 on
  // the next render — racing that rewind back to step 1. The emit stays so
  // the step's `awaitEvent` keeps its meaning; once M4 is completed the
  // runner has no step left to advance, so it cannot double-fire.
  const manageVisitedInTour = useRef(false);
  const noteManageVisit = () => {
    if (isM4Current && (useTourStore.getState().stepIndices.M4 ?? 0) === M4_MANAGE_STEP) {
      manageVisitedInTour.current = true;
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (!manageVisitedInTour.current) return;
      manageVisitedInTour.current = false;
      const state = useTourStore.getState();
      const idx = state.stepIndices.M4 ?? 0;
      if (isM4Current && idx === M4_MANAGE_STEP) {
        emitTourEvent(M4_EVENTS.MANAGE_VISITED);
        void state.setStatus('M4', 'completed');
        state.setStepIndex('M4', 0);
        router.navigate('/(tabs)');
      }
    }, [isM4Current, router]),
  );

  // Auto-scroll as the M4 steps open: step 2 spotlights the balance at the
  // top of the scroll → back to the top. Step 3 spotlights the Gerenciar
  // FAB, which floats, so it needs no scroll.
  useEffect(() => {
    if (!isM4Current || m4Status !== 'in_progress') return;
    const id = setTimeout(() => {
      if (m4StepIndex === 1) scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 150);
    return () => clearTimeout(id);
  }, [isM4Current, m4Status, m4StepIndex]);

  const coins = character.data?.character.coins ?? 0;
  // Reserve the floating stack's height under the scroll, `max` against the
  // tour gap for the reason documented on fabStackClearance.
  const scrollBottomPad = navClearance + Math.max(tourBottomBump, REWARDS_FAB_CLEARANCE);
  const trackedReward = useMemo(() => {
    if (!trackedId.data) return null;
    const found = (rewards.data ?? []).find((r) => r.id === trackedId.data) ?? null;
    // Perseguir algo que já foi comprado não faz sentido: o arco fechou.
    // Só some do herói — a linha de tracking fica, e some sozinha quando o
    // usuário escolhe a próxima.
    if (found && ownedOneShots.data?.has(found.id)) return null;
    return found;
  }, [trackedId.data, rewards.data, ownedOneShots.data]);

  // Reward set after applying the category filter, with the tracked
  // reward removed (it gets its own hero card so we don't duplicate).
  // Empty filter set = no filter (everything passes the category gate).
  const filteredRewards = useMemo(() => {
    const owned = ownedOneShots.data;
    return (rewards.data ?? []).filter(
      (r) =>
        (!filterActive || selectedCategories.has(r.category)) &&
        r.id !== trackedId.data &&
        // Compra única já adquirida sai da vitrine. Enquanto o resgate não
        // carregou, `owned` é undefined e nada é escondido — preferimos um
        // card a mais por um instante a um piscar de card sumindo.
        !(r.is_one_shot && owned?.has(r.id)),
    );
  }, [rewards.data, selectedCategories, filterActive, trackedId.data, ownedOneShots.data]);

  // Bucket every visible reward into exactly one section so the screen
  // partitions cleanly with no overlap or orphans.
  const sections = useMemo(() => {
    const available: Reward[] = [];
    const almost: Reward[] = [];
    const bigGoals: Reward[] = [];

    for (const r of filteredRewards) {
      const deficit = r.cost - coins;
      if (deficit <= 0) {
        available.push(r);
      } else if (deficit / r.cost <= ALMOST_RATIO) {
        // ≥70% of the way there: a stretch but visible.
        almost.push(r);
      } else {
        bigGoals.push(r);
      }
    }

    almost.sort((a, b) => a.cost - coins - (b.cost - coins));
    bigGoals.sort((a, b) => b.cost - a.cost);

    return { available, almost, bigGoals };
  }, [filteredRewards, coins]);

  // Hero status — only renders meaningful copy when there's NO tracked
  // reward (idle motivator) or when the tracked reward becomes
  // affordable (celebratory beat). When the user has a tracked reward
  // they're saving for, the tracked card sits right below the balance
  // and carries the message in full; surfacing "Almejando X" up here
  // too just duplicated the title.
  const headline = useMemo(() => {
    if (trackedReward) {
      const deficit = Math.max(0, trackedReward.cost - coins);
      return deficit > 0
        ? ''
        : t('rewards.vault.heroStatusReady', { title: trackedReward.title });
    }
    return t('rewards.vault.heroStatusIdle');
  }, [trackedReward, coins, t]);

  const toggleCategory = (cat: RewardCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        // Removing the last chip lands us back in "no filter active",
        // which is the same visual as "haven't picked anything yet".
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
    Haptics.selectionAsync().catch(() => {});
  };

  const openActionSheet = (reward: Reward) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setActionSheetReward(reward);
  };

  const handleCreateReward = () =>
    guardCreate(() => router.push('/reward-form'));

  // Opening Gerenciar during M4 step 3 sets the flag; the focus effect
  // above completes the module when the user comes back.
  const handleOpenManage = () => {
    Haptics.selectionAsync().catch(() => {});
    noteManageVisit();
    router.push('/rewards-manage');
  };

  const handleEditReward = (reward: Reward) => {
    router.push({ pathname: '/reward-form', params: { id: reward.id } });
  };

  const handleArchiveReward = async (reward: Reward) => {
    const ok = await confirmAction(
      t('reward.shop.archiveTitle', { title: reward.title }),
      t('reward.shop.archiveBody'),
      {
        okText: t('reward.shop.archiveOk'),
        cancelText: t('reward.common.cancel'),
        destructive: true,
      },
    );
    if (!ok) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    try {
      await archiveReward.mutateAsync(reward.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showInfo(t('reward.shop.archiveFail'), msg);
    }
  };

  // Open the custom in-aesthetic confirm modal. The actual purchase
  // call lives in handleConfirmedPurchase, fired by the modal's onConfirm.
  // This split lets the modal own quantity state without the parent
  // having to thread it through.
  const handleBuy = (reward: Reward) => {
    setConfirmingPurchase(reward);
  };

  const handleConfirmedPurchase = async (reward: Reward, qty: number) => {
    setConfirmingPurchase(null);
    setRedeemingId(reward.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      const result = await redeem.mutateAsync({
        rewardId: reward.id,
        cost: reward.cost,
        qty,
      });
      setCelebration({
        reward,
        qty: result?.qty ?? qty,
        costPaid: result?.total_paid ?? reward.cost * qty,
        redemptionIds: result?.redemption_ids ?? [],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showInfo(t('reward.shop.buyFail'), msg);
    } finally {
      setRedeemingId(null);
    }
  };

  /**
   * "Desfazer" on the celebration — takes back exactly the rows this
   * purchase created (refund included). One at a time: parallel calls on
   * the same optimistic mutation would read the same balance snapshot.
   */
  const handleUndoCelebration = async (redemptionIds: string[]) => {
    setCelebration(null);
    if (redemptionIds.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      for (const id of redemptionIds) {
        await undoRedemption.mutateAsync(id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      showInfo(t('rewards.undoConfirm.failTitle'), msg);
    }
  };

  const handleTrack = (rewardId: string) => {
    setTracked.mutate(rewardId);
  };

  const handleUntrack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTracked.mutate(null);
  };

  /**
   * `wide` flips the grid from 2-col to 1-col. Used by the "Big goals"
   * section so big-ticket items get more breathing room — they're
   * aspirational, longer-horizon, and reading them at full width signals
   * that visually.
   */
  const renderRewardGrid = (list: Reward[], { wide = false } = {}) => (
    <View style={styles.grid}>
      {list.map((reward) => (
        <View
          key={reward.id}
          style={wide ? styles.gridItemWide : styles.gridItem}
        >
          <RewardCard
            reward={reward}
            affordable={coins >= reward.cost}
            deficit={Math.max(0, reward.cost - coins)}
            coins={coins}
            tracked={trackedId.data === reward.id}
            onRedeem={() => handleBuy(reward)}
            onEdit={() => handleEditReward(reward)}
            onLongPress={() => openActionSheet(reward)}
            onTrack={() => handleTrack(reward.id)}
            onUntrack={handleUntrack}
            isRedeeming={redeemingId === reward.id}
          />
        </View>
      ))}
    </View>
  );

  const noRewardsAtAll = (rewards.data ?? []).length === 0;

  // Pull indicator is local state — the queries' isRefetching also flips on
  // every background refetch (mutations, app foreground).
  const pull = usePullToRefresh(() =>
    Promise.all([rewards.refetch(), character.refetch()]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            onRefresh={pull.onRefresh}
            tintColor={tokens.brand.violet2}
          />
        }
      >
        {/* M4 step 2 spotlights the balance: where coins come from. */}
        <TourTarget id="rewards.balance" radius={tokens.radius.lg}>
          <VaultHero balanceLabel={coins.toLocaleString()} status={headline} />
        </TourTarget>

        {/* Tracked reward sits right under the coin balance so the user
            sees what they're saving for at a glance. */}
        {trackedReward && (
          <View style={styles.trackedWrap}>
            <TrackedRewardCard
              reward={trackedReward}
              coins={coins}
              onChange={() => setPickerOpen(true)}
              onUntrack={handleUntrack}
              onBuy={() => handleBuy(trackedReward)}
              onLongPress={() => openActionSheet(trackedReward)}
              isBuying={redeemingId === trackedReward.id}
            />
          </View>
        )}

        {/* "Track a reward" CTA appears only when nothing is tracked
            yet. The tracked card itself lives above (see hoisted
            block) so the user always sees their current goal
            immediately under the balance. */}
        {!trackedReward && (
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={({ pressed }) => [
                  styles.trackCta,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.trackCtaIcon}>
                  <Ionicons name="bookmark" size={18} color={tokens.brand.violet2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.trackCtaTitle}>{t('rewards.vault.trackCtaTitle')}</Text>
                  <Text style={styles.trackCtaSub}>
                    {t('rewards.vault.trackCtaSub')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={tokens.text.mid} />
              </Pressable>
            )}

            <View style={styles.chipsRow}>
              {REWARD_CATEGORY_ORDER.map((cat) => {
                const m = REWARD_CATEGORY_META[cat];
                const selected = selectedCategories.has(cat);
                // Three states: 'rest' (no filter active), 'selected'
                // (in active filter) or 'ghosted' (filter active but
                // this chip not in it). 'rest' renders mid-key so the
                // user reads "tap to filter"; 'selected' goes full
                // category color; 'ghosted' fades to make the filter
                // state legible at a glance.
                const variant: 'rest' | 'selected' | 'ghosted' = !filterActive
                  ? 'rest'
                  : selected
                    ? 'selected'
                    : 'ghosted';
                const iconColor =
                  variant === 'selected'
                    ? m.color
                    : variant === 'ghosted'
                      ? tokens.text.faint
                      : m.color;
                const textColor =
                  variant === 'selected'
                    ? m.color
                    : variant === 'ghosted'
                      ? tokens.text.faint
                      : tokens.text.mid;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[
                      styles.chip,
                      variant === 'selected' && {
                        backgroundColor: `${m.color}1A`,
                        borderTopColor: `${m.color}80`,
                        borderColor: `${m.color}70`,
                      },
                      variant === 'ghosted' && styles.chipGhosted,
                      variant === 'rest' && styles.chipRest,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <AppIcon name={m.icon} size={14} color={iconColor} />
                    <Text style={[styles.chipText, { color: textColor }]}>
                      {t(`rewards.categories.${cat}` as const)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {rewards.isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={tokens.brand.violet2} />
              </View>
            ) : noRewardsAtAll ? (
              <View style={styles.emptyBox}>
                <Ionicons name="gift-outline" size={40} color={tokens.brand.violet2} />
                <Text style={styles.emptyTitle}>{t('rewards.vault.emptyTitle')}</Text>
                <Text style={styles.emptySub}>
                  {t('rewards.vault.emptyBody')}
                </Text>
                {/* The catalog moved to Gerenciar › Sugeridas; a fresh
                    user needs the door right here. */}
                <View style={styles.emptyCtas}>
                  <Pressable
                    onPress={() => {
                      noteManageVisit();
                      router.push({ pathname: '/rewards-manage', params: { tab: 'suggested' } });
                    }}
                    style={({ pressed }) => [
                      styles.emptyCta,
                      styles.emptyCtaPrimary,
                      pressed && { opacity: 0.8 },
                    ]}
                    accessibilityRole="button"
                  >
                    <Ionicons name="bulb" size={16} color={tokens.semantic.coin} />
                    <Text style={[styles.emptyCtaText, { color: tokens.semantic.coin }]}>
                      {t('rewards.vault.seeSuggestions')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateReward}
                    style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                  >
                    <Ionicons name="add" size={16} color={tokens.text.hi} />
                    <Text style={styles.emptyCtaText}>{t('rewards.vault.createOwn')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {sections.available.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[styles.sectionTitle, { color: '#FFC83D' }]}
                      >
                        {t('rewards.vault.sections.available')}
                      </Text>
                      <Text style={styles.sectionMeta}>
                        {t('rewards.vault.itemsCount', {
                          count: sections.available.length,
                        })}
                      </Text>
                    </View>
                    {renderRewardGrid(sections.available)}
                  </View>
                )}

                {sections.almost.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[styles.sectionTitle, { color: '#FF9F43' }]}
                      >
                        {t('rewards.vault.sections.almost')}
                      </Text>
                      <Text style={styles.sectionMeta}>
                        {t('rewards.vault.itemsCount', {
                          count: sections.almost.length,
                        })}
                      </Text>
                    </View>
                    {renderRewardGrid(sections.almost)}
                  </View>
                )}

                {sections.bigGoals.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[styles.sectionTitle, { color: '#9B82FF' }]}
                      >
                        {t('rewards.vault.sections.big')}
                      </Text>
                      <Text style={styles.sectionMeta}>
                        {t('rewards.vault.itemsCount', {
                          count: sections.bigGoals.length,
                        })}
                      </Text>
                    </View>
                    {renderRewardGrid(sections.bigGoals, { wide: true })}
                  </View>
                )}
              </>
            )}

            {/* The empty state above already offers "Criar a minha";
                a second create card right under it read as a duplicate. */}
            {!noRewardsAtAll && (
              <View style={styles.addCardWrap}>
                <AddCard
                  label={t('rewards.vault.addReward')}
                  sublabel={t('rewards.vault.addRewardSub')}
                  tint={tokens.brand.violet2}
                  onPress={handleCreateReward}
                />
              </View>
            )}

      </ScrollView>
      </ScreenBackground>

      <TrackPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        rewards={rewards.data ?? []}
        coins={coins}
        currentTrackedId={trackedId.data ?? null}
        onPick={handleTrack}
      />

      <RewardActionSheet
        visible={!!actionSheetReward}
        rewardTitle={actionSheetReward?.title ?? ''}
        affordable={
          actionSheetReward ? coins >= actionSheetReward.cost : false
        }
        onCancel={() => setActionSheetReward(null)}
        onEdit={() => {
          const r = actionSheetReward;
          setActionSheetReward(null);
          if (r) handleEditReward(r);
        }}
        onArchive={() => {
          const r = actionSheetReward;
          setActionSheetReward(null);
          if (r) handleArchiveReward(r);
        }}
        onBuyQuantity={() => {
          const r = actionSheetReward;
          setActionSheetReward(null);
          if (r) handleBuy(r);
        }}
      />

      <BuyConfirmModal
        visible={!!confirmingPurchase}
        reward={confirmingPurchase}
        coins={coins}
        onCancel={() => setConfirmingPurchase(null)}
        onConfirm={(qty) => {
          const r = confirmingPurchase;
          if (r) handleConfirmedPurchase(r, qty);
        }}
      />

      <BuyCelebrationModal
        visible={!!celebration}
        reward={celebration?.reward ?? null}
        qty={celebration?.qty ?? 1}
        costPaid={celebration?.costPaid ?? 0}
        onClose={() => setCelebration(null)}
        onUndo={() => handleUndoCelebration(celebration?.redemptionIds ?? [])}
      />

      {/* Floating stack, same shape as the Home's: the calendar (Vault front)
          on top, Gerenciar recompensas as the gold primary — the Home's
          primary is Todas as práticas, which hosts Gerenciar; here the shop
          IS the doing surface, so the primary goes straight to curating.
          Resgates (the ledger) is the clock in Gerenciar's header, and the
          calendar. RAW navClearance so it doesn't leap under a bottom tour
          tooltip. M4 step 3 spotlights the gold button. */}
      <FabStack
        bottomOffset={navClearance}
        actions={[
          {
            key: 'calendar',
            icon: 'calendar-outline',
            onPress: () => router.push({ pathname: '/history', params: { front: 'vault' } }),
            accessibilityLabel: t('tabs.history'),
            size: CALENDAR_FAB_SIZE,
            tone: 'neutral',
          },
          {
            key: 'manage',
            icon: 'options-outline',
            onPress: handleOpenManage,
            accessibilityLabel: t('rewardsHub.title'),
            size: MANAGE_FAB_SIZE,
            tone: 'gold',
            wrap: (node) => (
              <TourTarget id="rewards.manage" radius={999}>
                {node}
              </TourTarget>
            ),
          },
        ]}
      />

      {/* M4 steps 2-3 live here (balance, then Gerenciar + the redeem verb).
         Step 1 is on Home (Rewards tab spotlight). Finishing returns the
         user to the Tasks home so the next module's Home-anchored step 1
         can show. No `flatNav` — this is a tab screen WITH the floating
         BottomNavBar. */}
      <TourModule
        module="M4"
        screen="rewards"
        steps={buildM4Steps(t)}
        enabled={isM4Current}
        onExitScreen={() => router.navigate('/(tabs)')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  content: {
    padding: tokens.space[4],
  },
  chipsRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
    marginBottom: tokens.space[5],
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: tokens.space[2],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  // Initial state — no filter active. Mid-key so it reads as "tap to filter".
  chipRest: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: tokens.border.base,
  },
  // Filter is active and this chip is NOT in it. Faded so the active
  // chips visually dominate; user can see at a glance which ones are on.
  chipGhosted: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: tokens.border.base,
    opacity: 0.4,
  },
  chipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: tokens.space[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.space[3],
  },
  sectionTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  sectionMeta: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingBox: {
    paddingVertical: tokens.space[8],
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: tokens.space[6],
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    marginTop: tokens.space[2],
  },
  emptySub: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[6],
  },
  emptyCtas: {
    flexDirection: 'row',
    gap: tokens.space[2],
    marginTop: tokens.space[2],
    paddingHorizontal: tokens.space[4],
  },
  emptyCta: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface2,
  },
  emptyCtaPrimary: {
    borderColor: 'rgba(255,200,61,0.38)',
    backgroundColor: 'rgba(255,200,61,0.10)',
  },
  emptyCtaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[3],
  },
  gridItem: {
    width: '48%',
    flexGrow: 1,
  },
  gridItemWide: {
    // Full row. Used by the "Big goals" section so aspirational
    // rewards read at full attention instead of crammed two-up.
    width: '100%',
  },

  addCardWrap: {
    marginTop: tokens.space[2],
  },


  // Tracked reward block
  trackedWrap: {
    marginBottom: tokens.space[4],
  },
  trackCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderStyle: 'dashed',
    backgroundColor: tokens.bg.surface,
    marginBottom: tokens.space[4],
  },
  trackCtaIcon: {
    width: 38,
    height: 38,
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(155, 130, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCtaTitle: {
    ...tokens.type.bodyLg,
    color: tokens.text.hi,
    fontFamily: 'Manrope_700Bold',
  },
  trackCtaSub: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    marginTop: 2,
  },
});
