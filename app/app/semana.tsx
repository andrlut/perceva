import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigSlot } from '@/components/week/BigSlot';
import { PickBigModal, type BigCandidate } from '@/components/week/PickBig';
import { WeekAddInput } from '@/components/week/WeekAddInput';
import { WeekItemRow } from '@/components/week/WeekItemRow';
import {
  addDaysToKey,
  useAddWeekItem,
  useAllocateItem,
  usePool,
  useWeekItemActions,
  useWeekSheet,
  weekStartKey,
} from '@/lib/api/week';
import { formatWindowLabel } from '@/lib/dedicacao/windowLabel';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useRequireModule } from '@/lib/modules';
import { useLoadedSettings } from '@/lib/settings';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * Minha Semana — the weekly sheet over the POOL model. Items live in a
 * general queue ("Pra depois"); the week is a selection: 3 bigs chosen
 * (never re-typed), days given, the rest waits. Done items tuck into a
 * drawer. Zero XP anywhere — the tick is the reward.
 */
export default function SemanaScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const settings = useLoadedSettings();
  const moduleOn = useRequireModule('semana');

  const [weekOffset, setWeekOffset] = useState(0);
  const ws = useMemo(
    () =>
      addDaysToKey(weekStartKey(new Date(), settings.weekStart), weekOffset * 7),
    [settings.weekStart, weekOffset],
  );

  const sheet = useWeekSheet(ws, moduleOn);
  const pool = usePool(moduleOn);
  const addItem = useAddWeekItem();
  const allocate = useAllocateItem();
  const weekActions = useWeekItemActions(ws);
  const poolActions = useWeekItemActions(null);

  const [pickSlot, setPickSlot] = useState<1 | 2 | 3 | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);

  // Same week-range label the Dedicação window header uses ("25 – 31 ago").
  const range = useMemo(() => {
    const [y, m, d] = ws.split('-').map(Number);
    return formatWindowLabel(
      { granularity: 'week', offset: 0 },
      new Date(y, m - 1, d),
      new Date(y, m - 1, d + 6),
      locale,
    );
  }, [ws, locale]);

  const candidates: BigCandidate[] = useMemo(
    () => [
      ...(pool.data ?? []).map((item) => ({ item, from: 'pool' as const })),
      ...(sheet.data?.rest ?? []).map((item) => ({ item, from: 'week' as const })),
    ],
    [pool.data, sheet.data?.rest],
  );

  const handlePick = (c: BigCandidate) => {
    if (pickSlot == null) return;
    allocate.mutate({
      item: c.item,
      fromWeek: c.from === 'pool' ? null : ws,
      toWeek: ws,
      slot: pickSlot,
    });
  };

  const handleDeleteStep = async (step: WeekItem) => {
    const ok = await confirmAction(t('week.deleteConfirmTitle'), step.title, {
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) weekActions.remove(step);
  };

  const handleDeletePoolItem = async (item: WeekItem) => {
    const ok = await confirmAction(t('week.deleteConfirmTitle'), item.title, {
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) poolActions.remove(item);
  };

  const isLoading = sheet.isLoading || pool.isLoading;
  const isAllEmpty =
    sheet.data != null &&
    sheet.data.items.length === 0 &&
    (pool.data?.length ?? 0) === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="chevron-back" size={22} color={tokens.text.base} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t('week.title')}</Text>
          <Text style={styles.range}>{range}</Text>
        </View>
        <View style={styles.weekNav}>
          <Pressable
            onPress={() => setWeekOffset((o) => o - 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('week.prevWeek')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name="chevron-back" size={16} color={tokens.text.dim} />
          </Pressable>
          <Pressable
            onPress={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('week.thisWeek')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View
              style={[styles.todayDot, weekOffset === 0 && styles.todayDotOn]}
            />
          </Pressable>
          <Pressable
            onPress={() => setWeekOffset((o) => o + 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('week.nextWeek')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tokens.brand.violet2} />
        </View>
      ) : isAllEmpty ? (
        /* ── First touch: nothing anywhere yet ── */
        <View style={styles.empty}>
          <Ionicons name="reader-outline" size={30} color={tokens.text.dim} />
          <Text style={styles.emptyTitle}>{t('week.empty.title')}</Text>
          <Text style={styles.emptyBody}>{t('week.empty.body')}</Text>
          <Pressable
            onPress={() => router.push('/semana-montar')}
            style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('week.empty.cta')}
          >
            <Text style={styles.emptyCtaText}>{t('week.empty.cta')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── As 3 da semana ── */}
          <Text style={styles.sectionLabel}>{t('week.big3')}</Text>
          {([1, 2, 3] as const).map((slot) => (
            <BigSlot
              key={slot}
              slot={slot}
              big={sheet.data?.bigs.get(slot)}
              onPick={setPickSlot}
              onToggleDone={weekActions.toggleDone}
              onSetDay={weekActions.setDay}
              onToggleStep={weekActions.toggleDone}
              onAddStep={(parent, title) =>
                addItem.mutate({ weekStart: ws, title, parentId: parent.id })
              }
              onDeleteStep={handleDeleteStep}
              onUnslot={(item) =>
                allocate.mutate({ item, fromWeek: ws, toWeek: ws, slot: null })
              }
              onDelete={weekActions.remove}
            />
          ))}

          {/* ── Mais desta semana ── */}
          <Text style={[styles.sectionLabel, styles.sectionGap]}>
            {t('week.more')}
          </Text>
          {(sheet.data?.rest ?? []).map((item) => (
            <WeekItemRow
              key={item.id}
              item={item}
              onToggleDone={weekActions.toggleDone}
              onSetDay={weekActions.setDay}
              onDelete={weekActions.remove}
            />
          ))}
          <WeekAddInput
            placeholder={t('week.addPlaceholder')}
            onSubmit={(title) => addItem.mutate({ weekStart: ws, title })}
          />

          {/* ── Feitas (drawer) ── */}
          {(sheet.data?.restDone.length ?? 0) > 0 && (
            <>
              <Pressable
                onPress={() => setDoneOpen((v) => !v)}
                style={({ pressed }) => [styles.drawerHeader, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: doneOpen }}
              >
                <Ionicons
                  name={doneOpen ? 'chevron-down' : 'chevron-forward'}
                  size={13}
                  color={tokens.text.dim}
                />
                <Text style={styles.drawerLabel}>
                  {t('week.doneDrawer', { count: sheet.data!.restDone.length })}
                </Text>
              </Pressable>
              {doneOpen &&
                sheet.data!.restDone.map((item) => (
                  <WeekItemRow
                    key={item.id}
                    item={item}
                    onToggleDone={weekActions.toggleDone}
                    onSetDay={weekActions.setDay}
                    onDelete={weekActions.remove}
                  />
                ))}
            </>
          )}

          {/* ── Pra depois (a fila / pool) ── */}
          {(pool.data?.length ?? 0) > 0 && (
            <>
              <Pressable
                onPress={() => setPoolOpen((v) => !v)}
                style={({ pressed }) => [styles.drawerHeader, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: poolOpen }}
              >
                <Ionicons
                  name={poolOpen ? 'chevron-down' : 'chevron-forward'}
                  size={13}
                  color={tokens.text.dim}
                />
                <Text style={styles.drawerLabel}>
                  {t('week.pool.title', { count: pool.data!.length })}
                </Text>
              </Pressable>
              {poolOpen &&
                pool.data!.map((item) => (
                  <View key={item.id} style={styles.poolRow}>
                    <Pressable
                      onLongPress={() => handleDeletePoolItem(item)}
                      style={styles.poolMain}
                      accessibilityLabel={item.title}
                    >
                      <Text style={styles.poolTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        allocate.mutate({ item, fromWeek: null, toWeek: ws })
                      }
                      style={({ pressed }) => [
                        styles.pullBtn,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('week.pool.pull')}
                    >
                      <Text style={styles.pullText}>{t('week.pool.pull')}</Text>
                    </Pressable>
                  </View>
                ))}
            </>
          )}

          {/* ── Rebuild ── */}
          <Pressable
            onPress={() => router.push('/semana-montar')}
            style={({ pressed }) => [styles.rebuildBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('week.setup.title')}
          >
            <Ionicons name="sparkles-outline" size={14} color={tokens.text.mid} />
            <Text style={styles.rebuildText}>{t('week.setup.title')}</Text>
          </Pressable>
        </ScrollView>
      )}

      {pickSlot != null && (
        <PickBigModal
          visible
          slot={pickSlot}
          candidates={candidates}
          onPick={handlePick}
          onCreate={(title) => {
            addItem.mutate({ weekStart: ws, title, slot: pickSlot });
            setPickSlot(null);
          }}
          onClose={() => setPickSlot(null)}
        />
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
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    gap: tokens.space[3],
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 22,
    color: tokens.text.hi,
  },
  range: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    color: tokens.text.dim,
    marginTop: 1,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  todayDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: tokens.bg.surface3,
  },
  todayDotOn: {
    backgroundColor: tokens.brand.violet2,
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
    paddingBottom: tokens.space[10],
  },
  sectionLabel: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.mid,
    marginBottom: tokens.space[2],
    marginTop: tokens.space[2],
  },
  sectionGap: {
    marginTop: tokens.space[5],
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    marginTop: tokens.space[5],
    marginBottom: tokens.space[2],
  },
  drawerLabel: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.border.divider,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  poolMain: {
    flex: 1,
  },
  poolTitle: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.base,
  },
  pullBtn: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pullText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: tokens.brand.violet2,
  },
  rebuildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    marginTop: tokens.space[6],
    borderWidth: 1,
    borderColor: tokens.border.strong,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
  },
  rebuildText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.mid,
  },
  empty: {
    alignItems: 'center',
    paddingTop: tokens.space[9],
    paddingHorizontal: tokens.space[5],
    gap: tokens.space[3],
  },
  emptyTitle: {
    fontFamily: tokens.font.familyBold,
    fontSize: 17,
    color: tokens.text.hi,
  },
  emptyBody: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: tokens.space[2],
    backgroundColor: tokens.brand.violetDeep,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[6],
  },
  emptyCtaText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.hi,
  },
});
