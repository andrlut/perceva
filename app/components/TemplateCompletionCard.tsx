import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskTemplateWithSubs } from '@/lib/db/types';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

interface Props {
  template: TaskTemplateWithSubs;
  onComplete: () => void;
  isCompleting?: boolean;
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  daily: { label: 'D', color: tokens.brand.violet2 },
  weekly: { label: 'W', color: '#4DD0FF' },
  one_shot: { label: '1', color: tokens.semantic.coin },
  monthly: { label: 'M', color: '#4DD0FF' },
};

/**
 * Compact tap-to-complete row used in the Tasks "Geral" tab. Visually
 * lighter than the regular TaskCard since these templates aren't part
 * of the user's routine — tapping them logs a one-off completion via
 * complete_template, no adoption.
 */
export function TemplateCompletionCard({ template, onComplete, isCompleting }: Props) {
  const metaLookup = useMetaLookup();
  const subId = template.primary_sub_id;
  const dimId = SUB_META[subId]?.dimensionId ?? template.primary_dimension_id;
  const dimMeta = DIMENSION_META[dimId];
  const subLabel = metaLookup.sub(subId)?.label ?? subId;
  const typeBadge = TYPE_BADGE[template.task_type] ?? TYPE_BADGE.daily;
  return (
    <Pressable
      onPress={onComplete}
      disabled={isCompleting}
      style={({ pressed }) => [
        styles.row,
        { borderColor: `${dimMeta.color}26` },
        (pressed || isCompleting) && { opacity: 0.6 },
      ]}
      hitSlop={4}
    >
      <View style={[styles.iconBox, { backgroundColor: dimMeta.bg }]}>
        <Ionicons name={dimMeta.iconName as never} size={18} color={dimMeta.color} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {template.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.typeBadge, { borderColor: `${typeBadge.color}55` }]}>
            <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>
              {typeBadge.label}
            </Text>
          </View>
          <Text style={styles.subLabel}>{subLabel}</Text>
          <View style={styles.stars}>
            {Array.from({ length: template.total_stars }).map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={9}
                color={dimMeta.color}
              />
            ))}
          </View>
        </View>
      </View>
      <Ionicons
        name="checkmark-circle-outline"
        size={22}
        color={dimMeta.color}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.glass,
  },
  typeBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
  },
  subLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.dim,
    letterSpacing: 0.2,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
    marginLeft: 'auto',
  },
});
