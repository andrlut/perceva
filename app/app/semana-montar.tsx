import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GOLD_BADGE_BG, GOLD_TINT_BG } from '@/components/week/gold';
import { WeekAddInput } from '@/components/week/WeekAddInput';
import { WeekItemRow } from '@/components/week/WeekItemRow';
import {
  addDaysToKey,
  ritualTargetWeek,
  useAddWeekItem,
  useDeleteWeekItem,
  useUpdateWeekItem,
  useWeekItemActions,
  useWeekItems,
} from '@/lib/api/week';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useRequireModule } from '@/lib/modules';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

type BigDraft = { title: string; firstAction: string };

/**
 * Montar a semana — the Monday ritual, three steps, ~3 minutes:
 *
 *   1. What carried over? Last week's undone items, each a decision:
 *      bring it or let it go (no guilt — "let go" just leaves it behind,
 *      nothing turns red). Plus a free "dump it here" line.
 *   2. The week's 3 — "if the week ends and only these got done, it was
 *      a good week". First concrete step nudged under each.
 *   3. The rest — day chips optional, or leave everything loose.
 *
 * Every step persists as it goes (items are real rows the moment they're
 * created), so an interrupted ritual resumes where it left off.
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

  const targetItems = useWeekItems(targetWs, moduleOn);
  const prevItems = useWeekItems(prevWs, moduleOn);
  const addItem = useAddWeekItem();
  const updateItem = useUpdateWeekItem();
  const deleteItem = useDeleteWeekItem();
  const actions = useWeekItemActions(targetWs);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [saving, setSaving] = useState(false);

  // ── Step 1 state: carry decisions (default = bring; nothing lost silently)
  const leftovers = useMemo(
    () => (prevItems.data ?? []).filter((i) => i.done_at == null),
    [prevItems.data],
  );
  const [dropped, setDropped] = useState<Record<string, boolean>>({});

  // ── Step 2 state: the three bigs
  const [bigDrafts, setBigDrafts] = useState<BigDraft[]>([
    { title: '', firstAction: '' },
    { title: '', firstAction: '' },
    { title: '', firstAction: '' },
  ]);
  const [bigsSeeded, setBigsSeeded] = useState(false);

  const bigsBySlot = useMemo(() => {
    const map = new Map<number, WeekItem>();
    for (const i of targetItems.data ?? []) {
      if (i.slot != null) map.set(i.slot, i);
    }
    return map;
  }, [targetItems.data]);

  // Seed the big inputs from what the target week already holds — once,
  // as soon as data is available (re-running the ritual edits in place).
  useEffect(() => {
    if (bigsSeeded || !targetItems.data) return;
    setBigDrafts(
      ([1, 2, 3] as const).map((slot) => {
        const existing = bigsBySlot.get(slot);
        return {
          title: existing?.title ?? '',
          firstAction: existing?.first_action ?? '',
        };
      }),
    );
    setBigsSeeded(true);
  }, [bigsSeeded, targetItems.data, bigsBySlot]);

  const targetRest = useMemo(
    () => (targetItems.data ?? []).filter((i) => i.slot == null),
    [targetItems.data],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Apply carries (everything not explicitly dropped) and move to step 2. */
  const advanceFromLeftovers = async () => {
    setSaving(true);
    try {
      await Promise.all(
        leftovers
          .filter((i) => !dropped[i.id])
          .map((i) =>
            updateItem.mutateAsync({
              id: i.id,
              weekStart: prevWs,
              // A carried big arrives as a REGULAR item — the new week's 3
              // are chosen fresh in the next step, never inherited.
              patch: { week_start: targetWs, slot: null, day: null },
            }),
          ),
      );
      setStep(1);
    } finally {
      setSaving(false);
    }
  };

  /** Reconcile the three big inputs against the target week's slots. */
  const advanceFromBigs = async () => {
    setSaving(true);
    try {
      await Promise.all(
        ([1, 2, 3] as const).map((slot) => {
          const existing = bigsBySlot.get(slot);
          const draft = bigDrafts[slot - 1];
          const title = draft.title.trim();
          const firstAction = draft.firstAction.trim();
          if (!title && existing) {
            return deleteItem.mutateAsync({
              id: existing.id,
              weekStart: targetWs,
            });
          }
          if (title && !existing) {
            return addItem.mutateAsync({
              weekStart: targetWs,
              title,
              slot,
              firstAction: firstAction || null,
            });
          }
          if (
            existing &&
            (title !== existing.title ||
              firstAction !== (existing.first_action ?? ''))
          ) {
            return updateItem.mutateAsync({
              id: existing.id,
              weekStart: targetWs,
              patch: { title, first_action: firstAction || null },
            });
          }
          return Promise.resolve();
        }),
      );
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const loading = prevItems.isLoading || targetItems.isLoading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header: dots + close */}
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
          {/* ═══ Step 1 — what carried over ═══ */}
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
                  const isDropped = !!dropped[item.id];
                  return (
                    <View key={item.id} style={styles.leftoverRow}>
                      <Text
                        style={[
                          styles.leftoverTitle,
                          isDropped && styles.leftoverTitleDropped,
                        ]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Pressable
                        onPress={() =>
                          setDropped((d) => ({ ...d, [item.id]: false }))
                        }
                        style={({ pressed }) => [
                          styles.leftoverBtn,
                          !isDropped && styles.leftoverBtnOn,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t('week.setup.bring')}
                      >
                        <Text
                          style={[
                            styles.leftoverBtnText,
                            !isDropped && styles.leftoverBtnTextOn,
                          ]}
                        >
                          {t('week.setup.bring')}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setDropped((d) => ({ ...d, [item.id]: true }))
                        }
                        style={({ pressed }) => [
                          styles.leftoverBtn,
                          isDropped && styles.leftoverBtnDrop,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t('week.setup.drop')}
                      >
                        <Text
                          style={[
                            styles.leftoverBtnText,
                            isDropped && styles.leftoverBtnTextDrop,
                          ]}
                        >
                          {t('week.setup.drop')}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}

              <Text style={styles.dumpLabel}>{t('week.setup.dumpLabel')}</Text>
              <WeekAddInput
                placeholder={t('week.setup.dumpPlaceholder')}
                onSubmit={(title) => addItem.mutate({ weekStart: targetWs, title })}
              />
              {targetRest.length > 0 && (
                <View style={styles.dumpedList}>
                  {targetRest.map((i) => (
                    <Text key={i.id} style={styles.dumpedItem} numberOfLines={1}>
                      •  {i.title}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ═══ Step 2 — the week's 3 ═══ */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>{t('week.setup.bigTitle')}</Text>
              <Text style={styles.stepSub}>{t('week.setup.bigSub')}</Text>

              {([1, 2, 3] as const).map((slot) => (
                <View key={slot} style={styles.bigCard}>
                  <View style={styles.bigTitleRow}>
                    <View style={styles.bigNum}>
                      <Text style={styles.bigNumText}>{slot}</Text>
                    </View>
                    <TextInput
                      style={styles.bigInput}
                      value={bigDrafts[slot - 1].title}
                      onChangeText={(text) =>
                        setBigDrafts((d) =>
                          d.map((b, i) =>
                            i === slot - 1 ? { ...b, title: text } : b,
                          ),
                        )
                      }
                      placeholder={t('week.setup.bigPlaceholder', { n: slot })}
                      placeholderTextColor={tokens.text.faint}
                      returnKeyType="next"
                    />
                  </View>
                  {!!bigDrafts[slot - 1].title.trim() && (
                    <TextInput
                      style={styles.bigFirstAction}
                      value={bigDrafts[slot - 1].firstAction}
                      onChangeText={(text) =>
                        setBigDrafts((d) =>
                          d.map((b, i) =>
                            i === slot - 1 ? { ...b, firstAction: text } : b,
                          ),
                        )
                      }
                      placeholder={t('week.firstActionPlaceholder')}
                      placeholderTextColor={tokens.text.faint}
                      returnKeyType="done"
                    />
                  )}
                </View>
              ))}
              {bigDrafts.some((d) => d.title.trim().length > 0) && (
                <Text style={styles.bigHint}>{t('week.setup.slot1Hint')}</Text>
              )}
            </>
          )}

          {/* ═══ Step 3 — the rest ═══ */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>{t('week.setup.restTitle')}</Text>
              <Text style={styles.stepSub}>{t('week.setup.restSub')}</Text>

              {targetRest.map((item) => (
                <WeekItemRow
                  key={item.id}
                  item={item}
                  onToggleDone={actions.toggleDone}
                  onSetDay={actions.setDay}
                  onDelete={actions.remove}
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

      {/* ── Footer CTA ── */}
      {!loading && (
        <View style={styles.footer}>
          <Pressable
            onPress={
              step === 0
                ? advanceFromLeftovers
                : step === 1
                  ? advanceFromBigs
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
    </SafeAreaView>
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
  leftoverTitleDropped: {
    color: tokens.text.faint,
    textDecorationLine: 'line-through',
    fontFamily: tokens.font.family,
  },
  leftoverBtn: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  leftoverBtnOn: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  leftoverBtnDrop: {
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.surface2,
  },
  leftoverBtnText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: tokens.text.dim,
  },
  leftoverBtnTextOn: {
    color: tokens.brand.violet2,
  },
  leftoverBtnTextDrop: {
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
  bigCard: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  bigTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  bigNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 11,
    color: tokens.semantic.coinLight,
  },
  bigInput: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.hi,
    padding: 0,
  },
  bigFirstAction: {
    marginTop: tokens.space[2],
    marginLeft: 20 + tokens.space[3],
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.base,
    padding: 0,
  },
  bigHint: {
    fontFamily: tokens.font.family,
    fontSize: 12,
    color: tokens.text.dim,
    marginTop: tokens.space[2],
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
