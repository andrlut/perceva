import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { IconPickerModal } from '@/components/IconPickerModal';
import { RecurrencePicker } from '@/components/RecurrencePicker';
import { SubPicker } from '@/components/SubPicker';
import { TourModule } from '@/components/tour/TourModule';
import {
  buildM2Steps,
  finishM2AtHome,
  isM2StepOn,
  M2_STEP_KEYS,
} from '@/lib/tour/m2Steps';
import {
  useActiveTourStepStore,
  useIsCurrentTourModule,
  useTourStore,
} from '@/lib/tour/store';
import { useT } from '@/lib/i18n';
import { freeLimitEntity, useLimitModalStore } from '@/lib/premium';
import { SUB_META } from '@/theme/dimensions';
import {
  useArchiveTask,
  useCreateTask,
  useTask,
  useTaskTemplates,
  useUpdateTask,
  type TaskFormInput,
} from '@/lib/api/tasks';
import { CoinMultiplierPicker } from '@/components/CoinMultiplierPicker';
import type { CoinMultiplier, Recurrence, TaskSub } from '@/lib/db/types';
import { legacyTaskTypeFor } from '@/lib/recurrence';
import { useKeyboardOverlap } from '@/lib/use-keyboard-height';
import { confirmAction } from '@/lib/util/confirm';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';

export default function TaskFormScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const params = useLocalSearchParams<{ id?: string; from_template?: string }>();

  const isEdit = !!params.id;
  const fromTemplateId = params.from_template;
  const isCreateMode = !isEdit && !fromTemplateId;
  const isM2Current = useIsCurrentTourModule('M2');

  // M2's last three steps live on this form (create mode). The form is
  // passive — nothing has to be filled — so LEAVING it in any way while one
  // of them is up completes M2 and lands on Home, where the next module
  // starts (the 2026-09 audit found the old M2 ending stranded on /tasks):
  //   - the X, Salvar, a refused save → `leaveForm` below, one transition;
  //   - hardware back / the modal's swipe-down → this blur cleanup, which
  //     runs once the form is already gone and walks /tasks back to Home.
  // Both no-op outside the tour: isM2StepOn is false.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isCreateMode && isM2StepOn('create')) finishM2AtHome();
      };
    }, [isCreateMode]),
  );
  const leaveForm = () => {
    if (isCreateMode && isM2StepOn('create')) finishM2AtHome();
    else router.back();
  };

  const existing = useTask(params.id);
  const templates = useTaskTemplates();
  /** When the user picks "Customize" on the AdoptPeriodicitySheet, this
   *  screen opens with `from_template=X` so we pre-fill the form fields
   *  with the template's content. The resulting save goes through the
   *  regular createTask path — so the new task is `template_id IS NULL`
   *  (truly custom). That also means it counts as a custom slot under
   *  any future free-tier limit, which is the right thing. */
  const templateSource = useMemo(
    () =>
      fromTemplateId
        ? (templates.data ?? []).find((t) => t.id === fromTemplateId) ?? null
        : null,
    [fromTemplateId, templates.data],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>({ type: 'daily' });
  const [targetCount, setTargetCount] = useState<number>(1);
  const [subs, setSubs] = useState<TaskSub[]>([]);
  // null = auto (use the primary sub's icon at render time). User-picked
  // value sticks even if subs change later — predictable contract.
  const [icon, setIcon] = useState<string | null>(null);
  // Coins relative to XP. A new practice starts at "Igual" (the old rule).
  const [coinMultiplier, setCoinMultiplier] = useState<CoinMultiplier>(1);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  // Has the user typed in the description field? See `catalogBlurb`.
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  // Keep scroll content reachable while the keyboard is up. `endCoordinates`
  // doesn't always include the keyboard's tool/suggestion bar, so we add a
  // generous buffer below.
  const keyboardHeight = useKeyboardOverlap();

  // M2 tour auto-scroll: each form step brings its own section to the top
  // of the form, clear of the bottom tooltip. Section Ys come from onLayout
  // (they are direct children of the scroll content, so the Y is the
  // content offset); `sectionsMeasured` re-runs the effect once they exist,
  // since the first form step is already current when the form mounts.
  const scrollRef = useRef<ScrollView>(null);
  const subsY = useRef<number | null>(null);
  const recurrenceY = useRef<number | null>(null);
  const coinsY = useRef<number | null>(null);
  const [sectionsMeasured, setSectionsMeasured] = useState(false);
  const noteSectionY = (ref: { current: number | null }, y: number) => {
    ref.current = y;
    if (
      !sectionsMeasured &&
      subsY.current != null &&
      recurrenceY.current != null &&
      coinsY.current != null
    ) {
      setSectionsMeasured(true);
    }
  };
  const m2StepIndex = useTourStore((s) => s.stepIndices.M2 ?? 0);
  const m2StepKey = isCreateMode && isM2Current ? M2_STEP_KEYS[m2StepIndex] : undefined;
  const m2FormStep =
    m2StepKey === 'trains' || m2StepKey === 'often' || m2StepKey === 'coins';
  // The last section (coins) sits at the end of the form; without extra
  // room the scroll can't lift it above the tooltip. Sized off the card's
  // REAL measured height, so a taller card can't eat the gap.
  const tourCardHeight = useActiveTourStepStore((s) => s.cardHeight);
  const m2FormBump = m2FormStep ? (tourCardHeight ?? 280) + tokens.space[6] : 0;
  useEffect(() => {
    if (!m2FormStep) return;
    const targetY =
      m2StepKey === 'trains'
        ? subsY.current
        : m2StepKey === 'often'
          ? recurrenceY.current
          : coinsY.current;
    if (targetY == null) return;
    const id = setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(targetY - tokens.space[4], 0),
          animated: true,
        }),
      160,
    );
    return () => clearTimeout(id);
  }, [m2FormStep, m2StepKey, sectionsMeasured]);

  // Hydrate from server when editing
  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title);
      setDescription(existing.data.description ?? '');
      setRecurrence(existing.data.recurrence);
      setTargetCount(existing.data.target_count ?? 1);
      setSubs(existing.data.subs);
      setIcon(existing.data.icon ?? null);
      setCoinMultiplier(existing.data.coin_multiplier);
    }
  }, [existing.data]);

  // Prefill from template when entering via "Customize" on the adopt sheet.
  // One-shot: we apply once, then stop reacting so user edits don't get
  // clobbered if templates query refetches.
  useEffect(() => {
    if (isEdit) return;
    if (prefillApplied) return;
    if (!templateSource) return;
    setTitle(templateSource.title);
    setDescription(templateSource.description ?? '');
    setRecurrence(templateSource.recurrence);
    setTargetCount(templateSource.target_count ?? 1);
    setSubs(templateSource.subs);
    setIcon(templateSource.icon ?? null);
    setPrefillApplied(true);
  }, [isEdit, prefillApplied, templateSource]);

  // Catalog blurb (first-user feedback: "the generic descriptions feel
  // strange"). Adopting a template copies its one-line catalog blurb into
  // the practice's description, and this form then showed it inside the
  // user's own "Descrição" field, as if they had written it. When the
  // stored text IS a catalog blurb it is shown as a quiet "why it matters"
  // note above the field, and the field starts empty for the user's own
  // words. Nothing changes in the data: an empty field saves the blurb back
  // unchanged (so the template link and its warning stay put); the user's
  // own text replaces it, exactly as editing the old field did — which is
  // why the note steps aside while that text is non-empty.
  const catalogBlurb = useMemo(() => {
    const original = (isEdit ? existing.data?.description : templateSource?.description)?.trim();
    if (!original) return null;
    // A from_template prefill is the catalog text by definition; an edit is
    // matched against the catalog, which also catches practices that were
    // customised from a template and kept its blurb.
    if (!isEdit) return original;
    return (templates.data ?? []).some((tp) => (tp.description ?? '').trim() === original)
      ? original
      : null;
  }, [isEdit, existing.data?.description, templateSource?.description, templates.data]);
  // With a blurb, the field holds only the user's own words (empty until
  // they type — `description` still carries the hydrated blurb till then).
  const ownDescription =
    catalogBlurb != null && !descriptionTouched ? '' : description;
  // Catalog blurbs are pt-only until task_template gains *_en columns — an
  // en user would read a Portuguese note, so it only shows in pt.
  const showBlurbNote =
    locale === 'pt' && catalogBlurb != null && ownDescription.trim() === '';
  const descriptionForSave =
    ownDescription.trim() !== '' ? ownDescription.trim() : catalogBlurb;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask(params.id ?? '');
  const archiveTask = useArchiveTask();

  const isSubmitting =
    createTask.isPending || updateTask.isPending || archiveTask.isPending;

  const totalStars = subs.reduce((s, x) => s + x.stars, 0);
  const reward = useMemo(
    () => rewardForTaskSubs(subs, coinMultiplier),
    [subs, coinMultiplier],
  );

  const formInput = useMemo<TaskFormInput | null>(() => {
    if (subs.length === 0 || totalStars === 0) return null;
    return {
      title: title.trim(),
      description: descriptionForSave,
      task_type: legacyTaskTypeFor(recurrence),
      recurrence,
      target_count: targetCount,
      subs,
      icon,
      coin_multiplier: coinMultiplier,
    };
  }, [
    title,
    descriptionForSave,
    recurrence,
    targetCount,
    subs,
    totalStars,
    icon,
    coinMultiplier,
  ]);

  /** True when editing a template-adopted task AND the user has changed
   *  any field that triggers the template-link drop (title, description,
   *  or subs). Periodicity changes alone DON'T trigger this — the user
   *  is allowed to retune cadence without losing the link.
   *
   *  Used to render the inline warning and to set `dropTemplateLink` on
   *  the update payload at save time. */
  const breaksTemplateLink = useMemo(() => {
    if (!isEdit) return false;
    const orig = existing.data;
    if (!orig || !orig.template_id) return false;
    if (title.trim() !== orig.title) return true;
    const origDesc = (orig.description ?? '').trim();
    const curDesc = descriptionForSave ?? '';
    if (origDesc !== curDesc) return true;
    // Subs: compare order-independently by (sub_id, stars).
    if (orig.subs.length !== subs.length) return true;
    const sortKey = (s: { sub_id: string; stars: number }) =>
      `${s.sub_id}:${s.stars}`;
    const origKey = orig.subs.map(sortKey).sort().join('|');
    const curKey = subs.map(sortKey).sort().join('|');
    return origKey !== curKey;
  }, [isEdit, existing.data, title, descriptionForSave, subs]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('taskForm.titleRequired'), t('taskForm.titleRequiredBody'));
      return;
    }
    if (subs.length === 0 || !formInput) {
      Alert.alert(t('taskForm.subRequired'), t('taskForm.subRequiredBody'));
      return;
    }
    try {
      if (isEdit && params.id) {
        await updateTask.mutateAsync({
          ...formInput,
          // If the user edited title/description/subs on a template-adopted
          // task, drop the template link so the task is treated as custom
          // going forward.
          dropTemplateLink: breaksTemplateLink,
        });
      } else {
        await createTask.mutateAsync(formInput);
      }
      leaveForm();
    } catch (e) {
      const limited = freeLimitEntity(e);
      if (limited) {
        // An edit that unlinks a catalog practice at the free cap is refused
        // server-side (migration 20260925000001). Keep the form open so the
        // user's edits survive; only a refused CREATE leaves.
        if (!isEdit) leaveForm();
        useLimitModalStore.getState().open(limited);
        return;
      }
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      Alert.alert(t('taskForm.saveFailed'), msg);
    }
  };

  const handleArchive = async () => {
    if (!params.id) return;
    const ok = await confirmAction(
      t('taskForm.archiveConfirmTitle'),
      t('taskForm.archiveConfirmBody'),
      { okText: t('common.archive'), cancelText: t('common.cancel'), destructive: true },
    );
    if (!ok) return;
    try {
      await archiveTask.mutateAsync(params.id);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      Alert.alert(t('taskForm.archiveFailed'), msg);
    }
  };

  // Edit mode also waits for the catalog when the practice has a
  // description: until it lands, a catalog blurb can't be told apart from
  // the user's own text and would flash inside the field first.
  if (
    isEdit &&
    (existing.isLoading || (templates.isLoading && !!existing.data?.description))
  ) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={tokens.brand.violet2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Pressable
          onPress={leaveForm}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="close" size={24} color={tokens.text.hi} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEdit ? t('taskForm.editTitle') : t('taskForm.newTitle')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.saveButton,
            (pressed || isSubmitting) && { opacity: 0.6 },
          ]}
          hitSlop={8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={tokens.text.hi} size="small" />
          ) : (
            <Text style={styles.saveText}>{t('common.save')}</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            m2FormBump > 0 && { paddingBottom: tokens.space[10] + m2FormBump },
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + tokens.space[10] },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {breaksTemplateLink && (
            <View style={styles.breakWarning}>
              <Ionicons name="information-circle" size={18} color={tokens.semantic.warn} />
              <Text style={styles.breakWarningText}>
                {t('taskForm.breakWarning')}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>{t('taskForm.titleLabel')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder={t('taskForm.titlePlaceholder')}
              placeholderTextColor={tokens.text.faint}
              // Skip the auto-keyboard while the M2 tour walks the form
              // — the user is reading tooltips, not typing yet, and a
              // popped keyboard would shove the spotlight off-screen.
              autoFocus={!isEdit && !(isCreateMode && isM2Current)}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('taskForm.descLabel')}</Text>
            {showBlurbNote && (
              <View style={styles.blurbNote}>
                <Ionicons
                  name="bulb-outline"
                  size={16}
                  color={tokens.text.mid}
                  style={styles.blurbIcon}
                />
                <View style={styles.blurbBody}>
                  <Text style={styles.blurbLabel}>{t('taskForm.whyItMatters')}</Text>
                  <Text style={styles.blurbText}>{catalogBlurb}</Text>
                </View>
              </View>
            )}
            <TextInput
              value={ownDescription}
              onChangeText={(text) => {
                setDescriptionTouched(true);
                setDescription(text);
              }}
              style={[styles.input, styles.inputMultiline]}
              placeholder={
                showBlurbNote
                  ? t('taskForm.descPlaceholderOwn')
                  : t('taskForm.descPlaceholder')
              }
              placeholderTextColor={tokens.text.faint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('taskForm.iconLabel')}</Text>
            {/* Compact row that opens the picker sheet — the old inline
                43-cell grid buried the required subs/recurrence sections
                ~500px down the form. */}
            <Pressable
              onPress={() => {
                // Title autofocuses in create mode; drop the keyboard so
                // it can't float over/behind the transparent modal.
                Keyboard.dismiss();
                setIconPickerVisible(true);
              }}
              style={({ pressed }) => [styles.iconRow, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              // Self-contained label — the override suppresses the inner
              // text for screen readers, so bare 'Trocar' wouldn't say
              // WHAT gets changed.
              accessibilityLabel={t('common.changeIconA11y')}
            >
              <View style={styles.iconRowTile}>
                {(() => {
                  const primarySubId = subs[0]?.sub_id;
                  const autoIcon = primarySubId
                    ? SUB_META[primarySubId]?.iconName ?? 'ellipse-outline'
                    : 'ellipse-outline';
                  return (
                    <AppIcon
                      name={icon === null ? autoIcon : icon}
                      size={22}
                      color={tokens.brand.violet2}
                    />
                  );
                })()}
              </View>
              <Text style={styles.iconRowHint} numberOfLines={2}>
                {t('taskForm.iconHint')}
              </Text>
              <Text style={styles.iconRowChange}>{t('common.changeIcon')}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={tokens.brand.violet2}
              />
            </Pressable>
          </View>

          <View
            style={styles.field}
            onLayout={(e) => noteSectionY(subsY, e.nativeEvent.layout.y)}
          >
            <Text style={styles.label}>{t('taskForm.subsLabel')}</Text>
            <Text style={styles.hint}>{t('taskForm.subsHint')}</Text>
            <SubPicker value={subs} onChange={setSubs} />
            {subs.length > 0 && (
              <View style={styles.rewardPreview}>
                <Ionicons name="flag" size={13} color={tokens.semantic.xp} />
                <Text style={[styles.rewardText, { color: tokens.semantic.xp }]}>
                  +{reward.total.xp} XP
                </Text>
                <Ionicons
                  name="cash"
                  size={13}
                  color={tokens.semantic.coin}
                />
                <Text
                  style={[styles.rewardText, { color: tokens.semantic.coin }]}
                >
                  +{reward.total.coins}
                </Text>
                <Text style={styles.rewardSplit}>
                  {reward.perSub
                    .map((p) => `${p.stars}★`)
                    .join(' + ')}{' '}
                  = {reward.totalStars}★
                </Text>
              </View>
            )}
          </View>

          {/* Order = the tour's order and the questions the user answers:
              what it trains → how often → what it's worth in coins. */}
          <View
            style={styles.field}
            onLayout={(e) => noteSectionY(recurrenceY, e.nativeEvent.layout.y)}
          >
            <Text style={styles.label}>{t('taskForm.recurrenceLabel')}</Text>
            <RecurrencePicker
              recurrence={recurrence}
              onChange={setRecurrence}
              targetCount={targetCount}
              onChangeTargetCount={setTargetCount}
            />
          </View>

          <View
            style={styles.field}
            onLayout={(e) => noteSectionY(coinsY, e.nativeEvent.layout.y)}
          >
            <Text style={styles.label}>{t('tasks.coinMultiplier.label')}</Text>
            <Text style={styles.hint}>{t('tasks.coinMultiplier.hint')}</Text>
            <CoinMultiplierPicker value={coinMultiplier} onChange={setCoinMultiplier} />
          </View>

          {isEdit && (
            <Pressable
              onPress={handleArchive}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.archiveButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="archive-outline"
                size={18}
                color={tokens.semantic.danger}
              />
              <Text style={styles.archiveText}>{t('taskForm.archiveBtn')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <IconPickerModal
        visible={iconPickerVisible}
        title={t('taskForm.iconLabel')}
        value={icon}
        onSelect={setIcon}
        onClose={() => setIconPickerVisible(false)}
        accentColor={tokens.brand.violet2}
        accentBg="rgba(155, 130, 255, 0.16)"
        autoIcon={(() => {
          const primarySubId = subs[0]?.sub_id;
          return primarySubId
            ? SUB_META[primarySubId]?.iconName ?? 'ellipse-outline'
            : 'ellipse-outline';
        })()}
        autoA11yLabel={t('taskForm.iconAutoA11y')}
      />

      {/* M2 steps 4-6 (what it trains / how often / coins) live here when
         the form is in CREATE mode (no id, no template prefill). The last
         Próximo, and "Pular este módulo", end M2 on Home (finishM2AtHome
         keeps a skip a skip). */}
      {isCreateMode && (
        <TourModule
          module="M2"
          screen="create"
          steps={buildM2Steps(t)}
          enabled={isM2Current}
          flatNav
          onExitScreen={finishM2AtHome}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.base },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.base,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  headerTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  saveButton: {
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
    backgroundColor: tokens.brand.violet,
    borderRadius: tokens.radius.md,
    minWidth: 72,
    alignItems: 'center',
  },
  saveText: {
    ...tokens.type.body,
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.hi,
  },
  content: {
    padding: tokens.space[4],
    gap: tokens.space[5],
    paddingBottom: tokens.space[10],
  },
  breakWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.4)',
    backgroundColor: 'rgba(255, 159, 67, 0.10)',
    marginBottom: tokens.space[3],
  },
  breakWarningText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.base,
  },
  field: {
    gap: tokens.space[2],
  },
  label: {
    ...tokens.type.eyebrow,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Helper lines (first-user feedback: "tiny and confusing"): 13px in
  // text.mid. The old 12px text.dim measured ~3.5:1 on this background,
  // under the 4.5:1 small text needs.
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
    marginTop: -2,
  },
  input: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    color: tokens.text.hi,
    ...tokens.type.bodyLg,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: tokens.space[3],
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  rewardText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
  },
  rewardSplit: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
    letterSpacing: 0.2,
  },
  // Catalog blurb, shown as context rather than as the user's own text:
  // no input chrome, a label saying where it comes from, readable size.
  blurbNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[2],
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.border.strong,
  },
  blurbIcon: {
    marginTop: 1,
  },
  blurbBody: {
    flex: 1,
    gap: 2,
  },
  blurbLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  blurbText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
  },
  iconRowTile: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // Violet accent matches the home check button — picks the prática
    // domain palette (gold goes to rewards).
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(155, 130, 255, 0.16)',
  },
  iconRowHint: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  iconRowChange: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.space[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 122, 0.3)',
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255, 92, 122, 0.08)',
    marginTop: tokens.space[3],
  },
  archiveText: {
    ...tokens.type.body,
    color: tokens.semantic.danger,
    fontFamily: 'Manrope_700Bold',
  },
});
