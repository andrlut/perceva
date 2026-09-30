import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { InfoSheet } from '@/components/InfoSheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SectionLabel } from '@/components/SectionLabel';
import {
  claudeNewChatUrl,
  claudeTargetUrl,
  openClaude,
  parseClaudeTarget,
} from '@/lib/claudeBridge';
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
 * Conector — o Perceva dentro do Claude. Três cards, o mesmo chassi do
 * formulário de práticas (título com ícone + (i); a explicação mora no (i),
 * não em parágrafo):
 *
 *   1. Conectar — os passos, com a URL e o Client ID encaixados no passo em
 *      que são colados, e o botão que abre os conectores do Claude. O que o
 *      conector lê/escreve e o pré-requisito ficam no (i).
 *   2. Acessos rápidos — atalhos do app pro Claude, um por linha, cada linha
 *      com a mesma anatomia (ícone 38 · nome sobre legenda · chave). Hoje só
 *      "Ditar o humor"; a lista existe pra receber os próximos. Ajuste LOCAL
 *      do aparelho (lib/settings): só faz sentido no celular que tem o app
 *      do Claude com o conector montado.
 *   3. Perguntas prontas — cada pergunta é um link: abre uma conversa nova
 *      no Claude (`claude.ai/new?q=`) com ela já escrita e um prefixo que
 *      aponta o conector. Nenhum dado pessoal entra no link (lib/claudeBridge).
 *
 * Tela INSTRUCIONAL: nenhum fluxo OAuth roda aqui. Copiar sem módulo nativo:
 * `expo-clipboard` exigiria `eas build`; o botão de copiar abre o `Share` do
 * sistema, cuja folha no Android tem "Copiar" — e o texto segue `selectable`.
 */

interface Info {
  title: string;
  body: string;
}

const QUESTION_KEYS = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5'] as const;
const QUESTION_ICONS: Record<(typeof QUESTION_KEYS)[number], keyof typeof Ionicons.glyphMap> = {
  ex1: 'calendar-outline',
  ex2: 'list-outline',
  ex3: 'moon-outline',
  ex4: 'gift-outline',
  ex5: 'happy-outline',
};

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
  const [info, setInfo] = useState<Info | null>(null);

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

  const ask = async (question: string) => {
    const ok = await openClaude(claudeNewChatUrl(`${t('conector.askPrefix')}${question}`));
    if (!ok) Alert.alert(t('conector.askTitle'), t('mood.claudeOpenError'));
  };

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

          {/* 1 — Conectar */}
          <View style={styles.card}>
            <SectionLabel
              icon="link-outline"
              label={t('conector.connectTitle')}
              onInfo={() =>
                setInfo({
                  title: t('conector.connectTitle'),
                  body: [
                    t('conector.needBody'),
                    t('conector.boundaryRead'),
                    t('conector.boundaryWrite'),
                  ].join('\n\n'),
                })
              }
            />

            <Step n={1} text={t('conector.step1')} />
            <Step n={2} text={t('conector.step2')} />
            <Step n={3} text={t('conector.step3')}>
              <CopyField
                value={MCP_CONNECTOR_URL}
                a11y={t('conector.copyA11y', { what: t('conector.urlLabel') })}
              />
            </Step>
            <Step n={4} text={t('conector.step4')}>
              <CopyField
                value={MCP_CLIENT_ID}
                a11y={t('conector.copyA11y', { what: t('conector.clientIdLabel') })}
              />
            </Step>
            <Step n={5} text={t('conector.step5')} />

            <Pressable
              onPress={() => {
                WebBrowser.openBrowserAsync(CLAUDE_CONNECTORS_URL).catch(() => {});
              }}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Ionicons name="open-outline" size={16} color={tokens.text.hi} />
              <Text style={styles.ctaText}>{t('conector.openClaude')}</Text>
            </Pressable>
          </View>

          {/* 2 — Acessos rápidos. Direct child of the content view, so
              layout.y is the offset inside the scroll content. */}
          <View
            onLayout={(e) => {
              shortcutY.current = e.nativeEvent.layout.y;
            }}
          >
            <ShortcutsCard onInputFocus={scrollToShortcut} onInfo={setInfo} />
          </View>

          {/* 3 — Perguntas prontas: each row opens a new Claude chat. */}
          <View style={styles.card}>
            <SectionLabel
              icon="chatbubbles-outline"
              label={t('conector.askTitle')}
              onInfo={() =>
                setInfo({ title: t('conector.askTitle'), body: t('conector.askInfo') })
              }
            />
            {QUESTION_KEYS.map((key, i) => {
              const question = t(`conector.${key}`);
              return (
                <Pressable
                  key={key}
                  onPress={() => void ask(question)}
                  accessibilityRole="link"
                  accessibilityLabel={t('conector.askA11y', { question })}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && styles.rowDivided,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={QUESTION_ICONS[key]} size={18} color={tokens.brand.violet2} />
                  </View>
                  <Text style={styles.rowText}>{question}</Text>
                  <Ionicons name="arrow-forward" size={16} color={tokens.text.dim} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <InfoSheet
          visible={info != null}
          onClose={() => setInfo(null)}
          title={info?.title ?? ''}
          body={info?.body ?? ''}
        />
      </ScreenBackground>
    </SafeAreaView>
  );
}

/** One numbered step; a field that belongs to it sits right under its text. */
function Step({ n, text, children }: { n: number; text: string; children?: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepText}>{text}</Text>
        {children}
      </View>
    </View>
  );
}

/** Monospace-ish value + a copy button (the system share sheet has "Copiar"). */
function CopyField({ value, a11y }: { value: string; a11y: string }) {
  return (
    <View style={styles.copyField}>
      <Text style={styles.copyValue} selectable numberOfLines={2}>
        {value}
      </Text>
      <Pressable
        onPress={() => {
          Share.share({ message: value }).catch(() => {});
        }}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="copy-outline" size={16} color={tokens.text.hi} />
      </Pressable>
    </View>
  );
}

/**
 * "Acessos rápidos" — the one card with SETTINGS on this screen. Each
 * shortcut is a row: 38px icon · name over a caption · switch. Today only
 * "Ditar o humor" (the "Ditar no Claude" button on the mood surfaces,
 * ClaudeDictateButton); its options open under the row when it's on.
 *
 * The link field keeps the LAST VALID value: a paste that parses is stored
 * in canonical form at once; an invalid one stays on screen with the error
 * under it and never overwrites the stored target. Blur snaps a valid draft
 * to the canonical form, so the user sees exactly what will open.
 */
function ShortcutsCard({
  onInputFocus,
  onInfo,
}: {
  onInputFocus: () => void;
  onInfo: (info: Info) => void;
}) {
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
      <SectionLabel
        icon="flash-outline"
        label={t('conector.shortcutsTitle')}
        onInfo={() =>
          onInfo({ title: t('conector.shortcutsTitle'), body: t('conector.shortcutsInfo') })
        }
      />

      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name="sparkles-outline" size={18} color={tokens.brand.violet2} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{t('conector.shortcutMood')}</Text>
          <Text style={styles.rowCaption}>{t('conector.shortcutMoodDesc')}</Text>
        </View>
        <Switch
          value={settings.claudeShortcut}
          onValueChange={(v) => void setSetting('claudeShortcut', v)}
          trackColor={{ false: tokens.bg.surface2, true: tokens.brand.violet }}
          thumbColor={tokens.text.hi}
          accessibilityLabel={t('conector.shortcutMood')}
        />
      </View>

      {settings.claudeShortcut && (
        <View style={styles.options}>
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
          <Text style={styles.hint}>{t('conector.projectHowBody')}</Text>
          <CopyField
            value={t('conector.projectInstructions')}
            a11y={t('conector.copyA11y', { what: t('conector.projectHowTitle') })}
          />
        </View>
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
    color: tokens.text.mid,
  },
  // Same chassis as the practice form's section cards.
  card: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.surface,
    padding: tokens.space[4],
    gap: tokens.space[3],
  },

  // Steps
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.45)',
  },
  stepNumText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.brand.violet2,
  },
  stepBody: { flex: 1, gap: tokens.space[2], paddingTop: 2 },
  stepText: {
    ...tokens.type.body,
    color: tokens.text.base,
  },

  // Copy field: value + a 32×32 button (the app's stepper/button size).
  copyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.base,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingLeft: tokens.space[3],
    paddingRight: 4,
    paddingVertical: 4,
  },
  copyValue: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.hi,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: tokens.brand.violet,
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },

  // Rows — shortcuts and questions share one anatomy.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.border.divider,
    paddingTop: 10,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.35)',
  },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  rowCaption: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  rowText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.base,
  },

  // Shortcut options (under the row when it's on)
  options: {
    gap: tokens.space[2],
    paddingTop: tokens.space[1],
  },
  fieldLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    marginTop: tokens.space[1],
  },
  input: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.hi,
    backgroundColor: tokens.bg.base,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: tokens.space[3],
    paddingVertical: 10,
    minHeight: 44,
  },
  inputInvalid: {
    borderColor: tokens.semantic.danger,
  },
  hint: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  hintInvalid: {
    color: tokens.semantic.danger,
  },
});
