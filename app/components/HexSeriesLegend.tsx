import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Legenda de séries do hexágono — UMA para os três painéis da aba Eu.
 *
 * Antes cada painel inventava a sua: o Percebida tinha um segmented control
 * de 3 pills exclusivas (Self · Ambos · Quiz), o Dedicação uma Pressable
 * cuja única pista de estado era a cor da borda de um swatch, e o Norte a
 * mesma linha copiada mas inerte, como `View`. Três geometrias e três
 * gramáticas de interação para a mesma faixa da tela.
 *
 * A regra agora é uma só: **uma entrada por silhueta desenhada no hex**, e
 * tocar liga/desliga aquela série. Não navega — navegação por eixo já existe
 * no vértice do hex e nos DimensionCards, e a legenda é por SÉRIE, não por
 * eixo; não há destino por série.
 *
 * Gramática do swatch:
 *   'fill'    → a série principal DESTE hex. Neutra de propósito: o polígono
 *               do HexRadar é hue-free por decisão explícita, então um
 *               swatch colorido mentiria. `color` é IGNORADO aqui.
 *   'outline' → a série visitante (a comparação). Usa `color`.
 *
 * REGRA DE COR: `accent` e `color` só aceitam token hex de 6 dígitos, porque
 * o chrome da pill concatena alfa (`${accent}4D`). Passar um token rgba()
 * — qualquer `border.*`, `bg.glass`, ou `dimensionBg.*` no tema escuro —
 * produz uma string inválida e a cor some SEM erro. O TypeScript não pega:
 * toda cor de token é `string`.
 */

export interface HexSeriesEntry {
  key: string;
  label: string;
  /** 'fill' = série própria do hex (swatch neutro); 'outline' = visitante. */
  shape: 'fill' | 'outline';
  /** Só usado com shape 'outline'. Precisa ser hex de 6 dígitos. */
  color?: string;
  visible: boolean;
  /** Ausente = entrada informativa, sem toque. */
  onToggle?: () => void;
}

interface Props {
  /** Hex de 6 dígitos. Mesmo accent do HexGrainToggle do painel. */
  accent: string;
  entries: HexSeriesEntry[];
}

export function HexSeriesLegend({ accent, entries }: Props) {
  const { t } = useT();
  const visibleCount = entries.filter((e) => e.visible).length;

  return (
    <View style={styles.row}>
      {entries.map((entry) => {
        // Regra do último de pé: desligar a única série visível deixaria o
        // gráfico vazio. A entrada perde o toque em vez de engolir o gesto
        // em silêncio, que é pior do que não ter afordância nenhuma.
        const isLastVisible = entry.visible && visibleCount <= 1;
        const interactive = entry.onToggle != null && !isLastVisible;

        const pillChrome = entry.visible
          ? {
              borderColor: `${accent}4D`,
              backgroundColor: `${accent}14`,
            }
          : {
              borderColor: tokens.border.base,
              backgroundColor: 'transparent',
            };

        const labelColor = entry.visible ? accent : tokens.text.faint;

        const swatchStyle =
          entry.shape === 'fill'
            ? {
                backgroundColor: entry.visible
                  ? tokens.bg.surface3
                  : 'transparent',
                borderColor: entry.visible ? tokens.text.mid : tokens.text.faint,
              }
            : {
                backgroundColor: 'transparent',
                borderColor: entry.visible
                  ? (entry.color ?? tokens.text.mid)
                  : tokens.text.faint,
              };

        const content = (
          <>
            <View style={[styles.swatch, swatchStyle]} />
            <Text style={[styles.label, { color: labelColor }]}>
              {entry.label}
            </Text>
          </>
        );

        if (!interactive) {
          return (
            <View
              key={entry.key}
              style={[styles.pill, pillChrome]}
              accessibilityState={
                isLastVisible ? { selected: true, disabled: true } : undefined
              }
            >
              {content}
            </View>
          );
        }

        return (
          <Pressable
            key={entry.key}
            onPress={entry.onToggle}
            style={({ pressed }) => [
              styles.pill,
              pillChrome,
              pressed && { opacity: 0.7 },
            ]}
            // Vertical SÓ: 28px de pill + 10 + 10 = 48px de alvo real.
            // Slop horizontal em pills vizinhas com gap 6 se sobrepõe, e o
            // Android passa a despachar o toque para o vizinho.
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="button"
            accessibilityState={{ selected: entry.visible }}
            accessibilityLabel={t('hex.seriesToggleA11y', {
              series: entry.label,
            })}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: tokens.space[2],
  },
  // Mesma geometria do HexGrainToggle — as duas faixas ficam uma sob a
  // outra, e divergir aqui é exatamente o que esta refatoração corrige.
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  swatch: {
    width: 14,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
