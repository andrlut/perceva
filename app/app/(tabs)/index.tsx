import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavClearance } from '@/components/BottomNavBar';
import { CompleteTaskSheet } from '@/components/CompleteTaskSheet';
import { DayClearedCelebration } from '@/components/DayClearedCelebration';
import { MoodCheckinPrompt } from '@/components/MoodCheckinPrompt';
import { MoodHubStrip } from '@/components/mood/MoodHubStrip';
import { CompletedBucket, type CompletedItem } from '@/components/CompletedBucket';
import { QuestChipsStrip } from '@/components/QuestChipsStrip';
import { RewardStatsCard, XPStatsCard } from '@/components/StatsCards';
import { TaskActionSheet } from '@/components/TaskActionSheet';
import { TaskCard } from '@/components/TaskCard';
import { TodayAmbient } from '@/components/TodayAmbient';
import { TodayHeader } from '@/components/TodayHeader';
import { XPCoinFloat } from '@/components/XPCoinFloat';
import { useCharacter } from '@/lib/api/character';
import { todayDateKey } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { useTrackedReward } from '@/lib/api/rewards';
import { useLoadedSettings } from '@/lib/settings';
import { TourModule } from '@/components/tour/TourModule';
import { TourTarget } from '@/components/tour/TourTarget';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { remeasureActiveTourTarget } from '@/lib/tour/targets';
import { buildM1Steps, M1_EVENTS } from '@/lib/tour/m1Steps';
import { buildM2Steps, M2_EVENTS } from '@/lib/tour/m2Steps';
import { buildM3Steps } from '@/lib/tour/m3Steps';
import { buildM4Steps } from '@/lib/tour/m4Steps';
import { buildM5Steps } from '@/lib/tour/m5Steps';
import { buildM6Steps } from '@/lib/tour/m6Steps';
import {
  useActiveTourStep,
  useActiveTourStepStore,
  useIsCurrentTourModule,
  useTourStore,
} from '@/lib/tour/store';
import {
  useActiveTasks,
  useCompleteTask,
  useHomeBuckets,
  useSkipTaskToday,
  useUndoCompletion,
  useUnskipTaskToday,
} from '@/lib/api/tasks';
import { useQuests } from '@/lib/api/quests';
import type { TaskSub, TaskWithSubs } from '@/lib/db/types';
import { isDueOn } from '@/lib/recurrence';
import { formatHeroDate } from '@/lib/time';
import { compareOneShotsByFreshness, isInTrophyWindow } from '@/lib/trophy';
import { levelProgress, rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';

interface FloatItem {
  id: number;
  xp: number;
  coins: number;
}

/** AsyncStorage day-stamp — "day-cleared celebration already fired today".
 *  Same pattern as MoodCheckinPrompt's `@perceva/mood_prompt_shown`. */
const DAY_CLEARED_KEY = '@perceva/day_cleared';

interface DayClearedStats {
  done: number;
  skipped: number;
  xp: number;
}

/**
 * Practices home — V3 "Today Hub" layout.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  ambient (violet halo + Topo Iris glyph)     │  absolute, z 0
 *   │                                              │
 *   │  SUN · MAY 24 · DECO      [📅] [⚔] [⚙]      │
 *   │                                              │
 *   │  Sunday, May 24                  [ring 6]    │
 *   │                                              │
 *   │  XP card  ──────  290/500   LV 3             │
 *   │  Reward card  ──  🎯 ...  61%   610          │
 *   │                                              │
 *   │  [⚔ Sem açúcar 1/3] [+ Browse]               │
 *   │                                              │
 *   │  HOJE — schedule-driven single list          │
 *   │  ┌── TaskCard list (gradient + sub tile) ─┐ │
 *   │  │ 🧘 Meditar 10 min       [✓]            │ │
 *   │  └────────────────────────────────────────┘ │
 *   │  PONTUAIS — one-shots (secondary header)     │
 *   └──────────────────────────────────────────────┘
 *
 * Three principles preserved from the user's brief:
 *   1. XP and tracked-reward bars stay visually independent — two
 *      separate cards, not one combined stats card.
 *   2. The summary line ("1 task to close the day") is gone — the
 *      ring is sufficient.
 *   3. Quest cards collapsed into discrete gold pill chips.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useT();
  const settings = useLoadedSettings();
  const character = useCharacter();
  const buckets = useHomeBuckets(settings.weekStart);
  const allActiveTasks = useActiveTasks();
  const trackedReward = useTrackedReward();
  const quests = useQuests();
  const completeTask = useCompleteTask();
  const skipTask = useSkipTaskToday();
  const unskipTask = useUnskipTaskToday();
  const undoCompletion = useUndoCompletion();

  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [actionTask, setActionTask] = useState<TaskWithSubs | null>(null);
  const [sheetTask, setSheetTask] = useState<TaskWithSubs | null>(null);
  const navClearance = useBottomNavClearance();
  // While a bottom-positioned tour tooltip is visible, the Home scroll
  // needs extra room so the user can scroll content above the overlay
  // — but only just enough that the relevant section (e.g. M1 step 5
  // "Concluídas hoje" drawer) settles in the open space JUST above
  // the tooltip card. 160px ≈ card height minus the navbar already
  // baked into navClearance; matches the visible gap users expected
  // when testing M1 step 5.
  const activeTourStep = useActiveTourStep();
  // M2 step 1 spotlights the "Gerenciar práticas" button — the very last
  // row of the scroll. It needs more bottom room than the M1 drawer
  // (which is mid-list) so the button clears the full tooltip card
  // height once we scroll to the end.
  // Floor at the historical constants, but grow with the REAL measured
  // card height (reported by TourStep on layout) so restyles that make
  // the card taller can't silently eat the gap the target settles into.
  const tourCardHeight = useActiveTourStepStore((s) => s.cardHeight);
  const tourBottomBump =
    activeTourStep?.position === 'bottom'
      ? Math.max(
          activeTourStep.module === 'M2' ? 245 : 160,
          (tourCardHeight ?? 0) + 24,
        )
      : 0;
  const bottomClearance = navClearance + tourBottomBump;
  const isM1Current = useIsCurrentTourModule('M1');
  // M1 step 5 targets the "Concluídas hoje" drawer at the very end of
  // the scroll — track the step index so the auto-scroll effect below
  // can bring it into view (mirrors the M4/M5 per-step pattern).
  const m1StepIndex = useTourStore((s) => s.stepIndices.M1 ?? 0);
  const isM2Current = useIsCurrentTourModule('M2');
  const isM3Current = useIsCurrentTourModule('M3');
  const isM4Current = useIsCurrentTourModule('M4');
  const isM5Current = useIsCurrentTourModule('M5');
  const isM6Current = useIsCurrentTourModule('M6');

  // M6 completes (or is skipped) → the always-runs Wrap-up. Guard on the
  // wrap module still being pending so an isolated M6 replay (which marks
  // wrap completed) just returns Home instead of replaying the closer.
  const finishM6 = () => {
    const wrapPending =
      (useTourStore.getState().modules.wrap?.status ?? 'pending') === 'pending';
    if (wrapPending) router.push('/tour/wrap');
    else router.navigate('/(tabs)');
  };

  // Tour auto-scroll on Home:
  //   - M2 step 1 targets the bottom-most "Gerenciar práticas" button →
  //     scroll to the END so it settles in the gap above the tooltip.
  //   - M3 step 1 targets the quest chips strip near the TOP → scroll to
  //     the top so the strip is in view (the user may be scrolled down
  //     after finishing M2 on the create form).
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    // M1 step 5 (index 4) points at the "Concluídas hoje" drawer at the
    // very end of the scroll. Without auto-scroll the drawer toggle sits
    // BEHIND the bottom-anchored tooltip card and can't be tapped —
    // scrolling to the end settles it in the tourBottomBump gap just
    // above the card (tester-reported bug).
    if (activeTourStep?.module === 'M1' && m1StepIndex === 4) {
      const id = setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: true }),
        120,
      );
      return () => clearTimeout(id);
    }
    if (activeTourStep?.module === 'M2') {
      const id = setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: true }),
        120,
      );
      return () => clearTimeout(id);
    }
    if (activeTourStep?.module === 'M3') {
      const id = setTimeout(
        () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
        120,
      );
      return () => clearTimeout(id);
    }
  }, [activeTourStep?.module, m1StepIndex]);

  // ── Mutation handlers ─────────────────────────────────────────────────
  const fireCompletion = (task: TaskWithSubs, subs: TaskSub[]) => {
    if (completeTask.isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const reward = rewardForTaskSubs(subs);
    const fid = Date.now();
    setFloats((prev) => [
      ...prev,
      { id: fid, xp: reward.total.xp, coins: reward.total.coins },
    ]);

    completeTask.mutate(
      { task, subs },
      {
        onSuccess: () => {
          emitTourEvent(M1_EVENTS.TASK_COMPLETED);
        },
        onError: (err) => {
          const e = err as { message?: string; code?: string; details?: string };
          console.error('[complete_task] failed', e);
          Alert.alert(
            t('home.actionErrors.complete'),
            [e.message, e.code, e.details].filter(Boolean).join('\n') ||
              t('home.actionErrors.unknown'),
          );
        },
      },
    );
  };

  const handleQuickComplete = (task: TaskWithSubs) => {
    fireCompletion(task, task.subs);
  };

  const handleLongPress = (task: TaskWithSubs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActionTask(task);
    emitTourEvent(M1_EVENTS.TASK_LONG_PRESSED);
  };

  const handleSheetConfirm = (subs: TaskSub[]) => {
    if (!sheetTask) return;
    const task = sheetTask;
    setSheetTask(null);
    fireCompletion(task, subs);
  };

  const handleActionAdjust = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    setSheetTask(task);
  };

  const handleActionSkip = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    skipTask.mutate(
      { taskId: task.id },
      {
        onError: (err) => {
          const e = err as { message?: string };
          Alert.alert(
            t('home.actionErrors.skip'),
            e.message ?? t('home.actionErrors.unknown'),
          );
        },
      },
    );
  };

  const handleSwipeSkip = (task: TaskWithSubs) => {
    skipTask.mutate(
      { taskId: task.id },
      {
        onError: (err) => {
          const e = err as { message?: string };
          Alert.alert(
            t('home.actionErrors.skip'),
            e.message ?? t('home.actionErrors.unknown'),
          );
        },
      },
    );
  };

  const handleActionEdit = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    router.push({ pathname: '/task-form', params: { id: task.id } });
  };

  const handleUndo = (completionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    undoCompletion.mutate(completionId, {
      onError: (err) => {
        const e = err as { message?: string };
        Alert.alert(
          t('home.actionErrors.undo'),
          e.message ?? t('home.actionErrors.unknown'),
        );
      },
    });
  };

  const handleUnskip = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    unskipTask.mutate(
      { taskId },
      {
        onError: (err) => {
          const e = err as { message?: string };
          Alert.alert(
            t('home.actionErrors.unskip'),
            e.message ?? t('home.actionErrors.unknown'),
          );
        },
      },
    );
  };

  const isLoading = character.isLoading || buckets.isLoading;
  const hasError = character.error || buckets.error;

  const handleRefresh = async () => {
    await Promise.all([
      character.refetch(),
      buckets.refetch(),
      allActiveTasks.refetch(),
      // QuestChipsStrip renders right below and shares this query key —
      // without this, pulling to refresh visibly updated the task buckets
      // while the quest chips above them kept a stale count.
      quests.refetch(),
    ]);
  };
  const isRefreshing =
    character.isRefetching ||
    buckets.isRefetching ||
    allActiveTasks.isRefetching ||
    quests.isRefetching;

  const data = buckets.data;

  // ── "Hoje" model lists ────────────────────────────────────────────────
  // ONE schedule-driven today list (buckets.today) + the one-shots. The
  // query layer already excludes acted-today weekly/monthly promotions;
  // filterActedToday additionally drops multi-target dailies after their
  // FIRST completion of the day (extras happen via the completed drawer).
  const lists = useMemo(() => {
    if (!data) {
      return { today: [] as TaskWithSubs[], oneshot: [] as TaskWithSubs[] };
    }
    const completedTodayIds = new Set(
      data.todayActivity.completed.map((c) => c.task.id),
    );
    const skippedTodayIds = new Set(
      data.todayActivity.skipped.map((t) => t.id),
    );
    const filterActedToday = (t: TaskWithSubs) =>
      !completedTodayIds.has(t.id) && !skippedTodayIds.has(t.id);

    const today = data.today.filter(filterActedToday);

    // One-shots are pre-filtered by useHomeBuckets to skip
    // completed-today / skipped-today. Sort trophies (recently-
    // completed one-shots that linger as "marcos") to the bottom.
    const oneshot = [...data.oneTime].sort((a, b) =>
      compareOneShotsByFreshness(a, b),
    );

    return { today, oneshot };
  }, [data]);

  // ── Completion drawers ────────────────────────────────────────────────
  // ONE drawer with everything completed today (dailies, weeklies,
  // monthlies AND one-shots) — the per-tab week/one-shot drawers left
  // with the bucket tabs.
  const completedTodayItems = useMemo<CompletedItem[]>(
    () =>
      (data?.todayActivity.completed ?? []).map((c) => ({
        task: c.task,
        completionId: c.latestCompletionId,
      })),
    [data?.todayActivity.completed],
  );

  const skippedTodayItems = useMemo<CompletedItem[]>(
    () =>
      (data?.todayActivity.skipped ?? []).map((task) => ({ task })),
    [data?.todayActivity.skipped],
  );

  // ── Ring math + headline ──────────────────────────────────────────────
  // The ring tracks the day's recurring contract: done = recurring items
  // that were DUE today and got acted on (completed or skipped); total =
  // done + whatever is still waiting in the Hoje list. One-shots never
  // count — they would permanently block "day cleared".
  const ringDone = useMemo(() => {
    if (!data) return 0;
    const now = new Date();
    const dow = now.getDay();
    const isLastDayOfWeek =
      settings.weekStart === 'sunday' ? dow === 6 : dow === 0;
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    const isLastDayOfMonth = nextDay.getMonth() !== now.getMonth();

    // Mirrors the fetchHomeBuckets promotion rules: dailies and
    // unscheduled recurring are due every day; scheduled recurring are
    // due on their scheduled day plus the last-day-of-period catch-up.
    const wasDueToday = (task: TaskWithSubs): boolean => {
      const rec = task.recurrence;
      if (rec.type === 'one_shot') return false;
      if (rec.type === 'daily') return true;
      if (rec.type === 'weekly') {
        if (rec.days === undefined) return true;
        return isDueOn(rec, now) || isLastDayOfWeek;
      }
      if (typeof rec.day !== 'number') return true;
      return isDueOn(rec, now) || isLastDayOfMonth;
    };

    return (
      data.todayActivity.completed.filter((c) => wasDueToday(c.task)).length +
      data.todayActivity.skipped.filter(wasDueToday).length
    );
  }, [data, settings.weekStart]);
  const ringTotal = ringDone + lists.today.length;

  // ── Day-cleared celebration ───────────────────────────────────────────
  // Fires once per day when the remaining "Hoje" list reaches 0 through
  // user action (complete or skip). Guards:
  //   - buckets loaded (no false fire on the transient empty pre-fetch)
  //   - ringDone > 0 (an empty schedule never celebrates)
  //   - the list was seen >0 this session (a day that LOADS empty stays
  //     quiet). A latch ref instead of a strict >0→0 transition check:
  //     useCompleteTask's optimistic update empties `today` while
  //     todayActivity (→ ringDone) is still stale, so the transition
  //     frame can fail the ringDone guard and only the refetch frame —
  //     where remaining is ALREADY 0 — has the real numbers.
  //   - once-per-day AsyncStorage stamp, written BEFORE showing, so an
  //     undo + re-complete while (or after) the modal is up can't re-fire
  //   - no active tour step (tour owns the overlay layer)
  const [dayClearedStats, setDayClearedStats] =
    useState<DayClearedStats | null>(null);
  const sawPendingTodayRef = useRef(false);
  const dayClearedFiringRef = useRef(false);
  useEffect(() => {
    if (!buckets.isSuccess || !data) return;
    const remaining = lists.today.length;
    if (remaining > 0) {
      sawPendingTodayRef.current = true;
      return;
    }
    if (!sawPendingTodayRef.current) return;
    if (ringDone <= 0) return;
    if (activeTourStep) return;

    // No cleanup cancellation: the stamp is written BEFORE showing, so
    // aborting between the two (e.g. a refetch re-running the effect)
    // would burn the day without the celebration. The ref just prevents
    // two overlapping runs from double-firing the haptic.
    if (dayClearedFiringRef.current) return;
    dayClearedFiringRef.current = true;
    (async () => {
      try {
        const stamped = await AsyncStorage.getItem(DAY_CLEARED_KEY);
        if (stamped === todayDateKey()) return;
        // Stamp first — never twice a day, even if undo resurrects tasks
        // while the modal is up.
        await AsyncStorage.setItem(DAY_CLEARED_KEY, todayDateKey());
        const completed = data.todayActivity.completed;
        setDayClearedStats({
          done: completed.length,
          skipped: data.todayActivity.skipped.length,
          xp: completed.reduce((sum, c) => sum + c.totalXp, 0),
        });
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      } finally {
        dayClearedFiringRef.current = false;
      }
    })();
  }, [buckets.isSuccess, data, lists.today.length, ringDone, activeTourStep]);

  const hero = formatHeroDate();
  const charXp = character.data?.character.total_xp ?? 0;
  const lp = levelProgress(charXp);

  const activeQuestCount = (quests.data ?? []).filter(
    (q) => q.quest.status === 'active',
  ).length;

  // First rendered card overall carries the M1 tour anchor — normally
  // the first Hoje item, falling back to the first one-shot when the
  // Hoje list is empty.
  const renderTaskCard = (task: TaskWithSubs, isTourAnchor: boolean) => {
    const card = (
      <TaskCard
        task={task}
        dimmed={isInTrophyWindow(task)}
        onComplete={() => handleQuickComplete(task)}
        onLongPress={() => handleLongPress(task)}
        onSkip={() => handleSwipeSkip(task)}
        onSwipeComplete={() => setSheetTask(task)}
        onEdit={() => {
          emitTourEvent(M1_EVENTS.TASK_TAPPED);
          router.push({ pathname: '/task-form', params: { id: task.id } });
        }}
      />
    );
    // M1 steps 1/3/4 spotlight the first card — wrapping only the anchor
    // keeps the gap flow identical for the rest.
    return isTourAnchor ? (
      <TourTarget key={task.id} id="home.task-first" radius={20}>
        {card}
      </TourTarget>
    ) : (
      <Fragment key={task.id}>{card}</Fragment>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TodayAmbient />

      <ScrollView
        ref={scrollRef}
        // Manual scrolls move spotlighted targets — refresh the measured
        // rect once the scroll settles (no-op outside the tour).
        onScrollEndDrag={remeasureActiveTourTarget}
        onMomentumScrollEnd={remeasureActiveTourTarget}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.brand.violet2}
            colors={[tokens.brand.violet2]}
          />
        }
      >
        <TodayHeader
          displayName={character.data?.profile.display_name ?? t('home.defaultName')}
          weekdayLabel={hero.weekday}
          monthDayLabel={hero.monthDay}
          ringDone={ringDone}
          ringTotal={ringTotal}
          hasActiveQuests={activeQuestCount > 0}
          onHistoryPress={() => router.push('/history')}
          onQuestsPress={() => router.push('/quests')}
          onManagePress={() => router.push('/tasks')}
        />

        <XPStatsCard
          level={lp.level}
          xpInLevel={lp.xpInLevel}
          xpNeededForLevel={lp.xpNeededForLevel}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/character',
              params: { pillar: 'praticada' },
            })
          }
        />

        {trackedReward && (
          <RewardStatsCard
            rewardName={trackedReward.name}
            iconName={trackedReward.icon}
            coins={trackedReward.currentCoins}
            totalCoins={trackedReward.totalCoins}
            onPress={() => router.push('/(tabs)/rewards')}
          />
        )}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : hasError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={32} color={tokens.semantic.danger} />
            <Text style={styles.errorText}>{t('home.error')}</Text>
          </View>
        ) : (
          <>
            {/* Order under the hero (XP / Reward cards above): quests
                first, then the "Hoje" list — the day's schedule-driven
                contract — then the one-shots as a secondary section. */}
            <TourTarget id="home.quests" radius={18}>
              <QuestChipsStrip />
            </TourTarget>

            <View style={styles.taskList}>
              <Text style={styles.sectionHeader}>
                {t('home.sections.today')}
              </Text>
              {lists.today.length === 0 ? (
                <Text style={styles.tabEmpty}>
                  {t('home.bucketTabs.emptyToday')}
                </Text>
              ) : (
                lists.today.map((task, idx) => renderTaskCard(task, idx === 0))
              )}

              {lists.oneshot.length > 0 && (
                <>
                  <Text
                    style={[styles.sectionHeader, styles.sectionHeaderSecondary]}
                  >
                    {t('home.sections.oneshot')}
                  </Text>
                  {lists.oneshot.map((task, idx) =>
                    renderTaskCard(task, lists.today.length === 0 && idx === 0),
                  )}
                </>
              )}

              <TourTarget id="home.completed" radius={18}>
                <CompletedBucket
                  items={completedTodayItems}
                  title={t('home.completedBucket.today')}
                  onUndo={handleUndo}
                  onExtra={(task) => handleQuickComplete(task)}
                  onToggle={(open) => {
                    if (open) emitTourEvent(M1_EVENTS.DRAWER_EXPANDED);
                  }}
                />
              </TourTarget>
              <CompletedBucket
                items={skippedTodayItems}
                title={t('home.skippedBucket.today')}
                variant="skipped"
                onUnskip={handleUnskip}
              />
            </View>

            {/* Journal strip after the day's tasks — finish the tasks,
                close the day. One tap logs; press opens the full check-in. */}
            <MoodHubStrip />

            <View style={styles.bottomActions}>
              <Pressable
                onPress={() => router.push('/history')}
                style={({ pressed }) => [
                  styles.bottomBtn,
                  pressed && styles.bottomBtnPressed,
                ]}
                accessibilityRole="button"
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={tokens.text.mid}
                />
                <Text style={styles.bottomBtnLabel}>
                  {t('tabs.history')}
                </Text>
              </Pressable>
              <TourTarget id="home.manage" style={{ flex: 1 }} radius={16}>
                <Pressable
                  onPress={() => {
                    emitTourEvent(M2_EVENTS.TASKS_NAVIGATED);
                    router.push('/tasks');
                  }}
                  style={({ pressed }) => [
                    styles.bottomBtn,
                    // Inside the target wrapper (which carries flex: 1),
                    // the button sizes from content — flex: 1 here would
                    // collapse to zero height in the auto-height wrapper.
                    { flex: 0 },
                    pressed && styles.bottomBtnPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="settings-outline"
                    size={16}
                    color={tokens.text.mid}
                  />
                  <Text style={styles.bottomBtnLabel}>
                    {t('home.manageCta')}
                  </Text>
                </Pressable>
              </TourTarget>
            </View>
          </>
        )}
      </ScrollView>

      {floats.map((f) => (
        <XPCoinFloat
          key={f.id}
          xp={f.xp}
          coins={f.coins}
          onDone={() => setFloats((prev) => prev.filter((x) => x.id !== f.id))}
        />
      ))}

      <CompleteTaskSheet
        visible={sheetTask !== null}
        task={sheetTask}
        onCancel={() => setSheetTask(null)}
        onConfirm={handleSheetConfirm}
      />

      <TaskActionSheet
        visible={actionTask !== null}
        taskTitle={actionTask?.title ?? ''}
        onCancel={() => setActionTask(null)}
        onAdjustStars={handleActionAdjust}
        onSkipToday={handleActionSkip}
        onEdit={handleActionEdit}
      />

      <DayClearedCelebration
        visible={dayClearedStats !== null}
        doneCount={dayClearedStats?.done ?? 0}
        skippedCount={dayClearedStats?.skipped ?? 0}
        xpToday={dayClearedStats?.xp ?? 0}
        onClose={() => setDayClearedStats(null)}
      />

      <MoodCheckinPrompt enabled={!activeTourStep} />

      {/* Post-login tour — M1 (Tasks). Only renders when the user has
         tasks visible behind the spotlight and M1 is the current
         (first-unfinished) module — keeps later modules from leaking
         their tooltips onto Home before their turn. */}
      <TourModule
        module="M1"
        steps={buildM1Steps(t)}
        enabled={isM1Current && (allActiveTasks.data?.length ?? 0) > 0}
      />

      {/* M2 step 1 lives here (manage-tasks button). Tapping the real
         button fires TASKS_NAVIGATED + navigates; if the user instead
         taps Próximo / "Pular este passo" on the tooltip, walk them to
         /tasks ourselves so step 2 has its surface. */}
      <TourModule
        module="M2"
        steps={buildM2Steps(t)}
        enabled={isM2Current}
        onAdvanceToNextScreen={() => router.push('/tasks')}
      />

      {/* M3 step 1 lives here (quest chips strip). Tapping "+ Missões"
         fires QUESTS_NAVIGATED + navigates; Próximo / skip walks the
         user to /quests so step 2 has its surface. */}
      <TourModule
        module="M3"
        steps={buildM3Steps(t)}
        enabled={isM3Current}
        onAdvanceToNextScreen={() => router.push('/quests')}
      />

      {/* M4 step 1 lives here (Rewards bottom-nav tab). Switching to the
         Rewards tab fires REWARDS_NAVIGATED from that screen; Próximo /
         skip switches there ourselves so steps 2-3 have their surface. */}
      <TourModule
        module="M4"
        steps={buildM4Steps(t)}
        enabled={isM4Current}
        onAdvanceToNextScreen={() => router.navigate('/(tabs)/rewards')}
      />

      {/* M5 step 1 lives here (Eu/Hero bottom-nav tab). Switching to the
         Hero tab fires ME_NAVIGATED from that screen; Próximo / skip
         switches there ourselves so steps 2-5 have their surface. */}
      <TourModule
        module="M5"
        steps={buildM5Steps(t)}
        enabled={isM5Current}
        onAdvanceToNextScreen={() => router.navigate('/(tabs)/character')}
      />

      {/* M6 step 1 lives here (Learn bottom-nav tab). Switching to the
         Learn tab fires LEARN_NAVIGATED from that screen. Skipping at
         this step ends M6 → Wrap-up (finishM6). */}
      <TourModule
        module="M6"
        steps={buildM6Steps(t)}
        enabled={isM6Current}
        onAdvanceToNextScreen={() => router.navigate('/(tabs)/learning')}
        onComplete={finishM6}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  scroll: { flex: 1 },
  scrollContent: {},
  loadingBox: {
    paddingVertical: tokens.space[10],
    alignItems: 'center',
  },
  errorBox: {
    paddingVertical: tokens.space[8],
    alignItems: 'center',
    gap: tokens.space[3],
  },
  errorText: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[5],
  },
  taskList: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    gap: tokens.space[2],
  },
  // "Hoje" / "Pontuais" section headers replacing the old bucket tabs.
  sectionHeader: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
    letterSpacing: 0.4,
    paddingTop: tokens.space[1],
  },
  // One-shots read as a lighter, secondary block under the day's list.
  sectionHeaderSecondary: {
    fontSize: 13,
    color: tokens.text.mid,
    marginTop: tokens.space[3],
  },
  tabEmpty: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    fontStyle: 'italic',
    paddingVertical: tokens.space[4],
    textAlign: 'center',
  },
  // Bottom row at the end of the home scroll — Calendar (history) +
  // Manage tasks side by side. The Calendar is here so the user can
  // reach History without diving for the tiny top-right icon.
  bottomActions: {
    flexDirection: 'row',
    gap: tokens.space[2],
    paddingTop: tokens.space[3],
    paddingHorizontal: tokens.space[4],
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: tokens.space[3] + 2,
    paddingHorizontal: tokens.space[3],
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
  },
  bottomBtnPressed: {
    opacity: 0.7,
    borderColor: 'rgba(123, 92, 255, 0.3)',
    backgroundColor: tokens.bg.surface,
  },
  bottomBtnLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.mid,
  },
});
