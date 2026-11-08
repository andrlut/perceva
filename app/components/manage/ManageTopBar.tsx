import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The header of the two Gerenciar screens (/tasks and /rewards-manage) —
 * ONE pattern for both, so nobody learns two (owner, 2026-11-07):
 *
 *   back · title · calendar · search · (i)
 *
 * Every control is the same 40dp surfaced chip (the header's one control
 * kind, as in Minhas ideias). The free-plan counter is NOT here: it rides
 * on the "Criar a minha" door, the button it is about (ManageDoors).
 */
export function ManageTopBar({
  title,
  onBack,
  onCalendar,
  calendarLabel,
  searchOpen,
  onToggleSearch,
  searchOpenLabel,
  searchCloseLabel,
  onInfo,
  infoLabel,
}: {
  title: string;
  onBack: () => void;
  onCalendar: () => void;
  calendarLabel: string;
  searchOpen: boolean;
  onToggleSearch: () => void;
  searchOpenLabel: string;
  searchCloseLabel: string;
  onInfo: () => void;
  infoLabel: string;
}) {
  const { t } = useT();
  return (
    <View style={styles.bar}>
      <ManageIconButton icon="chevron-back" iconSize={22} onPress={onBack} a11yLabel={t('common.back')} />
      {/* Both titles are ~190px at h3; a 360dp phone leaves ~140 between
          the back chip and the three actions. Shrinks instead of
          ellipsizing. */}
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
        {title}
      </Text>
      <View style={styles.actions}>
        <ManageIconButton icon="calendar-outline" onPress={onCalendar} a11yLabel={calendarLabel} />
        <ManageIconButton
          icon={searchOpen ? 'close' : 'search'}
          active={searchOpen}
          onPress={onToggleSearch}
          a11yLabel={searchOpen ? searchCloseLabel : searchOpenLabel}
        />
        <ManageIconButton
          icon="information-circle-outline"
          iconSize={22}
          onPress={onInfo}
          a11yLabel={infoLabel}
        />
      </View>
    </View>
  );
}

/** One 40dp header chip. Exported for the guides' replicas. */
export function ManageIconButton({
  icon,
  onPress,
  a11yLabel,
  active = false,
  iconSize = 20,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  a11yLabel: string;
  active?: boolean;
  iconSize?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, active && styles.buttonActive, pressed && { opacity: 0.6 }]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <Ionicons name={icon} size={iconSize} color={active ? tokens.brand.violet2 : tokens.text.hi} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    flex: 1,
    marginLeft: tokens.space[1],
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.space[2],
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  buttonActive: {
    backgroundColor: 'rgba(123,92,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123,92,255,0.4)',
  },
});
