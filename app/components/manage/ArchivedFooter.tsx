import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { manageRowStyles } from '@/components/manage/ManageList';
import { tokens } from '@/theme';

/**
 * Arquivadas — the foot of a Gerenciar list, same on práticas and
 * recompensas. It used to be a faint eyebrow in text.mid that people
 * scrolled past without seeing (owner, 2026-11-07); now it is a real row
 * in a card, with clear space above it, that opens the archived list
 * under it.
 */
export function ArchivedFooter({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  /** The archived rows (ManageArchivedRow), shown while open. */
  children?: ReactNode;
}) {
  return (
    <View style={styles.block}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: String(count) }}
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.tile}>
          <Ionicons name="archive-outline" size={18} color={tokens.brand.violet2} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.countChip}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.text.mid} />
      </Pressable>
      {open && children ? <View style={styles.list}>{children}</View> : null}
    </View>
  );
}

/** One archived row: icon, title, a meta line, Restaurar and the trash. */
export function ManageArchivedRow({
  icon,
  title,
  meta,
  busy,
  onRestore,
  onDelete,
  restoreLabel,
  restoreA11y,
  deleteA11y,
}: {
  /** AppIcon id (bare Ionicons name or `mdi:`). */
  icon: string;
  title: string;
  meta: ReactNode;
  busy: boolean;
  onRestore: () => void;
  onDelete: () => void;
  restoreLabel: string;
  restoreA11y: string;
  deleteA11y: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[manageRowStyles.tile, styles.rowTile]}>
        <AppIcon name={icon} size={16} color={tokens.text.dim} />
      </View>
      <View style={manageRowStyles.body}>
        <Text style={[manageRowStyles.title, { color: tokens.text.mid }]} numberOfLines={1}>
          {title}
        </Text>
        {meta}
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={tokens.brand.violet2} />
      ) : (
        <>
          <Pressable
            onPress={onRestore}
            hitSlop={8}
            style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={restoreA11y}
          >
            <Ionicons name="refresh" size={14} color={tokens.brand.violet2} />
            <Text style={styles.restoreText}>{restoreLabel}</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={deleteA11y}
          >
            <Ionicons name="trash-outline" size={18} color={tokens.semantic.danger} />
          </Pressable>
        </>
      )}
    </View>
  );
}

/** The archived row's meta line style, for the screens' `meta` nodes. */
export const archivedMetaStyle = StyleSheet.create({
  text: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
  },
}).text;

const styles = StyleSheet.create({
  block: {
    marginTop: tokens.space[5],
    gap: tokens.space[2],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 56,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(155, 130, 255, 0.14)',
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  countChip: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
  },
  countText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.3,
    color: tokens.text.hi,
  },
  list: {
    gap: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rowTile: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155,130,255,0.35)',
    backgroundColor: 'rgba(155,130,255,0.1)',
  },
  restoreText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
    letterSpacing: 0.3,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
