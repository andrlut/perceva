import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/theme';

/**
 * Bottom padding for edge-docked bottom sheets. The design's space[6]
 * floor, grown by the device's bottom inset so the last row (usually
 * "Cancelar") never sits behind system UI — the 3-button Android nav
 * bar and the iOS home indicator report a non-zero inset; gesture-nav
 * Androids report ~0 and keep the original look.
 */
export function useSheetBottomInset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(tokens.space[6], insets.bottom + tokens.space[3]);
}
