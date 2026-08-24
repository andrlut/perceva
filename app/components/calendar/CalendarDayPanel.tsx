import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CompletedBucket, completionsToItems, type CompletedItem } from '@/components/CompletedBucket';
import { DaySeal } from '@/components/DaySeal';
import { DayXpStat } from '@/components/DayXpStat';
import { MoodDayDetail } from '@/components/mood/MoodDayDetail';
import { TaskCard } from '@/components/TaskCard';
import {
  dateKeyFromLocal,
  taskFromCompletionSnapshot,
  useDayDetail,
} from '@/lib/api/history';
import { useActiveTasks } from '@/lib/api/tasks';
import type { CalendarRedemption } from '@/lib/calendar/filters';
import type { CalendarFront } from '@/lib/calendar/store';
import type { TaskSub, TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import type { WeekStart } from '@/lib/settings';
import { tokens } from '@/theme';
import { useMemo } from 'react';

/**
 * The day panel — **the same three blocks on every front.**
 *
 * Switching fronts does not rebuild this: the practices, the mood and the
 * rewards are always all here, in a fixed order, and the active front only
 * moves the accent on the section headers. A day is one story; showing a third
 * of it because a chip is set would make the user tap around to reconstruct
 * something they already asked to see. It also means the retro-log — the thing
 * this screen is actually used for — is never more than a scroll away.
 *
 * The panel owns its own `useDayDetail` query on purpose. The month grid feeds
 * from `useCalendarRange` and is already cached when a chip flips; making the
 * (heavier, four-round-trip) day read a separate query keeps it off the
 * critical path of front and month navigation — the grid never waits for it.
 *
 * **The retro-log is never filtered.** The filter is an analytical instrument;
 * the list of practices still open on a day is an operational one. Hiding an
 * open practice because a chip is set would read as a missing task, not as a
 * filtered view.
 */

interface Props {
  date: Date;
  front: CalendarFront;
  /** Reward events for this day, already in hand from the month feed. */
  redemptions: CalendarRedemption[];
  weekStart: WeekStart;
  /** Blocks the DaySeal from asserting "nothing was scheduled" mid-write. */
  isMutating: boolean;
  onRetroComplete: (task: TaskWithSubs, subs?: TaskSub[]) => void;
  onSwipeComplete: (task: TaskWithSubs) => void;
  onSkip: (task: TaskWithSubs) => void;
  onUnskip: (taskId: string) => void;
  onLongPress: (task: TaskWithSubs) => void;
  onEdit: (task: TaskWithSubs) => void;
  onUndo: (completionId: string, title: string, xp: number, coins: number) => void;
}

export function CalendarDayPanel({
  date,
  front,
  redemptions,
  weekStart,
  isMutating,
  onRetroComplete,
  onSwipeComplete,
  onSkip,
  onUnskip,
  onLongPress,
  onEdit,
  onUndo,
}: Props) {
  const { t } = useT();
  const router = useRouter();
  const dayKey = dateKeyFromLocal(date);
  const todayKey = dateKeyFromLocal(new Date());
  const isToday = dayKey === todayKey;

  const day = useDayDetail(date, weekStart);
  const activeTasks = useActiveTasks();
  const activeById = useMemo(
    () => new Map((activeTasks.data ?? []).map((task) => [task.id, task])),
    [activeTasks.data],
  );

  // useDayDetail already applies the shared isOpenOnDay rule, so this is the
  // only judgement left to this surface: one-shots live behind "all practices".
  const open = (day.data?.openTasks ?? []).filter((task) => task.recurrence.type !== 'one_shot');
  const doneItems: CompletedItem[] = completionsToItems(
    day.data?.completions ?? [],
    (id) => activeById.get(id),
    taskFromCompletionSnapshot,
  );
  const skippedItems: CompletedItem[] = (day.data?.skipped ?? []).map((task) => ({ task }));

  return (
    <View>
      <View style={styles.xpWrap}>
        <DayXpStat xp={day.data?.totalXp ?? 0} isToday={isToday} />
      </View>

      <SectionHeader label={t('calendar.day.mood')} active={front === 'humor'} />
      <MoodDayDetail dateKey={dayKey} />

      <SectionHeader
        label={
          (day.data?.totalXp ?? 0) > 0
            ? t('calendar.day.practicesXp', { xp: day.data?.totalXp ?? 0 })
            : t('calendar.day.practices')
        }
        active={front === 'rotina'}
      />
      {day.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tokens.brand.violet2} />
        </View>
      ) : (
        <View style={styles.practices}>
          {open.length === 0 ? (
            <DaySeal
              key={dayKey}
              completions={day.data?.completions ?? []}
              skippedCount={skippedItems.length}
              isToday={isToday}
              // `isSuccess`, not `!isLoading`: a failed or paused query leaves
              // data undefined with isLoading false, and the seal would then
              // assert "nothing was scheduled" about a day it never read.
              settled={
                day.isSuccess && day.data?.dateKey === dayKey && !day.isFetching && !isMutating
              }
            />
          ) : (
            open.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => onRetroComplete(task)}
                onSwipeComplete={() => onSwipeComplete(task)}
                onSkip={() => onSkip(task)}
                onLongPress={() => onLongPress(task)}
                onEdit={() => onEdit(task)}
              />
            ))
          )}

          <Pressable
            onPress={() => router.push({ pathname: '/all-practices', params: { date: dayKey } })}
            style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <Ionicons name="albums-outline" size={16} color={tokens.brand.violet2} />
            <Text style={styles.seeAllText}>{t('home.seeAllCta')}</Text>
          </Pressable>

          <CompletedBucket
            items={doneItems}
            title={isToday ? t('home.completedBucket.today') : t('home.completedBucket.day')}
            onUndo={(completionId) => {
              const c = day.data?.completions.find((x) => x.id === completionId);
              onUndo(completionId, c?.taskTitle ?? '', c?.xpGranted ?? 0, c?.coinsGranted ?? 0);
            }}
            onExtra={onRetroComplete}
          />
          <CompletedBucket
            items={skippedItems}
            title={isToday ? t('home.skippedBucket.today') : t('home.skippedBucket.day')}
            variant="skipped"
            onUnskip={onUnskip}
          />
        </View>
      )}

      <SectionHeader label={t('calendar.day.rewards')} active={front === 'vault'} />
      <View style={styles.rewards}>
        {redemptions.length === 0 ? (
          <Text style={styles.empty}>{t('calendar.day.noRewards')}</Text>
        ) : (
          redemptions.map((r) => (
            <View key={r.id} style={styles.rewardRow}>
              <View style={styles.rewardIcon}>
                <Ionicons
                  name={(r.icon ?? 'gift') as keyof typeof Ionicons.glyphMap}
                  size={15}
                  color={tokens.semantic.coin}
                />
              </View>
              <View style={styles.rewardText}>
                <Text style={styles.rewardTitle} numberOfLines={1}>
                  {r.kind === 'redeem'
                    ? t('calendar.day.redeemed', { title: r.title })
                    : t('calendar.day.used', { title: r.title })}
                </Text>
                <Text style={styles.rewardSub} numberOfLines={1}>
                  {r.kind === 'redeem' ? t('calendar.day.redeemedSub') : t('calendar.day.usedSub')}
                </Text>
              </View>
              {r.kind === 'redeem' ? (
                <Text style={styles.rewardCost}>{`−${r.cost}`}</Text>
              ) : (
                <Ionicons name="checkmark" size={16} color={tokens.semantic.xp} />
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

/**
 * The only thing the active front changes down here. A rail or a tinted card
 * would nest a card inside a card — `MoodDayDetail` and `CompletedBucket` each
 * draw their own — so the accent lives on the header instead.
 */
function SectionHeader({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      {active && <View style={styles.activeDot} />}
      <Text style={[styles.sectionLabel, active && styles.sectionLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  xpWrap: { marginBottom: tokens.space[2] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: tokens.space[4],
    marginBottom: tokens.space[2],
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: tokens.brand.violet2,
  },
  sectionLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  sectionLabelActive: { color: tokens.brand.violet2 },
  loading: { paddingVertical: tokens.space[6], alignItems: 'center' },
  practices: { gap: tokens.space[2] },
  seeAll: {
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
  rewards: { gap: tokens.space[2] },
  empty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.faint,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  rewardIcon: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.xs,
    backgroundColor: 'rgba(255, 200, 61, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardText: { flex: 1, minWidth: 0 },
  rewardTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    color: tokens.semantic.coinLight,
  },
  rewardSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.dim,
    marginTop: 1,
  },
  rewardCost: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12.5,
    color: tokens.semantic.coin,
  },
});
