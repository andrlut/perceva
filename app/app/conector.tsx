import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { claudeTargetUrl, parseClaudeTarget } from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import {
  CLAUDE_CONNECTORS_URL,
  MCP_CLIENT_ID,
  MCP_CONNECTOR_URL,
} from '@/lib/mcp';
import { useLoadedSettings, useSettingsStore } from '@/lib/settings';
import { useKeyboardOverlap } from '@/lib/use-keyboard-height';
import { tokens } from '@/theme';

/**
 * Como conectar o Perceva ao Claude.
 *
 * Tela INSTRUCIONAL: nenhum fluxo OAuth roda dentro do app. Isso é uma
 * escolha, não uma limitação — se o beta do Auth quebrar, o pior caso é "os
 * passos não funcionam no claude.ai", nunca uma tela travada aqui.
 *
 * A única coisa que se AJUSTA aqui é o atalho de volta (ShortcutCard): o
 * botão "Ditar no Claude" nas superfícies de humor e onde ele abre. É
 * ajuste local do aparelho, não módulo — só faz sentido no celular que tem
 * o app do Claude com o conector montado.
 *
 * A URL e o Client ID são `selectable` em vez de um botão de copiar porque
 * `expo-clipboard` é módulo nativo: adicioná-lo exigiria um `eas build` e
 * mataria o caminho OTA desta versão.
 */
export default function ConectorScreen() {
  const { t } = useT();
  const router = useRouter();
  const bottomClearance = useBottomSafeClearance();
  // Edge-to-edge screen (no bottom inset) + a TextInput near the bottom: the
  // keyboard covers the ScrollView unless the content reserves its height.
  // useKeyboardOverlap, not useKeyboardHeight — see lib/use-keyboard-height.
  const keyboard = useKeyboardOverlap();
  const scrollRef = useRef<ScrollView>(null);
  const shortcutY = useRef(0);
  const scrollToShortcut = () => {
    // After the keyboard reflow, so the target is measured against the
    // already-shortened viewport (same timing trick as mood-checkin).
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, shortcutY.current - tokens.space[3]),
        animated: true,
      });
    }, 120);
  };

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
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                keyboard > 0 ? keyboard + tokens.space[6] : bottomClearance,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

          {/* Direct child of the content view, so layout.y is the offset
              inside the scroll content — what scrollTo needs. */}
          <View
            onLayout={(e) => {
              shortcutY.current = e.nativeEvent.layout.y;
            }}
          >
            <ShortcutCard onInputFocus={scrollToShortcut} />
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

/**
 * "Atalho no app" — the one SETTING on this screen: the "Ditar no Claude"
 * button on the mood surfaces (ClaudeDictateButton), and where it opens.
 * Device-local (lib/settings) because the bridge only makes sense on a phone
 * with the Claude app; the link rules live in lib/claudeBridge.
 *
 * The link field keeps the LAST VALID value: a paste that parses is stored
 * in canonical form at once; an invalid one stays on screen with the error
 * under it and never overwrites the stored target. Blur snaps a valid draft
 * to the canonical form, so the user sees exactly what will open.
 */
function ShortcutCard({ onInputFocus }: { onInputFocus: () => void }) {
  const { t } = useT();
  const settings = useLoadedSettings();
  const setSetting = useSettingsStore((s) => s.set);
  const [draft, setDraft] = useState<string | null>(null);

  const text = draft ?? settings.claudeTarget;
  const target = parseClaudeTarget(text);
  const invalid = text.trim().length > 0 && target === null;

  const onChangeText = (v: string) => {
    setDraft(v);
    const parsed = parseClaudeTarget(v);
    if (parsed) void setSetting('claudeTarget', claudeTargetUrl(parsed));
    else if (!v.trim()) void setSetting('claudeTarget', '');
  };

  const hint = invalid
    ? t('conector.targetInvalid')
    : target?.kind === 'project'
      ? t('conector.targetHintProject')
      : target?.kind === 'chat'
        ? t('conector.targetHintChat')
        : t('conector.targetHintEmpty');

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('conector.shortcutTitle')}</Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleBody}>
          <Text style={styles.toggleLabel}>{t('conector.shortcutToggle')}</Text>
          <Text style={styles.toggleDesc}>{t('conector.shortcutToggleDesc')}</Text>
        </View>
        <Switch
          value={settings.claudeShortcut}
          onValueChange={(v) => void setSetting('claudeShortcut', v)}
          trackColor={{ false: tokens.bg.surface2, true: tokens.brand.violet }}
          thumbColor={tokens.text.hi}
        />
      </View>

      {settings.claudeShortcut && (
        <>
          <Text style={styles.fieldLabel}>{t('conector.targetLabel')}</Text>
          <TextInput
            value={text}
            onChangeText={onChangeText}
            onFocus={onInputFocus}
            onBlur={() => {
              if (!invalid) setDraft(null);
            }}
            placeholder={t('conector.targetPlaceholder')}
            placeholderTextColor={tokens.text.dim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            style={[styles.input, invalid && styles.inputInvalid]}
            accessibilityLabel={t('conector.targetLabel')}
          />
          <Text style={[styles.hint, invalid && styles.hintInvalid]}>{hint}</Text>

          <Text style={styles.fieldLabel}>{t('conector.projectHowTitle')}</Text>
          <Text style={styles.body}>{t('conector.projectHowBody')}</Text>
          <Text style={styles.mono} selectable>
            {t('conector.projectInstructions')}
          </Text>
          <Text style={styles.hint}>{t('conector.copyHint')}</Text>
        </>
      )}
    </View>
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
  hintInvalid: {
    color: tokens.semantic.danger,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  toggleBody: { flex: 1, gap: 2 },
  toggleLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  toggleDesc: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  input: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.hi,
    backgroundColor: tokens.bg.surface2,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 44,
  },
  inputInvalid: {
    borderColor: tokens.semantic.danger,
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
