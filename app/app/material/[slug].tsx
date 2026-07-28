import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaterialMediaScreen } from '@/components/learning/MaterialMediaScreen';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useLearningMaterial } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Material detail route.
 *
 * EVERY material — with or without media attachments — renders through
 * MaterialMediaScreen, which owns the Texto | Áudio | Visual switcher. Formats
 * a material doesn't carry yet show up muted + "em breve" instead of being
 * hidden, so a text-only material still advertises the full shape (and reads
 * fine on the Texto tab). This route only owns the loading and not-found
 * states; MaterialMediaScreen is a superset of the old text screen (body,
 * takeaways, tracking, reward CTA, feedback, reading-progress tracking).
 */
export default function MaterialDetailScreen() {
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ slug: string }>();
  const material = useLearningMaterial(params.slug);

  if (material.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenBackground>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={styles.center}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        </ScreenBackground>
      </SafeAreaView>
    );
  }

  if (!material.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenBackground>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={styles.center}>
            <Text style={styles.errorTitle}>{t('learning.detail.notFound')}</Text>
            <Pressable style={styles.errorBtn} onPress={() => router.back()}>
              <Text style={styles.errorBtnText}>{t('common.back')}</Text>
            </Pressable>
          </View>
        </ScreenBackground>
      </SafeAreaView>
    );
  }

  return <MaterialMediaScreen detail={material.data} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: tokens.text.base,
  },
  errorBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: tokens.brand.violet,
  },
  errorBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
});
