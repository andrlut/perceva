import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useIsFocused } from '@react-navigation/native';

import { AddCard } from '@/components/AddCard';
import {
  AdoptPeriodicitySheet,
  adoptChoiceToOverrides,
  type AdoptPeriodicityChoice,
} from '@/components/AdoptPeriodicitySheet';
import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { BucketTabsV2 } from '@/components/BucketTabsV2';
import { CoinIcon } from '@/components/CoinIcon';
import { EmptyHero } from '@/components/EmptyHero';
import { PeriodicitySheet } from '@/components/PeriodicitySheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SubColoredPips } from '@/components/SubColoredPips';
import { SubStack } from '@/components/SubStack';
import { LimitCounterBadge } from '@/components/premium/LimitCounterBadge';
import { TourModule } from '@/components/tour/TourModule';
import { TourTarget } from '@/components/tour/TourTarget';
import {
  useActiveTasks,
  useArchivedTasks,
  useDeleteTask,
  useReorderTasks,
  useRestoreTask,
  useSetTaskRecurrence,
  useStartTaskFromTemplate,
  useTaskTemplates,
} from '@/lib/api/tasks';
import type {
  DimensionId,
  Recurrence,
  SubId,
  TaskTemplateWithSubs,
  TaskWithSubs,
} from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import {
  freeLimitEntity,
  useLimitModalStore,
  useTaskLimit,
  type EntityLimit,
} from '@/lib/premium';
import { describeRecurrence, isEffectivelyDaily } from '@/lib/recurrence';
import { emitTourEvent } from '@/lib/tour/eventBus';
import { buildM2Steps, M2_EVENTS } from '@/lib/tour/m2Steps';
import { useIsCurrentTourModule, useTourStore } from '@/lib/tour/store';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import { rewardForTaskSubs } from '@/lib/xp';
import { ACTIVE_THEME, tokens } from '@/theme';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

type Tab = 'mine' | 'suggested';
type Bucket = 'daily' | 'weekly' | 'one_time';
type DimFilter = DimensionId | 'all';

/** Boot-time theme flag — the light palette needs text-grade accents
 *  (TaskCard makes the same call for its coin figure). */
const LIGHT = ACTIVE_THEME === 'light';

interface BucketMeta {
  id: Bucket;
  labelKey: string;
  descKey: string;
  iconName: keyof typeof Ionicons.glyphMap;
  /** Accent for NON-text: section icon, count chip, the periodicity chip's
   *  border and chevron. 3:1 is enough there. Always a 6-digit hex so the
   *  `${accent}66` alpha suffix works. */
  accent: string;
  /** Text-grade accent for the 11px eyebrow. The fill gold misses AA on
   *  porcelain, so light swaps it for the palette's text gold. */
  accentText: string;
  /** Wash behind the icon tile and the chip — theme-swapped tokens, never
   *  literals (a literal never follows the light theme). */
  accentBg: string;
}

const BUCKETS: BucketMeta[] = [
  {
    id: 'daily',
    labelKey: 'tasksHub.buckets.daily',
    descKey: 'tasksHub.buckets.dailyDesc',
    iconName: 'sunny',
    accent: tokens.brand.violet2,
    accentText: tokens.brand.violet2,
    accentBg: tokens.dimensionBg.mind,
  },
  {
    id: 'weekly',
    labelKey: 'tasksHub.buckets.weekly',
    descKey: 'tasksHub.buckets.weeklyDesc',
    iconName: 'calendar',
    accent: tokens.dimension.bonds,
    accentText: tokens.dimension.bonds,
    accentBg: tokens.dimensionBg.bonds,
  },
  {
    id: 'one_time',
    labelKey: 'tasksHub.buckets.oneTime',
    descKey: 'tasksHub.buckets.oneTimeDesc',
    iconName: 'flag',
    accent: tokens.semantic.coin,
    accentText: LIGHT ? tokens.semantic.coinDeep : tokens.semantic.coin,
    accentBg: tokens.dimensionBg.wealth,
  },
];

const BUCKET_BY_ID: Record<Bucket, BucketMeta> = {
  daily: BUCKETS[0]!,
  weekly: BUCKETS[1]!,
  one_time: BUCKETS[2]!,
};

/**
 * Which group a practice lives in, decided by its recurrence — the
 * periodicity chip on each row is the ONLY way to move it (the type row
 * of the sheet maps 1:1 onto these groups). Weekly-all-7-days collapses
 * into Daily so the user isn't surprised.
 */
function bucketFor(rec: Recurrence): Bucket {
  if (rec.type === 'one_shot') return 'one_time';
  if (isEffectivelyDaily(rec)) return 'daily';
  return 'weekly'; // weekly (subset or flex) OR monthly
}

/** Subs in display order, grouped under their dim. */
const ALL_SUBS_IN_ORDER: SubId[] = DIMENSION_ORDER.flatMap((d) => SUBS_BY_DIM[d]);

export default function TasksHubScreen() {
  const router = useRouter();
  const { t } = useT();
  const taskLimit = useTaskLimit();
  const openLimit = useLimitModalStore((s) => s.open);
  const bottomClearance = useBottomSafeClearance();

  const tasks = useActiveTasks();
  const archived = useArchivedTasks();
  const templates = useTaskTemplates();
  const reorderTasks = useReorderTasks();
  const startFromTemplate = useStartTaskFromTemplate();
  const setRecurrence = useSetTaskRecurrence();
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();

  // Returns whether navigation actually happened — the M2 tour advance
  // MUST only fire on a real navigation, otherwise the module steps into
  // the form screen that never mounts and jams the whole tour (the
  // sequential current-module gate then hides M3+ forever).
  const handleCreateTask = (): boolean => {
    if (taskLimit.atLimit) {
      openLimit('task');
      return false;
    }
    router.push('/task-form');
    return true;
  };

  const isM2Current = useIsCurrentTourModule('M2');
  const isFocused = useIsFocused();
  const m2StepIndex = useTourStore((s) => s.stepIndices.M2 ?? 0);
  const setStepIndex = useTourStore((s) => s.setStepIndex);

  // M2 self-heal: the step-2 "Me leva lá" CTA advances the index BEFORE
  // the navigation callback runs, and the free-limit gate may refuse to
  // open the form. If the index points at form steps (2+) while this
  // screen still holds focus after a grace period, the form never
  // mounted — walk back to the "+" step instead of stranding the module
  // (a stuck M2 hides every later module via the current-module gate).
  useEffect(() => {
    if (!isM2Current || !isFocused || m2StepIndex < 2) return;
    const id = setTimeout(() => setStepIndex('M2', 1), 1200);
    return () => clearTimeout(id);
  }, [isM2Current, isFocused, m2StepIndex, setStepIndex]);

  // Coming BACK to this screen (from the form, from Home) pulls the lists
  // again. Mutations already invalidate, and the root layout refetches on
  // app foreground; this covers the navigation-return case TanStack can't
  // see. The first focus is the mount — the queries are fetching already.
  const focusedOnce = useRef(false);
  const refetchTasks = tasks.refetch;
  const refetchArchived = archived.refetch;
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      void refetchTasks();
      void refetchArchived();
    }, [refetchTasks, refetchArchived]),
  );

  const [tab, setTab] = useState<Tab>('mine');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<Bucket, boolean>>({
    daily: false,
    weekly: false,
    one_time: false,
  });
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [dimFilter, setDimFilter] = useState<DimFilter>('all');
  // Suggested groups start COLLAPSED — 12 open groups × 3 templates read
  // as a wall (tester feedback). Picking a dimension or searching
  // force-expands (see SuggestedBody).
  const [collapsedSubs, setCollapsedSubs] = useState<Record<SubId, boolean>>(
    () =>
      Object.fromEntries(ALL_SUBS_IN_ORDER.map((s) => [s, true])) as Record<
        SubId,
        boolean
      >,
  );
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  /** Template currently sitting in the adopt periodicity sheet. */
  const [pickerTemplate, setPickerTemplate] = useState<TaskTemplateWithSubs | null>(null);
  /** Practice whose periodicity chip opened the re-schedule sheet. */
  const [periodicityTask, setPeriodicityTask] = useState<TaskWithSubs | null>(null);
  /** Archived rows with a restore / delete in flight. A Set, not the
   *  mutation's `variables`: useMutation only reports its LATEST call, so
   *  two quick taps on two rows would free the first row's buttons early. */
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const markBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  // ── Counts (drive the tab chips and the group counts) ─────────────────
  const totalTasks = tasks.data?.length ?? 0;

  const adoptedTemplateIds = useMemo(() => {
    const set = new Set<string>();
    (tasks.data ?? []).forEach((tk) => {
      if (tk.template_id) set.add(tk.template_id);
    });
    return set;
  }, [tasks.data]);

  const suggestedCount = useMemo(
    () => (templates.data ?? []).filter((tp) => !adoptedTemplateIds.has(tp.id)).length,
    [templates.data, adoptedTemplateIds],
  );

  // ── Mine: filter by search, then group by bucket ───────────────────────
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tasks.data ?? []).filter((tk) =>
      q.length === 0 ? true : tk.title.toLowerCase().includes(q),
    );
  }, [tasks.data, query]);

  const tasksByBucket = useMemo(() => {
    const map: Record<Bucket, TaskWithSubs[]> = { daily: [], weekly: [], one_time: [] };
    for (const tk of filteredTasks) map[bucketFor(tk.recurrence)].push(tk);
    return map;
  }, [filteredTasks]);

  // ── Suggested: filter by search + dimension, group by sub ─────────────
  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (templates.data ?? []).filter((tp) => {
      if (dimFilter !== 'all' && tp.primary_dimension_id !== dimFilter) return false;
      if (q.length === 0) return true;
      return (
        tp.title.toLowerCase().includes(q) ||
        (tp.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [templates.data, query, dimFilter]);

  const templatesBySub = useMemo(() => {
    const map = new Map<SubId, TaskTemplateWithSubs[]>();
    for (const tp of filteredTemplates) {
      const arr = map.get(tp.primary_sub_id) ?? [];
      arr.push(tp);
      map.set(tp.primary_sub_id, arr);
    }
    return map;
  }, [filteredTemplates]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleBucket = (b: Bucket) => setCollapsed((prev) => ({ ...prev, [b]: !prev[b] }));

  const toggleSub = (s: SubId) => setCollapsedSubs((prev) => ({ ...prev, [s]: !prev[s] }));

  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery('');
      return !open;
    });
  };

  const handleAdopt = (template: TaskTemplateWithSubs) => {
    if (adoptingId || startFromTemplate.isPending) return;
    if (adoptedTemplateIds.has(template.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPickerTemplate(template);
  };

  // Tap on a suggestion card → open the task form prefilled so the user
  // adjusts and adds in one flow. Deliberately the "customize" path: the
  // saved task is a fork (template_id null) that counts as the user's own —
  // which is what feeds the free-limit → Premium funnel.
  const handleCustomize = (template: TaskTemplateWithSubs) => {
    if (taskLimit.atLimit) {
      openLimit('task');
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/task-form', params: { from_template: template.id } });
  };

  const handleAdoptConfirm = (choice: AdoptPeriodicityChoice) => {
    const template = pickerTemplate;
    setPickerTemplate(null);
    if (!template) return;

    if (choice.kind === 'customize') {
      router.push({ pathname: '/task-form', params: { from_template: template.id } });
      return;
    }

    const overrides = adoptChoiceToOverrides(choice);
    setAdoptingId(template.id);
    startFromTemplate.mutate(
      { templateId: template.id, ...overrides },
      {
        onSettled: () => setAdoptingId(null),
        onError: (err) => {
          // The free cap raises from the insert trigger; the global
          // mutation handler already opened the limit modal.
          if (freeLimitEntity(err)) return;
          const e = err as { message?: string };
          Alert.alert(
            t('tasksHub.errors.couldNotAdoptTitle'),
            e.message ?? t('tasksHub.errors.unknown'),
          );
        },
      },
    );
  };

  const handleOpenPeriodicity = (task: TaskWithSubs) => {
    Haptics.selectionAsync().catch(() => {});
    setPeriodicityTask(task);
  };

  // Closes on tap: the mutation is optimistic on the active list, so the
  // row is already sitting in its new group when the sheet slides away.
  // A failure rolls the cache back and says so.
  const handlePeriodicityConfirm = (recurrence: Recurrence, targetCount: number) => {
    const task = periodicityTask;
    setPeriodicityTask(null);
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRecurrence.mutate(
      { taskId: task.id, recurrence, targetCount },
      {
        onError: (err) => {
          const e = err as { message?: string };
          Alert.alert(
            t('tasksHub.periodicity.saveFail'),
            e.message ?? t('tasksHub.errors.unknown'),
          );
        },
      },
    );
  };

  const handleRestore = async (task: TaskWithSubs) => {
    if (busyIds.has(task.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    markBusy(task.id, true);
    try {
      await restoreTask.mutateAsync(task.id);
    } catch (e) {
      // Restoring past the free cap: the server refuses and the global
      // handler pops the limit modal — no second dialog on top of it.
      if (freeLimitEntity(e)) return;
      const msg = e instanceof Error ? e.message : t('tasksHub.errors.unknown');
      showInfo(t('tasksHub.archived.restoreFail'), msg);
    } finally {
      markBusy(task.id, false);
    }
  };

  const handleDelete = async (task: TaskWithSubs) => {
    if (busyIds.has(task.id)) return;
    const ok = await confirmAction(
      t('tasksHub.archived.deleteConfirmTitle', { title: task.title }),
      t('tasksHub.archived.deleteConfirmBody'),
      {
        okText: t('tasksHub.archived.deleteOk'),
        cancelText: t('common.cancel'),
        destructive: true,
      },
    );
    if (!ok) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    markBusy(task.id, true);
    try {
      await deleteTask.mutateAsync(task.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('tasksHub.errors.unknown');
      // The RPC raises stable English phrases for its two gates (completion
      // history, quest link). Substring match so the localized copy stays
      // the source of truth for the UI text.
      const friendly = msg.includes('completion history')
        ? t('tasksHub.archived.deleteBlockedHistory')
        : msg.includes('referenced by a quest')
          ? t('tasksHub.archived.deleteBlockedQuest')
          : msg;
      showInfo(t('tasksHub.archived.deleteFail'), friendly);
    } finally {
      markBusy(task.id, false);
    }
  };

  const selectDim = (d: DimFilter) => {
    Haptics.selectionAsync().catch(() => {});
    setDimFilter(d);
  };

  // Pull indicator is LOCAL state. The queries' isRefetching also flips on
  // every background refetch — chip change, restore, return from the form,
  // app foreground — which would pop the spinner right after the core
  // interaction of this screen.
  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
    Promise.all([tasks.refetch(), archived.refetch(), templates.refetch()]),
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
          <Text style={styles.title}>{t('tasksHub.title')}</Text>
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
                searchOpen ? t('tasksHub.search.close') : t('tasksHub.search.open')
              }
            >
              <Ionicons
                name={searchOpen ? 'close' : 'search'}
                size={20}
                color={searchOpen ? tokens.brand.violet2 : tokens.text.hi}
              />
            </Pressable>
            <LimitCounterBadge limit={taskLimit} />
            <TourTarget id="tasks.create" radius={999}>
              <Pressable
                onPress={() => {
                  if (handleCreateTask()) {
                    emitTourEvent(M2_EVENTS.CREATE_TASK_TAPPED);
                  }
                }}
                style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('tasksHub.newTask')}
              >
                <Ionicons name="add" size={22} color={tokens.brand.violet2} />
              </Pressable>
            </TourTarget>
          </View>
        </View>

        {/* Tabs + search live outside the body so they stay put while the
            body container swaps between DraggableFlatList (Minhas) and
            ScrollView (Sugeridas). */}
        <BucketTabsV2<Tab>
          tabs={[
            { value: 'mine', label: t('tasksHub.tabs.mine'), count: totalTasks },
            { value: 'suggested', label: t('tasksHub.tabs.suggested'), count: suggestedCount },
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
                  ? t('tasksHub.search.placeholderMine')
                  : t('tasksHub.search.placeholderCatalog')
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
            allActive={tasks.data ?? []}
            tasksByBucket={tasksByBucket}
            archived={archived.data ?? []}
            loading={tasks.isLoading}
            query={query}
            isRefreshing={isRefreshing}
            collapsed={collapsed}
            archivedOpen={archivedOpen}
            onToggle={toggleBucket}
            onToggleArchived={() => setArchivedOpen((v) => !v)}
            onRefresh={handleRefresh}
            onTaskPress={(id) => router.push({ pathname: '/task-form', params: { id } })}
            onPeriodicity={handleOpenPeriodicity}
            onCreate={handleCreateTask}
            onReorder={(ids) => reorderTasks.mutate(ids)}
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
              templatesBySub={templatesBySub}
              loading={templates.isLoading}
              query={query}
              dimFilter={dimFilter}
              onSelectDim={selectDim}
              adoptedTemplateIds={adoptedTemplateIds}
              collapsedSubs={collapsedSubs}
              onToggleSub={toggleSub}
              onAdopt={handleAdopt}
              onCustomize={handleCustomize}
              adoptingId={adoptingId}
              limit={taskLimit}
            />
          </ScrollView>
        )}
      </ScreenBackground>

      <AdoptPeriodicitySheet
        visible={pickerTemplate !== null}
        templateTitle={pickerTemplate?.title ?? ''}
        templateDefaultType={pickerTemplate?.task_type}
        onCancel={() => setPickerTemplate(null)}
        onConfirm={handleAdoptConfirm}
      />

      <PeriodicitySheet
        visible={periodicityTask !== null}
        task={periodicityTask}
        onCancel={() => setPeriodicityTask(null)}
        onConfirm={handlePeriodicityConfirm}
      />

      {/* M2 step 2 lives here — spotlight the `+` icon. The mount on
         Home covers step 1; the mount on task-form covers steps 3-5.
         `flatNav` because this Stack screen has no floating BottomNavBar.
         Tapping `+` fires CREATE_TASK_TAPPED + navigates; tapping the
         tooltip's Próximo / skip walks the user to the form instead —
         through the same limit gate, so the tour never advances into a
         form that refused to open. */}
      <TourModule
        module="M2"
        screen="tasks"
        steps={buildM2Steps(t)}
        enabled={isM2Current}
        flatNav
        onAdvanceToNextScreen={() => {
          handleCreateTask();
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Minhas — one DraggableFlatList mixing slim group headers and task rows.
//
// The periodicity chip on each row is what moves a practice between
// groups; drag is ONLY for order inside a group (a drag that crosses a
// header snaps back). One big list instead of three because
// react-native-draggable-flatlist v4 can't nest inside a parent
// ScrollView; mixing item kinds in a single list is the supported pattern.
// ─────────────────────────────────────────────────────────────────────────────

type MineItem =
  | { kind: 'header'; bucket: Bucket; count: number }
  | { kind: 'task'; bucket: Bucket; task: TaskWithSubs }
  | { kind: 'empty'; bucket: Bucket };

interface MineBodyProps {
  allActive: TaskWithSubs[];
  tasksByBucket: Record<Bucket, TaskWithSubs[]>;
  archived: TaskWithSubs[];
  loading: boolean;
  query: string;
  isRefreshing: boolean;
  collapsed: Record<Bucket, boolean>;
  archivedOpen: boolean;
  onToggle: (b: Bucket) => void;
  onToggleArchived: () => void;
  onRefresh: () => void;
  onTaskPress: (id: string) => void;
  onPeriodicity: (task: TaskWithSubs) => void;
  onCreate: () => void;
  onReorder: (orderedIds: string[]) => void;
  onRestore: (task: TaskWithSubs) => void;
  onDelete: (task: TaskWithSubs) => void;
  /** Archived rows whose restore / delete is in flight. */
  busyIds: Set<string>;
  bottomClearance: number;
}

function MineBody({
  allActive,
  tasksByBucket,
  archived,
  loading,
  query,
  isRefreshing,
  collapsed,
  archivedOpen,
  onToggle,
  onToggleArchived,
  onRefresh,
  onTaskPress,
  onPeriodicity,
  onCreate,
  onReorder,
  onRestore,
  onDelete,
  busyIds,
  bottomClearance,
}: MineBodyProps) {
  const { t } = useT();

  // Flat item list. Headers are section dividers (non-draggable); tasks
  // are draggable rows; the empty placeholder renders inside open empty
  // groups so the user sees where a chip change would land.
  const items = useMemo<MineItem[]>(() => {
    const out: MineItem[] = [];
    for (const meta of BUCKETS) {
      const bucketTasks = tasksByBucket[meta.id];
      out.push({ kind: 'header', bucket: meta.id, count: bucketTasks.length });
      if (collapsed[meta.id]) continue;
      if (bucketTasks.length === 0) {
        out.push({ kind: 'empty', bucket: meta.id });
        continue;
      }
      for (const task of bucketTasks) out.push({ kind: 'task', bucket: meta.id, task });
    }
    return out;
  }, [tasksByBucket, collapsed]);

  // Local mirror so the dropped order paints on the release frame. It
  // follows `items` by IDENTITY — every refetch, edit, archive, collapse
  // or reschedule rebuilds `items`, so the mirror can never go stale.
  // (The previous mirror keyed on ids only: a title, stars or weekday edit
  // inside the same group never re-rendered, not even on pull-to-refresh.)
  const [localItems, setLocalItems] = useState<MineItem[]>(items);
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const keyExtractor = (item: MineItem, idx: number) =>
    item.kind === 'task' ? `t-${item.task.id}` : `${item.kind}-${item.bucket}-${idx}`;

  /** Post-drag list → global ordering → RPC. Only the moved group's VISIBLE
   *  rows take their new sequence; every other practice (other groups,
   *  hidden by search or a collapsed group) keeps its exact position — the
   *  server rewrites sort_order 1..N over this list and Home reads it, so a
   *  reorder inside Semanais must never reshuffle Hoje's Diárias. */
  const commitReorder = (next: MineItem[], bucket: Bucket) => {
    const newSequence: string[] = [];
    for (const it of next) {
      if (it.kind === 'task' && it.bucket === bucket) newSequence.push(it.task.id);
    }
    const moving = new Set(newSequence);
    let cursor = 0;
    const orderedTaskIds = allActive.map((tk) =>
      moving.has(tk.id) ? (newSequence[cursor++] ?? tk.id) : tk.id,
    );
    onReorder(orderedTaskIds);
  };

  /** Bucket of the item at index `i`, from the nearest preceding header. */
  const sectionOf = (data: MineItem[], i: number): Bucket | null => {
    for (let j = i; j >= 0; j--) {
      const it = data[j];
      if (it && it.kind === 'header') return it.bucket;
    }
    return null;
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<MineItem>) => {
    if (item.kind === 'header') {
      return (
        <BucketHeader
          meta={BUCKET_BY_ID[item.bucket]}
          count={item.count}
          collapsed={collapsed[item.bucket]}
          onToggle={() => onToggle(item.bucket)}
        />
      );
    }
    if (item.kind === 'empty') {
      return (
        <View style={styles.bucketEmptyCard}>
          <Text style={styles.bucketEmptyText}>{t('tasksHub.bucketEmpty')}</Text>
        </View>
      );
    }
    return (
      <ManageRow
        task={item.task}
        meta={BUCKET_BY_ID[item.bucket]}
        drag={drag}
        isActive={isActive}
        onEdit={() => onTaskPress(item.task.id)}
        onPeriodicity={() => onPeriodicity(item.task)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={tokens.brand.violet2} />
      </View>
    );
  }

  const nothingActive = allActive.length === 0;
  // From the filtered DATA, not the rendered items: a match inside a
  // collapsed group is still a match.
  const nothingMatches =
    !nothingActive &&
    query.trim().length > 0 &&
    BUCKETS.every((b) => tasksByBucket[b.id].length === 0);

  const Footer = (
    <View style={styles.footer}>
      {archived.length > 0 && (
        <ArchivedSection
          tasks={archived}
          open={archivedOpen}
          onToggle={onToggleArchived}
          onRestore={onRestore}
          onDelete={onDelete}
          busyIds={busyIds}
        />
      )}
      {!nothingActive && <AddCard label={t('tasksHub.newTask')} onPress={onCreate} />}
    </View>
  );

  return (
    <DraggableFlatList
      data={nothingActive || nothingMatches ? [] : localItems}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onDragEnd={({ data, from, to }) => {
        // A long-press released in place also ends here — nothing moved,
        // so no RPC and no invalidation storm.
        if (from === to) return;
        const moved = data[to];
        if (!moved || moved.kind !== 'task') {
          setLocalItems(localItems);
          return;
        }
        // Constrain to the section the row started in — a drop across a
        // header snaps back, with a warning buzz so the snap reads as
        // "not here" and not as a glitch. Groups are changed by the chip.
        if (sectionOf(data, to) !== moved.bucket) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          setLocalItems(localItems);
          return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setLocalItems(data);
        commitReorder(data, moved.bucket);
      }}
      activationDistance={20}
      ListHeaderComponent={
        nothingActive ? null : (
          <Text style={styles.lead}>{t('tasksHub.lead')}</Text>
        )
      }
      ListEmptyComponent={
        nothingMatches ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search" size={32} color={tokens.text.dim} />
            <Text style={styles.emptyTitle}>{t('tasksHub.empty.noMatchesTitle')}</Text>
            <Text style={styles.emptySub}>{t('tasksHub.empty.noMatchesBody', { query })}</Text>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <EmptyHero tone="violet" iconName="list" size={120} />
            <Text style={styles.emptyTitle}>{t('tasksHub.empty.noTasksTitle')}</Text>
            <Text style={styles.emptySub}>{t('tasksHub.empty.noTasksBody')}</Text>
            <Pressable
              onPress={onCreate}
              style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color={tokens.text.hi} />
              <Text style={styles.emptyCtaText}>{t('tasksHub.empty.cta')}</Text>
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

/** Slim section header — accent icon, eyebrow, one-line description,
 *  count chip and the collapse chevron. No card: the rows below carry
 *  the surface, the header just names the group. */
function BucketHeader({
  meta,
  count,
  collapsed,
  onToggle,
}: {
  meta: BucketMeta;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useT();
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.bucketHeader, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
    >
      <View style={[styles.bucketIcon, { backgroundColor: meta.accentBg }]}>
        <Ionicons name={meta.iconName} size={16} color={meta.accent} />
      </View>
      <View style={styles.bucketTitleCol}>
        <Text style={[styles.bucketEyebrow, { color: meta.accentText }]}>
          {t(meta.labelKey).toUpperCase()}
        </Text>
        <Text style={styles.bucketDesc} numberOfLines={1}>
          {t(meta.descKey)}
        </Text>
      </View>
      <View style={[styles.countChip, { backgroundColor: meta.accentBg }]}>
        <Text style={[styles.countChipText, { color: meta.accentText }]}>{count}</Text>
      </View>
      <Ionicons
        name={collapsed ? 'chevron-down' : 'chevron-up'}
        size={16}
        color={tokens.text.dim}
      />
    </Pressable>
  );
}

interface ManageRowProps {
  task: TaskWithSubs;
  meta: BucketMeta;
  drag: () => void;
  isActive: boolean;
  onEdit: () => void;
  onPeriodicity: () => void;
}

/**
 * Manage row — the Home TaskCard's vocabulary (gradient surface, dim-
 * tinted icon tile, sub stack + colored pips + XP) minus the check
 * button, plus the periodicity chip. Tap → edit form. Long-press →
 * drag (order within the group). Chip → re-schedule sheet.
 *
 * No drag handle glyph: the whole row long-presses, the lead line and the
 * a11y hint say so, and on a 360dp phone those 28px are the difference
 * between a readable title and five characters next to the chip.
 */
function ManageRow({ task, meta, drag, isActive, onEdit, onPeriodicity }: ManageRowProps) {
  const { t } = useT();
  const lookup = useMetaLookup();
  const sub = lookup.sub(task.primary_sub_id);
  const dim = lookup.dim(task.primary_dimension_id);
  const reward = rewardForTaskSubs(task.subs, task.coin_multiplier);
  const isCustom = !task.template_id;
  const chipLabel = describeRecurrence(task.recurrence, task.target_count, t, { short: true });

  return (
    <ScaleDecorator>
      <View style={styles.rowWrap}>
        <Pressable
          onPress={onEdit}
          onLongPress={drag}
          delayLongPress={400}
          disabled={isActive}
          style={({ pressed }) => [
            styles.row,
            { borderLeftColor: dim.color },
            isActive && styles.rowActive,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('tasksHub.row.editA11y', { title: task.title })}
          accessibilityHint={t('tasksHub.row.dragA11y')}
        >
          <LinearGradient
            colors={tokens.gradient.taskCard}
            locations={tokens.gradient.taskCardLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.subTile, { backgroundColor: dim.bg }]}>
            <Ionicons
              name={(task.icon ?? sub.iconName) as never}
              size={17}
              color={dim.color}
            />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={styles.metaRow}>
              {task.subs.length > 0 && (
                <SubStack subIds={task.subs.map((s) => s.sub_id)} max={3} size={16} />
              )}
              <SubColoredPips subs={task.subs} size={5} />
              <Text style={styles.rewardValue}>+{reward.total.xp}</Text>
              {task.coin_multiplier !== 1 && (
                <View style={styles.coinTag}>
                  <CoinIcon size={10} />
                  <Text style={styles.coinTagText}>{reward.total.coins}</Text>
                </View>
              )}
              {isCustom && (
                <View style={styles.customChip}>
                  <Text style={styles.customChipText}>{t('tasksHub.customChip')}</Text>
                </View>
              )}
            </View>
          </View>
          {/* Label stays neutral (AA in both palettes); the accent carries
              border, wash and chevron — TaskCard's rule for its coin figure.
              accessibilityValue: the label replaces the child text for screen
              readers, so the current schedule must travel separately. */}
          <Pressable
            onPress={onPeriodicity}
            disabled={isActive}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tasksHub.row.periodicityA11y', { title: task.title })}
            accessibilityValue={{ text: chipLabel }}
            style={({ pressed }) => [
              styles.periodChip,
              { borderColor: `${meta.accent}66`, backgroundColor: meta.accentBg },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.periodChipText} numberOfLines={1}>
              {chipLabel}
            </Text>
            <Ionicons name="chevron-down" size={12} color={meta.accent} />
          </Pressable>
        </Pressable>
      </View>
    </ScaleDecorator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Arquivadas — collapsed footer with restore + (guarded) delete
// ─────────────────────────────────────────────────────────────────────────────

interface ArchivedSectionProps {
  tasks: TaskWithSubs[];
  open: boolean;
  onToggle: () => void;
  onRestore: (task: TaskWithSubs) => void;
  onDelete: (task: TaskWithSubs) => void;
  busyIds: Set<string>;
}

function ArchivedSection({ tasks, open, onToggle, onRestore, onDelete, busyIds }: ArchivedSectionProps) {
  const { t } = useT();
  return (
    <View style={styles.archivedBlock}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.bucketHeader, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={[styles.bucketIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Ionicons name="archive-outline" size={16} color={tokens.text.dim} />
        </View>
        <View style={styles.bucketTitleCol}>
          <Text style={[styles.bucketEyebrow, { color: tokens.text.mid }]}>
            {t('tasksHub.archived.section').toUpperCase()}
          </Text>
        </View>
        <View style={[styles.countChip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
          <Text style={[styles.countChipText, { color: tokens.text.mid }]}>{tasks.length}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={tokens.text.dim} />
      </Pressable>

      {open && (
        <View style={styles.archivedList}>
          {tasks.map((task) => (
            <ArchivedRow
              key={task.id}
              task={task}
              busy={busyIds.has(task.id)}
              onRestore={() => onRestore(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ArchivedRow({
  task,
  busy,
  onRestore,
  onDelete,
}: {
  task: TaskWithSubs;
  busy: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  const lookup = useMetaLookup();
  const sub = lookup.sub(task.primary_sub_id);
  return (
    <View style={styles.archivedRow}>
      <View style={[styles.subTile, styles.subTileArchived]}>
        <Ionicons name={(task.icon ?? sub.iconName) as never} size={16} color={tokens.text.dim} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: tokens.text.mid }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={styles.archivedMeta} numberOfLines={1}>
          {describeRecurrence(task.recurrence, task.target_count, t)}
        </Text>
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
            accessibilityLabel={`${t('tasksHub.archived.restore')} ${task.title}`}
          >
            <Ionicons name="refresh" size={14} color={tokens.brand.violet2} />
            <Text style={styles.restoreText}>{t('tasksHub.archived.restore')}</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={t('tasksHub.archived.deleteA11y', { title: task.title })}
          >
            <Ionicons name="trash-outline" size={18} color={tokens.semantic.danger} />
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sugeridas — catalog browse: dimension chips → sub groups → template cards
// ─────────────────────────────────────────────────────────────────────────────

interface SuggestedBodyProps {
  templatesBySub: Map<SubId, TaskTemplateWithSubs[]>;
  loading: boolean;
  query: string;
  dimFilter: DimFilter;
  onSelectDim: (d: DimFilter) => void;
  adoptedTemplateIds: Set<string>;
  collapsedSubs: Record<SubId, boolean>;
  onToggleSub: (s: SubId) => void;
  onAdopt: (template: TaskTemplateWithSubs) => void;
  /** Tap on the card body → task-form prefilled (adjust-then-add). */
  onCustomize: (template: TaskTemplateWithSubs) => void;
  adoptingId: string | null;
  /** Free-tier task slots — drives the Premium reinforcement line. */
  limit: EntityLimit;
}

function SuggestedBody({
  templatesBySub,
  loading,
  query,
  dimFilter,
  onSelectDim,
  adoptedTemplateIds,
  collapsedSubs,
  onToggleSub,
  onAdopt,
  onCustomize,
  adoptingId,
  limit,
}: SuggestedBodyProps) {
  const { t } = useT();
  const lookup = useMetaLookup();

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={tokens.brand.violet2} />
      </View>
    );
  }

  const subsWithTemplates = ALL_SUBS_IN_ORDER.filter(
    (s) => (templatesBySub.get(s)?.length ?? 0) > 0,
  );
  const searching = query.trim().length > 0;

  return (
    <View style={styles.suggestedWrap}>
      {/* How-to hint + Premium reinforcement. Adjusting a suggestion
         forks it into the user's own task, which consumes the free-tier
         slots — surfacing that here is the (soft) Premium funnel. */}
      <View style={styles.suggestedHint}>
        <Ionicons name="color-wand-outline" size={14} color={tokens.text.mid} style={{ marginTop: 1 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.suggestedHintText}>{t('tasksHub.suggested.hint')}</Text>
          {!limit.unlimited && (
            <Text style={styles.suggestedPremiumText}>
              {t('tasksHub.suggested.premiumHint', { count: limit.count, limit: limit.limit })}
            </Text>
          )}
        </View>
      </View>

      {/* Dimension filter — "Todas" + the 6 dims in catalog order. Bleeds
          to the screen edge (negative margin + inner padding) so chips
          scroll out under the gutter instead of clipping at it. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dimChipsScroll}
        contentContainerStyle={styles.dimChipsRow}
        keyboardShouldPersistTaps="handled"
      >
        <DimChip
          label={t('tasksHub.suggested.allDims')}
          color={tokens.brand.violet2}
          bg="rgba(155,130,255,0.16)"
          selected={dimFilter === 'all'}
          onPress={() => onSelectDim('all')}
        />
        {DIMENSION_ORDER.map((d) => {
          const dm = lookup.dim(d);
          return (
            <DimChip
              key={d}
              label={dm.label}
              color={dm.color}
              bg={dm.bg}
              selected={dimFilter === d}
              onPress={() => onSelectDim(d)}
            />
          );
        })}
      </ScrollView>

      {subsWithTemplates.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="search" size={32} color={tokens.text.dim} />
          <Text style={styles.emptyTitle}>{t('tasksHub.empty.noMatchesTitle')}</Text>
          <Text style={styles.emptySub}>{t('tasksHub.empty.noMatchesCatalog', { query })}</Text>
        </View>
      ) : (
        subsWithTemplates.map((subId) => {
          const subMeta = lookup.sub(subId);
          const dimMeta = lookup.dim(subMeta.dimensionId);
          const list = templatesBySub.get(subId) ?? [];
          // Same count the tab chip shows: what is still there to adopt.
          const openCount = list.filter((tp) => !adoptedTemplateIds.has(tp.id)).length;
          // A picked dimension or an active search force-expands: collapsed
          // groups would hide exactly what the user just asked for. The
          // header is then a plain label — toggling hidden state behind a
          // forced-open group would only desync it for later.
          const forcedOpen = searching || dimFilter !== 'all';
          const isCollapsed = forcedOpen ? false : !!collapsedSubs[subId];
          return (
            <View key={subId} style={styles.subGroup}>
              <Pressable
                onPress={forcedOpen ? undefined : () => onToggleSub(subId)}
                disabled={forcedOpen}
                style={({ pressed }) => [styles.bucketHeader, pressed && { opacity: 0.7 }]}
                accessibilityRole={forcedOpen ? 'header' : 'button'}
                accessibilityState={forcedOpen ? undefined : { expanded: !isCollapsed }}
              >
                <View style={[styles.bucketIcon, { backgroundColor: dimMeta.bg }]}>
                  <Ionicons name={subMeta.iconName as never} size={16} color={dimMeta.color} />
                </View>
                <View style={styles.bucketTitleCol}>
                  <Text style={[styles.bucketEyebrow, { color: dimMeta.color }]}>
                    {subMeta.label.toUpperCase()}
                  </Text>
                  <Text style={styles.bucketDesc} numberOfLines={1}>
                    {dimMeta.label}
                  </Text>
                </View>
                <View style={[styles.countChip, { backgroundColor: dimMeta.bg }]}>
                  <Text style={[styles.countChipText, { color: dimMeta.color }]}>{openCount}</Text>
                </View>
                {!forcedOpen && (
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={tokens.text.dim}
                  />
                )}
              </Pressable>

              {!isCollapsed && (
                <View style={styles.subGroupBody}>
                  {list.map((tmpl) => (
                    <TemplateRow
                      key={tmpl.id}
                      template={tmpl}
                      dimColor={dimMeta.color}
                      dimBg={dimMeta.bg}
                      iconName={subMeta.iconName}
                      isAdopted={adoptedTemplateIds.has(tmpl.id)}
                      isAdopting={adoptingId === tmpl.id}
                      onAdopt={() => onAdopt(tmpl)}
                      onPress={() => onCustomize(tmpl)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

function DimChip({
  label,
  color,
  bg,
  selected,
  onPress,
}: {
  label: string;
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
        styles.dimChip,
        selected
          ? { backgroundColor: bg, borderColor: `${color}80` }
          : { backgroundColor: 'transparent', borderColor: tokens.border.base },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.dimChipDot, { backgroundColor: color, opacity: selected ? 1 : 0.6 }]} />
      <Text
        style={[
          styles.dimChipText,
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
  template: TaskTemplateWithSubs;
  dimColor: string;
  dimBg: string;
  iconName: string;
  isAdopted: boolean;
  isAdopting: boolean;
  onAdopt: () => void;
  /** Tap on the card body — open the prefilled form (adjust-then-add). */
  onPress: () => void;
}

/**
 * Suggestion card in the TaskCard vocabulary (icon tile, accent left bar,
 * SubStack + colored pips + reward), so a template reads as "a practice
 * you don't have yet" instead of a distinct species. The whole body is
 * pressable → prefilled form; the violet "+" on the right mirrors the
 * Home card's check-button slot and adopts as-is.
 */
function TemplateRow({
  template,
  dimColor,
  dimBg,
  iconName,
  isAdopted,
  isAdopting,
  onAdopt,
  onPress,
}: TemplateRowProps) {
  const { t } = useT();
  const reward = rewardForTaskSubs(template.subs);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.templateCard,
        { borderLeftColor: dimColor },
        isAdopted && styles.templateCardAdopted,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('tasksHub.suggested.customizeA11y', { title: template.title })}
    >
      <LinearGradient
        colors={tokens.gradient.taskCard}
        locations={tokens.gradient.taskCardLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.subTile, { backgroundColor: dimBg }]}>
        <Ionicons name={(template.icon ?? iconName) as never} size={17} color={dimColor} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {template.title}
        </Text>
        {template.description ? (
          <Text style={styles.templateDesc} numberOfLines={2}>
            {template.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {template.subs.length > 0 && (
            <SubStack subIds={template.subs.map((s) => s.sub_id)} max={3} size={16} />
          )}
          <SubColoredPips subs={template.subs} size={5} />
          <Text style={styles.rewardValue}>+{reward.total.xp}</Text>
          <Text style={styles.templateRecurrence} numberOfLines={1}>
            · {describeRecurrence(template.recurrence, template.target_count, t)}
          </Text>
        </View>
      </View>

      {isAdopted ? (
        <View style={styles.adoptedPill}>
          <Ionicons name="checkmark" size={13} color={tokens.semantic.xp} />
          <Text style={styles.adoptedPillText}>{t('tasksHub.adopt.added')}</Text>
        </View>
      ) : (
        <Pressable
          onPress={isAdopting ? undefined : onAdopt}
          disabled={isAdopting}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('tasksHub.adopt.adoptA11y', { title: template.title })}
          style={({ pressed }) => [styles.adoptBtn, pressed && styles.adoptBtnPressed]}
        >
          <LinearGradient
            colors={tokens.gradient.taskCheckBtn}
            locations={tokens.gradient.taskCheckBtnLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {isAdopting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={20} color="#fff" />
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
    paddingBottom: tokens.space[1],
  },
  loadingBox: {
    paddingVertical: tokens.space[10],
    alignItems: 'center',
  },

  // ── Group headers (Minhas buckets · Arquivadas · Sugeridas subs) ──────
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  bucketIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketTitleCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  bucketEyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  bucketDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
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
  bucketEmptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.border.strong,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    marginBottom: tokens.space[2],
  },
  bucketEmptyText: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    textAlign: 'center',
  },

  // ── Manage row ────────────────────────────────────────────────────────
  rowWrap: {
    marginBottom: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingLeft: 10,
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
  subTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subTileArchived: {
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
  customChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  customChipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 8,
    letterSpacing: 0.8,
    color: tokens.text.dim,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  rewardValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.semantic.xp,
    letterSpacing: 0.2,
  },
  coinTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  coinTagText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.text.mid,
    letterSpacing: 0.2,
  },
  // 32 + hitSlop 8 = 48dp, the adopt "+" / rewards-manage icon-button size.
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 124,
    minHeight: 32,
    paddingLeft: 9,
    paddingRight: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  periodChipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.2,
    color: tokens.text.hi,
    flexShrink: 1,
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
    color: tokens.text.dim,
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
  dimChipsScroll: {
    marginHorizontal: -tokens.space[4],
    flexGrow: 0,
  },
  dimChipsRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
    paddingVertical: tokens.space[1],
    paddingHorizontal: tokens.space[4],
  },
  dimChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  dimChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dimChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  subGroup: {
    gap: 0,
  },
  subGroupBody: {
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
  templateRecurrence: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.faint,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  adoptBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(155,130,255,0.55)',
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
