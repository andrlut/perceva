import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { ACTIVE_THEME, tokens } from '@/theme';

/**
 * The page after each set of REEL_SET_SIZE materials. Bounded-by-default:
 * the session ends here unless the user explicitly asks for the next set.
 * When the whole deck was shown it flips to the "all caught up" state and
 * points at the next content drop instead.
 */

interface Props {
  pageW: number;
  pageH: number;
  /** Materials shown so far in this session. */
  seenCount: number;
  /** Materials the deck still holds beyond what was shown. */
  remaining: number;
  onContinue: () => void;
  onClose: () => void;
}

export function SetEndCard({ pageW, pageH, seenCount, remaining, onContinue, onClose }: Props) {
  const { t } = useT();
  const hasMore = remaining > 0;

  return (
    <View style={[styles.page, { width: pageW, height: pageH }]}>
      <Ionicons
        name={hasMore ? 'sparkles' : 'checkmark-done-circle'}
        size={42}
        color={hasMore ? tokens.semantic.coin : tokens.semantic.xp}
      />
      <Text style={styles.title}>
        {hasMore ? t('learning.reels.setDone') : t('learning.reels.allSeen')}
      </Text>
      <Text style={styles.subtitle}>
        {hasMore
          ? t('learning.reels.seenToday', { count: seenCount })
          : t('learning.reels.nextDrop')}
      </Text>

      {hasMore ? (
        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="play" size={14} color={tokens.semantic.coin} />
          <Text style={styles.continueText}>
            {t('learning.reels.continueSet', { count: remaining })}
          </Text>
        </Pressable>
      ) : null}

      <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.closeText}>{t('learning.reels.swipeDownHint')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    // Unlike the reel stage (pinned dark to blend with the artwork),
    // this end-of-set page is plain UI — it follows the theme, and the
    // token text ramp above follows with it.
    backgroundColor: tokens.bg.deep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: tokens.space[7],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: tokens.space[3],
    paddingHorizontal: tokens.space[5],
    height: 44,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor:
      ACTIVE_THEME === 'light'
        ? 'rgba(166, 111, 14, 0.10)'
        : 'rgba(255, 200, 61, 0.10)',
  },
  continueText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.semantic.coinLight,
  },
  closeText: {
    marginTop: tokens.space[4],
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.dim,
  },
});
