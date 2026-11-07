import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { MoodCardHeader } from '@/components/mood/MoodCardHeader';
import { MoodEntrySummary } from '@/components/mood/MoodEntrySummary';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { useLogMood, useTodayMood } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { type MoodValue } from '@/lib/mood';
import { tokens } from '@/theme';

/**
 * Journal entry point ON the Today Hub — "marcar e ver onde o dia acontece".
 *
 * Two ways in, and neither may make the other more expensive:
 *   - QUICK: one tap on a face logs the day. Still one tap.
 *   - FULL: the "Preencher" / "Editar" chip in the header (MoodCardHeader)
 *     into the check-in screen, where the tags and the note live. It never
 *     disappears — before the log it offers the full check-in, after it
 *     offers the tags and the note. Beside it, for whoever switched it on,
 *     the AI chip — present in both states, because after a quick face tap
 *     it is how the note gets dictated (log_mood merges).
 *
 * Once logged, today reads back exactly like any other day (MoodEntrySummary:
 * face, level, tags, note). It used to collapse to "Hoje: bem", so the owner
 * had to step back a day to see what he had just dictated.
 *
 * Past days get the same header and body from MoodDayDetail.
 *
 * Deliberately quiet — no XP, no streak, matching the mood system's rule.
 *
 * The margins live on the outer wrapper, not on the card itself.
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
      <View style={styles.outer}>
        <View style={styles.card}>
          <MoodCardHeader
            eyebrow={t('mood.prompt.title')}
            action={t('mood.cta.fill')}
            a11yLabel={t('mood.cta.full')}
            onPress={openCheckin}
          />
          <View style={[logMood.isPending && { opacity: 0.5 }]}>
            <MoodFaceRow
              value={null}
              onSelect={quickLog}
              size="sm"
              showLabels={false}
            />
          </View>
        </View>
      </View>
    );
  }

  const hasDetails =
    (entry.tags?.length ?? 0) > 0 || (entry.note?.trim().length ?? 0) > 0;

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <MoodCardHeader
          eyebrow={t('mood.todayCard.eyebrow')}
          action={t('mood.cta.edit')}
          a11yLabel={hasDetails ? t('mood.cta.editTagsNote') : t('mood.cta.addTagsNote')}
          onPress={openCheckin}
        />
        <MoodEntrySummary entry={entry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
  },
  card: {
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    gap: tokens.space[3],
  },
});
