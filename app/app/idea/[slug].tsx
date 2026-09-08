import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdeaScreen } from '@/components/ideas/IdeaScreen';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useLearningMaterial } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Idea route — `/idea/[slug]?idea=n` (fullScreenModal, registered in
 * `_layout.tsx`). `idea` is the 1-based ordinal to open on (default 1).
 *
 * Owns only loading / not-found, like `material/[slug]`. A material that
 * has no ideas has no idea screen: the route bounces back instead of
 * rendering an empty pager (the material page never links here for those,
 * so this is a deep-link / stale-cache guard).
 */

function parseOrdinal(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export default function IdeaRoute() {
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ slug: string; idea?: string }>();
  const material = useLearningMaterial(params.slug);

  const data = material.data;
  const hasIdeas = !!data?.ideas && data.ideas.length > 0;

  useEffect(() => {
    if (data && !hasIdeas) {
      if (router.canGoBack()) router.back();
      else router.replace(`/material/${data.slug}`);
    }
  }, [data, hasIdeas, router]);

  if (material.isLoading || (data && !hasIdeas)) {
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

  if (!data) {
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

  return <IdeaScreen detail={data} initialOrdinal={parseOrdinal(params.idea)} />;
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
