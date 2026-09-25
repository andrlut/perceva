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
import { useMetaLookup } from '@/lib/i18n/meta';
import { freeLimitEntity } from '@/lib/premium';
import {
  groupTemplatesForPack,
  STARTER_PACK_IDS,
  templateCadence,
  templateXp,
  type PackAreaGroup,
} from '@/lib/tour/starterPack';
import { useTourStore } from '@/lib/tour/store';
import { exitTourToHome } from '@/lib/tour/navigation';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

/** Ink on the gold primary button — same as FullScreenStep's CTA. */
const GOLD_INK = '#3D2A00';

/**
 * Onboarding · starter pack (route module `pack`, after `intro`).
 *
 * The whole practice catalog, grouped by area then sub-area, with the
 * pack (one practice per sub-area, ~300 of Dedicação if each is done
 * once — see lib/tour/starterPack.ts) pre-selected. There is no quota:
 * the user can keep all 12, drop some, take several in one sub-area or
 * none at all. It replaced the "pick exactly 3" grid, whose arbitrary
 * count was first-user feedback #3; the star legend answers #4.
 *
 * Exits — every one of them marks `pack` completed, so the AuthGate
 * (which re-opens the first unfinished route module on every boot)
 * lets go and the guided tour starts on Home:
 *   - adopt the selection (sequentially, with progress), then Home;
 *   - with nothing new selected, continue only when the user already has
 *     practices (a reinstall or a replay) — otherwise Home would be empty.
 * The Android back button is swallowed: the intro behind this screen is
 * already answered, and walking back into it would re-ask a settled
 * question (iOS swipe-back is off in the Stack options).
 */
export default function TourPackScreen() {
  const { t } = useT();
  const templates = useTaskTemplates();
  const activeTasks = useActiveTasks();
  const startFromTemplate = useStartTaskFromTemplate();
  const setStatus = useTourStore((s) => s.setStatus);

  // null = untouched: the selection IS the pack, minus what the user
  // already has. Derived instead of seeded in an effect, so it is right on
  // the first frame the data lands.
  const [picked, setPicked] = useState<ReadonlySet<string> | null>(null);
  // Set while adopting — drives "Adicionando 4 de 12…" and freezes the
  // footer total (each landed adoption refetches the list under it).
  const [run, setRun] = useState<{ current: number; total: number; xp: number } | null>(
    null,
  );
  // State updates are async; a fast double tap must not start two loops.
  const runningRef = useRef(false);
  const busy = run !== null;

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const activeCount = activeTasks.data?.length ?? 0;

  // Templates already on the list (active task with that template_id):
  // shown in place, disabled, never adopted twice.
  const adoptedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const task of activeTasks.data ?? []) {
      if (task.template_id) ids.add(task.template_id);
    }
    return ids;
  }, [activeTasks.data]);

  const areas = useMemo(() => groupTemplatesForPack(templates.data ?? []), [templates.data]);

  const byId = useMemo(
    () => new Map((templates.data ?? []).map((tpl) => [tpl.id, tpl])),
    [templates.data],
  );

  // Display order — also the adoption order, so the new practices land in
  // the list grouped the way they were shown.
  const orderedIds = useMemo(
    () => areas.flatMap((a) => a.subs.flatMap((s) => s.templates.map((tpl) => tpl.id))),
    [areas],
  );

  const packPick = useMemo(
    () => new Set(STARTER_PACK_IDS.filter((id) => byId.has(id) && !adoptedIds.has(id))),
    [byId, adoptedIds],
  );

  const selection = picked ?? packPick;

  const newIds = useMemo(
    () => orderedIds.filter((id) => selection.has(id) && !adoptedIds.has(id)),
    [orderedIds, selection, adoptedIds],
  );

  const newXp = useMemo(
    () =>
      newIds.reduce((sum, id) => {
        const tpl = byId.get(id);
        return tpl ? sum + templateXp(tpl) : sum;
      }, 0),
    [newIds, byId],
  );

  const ready = templates.data != null && activeTasks.data != null;
  const loadFailed = !ready && (templates.isError || activeTasks.isError);
  // An empty catalog must not become a dead end either.
  // No quota (first-user feedback): starting with nothing is allowed too —
  // Home's M1 auto-skips when there is no open practice, so it can't strand.
  const canContinue = ready && !busy;

  const toggle = (id: string) => {
    if (busy || adoptedIds.has(id)) return;
    Haptics.selectionAsync().catch(() => {});
    setPicked((prev) => {
      const next = new Set(prev ?? packPick);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // "Desmarcar todas" while anything new is selected; otherwise "back to
  // the pack" — hidden when the pack is already on the list entirely.
  const showToggleAll = newIds.length > 0 || packPick.size > 0;
  const toggleAll = () => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});
    setPicked(newIds.length > 0 ? new Set() : null);
  };

  const retry = () => {
    void templates.refetch();
    void activeTasks.refetch();
  };

  const finish = async () => {
    await setStatus('pack', 'completed');
    exitTourToHome();
  };

  const handleContinue = async () => {
    if (!canContinue || runningRef.current) return;
    runningRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const queue = [...newIds];
    let landed = 0;
    let limited = false;
    for (const [i, id] of queue.entries()) {
      setRun({ current: i + 1, total: queue.length, xp: newXp });
      try {
        await startFromTemplate.mutateAsync(id);
        landed += 1;
      } catch (e) {
        if (freeLimitEntity(e)) {
          // The root MutationCache already opened the limit modal — no
          // second dialog on top of it (and never the raw SQL message the
          // old picker showed). Keep what landed and move on: hitting the
          // cap means the list is not empty.
          limited = true;
          break;
        }
        console.warn(`[tour pack] adopt ${id} failed:`, e);
      }
    }

    if (queue.length > 0 && landed === 0 && !limited) {
      // Nothing landed — stay, so the user can retry or change the pick.
      runningRef.current = false;
      setRun(null);
      void showInfo(t('tour.errors.adopt'));
      return;
    }
    await finish();
  };

  let summary: string;
  if (run) summary = t('tour.pack.total', { count: run.total, xp: run.xp });
  else if (newIds.length > 0) summary = t('tour.pack.total', { count: newIds.length, xp: newXp });
  else if (activeCount > 0) summary = t('tour.pack.totalExisting', { count: activeCount });
  else summary = t('tour.pack.emptyHint');

  let primaryLabel: string;
  if (run) primaryLabel = t('tour.pack.adding', { current: run.current, total: run.total });
  else if (newIds.length > 0) primaryLabel = t('tour.pack.primary', { count: newIds.length });
  else if (activeCount > 0) primaryLabel = t('tour.pack.primaryExisting');
  else primaryLabel = t('tour.pack.primaryEmpty');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <ScreenBackground withGoldHalo>
        {!ready ? (
          <View style={styles.center}>
            {loadFailed ? (
              <>
                <Text style={styles.loadError}>{t('tour.pack.loadError')}</Text>
                <Pressable
                  onPress={retry}
                  style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('tour.pack.retry')}
                >
                  <Ionicons name="refresh" size={16} color={tokens.text.hi} />
                  <Text style={styles.retryText}>{t('tour.pack.retry')}</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator color={tokens.brand.violet2} />
            )}
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

                <View style={styles.legend}>
                  <Ionicons name="star" size={15} color={tokens.semantic.coin} />
                  <Text style={styles.legendText}>{t('tour.pack.legend')}</Text>
                </View>

                {activeCount > 0 && (
                  <Text style={styles.existing}>
                    {t('tour.pack.existing', { count: activeCount })}
                  </Text>
                )}

                {showToggleAll && (
                  <Pressable
                    onPress={toggleAll}
                    disabled={busy}
                    style={({ pressed }) => [styles.toggleAll, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.toggleAllText}>
                      {newIds.length > 0
                        ? t('tour.pack.clearAll')
                        : t('tour.pack.restorePack')}
                    </Text>
                  </Pressable>
                )}
              </View>

              {areas.map((area) => (
                <AreaSection
                  key={area.dimId}
                  area={area}
                  selection={selection}
                  adoptedIds={adoptedIds}
                  busy={busy}
                  onToggle={toggle}
                />
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.summary} accessibilityLiveRegion="polite">
                {summary}
              </Text>
              <Pressable
                disabled={!canContinue}
                onPress={handleContinue}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  !canContinue && !busy && styles.primaryBtnDisabled,
                  pressed && canContinue && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={primaryLabel}
                accessibilityState={{ disabled: !canContinue, busy }}
              >
                {busy && <ActivityIndicator size="small" color={GOLD_INK} />}
                <Text style={styles.primaryText}>{primaryLabel}</Text>
                {!busy && <Ionicons name="arrow-forward" size={16} color={GOLD_INK} />}
              </Pressable>
            </View>
          </>
        )}
      </ScreenBackground>
    </SafeAreaView>
  );
}

/** One area (6) → its two sub-areas → their catalog practices. */
function AreaSection({
  area,
  selection,
  adoptedIds,
  busy,
  onToggle,
}: {
  area: PackAreaGroup;
  selection: ReadonlySet<string>;
  adoptedIds: ReadonlySet<string>;
  busy: boolean;
  onToggle: (id: string) => void;
}) {
  const meta = useMetaLookup();
  const subs = area.subs.filter((s) => s.templates.length > 0);
  if (subs.length === 0) return null;
  const dim = meta.dim(area.dimId);
  return (
    <View style={styles.area}>
      <View style={styles.areaHeader} accessibilityRole="header">
        <View style={[styles.areaIcon, { backgroundColor: dim.bg }]}>
          <AppIcon name={dim.iconName} size={16} color={dim.color} />
        </View>
        <Text style={[styles.areaLabel, { color: dim.color }]}>{dim.label}</Text>
      </View>
      {subs.map((group) => (
        <View key={group.subId} style={styles.subGroup}>
          <View style={styles.subHeader}>
            <AppIcon name={SUB_META[group.subId].iconName} size={13} color={tokens.text.mid} />
            <Text style={styles.subLabel}>{meta.sub(group.subId).label}</Text>
          </View>
          <View style={styles.cards}>
            {group.templates.map((tpl) => (
              <PackCard
                key={tpl.id}
                tpl={tpl}
                selected={selection.has(tpl.id)}
                adopted={adoptedIds.has(tpl.id)}
                disabled={busy}
                onToggle={onToggle}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * One catalog practice. Title only — the catalog's generic descriptions
 * read strangely out of context (first-user feedback #7) — plus what the
 * user is actually choosing: stars (effort, in the colour of the area it
 * trains), the Dedicação it pays once, and its cadence.
 */
function PackCard({
  tpl,
  selected,
  adopted,
  disabled,
  onToggle,
}: {
  tpl: TaskTemplateWithSubs;
  selected: boolean;
  adopted: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const { t } = useT();
  const meta = useMetaLookup();
  const primary = SUB_META[tpl.primary_sub_id];
  const dim = DIMENSION_META[primary.dimensionId];
  const xp = templateXp(tpl);
  const cadence = t(`tour.pack.cadence.${templateCadence(tpl.recurrence)}`);
  const otherSubs = tpl.subs.filter((s) => s.sub_id !== tpl.primary_sub_id);
  const isOn = selected && !adopted;

  const a11yLabel = adopted
    ? t('tour.pack.a11yAdopted', { title: tpl.title })
    : t('tour.pack.a11yCard', {
        title: tpl.title,
        stars: t('tour.pack.a11yStars', { count: tpl.total_stars }),
        xp,
        cadence,
      });

  return (
    <Pressable
      onPress={() => onToggle(tpl.id)}
      disabled={adopted || disabled}
      style={({ pressed }) => [
        styles.card,
        isOn && styles.cardSelected,
        adopted && styles.cardAdopted,
        pressed && styles.pressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ checked: adopted || isOn, disabled: adopted || disabled }}
    >
      <View style={[styles.cardIcon, { backgroundColor: dim.bg }]}>
        <AppIcon name={tpl.icon ?? primary.iconName} size={18} color={dim.color} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {tpl.title}
        </Text>
        {otherSubs.length > 0 && (
          <Text style={styles.alsoTrains} numberOfLines={1}>
            {t('tour.pack.alsoTrains', {
              subs: otherSubs.map((s) => meta.sub(s.sub_id).label).join(', '),
            })}
          </Text>
        )}
        <View style={styles.metaRow}>
          <Stars subs={tpl.subs} />
          <Text style={styles.xp}>+{xp}</Text>
          <Text style={styles.metaSep}>·</Text>
          <Text style={styles.cadence}>{cadence}</Text>
        </View>
      </View>

      {adopted ? (
        <View style={styles.adoptedPill}>
          <Ionicons name="checkmark" size={13} color={tokens.semantic.xp} />
          <Text style={styles.adoptedText}>{t('tour.pack.adopted')}</Text>
        </View>
      ) : (
        <View style={[styles.check, isOn && styles.checkOn]}>
          {isOn && <Ionicons name="checkmark" size={16} color={GOLD_INK} />}
        </View>
      )}
    </Pressable>
  );
}

/** Real stars, per sub-area, in that area's colour — the same glyph the
 *  legend explains, so the two can be matched at a glance. */
function Stars({ subs }: { subs: TaskSub[] }) {
  return (
    <View style={styles.stars}>
      {subs.map((s) => {
        const color = DIMENSION_META[SUB_META[s.sub_id].dimensionId].color;
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
    paddingHorizontal: tokens.space[6],
  },
  loadError: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.base,
    textAlign: 'center',
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
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  pressed: { opacity: 0.85 },

  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: tokens.space[4],
    paddingBottom: tokens.space[6],
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingTop: tokens.space[5],
    paddingBottom: tokens.space[2],
    gap: tokens.space[2],
  },
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
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.mid,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[2],
    marginTop: tokens.space[1],
    paddingVertical: tokens.space[2] + 2,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  legendText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.base,
  },
  existing: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  toggleAll: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleAllText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },

  // ── Areas / sub-areas ───────────────────────────────────────────────────
  area: {
    marginTop: tokens.space[5],
    gap: tokens.space[3],
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  areaIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  subGroup: {
    gap: tokens.space[2],
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  subLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    letterSpacing: 0.3,
    color: tokens.text.mid,
  },
  cards: {
    gap: tokens.space[2],
  },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 64,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  cardSelected: {
    borderColor: tokens.semantic.coinRim,
    backgroundColor: 'rgba(255, 200, 61, 0.07)',
  },
  /** Already on the user's list — read-only, dimmed, labelled. */
  cardAdopted: {
    opacity: 0.6,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  alsoTrains: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.mid,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 2,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  starGroup: {
    flexDirection: 'row',
    gap: 1,
  },
  xp: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.semantic.xp,
  },
  metaSep: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.dim,
  },
  cadence: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.mid,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkOn: {
    backgroundColor: tokens.semantic.coin,
    borderColor: tokens.semantic.coin2,
  },
  adoptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 28,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.35)',
    backgroundColor: 'rgba(61, 214, 140, 0.10)',
    flexShrink: 0,
  },
  adoptedText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.semantic.xp,
  },

  // ── Sticky footer ───────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    gap: tokens.space[2] + 2,
    borderTopWidth: 1,
    borderTopColor: tokens.border.base,
    backgroundColor: tokens.bg.glassStrong,
  },
  summary: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.base,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: tokens.space[5],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 138, 0.55)',
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: GOLD_INK,
    letterSpacing: 0.3,
  },
});
