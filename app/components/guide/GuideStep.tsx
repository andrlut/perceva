import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

/**
 * One step of a screen's guide (the (i) sheet): a round icon badge, the
 * keyword in bold, one or two short sentences — and, under them, a REPLICA
 * of the on-screen element the step is about, drawn with the screen's own
 * components. Seeing the actual pill, strip or box is what makes "where is
 * that?" answer itself.
 *
 * The replica is inert (pointerEvents none) and hidden from screen readers:
 * the sentence already says it, and a fake button TalkBack could focus would
 * be a lie. Every step has the same anatomy, so a guide reads as a list of
 * siblings and new screens only fill in content.
 */
export function GuideStep({
  icon,
  iconColor = tokens.brand.violet2,
  title,
  body,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={styles.col}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {children ? (
          <View
            style={styles.replica}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {children}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** The small uppercase label that splits a guide into its parts. */
export function GuideLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  // Same badge as the Conector rows — sibling rows, one anatomy.
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.35)',
  },
  col: { flex: 1, minWidth: 0, gap: 3, paddingTop: 1 },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.base,
  },
  replica: { marginTop: 8, gap: 8 },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
});
