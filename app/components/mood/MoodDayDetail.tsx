import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { MoodActionsRow } from '@/components/mood/MoodActionsRow';
import { MoodEntrySummary } from '@/components/mood/MoodEntrySummary';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { dateKeyFromLocal } from '@/lib/api/history';
import { useLogMood, useMoodForDay } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { type MoodValue } from '@/lib/mood';
import { tokens } from '@/theme';

interface Props {
  /** Local YYYY-MM-DD to show/edit the mood for. */
  dateKey: string;
}

/**
 * One day's mood — shared by the Home (any day but today, which gets
 * MoodHubStrip) and the calendar's day panel.
 *
 * Same doors as the Home's today strip, so a past day is as easy to log
 * as today:
 *   - no entry: the question, five faces — one tap logs THIS day, retroactive
 *     when it is past — and the buttons into the full check-in for it;
 *   - entry: the read-back (MoodEntrySummary) and the same buttons to add or
 *     edit the tags and the note.
 * The buttons are MoodActionsRow: the check-in door and, when the owner
 * switched it on, the Claude door beside it — scoped to this date.
 * The empty state used to be a sentence and a 12px "Registrar humor" link in
 * the corner, which is exactly what the owner could not find.
 */
export function MoodDayDetail({ dateKey }: Props) {
  const { t } = useT();
  const router = useRouter();
  const day = useMoodForDay(dateKey);
  const logMood = useLogMood();

  // "Unknown" must never render as "not logged". Until the read succeeds,
  // `day.data` is undefined for THREE different reasons — still loading,
  // failed, and genuinely empty — and only the third may show the faces: a
  // quick log over a day whose entry we simply have not read yet would change
  // its mood behind his back.
  if (!day.isSuccess) return null;

  const entry = day.data ?? null;
  const isToday = dateKey === dateKeyFromLocal(new Date());

  const open = () =>
    router.push({ pathname: '/mood-checkin', params: { date: dateKey } });

  if (!entry) {
    const quickLog = (v: MoodValue) => {
      if (logMood.isPending) return;
      logMood.mutate(
        { mood: v, loggedFor: dateKey },
        {
          onSuccess: () => {
            // Haptic only once the RPC actually landed — a premature success
            // signal on a failed save would gaslight the user.
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
          onError: (err) => {
            Alert.alert(t('mood.saveError'), (err as { message?: string }).message ?? '');
          },
        },
      );
    };
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('mood.day.eyebrow')}</Text>
        <Text style={styles.question}>
          {isToday ? t('mood.todayCard.promptTitle') : t('mood.questionPast')}
        </Text>
        <View style={[logMood.isPending && { opacity: 0.5 }]}>
          <MoodFaceRow value={null} onSelect={quickLog} size="sm" showLabels={false} />
        </View>
        <MoodActionsRow
          icon="create-outline"
          label={t('mood.cta.full')}
          onPress={open}
          dateKey={dateKey}
        />
      </View>
    );
  }

  const hasDetails =
    (entry.tags?.length ?? 0) > 0 || (entry.note?.trim().length ?? 0) > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{t('mood.day.eyebrow')}</Text>
      <MoodEntrySummary entry={entry} />
      <MoodActionsRow
        icon={hasDetails ? 'create-outline' : 'add-circle-outline'}
        label={hasDetails ? t('mood.cta.editTagsNote') : t('mood.cta.addTagsNote')}
        onPress={open}
        dateKey={dateKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[3],
    gap: tokens.space[3],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  question: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
    marginTop: -tokens.space[1],
  },
});
