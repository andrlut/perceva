import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

interface Props {
  /** Icon glyph from Ionicons. */
  iconName: keyof typeof import('@expo/vector-icons/build/Ionicons').default.glyphMap;
  /** Tone color for icon + accent — match the parent pillar. */
  accent: string;
  title: string;
  body: string;
}

/**
 * Generic placeholder for sub-pilares not yet implemented (e.g. Goals,
 * Autoconhecimento before the inventory cards land). Stays simple on
 * purpose — no card chrome, no hero — so the surrounding switcher and
 * sub-selector still feel like the focus.
 */
export function PillarPlaceholder({ iconName, accent, title, body }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBox, { borderColor: `${accent}44` }]}>
        <Ionicons name={iconName} size={32} color={accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingTop: tokens.space[8],
    paddingHorizontal: tokens.space[4],
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.glass,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
    marginTop: 4,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.dim,
    textAlign: 'center',
    maxWidth: 280,
  },
});
