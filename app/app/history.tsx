import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { CalendarActiveFilters } from '@/components/calendar/CalendarActiveFilters';
import { CalendarDayPanel } from '@/components/calendar/CalendarDayPanel';
import { CalendarFilterSheet } from '@/components/calendar/CalendarFilterSheet';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { CalendarSummary } from '@/components/calendar/CalendarSummary';
import { CompleteTaskSheet } from '@/components/CompleteTaskSheet';
import { FabStack } from '@/components/FabStack';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TaskActionSheet } from '@/components/TaskActionSheet';
import { XPCoinFloat } from '@/components/XPCoinFloat';
import {
  endOfMonth,
  startOfMonth,
  useCalendarMonth,
  useCalendarRange,
} from '@/lib/api/calendar';
import { dateKeyFromLocal, historyKeys, useDayDetail } from '@/lib/api/history';
import { useMoodTags } from '@/lib/api/mood';
import {
  useCompleteTask,
  useSkipTaskToday,
  useUndoCompletion,
  useUnskipTaskToday,
} from '@/lib/api/tasks';
import {
  activeFacetCount,
  dayMatchesFilter,
  isFilterActive,
  summarize,
  type CalendarDay,
} from '@/lib/calendar/filters';
import { applyFilterSeed, useCalendarStore, type CalendarFront, type CalendarView } from '@/lib/calendar/store';
import type { DimensionId, SubId, TaskSub, TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { formatHeroDate } from '@/lib/time';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUB_META } from '@/theme/dimensions';

/**
 * The calendar. One grid, three fronts, one filter.
 *
 * This screen replaces what used to be three: Rotina (this route), Dedicação
 * (`/dedicacao-history`) and Insights (`/insights`). They were three screens
 * because each owned a different reading of the same days; they are now three
 * *fronts* over one grid, because the days never differed — only the question
 * did. Both old routes survive as thin redirects that translate their params
 * into this screen's filter.
 *
 * The architecture is three orthogonal axes, each with exactly one home:
 *
 *   front  — what the grid paints        (the segmented control)
 *   filter — which days count            (the floating funnel; see lib/calendar/filters.ts)
 *   period — where you are               (the month arrows)
 *
 * Keeping period out of the filter is what stops the calendar from having two
 * competing notions of "when", which is exactly the collision the old
 * Dedicação filters would have caused with a per-practice filter here.
 */

const EMPTY_DAYS: Map<string, CalendarDay> = new Map();

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

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

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

const VALID_DIMS = new Set<string>(DIMENSION_ORDER);
const VALID_SUBS = new Set<string>(Object.keys(SUB_META));

export default function CalendarScreen() {
  const { t, locale } = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const settings = useLoadedSettings();
  const bottomClearance = useBottomSafeClearance();

  const front = useCalendarStore((s) => s.front);
  const setFront = useCalendarStore((s) => s.setFront);
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const filter = useCalendarStore((s) => s.filter);

  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [filterOpen, setFilterOpen] = useState(false);
  const [sheetTask, setSheetTask] = useState<TaskWithSubs | null>(null);
  const [actionTask, setActionTask] = useState<TaskWithSubs | null>(null);
  const [floats, setFloats] = useState<{ id: number; xp: number; coins: number }[]>([]);

  // --- deep-link seed ------------------------------------------------------
  // `/dedicacao-history` redirects here with its old params. Seed once: a link
  // is a destination, and re-applying it on every render would fight the user.
  const params = useLocalSearchParams<{
    dims?: string;
    subs?: string;
    minXp?: string;
    front?: string;
    view?: string;
  }>();
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    // Front and view travel in the URL so a deep link is self-describing.
    // Without this a link promising "this dimension's dedication" would land on
    // whatever front and view the session-scoped store happened to hold — the
    // Vault quarter map, say, with no XP anywhere on screen.
    if (params.front === 'rotina' || params.front === 'humor' || params.front === 'vault') {
      setFront(params.front);
    }
    if (params.view === 'month' || params.view === 'list') {
      setView(params.view);
    }
    const dims = (params.dims ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => VALID_DIMS.has(v)) as DimensionId[];
    const subs = (params.subs ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => VALID_SUBS.has(v)) as SubId[];
    const minXp = Math.max(0, Number.parseInt(params.minXp ?? '', 10) || 0);
    if (dims.length > 0 || subs.length > 0 || minXp > 0) {
      applyFilterSeed({ dims, subs, minXp });
    }
    // `setFront`/`setView` are stable Zustand actions; the effect is a one-shot
    // guarded by `seeded`, so only the params belong in the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.dims, params.subs, params.minXp, params.front, params.view]);

  // --- data ----------------------------------------------------------------
  const monthQuery = useCalendarMonth(visibleMonth);
  // The list reaches back three months so scrolling it is worth doing. Gated on
  // the view: the month is the default and should never pay for a range it is
  // not showing.
  const listQuery = useCalendarRange(
    addMonths(visibleMonth, -2),
    endOfMonth(visibleMonth),
    view === 'list',
  );

  const source = view === 'month' ? monthQuery : listQuery;
  const days = source.data?.days ?? EMPTY_DAYS;
  const reference = source.data?.reference ?? 100;

  const moodTags = useMoodTags();
  const tagEmojis = useMemo(() => {
    const map = new Map<string, string>();
    for (const tag of moodTags.data ?? []) if (tag.emoji) map.set(tag.slug, tag.emoji);
    return map;
  }, [moodTags.data]);
  const tagLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const tag of moodTags.data ?? []) {
      map.set(tag.slug, locale === 'pt' ? tag.label_pt : tag.label_en);
    }
    return map;
  }, [moodTags.data, locale]);

  /**
   * Practices seen in the loaded range, most-logged first — the filter's menu.
   * The count is not shown any more (it made every row longer to say something
   * the ordering already says) but it still decides that ordering.
   */
  const practices = useMemo(() => {
    const counts = new Map<
      string,
      { taskId: string; title: string; count: number; dim: DimensionId | null }
    >();
    for (const day of days.values()) {
      for (const p of day.practices) {
        if (!p.title) continue;
        const seen = counts.get(p.taskId);
        if (seen) seen.count += p.count;
        else {
          counts.set(p.taskId, {
            taskId: p.taskId,
            title: p.title,
            count: p.count,
            dim: p.dims[0] ?? null,
          });
        }
      }
    }
    return [...counts.values()].sort(
      (a, b) => b.count - a.count || a.title.localeCompare(b.title),
    );
  }, [days]);

  const taskTitles = useMemo(
    () => new Map(practices.map((p) => [p.taskId, p.title])),
    [practices],
  );

  /** Rewards seen in the loaded range, most-redeemed first. */
  const rewards = useMemo(() => {
    const counts = new Map<
      string,
      { rewardId: string; title: string; icon: string | null; count: number }
    >();
    for (const day of days.values()) {
      for (const r of day.redemptions) {
        if (!r.title) continue;
        const seen = counts.get(r.rewardId);
        if (seen) seen.count += 1;
        else counts.set(r.rewardId, { rewardId: r.rewardId, title: r.title, icon: r.icon, count: 1 });
      }
    }
    return [...counts.values()].sort(
      (a, b) => b.count - a.count || a.title.localeCompare(b.title),
    );
  }, [days]);

  const rewardTitles = useMemo(
    () => new Map(rewards.map((r) => [r.rewardId, r.title])),
    [rewards],
  );

  const totals = useMemo(() => summarize(days.values(), filter), [days, filter]);

  const dimXp = useMemo(() => {
    const acc = Object.fromEntries(DIMENSION_ORDER.map((d) => [d, 0])) as Record<
      DimensionId,
      number
    >;
    for (const day of days.values()) {
      if (!dayMatchesFilter(day, filter)) continue;
      for (const dim of DIMENSION_ORDER) acc[dim] += day.xpByDim[dim] ?? 0;
    }
    return acc;
  }, [days, filter]);

  const listDays = useMemo(
    () => [...days.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    [days],
  );

  // The day query, mounted here purely so pull-to-refresh and the spinner can
  // see it. `CalendarDayPanel` asks for the same key, so React Query dedupes:
  // no extra request, and no prop drilling of a refetch handle.
  const dayQuery = useDayDetail(selected, settings.weekStart);

  // Invalidating `historyKeys.all` rather than `calendarKeys.all`: the latter is
  // a child of the former, so it would miss the day query
  // (`['history','day',…]`) — which is what left the open list stale after
  // coming back from /task-form or a mood check-in.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    }, [queryClient]),
  );

  // --- mutations -----------------------------------------------------------
  const completeTask = useCompleteTask();
  const skipTask = useSkipTaskToday();
  const unskipTask = useUnskipTaskToday();
  const undoCompletion = useUndoCompletion();

  const dayKey = dateKeyFromLocal(selected);
  const isToday = dayKey === dateKeyFromLocal(new Date());

  const fireRetroCompletion = (task: TaskWithSubs, subs: TaskSub[]) => {
    if (completeTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const reward = rewardForTaskSubs(subs);
    const fid = Date.now();
    setFloats((prev) => [...prev, { id: fid, xp: reward.total.xp, coins: reward.total.coins }]);

    const stamp = new Date(selected);
    stamp.setHours(12, 0, 0, 0); // noon local — sidesteps day-boundary timezone wobble.
    completeTask.mutate(
      {
        task,
        subs,
        completedAt: stamp.toISOString(),
        completedLocalDate: dayKey,
      },
      {
        onError: (err) => {
          const e = err as { message?: string };
          showInfo(t('historyScreen.errLog'), e.message ?? t('common.unknownError'));
        },
      },
    );
  };

  const handleRetroComplete = (task: TaskWithSubs, subs?: TaskSub[]) => {
    fireRetroCompletion(task, subs ?? task.subs);
  };

  const handleUndo = async (completionId: string, title: string, xp: number, coins: number) => {
    const ok = await confirmAction(
      t('calendar.day.undoTitle'),
      t('calendar.day.undoBody', { title, xp, coins }),
      {
        okText: t('calendar.day.undoConfirm'),
        cancelText: t('calendar.day.undoCancel'),
        destructive: true,
      },
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

  const handleSkip = (task: TaskWithSubs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    skipTask.mutate(
      { taskId: task.id, date: dayKey },
      {
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
        onError: (err) => {
          const e = err as { message?: string };
          showInfo(t('historyScreen.errUnskip'), e.message ?? t('common.unknownError'));
        },
      },
    );
  };

  // --- navigation ----------------------------------------------------------
  const today = new Date();
  const canGoNextMonth =
    visibleMonth.getFullYear() < today.getFullYear() ||
    (visibleMonth.getFullYear() === today.getFullYear() &&
      visibleMonth.getMonth() < today.getMonth());

  const handleSelectDay = (d: Date) => {
    setSelected(d);
    if (!isSameMonth(d, visibleMonth)) setVisibleMonth(startOfMonth(d));
  };

  /**
   * Move the visible month AND carry the selection with it.
   *
   * The two have to stay in the same month. The day panel's rewards come from
   * the month feed, so a selection left behind in August while the grid shows
   * July reads that day out of July's map, finds nothing, and reports "no
   * redemptions" for a day that has some — while the panel's own day query
   * keeps showing August's practices and header. The grid also loses its
   * selection ring, because no visible cell matches the selected key.
   *
   * Landing day: the last day of the target month, or today when that month is
   * the current one. Keeping the day-of-month instead would routinely land on a
   * future date (Aug 31 → stepping into a month still in progress), which the
   * grid itself refuses to select.
   */
  const goToMonth = (month: Date) => {
    const first = startOfMonth(month);
    setVisibleMonth(first);
    if (isSameMonth(selected, first)) return;
    const lastOfMonth = startOfDay(new Date(first.getFullYear(), first.getMonth() + 1, 0));
    const todayStart = startOfDay(new Date());
    setSelected(lastOfMonth.getTime() > todayStart.getTime() ? todayStart : lastOfMonth);
  };

  const goToToday = () => {
    const now = startOfDay(new Date());
    setSelected(now);
    setVisibleMonth(startOfMonth(now));
  };

  const stepDay = (delta: number) => {
    const next = addDays(selected, delta);
    if (delta > 0 && next.getTime() > Date.now()) return;
    setSelected(next);
    if (!isSameMonth(next, visibleMonth)) setVisibleMonth(startOfMonth(next));
  };

  const toggleView = (target: CalendarView) => {
    Haptics.selectionAsync().catch(() => {});
    setView(view === target ? 'month' : target);
  };

  const facets = activeFacetCount(filter);
  const filtering = isFilterActive(filter);
  const selectedDay = monthQuery.data?.days.get(dayKey);

  const dayLabel = useMemo(() => {
    const intlTag = locale === 'pt' ? 'pt-BR' : 'en-US';
    const raw = selected.toLocaleDateString(intlTag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [selected, locale]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomClearance + 72 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={source.isRefetching || dayQuery.isRefetching}
              onRefresh={() => {
                source.refetch();
                dayQuery.refetch();
              }}
              tintColor={tokens.brand.violet2}
            />
          }
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>{t('calendar.eyebrow')}</Text>
              <Text style={styles.title}>{t('historyScreen.title')}</Text>
            </View>
            <Pressable
              onPress={() => toggleView('list')}
              style={({ pressed }) => [
                styles.iconBtn,
                view === 'list' && styles.iconBtnActive,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityState={{ selected: view === 'list' }}
              accessibilityLabel={t('calendar.views.list')}
            >
              <Ionicons
                name="list-outline"
                size={19}
                color={view === 'list' ? tokens.brand.violet2 : tokens.text.hi}
              />
            </Pressable>
          </View>

          <View style={styles.fronts}>
            <SegmentedControl<CalendarFront>
              options={[
                { value: 'rotina', label: t('calendar.fronts.rotina') },
                { value: 'humor', label: t('calendar.fronts.humor') },
                { value: 'vault', label: t('calendar.fronts.vault') },
              ]}
              value={front}
              onChange={(next) => {
                Haptics.selectionAsync().catch(() => {});
                setFront(next);
              }}
            />
          </View>

          <CalendarActiveFilters
            filter={filter}
            taskTitles={taskTitles}
            tagLabels={tagLabels}
            rewardTitles={rewardTitles}
          />

          {source.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          ) : view === 'month' ? (
            <>
              <View style={styles.card}>
                <CalendarGrid
                  monthDate={visibleMonth}
                  days={days}
                  reference={reference}
                  front={front}
                  filter={filter}
                  selectedKey={dayKey}
                  onSelectDay={handleSelectDay}
                  onPrevMonth={() => goToMonth(addMonths(visibleMonth, -1))}
                  onNextMonth={() => goToMonth(addMonths(visibleMonth, 1))}
                  canGoNext={canGoNextMonth}
                  weekStart={settings.weekStart}
                  tagEmojis={tagEmojis}
                />
                <CalendarSummary
                  totals={totals}
                  front={front}
                  filtering={filtering}
                  dimXp={dimXp}
                  locale={locale}
                />
              </View>

              <View style={styles.dayNav}>
                <Pressable
                  onPress={() => stepDay(-1)}
                  style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.dayNav.prev')}
                >
                  <Ionicons name="chevron-back" size={20} color={tokens.text.hi} />
                </Pressable>
                <View style={styles.dayLabelWrap}>
                  <Text style={styles.dayLabel}>{dayLabel}</Text>
                  {!isToday && (
                    <Pressable onPress={goToToday} hitSlop={8}>
                      <Text style={styles.todayLink}>{t('common.today')}</Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  onPress={() => stepDay(1)}
                  disabled={isToday}
                  style={({ pressed }) => [
                    styles.navBtn,
                    isToday && styles.navBtnDisabled,
                    pressed && !isToday && { opacity: 0.6 },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.dayNav.next')}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isToday ? tokens.text.faint : tokens.text.hi}
                  />
                </Pressable>
              </View>

              <CalendarDayPanel
                date={selected}
                front={front}
                redemptions={selectedDay?.redemptions ?? []}
                weekStart={settings.weekStart}
                isMutating={completeTask.isPending || skipTask.isPending}
                onRetroComplete={handleRetroComplete}
                onSwipeComplete={setSheetTask}
                onSkip={handleSkip}
                onUnskip={handleUnskip}
                onLongPress={setActionTask}
                onEdit={(task) =>
                  router.push({ pathname: '/task-form', params: { id: task.id } })
                }
                onUndo={handleUndo}
              />
            </>
          ) : (
            <CalendarListView
              days={listDays}
              front={front}
              filter={filter}
              onSelectDay={(key) => {
                const [y, m, d] = key.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                setVisibleMonth(startOfMonth(date));
                setSelected(date);
                setView('month');
              }}
              locale={locale}
            />
          )}
        </ScrollView>
      </ScreenBackground>

      <FabStack
        bottomOffset={bottomClearance}
        actions={[
          {
            key: 'filter',
            icon: 'options-outline',
            onPress: () => {
              Haptics.selectionAsync().catch(() => {});
              setFilterOpen(true);
            },
            accessibilityLabel: t('calendar.filter.open'),
            size: 'lg',
            tone: 'violet',
            wrap: (node) => (
              <View>
                {node}
                {facets > 0 && (
                  <View style={styles.badge} pointerEvents="none">
                    <Text style={styles.badgeText}>{facets}</Text>
                  </View>
                )}
              </View>
            ),
          },
        ]}
      />

      {floats.map((f) => (
        <XPCoinFloat
          key={f.id}
          xp={f.xp}
          coins={f.coins}
          onDone={() => setFloats((prev) => prev.filter((x) => x.id !== f.id))}
        />
      ))}

      <CalendarFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        practices={practices}
        rewards={rewards}
      />

      <CompleteTaskSheet
        visible={sheetTask !== null}
        task={sheetTask}
        onCancel={() => setSheetTask(null)}
        onConfirm={(subs) => {
          const task = sheetTask;
          setSheetTask(null);
          if (task) fireRetroCompletion(task, subs);
        }}
      />

      <TaskActionSheet
        visible={actionTask !== null}
        taskTitle={actionTask?.title ?? ''}
        dateLabel={isToday ? undefined : formatHeroDate(selected).monthDay}
        onCancel={() => setActionTask(null)}
        onAdjustStars={() => {
          const task = actionTask;
          setActionTask(null);
          setSheetTask(task);
        }}
        onSkipToday={() => {
          const task = actionTask;
          setActionTask(null);
          if (task) handleSkip(task);
        }}
        onEdit={() => {
          const task = actionTask;
          setActionTask(null);
          if (task) router.push({ pathname: '/task-form', params: { id: task.id } });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  content: { padding: tokens.space[4] },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.space[2],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[4],
  },
  headerText: { flex: 1, minWidth: 0 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { ...tokens.type.h1, color: tokens.text.hi, marginTop: 2 },
  fronts: { marginBottom: tokens.space[3] },
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[4],
  },
  loading: { paddingVertical: tokens.space[8], alignItems: 'center' },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.space[5],
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  dayLabelWrap: { flex: 1, alignItems: 'center', gap: 2 },
  dayLabel: { ...tokens.type.h3, color: tokens.text.hi, textAlign: 'center' },
  todayLink: {
    ...tokens.type.caption,
    color: tokens.brand.violet2,
    fontFamily: 'Manrope_700Bold',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
    borderWidth: 2,
    borderColor: tokens.bg.deep,
  },
  badgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: '#1A1400',
  },
});
