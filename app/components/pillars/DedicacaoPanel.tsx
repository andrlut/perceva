import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import type { CharacterDimension, DimensionId } from '@/lib/db/types';
import { useMetaLookup } from '@/lib/i18n/meta';
import { levelProgress, type AttributeMomentum } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

interface Props {
  dimensions: CharacterDimension[];
  momentum?: AttributeMomentum[];
}

const DIM_ABBREV: Record<DimensionId, string> = {
  health: 'HEA',
  body: 'BOD',
  mind: 'MIN',
  wealth: 'WEA',
  bonds: 'BND',
  craft: 'CRA',
};

export function DedicacaoPanel({ dimensions, momentum = [] }: Props) {
  const router = useRouter();
  const metaLookup = useMetaLookup();
  const dimMap = useMemo(() => {
    const m = new Map<DimensionId, CharacterDimension>();
    for (const d of dimensions) m.set(d.dimension_id, d);
    return m;
  }, [dimensions]);
  const momentumMap = useMemo(() => {
    const m = new Map<DimensionId, AttributeMomentum>();
    for (const attr of momentum) m.set(attr.dimensionId, attr);
    return m;
  }, [momentum]);

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>Momentum</Text>
        <Text style={styles.subtitle}>Recent effort by attribute</Text>
      </View>

      <View style={styles.list}>
        {DIMENSION_ORDER.map((id) => {
          const meta = DIMENSION_META[id];
          const xp = dimMap.get(id)?.xp ?? 0;
          const lp = levelProgress(xp);
          const attrMomentum = momentumMap.get(id);
          const subMomentum = new Map(
            attrMomentum?.subattributes.map((s) => [s.subId, s.momentum]) ?? [],
          );

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
                  <View style={styles.attributeCopy}>
                    <Text style={styles.attributeName} numberOfLines={1}>
                      {metaLookup.dim(id).label}
                    </Text>
                    <Text style={styles.xpHint}>
                      {DIM_ABBREV[id]} - LV {lp.level} - {xp.toLocaleString()} XP
                    </Text>
                  </View>
                </View>
                <View style={styles.momentumPill}>
                  <Text style={styles.momentumLabel}>Momentum</Text>
                  <Text style={[styles.momentumValue, { color: meta.color }]}>
                    {attrMomentum?.momentum ?? 0}
                  </Text>
                </View>
              </View>

              <ProgressBar
                value={lp.xpInLevel}
                max={lp.xpNeededForLevel}
                color={meta.color}
                height={3}
              />

              <View style={styles.subList}>
                {SUBS_BY_DIM[id].map((subId) => {
                  const subMeta = metaLookup.sub(subId);
                  return (
                    <View key={subId} style={styles.subRow}>
                      <Text style={styles.subName}>{subMeta?.label ?? subId}</Text>
                      <Text style={styles.subMomentum}>
                        {subMomentum.get(subId) ?? 0}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push('/quests')}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        hitSlop={4}
      >
        <Text style={styles.ctaText}>Ver quests</Text>
        <Ionicons name="arrow-forward" size={14} color={tokens.semantic.xp2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(61, 214, 140, 0.22)',
    padding: tokens.space[4],
    gap: tokens.space[3],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
  },
  subtitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
    marginTop: 2,
  },
  list: {
    gap: tokens.space[2],
  },
  attribute: {
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: tokens.radius.md,
    gap: tokens.space[2],
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
  attributeCopy: {
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
  },
  xpHint: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 9,
    color: tokens.text.dim,
    marginTop: 2,
  },
  momentumPill: {
    alignItems: 'flex-end',
  },
  momentumLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  momentumValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    lineHeight: 24,
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
  subMomentum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(61, 214, 140, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.30)',
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.3,
    color: tokens.semantic.xp2,
  },
});
