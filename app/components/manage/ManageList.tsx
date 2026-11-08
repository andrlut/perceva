import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
} from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/** How far the finger travels after grabbing the handle before the row
 *  starts following it. Small: the handle is the only thing that calls
 *  `drag`, and the list's pan gesture is confined to the handle column
 *  (`MANAGE_DRAG_HIT_SLOP`), so this no longer has to keep a long-press
 *  from stealing the scroll. */
export const MANAGE_DRAG_ACTIVATION_DISTANCE = 6;
/** The handle column: 44dp, the row's full height. */
export const MANAGE_DRAG_HANDLE_WIDTH = 44;
/** The drag pan only exists over the rightmost handle column (44dp + the
 *  16dp gutter). Body swipes then have no competing gesture and scroll
 *  natively — on Android a 6dp activation would otherwise beat the 8dp
 *  scroll slop and eat slow-starting scrolls. */
export const MANAGE_DRAG_HIT_SLOP = { right: 0, width: MANAGE_DRAG_HANDLE_WIDTH + tokens.space[4] };

/**
 * The drag list's OUTER container. react-native-draggable-flatlist wraps
 * its FlatList in an Animated.View styled only by `containerStyle`, with no
 * flex of its own — so under the fixed doors it grew to the full content
 * height, ran past the bottom of the screen and the end could never be
 * scrolled into view (Arquivadas unreachable in práticas, "Nova recompensa"
 * cut in recompensas). flex: 1 makes it the scroll viewport.
 */
export const MANAGE_LIST_CONTAINER = { flex: 1 } as const;

/**
 * The scrolling region under the fixed block (top bar, doors, tip, search).
 * The band of plain screen above it is the point: a row scrolled up is
 * clipped at THIS edge, a breath below the doors, instead of flush against
 * them — flush, the list read as invading the doors (owner, 2026-11-07).
 * No fade over the edge: ScreenBackground is a vertical gradient, so a
 * flat-colored fade would draw its own seam, at a height that moves with
 * the tip and the search field.
 */
export function ManageListArea({ children }: { children: ReactNode }) {
  return <View style={styles.area}>{children}</View>;
}

/** Bottom padding of a Gerenciar list. The screen's SafeAreaView already
 *  takes the bottom inset, so this is only breathing room under the last
 *  element (an open Arquivadas included) — adding the nav clearance again
 *  counted the inset twice. What made the end unreachable was the list's
 *  missing flex (MANAGE_LIST_CONTAINER), not this padding. */
export function useManageListBottomPad(): number {
  return tokens.space[8];
}

/** The search field under the doors (opened by the header's magnifier). */
export function ManageSearchField({
  value,
  onChangeText,
  placeholder,
  autoFocus = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  /** Off in the guide's replica — it would pop the keyboard. */
  autoFocus?: boolean;
}) {
  const { t } = useT();
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={16} color={tokens.text.dim} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.text.faint}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
      />
      {value.length > 0 && (
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

/**
 * The manage row's chassis, shared by práticas and recompensas: gradient
 * surface, accent bar on the left, the body (tap → edit) and the handle on
 * the right. Each screen fills the body with its own content
 * (PracticeManageRow, RewardManageRow) and wraps the whole thing in the
 * drag library's ScaleDecorator.
 *
 * The handle is the only thing that starts a drag (`onPressIn`, so the row
 * lifts at once, no long-press wait); the rest of the row keeps scrolling
 * and tapping. It is hidden from assistive tech — a press-in never reaches
 * it — so reorder lives in the body's accessibility actions instead.
 */
export function ManageRowShell({
  accent,
  isActive = false,
  onEdit,
  onHandlePressIn,
  onHandlePress,
  editA11yLabel,
  a11yValue,
  accessibilityActions,
  onAccessibilityAction,
  children,
}: {
  accent: string;
  isActive?: boolean;
  onEdit: () => void;
  /** The drag library's `drag` on the screens. */
  onHandlePressIn?: () => void;
  /** The guide's playground: a tap on the handle stands in for a drag. */
  onHandlePress?: () => void;
  editA11yLabel: string;
  a11yValue?: string;
  accessibilityActions?: readonly AccessibilityActionInfo[];
  onAccessibilityAction?: (e: AccessibilityActionEvent) => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.rowWrap}>
      <View style={[styles.row, { borderLeftColor: accent }, isActive && styles.rowActive]}>
        <LinearGradient
          colors={tokens.gradient.taskCard}
          locations={tokens.gradient.taskCardLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable
          onPress={onEdit}
          disabled={isActive}
          style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={editA11yLabel}
          accessibilityValue={a11yValue ? { text: a11yValue } : undefined}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
        >
          {children}
        </Pressable>
        <Pressable
          onPressIn={onHandlePressIn}
          onPress={onHandlePress}
          disabled={isActive}
          style={({ pressed }) => [styles.dragHandle, pressed && styles.dragHandlePressed]}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Ionicons
            name="reorder-three"
            size={22}
            color={isActive ? tokens.brand.violet2 : tokens.text.mid}
          />
        </Pressable>
      </View>
    </View>
  );
}

/** Text pieces both rows' bodies share (and the archived rows). */
export const manageRowStyles = StyleSheet.create({
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  // 9px text.mid — 8px text.dim on the 6% wash sat around 3.3:1.
  chipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: tokens.text.mid,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

const styles = StyleSheet.create({
  area: {
    flex: 1,
    marginTop: tokens.space[3],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: tokens.space[3],
    marginHorizontal: tokens.space[4],
    height: 40,
    marginTop: tokens.space[3],
  },
  searchInput: {
    flex: 1,
    color: tokens.text.hi,
    ...tokens.type.body,
    paddingVertical: 0,
  },
  rowWrap: {
    marginBottom: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  rowActive: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(155,130,255,0.10)',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 4,
  },
  // 44dp wide, the row's full height: a thumb lands on it without aiming.
  dragHandle: {
    width: MANAGE_DRAG_HANDLE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: tokens.border.divider,
  },
  // Sits ABOVE the card gradient (the handle is a sibling of it), so the
  // wash actually shows — violetGlow is 0.45 dark / 0.22 light.
  dragHandlePressed: {
    backgroundColor: tokens.brand.violetGlow,
  },
});
