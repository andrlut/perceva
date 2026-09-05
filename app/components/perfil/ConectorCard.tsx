import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Porta de entrada para o conector MCP.
 *
 * SEM gate de módulo e SEM gate premium, de propósito: isto é integração
 * externa, não uma feature do produto. Uma chave no MODULE_REGISTRY diria
 * que existe algo a ligar dentro do app, e não existe — o que existe é uma
 * instrução para configurar o claude.ai.
 */
export function ConectorCard() {
  const { t } = useT();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/conector')}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <View style={styles.glyph}>
        <PercevaGlyph size={34} bare palette="gilded" idSuffix="conector" />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{t('conector.cardTitle')}</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {t('conector.cardSub')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.text.dim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    padding: tokens.space[4],
  },
  glyph: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.text.mid,
  },
});
