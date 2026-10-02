import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdeasMaterialScreen } from '@/components/learning/IdeasMaterialScreen';
import { MaterialMediaScreen } from '@/components/learning/MaterialMediaScreen';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useLearningMaterial } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { useMaterialLock } from '@/lib/premium';
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
 *
 * Exception (Recanto em ideias): a material whose `ideas` is a non-empty
 * array renders IdeasMaterialScreen instead — the legacy screen stays
 * byte-identical for everything else.
 */
export default function MaterialDetailScreen() {
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ slug: string }>();
  const material = useLearningMaterial(params.slug);
  const isLocked = useMaterialLock();

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

  // Gate mensal do Recanto: free abre só o mês corrente — material do acervo
  // vira a tela de tranca com o convite pro Premium. Cobre também deep links
  // e os CTAs antigos das redes sociais (post velho → tranca → conversão).
  if (isLocked(material.data.released_at)) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenBackground>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={[styles.center, styles.lockPad]}>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={26} color={tokens.semantic.coin} />
            </View>
            <Text style={styles.errorTitle}>{t('premium.learnLock.title')}</Text>
            <Text style={styles.lockLine}>{t('premium.learnLock.line')}</Text>
            <Pressable
              style={styles.errorBtn}
              onPress={() => router.push('/premium?source=learn')}
              accessibilityRole="button"
            >
              <Text style={styles.errorBtnText}>{t('premium.learnLock.cta')}</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
              <Text style={styles.lockBack}>{t('premium.learnLock.back')}</Text>
            </Pressable>
          </View>
        </ScreenBackground>
      </SafeAreaView>
    );
  }

  if (material.data.ideas && material.data.ideas.length > 0) {
    return <IdeasMaterialScreen detail={material.data} />;
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
  lockPad: {
    paddingHorizontal: tokens.space[6],
  },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    marginBottom: tokens.space[1],
  },
  lockLine: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.mid,
    textAlign: 'center',
    marginBottom: tokens.space[2],
  },
  lockBack: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.dim,
    padding: tokens.space[2],
  },
});
