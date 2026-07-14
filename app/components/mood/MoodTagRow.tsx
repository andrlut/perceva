import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMoodTags } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  selected: string[];
  onToggle: (slug: string) => void;
}

/**
 * Optional, capped, single-tap tag chips shown after the 1-5 rating. Toggling
 * a chip never gates save — it's a vocabulary aid, not data entry. Labels come
 * from the bilingual mood_tag catalog (client picks the column by locale).
 */
export function MoodTagRow({ selected, onToggle }: Props) {
  const { locale } = useT();
  const tags = useMoodTags();

  if (!tags.data || tags.data.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {tags.data.map((tag) => {
        const active = selected.includes(tag.slug);
        const label = locale === 'en' ? tag.label_en : tag.label_pt;
        return (
          <Pressable
            key={tag.slug}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onToggle(tag.slug);
            }}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={2}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            {tag.emoji ? <Text style={styles.emoji}>{tag.emoji}</Text> : null}
            <Text style={[styles.label, active && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  chipActive: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
  },
  labelActive: {
    fontFamily: 'Manrope_800ExtraBold',
    color: tokens.text.hi,
  },
});
