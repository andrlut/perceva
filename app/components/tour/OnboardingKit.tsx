import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

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
 */

export const ONB_BTN_H = 54;
export const ONB_SECONDARY_H = 50;
export const ONB_TEXT_BTN_H = 44;
export const ONB_BTN_GAP = 10;

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
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    lineHeight: 33,
    color: tokens.text.hi,
    textAlign: 'center',
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
