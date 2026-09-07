import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Emblema } from '@/components/Emblema';
import { PercevaGlyph } from '@/components/PercevaGlyph';
import { useCharacter } from '@/lib/api/character';
import { useEmblemaState } from '@/lib/emblema';
import { resolvePalette, useActiveTitle } from '@/lib/identity';
import { useT } from '@/lib/i18n';
import { useDiscBlend } from '@/lib/psych/useDiscBlend';
import { levelProgress } from '@/lib/xp';
import { tokens } from '@/theme';

const EMBLEM = 92;

/**
 * A capa do perfil — cabeçalho de largura inteira da aba Eu.
 *
 * Regra que manda aqui: a capa é só de olhar. Sem CTA, sem "próximo
 * passo", sem contador, sem chip. Ela divide a tela com o hex que abre
 * para 12 eixos, então cada elemento a mais custa caro — e por isso o
 * Emblema aparece na versão de três anéis e sem satélites.
 *
 * O emblema substituiu o brasão fixo e a barra de XP que o circundava: os
 * anéis passaram a carregar o esforço da janela de 30 dias, então a barra
 * virava a mesma informação desenhada duas vezes. O nível continua legível
 * no eyebrow, em texto.
 *
 * O eyebrow carrega o arquétipo DISC ("LV 12 · O TIMONEIRO") em vez de um
 * apelido derivado do nível; o nome lê grande e quieto. O bloco inteiro
 * abre /perfil, onde o emblema aparece grande e dá para personalizar.
 */
export function HeroHeader() {
  const character = useCharacter();
  const { t } = useT();
  const router = useRouter();
  const blend = useDiscBlend();
  const emblema = useEmblemaState();
  const active = useActiveTitle();

  const totalXp = character.data?.character.total_xp ?? 0;
  const lp = levelProgress(totalXp);
  const displayName = character.data?.profile.display_name ?? 'Hero';

  // O título escolhido em Personalizar; sem escolha, cai no blend do DISC,
  // que é o comportamento que a capa sempre teve. A CTA de "descobrir" só
  // aparece quando não existe DISC nenhum, e não quando a pessoa tirou o
  // título de propósito.
  const archetype = active?.label ?? null;
  const goPerfil = () => router.push('/perfil');

  return (
    <View style={styles.root}>
      {/* Marca-d'água — o mesmo glifo dourado que Learn e Autoconhecimento
          carregam. Atrás de tudo, não interativo. */}
      <View style={styles.watermark} pointerEvents="none">
        <PercevaGlyph size={190} bare palette="primary" idSuffix="hero-mark" />
      </View>

      {/* Halo ambiente do cabeçalho — o brilho FIXO da tela. O halo que
          responde à leitura é o do próprio Emblema; este aqui ficou mais
          fraco para os dois não empilharem em cima do avatar.

          SVG quadrado com o raio do círculo = metade do lado, para o
          gradiente chegar a zero exatamente na borda: assim não existe
          costura visível onde a caixa termina. */}
      <View style={styles.halo} pointerEvents="none">
        <Svg width={520} height={520} viewBox="0 0 520 520">
          <Defs>
            <RadialGradient id="hero-halo" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#9B82FF" stopOpacity={0.14} />
              <Stop offset="0.55" stopColor="#9B82FF" stopOpacity={0.05} />
              <Stop offset="1" stopColor="#9B82FF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={260} cy={260} r={260} fill="url(#hero-halo)" />
        </Svg>
      </View>

      <Pressable
        style={styles.row}
        onPress={goPerfil}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={t('hero.perfilA11y')}
      >
        <Emblema
          state={emblema}
          size={EMBLEM}
          rings={3}
          palette={resolvePalette(character.data?.profile.identity?.palette)}
          idSuffix="hero"
        />

        {/* Coluna de texto — parte do mesmo alvo de toque. */}
        <View style={styles.textCol}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowLv}>LV {lp.level}</Text>
            {archetype && (
              <>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowTitle} numberOfLines={1}>
                  {archetype.toUpperCase()}
                </Text>
              </>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {blend.status === 'none' && (
            <View style={styles.discCta}>
              <Ionicons
                name="sparkles-outline"
                size={11}
                color={tokens.semantic.coinLight}
              />
              <Text style={styles.discCtaText}>{t('hero.discCta')}</Text>
              <Ionicons
                name="chevron-forward"
                size={11}
                color={tokens.semantic.coinLight}
              />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 20,
    // overflow visível para o halo e a marca-d'água morrerem no fundo da
    // tela em vez de serem cortados na caixa do cabeçalho.
    overflow: 'visible',
  },
  halo: {
    position: 'absolute',
    top: -170,
    left: '50%',
    marginLeft: -260,
    width: 520,
    height: 520,
  },
  watermark: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -95,
    opacity: 0.06,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  eyebrowLv: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: tokens.brand.violet2,
    textTransform: 'uppercase',
  },
  eyebrowDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: tokens.text.faint,
  },
  eyebrowTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: tokens.semantic.coinLight,
    flexShrink: 1,
  },
  name: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: tokens.text.hi,
    marginTop: 2,
  },
  discCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  discCtaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.3,
    color: tokens.semantic.coinLight,
  },
});
