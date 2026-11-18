import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { ABOUT_ICONS } from '@/components/perfil/SobreVoceCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { TimePickerSheet } from '@/components/TimePickerSheet';
import {
  ABOUT_FIELDS,
  AI_AVOID_LEN,
  AI_AVOID_MAX,
  AI_PUSHES,
  AI_TONES,
  BEST_TIMES,
  BLOCKERS,
  BLOCKERS_MAX,
  EMPTY_ABOUT,
  FOCUS_LEN,
  LIFE_PHASE_MAX,
  LIFE_PHASES,
  LIVING_WITH,
  cleanAvoid,
  draftFrom,
  draftProblem,
  useClearAbout,
  useProfileContext,
  useSaveAbout,
  type AboutDraft,
  type AboutField,
  type Clock,
  type LivingWith,
} from '@/lib/api/aboutMe';
import { useCharacter } from '@/lib/api/character';
import { ABOUT_MAX, PROFESSION_MAX } from '@/lib/api/profile';
import { useT } from '@/lib/i18n';
import { bcp47, formatClock } from '@/lib/time';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';

type ClockKey = 'wake' | 'sleep' | 'workStart' | 'workEnd';

/** Default suggestion and hour order of each clock: the common hours first,
 *  the rest after them, so everyone finds theirs without scrolling a list
 *  of 24 starting at midnight. */
const CLOCKS: Record<ClockKey, { def: Clock; hours: number[] }> = {
  wake: { def: { h: 7, m: 0 }, hours: rotate(4) },
  sleep: { def: { h: 23, m: 0 }, hours: rotate(18) },
  workStart: { def: { h: 9, m: 0 }, hours: rotate(5) },
  workEnd: { def: { h: 18, m: 0 }, hours: rotate(12) },
};

function rotate(start: number): number[] {
  return Array.from({ length: 24 }, (_, i) => (start + i) % 24);
}

function toggleIn<T>(list: T[], v: T, max: number): T[] | null {
  if (list.includes(v)) return list.filter((x) => x !== v);
  if (list.length >= max) return null;
  return [...list, v];
}

/**
 * The editor of "Sobre você" — opened from a row of the card in /perfil,
 * scrolled to that field (`?field=`). Every field is a card that says what
 * it is for; one Save writes everything (profession/about to `profile`, the
 * rest as one upsert of `profile_context`). Nothing is inferred: what the
 * person leaves empty stays empty.
 */
export default function SobreVoceScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const params = useLocalSearchParams<{ field?: string }>();
  const character = useCharacter();
  const context = useProfileContext();
  const save = useSaveAbout();
  const clear = useClearAbout();
  const keyboardHeight = useKeyboardHeight();

  const [draft, setDraft] = useState<AboutDraft>(EMPTY_ABOUT);
  const [before, setBefore] = useState<AboutDraft>(EMPTY_ABOUT);
  const [avoidInput, setAvoidInput] = useState('');
  const [clockSheet, setClockSheet] = useState<ClockKey | null>(null);
  const [tried, setTried] = useState(false);

  // Seed once, when both reads are in. A refetch on focus must not wipe an
  // edit in progress.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !character.data || !context.isSuccess) return;
    seeded.current = true;
    const d = draftFrom(character.data.profile, context.data);
    setDraft(d);
    setBefore(d);
  }, [character.data, context.isSuccess, context.data]);

  // Scroll to the field the card row was tapped on.
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<AboutField, number>>>({});
  const scrolled = useRef(false);
  const target = ABOUT_FIELDS.includes(params.field as AboutField)
    ? (params.field as AboutField)
    : null;
  const onCardLayout = (f: AboutField, y: number) => {
    offsets.current[f] = y;
    if (f === target && !scrolled.current && f !== ABOUT_FIELDS[0]) {
      scrolled.current = true;
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 60);
    }
  };

  const loading = !seeded.current && (character.isLoading || context.isLoading || !context.isSuccess);
  const problem = draftProblem(draft);

  const set = (patch: Partial<AboutDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const warn = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

  const addAvoid = () => {
    const v = avoidInput.trim();
    if (!v) return;
    const next = cleanAvoid([...draft.aiAvoid, v]);
    if (next.length === draft.aiAvoid.length) {
      warn();
      return;
    }
    set({ aiAvoid: next });
    setAvoidInput('');
  };

  const toggleLiving = (v: LivingWith) => {
    if (v === 'alone') {
      set({ livingWith: draft.livingWith.includes('alone') ? [] : ['alone'] });
      return;
    }
    const base = draft.livingWith.filter((x) => x !== 'alone');
    set({ livingWith: base.includes(v) ? base.filter((x) => x !== v) : [...base, v] });
  };

  const onSave = () => {
    setTried(true);
    if (problem || save.isPending) return;
    // A topic typed but not added yet still counts.
    const final = avoidInput.trim()
      ? { ...draft, aiAvoid: cleanAvoid([...draft.aiAvoid, avoidInput]) }
      : draft;
    save.mutate(
      { draft: final, before },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    );
  };

  const onClearAll = async () => {
    const ok = await confirmAction(t('sobreVoce.clearTitle'), t('sobreVoce.clearBody'), {
      okText: t('sobreVoce.clearConfirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    clear.mutate(undefined, { onSuccess: () => router.back() });
  };

  const clockLabel = (k: ClockKey) => t(`sobreVoce.rhythmLabels.${k}`);
  const sheetClock = clockSheet ? draft[clockSheet] ?? CLOCKS[clockSheet].def : null;

  const focusSince =
    before.focus.trim() && draft.focus.trim() === before.focus.trim() && context.data?.focus_set_at
      ? new Date(context.data.focus_set_at).toLocaleDateString(bcp47(locale), {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

  const head = (f: AboutField) => (
    <View style={styles.cardHead}>
      <View style={styles.cardIcon}>
        <Ionicons name={ABOUT_ICONS[f]} size={16} color={tokens.semantic.coin} />
      </View>
      <View style={styles.cardHeadText}>
        <Text style={styles.cardTitle}>{t(`sobreVoce.fields.${f}.title`)}</Text>
        <Text style={styles.purpose}>{t(`sobreVoce.fields.${f}.purpose`)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('sobreVoce.title')}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
          {loading ? (
            <ActivityIndicator color={tokens.semantic.coin} style={styles.loading} />
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {/* 1 · Jeito da IA */}
              <View style={styles.card} onLayout={(e) => onCardLayout('ai', e.nativeEvent.layout.y)}>
                {head('ai')}
                <Text style={styles.label}>{t('sobreVoce.tone.label')}</Text>
                <View style={styles.chips}>
                  {AI_TONES.map((v) => (
                    <Chip
                      key={v}
                      label={t(`sobreVoce.tone.${v}`)}
                      on={draft.aiTone === v}
                      onPress={() => set({ aiTone: draft.aiTone === v ? null : v })}
                    />
                  ))}
                </View>
                <Text style={styles.label}>{t('sobreVoce.push.label')}</Text>
                <View style={styles.chips}>
                  {AI_PUSHES.map((v) => (
                    <Chip
                      key={v}
                      label={t(`sobreVoce.push.${v}`)}
                      on={draft.aiPush === v}
                      onPress={() => set({ aiPush: draft.aiPush === v ? null : v })}
                    />
                  ))}
                </View>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('sobreVoce.avoid.label')}</Text>
                  <Text style={styles.counter}>
                    {t('sobreVoce.avoid.count', { n: draft.aiAvoid.length, max: AI_AVOID_MAX })}
                  </Text>
                </View>
                {draft.aiAvoid.length > 0 && (
                  <View style={styles.chips}>
                    {draft.aiAvoid.map((topic) => (
                      <Pressable
                        key={topic}
                        onPress={() => set({ aiAvoid: draft.aiAvoid.filter((x) => x !== topic) })}
                        style={({ pressed }) => [styles.chip, styles.chipOn, pressed && { opacity: 0.7 }]}
                        accessibilityRole="button"
                        accessibilityLabel={t('sobreVoce.avoid.removeA11y', { topic })}
                      >
                        <Text style={[styles.chipText, styles.chipTextOn]}>{topic}</Text>
                        <Ionicons name="close" size={14} color={tokens.text.hi} />
                      </Pressable>
                    ))}
                  </View>
                )}
                {draft.aiAvoid.length < AI_AVOID_MAX && (
                  <View style={styles.addRow}>
                    <TextInput
                      value={avoidInput}
                      onChangeText={setAvoidInput}
                      onSubmitEditing={addAvoid}
                      placeholder={t('sobreVoce.avoid.placeholder')}
                      placeholderTextColor={tokens.text.dim}
                      maxLength={AI_AVOID_LEN}
                      returnKeyType="done"
                      blurOnSubmit={false}
                      style={[styles.input, styles.flex]}
                      accessibilityLabel={t('sobreVoce.avoid.label')}
                    />
                    <Pressable
                      onPress={addAvoid}
                      disabled={!avoidInput.trim()}
                      style={({ pressed }) => [
                        styles.addBtn,
                        !avoidInput.trim() && { opacity: 0.4 },
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.addText}>{t('sobreVoce.avoid.add')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* 2 · Ritmo */}
              <View style={styles.card} onLayout={(e) => onCardLayout('rhythm', e.nativeEvent.layout.y)}>
                {head('rhythm')}
                {(Object.keys(CLOCKS) as ClockKey[]).map((k) => {
                  const v = draft[k];
                  return (
                    <View key={k} style={styles.clockRow}>
                      <Text style={styles.clockLabel}>{clockLabel(k)}</Text>
                      <Pressable
                        onPress={() => setClockSheet(k)}
                        style={({ pressed }) => [styles.clockValue, v && styles.chipOn, pressed && { opacity: 0.7 }]}
                        accessibilityRole="button"
                        accessibilityLabel={clockLabel(k)}
                      >
                        <Text style={[styles.clockText, !v && styles.clockUnset]}>
                          {v ? formatClock(v.h, v.m, locale) : t('sobreVoce.rhythmLabels.unset')}
                        </Text>
                      </Pressable>
                      {v ? (
                        <Pressable
                          onPress={() => set({ [k]: null } as Partial<AboutDraft>)}
                          hitSlop={8}
                          style={styles.clearBtn}
                          accessibilityRole="button"
                          accessibilityLabel={t('sobreVoce.rhythmLabels.clearA11y', { field: clockLabel(k) })}
                        >
                          <Ionicons name="close-circle" size={18} color={tokens.text.dim} />
                        </Pressable>
                      ) : (
                        <View style={styles.clearBtn} />
                      )}
                    </View>
                  );
                })}
                {tried && problem === 'workPair' && <Text style={styles.error}>{t('sobreVoce.workPair')}</Text>}
                <Text style={styles.label}>{t('sobreVoce.rhythmLabels.best')}</Text>
                <View style={styles.chips}>
                  {BEST_TIMES.map((v) => (
                    <Chip
                      key={v}
                      label={t(`sobreVoce.best.${v}`)}
                      on={draft.bestTime === v}
                      onPress={() => set({ bestTime: draft.bestTime === v ? null : v })}
                    />
                  ))}
                </View>
              </View>

              {/* 3 · Foco dos 90 dias */}
              <View style={styles.card} onLayout={(e) => onCardLayout('focus', e.nativeEvent.layout.y)}>
                {head('focus')}
                <TextInput
                  value={draft.focus}
                  onChangeText={(focus) => set({ focus })}
                  placeholder={t('sobreVoce.focusPlaceholder')}
                  placeholderTextColor={tokens.text.dim}
                  maxLength={FOCUS_LEN}
                  multiline
                  style={[styles.input, styles.inputMulti]}
                  accessibilityLabel={t('sobreVoce.fields.focus.title')}
                />
                <Text style={styles.hint}>
                  {focusSince
                    ? t('sobreVoce.focusSince', { date: focusSince })
                    : t('sobreVoce.left', { left: FOCUS_LEN - draft.focus.length })}
                </Text>
              </View>

              {/* 4 · Fase e casa */}
              <View style={styles.card} onLayout={(e) => onCardLayout('phase', e.nativeEvent.layout.y)}>
                {head('phase')}
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('sobreVoce.phaseLabel')}</Text>
                  <Text style={styles.counter}>{t('sobreVoce.upTo', { max: LIFE_PHASE_MAX })}</Text>
                </View>
                <View style={styles.chips}>
                  {LIFE_PHASES.map((v) => (
                    <Chip
                      key={v}
                      label={t(`sobreVoce.phase.${v}`)}
                      on={draft.lifePhase.includes(v)}
                      onPress={() => {
                        const next = toggleIn(draft.lifePhase, v, LIFE_PHASE_MAX);
                        if (next) set({ lifePhase: next });
                        else warn();
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.label}>{t('sobreVoce.livingLabel')}</Text>
                <View style={styles.chips}>
                  {LIVING_WITH.map((v) => (
                    <Chip
                      key={v}
                      label={t(`sobreVoce.living.${v}`)}
                      on={draft.livingWith.includes(v)}
                      onPress={() => toggleLiving(v)}
                    />
                  ))}
                </View>
              </View>

              {/* 5 · O que costuma travar */}
              <View style={styles.card} onLayout={(e) => onCardLayout('blockers', e.nativeEvent.layout.y)}>
                {head('blockers')}
                <Text style={styles.counter}>{t('sobreVoce.upTo', { max: BLOCKERS_MAX })}</Text>
                <View style={styles.chips}>
                  {BLOCKERS.map((v) => (
                    <Chip
                      key={v}
                      label={t(`sobreVoce.blocker.${v}`)}
                      on={draft.blockers.includes(v)}
                      onPress={() => {
                        const next = toggleIn(draft.blockers, v, BLOCKERS_MAX);
                        if (next) set({ blockers: next });
                        else warn();
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* 6 · Trabalho ou estudo */}
              <View style={styles.card} onLayout={(e) => onCardLayout('work', e.nativeEvent.layout.y)}>
                {head('work')}
                <TextInput
                  value={draft.profession}
                  onChangeText={(profession) => set({ profession })}
                  placeholder={t('sobreVoce.professionPlaceholder')}
                  placeholderTextColor={tokens.text.dim}
                  maxLength={PROFESSION_MAX}
                  style={styles.input}
                  accessibilityLabel={t('sobreVoce.fields.work.title')}
                />
              </View>

              {/* 7 · Seu momento */}
              <View style={styles.card} onLayout={(e) => onCardLayout('moment', e.nativeEvent.layout.y)}>
                {head('moment')}
                <TextInput
                  value={draft.about}
                  onChangeText={(about) => set({ about })}
                  placeholder={t('sobreVoce.aboutPlaceholder')}
                  placeholderTextColor={tokens.text.dim}
                  maxLength={ABOUT_MAX}
                  multiline
                  style={[styles.input, styles.inputMulti, styles.inputTall]}
                  accessibilityLabel={t('sobreVoce.fields.moment.title')}
                />
                <Text style={styles.hint}>{t('sobreVoce.left', { left: ABOUT_MAX - draft.about.length })}</Text>
              </View>

              <Text style={styles.footer}>{t('sobreVoce.footer')}</Text>
              <Pressable
                onPress={() => void onClearAll()}
                disabled={clear.isPending}
                style={({ pressed }) => [styles.clearAll, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={15} color={tokens.semantic.danger} />
                <Text style={styles.clearAllText}>{t('sobreVoce.clearAll')}</Text>
              </Pressable>
            </ScrollView>
          )}

          <View style={styles.bottomBar}>
            {(save.isError || clear.isError) && (
              <Text style={[styles.error, styles.errorBar]}>{t('sobreVoce.saveError')}</Text>
            )}
            <Pressable
              onPress={onSave}
              disabled={loading || save.isPending}
              style={({ pressed }) => [
                styles.saveBtn,
                (problem != null || loading) && styles.saveBtnOff,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: problem != null }}
            >
              {save.isPending ? (
                <ActivityIndicator color={tokens.semantic.coinInk} />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScreenBackground>

      <TimePickerSheet
        visible={clockSheet !== null}
        eyebrow={t('sobreVoce.fields.rhythm.title')}
        title={clockSheet ? clockLabel(clockSheet) : ''}
        hour={sheetClock?.h ?? 7}
        minute={sheetClock?.m ?? 0}
        minHour={0}
        maxHour={23}
        hours={clockSheet ? CLOCKS[clockSheet].hours : undefined}
        allowUnchanged={clockSheet ? draft[clockSheet] == null : false}
        onCancel={() => setClockSheet(null)}
        onConfirm={(h, m) => {
          if (clockSheet) set({ [clockSheet]: { h, m } } as Partial<AboutDraft>);
          setClockSheet(null);
        }}
      />
    </SafeAreaView>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.divider,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...tokens.type.h3, color: tokens.text.hi, flex: 1, textAlign: 'center' },
  loading: { marginTop: tokens.space[8] },
  content: { padding: tokens.space[4], gap: tokens.space[3], paddingBottom: tokens.space[6] },
  card: {
    gap: tokens.space[2],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[3], marginBottom: 2 },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  cardHeadText: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15.5, color: tokens.text.hi },
  purpose: { fontFamily: 'Manrope_500Medium', fontSize: 12.5, lineHeight: 17, color: tokens.text.mid },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    marginTop: tokens.space[1],
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  counter: { fontFamily: 'Manrope_700Bold', fontSize: 11.5, color: tokens.text.dim },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  chipOn: { backgroundColor: 'rgba(123, 92, 255, 0.22)', borderColor: tokens.brand.violet2 },
  chipText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: tokens.text.mid },
  chipTextOn: { color: tokens.text.hi },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  addBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  addText: { fontFamily: 'Manrope_700Bold', fontSize: 13.5, color: tokens.brand.violet2 },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  inputMulti: { minHeight: 72, lineHeight: 20, textAlignVertical: 'top' },
  inputTall: { minHeight: 110 },
  hint: { fontFamily: 'Manrope_500Medium', fontSize: 11.5, color: tokens.text.dim },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  clockLabel: { flex: 1, fontFamily: 'Manrope_700Bold', fontSize: 14, color: tokens.text.base },
  clockValue: {
    minWidth: 88,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  clockText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 14, color: tokens.text.hi },
  clockUnset: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: tokens.brand.violet2 },
  clearBtn: { width: 22, alignItems: 'center' },
  footer: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
    paddingHorizontal: tokens.space[1],
  },
  clearAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
  },
  clearAllText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: tokens.semantic.danger },
  error: { fontFamily: 'Manrope_700Bold', fontSize: 12.5, color: tokens.semantic.danger },
  errorBar: { textAlign: 'center' },
  bottomBar: {
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.border.divider,
  },
  saveBtn: {
    height: 50,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
  },
  saveBtnOff: { opacity: 0.45 },
  saveText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.semantic.coinInk },
});
