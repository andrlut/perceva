import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { learningMediaUrl } from '@/lib/learningMedia';

/**
 * The partner's logo over a sponsored material's art — top-right corner of
 * the cover card and of the material hero (the maintainer's ask: "só pra
 * identificar que é deles"). A layer in the app, never baked into the
 * image: the cover's top belongs to the title, and a baked logo would sit
 * under it. The file carries its own background (Paker's navy), so it reads
 * on any art; we only round it and give it a hairline.
 */
const LOGO_ASPECT = 640 / 187;

export function SponsorLogo({
  path,
  name,
  height,
  style,
}: {
  /** Bucket-relative path in learning-media (`sponsor.logo_path`). */
  path: string;
  name: string;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[styles.wrap, { height, width: Math.round(height * LOGO_ASPECT), borderRadius: Math.round(height * 0.22) }, style]}
      accessibilityRole="image"
      accessibilityLabel={name}
      pointerEvents="none"
    >
      <Image
        source={{ uri: learningMediaUrl(path) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
});
