import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Emblema } from '@/components/Emblema';
import { PersonalizarSheet } from '@/components/perfil/PersonalizarSheet';
import { EmblemaLegend } from '@/components/perfil/EmblemaLegend';
import { useCharacter } from '@/lib/api/character';
import { useEmblemaState } from '@/lib/emblema';
import { resolvePalette, useActiveTitle } from '@/lib/identity';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';

const EMBLEM = 200;

/**
 * O topo do /perfil: o Emblema grande, o nome, o título e a frase.
 *
 * É aqui que o emblema aparece inteiro — cinco anéis e os satélites das
 * subs — porque só neste tamanho dá para ler o que cada canal diz. Na capa
 * ele é a versão de três anéis, sem satélites.
 *
 * A legenda de baixo existe para ENSINAR a ler o emblema: cada número dela
 * corresponde a um canal, na mesma ordem. Ela é informativa e não tem
 * botão — a capa e o topo do perfil não dizem o que fazer depois.
 *
 * Fase 1 mostra o arquétipo DISC como título, que é o comportamento que a
 * capa já tinha. Escolher entre os títulos dos vários instrumentos é a
 * Fase 2, junto com `profile.identity`.
 */
export function PerfilHero() {
  const { t } = useT();
  const character = useCharacter();
  const emblema = useEmblemaState();
  const meta = useMetaLookup();
  const active = useActiveTitle();
  const [customizing, setCustomizing] = useState(false);

  const identity = character.data?.profile.identity;
  const displayName = character.data?.profile.display_name ?? '';
  // O título escolhido, com queda para o vigente do DISC — a mesma regra
  // que a capa segue, para as duas telas nunca discordarem.
  const title = active?.label ?? null;
  const phrase = active?.phrase ?? null;

  // As subs que o emblema está desenhando agora, em texto — responde
  // "quem são aquelas bolinhas" sem precisar tocar em nada.
  // Enquanto carrega não se afirma nada. Antes o retrato zerado vinha
  // acompanhado de "Sem prática nos últimos 30 dias" — uma afirmação falsa
  // sobre quem praticou todo dia, dita no primeiro instante da tela.
  const practiceLabel = emblema.loading
    ? ' '
    : emblema.center
      ? [emblema.center, ...emblema.satellites]
          .slice(0, 3)
          .map((s) => meta.sub(s.subId).label.toLowerCase())
          .join(', ')
      : t('perfil.emblema.noPractice');

  return (
    <View style={styles.root}>
      <Emblema
        state={emblema}
        size={EMBLEM}
        rings={5}
        showOrbit
        palette={resolvePalette(identity?.palette)}
        idSuffix="perfil"
      />

      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {title && <Text style={styles.title}>{title.toUpperCase()}</Text>}
        {phrase && (
          <Text style={styles.phrase} numberOfLines={3}>
            {phrase}
          </Text>
        )}

        <Text style={styles.subs}>{practiceLabel}</Text>
      </View>

      <EmblemaLegend state={emblema} />

      <Pressable
        onPress={() => setCustomizing(true)}
        style={({ pressed }) => [styles.customize, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        <Ionicons
          name="color-palette-outline"
          size={15}
          color={tokens.brand.violet2}
        />
        <Text style={styles.customizeText}>{t('personalizar.title')}</Text>
      </Pressable>

      <PersonalizarSheet
        visible={customizing}
        onClose={() => setCustomizing(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    // Espaço em volta para o emblema respirar — o halo dele transborda a
    // própria caixa, então apertar aqui corta o brilho da leitura.
    paddingTop: tokens.space[5],
    paddingBottom: tokens.space[5],
    gap: tokens.space[4],
  },
  textCol: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.space[4],
  },
  name: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: tokens.text.hi,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.4,
    color: tokens.semantic.coinLight,
  },
  phrase: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    color: tokens.text.mid,
    textAlign: 'center',
    marginTop: 2,
  },
  customize: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(155, 130, 255, 0.30)',
    marginTop: tokens.space[2],
  },
  customizeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.3,
    color: tokens.brand.violet2,
  },
  subs: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 16,
    color: tokens.text.dim,
    textAlign: 'center',
    marginTop: 4,
  },
});
