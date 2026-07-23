import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTourTargetsStore, type TourTargetRect } from '@/lib/tour/targets';

/**
 * Dim layer behind a tour tooltip, with a transparent cut-out around the
 * step's `target` element (registered via `<TourTarget>`). Gives the tour
 * the classic coach-mark "everything fades except what matters" look the
 * floating card alone never had.
 *
 * Strictly visual — `pointerEvents: 'none'` end to end, so every touch
 * still lands on the real UI (dimmed or not) and the tour's real-gesture
 * advancement keeps working exactly as before.
 *
 * Z-order notes:
 *   - Elevation 10 keeps the dim above elevated screen content on
 *     Android (cards etc.) but below the tooltip card (elevation 14).
 *   - Surfaces with higher elevation than the dim (the floating
 *     BottomNavBar, elevation 16) stay bright on purpose — when the
 *     target IS a nav tab, the bar pops while the screen dims, and the
 *     `TourTarget` ring glows around the tab itself.
 */

interface Props {
  /** Target id to cut the hole around. Omit for a uniform dim. */
  targetId?: string;
  /** Set false to skip rendering entirely (step opted out). */
  enabled?: boolean;
}

const DIM_COLOR = 'rgba(5, 8, 26, 0.62)';
const HOLE_PAD = 8;
const HOLE_RADIUS = 18;

/** SVG path for a rounded rect (clockwise). */
function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr},${y}`,
    `H${x + w - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}`,
    `H${x + rr}`,
    `A${rr},${rr} 0 0 1 ${x},${y + h - rr}`,
    `V${y + rr}`,
    `A${rr},${rr} 0 0 1 ${x + rr},${y}`,
    'Z',
  ].join(' ');
}

export function SpotlightBackdrop({ targetId, enabled = true }: Props) {
  const setActiveTargetId = useTourTargetsStore((s) => s.setActiveTargetId);
  const requestRemeasure = useTourTargetsStore((s) => s.requestRemeasure);
  const rect = useTourTargetsStore((s) =>
    targetId ? (s.rects[targetId] ?? null) : null,
  );

  // Publish which target should measure itself, and stagger a few
  // re-measures so auto-scroll/layout animations settle before the hole
  // position is trusted.
  useEffect(() => {
    if (!enabled) return;
    setActiveTargetId(targetId ?? null);
    if (!targetId) return;
    const timers = [120, 400, 800].map((ms) =>
      setTimeout(requestRemeasure, ms),
    );
    return () => {
      timers.forEach(clearTimeout);
      setActiveTargetId(null);
    };
  }, [enabled, targetId, setActiveTargetId, requestRemeasure]);

  // The overlay tree may be offset from the window origin (mounted deep
  // inside a screen), while target rects are window coordinates — track
  // our own window origin and size to translate between the two.
  const selfRef = useRef<View>(null);
  const [frame, setFrame] = useState<TourTargetRect | null>(null);

  if (!enabled) return null;

  // With a target declared, wait for its measurement before painting —
  // flashing a uniform dim over the very element we're about to spotlight
  // reads as a glitch.
  if (targetId && !rect) {
    return (
      <View
        ref={selfRef}
        pointerEvents="none"
        style={styles.container}
        onLayout={() => {
          selfRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) setFrame({ x, y, width, height });
          });
        }}
      />
    );
  }

  return (
    <View
      ref={selfRef}
      pointerEvents="none"
      style={styles.container}
      onLayout={() => {
        selfRef.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) setFrame({ x, y, width, height });
        });
      }}
    >
      {rect && frame ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <Svg width="100%" height="100%">
            <Path
              fillRule="evenodd"
              fill={DIM_COLOR}
              d={
                // Outer rect (full overlay) + inner rounded rect (hole).
                `M0,0 H${frame.width} V${frame.height} H0 Z ` +
                roundedRectPath(
                  rect.x - frame.x - HOLE_PAD,
                  rect.y - frame.y - HOLE_PAD,
                  rect.width + HOLE_PAD * 2,
                  rect.height + HOLE_PAD * 2,
                  HOLE_RADIUS,
                )
              }
            />
          </Svg>
        </Animated.View>
      ) : !targetId ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[StyleSheet.absoluteFill, { backgroundColor: DIM_COLOR }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // Above elevated screen content (Android), below the tooltip card
    // (elevation 14) and the floating nav bar (16).
    elevation: 10,
    zIndex: 10,
  },
});
