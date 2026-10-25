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

const LOOP_MS = 6000;
const BARS = [0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.9, 0.6];

/**
 * Door animation for Aprender (Recanto): a material cover opens and the
 * three ways of consuming an idea come out of it — text, video, audio —
 * one after the other, then the card closes and it loops.
 *
 *   0.00–0.18  cover closed (kicker + title)
 *   0.18–0.30  cover lifts, panel opens
 *   0.30–0.50  text lines type in
 *   0.50–0.70  video thumbnail, play button pops
 *   0.70–0.88  audio: waveform dances
 *   0.88–1.00  everything fades, cover comes back
 */
export function LearningDoorVisual({ width }: { width: number }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      p.value = 0.8; // open, all three formats visible
      return;
    }
    p.value = 0;
    p.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1, false);
  }, [p, reduceMotion]);

  const coverStyle = useAnimatedStyle(() => {
    const o = interpolate(p.value, [0.18, 0.3, 0.88, 0.98], [0, 1, 1, 0], 'clamp');
    return {
      transform: [{ translateY: -26 * o }, { scale: 1 - 0.06 * o }],
      opacity: 1 - 0.35 * o,
    };
  });
  const panelStyle = useAnimatedStyle(() => {
    const o = interpolate(p.value, [0.18, 0.3, 0.88, 0.98], [0, 1, 1, 0], 'clamp');
    return { opacity: o, transform: [{ translateY: 18 * (1 - o) }] };
  });
  const videoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.5, 0.56, 0.9, 0.96], [0, 1, 1, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.5, 0.58], [0.85, 1], 'clamp') }],
  }));
  const playStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.56, 0.62, 0.68], [0.6, 1.15, 1], 'clamp') }],
  }));
  const audioStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.7, 0.76, 0.9, 0.96], [0, 1, 1, 0], 'clamp'),
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
            <TextLine p={p} from={0.3} to={0.36} widthPct="92%" />
            <TextLine p={p} from={0.35} to={0.42} widthPct="78%" />
            <TextLine p={p} from={0.4} to={0.48} widthPct="60%" />
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
    </View>
  );
}

function TextLine({
  p,
  from,
  to,
  widthPct,
}: {
  p: SharedValue<number>;
  from: number;
  to: number;
  widthPct: `${number}%`;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [from, to, 0.9, 0.96], [0, 1, 1, 0], 'clamp'),
    transform: [{ scaleX: interpolate(p.value, [from, to], [0.2, 1], 'clamp') }],
  }));
  return <Animated.View style={[styles.textLine, { width: widthPct }, style]} />;
}

function WaveBar({ p, base, phase }: { p: SharedValue<number>; base: number; phase: number }) {
  const style = useAnimatedStyle(() => {
    const live = p.value > 0.72 && p.value < 0.9;
    const wave = live ? 0.55 + 0.45 * Math.abs(Math.sin(p.value * 60 + phase)) : 0.3;
    return { height: 6 + 22 * base * wave };
  });
  return <Animated.View style={[styles.bar, style]} />;
}

const styles = StyleSheet.create({
  root: { height: 300, justifyContent: 'flex-end' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    padding: 14,
    paddingTop: 62,
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
  formatLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },
  textLine: {
    height: 7,
    borderRadius: 4,
    backgroundColor: tokens.bg.surface3,
    transformOrigin: 'left',
  },
  thumb: {
    height: 44,
    borderRadius: 8,
    backgroundColor: tokens.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.semantic.coin,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 30 },
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
  coverArt: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverMeta: { flex: 1, gap: 2 },
  coverKicker: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
    letterSpacing: 0.3,
  },
  coverTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 19,
    color: tokens.text.hi,
  },
});
