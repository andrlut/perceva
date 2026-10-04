import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

/**
 * A miniature of a screen element inside a guide: lays its children out at
 * the width they have on the REAL screen (`naturalWidth`) and scales the
 * whole thing down to the width the guide has — never clipping, never
 * reflowing into something the screen never shows.
 *
 * Why: the guide sheet is ~80dp narrower than the screen, and a real
 * component squeezed into it breaks in ways the app never does (the reward
 * card's "RESGATAR" pill ran past the card's edge; "Trimestre" split
 * mid-word in the period chips). Scaled, it reads as what the owner liked
 * the guide for: a mini mock of the screen, same proportions.
 *
 * Layout box = the scaled size (height measured from the content), so the
 * guide around it flows normally. Hidden until both sizes are known, so the
 * first frame never flashes the unscaled overflow. Touches keep working —
 * React Native hit-tests through transforms.
 */
export function GuideFit({
  naturalWidth,
  children,
}: {
  naturalWidth: number;
  children: React.ReactNode;
}) {
  const [available, setAvailable] = useState(0);
  const [height, setHeight] = useState(0);
  const scale = available > 0 ? Math.min(1, available / naturalWidth) : 1;
  const ready = available > 0 && height > 0;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.width)}
      style={{
        width: '100%',
        height: ready ? height * scale : undefined,
        opacity: ready ? 1 : 0,
      }}
    >
      <View
        onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
        style={{
          width: naturalWidth,
          transform: [{ scale }],
          transformOrigin: 'top left',
        }}
      >
        {children}
      </View>
    </View>
  );
}
