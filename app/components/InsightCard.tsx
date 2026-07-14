import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCorrelation } from '@/lib/api/correlation';
import { computeBySub } from '@/lib/correlation';
import type { SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

/**
 * Transversal front door to the Insights explorer. Narrates the single
 * strongest positive mood↔activity signal when there's enough data, otherwise
 * a generic invitation. Deliberately reflective — never a "do X to feel
 * better" nudge (mood stays XP-free).
 */
export function InsightCard() {
  const { t, locale } = useT();
  const router = useRouter();
  const meta = useMetaLookup();
  const { records } = useCorrelation(90);

  const best = useMemo(() => {
    if (!records) return null;
    let top: { subId: SubId; delta: number } | null = null;
    for (const dim of DIMENSION_ORDER) {
      for (const subId of SUBS_BY_DIM[dim]) {
        const s = computeBySub(records, subId);
        if (!s.enough) continue;
        if (!top || s.delta > top.delta) top = { subId, delta: s.delta };
      }
    }
    return top && top.delta > 0.2 ? top : null;
  }, [records]);

  const headline = best
    ? t('insights.cardBest', {
        label: meta.sub(best.subId).label,
        delta: `+${best.delta.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
          maximumFractionDigits: 1,
        })}`,
      })
    : t('insights.cardGeneric');

  return (
    <Pressable
      onPress={() => router.push('/insights')}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      hitSlop={4}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={16} color={tokens.brand.violet2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{t('insights.title')}</Text>
        <Text style={styles.headline} numberOfLines={2}>
          {headline}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.brand.violet2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(123, 92, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.28)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.brand.violet2,
  },
  headline: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.hi,
  },
});
