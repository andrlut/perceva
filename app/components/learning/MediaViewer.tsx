import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ResumableZoom } from 'react-native-zoom-toolkit';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Fullscreen pinch-zoom viewer for an infographic (or a deck page, later).
 * Lives in a Modal — Android Modals render in their own native root, so the
 * gesture handlers need their own GestureHandlerRootView inside.
 */

interface Props {
  open: boolean;
  uri: string;
  /** Natural pixel size of the image (from the media row's meta). */
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  onClose: () => void;
}

export function MediaViewer({ open, uri, width, height, alt, onClose }: Props) {
  const { t } = useT();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const naturalW = width ?? 1080;
  const naturalH = height ?? 1920;
  // Contain-fit the image inside the screen; ResumableZoom takes it from there.
  const scale = Math.min(screenW / naturalW, screenH / naturalH);
  const fitW = naturalW * scale;
  const fitH = naturalH * scale;

  return (
    <Modal visible={open} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <ResumableZoom maxScale={4}>
          <Image
            source={{ uri }}
            style={{ width: fitW, height: fitH }}
            contentFit="contain"
            accessibilityLabel={alt ?? undefined}
          />
        </ResumableZoom>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('learning.media.closeViewer')}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.75 }]}
          hitSlop={10}
        >
          <Ionicons name="close" size={22} color={tokens.text.hi} />
        </Pressable>
        {alt ? (
          <View style={styles.altWrap} pointerEvents="none">
            <Text style={styles.altText} numberOfLines={2}>
              {alt}
            </Text>
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05070F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  altWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  altText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: tokens.text.mid,
    textAlign: 'center',
  },
});
