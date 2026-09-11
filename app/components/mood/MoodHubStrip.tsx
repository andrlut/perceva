import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { MoodFace } from '@/components/mood/MoodFace';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { useLogMood, useTodayMood } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { moodLevel, type MoodValue } from '@/lib/mood';
import { tokens } from '@/theme';

/**
 * Journal entry point ON the Today Hub — "marcar e ver onde o dia acontece".
 *
 * Two ways in, and neither may make the other more expensive:
 *   - QUICK: one tap on a face logs the day. Still one tap.
 *   - FULL: a real, labelled, full-width button to the check-in screen,
 *     where the tags and the note live. It never disappears — before the
 *     log it offers the full check-in, after it offers tags and a note.
 *
 * Why the button: the full path used to be a 12px text link in the header
 * (a ~32dp target) and, once logged, a chevron plus a 12px nudge. The face
 * row vanishing on log read as "it closed on me", and the only door left to
 * the tags and note was that small text — which, as the last card on Home,
 * also sat under the floating buttons.
 *
 * Deliberately quiet — no XP, no streak, matching the mood system's rule.
 */
export function MoodHubStrip() {
  const { t } = useT();
  const router = useRouter();
  const today = useTodayMood();
  const logMood = useLogMood();

  // Render only on a SUCCESSFUL fetch: while loading there's nothing to show,
  // and in the error state "no data" does NOT mean "no entry" — showing the
  // quick-log row there would offer to log a day that may already be logged.
  // (One tap there used to wipe that day's note and tags; log_mood now keeps
  // them on a mood-only call, so this guard is defense in depth.)
  if (!today.isSuccess) return null;

  const entry = today.data ?? null;
  const openCheckin = () => router.push('/mood-checkin');

  if (!entry) {
    const quickLog = (v: MoodValue) => {
      if (logMood.isPending) return;
      logMood.mutate(
        { mood: v },
        {
          onSuccess: () => {
            // Haptic only once the RPC actually landed — a premature success
            // signal on a failed save would gaslight the user.
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          },
          onError: (err) => {
            Alert.alert(
              t('mood.saveError'),
              (err as { message?: string }).message ?? '',
            );
          },
        },
      );
    };
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('mood.prompt.title')}</Text>
        <View style={[logMood.isPending && { opacity: 0.5 }]}>
          <MoodFaceRow
            value={null}
            onSelect={quickLog}
            size="sm"
            showLabels={false}
          />
        </View>
        <FullCheckinButton
          icon="create-outline"
          label={t('mood.cta.full')}
          onPress={openCheckin}
        />
      </View>
    );
  }

  const level = moodLevel(entry.mood);
  const hasDetails =
    (entry.tags?.length ?? 0) > 0 || (entry.note?.trim().length ?? 0) > 0;

  // Plain View, not a Pressable: with a real button inside, a pressable
  // container with its own accessibilityLabel would flatten the button away
  // from TalkBack. Here the row is read as text and the button as a button.
  return (
    <View style={styles.card}>
      <View style={styles.loggedRow}>
        <MoodFace value={level.value} size={38} active />
        <View style={styles.loggedBody}>
          <Text style={styles.eyebrow}>{t('mood.todayCard.eyebrow')}</Text>
          <Text style={styles.loggedValue} numberOfLines={1}>
            {t('mood.todayCard.loggedPrefix')}{' '}
            <Text style={styles.loggedStrong}>
              {t(`mood.levels.${level.key}`).toLowerCase()}
            </Text>
          </Text>
        </View>
      </View>
      <FullCheckinButton
        icon={hasDetails ? 'create-outline' : 'add-circle-outline'}
        label={hasDetails ? t('mood.cta.editTagsNote') : t('mood.cta.addTagsNote')}
        onPress={openCheckin}
      />
    </View>
  );
}

/**
 * The way into the full check-in. Full width and 52dp tall on purpose: even
 * while the card scrolls past the floating stack on the right, most of the
 * button stays clear of it — and the Home scroll now reserves the stack's
 * height, so at the end of the list the whole card sits above it.
 */
function FullCheckinButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fullBtn, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={tokens.brand.violet2} />
      <Text style={styles.fullBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    gap: tokens.space[3],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  loggedBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  loggedValue: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.base,
  },
  loggedStrong: {
    fontFamily: 'Manrope_800ExtraBold',
    color: tokens.text.hi,
  },
  // Tinted surface + strong rim + violet label. violet2 on surface2 measures
  // 4.60:1 in the dark theme and 5.81:1 in the light one — both clear AA for
  // 14px text. A FILLED violet button was ruled out: brand.violet measures
  // 4.36:1 with white in the dark theme.
  fullBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.surface2,
  },
  fullBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.2,
    color: tokens.brand.violet2,
  },
});
