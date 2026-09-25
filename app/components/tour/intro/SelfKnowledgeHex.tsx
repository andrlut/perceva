import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';

import { useT } from '@/lib/i18n';
import { ACTIVE_THEME, tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER } from '@/theme/dimensions';

/**
 * Page 1 visual — the Avaliação as a picture. A small 6-axis hex in the
 * app's own area order and colors: the FILLED shape is how you see
 * yourself (autoavaliação), the dashed OUTLINE is what the well-being
 * questionnaire measured. The two never coincide — the gap is the point
 * the page makes in words.
 *
 * Illustrative values, not the user's: nothing is read from the server.
 * The shapes grow in the first time the page is shown (static under
 * reduced motion).
 */

const VB = 220;
const C = VB / 2;
const RADIUS = 70;
/** Area icon badges sit just outside the outer ring. */
const BADGE_R = 92;
const BADGE = 26;

/** Sample shapes, in DIMENSION_ORDER. Chosen to cross each other. */
const SELF = [0.8, 0.5, 0.88, 0.42, 0.72, 0.6];
const QUESTIONNAIRE = [0.6, 0.7, 0.62, 0.58, 0.4, 0.76];

function vertex(i: number, ratio: number) {
  const a = ((-90 + 60 * i) * Math.PI) / 180;
  return { x: C + RADIUS * ratio * Math.cos(a), y: C + RADIUS * ratio * Math.sin(a) };
}

function points(ratios: number[]): string {
  return ratios
    .map((r, i) => {
      const v = vertex(i, r);
      return `${v.x.toFixed(2)},${v.y.toFixed(2)}`;
    })
    .join(' ');
}

export function SelfKnowledgeHex({ size, active }: { size: number; active: boolean }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const k = size / VB;
  const light = ACTIVE_THEME === 'light';
  const selfColor = tokens.brand.violet2;
  const outlineColor = light ? tokens.semantic.coinDeep : tokens.semantic.coin;

  const grow = useSharedValue(reduceMotion ? 1 : 0);
  const outline = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      grow.value = 1;
      outline.value = 1;
      return;
    }
    // First showing only — once drawn, the shapes stay put.
    if (grow.value < 1) {
      grow.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
      outline.value = withDelay(450, withTiming(1, { duration: 500 }));
    }
  }, [active, reduceMotion, grow, outline]);

  const selfStyle = useAnimatedStyle(() => ({
    opacity: grow.value,
    transform: [{ scale: 0.35 + 0.65 * grow.value }],
  }));
  const outlineStyle = useAnimatedStyle(() => ({
    opacity: outline.value,
    transform: [{ scale: 0.92 + 0.08 * outline.value }],
  }));

  const rings = [0.34, 0.67, 1].map((r) => points([r, r, r, r, r, r]));

  return (
    <View style={styles.wrap}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('tour.intro.self.artA11y')}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} style={StyleSheet.absoluteFill}>
          {rings.map((p, i) => (
            <Polygon
              key={i}
              points={p}
              fill="none"
              stroke={tokens.border.strong}
              strokeWidth={1}
            />
          ))}
          {DIMENSION_ORDER.map((id, i) => {
            const v = vertex(i, 1);
            return (
              <Line
                key={id}
                x1={C}
                y1={C}
                x2={v.x}
                y2={v.y}
                stroke={tokens.border.base}
                strokeWidth={1}
              />
            );
          })}
        </Svg>

        <Animated.View style={[StyleSheet.absoluteFill, selfStyle]} pointerEvents="none">
          <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
            <Polygon
              points={points(SELF)}
              fill={selfColor}
              fillOpacity={light ? 0.18 : 0.3}
              stroke={selfColor}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, outlineStyle]} pointerEvents="none">
          <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
            <Polygon
              points={points(QUESTIONNAIRE)}
              fill="none"
              stroke={outlineColor}
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>

        {DIMENSION_ORDER.map((id, i) => {
          const a = ((-90 + 60 * i) * Math.PI) / 180;
          const x = (C + BADGE_R * Math.cos(a)) * k;
          const y = (C + BADGE_R * Math.sin(a)) * k;
          const meta = DIMENSION_META[id];
          const b = BADGE * k;
          return (
            <View
              key={id}
              style={[
                styles.badge,
                {
                  left: x - b / 2,
                  top: y - b / 2,
                  width: b,
                  height: b,
                  borderRadius: b / 2,
                  backgroundColor: meta.bg,
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons
                name={meta.iconName as keyof typeof Ionicons.glyphMap}
                size={Math.round(14 * k)}
                color={meta.color}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View
            style={[
              styles.swatchFill,
              { backgroundColor: selfColor, opacity: light ? 0.55 : 0.75 },
            ]}
          />
          <Text style={styles.legendText}>{t('tour.intro.self.legendSelf')}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.swatchDash, { borderColor: outlineColor }]} />
          <Text style={styles.legendText}>{t('tour.intro.self.legendQuestionnaire')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: tokens.space[3],
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: tokens.space[4],
    rowGap: tokens.space[1],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  swatchFill: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  swatchDash: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  legendText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
});
