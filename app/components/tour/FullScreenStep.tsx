import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { ScreenBackground } from '@/components/ScreenBackground';
import { tokens } from '@/theme';

/**
 * Full-screen onboarding step — the tour's closing screen (wrap) and any
 * other one-card full screen. Layout mirrors the Perceva login hero:
 * engraved glyph at the top, eyebrow, title, body copy, an optional
 * `children` block (short notes, a list), primary CTA, and an optional
 * secondary action.
 *
 * The column scrolls: with the glyph, a two-line title and a notes block,
 * a small phone (or a large system font) runs out of height, and a CTA
 * pushed off-screen is a dead end.
 *
 * Renders inside its own SafeAreaView + ScreenBackground; the caller
 * just provides the copy + handlers.
 */

interface Props {
  eyebrow?: string;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Show the engraved glyph at the top. Default true. */
  withGlyph?: boolean;
  /** Extra content between the body and the primary CTA. */
  children?: ReactNode;
}

export function FullScreenStep({
  eyebrow,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  withGlyph = true,
  children,
}: Props) {
  const handlePrimary = () => {
    Haptics.selectionAsync().catch(() => {});
    onPrimary();
  };
  const handleSecondary = () => {
    if (!onSecondary) return;
    Haptics.selectionAsync().catch(() => {});
    onSecondary();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground withGoldHalo>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {withGlyph && (
            <View style={styles.glyphWrap}>
              <PercevaGlyph size={96} palette="gilded" idSuffix="tour-full" />
            </View>
          )}

          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={[styles.body, children ? styles.bodyWithExtra : null]}>
            {body}
          </Text>

          {children ? <View style={styles.extra}>{children}</View> : null}

          <Pressable
            onPress={handlePrimary}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
          >
            <Text style={styles.primaryText}>{primaryLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color="#3D2A00" />
          </Pressable>

          {secondaryLabel && onSecondary && (
            <Pressable
              onPress={handleSecondary}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </Pressable>
          )}
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  content: {
    flexGrow: 1,
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[8],
    paddingBottom: tokens.space[6],
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[3],
  },
  glyphWrap: {
    marginBottom: tokens.space[5],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.8,
    color: tokens.semantic.coinLight,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: tokens.text.base,
    textAlign: 'center',
    maxWidth: 340,
    marginTop: tokens.space[2],
    marginBottom: tokens.space[5],
  },
  bodyWithExtra: {
    marginBottom: tokens.space[2],
  },
  extra: {
    alignSelf: 'stretch',
    maxWidth: 400,
    width: '100%',
    marginBottom: tokens.space[5],
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: tokens.space[5],
    paddingVertical: tokens.space[3] + 2,
    borderRadius: 999,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 138, 0.55)',
  },
  btnPressed: { opacity: 0.85 },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: '#3D2A00',
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    minHeight: 40,
    justifyContent: 'center',
    marginTop: tokens.space[2],
    paddingHorizontal: tokens.space[2],
  },
  // text.mid, not dim: dim on bg.deep sits under 4.5:1 at this size.
  secondaryText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.mid,
    textDecorationLine: 'underline',
  },
});
