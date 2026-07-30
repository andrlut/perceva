import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withSpring,
} from 'react-native-reanimated';

import { SubColoredPips } from '@/components/SubColoredPips';
import type { DayCompletion } from '@/lib/api/history';
import type { TaskSub, TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { formatTimeOfDay } from '@/lib/time';
import { tokens } from '@/theme';

export interface CompletedItem {
  task: TaskWithSubs;
  /** When provided, the row gets an undo button wired to this completion. */
  completionId?: string;
  /**
   * Row was rebuilt from a completion snapshot because its live task is
   * gone (archived/deleted). Undo still works, but the "+1" pill is
   * suppressed — you can't sensibly log another completion of a task that
   * no longer exists in the active list.
   */
  orphaned?: boolean;
  /**
   * XP granted by THIS completion (`task_completion.xp_granted`).
   * NOT derivable client-side: the server folds in the Momentum bonus (up
   * to +25%), so the same stars pay differently on different days — which
   * is exactly why the number has to be shown rather than inferred.
   * Omitted → the XP fragment and the header total are not rendered.
   */
  xp?: number;
  /** Coins granted by THIS completion. Rendered only when > 0. */
  coins?: number;
  /** Per-sub stars ACTUALLY used for this completion — may differ from
   *  `task.subs` when the user adjusted them in CompleteTaskSheet. Drives
   *  the pips and makes "+1" a true round-trip of the undone row. */
  subs?: TaskSub[];
  /** ISO timestamp of the completion. Drives the HH:mm stamp. */
  at?: string;
}

/**
 * Map a day's completions into drawer rows — ONE ROW PER COMPLETION.
 *
 * Grouping by task (the old today-only shape) had to sum XP across reps
 * while undo could only remove the latest one, so a 5★ rep followed by a
 * 1★ rep printed "+20 XP" next to a button that gives back 4. Per-completion
 * rows make the number on the row and the number the button removes the
 * same number.
 *
 * `resolveTask` returns the live task; when it's gone (archived/deleted) the
 * caller's snapshot shim keeps the row visible so the drawer never disagrees
 * with the day's XP total.
 */
export function completionsToItems(
  completions: DayCompletion[],
  resolveTask: (taskId: string) => TaskWithSubs | undefined,
  snapshot: (completion: DayCompletion) => TaskWithSubs,
  filter?: (task: TaskWithSubs, live: boolean) => boolean,
): CompletedItem[] {
  const out: CompletedItem[] = [];
  for (const c of completions) {
    const live = resolveTask(c.taskId);
    const task = live ?? snapshot(c);
    if (filter && !filter(task, !!live)) continue;
    out.push({
      task,
      completionId: c.id,
      orphaned: !live,
      xp: c.xpGranted,
      coins: c.coinsGranted,
      subs: c.subs,
      at: c.completedAt,
    });
  }
  return out;
}

type Variant = 'completed' | 'skipped';

interface Props {
  items: CompletedItem[];
  title: string;
  /** Visual + behavior mode. Defaults to 'completed'. */
  variant?: Variant;
  /** Undo that completion. Receives the row's `completionId`. */
  onUndo?: (completionId: string) => void;
  /** Put a skipped practice back on the day's list. Receives `task.id`. */
  onUnskip?: (taskId: string) => void;
  /**
   * Log another completion of this practice. Receives the row's OWN stars
   * so "+1" repeats *that* rep ("do it again, same as this one") rather
   * than silently falling back to the task's defaults.
   */
  onExtra?: (task: TaskWithSubs, subs?: TaskSub[]) => void;
  /** Render the header even with zero items (keeps a tour anchor mounted
   *  and lets "Feitas hoje · 0" grow into the day's tally). */
  showWhenEmpty?: boolean;
  /** Fires on every header tap with the next open/closed state. */
  onToggle?: (open: boolean) => void;
}

/**
 * Collapsible "what happened on this day" group. Header is always visible
 * (title + count + the day's XP); the body expands on tap.
 *
 * Identical on today and on any past day — both are fed from the same
 * per-completion shape, so the row anatomy, the buttons and the totals
 * cannot drift between the two surfaces.
 */
export function CompletedBucket({
  items,
  title,
  variant = 'completed',
  onUndo,
  onUnskip,
  onExtra,
  showWhenEmpty = false,
  onToggle,
}: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const isSkipped = variant === 'skipped';
  const empty = items.length === 0;

  // Sum what is SHOWN rather than reading the day's total: all-practices
  // filters dailies out of its list, so a day total there would exceed the
  // visible rows. Only render it when every row carries its XP.
  const showTotal =
    !isSkipped && !empty && items.every((i) => i.xp !== undefined);
  const totalXp = showTotal
    ? items.reduce((sum, i) => sum + (i.xp ?? 0), 0)
    : 0;

  // An expanded drawer that empties (undo the last rep) would otherwise be
  // stuck open forever: the header is disabled when empty and the chevron
  // is hidden, so nothing is left to collapse it.
  useEffect(() => {
    if (empty) setOpen(false);
  }, [empty]);

  const chevron = useDerivedValue(() =>
    withSpring(open ? 180 : 0, { damping: 18, stiffness: 220 }),
  );
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value}deg` }],
  }));

  if (empty && !showWhenEmpty) return null;

  const toggle = () => {
    if (empty) return;
    setOpen((v) => {
      const next = !v;
      onToggle?.(next);
      return next;
    });
  };

  return (
    <Animated.View
      style={styles.wrap}
      layout={reduceMotion ? undefined : LinearTransition.springify().damping(18).stiffness(220)}
    >
      <Pressable
        onPress={toggle}
        disabled={empty}
        style={({ pressed }) => [
          styles.header,
          open && styles.headerOpen,
          pressed && !empty && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled: empty }}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.countChip}>
            <Text
              style={[
                styles.countText,
                (isSkipped || empty) && { color: tokens.text.dim },
              ]}
            >
              {items.length}
            </Text>
          </View>
        </View>

        {showTotal && (
          <View
            style={styles.dayTotal}
            accessibilityRole="text"
            accessibilityLabel={t('home.completedBucket.a11yDayTotal', {
              xp: totalXp,
            })}
          >
            <Text style={styles.dayTotalValue}>+{totalXp}</Text>
            <Text style={styles.dayTotalUnit}>XP</Text>
          </View>
        )}

        {!empty && (
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={16} color={tokens.text.dim} />
          </Animated.View>
        )}
      </Pressable>

      {open && !empty && (
        <Animated.View
          style={styles.body}
          entering={reduceMotion ? undefined : FadeIn.duration(140)}
          exiting={reduceMotion ? undefined : FadeOut.duration(120)}
        >
          {items.map((item, idx) => (
            <Animated.View
              key={item.completionId ?? item.task.id}
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(Math.min(idx, 6) * 22).duration(160)
              }
            >
              {isSkipped ? (
                <SkippedRow
                  item={item}
                  last={idx === items.length - 1}
                  onUnskip={onUnskip}
                />
              ) : (
                <CompletedRow
                  item={item}
                  last={idx === items.length - 1}
                  onUndo={onUndo}
                  onExtra={onExtra}
                />
              )}
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {open && empty && (
        <View style={styles.body}>
          <Text style={styles.emptyText}>
            {t('home.completedBucket.empty')}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Retro completions are filed at noon of the selected day, so every retro
 * row would otherwise print a fake-precise "12:00". Suppress the stamp on
 * exactly-noon timestamps rather than lie about when it happened.
 */
function timeStamp(at?: string): string | null {
  if (!at) return null;
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return null;
  const isNoonSharp =
    d.getHours() === 12 &&
    d.getMinutes() === 0 &&
    d.getSeconds() === 0 &&
    d.getMilliseconds() === 0;
  return isNoonSharp ? null : formatTimeOfDay(d);
}

function CompletedRow({
  item,
  last,
  onUndo,
  onExtra,
}: {
  item: CompletedItem;
  last: boolean;
  onUndo?: (completionId: string) => void;
  onExtra?: (task: TaskWithSubs, subs?: TaskSub[]) => void;
}) {
  const { t } = useT();
  const meta = useMetaLookup();
  const dim = meta.dim(item.task.primary_dimension_id);
  const stars = item.subs ?? [];
  const time = timeStamp(item.at);
  const canExtra = !!onExtra && !item.orphaned;
  const canUndo = !!onUndo && !!item.completionId;

  return (
    <View
      style={[styles.row, last && styles.rowLast]}
      accessibilityRole="text"
      accessibilityLabel={t('home.completedBucket.a11yRow', {
        title: item.task.title,
        xp: item.xp ?? 0,
      })}
    >
      <View style={[styles.dimTile, { backgroundColor: dim.bg, borderColor: dim.color + '33' }]}>
        <Ionicons name={dim.iconName as never} size={16} color={dim.color} />
      </View>

      <View style={styles.textCol}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.task.title}
        </Text>
        <View style={styles.metaLine}>
          {item.xp !== undefined && (
            <Text style={styles.xpText}>+{item.xp} XP</Text>
          )}
          {stars.length > 0 && (
            <>
              <Text style={styles.sep}>·</Text>
              <SubColoredPips subs={stars} size={5} max={5} />
            </>
          )}
          {!!item.coins && item.coins > 0 && (
            <>
              <Text style={styles.sep}>·</Text>
              <Text style={styles.coinText}>{item.coins}</Text>
            </>
          )}
          {time && (
            <>
              <Text style={styles.sep}>·</Text>
              <Text style={styles.timeText} numberOfLines={1}>
                {time}
              </Text>
            </>
          )}
        </View>
      </View>

      {canExtra ? (
        <Pressable
          onPress={() => onExtra!(item.task, item.subs)}
          style={({ pressed }) => [
            styles.iconBtn,
            styles.extraBtn,
            pressed && styles.extraBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('home.completedBucket.a11yExtra', {
            title: item.task.title,
          })}
        >
          <Ionicons name="add" size={15} color={tokens.semantic.xp} />
          <Text style={styles.extraBtnText}>1</Text>
        </Pressable>
      ) : (
        // Keeps the right edge aligned with rows that do have the button.
        <View style={styles.iconBtn} />
      )}

      {canUndo && (
        <Pressable
          onPress={() => onUndo!(item.completionId!)}
          style={({ pressed }) => [
            styles.iconBtn,
            styles.undoBtn,
            pressed && styles.undoBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('home.completedBucket.a11yUndo', {
            title: item.task.title,
            xp: item.xp ?? 0,
          })}
        >
          <Ionicons name="arrow-undo" size={18} color={tokens.text.mid} />
        </Pressable>
      )}
    </View>
  );
}

function SkippedRow({
  item,
  last,
  onUnskip,
}: {
  item: CompletedItem;
  last: boolean;
  onUnskip?: (taskId: string) => void;
}) {
  const { t } = useT();
  const meta = useMetaLookup();
  const dim = meta.dim(item.task.primary_dimension_id);
  const warn = tokens.semantic.warn ?? '#FF9F43';

  return (
    <View style={[styles.row, last && styles.rowLast]}>
      {/* Nothing was trained, so the row doesn't claim the dimension color. */}
      <View style={[styles.dimTile, styles.dimTileMuted, { backgroundColor: dim.bg }]}>
        <Ionicons name={dim.iconName as never} size={16} color={tokens.text.mid} />
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.rowTitle, styles.rowTitleSkipped]} numberOfLines={1}>
          {item.task.title}
        </Text>
        <View style={styles.metaLine}>
          <Ionicons name="remove-circle-outline" size={11} color={warn} />
          <Text style={[styles.skipMeta, { color: warn }]}>
            {t('home.skippedBucket.rowMeta')}
          </Text>
        </View>
      </View>

      {onUnskip && (
        <Pressable
          onPress={() => onUnskip(item.task.id)}
          style={({ pressed }) => [
            styles.resumeBtn,
            pressed && styles.resumeBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('home.skippedBucket.a11yResume', {
            title: item.task.title,
          })}
        >
          <Ionicons name="return-up-back" size={16} color={tokens.text.mid} />
          <Text style={styles.resumeBtnText}>
            {t('home.skippedBucket.resume')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: tokens.space[3],
    marginTop: tokens.space[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  headerOpen: {
    borderRadius: 0,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  countChip: {
    backgroundColor: tokens.bg.surface2,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  countText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    color: tokens.semantic.xp,
  },
  // A miniature of the day's XP hero — same colour, same glow, one third
  // the size — so the collapsed drawer answers "what did this day pay?"
  // without being expanded. The glow lives HERE and on no row.
  dayTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginRight: tokens.space[2],
  },
  dayTotalValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.semantic.xp,
    letterSpacing: -0.3,
    textShadowColor: tokens.semantic.xpGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  dayTotalUnit: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    color: tokens.semantic.xp,
    opacity: 0.75,
  },
  body: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: tokens.border.base,
    borderBottomLeftRadius: tokens.radius.lg,
    borderBottomRightRadius: tokens.radius.lg,
    overflow: 'hidden',
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingVertical: tokens.space[4],
    paddingHorizontal: tokens.space[4],
  },
  // No blanket `opacity` and no strikethrough: dimming the whole row is
  // what made the buttons read as disabled and dragged the XP green below
  // AA. "Done" is carried by the drawer title and the green number.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    minHeight: 60,
    paddingLeft: tokens.space[3],
    paddingRight: tokens.space[2],
    paddingVertical: tokens.space[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.divider,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  dimTile: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimTileMuted: {
    opacity: 0.55,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  rowTitleSkipped: {
    color: tokens.text.mid,
  },
  // Wraps rather than bleeding under the button stack: only ~134dp is left
  // for the text column once 44+4+44 is reserved on the right, and RN
  // defaults children to flexShrink: 0. minHeight 60 with paddingVertical 8
  // already tolerates a second meta line.
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  xpText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.xp,
  },
  sep: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.dim,
  },
  coinText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.semantic.coin,
  },
  timeText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.mid,
    flexShrink: 1,
  },
  skipMeta: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
  },
  // Real 44×44 boxes — no hitSlop, so no overlapping slop between the
  // constructive "+1" and the destructive undo sitting next to it.
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  extraBtn: {
    backgroundColor: 'rgba(61, 214, 140, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.38)',
  },
  extraBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(61, 214, 140, 0.26)',
  },
  extraBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.semantic.xp,
  },
  undoBtn: {
    marginLeft: tokens.space[1],
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  // Destructive colour only at the moment of commitment, so the drawer
  // isn't painted red at rest.
  undoBtnPressed: {
    backgroundColor: 'rgba(255, 92, 122, 0.16)',
    borderColor: 'rgba(255, 92, 122, 0.45)',
    transform: [{ scale: 0.92 }],
  },
  // Labelled, because "unskip" has no self-evident glyph. minWidth lines
  // its right edge up with the completed drawer's 44+4+44 stack.
  resumeBtn: {
    height: 44,
    minWidth: 92,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  // Violet, not danger — putting a practice back is constructive.
  resumeBtnPressed: {
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
    borderColor: 'rgba(123, 92, 255, 0.5)',
    transform: [{ scale: 0.92 }],
  },
  resumeBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.base,
  },
});
