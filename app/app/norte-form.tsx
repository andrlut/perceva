import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VidaSeal } from '@/components/pillars/NorteParts';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useCharacter, pickSubScoresDecimal } from '@/lib/api/character';
import {
  NORTH_TODAY_LEN,
  NORTH_WANT_LEN,
  cleanPhrase,
  useDimensionNotes,
  useSaveDimensionNotes,
  type NorthDraft,
} from '@/lib/api/dimensionNotes';
import { useLifeVision } from '@/lib/api/lifeVision';
import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useModuleEnabled } from '@/lib/modules';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

type Draft = Record<DimensionId, NorthDraft>;

const emptyDraft = (): Draft =>
  Object.fromEntries(
    DIMENSION_ORDER.map((d) => [d, { dimension_id: d, matters: false, want: '', today: '' }]),
  ) as Draft;

const DIMS = new Set<string>(DIMENSION_ORDER);

/**
 * The Norte editor. One card per area, in the hex's order: a switch says the
 * area matters now; on, the card opens the phrase ("Quero poder escolher…",
 * ≤ 140), how it is today (optional) and, with "A vida que eu quero" on, the
 * scenes of that area as one-tap suggestions. The area's ruler (today →
 * target) reads under it; the targets themselves stay in the self-assessment
 * (link at the end). One control kind per job: switch to choose, text to
 * write, chip to take a suggestion.
 *
 * Opened from a card of the panel (`?dim=`), it scrolls to that area.
 * Saving sends only the areas that changed, in one transaction.
 */
export default function NorteFormScreen() {
  const router = useRouter();
  const { t } = useT();
  const meta = useMetaLookup();
  const params = useLocalSearchParams<{ dim?: string }>();
  const focusDim = params.dim && DIMS.has(params.dim) ? (params.dim as DimensionId) : null;

  const notes = useDimensionNotes();
  const character = useCharacter();
  const vidaOn = useModuleEnabled('vida');
  const vision = useLifeVision(vidaOn);
  const save = useSaveDimensionNotes();
  const keyboardHeight = useKeyboardHeight();

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // State, not a ref: the list only mounts once the draft holds what is
  // saved, so the first layout (and the scroll to `?dim=`) is the real one.
  const [seeded, setSeeded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  // Prefill once with what is saved.
  useEffect(() => {
    if (seeded || !notes.isSuccess) return;
    const next = emptyDraft();
    for (const [dim, n] of notes.data) {
      next[dim] = { dimension_id: dim, matters: n.matters, want: n.want ?? '', today: n.today ?? '' };
    }
    setDraft(next);
    setSeeded(true);
  }, [seeded, notes.isSuccess, notes.data]);

  const subScores = character.data?.subScores;
  const current = useMemo(() => pickSubScoresDecimal(subScores ?? [], 'self'), [subScores]);
  const desired = useMemo(() => pickSubScoresDecimal(subScores ?? [], 'desired'), [subScores]);

  const scenesByDim = useMemo(() => {
    const m = new Map<DimensionId, string[]>();
    if (!vidaOn) return m;
    for (const s of vision.data?.scenes ?? []) m.set(s.dim, [...(m.get(s.dim) ?? []), s.text]);
    return m;
  }, [vidaOn, vision.data]);

  const changed = useMemo(() => {
    if (!notes.isSuccess) return [];
    return DIMENSION_ORDER.map((d) => draft[d]).filter((d) => {
      const n = notes.data.get(d.dimension_id);
      const before = {
        matters: n?.matters ?? false,
        want: n?.want ?? '',
        today: n?.today ?? '',
      };
      return (
        d.matters !== before.matters ||
        cleanPhrase(d.want) !== cleanPhrase(before.want) ||
        cleanPhrase(d.today) !== cleanPhrase(before.today)
      );
    });
  }, [draft, notes.isSuccess, notes.data]);

  const patch = (dim: DimensionId, p: Partial<NorthDraft>) =>
    setDraft((d) => ({ ...d, [dim]: { ...d[dim], ...p } }));

  const ruler = (dim: DimensionId) =>
    SUBS_BY_DIM[dim]
      .map((sub) => {
        const cur = current.get(sub) ?? 0;
        const des = desired.get(sub);
        const label = meta.sub(sub).label;
        return des == null
          ? `${label} ${formatScore(cur)}`
          : `${label} ${formatScore(cur)} → ${formatScore(des)}`;
      })
      .join(' · ');

  const onSave = () => {
    if (save.isPending) return;
    if (changed.length === 0) {
      router.back();
      return;
    }
    save.mutate(changed, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
    });
  };

  const loading = notes.isLoading || (notes.isSuccess && !seeded);

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
            {t('norte.form.title')}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
          {loading ? (
            <ActivityIndicator color={tokens.semantic.coin} style={styles.loading} />
          ) : notes.isError ? (
            <Text style={[styles.error, styles.loading]}>{t('norte.form.loadError')}</Text>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.card, styles.cardGold]}>
                <Text style={styles.eyebrow}>{t('norte.form.eyebrow')}</Text>
                <Text style={styles.question}>{t('norte.form.question')}</Text>
                <Text style={styles.hint}>{t('norte.form.hint')}</Text>
              </View>

              {DIMENSION_ORDER.map((dim) => {
                const d = draft[dim];
                const color = DIMENSION_META[dim].color;
                const label = meta.dim(dim).label;
                const scenes = (scenesByDim.get(dim) ?? []).filter(
                  (s) => cleanPhrase(s) !== cleanPhrase(d.want),
                );
                const hasText = cleanPhrase(d.want) !== '' || cleanPhrase(d.today) !== '';
                return (
                  <View
                    key={dim}
                    style={[styles.card, d.matters && { borderColor: tokens.semantic.coinRim }]}
                    onLayout={(e) => {
                      if (dim !== focusDim || scrolled.current) return;
                      scrolled.current = true;
                      const y = Math.max(0, e.nativeEvent.layout.y - tokens.space[3]);
                      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: false }));
                    }}
                  >
                    <Pressable
                      onPress={() => patch(dim, { matters: !d.matters })}
                      style={styles.areaHead}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: d.matters }}
                      accessibilityLabel={t('norte.form.mattersA11y', { dim: label })}
                    >
                      <View style={[styles.iconHalo, { backgroundColor: DIMENSION_META[dim].bg }]}>
                        <Ionicons
                          name={DIMENSION_META[dim].iconName as never}
                          size={16}
                          color={color}
                        />
                      </View>
                      <View style={styles.areaHeadText}>
                        <Text style={styles.areaName}>{label}</Text>
                        <Text style={styles.areaRuler} numberOfLines={1}>
                          {ruler(dim)}
                        </Text>
                      </View>
                      <Text style={[styles.mattersText, d.matters && styles.mattersTextOn]}>
                        {t('norte.form.matters')}
                      </Text>
                      {/* The switch only shows the state: the whole row is the
                          toggle, so a tap never lands twice. */}
                      <View
                        pointerEvents="none"
                        importantForAccessibility="no-hide-descendants"
                        accessibilityElementsHidden
                      >
                        <Switch
                          value={d.matters}
                          trackColor={{ false: tokens.bg.surface2, true: tokens.semantic.coin }}
                          thumbColor={tokens.text.hi}
                        />
                      </View>
                    </Pressable>

                    {d.matters ? (
                      <View style={styles.fields}>
                        <View style={styles.fieldHead}>
                          <Text style={styles.fieldLabel}>{t('norte.form.wantLabel')}</Text>
                          <Text style={styles.counter}>
                            {d.want.length}/{NORTH_WANT_LEN}
                          </Text>
                        </View>
                        <TextInput
                          value={d.want}
                          onChangeText={(want) => patch(dim, { want })}
                          placeholder={t(`norte.form.placeholder.${dim}`)}
                          placeholderTextColor={tokens.text.dim}
                          maxLength={NORTH_WANT_LEN}
                          multiline
                          autoFocus={dim === focusDim && d.want === ''}
                          style={styles.input}
                          accessibilityLabel={t('norte.form.wantA11y', { dim: label })}
                        />

                        {scenes.length > 0 && (
                          <View style={styles.suggest}>
                            <VidaSeal suggestion />
                            {scenes.map((s, i) => (
                              <Pressable
                                key={i}
                                onPress={() => patch(dim, { want: s.slice(0, NORTH_WANT_LEN) })}
                                style={({ pressed }) => [styles.sceneChip, pressed && { opacity: 0.8 }]}
                                accessibilityRole="button"
                                accessibilityLabel={t('norte.form.useSceneA11y', { scene: s })}
                              >
                                <Ionicons name="arrow-up" size={14} color={tokens.semantic.coinLight} />
                                <Text style={styles.sceneText}>{s}</Text>
                              </Pressable>
                            ))}
                          </View>
                        )}

                        <View style={styles.fieldHead}>
                          <Text style={styles.fieldLabel}>
                            {t('norte.form.todayLabel')}{' '}
                            <Text style={styles.optional}>{t('norte.form.optional')}</Text>
                          </Text>
                          <Text style={styles.counter}>
                            {d.today.length}/{NORTH_TODAY_LEN}
                          </Text>
                        </View>
                        <TextInput
                          value={d.today}
                          onChangeText={(today) => patch(dim, { today })}
                          placeholder={t('norte.form.todayPlaceholder')}
                          placeholderTextColor={tokens.text.dim}
                          maxLength={NORTH_TODAY_LEN}
                          multiline
                          style={styles.input}
                          accessibilityLabel={t('norte.form.todayA11y', { dim: label })}
                        />
                      </View>
                    ) : hasText ? (
                      <Text style={styles.kept}>{t('norte.form.kept')}</Text>
                    ) : null}
                  </View>
                );
              })}

              <Pressable
                onPress={() =>
                  router.push({ pathname: '/self-assessment', params: { mode: 'desired' } })
                }
                style={({ pressed }) => [styles.card, styles.linkRow, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
              >
                <Ionicons name="flag-outline" size={18} color={tokens.semantic.coin} />
                <Text style={styles.linkText}>{t('norte.form.targets')}</Text>
                <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
              </Pressable>

              <Text style={styles.purpose}>{t('norte.form.purpose')}</Text>
            </ScrollView>
          )}

          <View style={styles.bottomBar}>
            {save.isError && <Text style={styles.error}>{t('norte.form.saveError')}</Text>}
            <Pressable
              onPress={onSave}
              disabled={loading || notes.isError || save.isPending}
              style={({ pressed }) => [
                styles.saveBtn,
                (loading || notes.isError) && styles.saveBtnOff,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
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
    </SafeAreaView>
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
  loading: { marginTop: tokens.space[8], textAlign: 'center' },
  content: { padding: tokens.space[4], gap: tokens.space[3], paddingBottom: tokens.space[6] },
  card: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  cardGold: { borderWidth: 1.5, borderColor: tokens.semantic.coinRim, gap: tokens.space[2] },
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
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.mid,
  },
  areaHead: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  iconHalo: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaHeadText: { flex: 1, minWidth: 0, gap: 1 },
  areaName: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.text.hi },
  areaRuler: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.5,
    color: tokens.text.mid,
    fontVariant: ['tabular-nums'],
  },
  mattersText: { fontFamily: 'Manrope_700Bold', fontSize: 11.5, color: tokens.text.dim },
  mattersTextOn: { color: tokens.semantic.coin },
  fields: { gap: tokens.space[2] },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fieldLabel: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.semantic.coin,
  },
  optional: {
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: 0,
    textTransform: 'none',
    color: tokens.text.dim,
  },
  counter: { fontFamily: 'Manrope_700Bold', fontSize: 11.5, color: tokens.text.dim },
  input: {
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
  suggest: { gap: 6 },
  sceneChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    borderStyle: 'dashed',
  },
  sceneText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.base,
  },
  kept: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  linkText: { flex: 1, fontFamily: 'Manrope_700Bold', fontSize: 14, color: tokens.text.hi },
  purpose: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
    paddingHorizontal: tokens.space[1],
  },
  error: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    color: tokens.semantic.danger,
    textAlign: 'center',
  },
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
