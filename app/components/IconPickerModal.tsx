import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { useSheetBottomInset } from '@/components/useSheetBottomInset';
import { useT } from '@/lib/i18n';
import { normalizeSearch } from '@/lib/icons';
import { useKeyboardOverlap } from '@/lib/use-keyboard-height';
import {
  ICON_CATEGORIES,
  iconLabel,
  searchIcons,
  type IconCategoryId,
  type IconEntry,
} from '@/lib/icons/catalog';
import { tokens } from '@/theme';

type Chip = 'all' | IconCategoryId;

interface Props {
  visible: boolean;
  /** Sheet header — pass the form's icon field label. */
  title: string;
  /** Current selection. `null` = auto (only meaningful when `autoIcon` is set). */
  value: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  /** Domain accent — violet for práticas, coin-gold for rewards. */
  accentColor: string;
  accentBg: string;
  /**
   * When set, an "Auto" cell sits above the grid rendering this icon;
   * tapping it maps to `onSelect(null)` (clear the override, inherit at
   * render time).
   */
  autoIcon?: string;
  autoA11yLabel?: string;
}

/**
 * The ONE icon picker — práticas, recompensas and habilidades all open
 * this. Search across two families (Ionicons + MaterialCommunityIcons,
 * see lib/icons) and category chips; opens on "Todos" with the whole
 * catalog in sections. One tap = select + close; scrim tap or Android
 * back closes without changing the selection.
 */
export function IconPickerModal({
  visible,
  title,
  value,
  onSelect,
  onClose,
  accentColor,
  accentBg,
  autoIcon,
  autoA11yLabel,
}: Props) {
  const { t, locale } = useT();
  const { height: windowHeight } = useWindowDimensions();
  const sheetBottom = useSheetBottomInset();
  // A Modal is its own window: the form's KeyboardAvoidingView cannot reach
  // it, and with edge-to-edge on Android the IME simply overlays the sheet
  // (CalendarFilterSheet learned this first). Lift the sheet by the overlap
  // and keep it from growing past the top.
  const lift = useKeyboardOverlap();
  const [chip, setChip] = useState<Chip>('all');
  const [query, setQuery] = useState('');

  // Fresh sheet every time it opens: the search cleared, the chip back on
  // "Todos". Half-typed searches never leak into the next open.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setChip('all');
  }, [visible]);

  const q = normalizeSearch(query);
  const results = useMemo<IconEntry[] | null>(
    () => (q.length > 0 ? searchIcons(q, locale) : null),
    [q, locale],
  );

  const pick = (id: string | null) => {
    Haptics.selectionAsync().catch(() => {});
    onSelect(id);
    onClose();
  };

  const selectedStyle = { borderColor: accentColor, backgroundColor: accentBg };

  // "Todos" is 300+ cells in one ScrollView; build the section nodes once
  // per (chip, query, selection) instead of on every keystroke re-render.
  const sections = useMemo(() => {
    const renderCell = (id: string, key?: string) => {
      const selected = id === value;
      return (
        <Pressable
          key={key ?? id}
          onPress={() => pick(id)}
          style={[styles.cell, selected && selectedStyle]}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={iconLabel(id, locale)}
        >
          <AppIcon name={id} size={22} color={selected ? accentColor : tokens.text.mid} />
        </Pressable>
      );
    };

    const out: { key: string; label?: string; nodes: ReactNode[] }[] = [];
    if (results) {
      out.push({ key: 'search', nodes: results.map((e) => renderCell(e.id)) });
    } else if (chip === 'all') {
      for (const cat of ICON_CATEGORIES) {
        out.push({
          key: cat.id,
          label: t(`iconPicker.categories.${cat.id}`),
          nodes: cat.entries.map((e) => renderCell(e.id, `${cat.id}:${e.id}`)),
        });
      }
    } else {
      const cat = ICON_CATEGORIES.find((c) => c.id === chip);
      if (cat) out.push({ key: cat.id, nodes: cat.entries.map((e) => renderCell(e.id)) });
    }
    return out;
    // `pick` closes over onSelect/onClose props; listing those is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, chip, value, locale, accentColor, accentBg, t, onSelect, onClose]);

  // "Automático" sits above the grid, whatever chip is on, so clearing the
  // override is always one tap away; it steps aside while searching.
  const autoCell =
    autoIcon != null && !results ? (
      <Pressable
        onPress={() => pick(null)}
        style={[styles.cell, styles.cellAuto, value === null && selectedStyle]}
        accessibilityRole="button"
        accessibilityState={{ selected: value === null }}
        accessibilityLabel={autoA11yLabel ?? t('iconPicker.auto')}
      >
        <AppIcon name={autoIcon} size={22} color={value === null ? accentColor : tokens.text.mid} />
        {/* Label stays neutral text: the accent over its own wash misses AA
            on the violet domain (4.1:1); the border + icon carry the state. */}
        <Text style={[styles.cellAutoText, value === null && { color: tokens.text.hi }]}>
          {t('iconPicker.auto')}
        </Text>
      </Pressable>
    ) : null;

  const chips: { id: Chip; label: string; icon?: string }[] = [
    { id: 'all', label: t('iconPicker.all') },
    ...ICON_CATEGORIES.map((c) => ({
      id: c.id,
      label: t(`iconPicker.categories.${c.id}`),
      icon: c.icon,
    })),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android back closes only the picker, never the form behind it.
      onRequestClose={onClose}
    >
      <Pressable style={[styles.scrim, { paddingBottom: lift }]} onPress={onClose}>
        {/* stopPropagation so taps inside the sheet don't bubble to the
            scrim's close handler. */}
        <Pressable
          style={[
            styles.sheet,
            {
              // Lifted above the keyboard, the nav-bar inset is dead space
              // (the sheet's bottom sits on the IME, not on the bar).
              paddingBottom: lift > 0 ? tokens.space[6] : sheetBottom,
              maxHeight: Math.min(
                Math.round(windowHeight * 0.88),
                windowHeight - lift - tokens.space[10],
              ),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {value != null && (
              <View style={[styles.previewPill, { borderColor: accentColor, backgroundColor: accentBg }]}>
                <AppIcon name={value} size={16} color={accentColor} />
                <Text style={styles.previewText} numberOfLines={1}>
                  {iconLabel(value, locale)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={tokens.text.dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('iconPicker.searchPlaceholder')}
              placeholderTextColor={tokens.text.faint}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel={t('common.clear')}
              >
                <Ionicons name="close-circle" size={16} color={tokens.text.dim} />
              </Pressable>
            )}
          </View>

          {/* Category chips — hidden while searching: results span all. */}
          {!results && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsRow}
              keyboardShouldPersistTaps="handled"
            >
              {chips.map((c) => {
                const on = chip === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      if (!on) Haptics.selectionAsync().catch(() => {});
                      setChip(c.id);
                    }}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[
                      styles.chip,
                      on
                        ? { backgroundColor: accentBg, borderColor: `${accentColor}80` }
                        : { backgroundColor: 'transparent', borderColor: tokens.border.base },
                    ]}
                  >
                    {c.icon ? (
                      <AppIcon name={c.icon} size={13} color={on ? accentColor : tokens.text.dim} />
                    ) : null}
                    {/* Selected label in neutral hi text: the accent over its
                        own wash is 4.1:1 on the violet domain. Border + icon
                        carry the accent. */}
                    <Text
                      style={[
                        styles.chipText,
                        { color: on ? tokens.text.hi : tokens.text.mid },
                        on && { fontFamily: 'Manrope_800ExtraBold' },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {autoCell ? <View style={styles.grid}>{autoCell}</View> : null}
            {results && results.length === 0 ? (
              <Text style={styles.empty}>{t('iconPicker.noResults', { query: query.trim() })}</Text>
            ) : (
              sections.map((s) => (
                <View key={s.key} style={styles.section}>
                  {s.label ? <Text style={styles.sectionLabel}>{s.label.toUpperCase()}</Text> : null}
                  <View style={styles.grid}>{s.nodes}</View>
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Cell edge: six per row on a 360dp phone (360 − 2×16 padding − 5×8 gaps = 328 = 6×48 + 5×8). */
const CELL = 48;

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
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[4],
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
    paddingHorizontal: 4,
    marginBottom: tokens.space[3],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 10,
    height: 28,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    maxWidth: 180,
  },
  previewText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.base,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: tokens.space[3],
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: tokens.text.hi,
    ...tokens.type.body,
    paddingVertical: 0,
  },
  // A ScrollView defaults to flexShrink 1; with the whole catalog below,
  // the sheet's column would take the overflow out of THIS row too and
  // clip the chips. Fixed height + no shrink: the body is the only thing
  // that gives.
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 36,
    marginHorizontal: -tokens.space[4],
    marginTop: tokens.space[3],
  },
  chipsRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 32,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: tokens.space[3],
  },
  bodyContent: {
    paddingBottom: tokens.space[2],
    gap: tokens.space[4],
  },
  section: {
    gap: tokens.space[2],
  },
  sectionLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: tokens.text.dim,
    paddingHorizontal: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: tokens.radius.md,
    // bg.base for contrast — the sheet itself is surface-colored
    // (same trick as TaskActionSheet's actionIcon tiles).
    backgroundColor: tokens.bg.base,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The Auto cell is a double-width tile so its word fits.
  cellAuto: {
    width: CELL * 2 + tokens.space[2],
    flexDirection: 'row',
    gap: 6,
  },
  cellAutoText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  empty: {
    ...tokens.type.body,
    color: tokens.text.dim,
    textAlign: 'center',
    paddingVertical: tokens.space[6],
  },
});
