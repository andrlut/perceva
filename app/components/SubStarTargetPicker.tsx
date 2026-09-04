import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import type { SubId } from '@/lib/db/types';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';
import { tokens } from '@/theme';

export interface SubStarTarget {
  sub_id: SubId;
  /** Estrelas a ACUMULAR no sub durante a janela da missão. */
  stars: number;
}

interface Props {
  value: SubStarTarget[];
  onChange: (next: SubStarTarget[]) => void;
}

/**
 * Escolhe subs e o alvo em estrelas de cada um — o construtor de uma
 * missão do tipo `accumulate_sub_stars` ("junte 30★ em nutrição neste mês").
 *
 * NÃO é o SubPicker das práticas, de propósito. Lá o stepper vai de 1 a 5
 * e o tipo é `TaskSub['stars']` (união literal 1|2|3|4|5), porque aquilo é
 * quanto UMA prática vale. Aqui o número é o total ACUMULADO ao longo de
 * semanas: 30★ é um mês de nutrição, não um valor inválido. Reusar o
 * componente exigiria afrouxar o tipo do outro e o teto que o protege.
 *
 * Cada sub selecionado vira UM requisito na quest (o CHECK
 * quest_requirement_kind_payload amarra sub_id singular + target_count na
 * mesma linha), e a missão fecha quando todos são atingidos — ou
 * parcialmente, se `allow_partial`.
 */
const STEP = 5;
const MIN_STARS = 5;
const MAX_STARS = 100;
const DEFAULT_STARS = 10;

export function SubStarTargetPicker({ value, onChange }: Props) {
  const { t } = useT();
  const meta = useMetaLookup();

  const totalStars = value.reduce((sum, v) => sum + v.stars, 0);
  const findIdx = (subId: SubId) => value.findIndex((v) => v.sub_id === subId);

  const toggle = (subId: SubId) => {
    Haptics.selectionAsync().catch(() => {});
    const idx = findIdx(subId);
    if (idx >= 0) {
      onChange(value.filter((_, i) => i !== idx));
    } else {
      onChange([...value, { sub_id: subId, stars: DEFAULT_STARS }]);
    }
  };

  const adjust = (subId: SubId, delta: number) => {
    const idx = findIdx(subId);
    if (idx < 0) return;
    const next = value[idx]!.stars + delta * STEP;
    if (next < MIN_STARS || next > MAX_STARS) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(value.map((v, i) => (i === idx ? { ...v, stars: next } : v)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {value.length === 0
            ? t('quests.create.subsEmpty')
            : t('quests.create.subsTotal', {
                count: value.length,
                stars: totalStars,
              })}
        </Text>
      </View>

      <View style={styles.groups}>
        {DIMENSION_ORDER.map((dimId) => {
          const dimMeta = meta.dim(dimId);
          return (
            <View key={dimId} style={styles.group}>
              <View style={styles.groupHeader}>
                <Ionicons
                  name={dimMeta.iconName as never}
                  size={12}
                  color={dimMeta.color}
                />
                <Text style={[styles.groupLabel, { color: dimMeta.color }]}>
                  {dimMeta.label}
                </Text>
              </View>
              <View style={styles.row}>
                {SUBS_BY_DIM[dimId].map((subId) => {
                  const subMeta = meta.sub(subId);
                  const idx = findIdx(subId);
                  const selected = idx >= 0;
                  const stars = selected ? value[idx]!.stars : 0;
                  const canDec = selected && stars > MIN_STARS;
                  const canInc = selected && stars < MAX_STARS;

                  return (
                    <View
                      key={subId}
                      style={[
                        styles.chip,
                        selected && {
                          backgroundColor: dimMeta.bg,
                          borderColor: dimMeta.color,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => toggle(subId)}
                        style={styles.chipBody}
                        hitSlop={4}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name={subMeta.iconName as never}
                          size={14}
                          color={selected ? dimMeta.color : tokens.text.dim}
                        />
                        <Text
                          style={[
                            styles.chipLabel,
                            { color: selected ? dimMeta.color : tokens.text.mid },
                          ]}
                        >
                          {subMeta.label}
                        </Text>
                      </Pressable>
                      {selected && (
                        <View style={styles.stepper}>
                          <Pressable
                            onPress={() => adjust(subId, -1)}
                            disabled={!canDec}
                            style={({ pressed }) => [
                              styles.stepBtn,
                              !canDec && styles.stepBtnDisabled,
                              pressed && canDec && { opacity: 0.6 },
                            ]}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityLabel={t('a11y.decreaseQty')}
                          >
                            <Ionicons
                              name="remove"
                              size={12}
                              color={canDec ? dimMeta.color : tokens.text.faint}
                            />
                          </Pressable>
                          <Text style={[styles.stepValue, { color: dimMeta.color }]}>
                            {stars}★
                          </Text>
                          <Pressable
                            onPress={() => adjust(subId, 1)}
                            disabled={!canInc}
                            style={({ pressed }) => [
                              styles.stepBtn,
                              !canInc && styles.stepBtnDisabled,
                              pressed && canInc && { opacity: 0.6 },
                            ]}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityLabel={t('a11y.increaseQty')}
                          >
                            <Ionicons
                              name="add"
                              size={12}
                              color={canInc ? dimMeta.color : tokens.text.faint}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  groups: {
    gap: tokens.space[3],
  },
  group: {
    gap: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupLabel: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
    gap: 6,
  },
  chipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  chipLabel: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_700Bold',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: tokens.border.divider,
    marginLeft: 2,
  },
  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    // Token, NÃO o literal rgba(255,255,255,0.06) que o SubPicker usa:
    // aquele branco a 6% desaparece sobre a porcelana do tema claro.
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    minWidth: 26,
    textAlign: 'center',
  },
});
