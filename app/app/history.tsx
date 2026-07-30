import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { useT } from '@/lib/i18n';
import { formatHeroDate } from '@/lib/time';

import {
  CompletedBucket,
  completionsToItems,
  type CompletedItem,
} from '@/components/CompletedBucket';
import { CompleteTaskSheet } from '@/components/CompleteTaskSheet';
import { DaySeal } from '@/components/DaySeal';
import { DayXpStat } from '@/components/DayXpStat';
import { MoodDayDetail } from '@/components/mood/MoodDayDetail';
import { ScreenBackground } from '@/components/ScreenBackground';
import { DayHeatmap, type DayCellData } from '@/components/history/DayHeatmap';
import { HistoryLensTabs } from '@/components/history/HistoryLensTabs';
import { TaskActionSheet } from '@/components/TaskActionSheet';
import { TaskCard } from '@/components/TaskCard';
import { XPCoinFloat } from '@/components/XPCoinFloat';
import {
  dateKeyFromLocal,
  useDailySummary,
  taskFromCompletionSnapshot,
  useDayDetail,
  type DailySummaryEntry,
} from '@/lib/api/history';
import { useMoodMonth } from '@/lib/api/mood';
import { moodLevel } from '@/lib/mood';
import {
  dimensionForSub,
  useActiveTasks,
  useCompleteTask,
  useSkipTaskToday,
  useUndoCompletion,
  useUnskipTaskToday,
} from '@/lib/api/tasks';
import { useLoadedSettings } from '@/lib/settings';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import type { DimensionId, SubId, TaskSub, TaskWithSubs } from '@/lib/db/types';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_ORDER } from '@/theme/dimensions';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** First day of `d`'s month at 00:00 local. */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of `d`'s month at 23:59:59 local. */
function endOfMonth(d: Date): Date {
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  e.setHours(23, 59, 59, 999);
  return e;
}

/** True if `a` and `b` fall in the same year + month. */
function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Which pillars a day touched, in catalog order. Deliberately dimension-
 * level and not sub-level: `SUB_META` carries no per-sub palette, so
 * sibling subs (sleep and nutrition are both #FF6B7A) would render
 * pixel-identical dots.
 */
function dimensionsInDay(entry: DailySummaryEntry | undefined): DimensionId[] {
  if (!entry) return [];
  const hit = new Set<DimensionId>();
  for (const [sub, xp] of Object.entries(entry.bySub)) {
    if ((xp ?? 0) > 0) hit.add(dimensionForSub(sub as SubId));
  }
  return DIMENSION_ORDER.filter((d) => hit.has(d));
}

function formatDay(d: Date): string {
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useT();
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(new Date()));
  // Sheets + floats — mirror the home so retro-logging on a past day
  // feels identical to logging today.
  const [sheetTask, setSheetTask] = useState<TaskWithSubs | null>(null);
  const [actionTask, setActionTask] = useState<TaskWithSubs | null>(null);
  const [floats, setFloats] = useState<{ id: number; xp: number; coins: number }[]>([]);

  // Live tasks, so a completion row can resolve back to its real task and
  // keep the drawer's "+1" wired. Rows whose task is archived/deleted fall
  // back to the completion snapshot and drop the "+1" (nothing to re-log).
  const activeTasks = useActiveTasks();
  const activeById = useMemo(
    () => new Map((activeTasks.data ?? []).map((task) => [task.id, task])),
    [activeTasks.data],
  );

  // Heatmap range follows the visible month — the MonthGrid only needs
  // entries for the month it renders, so we fetch a tight window.
  const monthRange = useMemo(
    () => ({ from: startOfMonth(visibleMonth), to: endOfMonth(visibleMonth) }),
    [visibleMonth],
  );

  const settings = useLoadedSettings();
  const summary = useDailySummary(monthRange.from, monthRange.to);
  const moodMonth = useMoodMonth(visibleMonth);
  const day = useDayDetail(selected, settings.weekStart);
  const completeTask = useCompleteTask();
  const skipTask = useSkipTaskToday();
  const unskipTask = useUnskipTaskToday();
  const undoCompletion = useUndoCompletion();

  const isToday = isSameDay(selected, new Date());
  const canGoNext = !isToday;

  const handlePrev = () => {
    setSelected((d) => {
      const next = addDays(d, -1);
      // When the day step crosses a month boundary, drag the visible
      // month with it so the grid keeps the selected cell on-screen.
      if (!isSameMonth(next, visibleMonth)) {
        setVisibleMonth(startOfMonth(next));
      }
      return next;
    });
  };
  const handleNext = () => {
    if (!canGoNext) return;
    setSelected((d) => {
      const next = addDays(d, 1);
      if (!isSameMonth(next, visibleMonth)) {
        setVisibleMonth(startOfMonth(next));
      }
      return next;
    });
  };

  const handleSelectDay = (d: Date) => {
    setSelected(d);
    if (!isSameMonth(d, visibleMonth)) {
      setVisibleMonth(startOfMonth(d));
    }
  };

  // Month navigation from the grid header. We DON'T touch `selected`
  // here — the user explicitly asked to let them keep the previous
  // selection while browsing months. They'll either tap a day cell or
  // use the day chevrons to move the active selection.
  const handlePrevMonth = () => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    setVisibleMonth(next);
  };
  const handleNextMonth = () => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    if (next.getTime() > Date.now()) return; // never enter a future month
    setVisibleMonth(next);
  };

  const today = new Date();
  const canGoNextMonth =
    visibleMonth.getFullYear() < today.getFullYear() ||
    (visibleMonth.getFullYear() === today.getFullYear() &&
      visibleMonth.getMonth() < today.getMonth());

  const handleUndoCompletion = async (
    completionId: string,
    title: string,
    xp: number,
    coins: number,
  ) => {
    const ok = await confirmAction(
      'Undo this completion?',
      `"${title}" — you'll lose +${xp} XP and +${coins} coins.`,
      { okText: 'Undo', cancelText: 'Keep it', destructive: true },
    );
    if (!ok) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    undoCompletion.mutate(completionId, {
      onError: (err) => {
        const e = err as { message?: string };
        showInfo(t('historyScreen.errUndo'), e.message ?? t('common.unknownError'));
      },
    });
  };

  /**
   * Retro-completion shared by tap (default subs) and swipe (sheet-
   * adjusted subs). `subs` defaults to the task's own subs; pass a
   * different array to log with custom stars.
   *
   * No confirm dialog anymore — tapping the card OR swiping it
   * is itself the consent action. Errors still surface as alerts;
   * users can undo by long-pressing a completion.
   */
  const fireRetroCompletion = (task: TaskWithSubs, subs: TaskSub[]) => {
    if (completeTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const reward = rewardForTaskSubs(subs);
    const fid = Date.now();
    setFloats((prev) => [
      ...prev,
      { id: fid, xp: reward.total.xp, coins: reward.total.coins },
    ]);

    const stamp = new Date(selected);
    stamp.setHours(12, 0, 0, 0); // noon local — sidesteps day-boundary timezone wobble.
    completeTask.mutate(
      {
        task,
        subs,
        completedAt: stamp.toISOString(),
        completedLocalDate: dateKeyFromLocal(selected),
      },
      {
        onError: (err) => {
          const e = err as { message?: string };
          showInfo(t('historyScreen.errLog'), e.message ?? t('common.unknownError'));
        },
      },
    );
  };

  // `subs` comes from the drawer's "+1" — it repeats the stars of that
  // specific rep instead of falling back to the task's defaults.
  const handleRetroQuickComplete = (task: TaskWithSubs, subs?: TaskSub[]) => {
    fireRetroCompletion(task, subs ?? task.subs);
  };

  const handleSheetConfirm = (subs: TaskSub[]) => {
    if (!sheetTask) return;
    const task = sheetTask;
    setSheetTask(null);
    fireRetroCompletion(task, subs);
  };

  const handleActionAdjust = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    setSheetTask(task);
  };

  const handleActionEdit = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    router.push({ pathname: '/task-form', params: { id: task.id } });
  };

  // Retro skip: marks task_skip for the SELECTED day, not today. The
  // user-facing distinction matches the home behavior (swipe-left
  // pulls the task into the Skipped drawer with the option to unskip).
  const dayKey = dateKeyFromLocal(selected);
  const handleSwipeSkip = (task: TaskWithSubs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    skipTask.mutate(
      { taskId: task.id, date: dayKey },
      {
        onSuccess: () => day.refetch(),
        onError: (err) => {
          const e = err as { message?: string };
          showInfo(t('historyScreen.errSkip'), e.message ?? t('common.unknownError'));
        },
      },
    );
  };
  const handleUnskip = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    unskipTask.mutate(
      { taskId, date: dayKey },
      {
        onSuccess: () => day.refetch(),
        onError: (err) => {
          const e = err as { message?: string };
          showInfo(t('historyScreen.errUnskip'), e.message ?? t('common.unknownError'));
        },
      },
    );
  };
  const handleActionSkip = () => {
    if (!actionTask) return;
    const task = actionTask;
    setActionTask(null);
    handleSwipeSkip(task);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground>
      <ScrollView
        // SafeAreaView['bottom'] already handles OS nav clearance — content
        // only needs a small visual breathing room above the safe-area edge.
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tokens.space[5] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={summary.isRefetching || day.isRefetching}
            onRefresh={() => {
              summary.refetch();
              day.refetch();
            }}
            tintColor={tokens.brand.violet2}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t('historyScreen.eyebrow')}</Text>
            <Text style={styles.title}>{t('historyScreen.title')}</Text>
          </View>
        </View>

        <View style={{ marginBottom: tokens.space[4] }}>
          <HistoryLensTabs current="rotina" />
        </View>

        {/* One calendar, three channels: the cell fill is the day's mood,
            the figure is its XP, and the dots are the pillars it touched.
            The old Atividade|Humor toggle existed only because a cell
            could carry one of those at a time. */}
        <View style={styles.heatmapCard}>
          {summary.isLoading || moodMonth.isLoading ? (
            <View style={styles.heatmapLoading}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          ) : (
            <DayHeatmap
              monthDate={visibleMonth}
              selected={selected}
              onSelectDay={handleSelectDay}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              canGoNext={canGoNextMonth}
              weekStart={settings.weekStart}
              dataFor={(key) => {
                const mood = moodMonth.data?.get(key);
                const entry = summary.data?.get(key);
                if (!mood && !entry) return null;
                const level = mood ? moodLevel(mood.mood) : null;
                const cell: DayCellData = {
                  bg: level?.color,
                  ink: level?.ink,
                  xp: entry?.totalXp ?? 0,
                  dims: dimensionsInDay(entry),
                  mark: !!mood && (!!mood.note || (mood.tags?.length ?? 0) > 0),
                  a11yNote: level ? t(`mood.levels.${level.key}`) : undefined,
                };
                return cell;
              }}
            />
          )}
        </View>

        <View style={styles.dayNav}>
          <Pressable
            onPress={handlePrev}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={tokens.text.hi} />
          </Pressable>

          <View style={styles.dayLabelWrap}>
            <Text style={styles.dayLabel}>{formatDay(selected)}</Text>
            {!isToday && (
              <Pressable onPress={() => setSelected(startOfDay(new Date()))}>
                <Text style={styles.todayLink}>{t('common.today')}</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleNext}
            disabled={!canGoNext}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && canGoNext && styles.navBtnPressed,
              !canGoNext && styles.navBtnDisabled,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canGoNext ? tokens.text.hi : tokens.text.faint}
            />
          </Pressable>
        </View>

        {day.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : (
          <>
            <View style={styles.xpStatWrap}>
              <DayXpStat xp={day.data?.totalXp ?? 0} isToday={isToday} />
            </View>

            <MoodDayDetail dateKey={dayKey} />

            {(() => {
              // useDayDetail already applies the shared isOpenOnDay rule
              // (scheduled that day, nothing logged, not skipped) — the same
              // one Home uses, so the two screens cannot disagree about a
              // day. Only the one-shot exclusion is this surface's own
              // choice; those live behind "Ver todas as práticas".
              const open = (day.data?.openTasks ?? []).filter(
                (task) => task.recurrence.type !== 'one_shot',
              );
              // Completed drawer — one row per completion, carrying that
              // rep's own XP/coins/stars. Every task here is rebuilt from
              // the completion snapshot, so archived/deleted ones still
              // render (and still keep the day's XP total honest).
              const doneItems: CompletedItem[] = completionsToItems(
                day.data?.completions ?? [],
                (id) => activeById.get(id),
                taskFromCompletionSnapshot,
              );
              const skippedItems: CompletedItem[] = (day.data?.skipped ?? []).map(
                (task) => ({ task }),
              );
              return (
                <View style={styles.openList}>
                  {open.length === 0 ? (
                    // Same panel the Home day-view shows — the two screens
                    // already agree on the open list, the XP stat and the
                    // drawers; this is the last branch that didn't.
                    <DaySeal
                      key={dayKey}
                      completions={day.data?.completions ?? []}
                      skippedCount={skippedItems.length}
                      isToday={dayKey === dateKeyFromLocal(new Date())}
                    />
                  ) : (
                    open.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleRetroQuickComplete(task)}
                        onSwipeComplete={() => setSheetTask(task)}
                        onSkip={() => handleSwipeSkip(task)}
                        onLongPress={() => setActionTask(task)}
                        onEdit={() =>
                          router.push({ pathname: '/task-form', params: { id: task.id } })
                        }
                      />
                    ))
                  )}

                  {/* Log anything else FOR THIS DAY (weekly not scheduled
                      today, one-shots, …) — the date-aware see-all. */}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/all-practices',
                        params: { date: dayKey },
                      })
                    }
                    style={({ pressed }) => [
                      styles.seeAllBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="albums-outline"
                      size={16}
                      color={tokens.brand.violet2}
                    />
                    <Text style={styles.seeAllText}>{t('home.seeAllCta')}</Text>
                  </Pressable>

                  <CompletedBucket
                    items={doneItems}
                    title={
                      isToday
                        ? t('home.completedBucket.today')
                        : t('home.completedBucket.day')
                    }
                    onUndo={(completionId) =>
                      handleUndoCompletion(
                        completionId,
                        day.data?.completions.find((c) => c.id === completionId)?.taskTitle ?? '',
                        day.data?.completions.find((c) => c.id === completionId)?.xpGranted ?? 0,
                        day.data?.completions.find((c) => c.id === completionId)?.coinsGranted ?? 0,
                      )
                    }
                    onExtra={handleRetroQuickComplete}
                  />
                  <CompletedBucket
                    items={skippedItems}
                    title={
                      isToday
                        ? t('home.skippedBucket.today')
                        : t('home.skippedBucket.day')
                    }
                    variant="skipped"
                    onUnskip={handleUnskip}
                  />
                </View>
              );
            })()}

          </>
        )}
      </ScrollView>
      </ScreenBackground>

      {/* XP/coin float that pops out of the screen on each retro
          completion — same component the Home uses. */}
      {floats.map((f) => (
        <XPCoinFloat
          key={f.id}
          xp={f.xp}
          coins={f.coins}
          onDone={() =>
            setFloats((prev) => prev.filter((x) => x.id !== f.id))
          }
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
        dateLabel={
          dayKey === dateKeyFromLocal(new Date())
            ? undefined
            : formatHeroDate(selected).monthDay
        }
        onCancel={() => setActionTask(null)}
        onAdjustStars={handleActionAdjust}
        onSkipToday={handleActionSkip}
        onEdit={handleActionEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  content: {
    padding: tokens.space[4],
    paddingBottom: tokens.space[8],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.space[3],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...tokens.type.h1,
    color: tokens.text.hi,
    marginTop: 2,
  },
  heatmapCard: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[4],
    marginBottom: tokens.space[5],
  },
  heatmapLoading: {
    paddingVertical: tokens.space[6],
    alignItems: 'center',
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space[4],
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  navBtnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  dayLabelWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  dayLabel: {
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  todayLink: {
    ...tokens.type.caption,
    color: tokens.brand.violet2,
    fontFamily: 'Manrope_700Bold',
  },
  // Slightly larger gap between cards so the swipe action zone has
  // breathing room on each side.
  xpStatWrap: {
    marginBottom: tokens.space[4],
  },
  openList: {
    gap: tokens.space[2],
    marginTop: tokens.space[3],
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: tokens.space[2] + 2,
    paddingHorizontal: tokens.space[4],
    marginTop: tokens.space[1],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  seeAllText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  loadingBox: {
    paddingVertical: tokens.space[6],
    alignItems: 'center',
  },
});
