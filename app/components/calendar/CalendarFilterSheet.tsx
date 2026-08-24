import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { MoodFace } from '@/components/mood/MoodFace';
import { useMoodTags } from '@/lib/api/mood';
import { activeFacetCount, MIN_XP_MAX, stepMinXp } from '@/lib/calendar/filters';
import { useCalendarStore } from '@/lib/calendar/store';
import type { DimensionId, MoodTag, SubId } from '@/lib/db/types';
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
 * what the facet did before committing to it. "Aplicar" therefore only closes;
 * it exists because a sheet with no primary action reads unfinished, and
 * because it is the affordance people reach for to get back to the month.
 * That is a decision, not an omission — do not add a staged copy of the filter.
 */

const MOOD_VALUES: MoodValue[] = [1, 2, 3, 4, 5];

const ALL_SUBS: { sub: SubId; dim: DimensionId }[] = DIMENSION_ORDER.flatMap((dim) =>
  SUBS_BY_DIM[dim].map((sub) => ({ sub, dim })),
);

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Praticas que aparecem no periodo visivel, ja ordenadas por contagem desc. */
  practices: { taskId: string; title: string; count: number }[];
}

export function CalendarFilterSheet({ visible, onClose, practices }: Props) {
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
  const clearFilter = useCalendarStore((s) => s.clearFilter);

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{t('calendar.filter.title')}</Text>

          <ScrollView
            // 72% of the screen, minus the sheet chrome (handle + title +
            // footer ≈ 200) so the Aplicar row never gets pushed off a short
            // device. On tall phones the 72% ceiling is the one that binds.
            style={{ maxHeight: Math.min(height * 0.72, height - 200) }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            <Section title={t('calendar.filter.moods')}>
              <View style={styles.chipWrap}>
                {MOOD_VALUES.map((value) => {
                  const active = filter.moods.includes(value);
                  const label = t(`mood.levels.${moodLevel(value).key}`);
                  return (
                    <Chip
                      key={value}
                      label={label}
                      active={active}
                      onPress={() => toggleMood(value)}
                      leading={<MoodFace value={value} size={16} active />}
                    />
                  );
                })}
              </View>
            </Section>

            <Section title={t('calendar.filter.practices')}>
              {practices.length === 0 ? (
                <Text style={styles.emptyText}>{t('calendar.filter.emptyPractices')}</Text>
              ) : (
                <View style={styles.chipWrap}>
                  {practices.map((practice) => (
                    <Chip
                      key={practice.taskId}
                      label={`${practice.title} · ${practice.count}`}
                      active={filter.taskIds.includes(practice.taskId)}
                      onPress={() => toggleTask(practice.taskId)}
                    />
                  ))}
                </View>
              )}
            </Section>

            <Section title={t('calendar.filter.dims')}>
              <View style={styles.chipWrap}>
                {DIMENSION_ORDER.map((dim) => (
                  <Chip
                    key={dim}
                    label={meta.dim(dim).label}
                    active={filter.dims.includes(dim)}
                    onPress={() => toggleDim(dim)}
                    leading={
                      <View style={[styles.disc, { backgroundColor: DIMENSION_META[dim].color }]} />
                    }
                  />
                ))}
              </View>
            </Section>

            <Section title={t('calendar.filter.subs')}>
              <View style={styles.chipWrap}>
                {ALL_SUBS.map(({ sub, dim }) => (
                  <Chip
                    key={sub}
                    label={meta.sub(sub).label}
                    active={filter.subs.includes(sub)}
                    onPress={() => toggleSub(sub)}
                    leading={
                      <Ionicons
                        name={SUB_META[sub].iconName as keyof typeof Ionicons.glyphMap}
                        size={13}
                        color={DIMENSION_META[dim].color}
                      />
                    }
                  />
                ))}
              </View>
            </Section>

            {orderedTags.length > 0 && (
              <Section title={t('calendar.filter.tags')}>
                <View style={styles.chipWrap}>
                  {orderedTags.map((tag) => {
                    const label = locale === 'pt' ? tag.label_pt : tag.label_en;
                    return (
                      <Chip
                        key={tag.slug}
                        label={tag.emoji ? `${tag.emoji} ${label}` : label}
                        active={filter.tagIds.includes(tag.slug)}
                        onPress={() => toggleTag(tag.slug)}
                      />
                    );
                  })}
                </View>
              </Section>
            )}

            <Section title={t('calendar.filter.minXp')}>
              <View style={styles.stepper}>
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
            </Section>

            <Section title={t('calendar.filter.rewards')}>
              <View style={styles.chipWrap}>
                <Chip
                  label={t('calendar.filter.withRedemption')}
                  active={filter.withRedemption}
                  onPress={toggleWithRedemption}
                  leading={
                    <View style={[styles.disc, { backgroundColor: tokens.semantic.coin }]} />
                  }
                />
              </View>
            </Section>

            <Text style={styles.explain}>{t('calendar.filter.explain')}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                clearFilter();
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

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Disc, icon or face rendered before the label. */
  leading?: React.ReactNode;
}

function Chip({ label, active, onPress, leading }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.7 },
      ]}
      hitSlop={2}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {leading}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
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
      <Ionicons
        name={icon}
        size={16}
        color={disabled ? tokens.text.faint : tokens.brand.violet2}
      />
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
  sheetTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
    marginBottom: tokens.space[3],
  },
  scrollBody: {
    gap: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  section: {
    gap: tokens.space[2],
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
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
    backgroundColor: 'rgba(123,92,255,0.2)',
    borderColor: tokens.brand.violet2,
  },
  chipLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  chipLabelActive: {
    color: tokens.brand.violet2,
  },
  disc: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.faint,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  explain: {
    fontFamily: 'Manrope_500Medium',
    fontStyle: 'italic',
    fontSize: 11,
    lineHeight: 16,
    color: tokens.text.dim,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    marginTop: tokens.space[4],
  },
  clearBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.base,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  clearText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  applyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
