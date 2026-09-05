import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRewardGaps, type RewardGap } from '@/lib/api/rewards';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META } from '@/theme/rewards';

/**
 * "Sem resgatar" — há quantos DIAS cada recompensa não é resgatada.
 *
 * Esta métrica existia só no MCP e em nenhuma tela do app. Ela está aqui
 * porque este produto também é usado ao contrário: o dono paga moedas
 * quando faz algo que quer parar. Para esse uso, "quanto gastei" não
 * responde nada — "há quantos dias" responde tudo.
 *
 * LINGUAGEM, e isto não é detalhe: neutra e factual. Sem parabéns, sem
 * troféu, sem verde de sucesso, sem exclamação. A mesma linha precisa
 * servir para sorvete e para cigarro, e `RewardCategory` não distingue os
 * dois (é indulgence | good | experience — não existe 'penalty'). Celebrar
 * um número que pode ser uma recaída é o pior resultado possível aqui.
 */
const MAX_ROWS = 5;

export function VaultGapsCard() {
  const { t } = useT();
  const router = useRouter();
  const gaps = useRewardGaps();

  const rows = useMemo(() => {
    const all = gaps.data ?? [];
    // Nunca resgatadas por último: sem histórico não há intervalo, e a
    // pergunta "há quantos dias" ainda não tem resposta para elas.
    return [...all]
      .sort((a, b) => {
        if (a.daysSinceLast === null && b.daysSinceLast === null) return 0;
        if (a.daysSinceLast === null) return 1;
        if (b.daysSinceLast === null) return -1;
        return b.daysSinceLast - a.daysSinceLast;
      })
      .slice(0, MAX_ROWS);
  }, [gaps.data]);

  const anyRedemption = (gaps.data ?? []).some((g) => g.redemptionsTotal > 0);

  // Sem nenhum resgate no histórico inteiro, cinco linhas de "nunca
  // resgatada" seriam ruído: a métrica ainda não existe.
  if (!gaps.data || rows.length === 0 || !anyRedemption) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={15} color={tokens.text.mid} />
        <Text style={styles.title}>{t('perfil.gaps.title')}</Text>
      </View>

      <View style={styles.rows}>
        {rows.map((g) => (
          <GapRow key={g.rewardId} gap={g} />
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/rewards-manage')}
        style={({ pressed }) => [styles.footer, pressed && { opacity: 0.7 }]}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Text style={styles.footerText}>{t('perfil.gaps.seeAll')}</Text>
        <Ionicons name="chevron-forward" size={13} color={tokens.brand.violet2} />
      </Pressable>
    </View>
  );
}

function GapRow({ gap }: { gap: RewardGap }) {
  const { t } = useT();
  const meta = REWARD_CATEGORY_META[gap.category];

  const detail =
    gap.daysSinceLast === null
      ? t('perfil.gaps.never')
      : gap.isPastPreviousBest
        ? t('perfil.gaps.pastPrevious')
        : gap.previousBestGapDays !== null
          ? t('perfil.gaps.previousBest', { days: gap.previousBestGapDays })
          : t('perfil.gaps.firstInterval');

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: meta.bg }]}>
        <Ionicons
          name={(gap.icon ?? meta.icon) as never}
          size={13}
          color={meta.color}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {gap.title}
        </Text>
        <Text style={styles.rowDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View style={styles.dayWrap}>
        <Text style={styles.dayNumber}>
          {gap.daysSinceLast === null ? '—' : gap.daysSinceLast}
        </Text>
        {gap.daysSinceLast !== null && (
          <Text style={styles.dayUnit}>{t('perfil.gaps.dayUnit')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    padding: tokens.space[4],
    gap: tokens.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.3,
    color: tokens.text.hi,
  },
  rows: { gap: tokens.space[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
  rowDetail: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
  },
  dayWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  // Tinta neutra de propósito — nunca o verde de sucesso. Ver o comentário
  // de topo: este número pode ser uma recaída.
  dayNumber: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: tokens.text.hi,
  },
  dayUnit: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: tokens.space[1],
  },
  footerText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.brand.violet2,
  },
});
