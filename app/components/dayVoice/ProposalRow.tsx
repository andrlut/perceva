import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

/**
 * One line of the "Conte seu dia" card — what the AI understood, one
 * proposal per row: a checkbox (unchecking drops just that line), a leading
 * mark, the line itself and an optional reward on the right. `children`
 * renders under the text (the face row to change the mood, the note editor,
 * the tag chips). Every row has the same anatomy, so the card reads as a list
 * of siblings. Also the replica in the screen's guide.
 */
export function ProposalRow({
  checked,
  onToggle,
  leading,
  title,
  detail,
  reward,
  onPressBody,
  bodyA11y,
  children,
}: {
  checked: boolean;
  onToggle?: () => void;
  leading: React.ReactNode;
  title: React.ReactNode;
  detail?: string | null;
  reward?: React.ReactNode;
  onPressBody?: () => void;
  bodyA11y?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.row, !checked && styles.rowOff]}>
      <View style={styles.top}>
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={[styles.check, checked && styles.checkOn]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          {checked ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
        </Pressable>
        <View style={styles.leading}>{leading}</View>
        <Pressable
          onPress={onPressBody}
          disabled={!onPressBody}
          style={styles.body}
          accessibilityRole={onPressBody ? 'button' : undefined}
          accessibilityLabel={bodyA11y}
        >
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {detail ? (
            <Text style={styles.detail} numberOfLines={3}>
              {detail}
            </Text>
          ) : null}
        </Pressable>
        {reward ? <View style={styles.reward}>{reward}</View> : null}
      </View>
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: tokens.bg.surface2,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    gap: tokens.space[2],
  },
  rowOff: {
    opacity: 0.5,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: tokens.brand.violet,
    borderColor: tokens.brand.violet,
  },
  leading: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.hi,
  },
  detail: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.dim,
  },
  reward: {
    alignItems: 'flex-end',
  },
  children: {
    paddingLeft: 24 + 30 + tokens.space[3] * 2,
  },
});
