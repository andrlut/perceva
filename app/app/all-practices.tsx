import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import {
  CompletedBucket,
  completionsToItems,
  type CompletedItem,
} from '@/components/CompletedBucket';
import { CompleteTaskSheet } from '@/components/CompleteTaskSheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import { TaskCard } from '@/components/TaskCard';
import { XPCoinFloat } from '@/components/XPCoinFloat';
import {
  dateKeyFromLocal,
  taskFromCompletionSnapshot,
  useDayDetail,
} from '@/lib/api/history';
import {
  useActiveTasks,
  useCompleteTask,
  useUndoCompletion,
} from '@/lib/api/tasks';
import type { TaskSub, TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLimitModalStore, useTaskLimit } from '@/lib/premium';
import { isEffectivelyDaily } from '@/lib/recurrence';
import { useLoadedSettings } from '@/lib/settings';
import { formatLongDate } from '@/lib/time';
import { compareOneShotsByFreshness, isInTrophyWindow } from '@/lib/trophy';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';

interface FloatItem {
  id: number;
  xp: number;
  coins: number;
}

/**
 * "Todas as práticas" — the see-all DOING surface. Every active practice
 * EXCEPT the dailies (those live on Hoje), in the Home card vocabulary so
 * the user can knock out or work ahead on any weekly / monthly / one-shot
 * on any day. Reuses TaskCard for complete / quick-complete / adjust-then-
 * complete / edit — but deliberately NOT swipe-to-skip: skipping is a
 * Hoje-contract concept, meaningless here, and would pollute the day ring.
 *
 * Completions earn XP as usual; the underlying complete_task only feeds
 * the Hoje ring when the practice was actually DUE today (see wasDueToday
 * in index.tsx), so doing a non-scheduled practice here never misfires the
 * day-cleared celebration.
 */
export default function AllPracticesScreen() {
  const router = useRouter();
  const { t } = useT();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const settings = useLoadedSettings();
  const bottomClearance = useBottomSafeClearance();
  const tasks = useActiveTasks();
  // Optional `date` param makes this a date-aware log surface: opened from a
  // past day (Home day-view / calendar), completing logs for THAT day.
  const selectedDate = useMemo(() => {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    return dt;
  }, [date]);
  const selectedKey = dateKeyFromLocal(selectedDate);
  const isToday = selectedKey === dateKeyFromLocal(new Date());
  // Selected day's detail — completions (drawer + hiding done items) and the
  // one-shot list (with lastCompletedAt for trophy dimming). Works for today
  // and any past day.
  const dayDetail = useDayDetail(selectedDate, settings.weekStart);
  const completeTask = useCompleteTask();
  const undoCompletion = useUndoCompletion();
  const taskLimit = useTaskLimit();
  const openLimit = useLimitModalStore((s) => s.open);

  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [sheetTask, setSheetTask] = useState<TaskWithSubs | null>(null);
  // Optimistic-hide set: a card tapped complete disappears immediately
  // (mirrors Home, where buckets.today drops it). useCompleteTask's
  // optimistic path does NOT touch the useActiveTasks-derived recurring
  // list, so without this the card lingers until the refetch lands — a
  // window where a second tap logs a duplicate completion. Pruned once the
  // server confirms (see the effect below); restored on error.
  const [pendingDone, setPendingDone] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    if (taskLimit.atLimit) {
      openLimit('task');
      return;
    }
    router.push('/task-form');
  };

  const fireCompletion = (task: TaskWithSubs, subs: TaskSub[]) => {
    if (completeTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const reward = rewardForTaskSubs(subs);
    const fid = Date.now();
    setFloats((prev) => [
      ...prev,
      { id: fid, xp: reward.total.xp, coins: reward.total.coins },
    ]);
    setPendingDone((prev) => new Set(prev).add(task.id));
    // Retro when a past day is selected — file at noon of that local date.
    const at = new Date(selectedDate);
    at.setHours(12, 0, 0, 0);
    completeTask.mutate(
      isToday
        ? { task, subs }
        : {
            task,
            subs,
            completedAt: at.toISOString(),
            completedLocalDate: selectedKey,
          },
      {
        onError: (err) => {
          // Restore the card — the completion didn't land.
          setPendingDone((prev) => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
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

  const handleQuickComplete = (task: TaskWithSubs) =>
    fireCompletion(task, task.subs);

  const handleSheetConfirm = (subs: TaskSub[]) => {
    if (!sheetTask) return;
    const task = sheetTask;
    setSheetTask(null);
    fireCompletion(task, subs);
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

  const handleRefresh = async () => {
    await Promise.all([tasks.refetch(), dayDetail.refetch()]);
  };
  const isRefreshing = tasks.isRefetching || dayDetail.isRefetching;

  // Completed on the SELECTED day — hide from the active lists (they move
  // to the drawer).
  const completedThatDayIds = useMemo(
    () => new Set((dayDetail.data?.completions ?? []).map((c) => c.taskId)),
    [dayDetail.data],
  );

  // Skipped on the SELECTED day. The one-shot list gets this for free (it
  // comes from openTasks, which the shared predicate already filters); the
  // recurring list is built from useActiveTasks, so it has to honor skips
  // itself or a practice skipped on that day still shows up here.
  const skippedThatDayIds = useMemo(
    () => new Set((dayDetail.data?.skipped ?? []).map((task) => task.id)),
    [dayDetail.data],
  );

  const activeById = useMemo(
    () => new Map((tasks.data ?? []).map((tk) => [tk.id, tk])),
    [tasks.data],
  );

  // Recorrentes — ALL weekly/monthly (excluding weekly-all-7, which is
  // effectively daily and lives on Hoje), minus what's already done on the
  // selected day or optimistically hidden this frame. NOT period-gated:
  // this is the "log anything" catalog.
  const recurring = useMemo(() => {
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    return (tasks.data ?? []).filter(
      (task) =>
        !isEffectivelyDaily(task.recurrence) &&
        (task.recurrence.type === 'weekly' ||
          task.recurrence.type === 'monthly') &&
        // Never list a task on a day before it existed — a retro completion
        // there would be dated before the task's own created_at (corrupting
        // the heatmap + Momentum window). Mirrors useDayDetail's created_at
        // scope, which already covers the one-shot list.
        new Date(task.created_at).getTime() <= dayEnd.getTime() &&
        !completedThatDayIds.has(task.id) &&
        !skippedThatDayIds.has(task.id) &&
        !pendingDone.has(task.id),
    );
  }, [
    tasks.data,
    completedThatDayIds,
    skippedThatDayIds,
    pendingDone,
    selectedDate,
  ]);

  // Pontuais — from the selected day's openTasks (carries lastCompletedAt
  // for trophy dimming + already excludes done/skipped-that-day), minus
  // what's optimistically hidden this frame.
  const oneshot = useMemo(
    () =>
      (dayDetail.data?.openTasks ?? [])
        .filter(
          (task) =>
            task.recurrence.type === 'one_shot' && !pendingDone.has(task.id),
        )
        .sort((a, b) => compareOneShotsByFreshness(a, b, selectedDate)),
    [dayDetail.data, pendingDone, selectedDate],
  );

  // Prune the optimistic-hide set once the server reflects the completion
  // (the id shows up in the day's completions). Pruning only AFTER the
  // server reflects it keeps the card hidden through the handoff (no
  // reappear-then-vanish flicker) and lets an undo bring it back.
  useEffect(() => {
    setPendingDone((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(
        [...prev].filter((id) => !completedThatDayIds.has(id)),
      );
      return next.size === prev.size ? prev : next;
    });
  }, [completedThatDayIds]);

  const completedItems = useMemo<CompletedItem[]>(
    () =>
      completionsToItems(
        dayDetail.data?.completions ?? [],
        (id) => activeById.get(id),
        taskFromCompletionSnapshot,
        // Dailies belong to Hoje — this surface is non-daily only. An
        // archived/deleted task keeps its row (rebuilt from the snapshot) so
        // the day's record isn't silently lost.
        (task, live) => !live || !isEffectivelyDaily(task.recurrence),
      ),
    [dayDetail.data, activeById],
  );

  const isLoading = tasks.isLoading || dayDetail.isLoading;
  const hasAny =
    recurring.length + oneshot.length > 0 || completedItems.length > 0;

  const renderCard = (task: TaskWithSubs) => (
    <TaskCard
      key={task.id}
      task={task}
      dimmed={isInTrophyWindow(task, selectedDate)}
      onComplete={() => handleQuickComplete(task)}
      onLongPress={() => setSheetTask(task)}
      onSwipeComplete={() => setSheetTask(task)}
      onEdit={() =>
        router.push({ pathname: '/task-form', params: { id: task.id } })
      }
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.title}>{t('allPractices.title')}</Text>
          <View style={styles.topActions}>
            {/* Gerenciar práticas lives here (moved off the Home FAB) —
                buckets, drag-reorder, adopt, edit. */}
            <Pressable
              onPress={() => router.push('/tasks')}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
              hitSlop={8}
              accessibilityLabel={t('tasksHub.title')}
            >
              <Ionicons name="options-outline" size={20} color={tokens.text.mid} />
            </Pressable>
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
              hitSlop={8}
              accessibilityLabel={t('tasksHub.newTask')}
            >
              <Ionicons name="add" size={22} color={tokens.brand.violet2} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Math.max(tokens.space[10], bottomClearance) + tokens.space[6],
            },
          ]}
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
          <Text style={styles.lead}>
            {isToday
              ? t('allPractices.lead')
              : t('allPractices.loggingFor', {
                  date: formatLongDate(selectedDate),
                })}
          </Text>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          ) : !hasAny ? (
            <View style={styles.emptyBox}>
              <Ionicons name="albums-outline" size={32} color={tokens.text.dim} />
              <Text style={styles.emptyTitle}>{t('allPractices.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('allPractices.emptyBody')}</Text>
              <Pressable
                onPress={handleCreate}
                style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="add" size={18} color={tokens.text.hi} />
                <Text style={styles.emptyCtaText}>{t('allPractices.emptyCta')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.lists}>
              {recurring.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>
                    {t('allPractices.sections.recurring')}
                  </Text>
                  {recurring.map(renderCard)}
                </>
              )}
              {oneshot.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, styles.sectionHeaderSecondary]}>
                    {t('allPractices.sections.oneshot')}
                  </Text>
                  {oneshot.map(renderCard)}
                </>
              )}
              {completedItems.length > 0 && (
                <CompletedBucket
                  items={completedItems}
                  title={
                    isToday
                      ? t('home.completedBucket.today')
                      : t('home.completedBucket.day')
                  }
                  onUndo={handleUndo}
                  onExtra={handleQuickComplete}
                />
              )}
            </View>
          )}
        </ScrollView>
      </ScreenBackground>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  content: {
    paddingHorizontal: tokens.space[4],
  },
  lead: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    paddingBottom: tokens.space[3],
  },
  lists: {
    gap: tokens.space[2],
  },
  sectionHeader: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
    letterSpacing: 0.4,
    paddingTop: tokens.space[1],
  },
  sectionHeaderSecondary: {
    fontSize: 13,
    color: tokens.text.mid,
    marginTop: tokens.space[3],
  },
  loadingBox: {
    paddingVertical: tokens.space[10],
    alignItems: 'center',
  },
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
});
