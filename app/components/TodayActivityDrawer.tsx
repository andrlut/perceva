import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TodayActivity } from '@/lib/api/tasks';
import type { TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

interface Props {
  activity: TodayActivity;
  /** Re-fire a completion using the task's defaults (no override). */
  onExtraComplete: (task: TaskWithSubs) => void;
  /** Undo the most recent completion of this task today. */
  onUndoCompletion: (completionId: string) => void;
  /** Reverse a skip (task returns to the active list). */
  onUnskip: (task: TaskWithSubs) => void;
}

/**
 * Sits at the bottom of the bucket list on Home. Collapsed by default
 * (low visual weight). Header shows counts; expanded body lists each
 * completed/skipped task with quick actions:
 *
 *   - Completed row: title · Nx · +XP / +coins · [+ extra] [↶ undo]
 *   - Skipped row:   title · ⊘ skipped today · [↶ unskip]
 *
 * Renders nothing if both lists are empty (don't add chrome for nothing).
 */
export function TodayActivityDrawer({
  activity,
  onExtraComplete,
  onUndoCompletion,
  onUnskip,
}: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const completedCount = activity.completed.length;
  const skippedCount = activity.skipped.length;
  const total = completedCount + skippedCount;

  if (total === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.header,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={14}
          color={tokens.text.dim}
        />
        <Text style={styles.headerText}>
          {completedCount > 0 &&
            t('home.completedDrawer.completedSummary', { count: completedCount })}
          {completedCount > 0 && skippedCount > 0 && ' · '}
          {skippedCount > 0 &&
            t('home.completedDrawer.skippedSummary', { count: skippedCount })}
          {t('home.completedDrawer.tapToToggle')}
          {open ? t('home.completedDrawer.tapHide') : t('home.completedDrawer.tapView')}
        </Text>
        <View style={{ flex: 1 }} />
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={tokens.text.dim}
        />
      </Pressable>

      {open && (
        <View style={styles.body}>
          {activity.completed.map((entry) => (
            <CompletedRow
              key={entry.task.id}
              entry={entry}
              onExtra={() => onExtraComplete(entry.task)}
              onUndo={() => onUndoCompletion(entry.latestCompletionId)}
            />
          ))}
          {activity.skipped.map((task) => (
            <SkippedRow
              key={task.id}
              task={task}
              onUnskip={() => onUnskip(task)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface CompletedRowProps {
  entry: TodayActivity['completed'][number];
  onExtra: () => void;
  onUndo: () => void;
}

function CompletedRow({ entry, onExtra, onUndo }: CompletedRowProps) {
  const { task, count, totalXp, totalCoins } = entry;
  const subMeta = SUB_META[task.primary_sub_id];
  const dimMeta = DIMENSION_META[task.primary_dimension_id];
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.subDot,
          { backgroundColor: dimMeta.bg, borderColor: dimMeta.color + '55' },
        ]}
      >
        {subMeta && (
          <Ionicons
            name={subMeta.iconName as never}
            size={12}
            color={dimMeta.color}
          />
        )}
      </View>
      <View style={styles.body2}>
        <Text style={styles.title} numberOfLines={1}>
          {task.title}
          {count > 1 && <Text style={styles.countDim}>  ×{count}</Text>}
        </Text>
        <Text style={styles.meta}>
          +{totalXp} XP · +{totalCoins}
        </Text>
      </View>
      <Pressable
        onPress={onExtra}
        hitSlop={6}
        style={({ pressed }) => [
          styles.actionBtn,
          { borderColor: dimMeta.color + '88' },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="add" size={12} color={dimMeta.color} />
      </Pressable>
      <Pressable
        onPress={onUndo}
        hitSlop={6}
        style={({ pressed }) => [
          styles.actionBtn,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="arrow-undo" size={12} color={tokens.text.dim} />
      </Pressable>
    </View>
  );
}

interface SkippedRowProps {
  task: TaskWithSubs;
  onUnskip: () => void;
}

function SkippedRow({ task, onUnskip }: SkippedRowProps) {
  const { t } = useT();
  const subMeta = SUB_META[task.primary_sub_id];
  const dimMeta = DIMENSION_META[task.primary_dimension_id];
  const warn = tokens.semantic.warn ?? '#FF9F43';
  return (
    <View style={[styles.row, styles.rowSkipped]}>
      <View
        style={[
          styles.subDot,
          {
            backgroundColor: dimMeta.bg,
            borderColor: dimMeta.color + '55',
            opacity: 0.6,
          },
        ]}
      >
        {subMeta && (
          <Ionicons
            name={subMeta.iconName as never}
            size={12}
            color={dimMeta.color}
          />
        )}
      </View>
      <View style={styles.body2}>
        <Text style={[styles.title, styles.titleSkipped]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.skipBadgeRow}>
          <Ionicons name="remove-circle" size={11} color={warn} />
          <Text style={[styles.meta, { color: warn }]}>{t('home.completedDrawer.skippedToday')}</Text>
        </View>
      </View>
      <Pressable
        onPress={onUnskip}
        hitSlop={6}
        style={({ pressed }) => [
          styles.actionBtn,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="arrow-undo" size={12} color={tokens.text.dim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
  },
  headerText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.dim,
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  body: {
    paddingTop: 4,
    paddingBottom: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: tokens.border.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    paddingVertical: 8,
  },
  rowSkipped: {
    opacity: 0.85,
  },
  subDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body2: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
    textDecorationLine: 'line-through',
  },
  titleSkipped: {
    textDecorationLine: 'none',
  },
  countDim: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.dim,
    textDecorationLine: 'none',
  },
  meta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.dim,
  },
  skipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
