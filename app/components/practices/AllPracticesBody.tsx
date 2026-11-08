import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  CompletedBucket,
  completionsToItems,
  type CompletedItem,
} from '@/components/CompletedBucket';
import { CompleteTaskSheet } from '@/components/CompleteTaskSheet';
import { ScreenTip } from '@/components/guide/ScreenTip';
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
import type { CoinMultiplier, TaskSub, TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLimitModalStore, useTaskLimit } from '@/lib/premium';
import { isEffectivelyDaily } from '@/lib/recurrence';
import { useLoadedSettings } from '@/lib/settings';
import { formatLongDate } from '@/lib/time';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';

interface FloatItem {
  id: number;
  xp: number;
  coins: number;
}

/**
 * "Todas as práticas" — the see-all DOING surface, as a body with no scroll
 * of its own so it can live inside Home's scroll (the Todas tab, Onboarding
 * simples 2026-11) AND inside the /all-practices route the calendar still
 * pushes for a past day.
 *
 * Every active practice, weeklies and monthlies first; the dailies (whose
 * home is Hoje) sit in a collapsed "Diárias" block below them. Reuses
 * TaskCard for complete / quick-complete / adjust-then-complete / edit — but
 * deliberately NOT swipe-to-skip: skipping is a Hoje-contract concept,
 * meaningless here, and would pollute the day ring.
 *
 * Completions earn XP as usual; the underlying complete_task only feeds the
 * Hoje ring when the practice was actually DUE today, so doing a
 * non-scheduled practice here never misfires the day-cleared celebration.
 */
export function AllPracticesBody({ selectedDate }: { selectedDate: Date }) {
  const router = useRouter();
  const { t } = useT();
  const settings = useLoadedSettings();
  const tasks = useActiveTasks();
  const selectedKey = dateKeyFromLocal(selectedDate);
  const isToday = selectedKey === dateKeyFromLocal(new Date());
  // Selected day's detail — completions (drawer + hiding done items) and
  // the day's skips. Works for today and any past day.
  const dayDetail = useDayDetail(selectedDate, settings.weekStart);
  const completeTask = useCompleteTask();
  const undoCompletion = useUndoCompletion();
  const taskLimit = useTaskLimit();
  const openLimit = useLimitModalStore((s) => s.open);

  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [sheetTask, setSheetTask] = useState<TaskWithSubs | null>(null);
  // Optimistic-hide set: a card tapped complete disappears immediately.
  // useCompleteTask's optimistic path does NOT touch the useActiveTasks-
  // derived recurring list, so without this the card lingers until the
  // refetch lands — a window where a second tap logs a duplicate completion.
  // Pruned once the server confirms; restored on error.
  const [pendingDone, setPendingDone] = useState<Set<string>>(new Set());
  const [dailiesOpen, setDailiesOpen] = useState(false);

  const handleCreate = () => {
    if (taskLimit.atLimit) {
      openLimit('task');
      return;
    }
    router.push('/task-form');
  };

  const fireCompletion = (
    task: TaskWithSubs,
    subs: TaskSub[],
    coinMultiplier?: CoinMultiplier,
    times = 1,
    coinStars?: number,
  ) => {
    if (completeTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const reward = rewardForTaskSubs(
      subs,
      coinMultiplier ?? task.coin_multiplier,
      coinStars ?? task.coin_stars,
    );
    const fid = Date.now();
    setFloats((prev) => [
      ...prev,
      { id: fid, xp: reward.total.xp * times, coins: reward.total.coins * times },
    ]);
    setPendingDone((prev) => new Set(prev).add(task.id));
    // Retro when a past day is selected — file at noon of that local date.
    const at = new Date(selectedDate);
    at.setHours(12, 0, 0, 0);
    completeTask.mutate(
      isToday
        ? { task, subs, coinMultiplier, times, coinStars }
        : {
            task,
            subs,
            coinMultiplier,
            completedAt: at.toISOString(),
            completedLocalDate: selectedKey,
            times,
            coinStars,
          },
      {
        onError: (err) => {
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

  // `subs` comes from the drawer's "+1" — it repeats the stars of that
  // specific rep, so the button means the same thing here and on Home.
  const handleQuickComplete = (
    task: TaskWithSubs,
    subs?: TaskSub[],
    coinMultiplier?: CoinMultiplier,
    coinStars?: number,
  ) => fireCompletion(task, subs ?? task.subs, coinMultiplier, 1, coinStars);

  const handleSheetConfirm = (
    subs: TaskSub[],
    coinMultiplier: CoinMultiplier,
    times: number,
    coinStars?: number,
  ) => {
    if (!sheetTask) return;
    const task = sheetTask;
    setSheetTask(null);
    fireCompletion(task, subs, coinMultiplier, times, coinStars);
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

  const completedThatDayIds = useMemo(
    () => new Set((dayDetail.data?.completions ?? []).map((c) => c.taskId)),
    [dayDetail.data],
  );
  const skippedThatDayIds = useMemo(
    () => new Set((dayDetail.data?.skipped ?? []).map((task) => task.id)),
    [dayDetail.data],
  );
  const activeById = useMemo(
    () => new Map((tasks.data ?? []).map((tk) => [tk.id, tk])),
    [tasks.data],
  );

  // Every weekly/monthly this user OWNS (weekly-all-7 is effectively daily
  // and lives on Hoje). NOT gated by created_at: a practice created after
  // the selected day can still be logged on it.
  const recurringOwned = useMemo(
    () =>
      (tasks.data ?? []).filter(
        (task) =>
          !isEffectivelyDaily(task.recurrence) &&
          (task.recurrence.type === 'weekly' || task.recurrence.type === 'monthly'),
      ),
    [tasks.data],
  );
  const recurring = useMemo(
    () =>
      recurringOwned.filter(
        (task) =>
          !completedThatDayIds.has(task.id) &&
          !skippedThatDayIds.has(task.id) &&
          !pendingDone.has(task.id),
      ),
    [recurringOwned, completedThatDayIds, skippedThatDayIds, pendingDone],
  );
  const dailiesOwned = useMemo(
    () => (tasks.data ?? []).filter((task) => !recurringOwned.includes(task)),
    [tasks.data, recurringOwned],
  );
  const dailies = useMemo(
    () =>
      dailiesOwned.filter(
        (task) =>
          !completedThatDayIds.has(task.id) &&
          !skippedThatDayIds.has(task.id) &&
          !pendingDone.has(task.id),
      ),
    [dailiesOwned, completedThatDayIds, skippedThatDayIds, pendingDone],
  );

  // Prune the optimistic hide once the server reflects the completion, so
  // the card stays hidden through the handoff and an undo brings it back.
  useEffect(() => {
    setPendingDone((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set([...prev].filter((id) => !completedThatDayIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [completedThatDayIds]);

  const completedItems = useMemo<CompletedItem[]>(
    () =>
      completionsToItems(
        dayDetail.data?.completions ?? [],
        (id) => activeById.get(id),
        taskFromCompletionSnapshot,
      ),
    [dayDetail.data, activeById],
  );

  const isLoading = tasks.isLoading || dayDetail.isLoading;
  // Counts OWNED practices, not the day-filtered list: the empty state says
  // "create your first practice", a lie to someone whose catalog is simply
  // done for the day.
  const hasAny = (tasks.data ?? []).length > 0 || completedItems.length > 0;

  const renderCard = (task: TaskWithSubs) => (
    <TaskCard
      key={task.id}
      task={task}
      onComplete={() => handleQuickComplete(task)}
      onLongPress={() => setSheetTask(task)}
      onSwipeComplete={() => setSheetTask(task)}
      onEdit={() => router.push({ pathname: '/task-form', params: { id: task.id } })}
    />
  );

  return (
    <View style={styles.wrap}>
      <ScreenTip id="allPractices" />
      <Text style={styles.lead}>
        {isToday
          ? t('allPractices.lead')
          : t('allPractices.loggingFor', { date: formatLongDate(selectedDate) })}
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
          {recurring.map(renderCard)}
          {dailies.length > 0 && (
            <DailiesBlock
              count={dailies.length}
              open={dailiesOpen}
              onToggle={() => {
                Haptics.selectionAsync().catch(() => {});
                setDailiesOpen((v) => !v);
              }}
              title={t('allPractices.dailies')}
            >
              {dailies.map(renderCard)}
            </DailiesBlock>
          )}
          {completedItems.length > 0 && (
            <CompletedBucket
              items={completedItems}
              title={isToday ? t('home.completedBucket.today') : t('home.completedBucket.day')}
              onUndo={handleUndo}
              onExtra={handleQuickComplete}
            />
          )}
        </View>
      )}

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
    </View>
  );
}

/**
 * Collapsed "Diárias" header — the Concluídas drawer's anatomy (title, count
 * chip, chevron) so the two expandable rows read as siblings. Open, the
 * cards render under it at full size.
 */
function DailiesBlock({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const chevron = useDerivedValue(() =>
    withSpring(open ? 180 : 0, { damping: 18, stiffness: 220 }),
  );
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value}deg` }],
  }));
  return (
    <View style={styles.dailiesWrap}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.dailiesHeader, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.dailiesLeft}>
          <Text style={styles.dailiesTitle}>{title}</Text>
          <View style={styles.dailiesChip}>
            <Text style={styles.dailiesCount}>{count}</Text>
          </View>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={16} color={tokens.text.dim} />
        </Animated.View>
      </Pressable>
      {open ? <View style={styles.lists}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: tokens.space[4] },
  lead: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    paddingBottom: tokens.space[3],
  },
  lists: { gap: tokens.space[2] },
  // Flush with the cards and radius.md, exactly like the Concluídas drawer
  // (CompletedBucket) it mirrors — the two rows stay siblings.
  dailiesWrap: {
    marginTop: tokens.space[2],
    gap: tokens.space[2],
  },
  dailiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  dailiesLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  dailiesTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  dailiesChip: {
    backgroundColor: tokens.bg.surface2,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  dailiesCount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    color: tokens.brand.violet2,
  },
  loadingBox: { paddingVertical: tokens.space[10], alignItems: 'center' },
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
