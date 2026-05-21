import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tracks the on-screen keyboard height (0 when dismissed).
 *
 * Use as dynamic `paddingBottom` on a ScrollView's `contentContainerStyle`
 * so the user can reach the bottom of the form while the keyboard is up.
 * Pair with a small extra buffer for the keyboard's suggestion/tool bar,
 * which `endCoordinates.height` doesn't always include.
 *
 *   const kb = useKeyboardHeight();
 *   <ScrollView
 *     contentContainerStyle={[styles.content, kb > 0 && { paddingBottom: kb + 64 }]}
 *   />
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
