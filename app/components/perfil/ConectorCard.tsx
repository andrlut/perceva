import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Atalho para o conector MCP dentro do /perfil.
 *
 * SEM gate de módulo e SEM gate premium, de propósito: isto é integração
 * externa, não uma feature do produto. Uma chave no MODULE_REGISTRY diria
 * que existe algo a ligar dentro do app, e não existe — o que existe é uma
 * instrução para configurar o claude.ai.
 *
 * A CASA do conector agora é Ajustes; aqui ele é só um atalho, e por isso
 * encolheu para uma linha. O motivo de o atalho continuar existindo é que
 * o que o conector devolve (`get_profile_summary`, os dias sem resgate do
 * `get_rewards`) É o retrato — mas ele não pode competir em altura com o
 * Emblema, que passou a abrir a tela.
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
        <PercevaGlyph size={26} bare palette="gilded" idSuffix="conector" />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {t('conector.cardTitle')}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
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
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
  },
  glyph: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
});
