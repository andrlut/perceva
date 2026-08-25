import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GOLD_BADGE_BG } from '@/components/week/gold';
import { DayPickerModal } from '@/components/week/DayPickerModal';
import { ItemEditorModal } from '@/components/week/ItemEditorModal';
import { BigCandidateList, type BigCandidate } from '@/components/week/PickBig';
import { WeekAddInput } from '@/components/week/WeekAddInput';
import { WeekItemRow } from '@/components/week/WeekItemRow';
import {
  addDaysToKey,
  ritualTargetWeek,
  useAddWeekItem,
  useAllocateItem,
  usePool,
  useWeekItemActions,
  useWeekSheet,
} from '@/lib/api/week';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useRequireModule } from '@/lib/modules';
import { useLoadedSettings } from '@/lib/settings';
import { weekdayShortByIndex } from '@/lib/time';
import { tokens } from '@/theme';

/**
 * Montar a semana — the ritual over the POOL model, three steps:
 *
 *   1. What's left? Last week's undone items — each goes "Esta semana" or
 *      "Depois" (back to the pool; the default — no guilt). Free dump line
 *      feeds the pool.
 *   2. Pick the 3 — CHOSEN from the pool + this week's items, never typed
 *      twice. Selection order matters: #1 is "if only one happens".
 *   3. Give days — the 3 first, then the rest. All optional.
 *
 * Everything persists as it goes; an interrupted ritual resumes.
 */
export default function SemanaMontarScreen() {
  const router = useRouter();
  const { t } = useT();
  const settings = useLoadedSettings();
  const moduleOn = useRequireModule('semana');

  const target = useMemo(
    () => ritualTargetWeek(new Date(), settings.weekStart),
    [settings.weekStart],
  );
  const targetWs = target.weekStartKey;
  const prevWs = addDaysToKey(targetWs, -7);

  const targetSheet = useWeekSheet(targetWs, moduleOn);
  const prevSheet = useWeekSheet(prevWs, moduleOn);
  const pool = usePool(moduleOn);
  const addItem = useAddWeekItem();
  const allocate = useAllocateItem();
  const targetActions = useWeekItemActions(targetWs);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem =
    editingId == null
      ? null
      : (targetSheet.data?.items.find((i) => i.id === editingId) ?? null);

  // ── Step 1 state: destination per leftover (default = back to the pool)
  const leftovers = useMemo(
    () => (prevSheet.data?.items ?? []).filter((i) => i.done_at == null),
    [prevSheet.data?.items],
  );
  const [toWeek, setToWeek] = useState<Record<string, boolean>>({});

  // ── Step 2 state: ordered selection of the 3
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !targetSheet.data) return;
    const current = [...targetSheet.data.bigs.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, big]) => big.item.id);
    setSelectedIds(current);
    setSeeded(true);
  }, [seeded, targetSheet.data]);

  const candidates: BigCandidate[] = useMemo(() => {
    const bigsNow = [...(targetSheet.data?.bigs.values() ?? [])].map(
      (b) => ({ item: b.item, from: 'week' as const }),
    );
    return [
      ...bigsNow,
      ...(targetSheet.data?.rest ?? []).map((item) => ({
        item,
        from: 'week' as const,
      })),
      ...(pool.data ?? []).map((item) => ({ item, from: 'pool' as const })),
    ];
  }, [targetSheet.data, pool.data]);

  const toggleSelect = (id: string) => {
    setSelectedIds((sel) =>
      sel.includes(id)
        ? sel.filter((s) => s !== id)
        : sel.length >= 3
          ? sel
          : [...sel, id],
    );
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Step 1 → allocate each leftover (week or pool) and advance. */
  const advanceFromLeftovers = async () => {
    setSaving(true);
    try {
      await Promise.all(
        leftovers.map((item) =>
          allocate.mutateAsync({
            item,
            fromWeek: prevWs,
            toWeek: toWeek[item.id] ? targetWs : null,
          }),
        ),
      );
      setStep(1);
    } finally {
      setSaving(false);
    }
  };

  /** Step 2 → reconcile the selection against the week's slots. */
  const advanceFromPick = async () => {
    setSaving(true);
    try {
      const byId = new Map(candidates.map((c) => [c.item.id, c]));
      const currentBigs = [...(targetSheet.data?.bigs.values() ?? [])];
      const ops: Promise<unknown>[] = [];
      // Demote bigs that fell out of the selection (stay in the week).
      for (const big of currentBigs) {
        if (!selectedIds.includes(big.item.id)) {
          ops.push(
            allocate.mutateAsync({
              item: big.item,
              fromWeek: targetWs,
              toWeek: targetWs,
              slot: null,
            }),
          );
        }
      }
      // Place the selected, in order.
      selectedIds.forEach((id, idx) => {
        const c = byId.get(id);
        if (!c) return;
        const slot = (idx + 1) as 1 | 2 | 3;
        if (c.item.slot === slot && c.item.week_start === targetWs) return;
        ops.push(
          allocate.mutateAsync({
            item: c.item,
            fromWeek: c.from === 'pool' ? null : targetWs,
            toWeek: targetWs,
            slot,
          }),
        );
      });
      await Promise.all(ops);
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const loading =
    prevSheet.isLoading || targetSheet.isLoading || pool.isLoading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.dots}>
          {[0, 1, 2].map((s) => (
            <View key={s} style={[styles.dot, step >= s && styles.dotOn]} />
          ))}
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="close" size={22} color={tokens.text.mid} />
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>
        {t('week.setup.title')}
        {target.isNext ? ` · ${t('week.setup.targetNext')}` : ''}
      </Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tokens.brand.violet2} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ═══ Step 1 — what's left ═══ */}
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>{t('week.setup.leftTitle')}</Text>
              <Text style={styles.stepSub}>{t('week.setup.leftSub')}</Text>

              {leftovers.length === 0 ? (
                <Text style={styles.nothingLeft}>
                  {t('week.setup.nothingLeft')}
                </Text>
              ) : (
                leftovers.map((item) => {
                  const bring = !!toWeek[item.id];
                  return (
                    <View key={item.id} style={styles.leftoverRow}>
                      <Text style={styles.leftoverTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Pressable
                        onPress={() =>
                          setToWeek((d) => ({ ...d, [item.id]: true }))
                        }
                        style={({ pressed }) => [
                          styles.destBtn,
                          bring && styles.destBtnOn,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: bring }}
                      >
                        <Text
                          style={[styles.destText, bring && styles.destTextOn]}
                        >
                          {t('week.setup.toWeek')}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setToWeek((d) => ({ ...d, [item.id]: false }))
                        }
                        style={({ pressed }) => [
                          styles.destBtn,
                          !bring && styles.destBtnLater,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: !bring }}
                      >
                        <Text
                          style={[styles.destText, !bring && styles.destTextLater]}
                        >
                          {t('week.setup.toPool')}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}

              <Text style={styles.dumpLabel}>{t('week.setup.dumpLabel')}</Text>
              <WeekAddInput
                placeholder={t('week.setup.dumpPlaceholder')}
                onSubmit={(title) => addItem.mutate({ title })}
              />
              {(pool.data?.length ?? 0) > 0 && (
                <View style={styles.dumpedList}>
                  {pool.data!.map((i) => (
                    <Text key={i.id} style={styles.dumpedItem} numberOfLines={1}>
                      •  {i.title}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ═══ Step 2 — pick the 3 ═══ */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>{t('week.setup.bigTitle')}</Text>
              <Text style={styles.stepSub}>{t('week.setup.bigSub')}</Text>
              <Text style={styles.counter}>
                {t('week.pick.counter', { n: selectedIds.length })}
              </Text>

              <BigCandidateList
                candidates={candidates}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                onCreate={async (title) => {
                  const created = await addItem.mutateAsync({ title });
                  setSelectedIds((sel) =>
                    sel.length >= 3 ? sel : [...sel, created.id],
                  );
                }}
              />
              {selectedIds.length > 0 && (
                <Text style={styles.hint}>{t('week.setup.slot1Hint')}</Text>
              )}
            </>
          )}

          {/* ═══ Step 3 — give days ═══ */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>{t('week.setup.restTitle')}</Text>
              <Text style={styles.stepSub}>{t('week.setup.restSub')}</Text>

              {(targetSheet.data?.bigs.size ?? 0) > 0 && (
                <>
                  <Text style={styles.groupLabel}>{t('week.setup.bigDays')}</Text>
                  {[...(targetSheet.data?.bigs.entries() ?? [])]
                    .sort((a, b) => a[0] - b[0])
                    .map(([slot, big]) => (
                      <BigDayRow
                        key={big.item.id}
                        slot={slot}
                        item={big.item}
                        onSetDay={targetActions.setDay}
                      />
                    ))}
                </>
              )}

              {(targetSheet.data?.rest.length ?? 0) > 0 && (
                <Text style={styles.groupLabel}>{t('week.more')}</Text>
              )}
              {(targetSheet.data?.rest ?? []).map((item) => (
                <WeekItemRow
                  key={item.id}
                  item={item}
                  onToggleDone={targetActions.toggleDone}
                  onSetDay={targetActions.setDay}
                  onOpen={(i) => setEditingId(i.id)}
                />
              ))}
              <WeekAddInput
                placeholder={t('week.addPlaceholder')}
                onSubmit={(title) => addItem.mutate({ weekStart: targetWs, title })}
              />
            </>
          )}
        </ScrollView>
      )}

      {!loading && (
        <View style={styles.footer}>
          <Pressable
            onPress={
              step === 0
                ? advanceFromLeftovers
                : step === 1
                  ? advanceFromPick
                  : () => router.back()
            }
            disabled={saving}
            style={({ pressed }) => [
              styles.cta,
              (pressed || saving) && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={tokens.text.hi} size="small" />
            ) : (
              <Text style={styles.ctaText}>
                {step === 2 ? t('week.setup.done') : t('week.setup.next')}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      <ItemEditorModal
        item={editingItem}
        cacheWeek={targetWs}
        sheetWeek={targetWs}
        onClose={() => setEditingId(null)}
      />
    </SafeAreaView>
  );
}

/** Compact "big + day chip" row for step 3. */
function BigDayRow({
  slot,
  item,
  onSetDay,
}: {
  slot: number;
  item: WeekItem;
  onSetDay: (item: WeekItem, day: number | null) => void;
}) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.bigDayRow}>
      <View style={styles.bigBadge}>
        <Text style={styles.bigBadgeText}>{slot}</Text>
      </View>
      <Text style={styles.bigDayTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('week.dayChipA11y')}
        style={({ pressed }) => [
          styles.dayChip,
          item.day == null && styles.dayChipEmpty,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[styles.dayChipText, item.day == null && styles.dayChipTextEmpty]}
        >
          {item.day == null ? '—' : weekdayShortByIndex(item.day, locale)}
        </Text>
      </Pressable>
      <DayPickerModal
        visible={open}
        day={item.day}
        onSelect={(d) => onSetDay(item, d)}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.bg.base,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: tokens.bg.surface3,
  },
  dotOn: {
    backgroundColor: tokens.brand.violet2,
  },
  eyebrow: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.mid,
    paddingHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: tokens.space[4],
    paddingBottom: tokens.space[6],
  },
  stepTitle: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 24,
    color: tokens.text.hi,
    marginTop: tokens.space[1],
  },
  stepSub: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.mid,
    marginTop: 4,
    marginBottom: tokens.space[4],
  },
  counter: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 12,
    color: tokens.semantic.coinLight,
    marginBottom: tokens.space[3],
  },
  hint: {
    fontFamily: tokens.font.family,
    fontSize: 12,
    color: tokens.text.dim,
    marginTop: tokens.space[2],
  },
  nothingLeft: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.dim,
    marginBottom: tokens.space[4],
  },
  leftoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  leftoverTitle: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  destBtn: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  destBtnOn: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  destBtnLater: {
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.surface2,
  },
  destText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: tokens.text.dim,
  },
  destTextOn: {
    color: tokens.brand.violet2,
  },
  destTextLater: {
    color: tokens.text.mid,
  },
  dumpLabel: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.mid,
    marginTop: tokens.space[5],
    marginBottom: tokens.space[2],
  },
  dumpedList: {
    marginTop: tokens.space[3],
    gap: 4,
  },
  dumpedItem: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.base,
  },
  groupLabel: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.mid,
    marginTop: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  bigDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: 'rgba(255, 200, 61, 0.05)',
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  bigBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBadgeText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 10,
    color: tokens.semantic.coinLight,
  },
  bigDayTitle: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  dayChip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.4)',
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  },
  dayChipEmpty: {
    borderColor: tokens.border.base,
    backgroundColor: 'transparent',
  },
  dayChipText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: tokens.brand.violet2,
  },
  dayChipTextEmpty: {
    color: tokens.text.dim,
  },
  footer: {
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
  },
  cta: {
    backgroundColor: tokens.brand.violetDeep,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[4],
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 15,
    color: tokens.text.hi,
  },
});
