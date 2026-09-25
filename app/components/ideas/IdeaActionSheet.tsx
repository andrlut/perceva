import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSheetBottomInset } from '@/components/useSheetBottomInset';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  visible: boolean;
  ideaTitle: string;
  /** Current review decision — drives the favorite item's label and icon. */
  favorite: boolean;
  onCancel: () => void;
  onOpen: () => void;
  onToggleFavorite: () => void;
}

/**
 * Bottom-sheet menu opened by long-press on an idea card in "Minhas ideias".
 * Same pattern as TaskActionSheet / RewardActionSheet: tap flips the card,
 * hold opens this menu — open the whole idea, or add/remove it from the
 * favorites (`review_idea` is re-reviewable, so this re-decides the swipe).
 * Keeping these here frees the back of the card for the claim alone.
 */
export function IdeaActionSheet({
  visible,
  ideaTitle,
  favorite,
  onCancel,
  onOpen,
  onToggleFavorite,
}: Props) {
  const { t } = useT();
  const sheetBottom = useSheetBottomInset();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { paddingBottom: sheetBottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={2}>
            {ideaTitle}
          </Text>

          <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="book-outline" size={18} color={tokens.brand.violet2} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>{t('learning.ideas.menu.open')}</Text>
              <Text style={styles.actionSub}>{t('learning.ideas.menu.openSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
          </Pressable>

          <Pressable
            onPress={onToggleFavorite}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name={favorite ? 'star' : 'star-outline'}
                size={18}
                color={tokens.semantic.coin}
              />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>
                {favorite
                  ? t('learning.ideas.menu.unfavorite')
                  : t('learning.ideas.menu.favorite')}
              </Text>
              <Text style={styles.actionSub}>
                {favorite
                  ? t('learning.ideas.menu.unfavoriteSub')
                  : t('learning.ideas.menu.favoriteSub')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: tokens.space[4],
    paddingBottom: tokens.space[6],
    gap: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
    marginBottom: tokens.space[3],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
    paddingHorizontal: 4,
    marginBottom: tokens.space[3],
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.base,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  actionSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
    lineHeight: 14,
  },
  cancelBtn: {
    marginTop: tokens.space[3],
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: tokens.bg.base,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
});
