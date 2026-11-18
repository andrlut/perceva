import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenInfoButton } from '@/components/guide/ScreenInfoButton';
import { VidaGuide, useVidaGuidePrompt } from '@/components/guide/screens/VidaGuide';
import { InfoSheet } from '@/components/InfoSheet';
import { PillarFirstStep } from '@/components/pillars/PillarFirstStep';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  VidaCutChips,
  VidaPracticeRow,
  VidaScenes,
  VidaSection,
  VidaSubChips,
} from '@/components/vida/VidaParts';
import { useDeleteLifeVision, useLifeVision } from '@/lib/api/lifeVision';
import { useT } from '@/lib/i18n';
import { useRequireModule } from '@/lib/modules';
import { tokens } from '@/theme';

/**
 * "A vida que eu quero" (module `vida`) — the dream life in three things,
 * each in an area of the hex, with what the person would spend on without
 * guilt, what they cut and the first practice tied to thing 1.
 *
 * Read-only here; "Editar" opens /vida-form, and every save is a new
 * version (the table has no update), so the date under the cards is the
 * version's. "Apagar tudo" removes every version.
 */
export default function VidaScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const on = useRequireModule('vida');
  const q = useLifeVision(on);
  const del = useDeleteLifeVision();
  const bottomClearance = useBottomSafeClearance();
  const [helpOpen, setHelpOpen] = useState(false);
  const guidePrompt = useVidaGuidePrompt();

  const view = q.data ?? null;
  const intl = locale === 'pt' ? 'pt-BR' : 'en-US';

  const confirmDelete = () =>
    Alert.alert(t('vida.deleteTitle'), t('vida.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('vida.deleteConfirm'),
        style: 'destructive',
        onPress: () => del.mutate(undefined, { onError: () => Alert.alert(t('common.error')) }),
      },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>{t('vida.subtitle')}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('vida.title')}
            </Text>
          </View>
          <ScreenInfoButton onPress={() => setHelpOpen(true)} a11yLabel={t('vida.help.a11y')} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomClearance + tokens.space[6] }]}
          showsVerticalScrollIndicator={false}
        >
          {!on || q.isLoading ? (
            <ActivityIndicator color={tokens.semantic.coin} style={styles.loading} />
          ) : q.isError ? (
            <Text style={styles.muted}>{t('common.error')}</Text>
          ) : !view ? (
            <View style={styles.empty}>
              <Text style={styles.question}>{t('vida.question')}</Text>
              <Text style={styles.muted}>{t('vida.questionHint')}</Text>
              <PillarFirstStep
                icon="sparkles-outline"
                title={t('vida.entryEmptyTitle')}
                line={t('vida.emptyLine')}
                cta={t('vida.draw')}
                onPress={() => router.push('/vida-form')}
              />
            </View>
          ) : (
            <>
              <VidaScenes headline={view.vision.headline} scenes={view.scenes} />

              {view.vision.guilt_free.length > 0 && (
                <VidaSection title={t('vida.guiltFreeTitle')}>
                  <VidaSubChips subs={view.vision.guilt_free} />
                </VidaSection>
              )}

              {view.vision.cuts.length > 0 && (
                <VidaSection title={t('vida.cutsTitle')}>
                  <VidaCutChips cuts={view.vision.cuts} />
                </VidaSection>
              )}

              {view.firstTask && (
                <VidaSection title={t('vida.practiceTitle')}>
                  <VidaPracticeRow
                    title={view.firstTask.title}
                    icon={view.firstTask.icon}
                    archived={view.firstTask.is_archived}
                  />
                </VidaSection>
              )}

              <View style={styles.footer}>
                <Text style={styles.muted}>
                  {t('vida.writtenOn', {
                    date: new Date(view.vision.created_at).toLocaleDateString(intl, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                  })}
                  {view.versions > 1 ? ` · ${t('vida.versions', { count: view.versions })}` : ''}
                </Text>
                <Pressable
                  onPress={() => router.push('/vida-form')}
                  style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="create-outline" size={16} color={tokens.semantic.coinInk} />
                  <Text style={styles.editText}>{t('common.edit')}</Text>
                </Pressable>
              </View>

              <Text style={styles.purpose}>{t('vida.purpose')}</Text>

              <Pressable
                onPress={confirmDelete}
                disabled={del.isPending}
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={styles.deleteText}>{t('vida.deleteAll')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </ScreenBackground>

      <InfoSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('vida.help.title')}
        aiPrompt={guidePrompt}
      >
        <VidaGuide />
      </InfoSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[2],
    gap: tokens.space[3],
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  headerTitle: { ...tokens.type.h2, color: tokens.text.hi },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    gap: tokens.space[3],
  },
  loading: { marginTop: tokens.space[8] },
  empty: { gap: tokens.space[3], paddingTop: tokens.space[2] },
  question: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
    color: tokens.text.hi,
  },
  muted: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
    paddingTop: tokens.space[1],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  editText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.semantic.coinInk,
  },
  purpose: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
  },
  deleteBtn: { alignSelf: 'center', paddingVertical: tokens.space[3], paddingHorizontal: tokens.space[4] },
  deleteText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.semantic.danger,
  },
});
