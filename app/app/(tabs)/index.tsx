import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
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
import { DaySeal } from '@/components/DaySeal';
import { MoodCheckinPrompt } from '@/components/MoodCheckinPrompt';
import { MoodDayDetail } from '@/components/mood/MoodDayDetail';
import { MoodHubStrip } from '@/components/mood/MoodHubStrip';
import {
  CompletedBucket,
  completionsToItems,
  type CompletedItem,
} from '@/components/CompletedBucket';
import { NotificationOptInCard } from '@/components/NotificationOptInCard';
import { QuestChipsStrip } from '@/components/QuestChipsStrip';
import { StoreUpdateCard } from '@/components/StoreUpdateCard';
import { TaskActionSheet } from '@/components/TaskActionSheet';
import { TaskCard } from '@/components/TaskCard';
import { WeekStrip } from '@/components/WeekStrip';
import { TASKS_FAB_CLEARANCE, TasksFabStack } from '@/components/TasksFabStack';
import { TodayAmbient } from '@/components/TodayAmbient';
import { TodayHeader } from '@/components/TodayHeader';
import { XPCoinFloat } from '@/components/XPCoinFloat';
import { useCharacter } from '@/lib/api/character';
import {
  dateKeyFromLocal,
  taskFromCompletionSnapshot,
  useDayDetail,
} from '@/lib/api/history';
import { todayDateKey, useTodayMood } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { TourModule } from '@/components/tour/TourModule';
import { TourTarget } from '@/components/tour/TourTarget';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { remeasureActiveTourTarget } from '@/lib/tour/targets';
import {
  buildM1Steps,
  M1_EVENTS,
  M1_TARGETS,
  useM1PlanStore,
  type M1Options,
} from '@/lib/tour/m1Steps';
import { buildM2Steps, M2_EVENTS } from '@/lib/tour/m2Steps';
import { buildM4Steps } from '@/lib/tour/m4Steps';
import { buildM5Steps } from '@/lib/tour/m5Steps';
import { buildM6Steps } from '@/lib/tour/m6Steps';
import {
  getCurrentTourModule,
  isWrapPending,
  useActiveTourStep,
  useActiveTourStepStore,
  useIsCurrentTourModule,
  useTourFinished,
  useTourStore,
} from '@/lib/tour/store';
import {
  useActiveTasks,
  useCompleteTask,
  useHomeBuckets,
  useSkipTaskToday,
  useSkipTasksBulk,
  useUndoCompletion,
  useUnskipTaskToday,
} from '@/lib/api/tasks';
import { confirmAction } from '@/lib/util/confirm';
import { useQuests } from '@/lib/api/quests';
import { useModuleEnabled } from '@/lib/modules';
import type { CoinMultiplier, TaskSub, TaskWithSubs } from '@/lib/db/types';
import { isDueOn } from '@/lib/recurrence';
import { formatHeroDate } from '@/lib/time';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { rewardForTaskSubs } from '@/lib/xp';
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
  /** Set only for a RETRO close (the user arrowed back and finished a past
   *  day). Prepends the date to the stats row and switches the body copy. */
  dateLabel?: string;
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
 *   │                                              │
 *   │  [⚔ Sem açúcar 1/3] [+ Browse]               │
 *   │                                              │
 *   │  HOJE — schedule-driven single list          │
 *   │  ┌── TaskCard list (gradient + sub tile) ─┐ │
 *   │  │ 🧘 Meditar 10 min       [✓]            │ │
 *   │  └────────────────────────────────────────┘ │
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
  // Same query key as MoodHubStrip — read here only to know whether the
  // mood card is on screen, which decides M1's mood step.
  const todayMood = useTodayMood();
  // Home only holds this query for pull-to-refresh — QuestChipsStrip shares
  // the key. With both quest modules off there is nothing to keep fresh, so
  // the fetch is gated too.
  const missoesOn = useModuleEnabled('missoes');
  const metasOn = useModuleEnabled('metas');
  const questsEnabled = missoesOn || metasOn;
  const quests = useQuests({ enabled: questsEnabled });
  const completeTask = useCompleteTask();
  const skipTask = useSkipTaskToday();
  const skipTasksBulk = useSkipTasksBulk();
  const unskipTask = useUnskipTaskToday();
  const undoCompletion = useUndoCompletion();

  // Selected day for the whole screen — defaults to today (local midnight).
  // The header's prev/next arrows move it; the day's tasks, XP hero and
  // completed drawer all follow. Past days are the retro-logging surface
  // ("I always forget to mark something yesterday").
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const todayKey = dateKeyFromLocal(new Date());
  const selectedKey = dateKeyFromLocal(selectedDate);
  const isToday = selectedKey === todayKey;
  // The selected day's detail — completions (with undo), still-open tasks
  // for retro logging, skips, and the day's XP total. Drives the past-day
  // view AND the XP hero for every day (today included).
  const dayDetail = useDayDetail(selectedDate, settings.weekStart);

  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [actionTask, setActionTask] = useState<TaskWithSubs | null>(null);
  const [sheetTask, setSheetTask] = useState<TaskWithSubs | null>(null);
  // Optimistic-hide set for RETRO actions on a past day (mirrors
  // all-practices' pendingDone). Past-day lists come from dayDetail, which
  // has no optimistic layer, so without this the card sits in place for a
  // full round-trip — a window where a second tap logs a DUPLICATE
  // completion, and where a swipe-skip reads as "nothing happened".
  // Holds ids hidden by BOTH retro completions and retro skips; the prune
  // effect clears an id once the server confirms it either way.
  const [retroHidden, setRetroHidden] = useState<Set<string>>(new Set());
  const hideRetro = (taskId: string) =>
    setRetroHidden((prev) => new Set(prev).add(taskId));
  const unhideRetro = (taskId: string) =>
    setRetroHidden((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  const navClearance = useBottomNavClearance();
  // Home is a tab screen: it stays MOUNTED (effects running) while
  // /all-practices or /history are pushed on top. Both act on the same day
  // and invalidate historyKeys, which would satisfy the celebration's guards
  // while the user is looking at another screen entirely.
  const isFocused = useIsFocused();
  // While a bottom-positioned tour tooltip is visible, the Home scroll
  // needs extra room so content can be lifted above the overlay — exactly
  // enough that the spotlighted element settles in the open space JUST
  // above the tooltip card (see the M1 auto-scroll below).
  const activeTourStep = useActiveTourStep();
  // Whole-tour gate for the mood prompt: `!activeTourStep` alone only
  // covers inline spotlight steps — during the full-screen intro / pack
  // routes there is no active step, and the prompt's Modal would pop OVER
  // the onboarding on first open.
  const tourFinished = useTourFinished();
  // Floor at the historical constant, but grow with the REAL measured card
  // height (reported by TourStep on layout) so restyles that make the card
  // taller can't silently eat the gap the target settles into.
  const tourCardHeight = useActiveTourStepStore((s) => s.cardHeight);
  const tourBottomBump =
    activeTourStep?.position === 'bottom'
      ? Math.max(160, (tourCardHeight ?? 0) + 24)
      : 0;
  // The scroll must end ABOVE the floating stack, or its last card (the mood
  // check-in) sits under the buttons. `max`, not sum: every bottom tooltip
  // gap (160+) already clears the 128px stack.
  const bottomClearance =
    navClearance + Math.max(tourBottomBump, TASKS_FAB_CLEARANCE);
  const isM1Current = useIsCurrentTourModule('M1');
  const m1StepIndex = useTourStore((s) => s.stepIndices.M1 ?? 0);
  const isM2Current = useIsCurrentTourModule('M2');
  const isM4Current = useIsCurrentTourModule('M4');
  const isM5Current = useIsCurrentTourModule('M5');
  const isM6Current = useIsCurrentTourModule('M6');

  // M6 completes (or is skipped) → the closing screen, unless it already
  // ran (an isolated M6 replay just returns Home instead of replaying it).
  const finishM6 = () => {
    if (isWrapPending()) router.push('/tour/wrap');
    else router.navigate('/(tabs)');
  };

  const scrollRef = useRef<ScrollView>(null);
  // Scroll geometry for the M1 auto-scroll — kept in refs, read only when a
  // step asks to be brought into view. Offsets are tracked at scroll END
  // (plus our own programmatic scrolls), never per frame.
  const contentTopRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const viewportHRef = useRef(0);
  const contentHRef = useRef(0);
  const firstCardRef = useRef<View>(null);
  const drawerRef = useRef<View>(null);
  const moodRef = useRef<View>(null);
  const handleScrollSettled = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
    // Manual scrolls move spotlighted targets — refresh the measured rect
    // (no-op outside the tour).
    remeasureActiveTourTarget();
  };

  // ── Mutation handlers ─────────────────────────────────────────────────
  const fireCompletion = (
    task: TaskWithSubs,
    subs: TaskSub[],
    coinMultiplier?: CoinMultiplier,
  ) => {
    if (completeTask.isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const reward = rewardForTaskSubs(subs, coinMultiplier ?? task.coin_multiplier);
    const fid = Date.now();
    setFloats((prev) => [
      ...prev,
      { id: fid, xp: reward.total.xp, coins: reward.total.coins },
    ]);

    completeTask.mutate(
      { task, subs, coinMultiplier },
      {
        onSuccess: () => {
          // Same tick as the emit, on purpose: M1 gains its "Feitas hoje"
          // step in the very render that advances off step 1 (see
          // useM1PlanStore).
          if (getCurrentTourModule() === 'M1') {
            useM1PlanStore.getState().noteCompletion();
          }
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

  // Complete for the currently-selected day. Today → live path (optimistic
  // + M1 tour event; M1 runs on today only). Past day → retro completion
  // filed under that local
  // date ("I forgot to mark it yesterday"); no optimistic removal (the day
  // view refetches on settle), but still float the XP for feedback.
  const completeForSelectedDay = (
    task: TaskWithSubs,
    subs: TaskSub[],
    coinMultiplier?: CoinMultiplier,
  ) => {
    if (isToday) {
      fireCompletion(task, subs, coinMultiplier);
      return;
    }
    if (completeTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const reward = rewardForTaskSubs(subs, coinMultiplier ?? task.coin_multiplier);
    const fid = Date.now();
    setFloats((prev) => [
      ...prev,
      { id: fid, xp: reward.total.xp, coins: reward.total.coins },
    ]);
    // File the completion at noon of the selected day so completed_at sits
    // squarely inside that local date; completedLocalDate is what the day
    // buckets / History key off.
    const at = new Date(selectedDate);
    at.setHours(12, 0, 0, 0);
    // Optimistic hide — the past-day list comes from dayDetail (no
    // optimistic removal), so without this the card lingers until the
    // refetch lands, a window where a second tap logs a DUPLICATE
    // completion. Hide now; the prune effect drops it once the server
    // confirms; restore on error.
    hideRetro(task.id);
    actedOnDaysRef.current.add(selectedKey);
    completeTask.mutate(
      {
        task,
        subs,
        coinMultiplier,
        completedAt: at.toISOString(),
        completedLocalDate: selectedKey,
      },
      {
        onError: (err) => {
          unhideRetro(task.id);
          const e = err as { message?: string; code?: string; details?: string };
          console.error('[complete_task retro] failed', e);
          Alert.alert(
            t('home.actionErrors.complete'),
            [e.message, e.code, e.details].filter(Boolean).join('\n') ||
              t('home.actionErrors.unknown'),
          );
        },
      },
    );
  };

  // `subs` is supplied by the drawer's "+1", which repeats the stars of the
  // row it sits on ("do it again, same as this one"). Without it, undoing a
  // custom-starred rep and pressing "+1" would silently re-log the task's
  // DEFAULT stars — not a round-trip. The same goes for the coins: "+1"
  // repeats the row's coin choice; the plain check uses the practice's.
  const handleQuickComplete = (
    task: TaskWithSubs,
    subs?: TaskSub[],
    coinMultiplier?: CoinMultiplier,
  ) => {
    completeForSelectedDay(task, subs ?? task.subs, coinMultiplier);
  };

  const handleLongPress = (task: TaskWithSubs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActionTask(task);
    emitTourEvent(M1_EVENTS.TASK_LONG_PRESSED);
  };

  const handleSheetConfirm = (subs: TaskSub[], coinMultiplier: CoinMultiplier) => {
    if (!sheetTask) return;
    const task = sheetTask;
    setSheetTask(null);
    completeForSelectedDay(task, subs, coinMultiplier);
  };

  const handleActionAdjust = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    setSheetTask(task);
  };

  // Shared by the swipe and the long-press sheet. On a past day the skip is
  // dated (useSkipTaskToday deliberately skips its optimistic pass for those,
  // since today's buckets must not change) — so the hide has to happen here
  // or the card sits still until the refetch and the swipe reads as broken.
  const skipForSelectedDay = (task: TaskWithSubs) => {
    const dated = !isToday;
    const dayKey = selectedKey;
    actedOnDaysRef.current.add(dayKey);
    if (dated) hideRetro(task.id);
    // mutateAsync, NOT mutate: all skips share one mutation observer, and
    // firing a second skip before the first settles detaches the observer
    // from it — the first call's `onError` then never runs. On a past day
    // that would strand the id in retroHidden (the server has no skip row,
    // so the prune never clears it) and the practice would stay invisible
    // for the rest of the session, with no error shown. The promise from
    // mutateAsync rejects regardless of observer removal.
    skipTask
      .mutateAsync({ taskId: task.id, date: dated ? dayKey : undefined })
      .catch((err: unknown) => {
        if (dated) unhideRetro(task.id);
        const e = err as { message?: string };
        Alert.alert(
          t('home.actionErrors.skip'),
          e.message ?? t('home.actionErrors.unknown'),
        );
      });
  };

  const handleActionSkip = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    skipForSelectedDay(task);
  };

  // TaskCard.fireSkip already fires a Medium haptic on the swipe.
  const handleSwipeSkip = (task: TaskWithSubs) => skipForSelectedDay(task);

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
    // Drop any optimistic hide so the card returns to the open list in the
    // same frame instead of waiting for the refetch.
    unhideRetro(taskId);
    unskipTask.mutate(
      { taskId, date: isToday ? undefined : selectedKey },
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

  // ── Day navigation ────────────────────────────────────────────────────
  const stepDay = (deltaDays: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaDays);
      d.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Never navigate into the future — there's no contract to act on.
      if (d.getTime() > today.getTime()) return prev;
      return d;
    });
  };
  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  };

  // dayDetail is gated on EVERY day, not just past ones: the completed
  // drawer and the day's XP now read from it on today too, so without this
  // a cold load paints a finished-looking screen that says "Feitas hoje · 0"
  // with no XP and an untappable drawer while the query is still in flight.
  // Same reason it belongs in hasError — a failed dayDetail used to be
  // invisible on today.
  const isLoading =
    character.isLoading || buckets.isLoading || dayDetail.isLoading;
  const hasError = character.error || buckets.error || dayDetail.error;

  const handleRefresh = async () => {
    await Promise.all([
      character.refetch(),
      buckets.refetch(),
      allActiveTasks.refetch(),
      // The selected day's detail drives the past-day view + the XP hero.
      dayDetail.refetch(),
      // QuestChipsStrip renders right below and shares this query key —
      // without this, pulling to refresh visibly updated the task buckets
      // while the quest chips above them kept a stale count. refetch()
      // bypasses `enabled`, so it must be guarded by the module gate.
      ...(questsEnabled ? [quests.refetch()] : []),
    ]);
  };
  // Pull indicator is local state — the queries' isRefetching also flips on
  // every background refetch (mutations, app foreground), which would show
  // the spinner without a pull.
  const { refreshing: isRefreshing, onRefresh: onPullRefresh } =
    usePullToRefresh(handleRefresh);

  const data = buckets.data;

  // ── "Hoje" model lists ────────────────────────────────────────────────
  // ONE schedule-driven today list (buckets.today). The query layer
  // already excludes acted-today weekly/monthly promotions;
  // filterActedToday additionally drops multi-target dailies after their
  // FIRST completion of the day (extras happen via the completed drawer).
  const lists = useMemo(() => {
    if (!data) {
      return { today: [] as TaskWithSubs[] };
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
    return { today };
  }, [data]);

  const skippedTodayItems = useMemo<CompletedItem[]>(
    () =>
      (data?.todayActivity.skipped ?? []).map((task) => ({ task })),
    [data?.todayActivity.skipped],
  );

  // ── Selected-day view model ───────────────────────────────────────────
  // Unifies today (buckets) and any past day (dayDetail) into one shape the
  // render consumes. Today keeps its polished buckets-driven behavior
  // (ring, celebration, skip, "Fechar o dia"); past days are the read +
  // retro-log surface. The XP hero reads dayDetail.totalXp for EVERY day.
  const xpOfDay = dayDetail.data?.totalXp ?? 0;

  const tasksById = useMemo(
    () => new Map((allActiveTasks.data ?? []).map((tk) => [tk.id, tk])),
    [allActiveTasks.data],
  );

  // Past-day open list: daily + scheduled-on-that-day recurring.
  // dayDetail.openTasks already drops what was completed/skipped that day
  // (the schedule + completed + skipped rules all live in useDayDetail,
  // isOpenOnDay); all that is left here is the retro optimistic hide.
  const pastOpen = useMemo<TaskWithSubs[]>(() => {
    if (isToday || !dayDetail.data) return [];
    return dayDetail.data.openTasks.filter((task) => !retroHidden.has(task.id));
  }, [isToday, dayDetail.data, retroHidden]);

  // Every completion the day's XP hero counts must also appear here, so the
  // drawer and the hero never disagree. When the live task is gone from the
  // active list (archived, or deleted), rebuild a minimal row from the
  // completion snapshot instead of dropping it — undo stays wired via the
  // completionId; the "+1" pill is suppressed on those rows (see orphaned).
  // ── Completion drawer ─────────────────────────────────────────────────
  // ONE row per completion, on EVERY day — today included. useDayDetail
  // already runs for today (it feeds the XP hero), so sourcing the drawer
  // from it too costs nothing and buys three things: the exact per-rep XP
  // (the user can adjust stars, so reps of the same practice differ), an
  // undo button that removes precisely the rep shown next to it, and a
  // header total that can no longer disagree with the hero above it.
  const dayCompletedItems = useMemo<CompletedItem[]>(
    () =>
      completionsToItems(
        dayDetail.data?.completions ?? [],
        (id) => tasksById.get(id),
        taskFromCompletionSnapshot,
      ),
    [dayDetail.data, tasksById],
  );

  const pastSkippedItems = useMemo<CompletedItem[]>(() => {
    if (isToday || !dayDetail.data) return [];
    return dayDetail.data.skipped.map((task) => ({ task }));
  }, [isToday, dayDetail.data]);

  // What the render consumes, resolved by which day is selected.
  const dayOpen = isToday ? lists.today : pastOpen;
  const daySkippedItems = isToday ? skippedTodayItems : pastSkippedItems;

  // Reset the retro optimistic-hide set when the selected day changes — a
  // pending hide from one day must not carry over and hide the same task on
  // another day.
  useEffect(() => {
    setRetroHidden(new Set());
  }, [selectedKey]);

  // Prune the retro hide once the server reflects the action — dayDetail
  // then excludes the task from openTasks on its own, and dropping it here
  // is what lets an undo (or an unskip) bring the card back.
  //
  // Prune against completions ∪ skipped, not completions alone: a skipped
  // task never enters `completions`, so a completions-only prune would
  // strand its id forever and no unskip could restore the card.
  useEffect(() => {
    const settled = new Set<string>([
      ...(dayDetail.data?.completions ?? []).map((c) => c.taskId),
      ...(dayDetail.data?.skipped ?? []).map((t) => t.id),
    ]);
    setRetroHidden((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set([...prev].filter((id) => !settled.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [dayDetail.data]);

  // ── Ring math + headline ──────────────────────────────────────────────
  // The ring tracks the day's recurring contract: done = recurring items
  // that were DUE today and got acted on (completed or skipped); total =
  // done + whatever is still waiting in the Hoje list. One-shots never
  // count — they would permanently block "day cleared".
  const ringDone = useMemo(() => {
    if (!data) return 0;
    const now = new Date();

    // Mirrors the fetchHomeBuckets promotion rules: dailies and
    // unscheduled recurring are due every day; scheduled recurring are
    // due ONLY on their scheduled days (schedule = contract — no
    // last-day or missed-day catch-ups).
    const wasDueToday = (task: TaskWithSubs): boolean => {
      const rec = task.recurrence;
      if (rec.type === 'daily') return true;
      // Unscheduled recurring (no weekday / no day-of-month marked) no
      // longer promotes to Hoje (see fetchHomeBuckets), so it must not
      // count toward the day's contract either — otherwise completing one
      // from another surface inflates ringDone with no matching card and
      // misfires the day-cleared celebration. isDueOn returns false for
      // weekly/monthly with no schedule, so this stays in lockstep.
      return isDueOn(rec, now);
    };

    // Dedupe across the two lists: a task that was skipped AND later
    // completed the same day (skip on Home, quick-complete from /tasks)
    // counts once — otherwise the ring reads e.g. 3/3 where the day's
    // contract was 2.
    const completedIds = new Set(
      data.todayActivity.completed.map((c) => c.task.id),
    );
    return (
      data.todayActivity.completed.filter((c) => wasDueToday(c.task)).length +
      data.todayActivity.skipped.filter(
        (task) => !completedIds.has(task.id) && wasDueToday(task),
      ).length
    );
  }, [data]);

  // "Fechar o dia" — skip everything still waiting in the Hoje list in one
  // deliberate act (confirm first). Scoped to lists.today. The optimistic
  // bulk-skip empties the list
  // → the EXISTING day-cleared celebration fires (remaining → 0); because
  // the skipped tasks were due today, ringDone increments so the muted
  // all-skipped variant (not the gold fanfare) is what a zero-done clear
  // shows. No new celebration path.
  const handleClearDay = async () => {
    // dayOpen === lists.today when isToday, so this is unchanged on today
    // and correctly closes the SELECTED day when the user is browsing back.
    const ids = dayOpen.map((task) => task.id);
    if (ids.length === 0 || skipTasksBulk.isPending) return;
    const ok = await confirmAction(
      isToday
        ? t('home.clearDay.confirmTitle')
        : t('home.clearDay.confirmTitleDay', { date: hero.monthDay }),
      t(
        ids.length === 1
          ? 'home.clearDay.confirmBody.one'
          : 'home.clearDay.confirmBody.other',
        { count: ids.length },
      ),
      {
        okText: t('home.clearDay.confirmOk'),
        cancelText: t('common.cancel'),
      },
    );
    if (!ok) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // A dated bulk skip gets no optimistic pass in the mutation (it must not
    // touch today's buckets), so hide the cards here or they all freeze for
    // the whole round-trip.
    actedOnDaysRef.current.add(selectedKey);
    if (!isToday) ids.forEach(hideRetro);
    skipTasksBulk.mutate(
      { taskIds: ids, date: isToday ? undefined : selectedKey },
      {
        onError: (err) => {
          if (!isToday) ids.forEach(unhideRetro);
          const e = err as { message?: string };
          Alert.alert(
            t('home.actionErrors.skip'),
            e.message ?? t('home.actionErrors.unknown'),
          );
        },
      },
    );
  };

  // ── Day-cleared celebration ───────────────────────────────────────────
  // Fires once per day when the remaining "Hoje" list reaches 0 through
  // user action (complete or skip). Guards:
  //   - buckets loaded (no false fire on the transient empty pre-fetch)
  //   - ringDone > 0 (an empty schedule never celebrates)
  //   - the list was seen >0 this session (a day that LOADS empty stays
  //     quiet). A latch ref instead of a strict >0→0 transition check:
  //     useCompleteTask's optimistic update (prefix-matched over the
  //     [...pending, weekStart] cache keys) empties `today` for live
  //     single-target completes while todayActivity (→ ringDone) is
  //     still stale, so the transition frame can fail the ringDone
  //     guard and only the refetch frame — where remaining is ALREADY
  //     0 — has the real numbers. Multi-target and retro completes
  //     skip the optimistic path entirely and only ever empty `today`
  //     on the refetch frame.
  //   - once-per-day AsyncStorage stamp, written BEFORE showing, so an
  //     undo + re-complete while (or after) the modal is up can't re-fire
  //   - no active tour step (tour owns the overlay layer)
  const [dayClearedStats, setDayClearedStats] =
    useState<DayClearedStats | null>(null);
  // Days we've SEEN open work on this session. A Set, not a single slot: the
  // window between "list empties" and "modal fires" is a whole round-trip, so
  // a slot would be overwritten by any day the user arrows to meanwhile — and
  // the day they just closed could then never fire, since on return it LOADS
  // empty and never re-latches.
  const sawOpenDaysRef = useRef<Set<string>>(new Set());
  // Days the user ACTED on from this screen (completed / skipped / bulk
  // closed). "The list went to zero" is NOT proof the user closed the day:
  // archiving a practice, or editing its recurrence off that weekday, empties
  // it just as well — and would otherwise pop a gold "Dia fechado!" with
  // done=0, skipped=0 for a day nothing happened on.
  const actedOnDaysRef = useRef<Set<string>>(new Set());
  const dayClearedFiringRef = useRef(false);

  // Declared ABOVE the effect on purpose: a dependency array is evaluated
  // eagerly during render, so referencing `hero` from one while it is
  // declared further down would throw a TDZ ReferenceError on every render.
  const hero = formatHeroDate(selectedDate);

  useEffect(() => {
    // Today reads the buckets (ring + todayActivity); any other day reads
    // dayDetail. Both must be settled before we trust the numbers.
    if (isToday) {
      if (!buckets.isSuccess || !data) return;
    } else {
      // The belt for a day-switch race: dayDetail may still hold the
      // PREVIOUS day's payload for a frame after selectedKey changes.
      if (!dayDetail.isSuccess || dayDetail.data?.dateKey !== selectedKey) return;
    }

    if (dayOpen.length > 0) {
      sawOpenDaysRef.current.add(selectedKey);
      return;
    }
    // Observation happens above the tour guard, the FIRE below it: the tour
    // owns the overlay layer, but Home stays mounted under the tour screens,
    // so gating observation too would freeze the latch for the whole M1–M6
    // run and silence any day cleared during it.
    if (activeTourStep) return;
    // The modal is a native window that draws over EVERYTHING. Home stays
    // mounted under /all-practices and /history, and both act on the same day
    // and invalidate historyKeys — so without this the celebration pops over
    // whichever screen the user is actually looking at.
    if (!isFocused) return;
    // Never fire for a day we only ever saw empty — that is browsing.
    if (!sawOpenDaysRef.current.has(selectedKey)) return;
    // Proof the user closed the day, rather than the day merely becoming
    // empty. Today has server truth for this (ringDone counts the day's
    // activity); a past day uses what this screen actually did.
    if (isToday ? ringDone <= 0 : !actedOnDaysRef.current.has(selectedKey)) {
      return;
    }

    // Fire only on SETTLED data. An optimistic complete/skip empties the
    // list a full network round-trip before the stats catch up. Firing on
    // that frame shows wrong counts, and an action that then FAILS would pop
    // a false celebration AND burn the once-per-day stamp.
    //
    // retroHidden is the past-day equivalent of the isFetching guard: retro
    // mutations get no optimistic cache pass, so those ids are hidden purely
    // client-side until the server agrees. Empty ⟺ screen and server match.
    // On today it is always empty, so this costs the shared path nothing.
    if (
      completeTask.isPending ||
      skipTask.isPending ||
      skipTasksBulk.isPending ||
      buckets.isFetching ||
      retroHidden.size > 0 ||
      (!isToday && dayDetail.isFetching)
    ) {
      return;
    }

    // No cleanup cancellation: the stamp is written BEFORE showing, so
    // aborting between the two (e.g. a refetch re-running the effect)
    // would burn the day without the celebration. The ref just prevents
    // two overlapping runs from double-firing the haptic.
    if (dayClearedFiringRef.current) return;
    dayClearedFiringRef.current = true;
    const dayKey = selectedKey;
    const retro = !isToday;
    (async () => {
      try {
        // Per-day slot. The old single slot held one date string, so
        // stamping a past day would burn today's stamp and vice-versa.
        const slot = `${DAY_CLEARED_KEY}:${dayKey}`;
        const stamped = await AsyncStorage.getItem(slot);
        if (stamped) return;
        // Legacy single-slot read, one release only: users who already
        // cleared TODAY under the old scheme must not see it fire again.
        if (!retro) {
          const legacy = await AsyncStorage.getItem(DAY_CLEARED_KEY);
          if (legacy === todayDateKey()) return;
        }
        // Stamp first — never twice for the same day, even if an undo
        // resurrects practices while the modal is up.
        await AsyncStorage.setItem(slot, '1');

        if (retro) {
          const d = dayDetail.data;
          setDayClearedStats({
            // dayDetail.completions is one row PER COMPLETION while
            // todayActivity.completed is one entry PER TASK — dedupe by task
            // so "{{count}} práticas feitas" means the same thing on both.
            done: new Set((d?.completions ?? []).map((c) => c.taskId)).size,
            skipped: d?.skipped.length ?? 0,
            xp: d?.totalXp ?? 0,
            dateLabel: hero.monthDay,
          });
        } else {
          const completed = data!.todayActivity.completed;
          setDayClearedStats({
            done: completed.length,
            skipped: data!.todayActivity.skipped.length,
            xp: completed.reduce((sum, c) => sum + c.totalXp, 0),
          });
        }
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      } finally {
        dayClearedFiringRef.current = false;
      }
    })();
  }, [
    isToday,
    selectedKey,
    buckets.isSuccess,
    buckets.isFetching,
    data,
    dayDetail.isSuccess,
    dayDetail.isFetching,
    dayDetail.data,
    dayOpen.length,
    retroHidden.size,
    ringDone,
    activeTourStep,
    completeTask.isPending,
    skipTask.isPending,
    skipTasksBulk.isPending,
    isFocused,
    hero.monthDay,
  ]);

  // ── Post-login tour: M1 (Práticas) ────────────────────────────────────
  // M1 teaches on today's real cards, so it runs on today only: arrowing to
  // a past day hides it, coming back restores it at the same step.
  //
  // Its step list depends on the day (see buildM1Steps). The plan is LIVE
  // while step 1 is up and FROZEN once the module moves past it, so the
  // shared index never slides onto another step when a completion, an undo
  // or a mood refetch lands mid-module.
  const m1CompletedThisRun = useM1PlanStore((s) => s.completedThisRun);
  const m1Frozen = useM1PlanStore((s) => s.frozen);
  const m1LiveHasCompleted =
    (data?.todayActivity.completed.length ?? 0) > 0 || m1CompletedThisRun;
  // MoodHubStrip renders on today exactly when its query succeeded.
  const m1LiveMood = todayMood.isSuccess;
  const m1Plan: M1Options =
    m1StepIndex > 0 && m1Frozen
      ? m1Frozen
      : { hasCompletedToday: m1LiveHasCompleted, moodCardVisible: m1LiveMood };
  const m1Steps = buildM1Steps(t, m1Plan);
  const m1Step = m1Steps[m1StepIndex];
  const m1StepNeedsCard = m1Step?.target === M1_TARGETS.CARD;
  const m1NextWithoutCard = m1Steps.findIndex(
    (s, i) => i > m1StepIndex && s.target !== M1_TARGETS.CARD,
  );

  useEffect(() => {
    const plan = useM1PlanStore.getState();
    if (!isM1Current) {
      plan.reset();
      return;
    }
    if (m1StepIndex === 0) {
      plan.unfreeze();
      return;
    }
    // First render past step 1: freeze exactly what that render used.
    if (!plan.frozen) {
      plan.freeze({ hasCompletedToday: m1LiveHasCompleted, moodCardVisible: m1LiveMood });
    }
  }, [isM1Current, m1StepIndex, m1LiveHasCompleted, m1LiveMood]);

  // Safety net for the steps that spotlight a card, on a day with no open
  // card (all done, all skipped, only weekly practices…):
  //   - step 1 with nothing done today → nothing to practise on: mark M1
  //     skipped so the tour flows on (same idea as the old M3 auto-skip);
  //   - otherwise → jump to the next step that needs no card, or finish M1
  //     when none is left (the long-press step is last).
  // Acts on SETTLED data only. An optimistic complete empties the list a
  // full round-trip before the server agrees; acting on that frame would
  // skip M1 under a user who just did exactly what step 1 asked.
  const setTourStatus = useTourStore((s) => s.setStatus);
  const setTourStepIndex = useTourStore((s) => s.setStepIndex);
  useEffect(() => {
    if (!isM1Current || !isToday || !isFocused || !m1StepNeedsCard) return;
    if (!buckets.isSuccess || buckets.isFetching) return;
    if (completeTask.isPending || skipTask.isPending || skipTasksBulk.isPending) return;
    if (dayOpen.length > 0) return;
    if (m1StepIndex === 0 && !m1Plan.hasCompletedToday) {
      void setTourStatus('M1', 'skipped');
      setTourStepIndex('M1', 0);
      return;
    }
    if (m1NextWithoutCard === -1) {
      void setTourStatus('M1', 'completed');
      setTourStepIndex('M1', 0);
      return;
    }
    void setTourStatus('M1', 'in_progress');
    setTourStepIndex('M1', m1NextWithoutCard);
  }, [
    isM1Current,
    isToday,
    isFocused,
    m1StepNeedsCard,
    m1StepIndex,
    m1Plan.hasCompletedToday,
    m1NextWithoutCard,
    buckets.isSuccess,
    buckets.isFetching,
    completeTask.isPending,
    skipTask.isPending,
    skipTasksBulk.isPending,
    dayOpen.length,
    setTourStatus,
    setTourStepIndex,
  ]);

  // Bring the spotlighted element into the open band above the tooltip.
  // Keyed to the step's TARGET, not to an index — the old effect hardcoded
  // index 4 and broke as soon as the list changed shape. Scrolls only when
  // the element is not already fully in that band. Content Y comes from the
  // window-coordinate difference against the content-top marker (the
  // pattern character.tsx uses — independent of how measureLayout treats
  // scroll views on each architecture).
  const m1ActiveTarget =
    activeTourStep?.module === 'M1' ? m1Step?.target : undefined;
  useEffect(() => {
    const ref =
      m1ActiveTarget === M1_TARGETS.CARD
        ? firstCardRef
        : m1ActiveTarget === M1_TARGETS.DRAWER
          ? drawerRef
          : m1ActiveTarget === M1_TARGETS.MOOD
            ? moodRef
            : null;
    if (!ref) return;
    let cancelled = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const node = ref.current;
      const top = contentTopRef.current;
      if (!node || !top) return;
      top.measureInWindow((_tx, topY) => {
        node.measureInWindow((_nx, nodeY, _nw, nodeH) => {
          if (cancelled || nodeH <= 0) return;
          const y = nodeY - topY;
          const cardH = useActiveTourStepStore.getState().cardHeight ?? 260;
          // The tooltip card floats navClearance + 8 above the screen
          // bottom, which is also the scroll viewport's bottom.
          const room = viewportHRef.current - (navClearance + tokens.space[2] + cardH);
          const margin = tokens.space[3];
          const from = scrollYRef.current;
          if (y >= from + margin && y + nodeH <= from + room - margin) return;
          const range = Math.max(0, contentHRef.current - viewportHRef.current);
          const next = Math.min(
            range,
            Math.max(0, y - Math.max(margin, (room - nodeH) / 2)),
          );
          scrollRef.current?.scrollTo({ y: next, animated: true });
          scrollYRef.current = next;
          settle = setTimeout(remeasureActiveTourTarget, 450);
        });
      });
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (settle) clearTimeout(settle);
    };
  }, [m1ActiveTarget, navClearance]);

  // M1 renders only when its surface is really there: today, data loaded,
  // and — for the card steps — a card to point at (the safety net above
  // moves the index on; this keeps the tooltip from flashing meanwhile).
  const m1Enabled =
    isM1Current &&
    isToday &&
    !isLoading &&
    !hasError &&
    !(m1StepNeedsCard && dayOpen.length === 0);

  // "Todas as práticas" — the FAB's one and only behaviour. It also tells
  // M2 its step 1 gesture happened; the tour never reroutes it.
  const openAllPractices = () => {
    emitTourEvent(M2_EVENTS.ALL_OPENED);
    router.push(
      isToday
        ? '/all-practices'
        : { pathname: '/all-practices', params: { date: selectedKey } },
    );
  };

  // First rendered card (the first Hoje item) carries the M1 tour anchor.
  const renderTaskCard = (task: TaskWithSubs, isTourAnchor: boolean) => {
    const card = (
      <TaskCard
        task={task}
        onComplete={() => handleQuickComplete(task)}
        onLongPress={() => handleLongPress(task)}
        onSkip={() => handleSwipeSkip(task)}
        onSwipeComplete={() => setSheetTask(task)}
        onEdit={() =>
          router.push({ pathname: '/task-form', params: { id: task.id } })
        }
      />
    );
    // M1's card steps spotlight the first card — wrapping only the anchor
    // keeps the gap flow identical for the rest. Tour is today-only. The
    // outer View is the scroll anchor the M1 auto-scroll measures.
    return isTourAnchor && isToday ? (
      <View key={task.id} ref={firstCardRef} collapsable={false}>
        <TourTarget id={M1_TARGETS.CARD} radius={20}>
          {card}
        </TourTarget>
      </View>
    ) : (
      <Fragment key={task.id}>{card}</Fragment>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TodayAmbient />

      <ScrollView
        ref={scrollRef}
        onScrollEndDrag={handleScrollSettled}
        onMomentumScrollEnd={handleScrollSettled}
        onLayout={(e) => {
          viewportHRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_w, h) => {
          contentHRef.current = h;
        }}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onPullRefresh}
            tintColor={tokens.brand.violet2}
            colors={[tokens.brand.violet2]}
          />
        }
      >
        {/* Zero-height content-top marker: the M1 auto-scroll measures
            anchors against it to get their content Y. */}
        <View ref={contentTopRef} collapsable={false} />
        <TodayHeader
          // Blank (not the "aventureiro" fallback) until the profile lands,
          // so the eyebrow never flashes a placeholder and then swaps to the
          // real name — the same flash first users reported on the welcome.
          displayName={
            character.data
              ? (character.data.profile.display_name ?? t('home.defaultName'))
              : ' '
          }
          weekdayLabel={hero.weekday}
          monthDayLabel={hero.monthDay}
          // XP earned that day is now a standalone glowing stat inside the
          // header (no band, no ring). null until the day's detail lands so
          // it never flashes a grey "+0" before the real value (guarding on
          // isLoading missed today, where dayDetail loads separately).
          xpOfDay={dayDetail.data ? xpOfDay : null}
          isToday={isToday}
          canGoNext={!isToday}
          onPrevDay={() => stepDay(-1)}
          onNextDay={() => stepDay(1)}
          onResetToday={isToday ? undefined : goToToday}
        />

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
            {/* Today-only context: quests + the notification opt-in. On a
                past day the screen is purely "see + retro-log what you
                forgot", so these stay hidden. */}
            {isToday && (
              <>
                {/* A newer native build on the Play Store — the one update
                    an OTA can't deliver; renders only when truly outdated. */}
                <StoreUpdateCard />
                <QuestChipsStrip />
                <NotificationOptInCard enabled={!activeTourStep} />
                {/* Minha Semana — module-gated; renders nothing when off. */}
                <WeekStrip />
              </>
            )}

            <View style={styles.taskList}>
              {dayOpen.length === 0 ? (
                // key={selectedKey} is load-bearing and is the ONLY allowed
                // key: it replays the entrance once per day as the user
                // arrows across cleared days, while keeping the panel mounted
                // (and still) through refetches, undo and pull-to-refresh.
                // Keying on anything data-derived would re-animate on every
                // one of those.
                <DaySeal
                  key={selectedKey}
                  completions={dayDetail.data?.completions ?? []}
                  skippedCount={daySkippedItems.length}
                  isToday={isToday}
                  // Same settled-data test the celebration uses: the mode is
                  // read from caches with no optimistic pass, so it must not
                  // be trusted while an action is still in flight.
                  settled={
                    dayDetail.isSuccess &&
                    dayDetail.data?.dateKey === selectedKey &&
                    !dayDetail.isFetching &&
                    !buckets.isFetching &&
                    !completeTask.isPending &&
                    !skipTask.isPending &&
                    !skipTasksBulk.isPending &&
                    retroHidden.size === 0
                  }
                />
              ) : (
                dayOpen.map((task, idx) => renderTaskCard(task, idx === 0))
              )}

              {/* "Fechar o dia" — today only; bulk-skip everything still
                  waiting. Only when ≥2 remain (a single card is one swipe). */}
              {dayOpen.length >= 2 && (
                <Pressable
                  onPress={handleClearDay}
                  disabled={skipTasksBulk.isPending}
                  style={({ pressed }) => [
                    styles.clearDayBtn,
                    pressed && { opacity: 0.55 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.clearDay.a11y')}
                >
                  <Ionicons
                    name="checkmark-done-outline"
                    size={15}
                    color={tokens.text.dim}
                  />
                  <Text style={styles.clearDayText}>
                    {t('home.clearDay.cta')}
                  </Text>
                </Pressable>
              )}

              {/* Completed drawer. On today it always renders — showWhenEmpty
                  keeps the tour's home.completed anchor a real, measurable
                  box on a fresh day (it used to measure a zero-size view),
                  and "Feitas hoje · 0" growing into the day's tally is the
                  day's arc in one line. A past day shows it only when there
                  is something to show. The outer View is M1's scroll anchor. */}
              {isToday ? (
                <View ref={drawerRef} collapsable={false}>
                  <TourTarget id={M1_TARGETS.DRAWER} radius={18}>
                    <CompletedBucket
                      items={dayCompletedItems}
                      title={t('home.completedBucket.today')}
                      showWhenEmpty
                      onUndo={handleUndo}
                      onExtra={handleQuickComplete}
                      onToggle={(open) => {
                        if (open) emitTourEvent(M1_EVENTS.DRAWER_EXPANDED);
                      }}
                    />
                  </TourTarget>
                </View>
              ) : (
                <CompletedBucket
                  items={dayCompletedItems}
                  title={t('home.completedBucket.day')}
                  onUndo={handleUndo}
                  onExtra={handleQuickComplete}
                />
              )}

              {daySkippedItems.length > 0 && (
                <CompletedBucket
                  items={daySkippedItems}
                  title={
                    isToday
                      ? t('home.skippedBucket.today')
                      : t('home.skippedBucket.day')
                  }
                  variant="skipped"
                  onUnskip={handleUnskip}
                />
              )}
            </View>

            {/* Journal. Today: the quick 5-face strip (the "close the day"
                ritual). Any past day: the same card the Calendar day view
                uses — the same faces (one tap logs THAT date) and the same big
                button into the check-in scoped to it — so the two surfaces
                cannot disagree about the same day.
                Deliberately OUTSIDE the `dayOpen.length === 0` branch: a past
                day with open cards must still be loggable, and DaySeal is a
                statement about what was trained, not a place for a control. */}
            {isToday ? (
              // Stays up during the tour: M1 teaches it (home.mood lives
              // inside MoodHubStrip), and the auto-scroll brings each target
              // into view by measuring it, so no element has to be the END
              // of the scroll any more. The View is M1's scroll anchor.
              <View ref={moodRef} collapsable={false}>
                <MoodHubStrip />
              </View>
            ) : (
              <View style={styles.moodDayWrap}>
                <MoodDayDetail dateKey={selectedKey} />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating action stack (thumb zone). Two buttons: Calendário
          (dedicated — opens the unified History calendar, a heavy, important
          screen) and Todas as práticas (primary — the see-all doing surface,
          which also hosts the "Gerenciar" entry inside it). RAW navClearance
          (not the tour-bumped bottomClearance) so it doesn't leap up under a
          bottom tour tooltip. M2 step 1 spotlights the Todas button; tapping
          it does what it always does (see openAllPractices). */}
      <TasksFabStack
        bottomOffset={navClearance}
        onSeeAll={openAllPractices}
        onCalendar={() => router.push('/history')}
        seeAllWrap={(node) => (
          <TourTarget id="home.manage" radius={28}>
            {node}
          </TourTarget>
        )}
      />

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
        dateLabel={isToday ? undefined : hero.monthDay}
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
        dateLabel={dayClearedStats?.dateLabel}
        onClose={() => setDayClearedStats(null)}
      />

      <MoodCheckinPrompt enabled={tourFinished && !activeTourStep && isFocused} />

      {/* Post-login tour — M1 (Práticas), every step on Home. Gated on the
         current-module check like every mount, plus m1Enabled (today,
         loaded, and a card to point at for the card steps). */}
      <TourModule module="M1" steps={m1Steps} enabled={m1Enabled} />

      {/* M2 step 1 spotlights the "Todas as práticas" FAB (seeAllWrap's
         'home.manage' target) and advances on the FAB's own press; the
         assist "Me leva lá" opens the same screen. Steps 2-6 live on
         /all-practices, /tasks and the form. rewindOnFocus (here and on the
         M4-M6 mounts below): coming back to Home mid-module — hardware
         back, a tab switch — rewinds to this screen's step, so the tooltip
         reappears instead of the tour going silent. */}
      <TourModule
        module="M2"
        steps={buildM2Steps(t)}
        enabled={isM2Current}
        rewindOnFocus
        onAdvanceToNextScreen={openAllPractices}
      />

      {/* M4 step 1 lives here (Rewards bottom-nav tab). Switching to the
         Rewards tab fires REWARDS_NAVIGATED from that screen; Próximo /
         skip switches there ourselves so steps 2-3 have their surface. */}
      <TourModule
        module="M4"
        steps={buildM4Steps(t)}
        enabled={isM4Current}
        rewindOnFocus
        onAdvanceToNextScreen={() => router.navigate('/(tabs)/rewards')}
      />

      {/* M5 step 1 lives here (Eu/Hero bottom-nav tab). Switching to the
         Hero tab fires ME_NAVIGATED from that screen; Próximo / skip
         switches there ourselves so steps 2-5 have their surface. */}
      <TourModule
        module="M5"
        steps={buildM5Steps(t)}
        enabled={isM5Current}
        rewindOnFocus
        onAdvanceToNextScreen={() => router.navigate('/(tabs)/character')}
      />

      {/* M6 step 1 lives here (Learn bottom-nav tab). Switching to the
         Learn tab fires LEARN_NAVIGATED from that screen. Skipping at
         this step ends M6 → the closing screen (finishM6). */}
      <TourModule
        module="M6"
        steps={buildM6Steps(t)}
        enabled={isM6Current}
        rewindOnFocus
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
  // MoodDayDetail's own card carries no horizontal margin (it relies on its
  // History container), so this matches MoodHubStrip's outer box.
  moodDayWrap: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
  },
  // "Fechar o dia" — deliberately low-prominence: no fill, dim text,
  // centered under the last card so it reads as a quiet exit, not a CTA.
  clearDayBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    marginTop: tokens.space[1],
  },
  clearDayText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.dim,
    letterSpacing: 0.3,
  },
});
