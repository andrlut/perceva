import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { Fragment, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavClearance } from '@/components/BottomNavBar';
import { useCharacter } from '@/lib/api/character';
import { useSession } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { MODULE_REGISTRY, useModules, useSetModule } from '@/lib/modules';
import {
  useLoadedSettings,
  useSettingsStore,
  type LanguageCode,
  type ThemeMode,
  type WeekStart,
} from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { ACTIVE_THEME, resolveThemePref } from '@/theme/activeTheme';
import { reloadForTheme } from '@/theme/useThemeSystemSync';

import { PremiumBadge } from '@/components/PremiumBadge';
import { TimePickerSheet } from '@/components/TimePickerSheet';
import { UsernameEditModal } from '@/components/UsernameEditModal';
import { formatClock } from '@/lib/time';

export default function SettingsScreen() {
  const router = useRouter();
  const character = useCharacter();
  const session = useSession();
  const settings = useLoadedSettings();
  const setSetting = useSettingsStore((s) => s.set);
  const setSettings = useSettingsStore((s) => s.setMany);
  const modules = useModules();
  const setModule = useSetModule();
  const { t, locale } = useT();

  const profile = character.data?.profile;
  const email = session.user?.email ?? '—';
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [timeSheet, setTimeSheet] = useState<'brief' | 'dayEnd' | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const bottomClearance = useBottomNavClearance();

  // A DAILY trigger whose time already passed today silently waits until
  // tomorrow. Computed at render — which is exactly when it matters, right
  // after a save re-renders this screen.
  //
  // Both flags require the master switch: the note is about the PUSH. The
  // in-app mood prompt is NOT gated by that switch and fires the same day as
  // soon as the hour passes, so "starts tomorrow" would be wrong about it.
  // Each note renders under its own row — one shared note under the last row
  // would attribute a mood-triggered warning to the Daily Brief.
  const nowMinutes = (() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  })();
  const dayEndPassedToday =
    settings.notificationsEnabled &&
    settings.moodCheckinPrompt &&
    settings.dayEndHour * 60 + settings.dayEndMinute < nowMinutes;
  const briefPassedToday =
    settings.notificationsEnabled &&
    settings.dailyReminder &&
    settings.briefHour * 60 + settings.briefMinute < nowMinutes;

  const handleSignOut = async () => {
    const ok = await confirmAction(
      t('profile.actions.confirmSignOut'),
      t('profile.actions.confirmSignOutBody'),
      {
        okText: t('profile.actions.signOut'),
        cancelText: t('common.cancel'),
        destructive: true,
      },
    );
    if (!ok) return;
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmAction(
      t('profile.actions.confirmDelete'),
      t('profile.actions.confirmDeleteBody'),
      {
        okText: t('common.delete'),
        cancelText: t('common.cancel'),
        destructive: true,
      },
    );
    if (!ok) return;
    try {
      // Permanently deletes the auth user + cascades all personal data,
      // server-side (supabase/functions/delete-account). Then sign out so the
      // AuthGate drops the user back to login.
      const { error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });
      if (error) throw error;
      // The account is gone; the session is already invalid server-side, so
      // local signOut is best-effort (the AuthGate redirects to login either way).
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      showInfo(t('profile.actions.deleteFailTitle'), msg);
    }
  };

  const handleReplayOnboarding = () => {
    // Opens the per-module replay screen (M0…M6 + "Refazer tour
    // completo"). Each module's reset + navigation is handled there, so
    // this no longer wipes onboarding/tour state up front.
    router.push('/tour-replay');
  };

  const handleCheckForUpdate = async () => {
    if (isCheckingUpdate) return;
    if (__DEV__) {
      showInfo(t('profile.update.devMode'), t('profile.update.devModeBody'));
      return;
    }
    setIsCheckingUpdate(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        const ok = await confirmAction(
          t('profile.update.ready'),
          t('profile.update.readyBody'),
          {
            okText: t('profile.update.restart'),
            cancelText: t('profile.update.later'),
          },
        );
        if (ok) await Updates.reloadAsync();
      } else {
        showInfo(t('profile.update.upToDate'), t('profile.update.upToDateBody'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('profile.update.unknownError');
      showInfo(t('profile.update.couldNotCheck'), msg);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>{t('profile.title')}</Text>
          {profile?.subscription_tier === 'premium' && <PremiumBadge size="sm" />}
        </View>

        {/* ───── PERCEVA PREMIUM ───── */}
        <SectionHeader icon="sparkles-outline" label={t('premium.settingsRow')} />
        <Card>
          <ButtonRow
            icon="star-outline"
            label={t('premium.settingsRowSub')}
            onPress={() => router.push('/premium?source=settings')}
            chevron
          />
        </Card>

        {/* ───── ACCOUNT ───── */}
        <SectionHeader icon="person-outline" label={t('profile.sections.account')} />
        <Card>
          <InfoRow label={t('profile.fields.email')} value={email} />
          <Divider />
          <ButtonRow
            icon="at-outline"
            label={t('profile.fields.username')}
            value={profile?.display_name ?? '—'}
            onPress={() => setUsernameOpen(true)}
            chevron
          />
          <Divider />
          <ButtonRow
            icon="log-out-outline"
            label={t('profile.actions.signOut')}
            onPress={handleSignOut}
            danger
          />
          <Divider />
          <ButtonRow
            icon="trash-outline"
            label={t('profile.actions.deleteAccount')}
            onPress={handleDeleteAccount}
            danger
          />
        </Card>

        {/* ───── PREFERENCES ───── */}
        <SectionHeader icon="options-outline" label={t('profile.sections.preferences')} />
        <Card>
          <SegmentedRow<ThemeMode>
            label={t('profile.fields.theme')}
            value={settings.theme}
            options={[
              { value: 'light', label: t('profile.theme.light') },
              { value: 'dark', label: t('profile.theme.dark') },
              { value: 'system', label: t('profile.theme.system') },
            ]}
            onChange={async (v) => {
              // Persist FIRST — the reload boots a fresh JS context that
              // reads the stored pref, so racing it would lose the choice.
              await setSetting('theme', v);
              if (resolveThemePref(v) !== ACTIVE_THEME) reloadForTheme();
            }}
            note={t('profile.theme.note')}
          />
          <Divider />
          <SegmentedRow<LanguageCode>
            label={t('profile.fields.language')}
            value={settings.language}
            options={[
              { value: 'en', label: t('profile.language.english') },
              { value: 'pt', label: t('profile.language.portuguese') },
            ]}
            onChange={(v) => setSetting('language', v)}
          />
          <Divider />
          <SegmentedRow<WeekStart>
            label={t('profile.fields.weekStart')}
            value={settings.weekStart}
            options={[
              { value: 'sunday', label: t('profile.weekStart.sunday') },
              { value: 'monday', label: t('profile.weekStart.monday') },
            ]}
            onChange={(v) => setSetting('weekStart', v)}
          />
        </Card>

        {/* ───── MODULES ─────
            Per-user opt-in surfaces (profile.modules), mapped straight off
            MODULE_REGISTRY — declaring a module there is what puts its
            switch here. Off = invisibility, never deletion (the footnote
            promises exactly that). */}
        <SectionHeader icon="apps-outline" label={t('profile.sections.modules')} />
        <Card>
          {MODULE_REGISTRY.map((def, i) => (
            <Fragment key={def.key}>
              {i > 0 && <Divider />}
              <ToggleRow
                label={t(`profile.modules.${def.key}`)}
                description={t(`profile.modules.${def.key}Desc`)}
                value={modules[def.key]}
                onChange={(v) => setModule.mutate({ key: def.key, value: v })}
              />
            </Fragment>
          ))}
          <NoteText>{t('profile.modules.footnote')}</NoteText>
        </Card>

        {/* ───── NOTIFICATIONS ───── */}
        <SectionHeader icon="notifications-outline" label={t('profile.sections.notifications')} />
        <Card>
          <ToggleRow
            label={t('profile.notifications.master')}
            description={t('profile.notifications.masterDescription')}
            value={settings.notificationsEnabled}
            onChange={(v) => setSetting('notificationsEnabled', v)}
          />
          <Divider />
          <ToggleRow
            label={t('profile.notifications.mood')}
            description={t('profile.notifications.moodDescription')}
            value={settings.moodCheckinPrompt}
            onChange={(v) => setSetting('moodCheckinPrompt', v)}
          />
          {/* Deliberately NOT gated by the master push switch: this value also
              drives the in-app prompt, which works with push off. Hiding it
              behind the master switch would hide the control the user asked
              for. */}
          <ButtonRow
            icon="moon-outline"
            label={t('profile.notifications.time')}
            value={formatClock(settings.dayEndHour, settings.dayEndMinute, locale)}
            onPress={() => setTimeSheet('dayEnd')}
            chevron
            disabled={!settings.moodCheckinPrompt}
          />
          {dayEndPassedToday && (
            <NoteText>{t('profile.notifications.startsTomorrow')}</NoteText>
          )}
          <Divider />
          <ToggleRow
            label={t('profile.notifications.daily')}
            description={t('profile.notifications.dailyDescription')}
            value={settings.dailyReminder}
            onChange={(v) => setSetting('dailyReminder', v)}
            disabled={!settings.notificationsEnabled}
          />
          <ButtonRow
            icon="sunny-outline"
            label={t('profile.notifications.time')}
            value={formatClock(settings.briefHour, settings.briefMinute, locale)}
            onPress={() => setTimeSheet('brief')}
            chevron
            disabled={!settings.notificationsEnabled || !settings.dailyReminder}
          />
          {briefPassedToday && (
            <NoteText>{t('profile.notifications.startsTomorrow')}</NoteText>
          )}
          <NoteText>{t('profile.notifications.footnote')}</NoteText>
        </Card>

        {/* ───── TASKS & PROGRESS ───── */}
        <SectionHeader icon="trophy-outline" label={t('profile.sections.tasksProgress')} />
        <Card>
          <InfoRow
            label={t('profile.fields.dayResetTime')}
            value={t('profile.fields.midnight')}
            muted
          />
        </Card>

        {/* ───── ABOUT ───── */}
        <SectionHeader icon="information-circle-outline" label={t('profile.sections.about')} />
        <Card>
          <ButtonRow
            icon="play-circle-outline"
            label={t('profile.actions.replayOnboarding')}
            onPress={handleReplayOnboarding}
          />
          <Divider />
          <ButtonRow
            icon={isCheckingUpdate ? 'sync' : 'cloud-download-outline'}
            label={
              isCheckingUpdate ? t('profile.actions.checking') : t('profile.actions.checkForUpdates')
            }
            onPress={handleCheckForUpdate}
            disabled={isCheckingUpdate}
            spinning={isCheckingUpdate}
          />
        </Card>

        <Text style={styles.footer}>
          {t('profile.footer', { version: Constants.expoConfig?.version ?? '0' })}
          {Updates.updateId
            ? `\n${t('profile.footerUpdate', { id: Updates.updateId.slice(0, 8) })}`
            : ''}
        </Text>
      </ScrollView>

      <TimePickerSheet
        visible={timeSheet !== null}
        eyebrow={t('profile.sections.notifications')}
        title={
          timeSheet === 'brief'
            ? t('profile.notifications.daily')
            : t('profile.notifications.mood')
        }
        description={
          timeSheet === 'brief'
            ? t('profile.notifications.dailyTimeHelp')
            : t('profile.notifications.moodTimeHelp')
        }
        hour={timeSheet === 'brief' ? settings.briefHour : settings.dayEndHour}
        minute={timeSheet === 'brief' ? settings.briefMinute : settings.dayEndMinute}
        minHour={timeSheet === 'brief' ? 4 : 12}
        maxHour={timeSheet === 'brief' ? 13 : 23}
        onCancel={() => setTimeSheet(null)}
        // ONE write, deliberately: two sequential setSetting calls are two
        // renders, and the notifications effect would run once on the
        // half-updated pair — scheduling a reminder at the new hour with the
        // old minute, which then survives alongside the intended one.
        onConfirm={async (h, m) => {
          await setSettings(
            timeSheet === 'brief'
              ? { briefHour: h, briefMinute: m }
              : { dayEndHour: h, dayEndMinute: m },
          );
          setTimeSheet(null);
        }}
      />

      <UsernameEditModal
        visible={usernameOpen}
        currentValue={profile?.display_name ?? ''}
        onClose={() => setUsernameOpen(false)}
      />
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Building blocks (kept local — they're styled specifically for this screen).
// ────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={tokens.text.mid} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function InfoRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, muted && { color: tokens.text.dim }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ButtonRow({
  icon,
  label,
  value,
  onPress,
  chevron,
  danger,
  disabled,
  spinning,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  chevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
  spinning?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && !disabled && { opacity: 0.6 }]}
    >
      <View style={styles.buttonLeft}>
        {spinning ? (
          <ActivityIndicator size="small" color={tokens.brand.violet2} style={{ width: 22 }} />
        ) : (
          <Ionicons
            name={icon}
            size={20}
            color={
              // A disabled Pressable never reports `pressed`, so without a
              // dimmed state the row is pixel-identical to a live one and
              // reads as broken rather than unavailable.
              disabled
                ? tokens.text.dim
                : danger
                  ? tokens.semantic.danger
                  : tokens.brand.violet2
            }
          />
        )}
        <Text
          style={[
            styles.rowLabel,
            danger && { color: tokens.semantic.danger },
            disabled && { color: tokens.text.dim },
          ]}
        >
          {label}
        </Text>
      </View>
      {value ? (
        <Text
          style={[styles.rowValue, disabled && { color: tokens.text.dim }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={tokens.text.dim} /> : null}
    </Pressable>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, { alignItems: 'center' }]}>
      <View style={{ flex: 1, marginRight: tokens.space[3] }}>
        <Text style={[styles.rowLabel, disabled && { color: tokens.text.dim }]}>
          {label}
        </Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: tokens.bg.surface2, true: tokens.brand.violet }}
        thumbColor={tokens.text.hi}
      />
    </View>
  );
}

interface SegmentedRowProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  note?: string;
}

function SegmentedRow<T extends string>({
  label,
  value,
  options,
  onChange,
  note,
}: SegmentedRowProps<T>) {
  return (
    <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.segmented}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: active ? tokens.text.hi : tokens.text.mid },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {note ? <Text style={styles.rowDescription}>{note}</Text> : null}
    </View>
  );
}

function NoteText({ children }: { children: React.ReactNode }) {
  return <Text style={[styles.rowDescription, { padding: tokens.space[3] }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.base },
  content: {
    padding: tokens.space[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    flexWrap: 'wrap',
    marginTop: tokens.space[2],
    marginBottom: tokens.space[5],
  },
  screenTitle: {
    ...tokens.type.h1,
    color: tokens.text.hi,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: tokens.space[5],
    marginBottom: tokens.space[2],
    paddingLeft: tokens.space[1],
  },
  sectionLabel: {
    ...tokens.type.eyebrow,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.border.base,
    marginHorizontal: tokens.space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[4],
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    flex: 1,
  },
  rowLabel: {
    ...tokens.type.body,
    color: tokens.text.hi,
    fontFamily: 'Manrope_700Bold',
  },
  rowValue: {
    ...tokens.type.body,
    color: tokens.text.mid,
    flexShrink: 1,
    textAlign: 'right',
  },
  rowDescription: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    marginTop: 4,
    lineHeight: 16,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: tokens.bg.surface2,
    borderRadius: tokens.radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: tokens.space[2],
    alignItems: 'center',
    borderRadius: tokens.radius.sm,
  },
  segmentActive: {
    backgroundColor: tokens.brand.violet,
  },
  segmentLabel: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_700Bold',
  },
  footer: {
    ...tokens.type.caption,
    color: tokens.text.faint,
    textAlign: 'center',
    marginTop: tokens.space[7],
  },
});
