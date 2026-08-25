import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DayPickerModal } from '@/components/week/DayPickerModal';
import {
  GOLD_BADGE_BG,
  GOLD_BORDER_DONE,
  GOLD_TINT_BG,
  GOLD_TINT_BG_DONE,
} from '@/components/week/gold';
import type { WeekBig } from '@/lib/api/week';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { weekdayShortByIndex } from '@/lib/time';
import { tokens } from '@/theme';

/**
 * One of the three "As 3 da Semana" slots. Empty = a dashed invitation that
 * opens the PICKER (bigs are CHOSEN from the pool/week, never typed here —
 * owner's call). Filled = the big + its sub-steps as a strikeable sublist
 * ("primeiro passo" grew into real steps). Long-press opens a small menu:
 * demote to regular item, or delete.
 */
export function BigSlot({
  slot,
  big,
  onPick,
  onToggleDone,
  onSetDay,
  onToggleStep,
  onAddStep,
  onDeleteStep,
  onOpen,
}: {
  slot: 1 | 2 | 3;
  big: WeekBig | undefined;
  onPick: (slot: 1 | 2 | 3) => void;
  onToggleDone: (item: WeekItem) => void;
  onSetDay: (item: WeekItem, day: number | null) => void;
  onToggleStep: (step: WeekItem) => void;
  onAddStep: (parent: WeekItem, title: string) => void;
  onDeleteStep: (step: WeekItem) => void;
  /** Opens the central item manager (rename / move / demote / delete). */
  onOpen: (item: WeekItem) => void;
}) {
  const { t, locale } = useT();
  const [addingStep, setAddingStep] = useState(false);
  const [stepDraft, setStepDraft] = useState('');
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  // ── Empty slot: invitation to pick ────────────────────────────────────────
  if (!big) {
    return (
      <Pressable
        onPress={() => onPick(slot)}
        style={({ pressed }) => [
          styles.card,
          styles.cardEmpty,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('week.emptySlot', { n: slot })}
      >
        <View style={styles.headerRow}>
          <View style={[styles.num, styles.numEmpty]}>
            <Text style={styles.numTextEmpty}>{slot}</Text>
          </View>
          <Text style={styles.emptyText}>{t('week.emptySlot', { n: slot })}</Text>
          <Ionicons name="add" size={16} color={tokens.text.faint} />
        </View>
      </Pressable>
    );
  }

  const item = big.item;
  const done = item.done_at != null;

  const submitStep = () => {
    const title = stepDraft.trim();
    setStepDraft('');
    setAddingStep(false);
    if (title) onAddStep(item, title);
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleDone(item);
  };

  // ── Filled slot: badge marks done, the TEXT opens the item manager ────────
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={({ pressed }) => [
            styles.num,
            done && styles.numDone,
            pressed && styles.pressed,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={item.title}
        >
          {done ? (
            <Ionicons name="checkmark" size={11} color={tokens.bg.deep} />
          ) : (
            <Text style={styles.numText}>{slot}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => onOpen(item)}
          onLongPress={() => onOpen(item)}
          style={({ pressed }) => [styles.headerMain, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('week.editor.openA11y', { title: item.title })}
        >
          <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
            {item.title}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDayPickerOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('week.dayChipA11y')}
          style={({ pressed }) => [
            styles.dayChip,
            item.day == null && styles.dayChipEmpty,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.dayChipText,
              item.day == null && styles.dayChipTextEmpty,
            ]}
          >
            {item.day == null ? '—' : weekdayShortByIndex(item.day, locale)}
          </Text>
        </Pressable>
      </View>
      <DayPickerModal
        visible={dayPickerOpen}
        day={item.day}
        onSelect={(d) => onSetDay(item, d)}
        onClose={() => setDayPickerOpen(false)}
      />

      {/* ── Steps sublist ── */}
      {(big.steps.length > 0 || !done) && (
        <View style={styles.steps}>
          {big.steps.map((step) => {
            const stepDone = step.done_at != null;
            return (
              <Pressable
                key={step.id}
                onPress={() => onToggleStep(step)}
                onLongPress={() => onDeleteStep(step)}
                style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: stepDone }}
                accessibilityLabel={step.title}
              >
                <View style={[styles.stepBox, stepDone && styles.stepBoxDone]}>
                  {stepDone && (
                    <Ionicons name="checkmark" size={9} color={tokens.text.hi} />
                  )}
                </View>
                <Text
                  style={[styles.stepText, stepDone && styles.stepTextDone]}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
              </Pressable>
            );
          })}

          {/* Legacy "primeira ação" text from before steps existed. */}
          {big.steps.length === 0 && !!item.first_action && (
            <Text style={styles.legacyFirstAction} numberOfLines={2}>
              {item.first_action}
            </Text>
          )}

          {!done &&
            (addingStep ? (
              <View style={styles.stepRow}>
                <View style={styles.stepBox} />
                <TextInput
                  style={styles.stepInput}
                  value={stepDraft}
                  onChangeText={setStepDraft}
                  placeholder={t('week.steps.placeholder')}
                  placeholderTextColor={tokens.text.faint}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submitStep}
                  onBlur={submitStep}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setAddingStep(true)}
                style={({ pressed }) => [styles.addStep, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('week.steps.add')}
              >
                <Text style={styles.addStepText}>{t('week.steps.add')}</Text>
              </Pressable>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  cardEmpty: {
    borderStyle: 'dashed',
    borderColor: tokens.border.strong,
    backgroundColor: 'transparent',
  },
  cardDone: {
    borderColor: GOLD_BORDER_DONE,
    backgroundColor: GOLD_TINT_BG_DONE,
  },
  pressed: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  dayChip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.4)',
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  },
  dayChipEmpty: {
    borderColor: tokens.border.base,
    backgroundColor: 'transparent',
  },
  dayChipText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: tokens.brand.violet2,
  },
  dayChipTextEmpty: {
    color: tokens.text.dim,
  },
  num: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numDone: {
    backgroundColor: tokens.semantic.coin,
  },
  numEmpty: {
    backgroundColor: tokens.bg.surface2,
  },
  numText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 11,
    color: tokens.semantic.coinLight,
  },
  numTextEmpty: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 11,
    color: tokens.text.faint,
  },
  title: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.hi,
  },
  titleDone: {
    color: tokens.text.dim,
    textDecorationLine: 'line-through',
    fontFamily: tokens.font.family,
  },
  emptyText: {
    flex: 1,
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.faint,
  },
  steps: {
    marginTop: tokens.space[2],
    marginLeft: 20 + tokens.space[3],
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  stepBox: {
    width: 15,
    height: 15,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBoxDone: {
    borderColor: tokens.brand.violet,
    backgroundColor: tokens.brand.violetDeep,
  },
  stepText: {
    flex: 1,
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.base,
  },
  stepTextDone: {
    color: tokens.text.dim,
    textDecorationLine: 'line-through',
  },
  stepInput: {
    flex: 1,
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.hi,
    padding: 0,
  },
  legacyFirstAction: {
    fontFamily: tokens.font.family,
    fontSize: 12,
    fontStyle: 'italic',
    color: tokens.text.mid,
  },
  addStep: {
    paddingVertical: 2,
  },
  addStepText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    color: tokens.text.dim,
    letterSpacing: 0.3,
  },
});
