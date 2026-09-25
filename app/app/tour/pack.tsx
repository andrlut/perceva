import type { ErrorBoundaryProps } from 'expo-router';
import { TourErrorBoundary } from '@/components/tour/TourErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  useActiveTasks,
  useStartTaskFromTemplate,
  useTaskTemplates,
} from '@/lib/api/tasks';
import type { TaskSub, TaskTemplateWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { freeLimitEntity } from '@/lib/premium';
import { exitTourToHome } from '@/lib/tour/navigation';
import { STARTER_PACK_IDS, templateCadence, templateXp } from '@/lib/tour/starterPack';
import { useTourStore } from '@/lib/tour/store';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

/** Ink on the gold primary button — same as FullScreenStep's CTA. */
const GOLD_INK = '#3D2A00';

/** One-tap limits over the priority order ("quantas você quer, no máximo"). */
const QUICK_LIMITS = [3, 6] as const;

/**
 * Onboarding · starter pack (route module `pack`, after `intro`).
 *
 * A closed suggestion, not a choice (maintainer, 2026-09-26): the 12
 * practices of lib/tour/starterPack.ts, numbered by priority, all ticked.
 * The user accepts them, unticks some (or takes the top 3 / top 6), or
 * skips — nothing else to decide, since every practice can be changed later.
 *
 * Leaving must always be possible (a user with practices of their own found
 * no way out, closed the app, and the AuthGate re-opened this screen on every
 * launch): "Pular" is a real button in the footer and the Android back button
 * skips too. Both mark `pack` skipped, which releases the AuthGate.
 */
export default function TourPackScreen() {
  const { t } = useT();
  const templates = useTaskTemplates();
  const activeTasks = useActiveTasks();
  const startFromTemplate = useStartTaskFromTemplate();
  const setStatus = useTourStore((s) => s.setStatus);

  // null = untouched (everything in the pack ticked).
  const [picked, setPicked] = useState<ReadonlySet<string> | null>(null);
  const [run, setRun] = useState<{ current: number; total: number } | null>(null);
  // State updates are async; a fast double tap must not start two runs.
  const runningRef = useRef(false);
  const busy = run !== null;

  const ready = templates.data != null && activeTasks.data != null;
  const loadFailed = !ready && (templates.isError || activeTasks.isError);

  // Templates already on the user's list show as done, never adopted twice.
  const adoptedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const task of activeTasks.data ?? []) {
      if (task.template_id) ids.add(task.template_id);
    }
    return ids;
  }, [activeTasks.data]);

  // The pack in priority order, minus anything missing from the catalog.
  const rows = useMemo(() => {
    const byId = new Map((templates.data ?? []).map((tpl) => [tpl.id, tpl]));
    return STARTER_PACK_IDS.map((id) => byId.get(id)).filter(
      (tpl): tpl is TaskTemplateWithSubs => tpl != null,
    );
  }, [templates.data]);

  const available = useMemo(
    () => rows.filter((tpl) => !adoptedIds.has(tpl.id)).map((tpl) => tpl.id),
    [rows, adoptedIds],
  );
  const selection = picked ?? new Set(available);
  const newIds = available.filter((id) => selection.has(id));
  const newXp = rows
    .filter((tpl) => newIds.includes(tpl.id))
    .reduce((sum, tpl) => sum + templateXp(tpl), 0);

  const skip = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    Haptics.selectionAsync().catch(() => {});
    await setStatus('pack', 'skipped');
    exitTourToHome();
  }, [setStatus]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        void skip();
        return true;
      });
      return () => sub.remove();
    }, [skip]),
  );

  const toggle = (id: string) => {
    if (busy || adoptedIds.has(id)) return;
    Haptics.selectionAsync().catch(() => {});
    setPicked((prev) => {
      const next = new Set(prev ?? available);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Top N by priority, counting only what is not on the list yet.
  const limitTo = (n: number | null) => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});
    setPicked(n == null ? null : new Set(available.slice(0, n)));
  };
  const activeLimit =
    picked == null
      ? null
      : QUICK_LIMITS.find(
          (n) =>
            newIds.length === Math.min(n, available.length) &&
            newIds.every((id, i) => id === available[i]),
        );

  const handleAdd = async () => {
    if (!ready || runningRef.current) return;
    if (newIds.length === 0) {
      await skip();
      return;
    }
    runningRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const queue = [...newIds];
    let landed = 0;
    for (const [i, id] of queue.entries()) {
      setRun({ current: i + 1, total: queue.length });
      try {
        await startFromTemplate.mutateAsync(id);
        landed += 1;
      } catch (e) {
        // The root MutationCache already opened the limit modal — keep what
        // landed and move on.
        if (freeLimitEntity(e)) break;
        console.warn(`[tour pack] adopt ${id} failed:`, e);
      }
    }
    if (landed === 0) {
      // Nothing landed — stay, so the user can retry or skip.
      runningRef.current = false;
      setRun(null);
      void showInfo(t('tour.errors.adopt'));
      return;
    }
    await setStatus('pack', 'completed');
    exitTourToHome();
  };

  const primaryLabel = run
    ? t('tour.pack.adding', { current: run.current, total: run.total })
    : newIds.length > 0
      ? t('tour.pack.add', { count: newIds.length })
      : t('tour.pack.continue');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <ScreenBackground withGoldHalo>
        {!ready ? (
          <View style={styles.center}>
            {loadFailed ? (
              <Pressable
                onPress={() => {
                  void templates.refetch();
                  void activeTasks.refetch();
                }}
                style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={16} color={tokens.text.hi} />
                <Text style={styles.retryText}>{t('tour.pack.retry')}</Text>
              </Pressable>
            ) : (
              <ActivityIndicator color={tokens.brand.violet2} />
            )}
            {/* Even a failed or slow load can be walked out of. */}
            <Pressable onPress={skip} style={styles.skipBtn} accessibilityRole="button">
              <Text style={styles.skipText}>{t('tour.pack.skip')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.eyebrow}>{t('tour.pack.eyebrow')}</Text>
                <Text style={styles.title}>{t('tour.pack.title')}</Text>
                <Text style={styles.body}>{t('tour.pack.body')}</Text>
              </View>

              {available.length > 0 && (
                <View style={styles.chips}>
                  {QUICK_LIMITS.map((n) => (
                    <Chip
                      key={n}
                      label={t('tour.pack.top', { count: n })}
                      on={activeLimit === n}
                      onPress={() => limitTo(n)}
                    />
                  ))}
                  <Chip
                    label={t('tour.pack.all')}
                    on={picked == null || newIds.length === available.length}
                    onPress={() => limitTo(null)}
                  />
                </View>
              )}

              <View style={styles.list}>
                {rows.map((tpl, i) => (
                  <PackRow
                    key={tpl.id}
                    tpl={tpl}
                    rank={i + 1}
                    on={selection.has(tpl.id)}
                    adopted={adoptedIds.has(tpl.id)}
                    disabled={busy}
                    onToggle={toggle}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {newIds.length > 0 && !run && (
                <Text style={styles.summary}>{t('tour.pack.total', { xp: newXp })}</Text>
              )}
              <Pressable
                disabled={busy}
                onPress={handleAdd}
                style={({ pressed }) => [styles.primaryBtn, pressed && !busy && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={primaryLabel}
                accessibilityState={{ busy }}
              >
                {busy && <ActivityIndicator size="small" color={GOLD_INK} />}
                <Text style={styles.primaryText}>{primaryLabel}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={skip}
                style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>{t('tour.pack.skip')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScreenBackground>
    </SafeAreaView>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/** One suggested practice: priority, title, stars, Dedicação, cadence. */
function PackRow({
  tpl,
  rank,
  on,
  adopted,
  disabled,
  onToggle,
}: {
  tpl: TaskTemplateWithSubs;
  rank: number;
  on: boolean;
  adopted: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const { t } = useT();
  const primary = SUB_META[tpl.primary_sub_id];
  const dim = primary ? DIMENSION_META[primary.dimensionId] : null;
  const color = dim?.color ?? tokens.text.mid;
  const checked = adopted || on;
  const cadence = t(`tour.pack.cadence.${templateCadence(tpl.recurrence)}`);

  return (
    <Pressable
      onPress={() => onToggle(tpl.id)}
      disabled={adopted || disabled}
      style={({ pressed }) => [
        styles.row,
        checked && !adopted && styles.rowOn,
        adopted && styles.rowAdopted,
        pressed && styles.pressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityLabel={`${rank}. ${tpl.title}`}
      accessibilityState={{ checked, disabled: adopted || disabled }}
    >
      <Text style={styles.rank}>{rank}</Text>
      <View style={[styles.rowIcon, { backgroundColor: dim?.bg ?? tokens.bg.surface2 }]}>
        <AppIcon name={tpl.icon ?? primary?.iconName ?? 'leaf'} size={17} color={color} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {tpl.title}
        </Text>
        <View style={styles.metaRow}>
          <Stars subs={tpl.subs} />
          <Text style={styles.xp}>+{templateXp(tpl)}</Text>
          <Text style={styles.cadence}>· {adopted ? t('tour.pack.adopted') : cadence}</Text>
        </View>
      </View>
      <View style={[styles.check, checked && styles.checkOn, adopted && styles.checkAdopted]}>
        {checked && <Ionicons name="checkmark" size={16} color={adopted ? tokens.text.hi : GOLD_INK} />}
      </View>
    </Pressable>
  );
}

function Stars({ subs }: { subs: TaskSub[] }) {
  return (
    <View style={styles.stars}>
      {subs.map((s) => {
        const meta = SUB_META[s.sub_id];
        const color = meta ? DIMENSION_META[meta.dimensionId].color : tokens.semantic.coin;
        return (
          <View key={s.sub_id} style={styles.starGroup}>
            {Array.from({ length: s.stars }, (_, i) => (
              <Ionicons key={i} name="star" size={12} color={color} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[4],
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: tokens.space[5],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  retryText: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: tokens.text.hi },
  pressed: { opacity: 0.85 },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: tokens.space[4], paddingBottom: tokens.space[5] },

  header: { paddingTop: tokens.space[6], gap: tokens.space[2] },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.8,
    color: tokens.semantic.coinLight,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    lineHeight: 31,
    color: tokens.text.hi,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.mid,
  },

  chips: {
    flexDirection: 'row',
    gap: tokens.space[2],
    marginTop: tokens.space[4],
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: tokens.space[4],
    justifyContent: 'center',
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.surface,
  },
  chipOn: { borderColor: tokens.semantic.coin, backgroundColor: 'rgba(255, 200, 61, 0.14)' },
  chipText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: tokens.text.mid },
  chipTextOn: { color: tokens.semantic.coinLight },

  list: { marginTop: tokens.space[4], gap: tokens.space[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 60,
    paddingVertical: tokens.space[2] + 2,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  rowOn: { borderColor: tokens.semantic.coinRim, backgroundColor: 'rgba(255, 200, 61, 0.07)' },
  rowAdopted: { opacity: 0.55 },
  rank: {
    width: 18,
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.dim,
    fontVariant: ['tabular-nums'],
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 6 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  starGroup: { flexDirection: 'row', gap: 1 },
  xp: { fontFamily: 'Manrope_800ExtraBold', fontSize: 13, color: tokens.semantic.xp },
  cadence: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.text.mid },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: tokens.semantic.coin, borderColor: tokens.semantic.coin2 },
  checkAdopted: { backgroundColor: tokens.bg.surface3, borderColor: tokens.border.strong },

  footer: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[2],
    gap: tokens.space[2],
    borderTopWidth: 1,
    borderTopColor: tokens.border.base,
    backgroundColor: tokens.bg.glassStrong,
  },
  summary: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.base,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 138, 0.55)',
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: GOLD_INK,
    letterSpacing: 0.3,
  },
  skipBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: tokens.space[5],
  },
  skipText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: tokens.text.base },
});

/** A render error here must never lock the app on every launch. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <TourErrorBoundary module="pack" {...props} />;
}
