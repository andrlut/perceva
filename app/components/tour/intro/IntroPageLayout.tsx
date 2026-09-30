import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ONB_PAGE_TOP } from '@/components/tour/OnboardingKit';
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

/**
 * The middle band of a page: takes whatever height the header and the cards
 * leave and centres the drawing in it.
 */
export function PageBody({ children }: { children: ReactNode }) {
  return <View style={styles.pageBody}>{children}</View>;
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
    paddingHorizontal: tokens.space[6],
    paddingTop: ONB_PAGE_TOP,
    gap: tokens.space[3],
  },
  pageBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
