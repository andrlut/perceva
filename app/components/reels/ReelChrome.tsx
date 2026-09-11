import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReelProgressBar } from '@/components/reels/ReelProgressBar';
import type { ReelGroup } from '@/lib/reels';
import { useT } from '@/lib/i18n';
// PINNED-DARK SURFACE: the reel chrome floats over dark infographic
// artwork in BOTH themes (stories-player semantics — a light stage
// around dark art would look broken). Import the dark palette
// directly so light-theme boots don't flip these labels to ink over
// the dark imagery.
import { tokens } from '@/theme/tokens';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The overlay UI of the reel viewer — progress bar, material strip and the
 * two actions. Positioning, fade-on-hold and pointerEvents live in the
 * parent; this component is plain layout.
 *
 * Legacy group:  "Ler completo" / "Concluir" (+XP) → "Concluído" once read.
 * Idea group:    "Ler completo" / "Abrir ideia" → a gold "Absorvida" chip
 *                once the idea is in the collection. There is NO mark-read
 *                path for ideas here: absorbing happens only on the idea
 *                screen's card (`collect_idea`), never from Explorar.
 *
 * `group` is null while the end-of-set card is on screen — then only the
 * progress bar and the close button render.
 */

interface Props {
  group: ReelGroup | null;
  /** Legacy: material read. Idea: idea collected. */
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
  onOpenIdea: () => void;
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
  onOpenIdea,
}: Props) {
  const { t } = useT();
  const dimIcon = group
    ? (DIMENSION_META[group.dimensionId].iconName as keyof typeof Ionicons.glyphMap)
    : null;
  const isIdea = group?.kind === 'idea';
  // The strip names the MATERIAL: for an idea the headline on the page is
  // already the idea's title, so the strip gives the parent as context.
  const stripTitle = group
    ? group.kind === 'idea'
      ? group.materialTitle || group.title
      : group.title
    : '';

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
                  {stripTitle}
                </Text>
                {group.kind === 'legacy' && group.langBadge ? (
                  <View style={styles.langBadge}>
                    <Text style={styles.langBadgeText}>{group.langBadge}</Text>
                  </View>
                ) : null}
                {group.kind === 'idea' && group.hasVideo ? (
                  <Ionicons name="videocam-outline" size={13} color={tokens.text.mid} />
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

          {isIdea ? (
            isRead ? (
              // Absorbed ideas stay reachable from the reel: tapping the chip
              // reopens the idea screen (to rewatch the video) — the RPC is
              // never called again, so this is a pure navigation.
              <Pressable
                onPress={onOpenIdea}
                accessibilityRole="button"
                accessibilityLabel={`${t('learning.ideas.absorbed')} · ${t('learning.ideas.openIdea')}`}
                focusable={false}
                style={({ pressed }) => [styles.ctaWrap, styles.absorbedSlot, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.absorbedChip}>
                  <Ionicons name="checkmark-circle" size={14} color={tokens.semantic.coin} />
                  <Text style={styles.absorbedText}>{t('learning.ideas.absorbed')}</Text>
                  <Ionicons name="arrow-forward" size={12} color={tokens.semantic.coin} />
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={onOpenIdea}
                accessibilityRole="button"
                focusable={false}
                style={({ pressed }) => [styles.ctaWrap, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={tokens.gradient.completeBtn}
                  locations={tokens.gradient.completeBtnLocations}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.ctaBtn}
                >
                  <Text style={styles.ctaText}>{t('learning.ideas.openIdea')}</Text>
                  <Ionicons name="arrow-forward" size={15} color={tokens.text.hi} />
                </LinearGradient>
              </Pressable>
            )
          ) : isRead ? (
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
  /** Same slot as the legacy "Concluído" state, but the chip stays small —
   *  a state label, not a button. */
  absorbedSlot: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absorbedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  absorbedText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.3,
    color: tokens.semantic.coin,
  },
});
