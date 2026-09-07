import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import {
  GLOW_FULL_READS,
  LADDER_5,
  PRACTICE_FLOOR_XP,
  type EmblemaState,
} from '@/lib/emblema';
import { DEEP_INSTRUMENT_IDS } from '@/lib/api/psych';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

const RING_TOTAL = LADDER_5.length;
const INSTRUMENT_TOTAL = DEEP_INSTRUMENT_IDS.length;

/**
 * A auditoria do Emblema: uma barra por canal.
 *
 * Duas funções, e as duas importam. A primeira é DIDÁTICA — cada linha diz
 * qual parte do desenho ela move ("os anéis", "os braços dourados"), porque
 * um emblema que ninguém sabe ler é decoração. A segunda é de CONTROLE: o
 * dono queria conferir em que pé está cada frente sem abrir quatro telas.
 *
 * A cor de cada barra é a cor da peça correspondente no emblema — violeta
 * nos anéis, ouro nos braços, a cor da dimensão dominante no centro. É isso
 * que liga a linha ao desenho sem precisar de seta nem de rótulo.
 *
 * São TRÊS barras, e não quatro: as práticas saíram daqui porque as doze
 * áreas já são desenhadas no próprio emblema, acesas ou apagadas. Repetir
 * isso como barra diria menos do que o círculo já diz.
 *
 * Ordem: esforço, leitura, autoconhecimento. As duas primeiras são a
 * janela móvel de 30 dias; o autoconhecimento fecha a lista porque é a
 * única que não recua.
 */
export function EmblemaLegend({ state }: { state: EmblemaState }) {
  const { t } = useT();

  const rows = [
    {
      key: 'effort',
      label: t('perfil.emblema.legend.effort'),
      // O sub-rótulo do esforço não explica o esforço — o número já faz
      // isso sozinho. Ele carrega a regra dos 100 pontos, que é o que
      // acende as doze áreas lá em cima e não teria outro lugar agora que
      // a linha de práticas saiu da legenda.
      what: t('perfil.emblema.legend.effortWhat', {
        floor: PRACTICE_FLOOR_XP,
      }),
      // O teto é o topo da escada e o mesmo denominador da barra: sem ele
      // "anel 4 de 5" não diz quanto falta pro disco fechar.
      //
      // Passando do teto, o "de {max}" some: manter 100 XP por dia e ler
      // "3.235 de 3.000" parece defeito, e capar o número em 3.000
      // esconderia esforço real. Com o disco cheio o mês fala por si, e o
      // sub-rótulo já diz "5 de 5 fechados".
      // Passando do teto o "de {max}" sai: com 3.235 num teto de 3.000,
      // "3.235 / 3.000" parece defeito, e capar em 3.000 esconderia
      // esforço real. Com o disco cheio o mês fala por si.
      value:
        state.xp30 >= LADDER_5[RING_TOTAL - 1]
          ? t('perfil.emblema.legend.effortValueFull', {
              xp: state.xp30.toLocaleString(),
            })
          : t('perfil.emblema.legend.effortValue', {
              xp: state.xp30.toLocaleString(),
              max: LADDER_5[RING_TOTAL - 1].toLocaleString(),
            }),
      current: state.xp30,
      max: LADDER_5[RING_TOTAL - 1],
      color: tokens.brand.violet2,
    },
    {
      key: 'reading',
      label: t('perfil.emblema.legend.reading'),
      what: t('perfil.emblema.legend.readingWhat'),
      value: t('perfil.emblema.legend.readingValue', {
        done: state.read30,
        total: GLOW_FULL_READS,
      }),
      current: state.read30,
      max: GLOW_FULL_READS,
      color: tokens.brand.violet,
    },
    {
      key: 'self',
      label: t('perfil.emblema.legend.self'),
      what: t('perfil.emblema.legend.selfWhat'),
      value: t('perfil.emblema.legend.selfValue', {
        done: state.instruments,
        total: INSTRUMENT_TOTAL,
      }),
      current: state.instruments,
      max: INSTRUMENT_TOTAL,
      color: tokens.semantic.coinLight,
    },
  ];

  return (
    <View style={[styles.root, state.loading && styles.loading]}>
      <Text style={styles.title}>{t('perfil.emblema.legend.title')}</Text>

      {rows.map((r) => (
        <View key={r.key} style={styles.row}>
          <View style={styles.head}>
            <Text style={styles.label}>
              {r.label}
              <Text style={styles.what}> · {r.what}</Text>
            </Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
          <ProgressBar
            value={r.current}
            max={r.max}
            color={r.color}
            height={5}
            trackColor="rgba(255,255,255,0.06)"
          />
        </View>
      ))}

      <Text style={styles.note}>{t('perfil.emblema.legend.window')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Durante a carga as barras aparecem apagadas em vez de mostrarem zero
   *  como se fosse resultado. */
  loading: {
    opacity: 0.45,
  },
  root: {
    width: '100%',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  row: {
    gap: 6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: tokens.space[3],
  },
  label: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  what: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.dim,
  },
  value: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  note: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    color: tokens.text.dim,
    marginTop: 2,
  },
});
