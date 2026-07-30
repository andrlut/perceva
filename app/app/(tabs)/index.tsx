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
import { DaySeal } from '@/components/DaySeal';
import { MoodCheckinPrompt } from '@/components/MoodCheckinPrompt';
import { MoodHubStrip } from '@/components/mood/MoodHubStrip';
import {
  CompletedBucket,
  completionsToItems,
  type CompletedItem,
} from '@/components/CompletedBucket';
import { NotificationOptInCard } from '@/components/NotificationOptInCard';
import { QuestChipsStrip } from '@/components/QuestChipsStrip';
import { TaskActionSheet } from '@/components/TaskActionSheet';
import { TaskCard } from '@/components/TaskCard';
import { TasksFabStack } from '@/components/TasksFabStack';
import { TodayAmbient } from '@/components/TodayAmbient';
import { TodayHeader } from '@/components/TodayHeader';
import { XPCoinFloat } from '@/components/XPCoinFloat';
import { useCharacter } from '@/lib/api/character';
import {
  dateKeyFromLocal,
  taskFromCompletionSnapshot,
  useDayDetail,
} from '@/lib/api/history';
import { todayDateKey } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { TourModule } from '@/components/tour/TourModule';
import { TourTarget } from '@/components/tour/TourTarget';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { remeasureActiveTourTarget } from '@/lib/tour/targets';
import { buildM1Steps, M1_EVENTS } from '@/lib/tour/m1Steps';
import { buildM2Steps } from '@/lib/tour/m2Steps';
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
  useSkipTasksBulk,
  useUndoCompletion,
  useUnskipTaskToday,
} from '@/lib/api/tasks';
import { confirmAction } from '@/lib/util/confirm';
import { useQuests } from '@/lib/api/quests';
import type { TaskSub, TaskWithSubs } from '@/lib/db/types';
import { isDueOn } from '@/lib/recurrence';
import { formatHeroDate } from '@/lib/time';
import { compareOneShotsByFreshness, isInTrophyWindow } from '@/lib/trophy';
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
  const quests = useQuests();
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
    // M2 step 1 now spotlights the fixed bottom-right Gerenciar FAB (always
    // on screen) with a top-anchored tooltip — no scroll needed.
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

  // Complete for the currently-selected day. Today → live path (optimistic
  // + M1 tour event). Past day → retro completion filed under that local
  // date ("I forgot to mark it yesterday"); no optimistic removal (the day
  // view refetches on settle), but still float the XP for feedback.
  const completeForSelectedDay = (task: TaskWithSubs, subs: TaskSub[]) => {
    if (isToday) {
      fireCompletion(task, subs);
      return;
    }
    if (completeTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const reward = rewardForTaskSubs(subs);
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
    completeTask.mutate(
      { task, subs, completedAt: at.toISOString(), completedLocalDate: selectedKey },
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
  // DEFAULT stars — not a round-trip.
  const handleQuickComplete = (task: TaskWithSubs, subs?: TaskSub[]) => {
    completeForSelectedDay(task, subs ?? task.subs);
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
    completeForSelectedDay(task, subs);
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
      // while the quest chips above them kept a stale count.
      quests.refetch(),
    ]);
  };
  const isRefreshing =
    character.isRefetching ||
    buckets.isRefetching ||
    allActiveTasks.isRefetching ||
    dayDetail.isRefetching ||
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

  // Past-day open list: daily + scheduled-on-that-day recurring, no
  // one-shots (they live in "Todas as práticas") — same filter as today.
  // dayDetail.openTasks already drops what was completed/skipped that day.
  const pastOpen = useMemo<TaskWithSubs[]>(() => {
    if (isToday || !dayDetail.data) return [];
    // The schedule + completed + skipped rules all live in useDayDetail now
    // (isOpenOnDay). All that is left here is the presentation choice Home
    // makes on EVERY day: one-shots belong to "Todas as práticas", not to a
    // specific day's list.
    return dayDetail.data.openTasks.filter(
      (task) => task.recurrence.type !== 'one_shot' && !retroHidden.has(task.id),
    );
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
      if (rec.type === 'one_shot') return false;
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
  // deliberate act (confirm first). Scoped to lists.today ONLY, so Pontuais
  // (one-shots) are never nuked. The optimistic bulk-skip empties the list
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
  // Holds the dateKey of the day we've SEEN open work on this session. It is
  // re-set on every frame where the currently-viewed day still has open
  // items, so returning to a day with work always re-arms it. The only day
  // that never latches is one that LOADS already-empty — exactly the day
  // that must stay silent while the user arrows through history.
  const sawOpenForDayRef = useRef<string | null>(null);
  const dayClearedFiringRef = useRef(false);

  // Declared ABOVE the effect on purpose: a dependency array is evaluated
  // eagerly during render, so referencing `hero` from one while it is
  // declared further down would throw a TDZ ReferenceError on every render.
  const hero = formatHeroDate(selectedDate);

  useEffect(() => {
    if (activeTourStep) return;

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
      sawOpenForDayRef.current = selectedKey;
      return;
    }
    // Never fire for a day we only ever saw empty — that is browsing, not
    // clearing.
    if (sawOpenForDayRef.current !== selectedKey) return;
    // An empty schedule never celebrates. On a past day `pastOpen` already
    // excludes one-shots, so "this day's open list was > 0" is itself proof
    // the day had a recurring contract — ringDone is a today-only concept.
    if (isToday && ringDone <= 0) return;

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
    hero.monthDay,
  ]);

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
    // keeps the gap flow identical for the rest. Tour is today-only.
    return isTourAnchor && isToday ? (
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
                <TourTarget id="home.quests" radius={18}>
                  <QuestChipsStrip />
                </TourTarget>
                <NotificationOptInCard enabled={!activeTourStep} />
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
                  momentum arc in one line. A past day shows it only when
                  there is something to show. */}
              {isToday ? (
                <TourTarget id="home.completed" radius={18}>
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

            {/* Journal strip — today only (the "close the day" ritual). */}
            {isToday && <MoodHubStrip />}
          </>
        )}
      </ScrollView>

      {/* Floating action stack (thumb zone). Two buttons: Calendário
          (dedicated — opens the unified History calendar, a heavy, important
          screen) and Todas as práticas (primary — the see-all doing surface,
          which also hosts the "Gerenciar" entry inside it). RAW navClearance
          (not the tour-bumped bottomClearance) so it doesn't leap up under a
          bottom tour tooltip. The M2 tour spotlights the Todas button (its
          "Me leva lá" jumps straight to /tasks). */}
      <TasksFabStack
        bottomOffset={navClearance}
        onSeeAll={() =>
          router.push(
            isToday
              ? '/all-practices'
              : { pathname: '/all-practices', params: { date: selectedKey } },
          )
        }
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

      {/* M2 step 1 spotlights the "Todas as práticas" FAB (via seeAllWrap's
         'home.manage' target). It has no awaitEvent — the tooltip's "Me
         leva lá" primary button advances and onAdvanceToNextScreen walks
         the user to /tasks, where step 2 (the create +) lives. */}
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
