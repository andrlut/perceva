import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import type { CharacterDimension, DimensionId } from '@/lib/db/types';
import { useMetaLookup } from '@/lib/i18n/meta';
import { levelProgress } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER } from '@/theme/dimensions';

interface Props {
  dimensions: CharacterDimension[];
}

const DIM_ABBREV: Record<DimensionId, string> = {
  health: 'HEA',
  body: 'BOD',
  mind: 'MIN',
  wealth: 'WEA',
  bonds: 'BND',
  craft: 'CRA',
};

/**
 * Sub-pillar **Dedicação** (lives under Praticada). XP-focused: shows each
 * attribute's level + total XP + progress to next level.
 *
 * Quest/Momentum content lives in the sibling MomentumView so the two
 * sub-pilares stay visually distinct. No card chrome — content sits raw
 * on the page so the per-attribute rows breathe.
 */
export function DedicacaoPanel({ dimensions }: Props) {
  const router = useRouter();
  const metaLookup = useMetaLookup();
  const dimMap = useMemo(() => {
    const m = new Map<DimensionId, CharacterDimension>();
    for (const d of dimensions) m.set(d.dimension_id, d);
    return m;
  }, [dimensions]);

  return (
    <View style={styles.wrap}>
      <View style={styles.list}>
        {DIMENSION_ORDER.map((id) => {
          const meta = DIMENSION_META[id];
          const xp = dimMap.get(id)?.xp ?? 0;
          const lp = levelProgress(xp);

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
                      {DIM_ABBREV[id]} · LV {lp.level} · {xp.toLocaleString()} XP
                    </Text>
                  </View>
                </View>
                <View style={[styles.levelPill, { borderColor: `${meta.color}55` }]}>
                  <Text style={[styles.levelLabel, { color: meta.color }]}>LV</Text>
                  <Text style={styles.levelValue}>{lp.level}</Text>
                </View>
              </View>

              <ProgressBar
                value={lp.xpInLevel}
                max={lp.xpNeededForLevel}
                color={meta.color}
                height={4}
              />
              <Text style={styles.toNext}>
                {Math.max(0, lp.xpNeededForLevel - lp.xpInLevel).toLocaleString()} XP até LV {lp.level + 1}
              </Text>
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
  wrap: {
    gap: tokens.space[3],
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
    fontSize: 11,
    color: tokens.text.dim,
    letterSpacing: 0.3,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    backgroundColor: tokens.bg.glass,
  },
  levelLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  levelValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  toNext: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.dim,
    letterSpacing: 0.3,
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
