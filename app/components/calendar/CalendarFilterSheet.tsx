import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodFace } from '@/components/mood/MoodFace';
import { useMoodTags } from '@/lib/api/mood';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { activeFacetCount, MIN_XP_MAX, stepMinXp } from '@/lib/calendar/filters';
import { useCalendarStore } from '@/lib/calendar/store';
import type { DimensionId, MoodTag } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { moodLevel, splitMoodTags, type MoodValue } from '@/lib/mood';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM, SUB_META } from '@/theme/dimensions';

/**
 * The funnel — every facet of the calendar filter in one sheet.
 *
 * **There is no draft state: each chip applies the instant it is tapped.** The
 * month behind the scrim re-paints under the new filter while the sheet is
 * still open, which is the whole point — the user watches days dim and knows
 * what the facet did before committing to it. "Aplicar" therefore only closes.
 * That is a decision, not an omission — do not add a staged copy of the filter.
 *
 * ## Why the sections are shaped so differently
 *
 * The first version laid every facet out flat and the sheet opened as a wall of
 * fifty-odd chips — the filter's own menu was the most cluttered surface in the
 * app. Each facet now gets the shape its data actually has:
 *
 * - **Mood** is five fixed options, so it is five faces on one line with no
 *   labels. The face already carries the level in colour and curvature; a word
 *   beside it would double the width to say the same thing again.
 * - **Dimensions and subs** are a fixed 6×(1+2) tree, so they are six rows of
 *   "dimension, then its two subs". Laid out with flex ratios rather than wrap,
 *   which is what guarantees exactly six lines on every screen width instead of
 *   a ragged block that reflows as labels change length.
 * - **Tags** and **practices** are open-ended and personal — they collapse. Only
 *   one of the two is open at a time, so the sheet stays roughly one screen tall
 *   however many practices the user has accumulated.
 *
 * Practices additionally get a search field and no repetition count: with
 * dozens of them, finding one by name beats reading a ranked list, and the
 * count was decoration that made every row longer.
 */

const MOOD_VALUES: MoodValue[] = [1, 2, 3, 4, 5];

/** Which open-ended section is expanded. Only one at a time, by design. */
type OpenSection = 'tags' | 'practices' | 'rewards' | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Practices seen in the loaded range, already sorted most-logged first. */
  practices: { taskId: string; title: string; dim: DimensionId | null }[];
  /** Rewards seen in the loaded range, most-redeemed first. */
  rewards: { rewardId: string; title: string; icon: string | null }[];
}

export function CalendarFilterSheet({ visible, onClose, practices, rewards }: Props) {
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const { height } = useWindowDimensions();
  const tagsQuery = useMoodTags();

  const filter = useCalendarStore((s) => s.filter);
  const toggleMood = useCalendarStore((s) => s.toggleMood);
  const toggleTask = useCalendarStore((s) => s.toggleTask);
  const toggleDim = useCalendarStore((s) => s.toggleDim);
  const toggleSub = useCalendarStore((s) => s.toggleSub);
  const toggleTag = useCalendarStore((s) => s.toggleTag);
  const nudgeMinXp = useCalendarStore((s) => s.nudgeMinXp);
  const toggleWithRedemption = useCalendarStore((s) => s.toggleWithRedemption);
  const toggleReward = useCalendarStore((s) => s.toggleReward);
  const clearFilter = useCalendarStore((s) => s.clearFilter);
  const taskLabels = useCalendarStore((s) => s.taskLabels);
  const rewardLabels = useCalendarStore((s) => s.rewardLabels);

  const [open, setOpen] = useState<OpenSection>(null);
  const [search, setSearch] = useState('');

  /**
   * How far to lift the sheet so the keyboard cannot cover it.
   *
   * `KeyboardAvoidingView` is the house pattern everywhere else, but it leans
   * on the Activity resizing — and a React Native `Modal` is its own window
   * that does not. Inside a sheet the input ends up under the keyboard and you
   * cannot see what you are typing, so the height is measured and the scrim is
   * padded instead.
   *
   * The `+ insets.bottom` on Android is not a fudge. From API 30 RN reports the
   * keyboard as `imeInsets.bottom - barInsets.bottom` — the IME height minus
   * the navigation bar — which assumes a window that already stops above that
   * bar. This one does not: `edgeToEdgeEnabled` in app.json makes the modal's
   * window edge-to-edge, so its bottom edge is the physical bottom of the
   * screen and the missing nav-bar band (48dp with 3-button navigation) is
   * exactly how much of the footer stays hidden — enough to swallow the Apply
   * button. Below API 30 RN takes the legacy path, which already reports the
   * full height, so adding the inset there would over-lift instead.
   */
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const navGap =
    Platform.OS === 'android' && Number(Platform.Version) >= 30 ? insets.bottom : 0;
  const lift = keyboardHeight > 0 ? keyboardHeight + navGap : 0;

  const facets = activeFacetCount(filter);

  const catalog: MoodTag[] = tagsQuery.data ?? [];
  const { emotions, contexts } = splitMoodTags(catalog);
  const orderedTags = [...emotions, ...contexts];

  const atFloor = filter.minXp <= 0;
  const atCeiling = filter.minXp >= MIN_XP_MAX;

  // Both stepper buttons would otherwise announce the same "XP mínimo". Naming
  // the value each press LANDS on is the only way to tell them apart without
  // inventing a new i18n key for "increase" / "decrease".
  const xpLabel = (xp: number) =>
    xp > 0 ? t('calendar.filter.minXpValue', { xp }) : t('calendar.filter.minXpAny');

  // A practice selected in another period is not in `practices` (which only
  // covers the loaded range), and without this it would vanish from the sheet
  // while still dimming the month — selectable but not deselectable.
  const allPractices = [
    ...practices,
    ...filter.taskIds
      .filter((id) => !practices.some((p) => p.taskId === id))
      .map((id) => ({
        taskId: id,
        title: taskLabels[id] ?? t('calendar.filter.practiceUnknown'),
        dim: null as DimensionId | null,
      })),
  ];

  const allRewards = [
    ...rewards,
    ...filter.rewardIds
      .filter((id) => !rewards.some((r) => r.rewardId === id))
      .map((id) => ({
        rewardId: id,
        title: rewardLabels[id] ?? t('calendar.filter.rewardUnknown'),
        icon: null as string | null,
      })),
  ];

  const needle = search.trim().toLocaleLowerCase();
  const shownPractices = needle
    ? allPractices.filter((p) => p.title.toLocaleLowerCase().includes(needle))
    : allPractices;

  const toggleSection = (section: Exclude<OpenSection, null>) => {
    Haptics.selectionAsync().catch(() => {});
    setOpen((current) => (current === section ? null : section));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { paddingBottom: lift }]} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <ScrollView
            // The keyboard eats from the same budget: without subtracting it the
            // list keeps its full height, the sheet grows past the top of the
            // screen and the footer walks off the bottom.
            style={{ maxHeight: Math.min(height * 0.72, height - 200 - lift) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mood — five fixed options, so always open and label-free. */}
            <Text style={styles.sectionTitle}>{t('calendar.filter.moods')}</Text>
            <View style={styles.moodRow}>
              {MOOD_VALUES.map((value) => {
                const active = filter.moods.includes(value);
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      toggleMood(value);
                    }}
                    style={({ pressed }) => [
                      styles.moodBtn,
                      active && styles.moodBtnActive,
                      !active && styles.moodBtnIdle,
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(`mood.levels.${moodLevel(value).key}`)}
                  >
                    <MoodFace value={value} size={38} active />
                  </Pressable>
                );
              })}
            </View>

            {/* Mood tags — open-ended, so collapsed by default. */}
            <CollapsibleHeader
              title={t('calendar.filter.tags')}
              count={filter.tagIds.length}
              expanded={open === 'tags'}
              onPress={() => toggleSection('tags')}
              disabled={orderedTags.length === 0}
            />
            {open === 'tags' && orderedTags.length > 0 && (
              <View style={[styles.chipWrap, styles.expanded]}>
                {orderedTags.map((tag) => (
                  <Chip
                    key={tag.slug}
                    label={`${tag.emoji ? `${tag.emoji} ` : ''}${
                      locale === 'pt' ? tag.label_pt : tag.label_en
                    }`}
                    active={filter.tagIds.includes(tag.slug)}
                    onPress={() => toggleTag(tag.slug)}
                  />
                ))}
              </View>
            )}

            {/* Dimensions and their subs — a fixed tree, so always open. */}
            <Text style={styles.sectionTitle}>{t('calendar.filter.dimsAndSubs')}</Text>
            <View style={styles.dimTree}>
              {DIMENSION_ORDER.map((dim) => (
                <View key={dim} style={styles.dimRow}>
                  <Chip
                    style={styles.dimCell}
                    label={meta.dim(dim).label}
                    active={filter.dims.includes(dim)}
                    onPress={() => toggleDim(dim)}
                    leading={
                      <View style={[styles.dot, { backgroundColor: DIMENSION_META[dim].color }]} />
                    }
                  />
                  {SUBS_BY_DIM[dim].map((sub) => (
                    <Chip
                      key={sub}
                      style={styles.subCell}
                      label={meta.sub(sub).label}
                      active={filter.subs.includes(sub)}
                      onPress={() => toggleSub(sub)}
                      leading={
                        <Ionicons
                          name={SUB_META[sub].iconName as keyof typeof Ionicons.glyphMap}
                          size={12}
                          color={DIMENSION_META[dim].color}
                        />
                      }
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Practices — open-ended and personal, so collapsed and searchable. */}
            <CollapsibleHeader
              title={t('calendar.filter.practices')}
              count={filter.taskIds.length}
              expanded={open === 'practices'}
              onPress={() => toggleSection('practices')}
              disabled={allPractices.length === 0}
            />
            {open === 'practices' &&
              (allPractices.length === 0 ? (
                <Text style={styles.emptyText}>{t('calendar.filter.emptyPractices')}</Text>
              ) : (
                <>
                  <View style={[styles.searchBox, styles.expanded]}>
                    <Ionicons name="search" size={15} color={tokens.text.dim} />
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder={t('calendar.filter.searchPractices')}
                      placeholderTextColor={tokens.text.faint}
                      style={styles.searchInput}
                      autoCorrect={false}
                      returnKeyType="search"
                    />
                    {search.length > 0 && (
                      <Pressable onPress={() => setSearch('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={16} color={tokens.text.dim} />
                      </Pressable>
                    )}
                  </View>
                  {shownPractices.length === 0 ? (
                    <Text style={styles.emptyText}>{t('calendar.filter.noPracticeMatch')}</Text>
                  ) : (
                    <View style={styles.chipWrap}>
                      {shownPractices.map((practice) => (
                        <Chip
                          key={practice.taskId}
                          label={practice.title}
                          active={filter.taskIds.includes(practice.taskId)}
                          onPress={() => toggleTask(practice.taskId, practice.title)}
                          leading={
                            <View
                              style={[
                                styles.dot,
                                {
                                  backgroundColor: practice.dim
                                    ? DIMENSION_META[practice.dim].color
                                    : tokens.text.faint,
                                },
                              ]}
                            />
                          }
                        />
                      ))}
                    </View>
                  )}
                </>
              ))}

            <Text style={styles.sectionTitle}>{t('calendar.filter.minXp')}</Text>
            <View style={styles.stepperRow}>
              <StepButton
                icon="remove"
                disabled={atFloor}
                onPress={() => nudgeMinXp(-1)}
                label={xpLabel(stepMinXp(filter.minXp, -1))}
              />
              <Text style={styles.stepperValue}>{xpLabel(filter.minXp)}</Text>
              <StepButton
                icon="add"
                disabled={atCeiling}
                onPress={() => nudgeMinXp(1)}
                label={xpLabel(stepMinXp(filter.minXp, 1))}
              />
            </View>

            <CollapsibleHeader
              title={t('calendar.filter.rewards')}
              count={filter.rewardIds.length + (filter.withRedemption ? 1 : 0)}
              expanded={open === 'rewards'}
              onPress={() => toggleSection('rewards')}
              disabled={false}
            />
            {open === 'rewards' && (
              <View style={[styles.chipWrap, styles.expanded]}>
                <Chip
                  label={t('calendar.filter.withRedemption')}
                  active={filter.withRedemption}
                  onPress={toggleWithRedemption}
                  leading={<View style={[styles.dot, { backgroundColor: tokens.semantic.coin }]} />}
                />
                {allRewards.map((reward) => (
                  <Chip
                    key={reward.rewardId}
                    label={reward.title}
                    active={filter.rewardIds.includes(reward.rewardId)}
                    onPress={() => toggleReward(reward.rewardId, reward.title)}
                    leading={
                      <Ionicons
                        name={(reward.icon ?? 'gift') as keyof typeof Ionicons.glyphMap}
                        size={12}
                        color={tokens.semantic.coin}
                      />
                    }
                  />
                ))}
              </View>
            )}

            <Text style={styles.explain}>{t('calendar.filter.explain')}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                clearFilter();
                setSearch('');
              }}
              style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={t('calendar.filter.clear')}
            >
              <Text style={styles.clearText}>{t('calendar.filter.clear')}</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={t('calendar.filter.apply')}
            >
              <LinearGradient
                colors={tokens.gradient.completeBtn}
                locations={tokens.gradient.completeBtnLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyFill}
              >
                <Text style={styles.applyText}>
                  {facets > 0
                    ? t('calendar.filter.applyCount', { count: facets })
                    : t('calendar.filter.apply')}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface CollapsibleHeaderProps {
  title: string;
  /** Selected values inside; shown as a badge so a collapsed section still speaks. */
  count: number;
  expanded: boolean;
  onPress: () => void;
  disabled: boolean;
}

function CollapsibleHeader({ title, count, expanded, onPress, disabled }: CollapsibleHeaderProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.collapsible, pressed && !disabled && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled }}
      accessibilityLabel={title}
    >
      <Text style={[styles.sectionTitle, styles.collapsibleTitle, disabled && styles.disabledText]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-forward'}
        size={16}
        color={disabled ? tokens.text.faint : tokens.brand.violet2}
      />
    </Pressable>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Disc or icon rendered before the label. */
  leading?: React.ReactNode;
  /** Layout override — the dimension tree sizes its cells by flex ratio. */
  style?: object;
}

function Chip({ label, active, onPress, leading, style }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        style,
        active && styles.chipActive,
        pressed && { opacity: 0.7 },
      ]}
      hitSlop={2}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {leading}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

interface StepButtonProps {
  icon: 'remove' | 'add';
  disabled: boolean;
  onPress: () => void;
  label: string;
}

function StepButton({ icon, disabled, onPress, label }: StepButtonProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepBtn,
        disabled && styles.stepBtnDisabled,
        pressed && !disabled && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={disabled ? tokens.text.faint : tokens.brand.violet2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: tokens.space[4],
    paddingBottom: tokens.space[6],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
    marginBottom: tokens.space[3],
  },
  sectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    marginTop: tokens.space[4],
    marginBottom: tokens.space[2],
  },
  // A real surface, not a bare line of text: as plain type with a chevron these
  // read as headings rather than as controls, and the sections behind them went
  // unnoticed. Same fill and border as a chip, so "this is tappable" is stated
  // in the same visual language the rest of the sheet already uses.
  collapsible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    marginTop: tokens.space[4],
  },
  // The title inside the row carries no margin of its own — the row owns the
  // spacing now.
  collapsibleTitle: { flex: 1, marginTop: 0, marginBottom: 0 },
  disabledText: { color: tokens.text.faint },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.24)',
  },
  badgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    color: tokens.brand.violet2,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
  },
  moodBtnIdle: {
    borderColor: 'transparent',
    // Unselected faces stay legible but recede, so the row reads as a choice
    // rather than as five equally-lit buttons.
    opacity: 0.45,
  },
  moodBtnActive: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.14)',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  /** Breathing room under a collapsible row when its body is showing. */
  expanded: { marginTop: tokens.space[2] },
  dimTree: { gap: 6 },
  dimRow: { flexDirection: 'row', gap: 6 },
  // Flex ratios, not wrapping: this is what pins the tree to exactly six rows
  // on every width. The dimension cell gets more room because its labels are
  // the longest ("Prosperidade").
  //
  // Tighter horizontal padding than a free-standing chip, because the row's
  // width is fixed and every dp spent on padding comes off the label. On a
  // 320dp phone a sub cell still only has ~52dp of text, so the longest labels
  // ellipsize — an accepted trade for the six-row guarantee, and the icon plus
  // the parent dimension's colour carry the identity when the word is cut.
  dimCell: { flex: 1.25, minWidth: 0, paddingHorizontal: 8, gap: 5 },
  subCell: { flex: 1, minWidth: 0, paddingHorizontal: 8, gap: 5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  chipActive: {
    backgroundColor: 'rgba(123, 92, 255, 0.2)',
    borderColor: tokens.brand.violet2,
  },
  chipLabel: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  chipLabelActive: { color: tokens.brand.violet2 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    marginBottom: tokens.space[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.hi,
    padding: 0,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.faint,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepperValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
    minWidth: 110,
    textAlign: 'center',
  },
  explain: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    color: tokens.text.dim,
    marginTop: tokens.space[4],
  },
  footer: { flexDirection: 'row', gap: 10, marginTop: tokens.space[4] },
  clearBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  clearText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  applyBtn: { flex: 2, borderRadius: 13, overflow: 'hidden' },
  applyFill: { alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  applyText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
