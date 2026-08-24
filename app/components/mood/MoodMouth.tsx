import Svg, { Path } from 'react-native-svg';

import type { MoodValue } from '@/lib/mood';

/**
 * The mouth alone, extracted from `MoodFace` for places too small to draw a
 * face. At the ~16dp a calendar cell can spare, eyes and brows collapse into
 * noise while the mouth's curvature stays readable — and curvature is the whole
 * signal: it carries the 1..5 level as SHAPE, so the level survives even where
 * the fill it sits on cannot be told apart by hue.
 *
 * Sagitta (the curve's depth, in viewBox units) rather than five hand-drawn
 * paths: it keeps the steps evenly spaced by construction, so no two adjacent
 * levels can drift into looking alike.
 */
const SAGITTA: Record<MoodValue, number> = {
  1: -4.2,
  2: -2.1,
  3: 0,
  4: 2.4,
  5: 4.4,
};

interface Props {
  value: MoodValue;
  /** Rendered width in dp; height follows the 24×12 viewBox ratio. */
  width?: number;
  color: string;
}

export function MoodMouth({ value, width = 18, color }: Props) {
  const sag = SAGITTA[value];
  const y = 6 - sag / 2;
  return (
    <Svg width={width} height={(width * 12) / 24} viewBox="0 0 24 12">
      <Path
        d={`M3 ${y} Q12 ${6 + sag} 21 ${y}`}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
