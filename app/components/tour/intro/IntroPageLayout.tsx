import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OnbSubtitle, OnbTitle } from '@/components/tour/OnboardingKit';
import { ACTIVE_THEME, tokens } from '@/theme';

/**
 * Shared chrome for the method intro's pages (`/tour/intro`).
 *
 * Every page is its own vertical ScrollView inside the horizontal pager:
 * the economy pages carry a table and two cards, and on a 640dp phone they
 * do not fit above the fixed footer. `bottomPad` is the footer's height for
 * THAT page (the last page's footer holds two buttons), so the footer can
 * change shape between pages without shifting any page's content.
 */

export interface IntroPageProps {
  /** Pager page width — every page is exactly one screen wide. */
  width: number;
  /** Pager height; 0 until measured (the page then sizes to its parent). */
  height: number;
  /** Room reserved under the content for the overlaid footer. */
  bottomPad: number;
  children: ReactNode;
}

export function IntroPage({ width, height, bottomPad, children }: IntroPageProps) {
  return (
    <ScrollView
      style={height > 0 ? { width, height } : { width }}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      // Nested inside a horizontal pager: without this Android lets the
      // vertical view claim diagonal swipes and the pager feels sticky.
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  );
}

/**
 * Top of each pillar page: the three pillars as a 1-2-3 row with THIS one lit,
 * then its name. The first thing on the screen says which pillar this is; no
 * "Pilar 1" caption — the lit number already says it (owner, 2026-09-27).
 */
export function PillarHeader({
  n,
  name,
  subtitle,
  a11y,
}: {
  n: 1 | 2 | 3;
  /** The one line under the name: what this pillar is, how it's done. */
  subtitle: string;
  /** "Autoconhecimento" */
  name: string;
  /** "Pilar 1 de 3: Autoconhecimento" */
  a11y: string;
}) {
  const palette = pillarPalette();
  const hues = [palette.self, palette.practice, palette.learning];
  const current = hues[n - 1]!;
  return (
    <View style={styles.pillarHeader} accessible accessibilityRole="header" accessibilityLabel={a11y}>
      <View style={styles.stepper} importantForAccessibility="no-hide-descendants">
        {hues.map((hue, i) => {
          const on = i === n - 1;
          return (
            <View key={i} style={styles.stepCell}>
              {i > 0 && <View style={[styles.stepLine, { backgroundColor: tokens.border.strong }]} />}
              <View
                style={[
                  styles.stepDot,
                  on
                    ? { backgroundColor: hue.fill, borderColor: hue.fill, width: 34, height: 34 }
                    : { borderColor: hue.fill, opacity: 0.45 },
                ]}
              >
                <Text style={[styles.stepNum, { color: on ? tokens.bg.deep : hue.fill }]}>
                  {i + 1}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <OnbTitle color={current.ink}>{name}</OnbTitle>
      <OnbSubtitle>{subtitle}</OnbSubtitle>
    </View>
  );
}

/**
 * What the pillar gives you, as a card: icon, a few words, one short line.
 * Two per pillar page — direct about what to do and what is in the app,
 * no philosophy (owner feedback, 2026-09-26).
 */
export function PillarCard({
  icon,
  title,
  body,
  color,
  outline,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  color: string;
  /**
   * Draw the border like a shape in the drawing above it, so the card needs
   * no legend: solid = the self-assessment's filled shape, dashed = the
   * questionnaire's outline (owner feedback, 2026-09-28).
   */
  outline?: { color: string; dashed?: boolean };
  /** Visual content under the title (e.g. the six area chips). */
  children?: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { borderColor: `${color}66`, backgroundColor: `${color}14` },
        outline && {
          borderColor: outline.color,
          borderWidth: 2,
          borderStyle: outline.dashed ? 'dashed' : 'solid',
        },
      ]}
    >
      <View style={[styles.cardIcon, { backgroundColor: `${color}29` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        {body ? <Text style={styles.cardText}>{body}</Text> : null}
        {children}
      </View>
    </View>
  );
}

/**
 * Big, iconic header for the economy pages (Dedicação ⚡, Moedas 🪙): the
 * name in large type next to the same icon the app uses for it everywhere,
 * then one line saying what it does.
 */
export function EconomyHeader({
  icon,
  name,
  subtitle,
  color,
}: {
  icon: ReactNode;
  name: string;
  subtitle: string;
  color: string;
}) {
  return (
    <View style={styles.econHeader} accessible accessibilityRole="header" accessibilityLabel={`${name}. ${subtitle}`}>
      <View style={styles.econRow} importantForAccessibility="no-hide-descendants">
        <View style={[styles.econBadge, { backgroundColor: `${color}24`, borderColor: `${color}66` }]}>
          {icon}
        </View>
        <OnbTitle color={color}>{name}</OnbTitle>
      </View>
      <OnbSubtitle>{subtitle}</OnbSubtitle>
    </View>
  );
}

/**
 * The three pillar hues. Fills are the brand's own (violet / green / gold);
 * inks are what a LABEL in that hue may use — in the light palette the green
 * and gold fills fall under 4.5:1 on porcelain, so labels drop to the
 * text-safe variant there. Read at render time: the theme gate rewrites
 * `tokens` in place at boot.
 */
export function pillarPalette() {
  const light = ACTIVE_THEME === 'light';
  return {
    self: { fill: tokens.brand.violet2, ink: tokens.brand.violet2 },
    practice: { fill: tokens.semantic.xp, ink: light ? tokens.text.hi : tokens.semantic.xp },
    learning: { fill: tokens.semantic.coin, ink: tokens.semantic.coinLight },
  };
}

const styles = StyleSheet.create({
  econHeader: {
    alignItems: 'center',
    gap: tokens.space[2],
  },
  econRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  econBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarHeader: {
    alignItems: 'center',
    gap: tokens.space[2],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.space[2],
  },
  stepCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLine: {
    width: 28,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 6,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 21,
    color: tokens.text.hi,
  },
  cardText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.base,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[3],
    gap: tokens.space[3],
  },
});
