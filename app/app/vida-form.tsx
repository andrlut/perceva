import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { AppIcon } from '@/components/AppIcon';
import { ScreenInfoButton } from '@/components/guide/ScreenInfoButton';
import { VidaGuide, useVidaGuidePrompt } from '@/components/guide/screens/VidaGuide';
import { InfoSheet } from '@/components/InfoSheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  LIFE_CUT_LEN,
  LIFE_CUTS_MAX,
  LIFE_GUILT_FREE_MAX,
  LIFE_HEADLINE_LEN,
  LIFE_SCENE_LEN,
  LIFE_SCENES_MAX,
  draftProblem,
  useLifeVision,
  useSaveLifeVision,
  type LifeVisionDraft,
} from '@/lib/api/lifeVision';
import { useActiveTasks } from '@/lib/api/tasks';
import type { DimensionId, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useRequireModule } from '@/lib/modules';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

const ALL_SUBS: SubId[] = DIMENSION_ORDER.flatMap((d) => SUBS_BY_DIM[d]);
/** Practices shown before "Ver todas". */
const PRACTICES_PREVIEW = 6;

const EMPTY: LifeVisionDraft = {
  headline: '',
  scenes: Array.from({ length: LIFE_SCENES_MAX }, () => ({ text: '', dim: null })),
  guiltFree: [],
  cuts: Array.from({ length: LIFE_CUTS_MAX }, () => ''),
  firstTaskId: null,
};

/**
 * The editor of "A vida que eu quero". Opens prefilled with the current
 * version; saving always inserts a new one (the table has no update), so
 * nothing written before is lost. Sections are cards, one control kind per
 * section: text for the things, a chip row for each one's area, chips for
 * the guilt-free subs, text for the cuts, radio rows for the practice.
 */
export default function VidaFormScreen() {
  const router = useRouter();
  const { t } = useT();
  const meta = useMetaLookup();
  const on = useRequireModule('vida');
  const current = useLifeVision(on);
  const tasks = useActiveTasks();
  const save = useSaveLifeVision();
  const keyboardHeight = useKeyboardHeight();
  const [helpOpen, setHelpOpen] = useState(false);
  const guidePrompt = useVidaGuidePrompt();

  const [draft, setDraft] = useState<LifeVisionDraft>(EMPTY);
  const [showAllPractices, setShowAllPractices] = useState(false);
  const [tried, setTried] = useState(false);
  const seeded = useRef(false);

  // Prefill once with the current version, when there is one.
  useEffect(() => {
    if (seeded.current || !current.isSuccess) return;
    seeded.current = true;
    const v = current.data?.vision;
    if (!v) return;
    const scenes = (current.data?.scenes ?? []).map((s) => ({ text: s.text, dim: s.dim as DimensionId | null }));
    while (scenes.length < LIFE_SCENES_MAX) scenes.push({ text: '', dim: null });
    const cuts = [...v.cuts];
    while (cuts.length < LIFE_CUTS_MAX) cuts.push('');
    setDraft({
      headline: v.headline ?? '',
      scenes,
      guiltFree: [...v.guilt_free],
      cuts,
      firstTaskId: current.data?.firstTask ? v.first_task_id : null,
    });
  }, [current.isSuccess, current.data]);

  const problem = draftProblem(draft);
  const practices = useMemo(() => tasks.data ?? [], [tasks.data]);
  const selectedIndex = practices.findIndex((p) => p.id === draft.firstTaskId);
  const visiblePractices =
    showAllPractices || selectedIndex >= PRACTICES_PREVIEW
      ? practices
      : practices.slice(0, PRACTICES_PREVIEW);

  const setScene = (i: number, patch: Partial<{ text: string; dim: DimensionId | null }>) =>
    setDraft((d) => ({
      ...d,
      scenes: d.scenes.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));

  const toggleSub = (sub: SubId) =>
    setDraft((d) => {
      if (d.guiltFree.includes(sub)) return { ...d, guiltFree: d.guiltFree.filter((s) => s !== sub) };
      if (d.guiltFree.length >= LIFE_GUILT_FREE_MAX) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return d;
      }
      return { ...d, guiltFree: [...d.guiltFree, sub] };
    });

  const onSave = () => {
    setTried(true);
    if (problem || save.isPending) return;
    save.mutate(draft, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Back to /vida when it is under us (Editar); otherwise (the Eu
        // card's first draw) the form is replaced by it — never two /vida.
        router.dismissTo('/vida');
      },
    });
  };

  const loading = !on || current.isLoading;

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
            {t('vida.title')}
          </Text>
          <ScreenInfoButton onPress={() => setHelpOpen(true)} a11yLabel={t('vida.help.a11y')} />
        </View>

        <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
          {loading ? (
            <ActivityIndicator color={tokens.semantic.coin} style={styles.loading} />
          ) : (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {/* 1 · the three things */}
              <View style={[styles.card, styles.cardGold]}>
                <Text style={styles.eyebrow}>{t('vida.subtitle')}</Text>
                <Text style={styles.question}>{t('vida.question')}</Text>
                <Text style={styles.hint}>{t('vida.questionHint')}</Text>
                {draft.scenes.map((s, i) => {
                  const filled = s.text.trim().length > 0;
                  const missingArea = tried && filled && s.dim == null;
                  return (
                    <View key={i} style={styles.sceneBlock}>
                      <View style={styles.sceneRow}>
                        <Text style={styles.sceneNum}>{i + 1}</Text>
                        <TextInput
                          value={s.text}
                          onChangeText={(text) => setScene(i, { text })}
                          placeholder={t(`vida.scenePlaceholder${i + 1}`)}
                          placeholderTextColor={tokens.text.dim}
                          maxLength={LIFE_SCENE_LEN}
                          multiline
                          style={styles.sceneInput}
                          accessibilityLabel={t('vida.sceneA11y', { n: i + 1 })}
                        />
                      </View>
                      <View style={styles.dimRow}>
                        {DIMENSION_ORDER.map((dim) => {
                          const active = s.dim === dim;
                          return (
                            <Pressable
                              key={dim}
                              onPress={() => setScene(i, { dim: active ? null : dim })}
                              style={[
                                styles.dimPick,
                                active && {
                                  backgroundColor: DIMENSION_META[dim].bg,
                                  borderColor: DIMENSION_META[dim].color,
                                },
                              ]}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                            >
                              <View style={[styles.dot, { backgroundColor: DIMENSION_META[dim].color }]} />
                              <Text style={[styles.dimPickText, active && styles.dimPickTextOn]}>
                                {meta.dim(dim).label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {missingArea && <Text style={styles.error}>{t('vida.needArea')}</Text>}
                    </View>
                  );
                })}
                {tried && problem === 'needFirst' && <Text style={styles.error}>{t('vida.needFirst')}</Text>}
              </View>

              {/* headline */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('vida.headlineTitle')}</Text>
                <Text style={styles.hint}>{t('vida.headlineHint')}</Text>
                <TextInput
                  value={draft.headline}
                  onChangeText={(headline) => setDraft((d) => ({ ...d, headline }))}
                  placeholder={t('vida.headlinePlaceholder')}
                  placeholderTextColor={tokens.text.dim}
                  maxLength={LIFE_HEADLINE_LEN}
                  style={styles.input}
                  accessibilityLabel={t('vida.headlineTitle')}
                />
              </View>

              {/* 2 · guilt-free */}
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{t('vida.guiltFreeTitle')}</Text>
                  <Text style={styles.counter}>
                    {t('vida.counter', { n: draft.guiltFree.length, max: LIFE_GUILT_FREE_MAX })}
                  </Text>
                </View>
                <Text style={styles.cardQuestion}>{t('vida.guiltFreeQuestion')}</Text>
                <View style={styles.chips}>
                  {ALL_SUBS.map((sub) => {
                    const active = draft.guiltFree.includes(sub);
                    const dim = DIMENSION_ORDER.find((d) => SUBS_BY_DIM[d].includes(sub))!;
                    return (
                      <Pressable
                        key={sub}
                        onPress={() => toggleSub(sub)}
                        style={[
                          styles.chip,
                          active && {
                            backgroundColor: DIMENSION_META[dim].bg,
                            borderColor: DIMENSION_META[dim].color,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <View style={[styles.dot, { backgroundColor: DIMENSION_META[dim].color }]} />
                        <Text style={[styles.chipText, active && styles.chipTextOn]}>
                          {meta.sub(sub).label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 3 · cuts */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('vida.cutsTitle')}</Text>
                <Text style={styles.cardQuestion}>{t('vida.cutsQuestion')}</Text>
                {draft.cuts.map((c, i) => (
                  <TextInput
                    key={i}
                    value={c}
                    onChangeText={(text) =>
                      setDraft((d) => ({ ...d, cuts: d.cuts.map((x, j) => (j === i ? text : x)) }))
                    }
                    placeholder={t(`vida.cutPlaceholder${i + 1}`)}
                    placeholderTextColor={tokens.text.dim}
                    maxLength={LIFE_CUT_LEN}
                    style={styles.input}
                    accessibilityLabel={t('vida.cutA11y', { n: i + 1 })}
                  />
                ))}
              </View>

              {/* 4 · first practice */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('vida.practiceTitle')}</Text>
                <Text style={styles.cardQuestion}>{t('vida.practiceQuestion')}</Text>
                <PracticeOption
                  label={t('vida.practiceNone')}
                  icon="remove-circle-outline"
                  selected={draft.firstTaskId == null}
                  onPress={() => setDraft((d) => ({ ...d, firstTaskId: null }))}
                />
                {visiblePractices.map((p) => (
                  <PracticeOption
                    key={p.id}
                    label={p.title}
                    icon={p.icon}
                    selected={draft.firstTaskId === p.id}
                    onPress={() => setDraft((d) => ({ ...d, firstTaskId: p.id }))}
                  />
                ))}
                {visiblePractices.length < practices.length && (
                  <Pressable onPress={() => setShowAllPractices(true)} style={styles.linkBtn}>
                    <Text style={styles.linkText}>{t('vida.practiceShowAll', { count: practices.length })}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => router.push('/tasks')}
                  style={({ pressed }) => [styles.linkBtn, styles.createRow, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="add-circle-outline" size={18} color={tokens.brand.violet2} />
                  <Text style={styles.linkText}>{t('vida.practiceCreate')}</Text>
                </Pressable>
              </View>

              <Text style={styles.purpose}>{t('vida.purpose')}</Text>
            </ScrollView>
          )}

          <View style={styles.bottomBar}>
            {save.isError && <Text style={[styles.error, styles.errorBar]}>{t('vida.saveError')}</Text>}
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

      <InfoSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('vida.help.title')}
        aiPrompt={guidePrompt}
      >
        <VidaGuide />
      </InfoSheet>
    </SafeAreaView>
  );
}

function PracticeOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.optionOn, pressed && { opacity: 0.8 }]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <AppIcon name={icon || 'checkmark-circle-outline'} size={18} color={tokens.text.hi} />
      <Text style={styles.optionText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={18}
        color={selected ? tokens.semantic.coin : tokens.text.dim}
      />
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
  cardGold: { borderWidth: 1.5, borderColor: tokens.semantic.coinRim, gap: tokens.space[3] },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.semantic.coin,
  },
  question: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 19,
    lineHeight: 25,
    color: tokens.text.hi,
  },
  cardTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  cardQuestion: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.hi,
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.mid,
  },
  counter: { fontFamily: 'Manrope_700Bold', fontSize: 12, color: tokens.text.mid },
  sceneBlock: { gap: tokens.space[2] },
  sceneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[2] },
  sceneNum: {
    width: 24,
    height: 24,
    marginTop: 10,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinInk,
    backgroundColor: tokens.semantic.coin,
  },
  sceneInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
    textAlignVertical: 'top',
  },
  dimRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 32 },
  dimPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  dimPickText: { fontFamily: 'Manrope_700Bold', fontSize: 11.5, color: tokens.text.mid },
  dimPickTextOn: { color: tokens.text.hi },
  dot: { width: 8, height: 8, borderRadius: 4 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  chipText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: tokens.text.mid },
  chipTextOn: { color: tokens.text.hi },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionOn: { borderColor: tokens.semantic.coinRim },
  optionText: { flex: 1, fontFamily: 'Manrope_700Bold', fontSize: 14, color: tokens.text.hi },
  linkBtn: { paddingVertical: 8, alignSelf: 'flex-start' },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontFamily: 'Manrope_700Bold', fontSize: 13.5, color: tokens.brand.violet2 },
  purpose: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
    paddingHorizontal: tokens.space[1],
  },
  error: { fontFamily: 'Manrope_700Bold', fontSize: 12.5, color: tokens.semantic.danger, paddingLeft: 32 },
  errorBar: { paddingLeft: 0, textAlign: 'center' },
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
