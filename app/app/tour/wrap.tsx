import type { ErrorBoundaryProps } from 'expo-router';
import { TourErrorBoundary } from '@/components/tour/TourErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FullScreenStep } from '@/components/tour/FullScreenStep';
import { useT } from '@/lib/i18n';
import { MODULE_REGISTRY } from '@/lib/modules';
import { isTerminal } from '@/lib/tour/constants';
import { useTourStore } from '@/lib/tour/store';
import { exitTourToHome } from '@/lib/tour/navigation';
import { tokens } from '@/theme';

/**
 * Wrap-up — the tour's closing full screen. M6 routes here when it ends
 * (via isWrapPending), so even a user who skipped every module passes
 * through it once.
 *
 * `wrap` is marked completed ON MOUNT, not on the button: the 2026-09 audit
 * found that backing out of this screen (Android back, iOS swipe, the OS
 * killing the app) left the tour unfinished forever, which silently
 * suppressed everything gated on useTourFinished (the evening mood prompt,
 * the OTA banner). Seeing the screen is what finishes the tour; the button
 * only leaves it.
 *
 * The two notes answer the audit's coverage gaps: the optional modules are
 * all OFF by default and only Ajustes turns them on, and the onboarding
 * can be redone from Ajustes. Module names and the Ajustes path are read
 * from the Settings strings themselves, so the copy always matches the
 * switch the user has to find.
 */
export default function TourWrapScreen() {
  const { t } = useT();

  useEffect(() => {
    const { modules, setStatus } = useTourStore.getState();
    if (!isTerminal(modules.wrap?.status)) void setStatus('wrap', 'completed');
  }, []);

  const handleDone = () => {
    exitTourToHome();
  };

  const moduleNames = MODULE_REGISTRY.map((def) => t(`profile.modules.${def.key}`));
  // "A, B, C e D" — Hermes has no Intl.ListFormat, so the conjunction is a
  // string of its own.
  const moduleList =
    moduleNames.length > 1
      ? `${moduleNames.slice(0, -1).join(', ')} ${t('tour.wrap.listAnd')} ${moduleNames[moduleNames.length - 1]}`
      : (moduleNames[0] ?? '');
  const settings = t('profile.title');
  const modulesPath = `${settings} › ${t('profile.sections.modules')}`;
  const redoPath = `${settings} › ${t('profile.actions.replayOnboarding')}`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FullScreenStep
        eyebrow={t('tour.wrap.eyebrow')}
        title={t('tour.wrap.title')}
        body={t('tour.wrap.body')}
        primaryLabel={t('tour.wrap.primary')}
        onPrimary={handleDone}
      >
        <View style={styles.notes}>
          <Note
            icon="apps-outline"
            text={t('tour.wrap.modulesNote', { list: moduleList, path: modulesPath })}
          />
          <View style={styles.divider} />
          <Note
            icon="refresh-outline"
            text={t('tour.wrap.redoNote', { path: redoPath })}
          />
        </View>
      </FullScreenStep>
    </>
  );
}

function Note({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.note}>
      <Ionicons name={icon} size={18} color={tokens.brand.violet2} style={styles.noteIcon} />
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notes: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  noteIcon: {
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.mid,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.border.base,
  },
});

/** A render error here must never lock the app on every launch. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <TourErrorBoundary module="wrap" {...props} />;
}
