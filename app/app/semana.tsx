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
import { WeekAddInput } from '@/components/week/WeekAddInput';
import { WeekItemRow } from '@/components/week/WeekItemRow';
import {
  addDaysToKey,
  useAddWeekItem,
  useWeekItemActions,
  useWeekItems,
  weekStartKey,
} from '@/lib/api/week';
import { formatWindowLabel } from '@/lib/dedicacao/windowLabel';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useRequireModule } from '@/lib/modules';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * Minha Semana — the weekly sheet. The paper template as one screen:
 * the week's 3 bigs on top, the life-admin list below. Not a calendar
 * (timed commitments live in the user's real calendar); not practices
 * (those live on the Today hub, with XP). Checking here grants nothing —
 * the tick is the reward.
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

  const items = useWeekItems(ws, moduleOn);
  const addItem = useAddWeekItem();
  const actions = useWeekItemActions(ws);

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

  const bigsBySlot = useMemo(() => {
    const map = new Map<number, WeekItem>();
    for (const i of items.data ?? []) {
      if (i.slot != null) map.set(i.slot, i);
    }
    return map;
  }, [items.data]);

  const rest = useMemo(
    () => (items.data ?? []).filter((i) => i.slot == null),
    [items.data],
  );

  const isEmpty = items.data != null && items.data.length === 0;

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

      {items.isLoading ? (
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
          {isEmpty ? (
            /* ── Empty week ── */
            <View style={styles.empty}>
              <Ionicons
                name="reader-outline"
                size={30}
                color={tokens.text.dim}
              />
              <Text style={styles.emptyTitle}>{t('week.empty.title')}</Text>
              <Text style={styles.emptyBody}>{t('week.empty.body')}</Text>
              <Pressable
                onPress={() => router.push('/semana-montar')}
                style={({ pressed }) => [
                  styles.emptyCta,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('week.empty.cta')}
              >
                <Text style={styles.emptyCtaText}>{t('week.empty.cta')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* ── As 3 da semana ── */}
              <Text style={styles.sectionLabel}>{t('week.big3')}</Text>
              {([1, 2, 3] as const).map((slot) => (
                <BigSlot
                  key={slot}
                  slot={slot}
                  item={bigsBySlot.get(slot)}
                  onCreate={(s, title) =>
                    addItem.mutate({ weekStart: ws, title, slot: s })
                  }
                  onToggleDone={actions.toggleDone}
                  onSetFirstAction={actions.setFirstAction}
                  onDelete={actions.remove}
                />
              ))}

              {/* ── Mais desta semana ── */}
              <Text style={[styles.sectionLabel, styles.sectionGap]}>
                {t('week.more')}
              </Text>
              {rest.map((item) => (
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
                onSubmit={(title) => addItem.mutate({ weekStart: ws, title })}
              />

              {/* ── Rebuild ── */}
              <Pressable
                onPress={() => router.push('/semana-montar')}
                style={({ pressed }) => [
                  styles.rebuildBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('week.setup.title')}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={tokens.text.mid}
                />
                <Text style={styles.rebuildText}>{t('week.setup.title')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
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
