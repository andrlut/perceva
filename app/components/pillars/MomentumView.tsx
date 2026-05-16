import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { momentumBonus, momentumTier, type AttributeMomentum } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

interface Props {
  momentum?: AttributeMomentum[];
}

/**
 * Sub-pillar **Momentum** (lives under Praticada). Per-sub recent-effort
 * snapshot with tier label (CALMO/SUBINDO/FORTE/PLENO) and active bonus %
 * on each sub.
 *
 * Pairs with DedicacaoPanel — together they make up Pilar 2 (Praticada).
 * Same row geometry to make the visual transition between sub-pilares
 * feel like a swap of lens, not a rebuild.
 */
export function MomentumView({ momentum = [] }: Props) {
  const router = useRouter();
  const { t } = useT();
  const metaLookup = useMetaLookup();
  const momentumMap = useMemo(() => {
    const m = new Map<DimensionId, AttributeMomentum>();
    for (const attr of momentum) m.set(attr.dimensionId, attr);
    return m;
  }, [momentum]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.lead}>{t('home.momentum.recentEffort')}</Text>

      <View style={styles.list}>
        {DIMENSION_ORDER.map((id) => {
          const meta = DIMENSION_META[id];
          const attrMomentum = momentumMap.get(id);
          const subMomentum = new Map(
            attrMomentum?.subattributes.map((s) => [s.subId, s.momentum]) ?? [],
          );
          const value = attrMomentum?.momentum ?? 0;
          const tier = momentumTier(value);
          return (
            <Pressable
              key={id}
              onPress={() =>
                router.push({ pathname: '/dimension/[id]', params: { id } })
              }
              style={({ pressed }) => [
                styles.attribute,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.attributeTop}>
                <View style={styles.attributeNameRow}>
                  <View style={[styles.iconHalo, { backgroundColor: meta.bg }]}>
                    <Ionicons
                      name={meta.iconName as never}
                      size={18}
                      color={meta.color}
                    />
                  </View>
                  <Text style={styles.attributeName} numberOfLines={1}>
                    {metaLookup.dim(id).label}
                  </Text>
                </View>
                <View style={styles.momentumPill}>
                  <Text style={styles.momentumLabel}>
                    {t(`home.momentum.tier.${tier}`).toUpperCase()}
                  </Text>
                  <Text style={[styles.momentumValue, { color: meta.color }]}>
                    {value}
                  </Text>
                </View>
              </View>

              <View style={styles.subList}>
                {SUBS_BY_DIM[id].map((subId) => {
                  const subMeta = metaLookup.sub(subId);
                  const subValue = subMomentum.get(subId) ?? 0;
                  const bonusPct = Math.round(momentumBonus(subValue) * 100);
                  return (
                    <View key={subId} style={styles.subRow}>
                      <Text style={styles.subName}>
                        {subMeta?.label ?? subId}
                      </Text>
                      <View style={styles.subValueRow}>
                        {bonusPct > 0 && (
                          <Text style={[styles.subBonus, { color: meta.color }]}>
                            {t('home.momentum.bonusActive', { percent: bonusPct })}
                          </Text>
                        )}
                        <Text style={styles.subMomentum}>{subValue}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[3],
  },
  lead: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.dim,
    letterSpacing: 0.2,
  },
  list: {
    gap: tokens.space[2],
  },
  attribute: {
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    gap: tokens.space[2],
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  attributeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
  },
  attributeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    flex: 1,
    minWidth: 0,
  },
  iconHalo: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attributeName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
    flex: 1,
    minWidth: 0,
  },
  momentumPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  momentumLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    color: tokens.text.dim,
    letterSpacing: 0.8,
  },
  momentumValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
  },
  subList: {
    gap: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  subValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  subMomentum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  subBonus: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
