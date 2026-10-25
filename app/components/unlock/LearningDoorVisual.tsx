import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

const LOOP_MS = 9000;
const BARS = [0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.9, 0.6];
const H = 320;

/**
 * Door animation for Aprender (Recanto), the whole loop of an idea:
 *
 *   0.00–0.12  a material cover, closed
 *   0.12–0.20  the cover lifts, the panel opens
 *   0.20–0.32  text lines type in
 *   0.32–0.42  video thumbnail, play pops
 *   0.42–0.52  audio: waveform dances
 *   0.52–0.62  the idea card rises over it ("Vire o card")
 *   0.62–0.68  it flips: "Absorvida"
 *   0.68–0.80  it shrinks and flies into the lamp button (bottom right,
 *              where "Minhas ideias" lives on the real tab) — the lamp
 *              lights up and counts 1
 *   0.80–0.92  hold; 0.92–1.00 fade, loop
 */
export function LearningDoorVisual({ width }: { width: number }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      p.value = 0.5; // open, all three formats visible
      return;
    }
    p.value = 0;
    p.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1, false);
  }, [p, reduceMotion]);

  // No helpers inside the worklets: a plain closure reaches the UI thread
  // as an object ("openAt is not a function"). Inline it.
  const coverStyle = useAnimatedStyle(() => {
    const o = interpolate(p.value, [0.12, 0.2, 0.9, 0.97], [0, 1, 1, 0], 'clamp');
    return { transform: [{ translateY: -26 * o }, { scale: 1 - 0.06 * o }], opacity: 1 - 0.35 * o };
  });
  const panelStyle = useAnimatedStyle(() => {
    const o = interpolate(p.value, [0.12, 0.2, 0.9, 0.97], [0, 1, 1, 0], 'clamp');
    const dim = interpolate(p.value, [0.52, 0.58], [1, 0.45], 'clamp');
    return { opacity: o * dim, transform: [{ translateY: 18 * (1 - o) }] };
  });
  const videoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.32, 0.36], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.32, 0.38], [0.85, 1], 'clamp') }],
  }));
  const playStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.36, 0.4, 0.44], [0.6, 1.15, 1], 'clamp') }],
  }));
  const audioStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.42, 0.46], [0, 1], 'clamp'),
  }));

  // The idea card: rises, flips, flies into the lamp.
  const ideaStyle = useAnimatedStyle(() => {
    const rise = interpolate(p.value, [0.52, 0.58], [60, 0], 'clamp');
    const flip = interpolate(p.value, [0.62, 0.65, 0.68], [1, 0, 1], 'clamp');
    const fly = interpolate(p.value, [0.7, 0.8], [0, 1], 'clamp');
    return {
      opacity: interpolate(p.value, [0.52, 0.56, 0.78, 0.81], [0, 1, 1, 0], 'clamp'),
      transform: [
        { translateY: rise + 150 * fly },
        { translateX: 110 * fly },
        { scaleX: flip * (1 - 0.85 * fly) },
        { scaleY: 1 - 0.85 * fly },
      ],
    };
  });
  const ideaFrontStyle = useAnimatedStyle(() => ({ opacity: p.value < 0.65 ? 1 : 0 }));
  const ideaBackStyle = useAnimatedStyle(() => ({ opacity: p.value >= 0.65 ? 1 : 0 }));
  const lampStyle = useAnimatedStyle(() => {
    const lit = interpolate(p.value, [0.78, 0.82, 0.9, 0.96], [0, 1, 1, 0], 'clamp');
    return {
      transform: [{ scale: interpolate(p.value, [0.78, 0.81, 0.85], [1, 1.18, 1], 'clamp') }],
      backgroundColor: lit > 0.5 ? tokens.semantic.coin : tokens.brand.violet2,
    };
  });
  const lampBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.8, 0.83, 0.9, 0.96], [0, 1, 1, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.8, 0.84], [0.4, 1], 'clamp') }],
  }));
  const lampHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.82, 0.86, 0.9, 0.95], [0, 1, 1, 0], 'clamp'),
  }));

  return (
    <View style={[styles.root, { width }]}>
      <Animated.View style={[styles.panel, panelStyle]}>
        <View style={styles.formatRow}>
          <View style={styles.formatIcon}>
            <Ionicons name="document-text-outline" size={16} color={tokens.semantic.coinLight} />
          </View>
          <View style={styles.formatBody}>
            <Text style={styles.formatLabel}>{t('unlock.visual.learn.text')}</Text>
            <TextLine p={p} from={0.2} to={0.25} widthPct="92%" />
            <TextLine p={p} from={0.24} to={0.29} widthPct="78%" />
            <TextLine p={p} from={0.28} to={0.32} widthPct="60%" />
          </View>
        </View>
        <Animated.View style={[styles.formatRow, videoStyle]}>
          <View style={styles.formatIcon}>
            <Ionicons name="videocam-outline" size={16} color={tokens.semantic.coinLight} />
          </View>
          <View style={styles.formatBody}>
            <Text style={styles.formatLabel}>{t('unlock.visual.learn.video')}</Text>
            <View style={styles.thumb}>
              <Animated.View style={[styles.play, playStyle]}>
                <Ionicons name="play" size={14} color={tokens.bg.deep} />
              </Animated.View>
            </View>
          </View>
        </Animated.View>
        <Animated.View style={[styles.formatRow, audioStyle]}>
          <View style={styles.formatIcon}>
            <Ionicons name="headset-outline" size={16} color={tokens.semantic.coinLight} />
          </View>
          <View style={styles.formatBody}>
            <Text style={styles.formatLabel}>{t('unlock.visual.learn.audio')}</Text>
            <View style={styles.wave}>
              {BARS.map((h, i) => (
                <WaveBar key={i} p={p} base={h} phase={i * 1.1} />
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.cover, coverStyle]}>
        <View style={styles.coverArt}>
          <Ionicons name="moon-outline" size={30} color={tokens.brand.violet2} />
        </View>
        <View style={styles.coverMeta}>
          <Text style={styles.coverKicker}>{t('unlock.visual.learn.kicker')}</Text>
          <Text style={styles.coverTitle} numberOfLines={2}>
            {t('unlock.visual.learn.title')}
          </Text>
        </View>
      </Animated.View>

      {/* The idea card, over everything */}
      <Animated.View style={[styles.idea, ideaStyle]}>
        <Animated.View style={[styles.ideaFace, ideaFrontStyle]}>
          <Text style={styles.ideaKicker}>{t('unlock.visual.learn.kicker')} · 1/3</Text>
          <Text style={styles.ideaClaim} numberOfLines={2}>
            {t('unlock.visual.learn.title')}
          </Text>
          <View style={styles.ideaFlip}>
            <Ionicons name="sync-outline" size={12} color={tokens.text.mid} />
            <Text style={styles.ideaFlipText}>{t('unlock.visual.flip')}</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.ideaFace, styles.ideaBack, ideaBackStyle]}>
          <Ionicons name="checkmark-circle" size={30} color={tokens.semantic.coin} />
          <Text style={styles.ideaAbsorbed}>{t('unlock.visual.absorbed')}</Text>
        </Animated.View>
      </Animated.View>

      {/* The lamp button — where absorbed ideas are kept */}
      <View style={styles.lampWrap}>
        <Animated.Text style={[styles.lampHint, lampHintStyle]}>
          {t('unlock.visual.myIdeas')}
        </Animated.Text>
        <Animated.View style={[styles.lamp, lampStyle]}>
          <Ionicons name="bulb-outline" size={24} color={tokens.bg.deep} />
          <Animated.View style={[styles.lampBadge, lampBadgeStyle]}>
            <Text style={styles.lampBadgeText}>1</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function TextLine({ p, from, to, widthPct }: { p: SharedValue<number>; from: number; to: number; widthPct: `${number}%` }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [from, to], [0, 1], 'clamp'),
    transform: [{ scaleX: interpolate(p.value, [from, to], [0.2, 1], 'clamp') }],
  }));
  return <Animated.View style={[styles.textLine, { width: widthPct }, style]} />;
}

function WaveBar({ p, base, phase }: { p: SharedValue<number>; base: number; phase: number }) {
  const style = useAnimatedStyle(() => {
    const live = p.value > 0.44 && p.value < 0.56;
    const wave = live ? 0.55 + 0.45 * Math.abs(Math.sin(p.value * 90 + phase)) : 0.3;
    return { height: 6 + 22 * base * wave };
  });
  return <Animated.View style={[styles.bar, style]} />;
}

const styles = StyleSheet.create({
  root: { height: H, justifyContent: 'flex-end' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    padding: 14,
    paddingTop: 62,
    paddingBottom: 54,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  formatRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  formatIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBody: { flex: 1, gap: 6, minHeight: 30, justifyContent: 'center' },
  formatLabel: { fontFamily: 'Manrope_700Bold', fontSize: 12, color: tokens.text.mid, letterSpacing: 0.3 },
  textLine: { height: 7, borderRadius: 4, backgroundColor: tokens.bg.surface3, transformOrigin: 'left' },
  thumb: { height: 40, borderRadius: 8, backgroundColor: tokens.bg.surface2, alignItems: 'center', justifyContent: 'center' },
  play: { width: 26, height: 26, borderRadius: 13, backgroundColor: tokens.semantic.coin, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28 },
  bar: { width: 5, borderRadius: 3, backgroundColor: tokens.brand.violet2 },
  cover: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 0,
    height: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  coverArt: { width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(123, 92, 255, 0.18)', alignItems: 'center', justifyContent: 'center' },
  coverMeta: { flex: 1, gap: 2 },
  coverKicker: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.brand.violet2, letterSpacing: 0.3 },
  coverTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, lineHeight: 19, color: tokens.text.hi },
  idea: {
    position: 'absolute',
    left: 36,
    right: 36,
    top: 96,
    height: 118,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 92, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  ideaFace: { ...StyleSheet.absoluteFillObject, padding: 14, gap: 6, justifyContent: 'center' },
  ideaBack: { alignItems: 'center', gap: 6 },
  ideaKicker: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.brand.violet2, letterSpacing: 0.3 },
  ideaClaim: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16, lineHeight: 21, color: tokens.text.hi },
  ideaFlip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ideaFlipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 11.5, color: tokens.text.mid },
  ideaAbsorbed: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.semantic.coinLight },
  lampWrap: { position: 'absolute', right: 10, bottom: 10, alignItems: 'flex-end', gap: 6 },
  lampHint: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.semantic.coinLight },
  lamp: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.brand.violet2 },
  lampBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: tokens.text.hi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampBadgeText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 11, color: tokens.bg.deep },
});
