import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/lib/i18n';
import type { TourModule } from '@/lib/tour/constants';
import { exitTourToHome } from '@/lib/tour/navigation';
import { useTourStore } from '@/lib/tour/store';
import { tokens } from '@/theme';

/**
 * Error boundary for the full-screen onboarding routes (intro, pack, wrap).
 *
 * The AuthGate re-opens an unanswered onboarding screen on EVERY launch, so a
 * render error there would crash the app on every boot — the user could never
 * get in again. Instead the screen marks its module skipped (releasing the
 * AuthGate) and offers one button into the app.
 */
export function TourErrorBoundary({
  module,
  error,
}: ErrorBoundaryProps & { module: TourModule }) {
  const { t } = useT();

  useEffect(() => {
    console.warn(`[tour] ${module} screen failed:`, error);
    void useTourStore.getState().setStatus(module, 'skipped');
  }, [module, error]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>{t('tour.errors.screenTitle')}</Text>
        <Pressable
          onPress={exitTourToHome}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>{t('tour.errors.screenAction')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[5],
    paddingHorizontal: tokens.space[6],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  btn: {
    minHeight: 50,
    paddingHorizontal: tokens.space[6],
    justifyContent: 'center',
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  btnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: '#3D2A00',
  },
});
