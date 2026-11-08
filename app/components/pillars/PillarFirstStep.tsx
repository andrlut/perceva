import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  line: string;
  cta: string;
  onPress: () => void;
}

/**
 * The first step of an empty portrait, at the top of its pillar: Percebida
 * before the questionnaire, Desejada before the north is charted. A real
 * card with a gold rim and a solid button — the dashed boxes it replaced
 * read as disabled (feedback 24/10). It leaves once the step is done; the
 * same action then lives as a row in the pillar's closing card.
 */
export function PillarFirstStep({ icon, title, line, cta, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={tokens.semantic.coinLight} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.line}>{line}</Text>
      </View>
      <View style={styles.btn}>
        <Text style={styles.btnText}>{cta}</Text>
        <Ionicons name="arrow-forward" size={14} color={tokens.semantic.coinInk} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  line: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.mid,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  btnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinInk,
  },
});
