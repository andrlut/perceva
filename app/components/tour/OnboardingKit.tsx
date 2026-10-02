import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { tokens } from '@/theme';

/**
 * The onboarding's one visual system — intro pages, starter pack and the
 * closing screen all draw their title, the line under it and their buttons
 * from here, so no screen invents its own size (owner feedback 2026-09-30:
 * cohesion of element sizes within and across the tutorial's screens).
 *
 *   title      28/33 ExtraBold   — one per screen (a pillar or domain name
 *                                   takes its colour through `color`)
 *   subtitle   16/22 SemiBold    — the one line that says what the thing is
 *                                   or how it is done in the app
 *   primary    54 high, violet   — the brand action (never gold: gold is
 *                                   the coins domain)
 *   secondary  50 high, outline
 *   text       44 high, no chrome — "Pular" and other ways out
 *
 * Every screen also shares the same TOP: the brand bar (52) and the header
 * band starting ONB_PAGE_TOP below it, title in a 44-high row. As the user
 * swipes, every title sits at the same height (owner feedback 2026-09-30:
 * "a leitura não começa a cada hora em uma altura diferente").
 */

export const ONB_TOPBAR_H = 52;
export const ONB_PAGE_TOP = 16;
/** Title row (44) + gap (8) + a two-line subtitle (44): the header's budget. */
export const ONB_HEADER_H = 96;

export const ONB_BTN_H = 54;
export const ONB_SECONDARY_H = 50;
export const ONB_TEXT_BTN_H = 44;
export const ONB_BTN_GAP = 10;

/** The brand bar every onboarding screen opens with; `right` holds a way out. */
export function OnbTopBar({ right }: { right?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.brand}>
        <PercevaGlyph size={24} palette="primary" idSuffix="onb-topbar" />
        <Text style={styles.brandText}>Perceva</Text>
      </View>
      {right}
    </View>
  );
}

/**
 * Title + the one line under it, in a fixed band: the title row is at least
 * 44 high (the badge's height), so pages with and without a badge put their
 * title at the same height.
 */
export function OnbHeader({
  title,
  subtitle,
  color,
  badge,
}: {
  title: string;
  subtitle?: ReactNode;
  color?: string;
  badge?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {badge}
        <OnbTitle color={color}>{title}</OnbTitle>
      </View>
      {subtitle != null ? <OnbSubtitle>{subtitle}</OnbSubtitle> : null}
    </View>
  );
}

/** The round icon next to a domain title (⚡ Dedicação, the coin). */
export function OnbBadge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}24`, borderColor: `${color}66` }]}>
      {children}
    </View>
  );
}

/**
 * Shrinks a fixed-size drawing to fit `maxHeight`. Layout ignores transforms,
 * so the measured height is always the natural one and never loops.
 */
export function FitBox({
  maxHeight,
  width,
  children,
}: {
  maxHeight: number;
  /**
   * Required by stretch-based children (rows of flex:1 cards): the inner
   * view shrink-wraps, so without a definite width their flex basis
   * collapses to zero and the cards render as empty slivers.
   */
  width?: number;
  children: ReactNode;
}) {
  const [natural, setNatural] = useState(0);
  const scale = natural > 0 && maxHeight > 0 ? Math.min(1, maxHeight / natural) : 1;
  return (
    <View style={[styles.fitOuter, natural > 0 ? { height: natural * scale } : null]}>
      <View
        onLayout={(e) => setNatural(e.nativeEvent.layout.height)}
        style={[{ transform: [{ scale }] }, width != null ? { width } : null]}
      >
        {children}
      </View>
    </View>
  );
}

export function OnbTitle({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <Text style={[styles.title, color ? { color } : null]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function OnbSubtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function OnbPrimaryButton({
  label,
  icon = 'arrow-forward',
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.primaryWrap,
        pressed && styles.primaryPressed,
        disabled && !busy && styles.dimmed,
      ]}
    >
      <LinearGradient
        colors={tokens.gradient.completeBtn}
        locations={tokens.gradient.completeBtnLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.primary}
      >
        {busy ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text style={styles.primaryText} numberOfLines={1}>
          {label}
        </Text>
        {!busy ? <Ionicons name={icon} size={19} color="#FFFFFF" /> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function OnbSecondaryButton({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.secondary,
        pressed && styles.pressed,
        disabled && !busy && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={tokens.text.hi} />
      ) : (
        <Text style={styles.secondaryText} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function OnbTextButton({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}
    >
      {busy ? (
        <ActivityIndicator color={tokens.text.hi} />
      ) : (
        <Text style={styles.textBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: ONB_TOPBAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: tokens.space[5],
    paddingRight: tokens.space[3],
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  brandText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    lineHeight: 21,
    color: tokens.text.hi,
    letterSpacing: 0.2,
  },
  header: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  headerRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[3],
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitOuter: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    lineHeight: 33,
    color: tokens.text.hi,
    textAlign: 'center',
    flexShrink: 1,
  },
  subtitle: {
    alignSelf: 'center',
    maxWidth: 320,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: tokens.text.base,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  dimmed: {
    opacity: 0.55,
  },
  primaryWrap: {
    borderRadius: tokens.radius.md,
    ...tokens.shadow.violetGlowSoft,
  },
  primaryPressed: {
    transform: [{ scale: 0.98 }],
  },
  primary: {
    height: ONB_BTN_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: tokens.space[4],
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  secondary: {
    height: ONB_SECONDARY_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.glass,
    paddingHorizontal: tokens.space[4],
  },
  secondaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  textBtn: {
    height: ONB_TEXT_BTN_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
  },
  textBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.mid,
  },
});
