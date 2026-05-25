import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Optional count badge rendered next to the label (e.g. 17). */
  count?: number;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const labelColor = selected ? tokens.text.hi : tokens.text.mid;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segmentWrap,
              selected && styles.segmentWrapSelected,
              pressed && { opacity: 0.85 },
            ]}
          >
            {selected && (
              <LinearGradient
                colors={tokens.gradient.taskCheckBtn}
                locations={tokens.gradient.taskCheckBtnLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFillObject, styles.selectedFill]}
              />
            )}
            <View style={styles.segmentInner}>
              <Text style={[styles.label, { color: labelColor }]}>{opt.label}</Text>
              {opt.count != null && (
                <View
                  style={[
                    styles.countChip,
                    selected
                      ? { backgroundColor: 'rgba(255,255,255,0.22)' }
                      : { backgroundColor: tokens.bg.glass },
                  ]}
                >
                  <Text style={[styles.countText, { color: labelColor }]}>
                    {opt.count}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  segmentWrap: {
    flex: 1,
    borderRadius: tokens.radius.sm,
    overflow: 'visible',
    position: 'relative',
  },
  segmentWrapSelected: {
    // Violet halo around the selected pill — picks up the same vibe
    // as the home XP/check button gradient. Drives the "glow" the
    // user asked for on the filter tabs.
    shadowColor: tokens.brand.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
    boxShadow: '0px 4px 14px rgba(123, 92, 255, 0.55)',
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.sm,
  },
  selectedFill: {
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.55)',
  },
  label: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countChip: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
