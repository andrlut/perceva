import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useKeyboardOverlap } from '@/lib/use-keyboard-height';

/**
 * Lifts anything rendered inside a `<Modal>` above the on-screen keyboard.
 *
 * **Reach for this, never `KeyboardAvoidingView`, inside a Modal.** Two facts
 * make the obvious solution fail on Android, and the app shipped the broken
 * version in three sheets before this component existed:
 *
 * 1. The idiom that got copied around —
 *    `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — is a
 *    **no-op on Android**: with no behavior the view does nothing at all, so
 *    the sheet just sits under the keyboard.
 * 2. Changing the behavior does not rescue it either. React Native's `Modal`
 *    is its own window, and the activity's `adjustResize` (Expo's default
 *    `softwareKeyboardLayoutMode`) never resizes that window, so the view
 *    inside it is never told the keyboard is there.
 *
 * The measurement itself comes from `useKeyboardOverlap`, which is the right
 * one for a Modal: a Modal's window is edge-to-edge, and from API 30 React
 * Native reports the keyboard height *minus* the navigation bar — that hook
 * adds the missing band back. (`useKeyboardHeight`, its sibling, is for
 * containers already inset at the bottom, like a `SafeAreaView` with the
 * `'bottom'` edge.)
 *
 * The sheet inside usually keeps a `useSheetBottomInset()` padding for the
 * home indicator; while the keyboard is up that inset buys nothing, so drop
 * it then rather than stacking the two (see `IdeaNoteSheet`).
 */
interface Props {
  children: ReactNode;
  /** The backdrop style — usually `flex: 1` + `justifyContent: 'flex-end'`. */
  style?: StyleProp<ViewStyle>;
}

export function SheetKeyboardView({ children, style }: Props) {
  const overlap = useKeyboardOverlap();
  return <View style={[styles.root, style, { paddingBottom: overlap }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
