import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The controls of "Minhas ideias", shared by the screen and by its guide
 * (CollectionGuide): the guide draws these very components, so the (i)
 * shows exactly what is on screen and can never drift from it. With no
 * handler they render inert — that is the guide's replica.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Filter pill — tinted fill + solid rim in violet when selected.
// ─────────────────────────────────────────────────────────────────────────────

export function FilterPill({
  label,
  iconName,
  active,
  onPress,
}: {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress?: () => void;
}) {
  const accent = tokens.brand.violet2;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.pill,
        active && { backgroundColor: accent + '22', borderColor: accent },
        pressed && { opacity: 0.8 },
      ]}
    >
      {iconName && (
        <Ionicons name={iconName} size={13} color={active ? accent : tokens.text.mid} />
      )}
      <Text style={[styles.pillText, active && { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "N pra revisar" — the strip that opens the review pile.
// ─────────────────────────────────────────────────────────────────────────────

export function ReviewStrip({
  count,
  onPress,
  style,
}: {
  count: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.strip, style, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.stripIcon}>
        <Ionicons name="layers-outline" size={17} color={tokens.brand.violet2} />
      </View>
      <View style={styles.stripText}>
        <Text style={styles.stripTitle}>
          {t('learning.ideas.review.fabPending', { count })}
        </Text>
        <Text style={styles.stripBody} numberOfLines={1}>
          {t('learning.ideas.review.stripBody')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.text.mid} />
    </Pressable>
  );
}

/**
 * "Estudar favoritas" — the review strip's twin, in the favorites' gold: it
 * opens the study deck (/idea-study). Without `onPress` it is the guide's
 * replica.
 */
export function StudyStrip({
  count,
  onPress,
  style,
}: {
  count: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.strip, styles.stripGold, style, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.stripIcon, styles.stripIconGold]}>
        <Ionicons name="school-outline" size={17} color={tokens.semantic.coinLight} />
      </View>
      <View style={styles.stripText}>
        <Text style={styles.stripTitle}>{t('learning.ideas.study.title')}</Text>
        <Text style={styles.stripBody} numberOfLines={1}>
          {t('learning.ideas.study.stripBody', { count })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.text.mid} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search box. Without `onChangeText` it draws the placeholder as plain text
// (the guide's replica — nothing focusable inside a help sheet).
// ─────────────────────────────────────────────────────────────────────────────

export function IdeaSearchBox({
  value,
  onChangeText,
  style,
}: {
  value: string;
  onChangeText?: (v: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  return (
    <View style={[styles.search, style]}>
      <Ionicons name="search" size={16} color={tokens.text.dim} />
      {onChangeText ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('learning.ideas.searchPlaceholder')}
          placeholderTextColor={tokens.text.faint}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      ) : (
        <Text style={[styles.searchInput, styles.searchPlaceholder]} numberOfLines={1}>
          {t('learning.ideas.searchPlaceholder')}
        </Text>
      )}
      {onChangeText && value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}
        >
          <Ionicons name="close-circle" size={16} color={tokens.text.dim} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.glass,
  },
  pillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
    color: tokens.text.mid,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.35)',
    backgroundColor: 'rgba(123, 92, 255, 0.10)',
  },
  stripGold: {
    borderColor: tokens.semantic.coinRim,
    backgroundColor: 'rgba(255, 200, 61, 0.08)',
  },
  stripIconGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.16)',
  },
  stripIcon: {
    width: 34,
    height: 34,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
  },
  stripText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  stripTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  stripBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
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
  searchPlaceholder: { color: tokens.text.faint },
});
