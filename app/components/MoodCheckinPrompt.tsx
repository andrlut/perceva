import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MoodFace } from '@/components/mood/MoodFace';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { todayDateKey, useLogMood, useTodayMood } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { moodLevel, type MoodValue } from '@/lib/mood';
import { useLoadedSettings } from '@/lib/settings';
import { useSheetBottomInset } from '@/components/useSheetBottomInset';
import { tokens } from '@/theme';

/** AsyncStorage day-stamp — "already shown/dismissed the prompt today". */
const PROMPT_SHOWN_KEY = '@perceva/mood_prompt_shown';
// The earliest hour is the user's own `dayEnd` setting (default 21:00) — the
// same value that schedules the nightly push, because they are one felt
// event. It used to be a hardcoded 17:00, which read as far too early.

interface Props {
  /** Suppress while a tour or other overlay owns the screen. */
  enabled?: boolean;
}

/**
 * Gentle once-per-day app-open prompt: "Como foi seu dia?" mounted on the
 * Today Hub. Shows at most once a day, only in the evening, only when the day
 * isn't logged yet and the setting is on. No streak, no guilt.
 *
 * A face tap logs the day — and the sheet STAYS, turning into an invitation
 * ("Anotado. Quer contar mais?") with a real button to the full check-in.
 * It used to log and close in the same tick, which is exactly what the
 * owner read as "it closes as soon as I pick a face": the tags and the note
 * were behind a 13px link that vanished with the sheet.
 */
export function MoodCheckinPrompt({ enabled = true }: Props) {
  const { t } = useT();
  const sheetBottom = useSheetBottomInset();
  const router = useRouter();
  const settings = useLoadedSettings();
  const today = useTodayMood();
  const logMood = useLogMood();
  const [visible, setVisible] = useState(false);
  // The value that LANDED — set only in onSuccess, never optimistically.
  const [justLogged, setJustLogged] = useState<MoodValue | null>(null);
  // Pulled out so the effect depends on the stable function, not the whole
  // query object — calling `today.refetch()` inside would make `today` itself
  // a dependency and re-run the effect on every query state change.
  const refetchToday = today.refetch;

  useEffect(() => {
    if (!enabled) return;
    if (!settings.moodCheckinPrompt) return;
    // BOTH guards are required. Only a SUCCESSFUL fetch can say "no entry
    // yet": in the error state `data` is undefined too, and the old
    // `isLoading` check let the sheet open over an already-logged day. One
    // tap there used to upsert {note: null, tags: null} and wipe the day's
    // journal; log_mood now keeps the note and tags on a mood-only call
    // (migration log_mood_quick_log_keeps_journal), so these guards are
    // defense in depth — and asking "how was your day" about a day already
    // answered is wrong on its own.
    if (!today.isSuccess) return;
    if (today.data) return; // already logged today
    const now = new Date();
    if (
      now.getHours() * 60 + now.getMinutes() <
      settings.dayEndHour * 60 + settings.dayEndMinute
    ) {
      return;
    }

    let active = true;
    (async () => {
      const shown = await AsyncStorage.getItem(PROMPT_SHOWN_KEY);
      if (!active || shown === todayDateKey()) return;
      // The cached "no entry" can be hours old: this client does not refetch
      // on app foreground, and the day may have been logged since — by voice
      // through the MCP, or on another device. Opening over it would ask about
      // a day already answered (and, before log_mood learned to keep the
      // journal on a mood-only call, one tap there wiped that note). Re-read
      // before opening, and trust only the fresh answer.
      const fresh = await refetchToday();
      if (!active || !fresh.isSuccess || fresh.data) return;
      // Home can stay mounted overnight; yesterday's confirmation must not
      // greet a new day.
      setJustLogged(null);
      setVisible(true);
    })();
    return () => {
      active = false;
    };
  }, [
    enabled,
    settings.moodCheckinPrompt,
    settings.dayEndHour,
    settings.dayEndMinute,
    today.isSuccess,
    today.data,
    refetchToday,
  ]);

  const stamp = () =>
    AsyncStorage.setItem(PROMPT_SHOWN_KEY, todayDateKey()).catch(() => {});

  const close = () => {
    setVisible(false);
    // Mid-save, the stamp belongs to onSuccess: if the save then fails, the
    // day stays unstamped and tonight's prompt can come back.
    if (!logMood.isPending) void stamp();
  };

  const handleSelect = (v: MoodValue) => {
    // Re-entrancy: the sheet now stays open while the RPC is in flight.
    if (logMood.isPending || justLogged !== null) return;
    logMood.mutate(
      { mood: v },
      {
        onSuccess: () => {
          // Haptic and confirmation only once the save LANDED. The old code
          // vibrated "success" synchronously and closed with no onError, so
          // a failed save felt like a successful one and simply vanished.
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          void stamp();
          setJustLogged(v);
          // The face row that held TalkBack focus is swapped out in place;
          // say what happened, or a screen-reader user only gets the haptic.
          const logged = moodLevel(v);
          AccessibilityInfo.announceForAccessibility(
            `${t('mood.prompt.savedTitle')} ${t('mood.prompt.savedBody', {
              level: t(`mood.levels.${logged.key}`).toLowerCase(),
            })}`,
          );
        },
        onError: (err) => {
          // Failed = the sheet stays on the faces and does NOT stamp the day.
          Alert.alert(
            t('mood.saveError'),
            (err as { message?: string }).message ?? '',
          );
        },
      },
    );
  };

  const openFull = () => {
    setVisible(false);
    void stamp();
    router.push('/mood-checkin');
  };

  if (!visible) return null;

  const level = justLogged !== null ? moodLevel(justLogged) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.scrim} onPress={close}>
        <Pressable
          style={[styles.sheet, { paddingBottom: sheetBottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          {level === null ? (
            <>
              <Text style={styles.title}>{t('mood.prompt.title')}</Text>
              <Text style={styles.subtitle}>{t('mood.subtitle')}</Text>

              <View
                style={[styles.facesWrap, logMood.isPending && { opacity: 0.5 }]}
              >
                <MoodFaceRow
                  value={null}
                  onSelect={handleSelect}
                  size="md"
                  showLabels={false}
                />
              </View>

              <Pressable
                onPress={openFull}
                style={({ pressed }) => [styles.fullBtn, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel={t('mood.cta.full')}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={tokens.brand.violet2}
                />
                <Text style={styles.fullBtnText}>{t('mood.cta.full')}</Text>
              </Pressable>

              <Pressable
                onPress={close}
                style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={styles.ghostText}>{t('mood.prompt.notNow')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* The face row is GONE here on purpose: leaving it live would let
                  a second tap re-send {mood} with a null note and tags. */}
              <View style={styles.savedFace}>
                <MoodFace value={level.value} size={56} active />
              </View>
              <Text style={styles.title}>{t('mood.prompt.savedTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('mood.prompt.savedBody', {
                  level: t(`mood.levels.${level.key}`).toLowerCase(),
                })}
              </Text>

              {/* Primary, painted in the logged level: the mood colors are
                  theme-invariant and `level.ink` is the measured ink for each
                  fill (4.9–14.9:1), so this is the one fill that passes in
                  both themes — the same pairing as the check-in Save button. */}
              <Pressable
                onPress={openFull}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: level.color },
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('mood.cta.addTagsNote')}
              >
                <Ionicons name="add-circle-outline" size={19} color={level.ink} />
                <Text style={[styles.primaryBtnText, { color: level.ink }]}>
                  {t('mood.cta.addTagsNote')}
                </Text>
              </Pressable>

              <Pressable
                onPress={close}
                style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={styles.ghostText}>{t('mood.prompt.done')}</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.reassure}>{t('mood.noScore')}</Text>
        </Pressable>
      </Pressable>
    </Modal>
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
    gap: tokens.space[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    ...tokens.type.h2,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    marginTop: -4,
  },
  facesWrap: {
    paddingVertical: tokens.space[3],
  },
  savedFace: {
    alignSelf: 'center',
    paddingTop: tokens.space[2],
  },
  // Same secondary button as the Home strip, so both doors read as one.
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
  primaryBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    marginTop: tokens.space[1],
  },
  primaryBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  ghostBtn: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
  },
  // text.mid, not text.dim: dim on bg.surface measures 3.57:1 dark and 2.55:1
  // light — and "Pronto" is the only explicit way out of the saved state.
  ghostText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },
  reassure: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.faint,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
