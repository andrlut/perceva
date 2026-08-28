import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { AutoconhecimentoView } from '@/components/pillars/AutoconhecimentoView';
import { useCharacter } from '@/lib/api/character';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Perfil do personagem — the hero's "status sheet", opened by tapping the
 * avatar/name block in the Eu tab's HeroHeader. Hosts the deep
 * self-knowledge layer: the six psychometric result cards that used to
 * live as the Percebida pillar's second segment (the Eu tab is now one
 * panel per pillar). Premium gating is unchanged — it lives inside each
 * instrument screen, not here.
 */
export default function PerfilScreen() {
  const router = useRouter();
  const { t } = useT();
  const character = useCharacter();
  const bottomClearance = useBottomSafeClearance();

  const displayName = character.data?.profile.display_name ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>{t('perfil.eyebrow')}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {displayName || t('perfil.fallbackTitle')}
            </Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
          showsVerticalScrollIndicator={false}
        >
          <AutoconhecimentoView />
        </ScrollView>
      </ScreenBackground>
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  headerTitle: {
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
});
