import { useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** Where the video is, in seconds. */
  position: number;
  /** Its length in seconds (0 while it loads: the bar draws empty). */
  duration: number;
  /** How far a drag may go, in seconds. The first opening of a door caps it at
   *  what was already watched (going back is fine, skipping ahead is not); a
   *  rewatch passes the duration. */
  limit: number;
  width: number;
  onSeek: (seconds: number) => void;
}

/** 0:07, 1:02 — the length of a door video never needs hours. */
export function formatVideoTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The thin bar under a door video (owner, 2026-11-08): it shows that the video
 * is short and how far it has gone, and a drag or a tap seeks.
 *
 * Built on the plain touch responder rather than gesture-handler, so it works
 * inside any RN Modal without a GestureHandlerRootView of its own. The track's
 * children never take the touch (pointerEvents none), so the press's locationX
 * is measured against the bar itself; a drag adds the pageX travel to it.
 * While the finger is down the bar follows the finger, not the player; the
 * seek happens on release (and once on press, so a tap is enough).
 */
export function VideoScrubBar({ position, duration, limit, width, onSeek }: Props) {
  const { t } = useT();
  const [barW, setBarW] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const grant = useRef({ x: 0, pageX: 0 });

  const toSeconds = (x: number) => {
    if (barW <= 0 || duration <= 0) return 0;
    const s = (Math.min(Math.max(x, 0), barW) / barW) * duration;
    return Math.min(s, Math.max(0, limit));
  };

  const onGrant = (e: GestureResponderEvent) => {
    grant.current = { x: e.nativeEvent.locationX, pageX: e.nativeEvent.pageX };
    setDrag(toSeconds(grant.current.x));
  };
  const onMove = (e: GestureResponderEvent) => {
    setDrag(toSeconds(grant.current.x + (e.nativeEvent.pageX - grant.current.pageX)));
  };
  const onRelease = (e: GestureResponderEvent) => {
    const s = toSeconds(grant.current.x + (e.nativeEvent.pageX - grant.current.pageX));
    setDrag(null);
    onSeek(s);
  };

  const shown = drag ?? position;
  const frac = duration > 0 ? Math.min(1, Math.max(0, shown / duration)) : 0;
  const limitFrac = duration > 0 ? Math.min(1, Math.max(0, limit / duration)) : 0;
  const active = drag != null;

  return (
    <View style={[styles.wrap, { width }]}>
      <View
        style={styles.hit}
        onLayout={(e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => duration > 0}
        onMoveShouldSetResponder={() => duration > 0}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={() => setDrag(null)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('doorVideo.seekA11y')}
        accessibilityValue={{ text: `${formatVideoTime(shown)} / ${formatVideoTime(duration)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const step = e.nativeEvent.actionName === 'increment' ? 5 : -5;
          onSeek(Math.min(Math.max(0, position + step), Math.max(0, limit)));
        }}
      >
        <View style={[styles.track, active && styles.trackActive]} pointerEvents="none">
          {limitFrac < 1 ? (
            <View style={[styles.reach, { width: `${limitFrac * 100}%` }]} />
          ) : null}
          <View style={[styles.fill, { width: `${frac * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            active && styles.thumbActive,
            { left: frac * barW - (active ? 7 : 5), top: active ? 5 : 7 },
          ]}
        />
      </View>
      <View style={styles.times} pointerEvents="none">
        <Text style={styles.time}>{formatVideoTime(shown)}</Text>
        <Text style={styles.time}>{formatVideoTime(duration)}</Text>
      </View>
    </View>
  );
}

const TRACK = 3;

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  // The finger's target is 24px tall; the track inside it stays 3px.
  hit: { height: 24, justifyContent: 'center' },
  track: {
    height: TRACK,
    borderRadius: TRACK,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  trackActive: { height: 5 },
  // The stretch already watched on a first opening: reachable, so a shade
  // lighter than the rest.
  reach: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  fill: { height: '100%', backgroundColor: tokens.semantic.coin },
  thumb: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.semantic.coinLight,
  },
  thumbActive: { width: 14, height: 14, borderRadius: 7 },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  time: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.mid,
    fontVariant: ['tabular-nums'],
  },
});
