import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { ACTIVE_THEME, tokens } from '@/theme';

/**
 * Page 6 body — what the guided tour does, and the promise that skipping
 * is safe. The promise is the loudest thing on the page on purpose (the
 * owner's brief: "bastante destaque"): a first user who is unsure should
 * feel free to skip, because the exact place to redo it is named.
 *
 * The two actions live in the pager's footer, not here, so the primary
 * button sits exactly where "Continuar" sat on every page before.
 */

const ITEMS: { key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'item1', icon: 'checkmark-circle-outline' },
  { key: 'item2', icon: 'happy-outline' },
  { key: 'item3', icon: 'add-circle-outline' },
  { key: 'item4', icon: 'gift-outline' },
  { key: 'item5', icon: 'person-circle-outline' },
];

export function TourChecklist() {
  const { t } = useT();
  return (
    <View style={styles.list}>
      {ITEMS.map((item) => (
        <View key={item.key} style={styles.item}>
          <Ionicons name={item.icon} size={20} color={tokens.brand.violet2} />
          <Text style={styles.itemText}>{t(`tour.intro.choice.${item.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}

export function SkipIsSafe() {
  const { t } = useT();
  const light = ACTIVE_THEME === 'light';
  return (
    <View style={styles.safeOuter} accessible accessibilityRole="summary">
      <LinearGradient
        colors={
          light
            ? ['rgba(242, 178, 27, 0.14)', 'rgba(106, 75, 244, 0.08)']
            : ['rgba(255, 200, 61, 0.16)', 'rgba(123, 92, 255, 0.14)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.safe}
      >
        <View style={styles.safeHead}>
          <View style={styles.safeIcon}>
            <Ionicons name="refresh" size={24} color={tokens.semantic.coinLight} />
          </View>
          <Text style={styles.safeTitle}>{t('tour.intro.choice.safeTitle')}</Text>
        </View>
        <Text style={styles.safeBody}>{t('tour.intro.choice.safeBody')}</Text>
        <View style={styles.path}>
          <Ionicons name="settings-outline" size={16} color={tokens.text.hi} />
          <Text style={styles.pathText}>{t('tour.intro.choice.safePath')}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'center',
    gap: tokens.space[2],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  itemText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.base,
  },
  safeOuter: {
    alignSelf: 'stretch',
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
    overflow: 'hidden',
    marginTop: tokens.space[2],
    ...tokens.shadow.coinGlowSoft,
  },
  safe: {
    padding: tokens.space[4],
    gap: tokens.space[2],
  },
  safeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  safeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.18)',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  safeTitle: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 19,
    lineHeight: 24,
    color: tokens.text.hi,
  },
  safeBody: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.base,
  },
  path: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  pathText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 19,
    color: tokens.text.hi,
  },
});
