import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReelProgressBar } from '@/components/reels/ReelProgressBar';
import type { ReelGroup } from '@/lib/reels';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The overlay UI of the reel viewer — progress bar, material strip and the
 * two actions ("Ler completo" / "Concluir"). Positioning, fade-on-hold and
 * pointerEvents live in the parent; this component is plain layout.
 *
 * `group` is null while the end-of-set card is on screen — then only the
 * progress bar and the close button render.
 */

interface Props {
  group: ReelGroup | null;
  isRead: boolean;
  busy: boolean;
  setCount: number;
  setActiveIndex: number;
  counterText: string;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
  onReadFull: () => void;
  onMarkRead: () => void;
}

export function ReelChrome({
  group,
  isRead,
  busy,
  setCount,
  setActiveIndex,
  counterText,
  topInset,
  bottomInset,
  onClose,
  onReadFull,
  onMarkRead,
}: Props) {
  const { t } = useT();
  const dimIcon = group
    ? (DIMENSION_META[group.dimensionId].iconName as keyof typeof Ionicons.glyphMap)
    : null;

  return (
    <>
      {/* Top strip — scrim keeps the bar/title readable over bright art. */}
      <View style={[styles.top, { paddingTop: topInset + 10 }]} pointerEvents="box-none">
        <ReelProgressBar count={setCount} activeIndex={setActiveIndex} />
        <View style={styles.titleRow} pointerEvents="box-none">
          {/* Info strip is display-only: pointerEvents none lets taps fall
             through to the page zones instead of dying on a Text/View. */}
          <View style={styles.infoStrip} pointerEvents="none">
            {group && dimIcon ? (
              <>
                <View style={[styles.dimChip, { backgroundColor: group.accent + '2E' }]}>
                  <Ionicons name={dimIcon} size={13} color={group.accent} />
                </View>
                <Text style={styles.title} numberOfLines={1}>
                  {group.title}
                </Text>
                {group.langBadge ? (
                  <View style={styles.langBadge}>
                    <Text style={styles.langBadgeText}>{group.langBadge}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
            <Text style={styles.counter}>{counterText}</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('learning.reels.close')}
            focusable={false}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.75 }]}
            hitSlop={10}
          >
            <Ionicons name="close" size={20} color={tokens.text.hi} />
          </Pressable>
        </View>
      </View>

      {/* Bottom actions */}
      {group ? (
        <View style={[styles.bottom, { paddingBottom: bottomInset + 14 }]} pointerEvents="box-none">
          <Pressable
            onPress={onReadFull}
            accessibilityRole="button"
            focusable={false}
            style={({ pressed }) => [styles.readBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="book-outline" size={15} color={tokens.text.base} />
            <Text style={styles.readBtnText}>{t('learning.reels.readFull')}</Text>
          </Pressable>

          {isRead ? (
            <View style={[styles.ctaWrap, styles.ctaBtn, styles.ctaDone]} pointerEvents="none">
              <Ionicons name="checkmark-done" size={16} color={tokens.semantic.xp} />
              <Text style={[styles.ctaText, { color: tokens.semantic.xp }]}>
                {t('learning.detail.markedRead')}
              </Text>
            </View>
          ) : (
            <Pressable
              disabled={busy}
              onPress={onMarkRead}
              accessibilityRole="button"
              focusable={false}
              style={({ pressed }) => [styles.ctaWrap, pressed && !busy && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={tokens.gradient.completeBtn}
                locations={tokens.gradient.completeBtnLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaBtn}
              >
                {busy ? (
                  <ActivityIndicator color={tokens.text.hi} />
                ) : (
                  <>
                    <Text style={styles.ctaText}>{t('learning.detail.markRead')}</Text>
                    <Text style={styles.ctaSub}>+{group.xpPreview} XP</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.space[3],
    paddingBottom: tokens.space[4],
    backgroundColor: 'rgba(5, 7, 15, 0.35)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  infoStrip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimChip: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  langBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  langBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: tokens.text.base,
  },
  counter: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  readBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(5, 7, 15, 0.45)',
  },
  readBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
  ctaWrap: {
    flex: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: tokens.radius.md,
  },
  ctaDone: {
    backgroundColor: 'rgba(61, 214, 140, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.35)',
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  ctaSub: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
});
