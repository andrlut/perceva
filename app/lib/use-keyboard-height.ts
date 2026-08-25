import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Raw on-screen keyboard height as the platform reports it (0 when dismissed).
 *
 * **On Android this is not the full keyboard.** From API 30 React Native
 * computes the event payload as `imeInsets.bottom - barInsets.bottom` — the
 * keyboard height MINUS the navigation bar (`ReactRootView.checkForKeyboardEvents`).
 * That subtraction assumes a container whose bottom edge already stops above
 * the navigation bar, which is true for a `SafeAreaView` that includes the
 * `'bottom'` edge and false for anything drawing edge-to-edge — and this app
 * ships `android.edgeToEdgeEnabled`, so most screens are the latter.
 *
 * So: use THIS hook only when the container is already inset at the bottom.
 * Otherwise use {@link useKeyboardOverlap}, which adds the missing band back.
 * Getting it backwards is visible either way — too little padding hides content
 * under the keyboard, too much opens a dead navigation-bar-sized gap above it.
 *
 *   const kb = useKeyboardHeight();
 *   <ScrollView
 *     contentContainerStyle={[styles.content, kb > 0 && { paddingBottom: kb + 64 }]}
 *   />
 *
 * Pair with a small extra buffer for the keyboard's suggestion/tool bar, which
 * `endCoordinates.height` doesn't always include.
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

/**
 * How much of a container the keyboard actually covers, for a container whose
 * bottom edge is the **physical bottom of the screen**: anything without a
 * bottom safe-area inset, and every React Native `Modal` (its window is its
 * own, and `edgeToEdgeEnabled` makes it edge-to-edge).
 *
 * This is {@link useKeyboardHeight} plus the navigation-bar band that Android
 * leaves out from API 30 on — roughly 48dp with three-button navigation, ~24dp
 * with gestures. Below API 30 React Native takes the legacy path, which already
 * reports the full height, so nothing is added there; on iOS the reported value
 * already spans to the bottom of the screen.
 *
 * Pick between the two by asking one question about the container you are
 * padding: **does its bottom edge stop above the navigation bar?** A
 * `SafeAreaView edges={['top','bottom']}` does — use `useKeyboardHeight`. A
 * `SafeAreaView edges={['top']}`, a bare `View`, or a `Modal` does not — use
 * this one.
 */
export function useKeyboardOverlap(): number {
  const height = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  if (height <= 0) return 0;
  const navGap =
    Platform.OS === 'android' && Number(Platform.Version) >= 30 ? insets.bottom : 0;
  return height + navGap;
}
