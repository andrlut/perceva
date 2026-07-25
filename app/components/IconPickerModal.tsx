import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { tokens } from '@/theme';

interface Props {
  visible: boolean;
  /** Sheet header — pass the form's icon field label. */
  title: string;
  /** Curated icon list — each form keeps its own constant and passes it in. */
  icons: readonly string[];
  /** Current selection. `null` = auto (only meaningful when `autoIcon` is set). */
  value: string | null;
  onSelect: (name: string | null) => void;
  onClose: () => void;
  /** Domain accent — violet for práticas, coin-gold for rewards. */
  accentColor: string;
  accentBg: string;
  /**
   * When set, prepend an "Auto" cell rendering this icon; tapping it maps
   * to `onSelect(null)` (clear the override, inherit at render time).
   */
  autoIcon?: string;
  autoA11yLabel?: string;
}

/**
 * Bottom-sheet icon picker shared by the práticas and reward forms.
 * Replaces the old inline 40+ cell grids that pushed the forms'
 * mandatory sections ~500px down. One tap = select + close; scrim tap
 * or Android back closes without changing the selection.
 */
export function IconPickerModal({
  visible,
  title,
  icons,
  value,
  onSelect,
  onClose,
  accentColor,
  accentBg,
  autoIcon,
  autoA11yLabel,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const selectedStyle = { borderColor: accentColor, backgroundColor: accentBg };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android back closes only the picker, never the form behind it.
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        {/* stopPropagation so taps inside the sheet (grid, padding) don't
            bubble to the scrim's close handler. */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            // ~62% of the window keeps the sheet usable on small screens
            // (43 cells overflow a single fold) without covering the form
            // header entirely.
            style={{ maxHeight: Math.round(windowHeight * 0.62) }}
            contentContainerStyle={styles.grid}
          >
            {autoIcon != null && (
              <Pressable
                onPress={() => {
                  onSelect(null);
                  onClose();
                }}
                style={[styles.cell, value === null && selectedStyle]}
                accessibilityLabel={autoA11yLabel}
              >
                <Ionicons
                  name={autoIcon as never}
                  size={22}
                  color={value === null ? accentColor : tokens.text.mid}
                />
              </Pressable>
            )}
            {icons.map((name) => {
              const selected = name === value;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    onSelect(name);
                    onClose();
                  }}
                  style={[styles.cell, selected && selectedStyle]}
                >
                  <Ionicons
                    name={name as never}
                    size={22}
                    color={selected ? accentColor : tokens.text.mid}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: tokens.space[4],
    paddingBottom: tokens.space[6],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
    marginBottom: tokens.space[3],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
    paddingHorizontal: 4,
    marginBottom: tokens.space[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
    paddingBottom: tokens.space[2],
  },
  cell: {
    width: 52,
    height: 52,
    borderRadius: tokens.radius.md,
    // bg.base for contrast — the sheet itself is surface-colored
    // (same trick as TaskActionSheet's actionIcon tiles).
    backgroundColor: tokens.bg.base,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
