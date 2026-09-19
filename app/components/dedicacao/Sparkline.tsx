import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';

import { BAR_SPAN } from '@/lib/dedicacao/scale';
import { tokens } from '@/theme';

interface Props {
  /** Cumulative values over the window — must be non-decreasing. */
  cumulative: number[];
  color: string;
  /** The ruler for this series: 300 per sub in 30 days (prorated like the
   *  bars), twice that for a dimension, which is two subs. Drawn dashed and
   *  labeled, always at the same third of the height. */
  reference: number;
  width: number;
  height: number;
  /** Stable id for the gradient def — required when multiple sparklines render
   *  on the same screen (SVG defs share a flat namespace). */
  idSuffix: string;
}

const PAD_Y = 2;

/**
 * Cumulative sparkline on the ruler's own geometry — the bars' tick, lying
 * down. The y-axis runs to BAR_SPAN × the reference, so the dashed line sits
 * at a third of the height in every chart and every period, and the curve
 * crosses it on the day that area (or dimension) reached its minimum. Past
 * the top the curve flattens, like a bar reaching the end of its track.
 */
export function Sparkline({ cumulative, color, reference, width, height, idSuffix }: Props) {
  const usableH = height - PAD_Y * 2;
  const max = reference * BAR_SPAN;
  const refY = height - PAD_Y - usableH / BAR_SPAN;

  const { linePath, areaPath } = useMemo(() => {
    const last = cumulative.length ? cumulative[cumulative.length - 1] : 0;
    if (last <= 0 || max <= 0) return { linePath: null, areaPath: null };
    const stepX = cumulative.length > 1 ? width / (cumulative.length - 1) : 0;
    let line = '';
    cumulative.forEach((v, i) => {
      const x = i * stepX;
      const y = height - PAD_Y - (Math.min(v, max) / max) * usableH;
      line += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    // Close the area down to the baseline at both ends.
    const area = `${line} L ${(cumulative.length - 1) * stepX} ${height - PAD_Y} L 0 ${
      height - PAD_Y
    } Z`;
    return { linePath: line, areaPath: area };
  }, [cumulative, width, height, max, usableH]);

  const gradId = `spark-${idSuffix}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.32} />
            <Stop offset="1" stopColor={color} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Line
          x1={0}
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke={tokens.border.base}
          strokeWidth={1}
        />
        {areaPath && <Path d={areaPath} fill={`url(#${gradId})`} stroke="none" />}
        <Line
          x1={0}
          y1={refY}
          x2={width}
          y2={refY}
          stroke={tokens.text.hi}
          strokeOpacity={0.6}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        {linePath && (
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
      <Text
        style={[styles.refLabel, { top: refY - 14 }]}
        allowFontScaling={false}
        pointerEvents="none"
      >
        {Math.round(reference).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Left end: the curves start near zero there, so the label never sits on
  // a line — at the right end it would, on every area that crossed it.
  refLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: tokens.text.dim,
  },
});
