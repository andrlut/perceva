import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  FadeIn,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { useT } from '@/lib/i18n';
import { ACTIVE_THEME, tokens } from '@/theme';

import { pillarPalette } from './IntroPageLayout';

/**
 * Page 0 of the method intro — the three pillars as one picture.
 *
 * Three luminous nodes on a triangle inscribed in a loop, the Perceva glyph
 * at the centre. A comet travels the loop clockwise (Autoconhecimento →
 * Prática → Aprendizado → back), and each node brightens as the comet
 * passes, so the light itself reads as the cycle "medir → praticar →
 * re-olhar". One shared value drives both the comet and the three glows.
 *
 * Built only from Views + react-native-svg primitives. Nothing animates an
 * SVG prop: the moving parts are whole Views (rotate / opacity / scale),
 * which is the path that is solid on Android. Defs never sit inside a
 * transformed <G> (the RN-svg Android crash noted in CoinIcon).
 *
 * Reduced motion: no entrance, no comet, every node at a steady glow.
 * `active` stops the loop while the page is off screen.
 */

/** Geometry lives in a 300-wide viewBox and scales with `size`. */
const VB_W = 300;
const VB_H = 252;
const CX = 150;
const CY = 142;
const R = 100;
/** Node tile (viewBox units) — wide enough for the ambient glow. */
const NODE = 60;
/** Rotating layer: the loop plus room for the comet's halo. */
const ROT = 2 * (R + 12);
/** One revolution — slow on purpose; this is a calm screen. */
const REVOLUTION_MS = 12000;
const GLYPH = 66;

type PillarKey = 'self' | 'practice' | 'learning';

interface NodeSpec {
  key: PillarKey;
  /** Position on the loop, degrees (0 = +x, y down — screen convention). */
  angle: number;
  /** Where the comet sits (in spin degrees) when it crosses this node. */
  spinAt: number;
  labelKey: string;
}

const NODES: NodeSpec[] = [
  { key: 'self', angle: -90, spinAt: 0, labelKey: 'tour.intro.hero.pillarSelf' },
  { key: 'practice', angle: 30, spinAt: 120, labelKey: 'tour.intro.hero.pillarPractice' },
  { key: 'learning', angle: 150, spinAt: 240, labelKey: 'tour.intro.hero.pillarLearning' },
];

function onLoop(angleDeg: number, radius = R, cx = CX, cy = CY) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

/** A small chevron on the loop pointing clockwise, as an SVG path. */
function chevronPath(angleDeg: number): string {
  const a = (angleDeg * Math.PI) / 180;
  const p = onLoop(angleDeg);
  const d = { x: -Math.sin(a), y: Math.cos(a) }; // clockwise tangent
  const n = { x: Math.cos(a), y: Math.sin(a) }; // radial
  const tip = { x: p.x + 4 * d.x, y: p.y + 4 * d.y };
  const w1 = { x: p.x - 3 * d.x + 4 * n.x, y: p.y - 3 * d.y + 4 * n.y };
  const w2 = { x: p.x - 3 * d.x - 4 * n.x, y: p.y - 3 * d.y - 4 * n.y };
  const f = (v: number) => v.toFixed(2);
  return `M ${f(w1.x)} ${f(w1.y)} L ${f(tip.x)} ${f(tip.y)} L ${f(w2.x)} ${f(w2.y)}`;
}

export function PillarsHero({ size, active }: { size: number; active: boolean }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const palette = pillarPalette();
  const light = ACTIVE_THEME === 'light';
  const cometColor = light ? tokens.brand.violet : '#FFFFFF';

  const k = size / VB_W;
  const height = VB_H * k;

  const spin = useSharedValue(0);

  useEffect(() => {
    if (!active || reduceMotion) {
      cancelAnimation(spin);
      return;
    }
    // Resume from wherever the comet stopped; +360 per lap keeps the loop
    // seamless (the glow math works modulo 360).
    const from = spin.value;
    spin.value = withRepeat(
      withTiming(from + 360, { duration: REVOLUTION_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [active, reduceMotion, spin]);

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const pos = useMemo(() => NODES.map((n) => onLoop(n.angle)), []);
  const chevrons = useMemo(() => [-30, 90, 210].map(chevronPath), []);
  const tailStart = onLoop(-140, R, ROT / 2, ROT / 2);

  const nodeFill: Record<PillarKey, string> = {
    self: palette.self.fill,
    practice: palette.practice.fill,
    learning: palette.learning.fill,
  };
  const nodeInk: Record<PillarKey, string> = {
    self: palette.self.ink,
    practice: palette.practice.ink,
    learning: palette.learning.ink,
  };

  const enter = (delay: number, duration = 500) =>
    reduceMotion ? undefined : FadeIn.duration(duration).delay(delay);

  return (
    <View
      style={{ width: size, height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('tour.intro.hero.artA11y')}
    >
      {/* ── Static layer: halo, loop, triangle, direction chevrons ───── */}
      <Animated.View style={StyleSheet.absoluteFill} entering={enter(0, 700)}>
        <Svg width={size} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Defs>
            <RadialGradient id="intro-hero-halo" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={tokens.brand.violet} stopOpacity={light ? 0.18 : 0.34} />
              <Stop offset="1" stopColor={tokens.brand.violet} stopOpacity={0} />
            </RadialGradient>
            {NODES.map((n, i) => {
              const next = NODES[(i + 1) % NODES.length]!;
              const a = pos[i]!;
              const b = pos[(i + 1) % NODES.length]!;
              return (
                <LinearGradient
                  key={n.key}
                  id={`intro-hero-edge-${n.key}`}
                  gradientUnits="userSpaceOnUse"
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                >
                  <Stop offset="0" stopColor={nodeFill[n.key]} />
                  <Stop offset="1" stopColor={nodeFill[next.key]} />
                </LinearGradient>
              );
            })}
          </Defs>

          <Circle cx={CX} cy={CY} r={64} fill="url(#intro-hero-halo)" />

          <Circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={tokens.text.faint}
            strokeOpacity={0.7}
            strokeWidth={1}
          />

          <Polygon
            points={pos.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
            fill={tokens.brand.violet}
            fillOpacity={light ? 0.04 : 0.07}
          />
          {NODES.map((n, i) => {
            const a = pos[i]!;
            const b = pos[(i + 1) % NODES.length]!;
            return (
              <Line
                key={n.key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={`url(#intro-hero-edge-${n.key})`}
                strokeWidth={1.5}
                strokeOpacity={0.6}
              />
            );
          })}

          {chevrons.map((d, i) => (
            <Path
              key={i}
              d={d}
              fill="none"
              stroke={tokens.text.dim}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </Animated.View>

      {/* ── Rotating layer: flowing dashes + the comet ──────────────── */}
      {!reduceMotion && (
        <Animated.View
          entering={enter(900, 900)}
          style={[
            styles.abs,
            {
              left: (CX - ROT / 2) * k,
              top: (CY - ROT / 2) * k,
              width: ROT * k,
              height: ROT * k,
            },
            rotStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width={ROT * k} height={ROT * k} viewBox={`0 0 ${ROT} ${ROT}`}>
            <Defs>
              <LinearGradient
                id="intro-hero-tail"
                gradientUnits="userSpaceOnUse"
                x1={tailStart.x}
                y1={tailStart.y}
                x2={ROT / 2}
                y2={ROT / 2 - R}
              >
                <Stop offset="0" stopColor={cometColor} stopOpacity={0} />
                <Stop offset="1" stopColor={cometColor} stopOpacity={0.85} />
              </LinearGradient>
              <RadialGradient id="intro-hero-comet" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={cometColor} stopOpacity={0.7} />
                <Stop offset="1" stopColor={cometColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle
              cx={ROT / 2}
              cy={ROT / 2}
              r={R}
              fill="none"
              stroke={tokens.brand.violet2}
              strokeOpacity={0.45}
              strokeWidth={1.4}
              strokeDasharray="1.5 9"
              strokeLinecap="round"
            />
            <Path
              d={`M ${tailStart.x.toFixed(2)} ${tailStart.y.toFixed(2)} A ${R} ${R} 0 0 1 ${ROT / 2} ${ROT / 2 - R}`}
              fill="none"
              stroke="url(#intro-hero-tail)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <Circle cx={ROT / 2} cy={ROT / 2 - R} r={10} fill="url(#intro-hero-comet)" />
            <Circle cx={ROT / 2} cy={ROT / 2 - R} r={2.8} fill={cometColor} />
          </Svg>
        </Animated.View>
      )}

      {/* ── Nodes ────────────────────────────────────────────────────── */}
      {NODES.map((n, i) => (
        <PillarNode
          key={n.key}
          spec={n}
          x={pos[i]!.x * k}
          y={pos[i]!.y * k}
          k={k}
          color={nodeFill[n.key]}
          spin={spin}
          steady={reduceMotion}
          enterDelay={reduceMotion ? null : 300 + i * 160}
        />
      ))}

      {/* ── Centre: the brand glyph ─────────────────────────────────── */}
      <Animated.View
        entering={reduceMotion ? undefined : ZoomIn.duration(600).delay(150)}
        style={[
          styles.abs,
          {
            left: (CX - GLYPH / 2) * k,
            top: (CY - GLYPH / 2) * k,
          },
        ]}
        pointerEvents="none"
      >
        <PercevaGlyph size={GLYPH * k} palette="primary" idSuffix="intro-hero" />
      </Animated.View>

      {/* ── Labels (plain Text: crisp, translatable, font-scaled) ───── */}
      {NODES.map((n, i) => {
        const p = pos[i]!;
        const isTop = n.angle < 0;
        const labelW = (isTop ? 220 : 140) * k;
        // Bottom labels lean outward, away from where the loop curves in.
        const nudge = isTop ? 0 : p.x < CX ? -12 : 12;
        const left = Math.min(
          Math.max(0, (p.x + nudge) * k - labelW / 2),
          size - labelW,
        );
        return (
          <Animated.View
            key={n.key}
            entering={enter(480 + i * 160)}
            style={[
              styles.abs,
              styles.labelWrap,
              {
                width: labelW,
                left,
                top: isTop ? undefined : (p.y + 20) * k,
                bottom: isTop ? height - (p.y - 19) * k : undefined,
              },
            ]}
            pointerEvents="none"
          >
            {/* Backed chip: the loop passes behind the bottom labels. */}
            <View style={[styles.labelChip, { backgroundColor: `${tokens.bg.deep}D1` }]}>
              <Text
                style={[styles.label, { color: nodeInk[n.key] }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                importantForAccessibility="no"
              >
                {t(n.labelKey)}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function PillarNode({
  spec,
  x,
  y,
  k,
  color,
  spin,
  steady,
  enterDelay,
}: {
  spec: NodeSpec;
  x: number;
  y: number;
  k: number;
  color: string;
  spin: SharedValue<number>;
  /** Reduced motion: a fixed mid glow instead of the comet-driven one. */
  steady: boolean;
  enterDelay: number | null;
}) {
  const tile = NODE * k;
  const at = spec.spinAt;

  const glowStyle = useAnimatedStyle(() => {
    if (steady) return { opacity: 0.55, transform: [{ scale: 1 }] };
    const a = ((spin.value % 360) + 360) % 360;
    let d = Math.abs(a - at);
    d = Math.min(d, 360 - d);
    const o = interpolate(d, [0, 55], [1, 0.12], Extrapolation.CLAMP);
    return { opacity: o, transform: [{ scale: 0.8 + 0.35 * o }] };
  });

  return (
    <Animated.View
      entering={enterDelay == null ? undefined : ZoomIn.duration(520).delay(enterDelay)}
      style={[styles.abs, { left: x - tile / 2, top: y - tile / 2, width: tile, height: tile }]}
      pointerEvents="none"
    >
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={tile} height={tile} viewBox={`0 0 ${NODE} ${NODE}`}>
          <Defs>
            <RadialGradient id={`intro-node-hot-${spec.key}`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={color} stopOpacity={0.8} />
              <Stop offset="0.45" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={NODE / 2} cy={NODE / 2} r={NODE / 2} fill={`url(#intro-node-hot-${spec.key})`} />
        </Svg>
      </Animated.View>
      <Svg width={tile} height={tile} viewBox={`0 0 ${NODE} ${NODE}`}>
        <Defs>
          <RadialGradient id={`intro-node-core-${spec.key}`} cx="0.4" cy="0.38" r="0.62">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={NODE / 2}
          cy={NODE / 2}
          r={13}
          fill={tokens.bg.deep}
          fillOpacity={0.92}
          stroke={color}
          strokeOpacity={0.65}
          strokeWidth={1.5}
        />
        <Circle cx={NODE / 2} cy={NODE / 2} r={7.5} fill={`url(#intro-node-core-${spec.key})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  labelWrap: {
    alignItems: 'center',
  },
  labelChip: {
    maxWidth: '100%',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: tokens.radius.pill,
  },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
