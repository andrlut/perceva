import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useT } from '@/lib/i18n';
import {
  CLAUDE_CONNECTORS_URL,
  MCP_CLIENT_ID,
  MCP_CONNECTOR_URL,
} from '@/lib/mcp';
import { tokens } from '@/theme';

/**
 * Como conectar o Perceva ao Claude.
 *
 * Tela puramente INSTRUCIONAL: nenhum fluxo OAuth roda dentro do app. Isso
 * é uma escolha, não uma limitação — se o beta do Auth quebrar, o pior caso
 * é "os passos não funcionam no claude.ai", nunca uma tela travada aqui.
 *
 * A URL e o Client ID são `selectable` em vez de um botão de copiar porque
 * `expo-clipboard` é módulo nativo: adicioná-lo exigiria um `eas build` e
 * mataria o caminho OTA desta versão.
 */
export default function ConectorScreen() {
  const { t } = useT();
  const router = useRouter();
  const bottomClearance = useBottomSafeClearance();

  const examples = [
    t('conector.ex1'),
    t('conector.ex2'),
    t('conector.ex3'),
    t('conector.ex4'),
    t('conector.ex5'),
  ];

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
          <Text style={styles.headerTitle}>{t('conector.title')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomClearance },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>{t('conector.lead')}</Text>

          {/* A fronteira, dita antes dos passos: o que o conector NÃO faz é
              mais importante do que o que ele faz. */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('conector.boundaryTitle')}</Text>
            <Text style={styles.body}>{t('conector.boundaryRead')}</Text>
            <Text style={styles.body}>{t('conector.boundaryWrite')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('conector.needTitle')}</Text>
            <Text style={styles.body}>{t('conector.needBody')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('conector.stepsTitle')}</Text>
            {[1, 2, 3, 4, 5].map((n) => (
              <View key={n} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{n}</Text>
                </View>
                <Text style={styles.stepText}>{t(`conector.step${n}`)}</Text>
              </View>
            ))}

            <Text style={styles.fieldLabel}>{t('conector.urlLabel')}</Text>
            <Text style={styles.mono} selectable>
              {MCP_CONNECTOR_URL}
            </Text>

            <Text style={styles.fieldLabel}>{t('conector.clientIdLabel')}</Text>
            <Text style={styles.mono} selectable>
              {MCP_CLIENT_ID}
            </Text>

            <Text style={styles.hint}>{t('conector.copyHint')}</Text>

            <Pressable
              onPress={() => {
                WebBrowser.openBrowserAsync(CLAUDE_CONNECTORS_URL).catch(
                  () => {},
                );
              }}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Ionicons
                name="open-outline"
                size={15}
                color={tokens.brand.violet2}
              />
              <Text style={styles.ctaText}>{t('conector.openClaude')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('conector.askTitle')}</Text>
            {examples.map((ex) => (
              <View key={ex} style={styles.example}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={13}
                  color={tokens.text.dim}
                />
                <Text style={styles.exampleText}>{ex}</Text>
              </View>
            ))}
          </View>
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
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    color: tokens.text.hi,
  },
  content: {
    paddingHorizontal: tokens.space[4],
    gap: tokens.space[4],
    paddingTop: tokens.space[2],
  },
  lead: {
    ...tokens.type.body,
    color: tokens.text.base,
  },
  card: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    padding: tokens.space[4],
    gap: tokens.space[3],
  },
  cardTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.3,
    color: tokens.text.hi,
  },
  body: {
    ...tokens.type.body,
    color: tokens.text.mid,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  stepNumText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.brand.violet2,
  },
  stepText: {
    flex: 1,
    ...tokens.type.body,
    color: tokens.text.base,
  },
  fieldLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  mono: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: tokens.text.hi,
    backgroundColor: tokens.bg.surface2,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  hint: {
    ...tokens.type.caption,
    color: tokens.text.dim,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.brand.violet2,
  },
  ctaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  example: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  exampleText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: tokens.text.base,
  },
});
