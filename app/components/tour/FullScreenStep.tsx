import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { ScreenBackground } from '@/components/ScreenBackground';
import { OnbPrimaryButton, OnbSubtitle, OnbTextButton, OnbTitle } from '@/components/tour/OnboardingKit';
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
          <OnbTitle>{title}</OnbTitle>
          <OnbSubtitle>{body}</OnbSubtitle>

          {children ? <View style={styles.extra}>{children}</View> : null}

          <View style={styles.actions}>
            <OnbPrimaryButton label={primaryLabel} onPress={handlePrimary} />
            {secondaryLabel && onSecondary ? (
              <OnbTextButton label={secondaryLabel} onPress={handleSecondary} />
            ) : null}
          </View>
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  // Full-width actions, like the intro's footer.
  actions: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: tokens.space[2],
  },
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
  extra: {
    alignSelf: 'stretch',
    maxWidth: 400,
    width: '100%',
    marginBottom: tokens.space[5],
  },
  // text.mid, not dim: dim on bg.deep sits under 4.5:1 at this size.
});
