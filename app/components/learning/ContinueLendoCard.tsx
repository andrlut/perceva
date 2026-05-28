import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import type { LearningFeedCard } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';

/**
 * "Continue lendo" hero card — surfaces the user's most recently
 * in-progress article so they can jump back into a single tap. Carries
 * the Perceva brand (engraved Topo Iris glyph, gold rim, gold-gradient
 * progress bar and play CTA) to feel like a sibling of the
 * TrackedRewardCard.
 *
 * Mounted at the top of the Learn feed when `useContinueReading()`
 * returns a non-null pick. Renders nothing otherwise.
 */

interface Props {
  card: LearningFeedCard;
  /** 0..100 — last scroll percentage we have for this material. */
  percent: number;
  onPress: () => void;
}

export function ContinueLendoCard({ card, percent, onPress }: Props) {
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const title = locale === 'pt' ? card.title_pt : card.title_en;
  const dim = meta.dim(card.dimension_id);

  // Remaining minutes — proportional to the unread portion. Clamped so
  // "1 min" still reads when only a sliver is left.
  const totalMin = Math.max(1, card.reading_minutes);
  const minLeft = Math.max(1, Math.round(totalMin * (1 - percent / 100)));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${t('learning.continueReading')}: ${title}`}
    >
      {/* Engraved Topo Iris glyph — top-right corner, deliberately spilling
         beyond the card so the visible portion is a clipped vignette. The
         clip happens via overflow:hidden on the wrap. */}
      <View style={styles.glyphWrap} pointerEvents="none">
        <PercevaGlyph size={260} bare palette="gilded" idSuffix="continue" />
      </View>

      <View style={styles.content}>
        <View style={styles.kicker}>
          <Ionicons name="bookmark" size={10} color={tokens.semantic.coinLight} />
          <Text style={styles.kickerText}>{t('learning.continueReading')}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.percentText}>
            {t('learning.continueProgress', { percent })}
          </Text>
          <Text style={styles.metaSep}>·</Text>
          <Text style={styles.metaText}>
            {t('learning.continueMinLeft', { count: minLeft })}
          </Text>
        </View>

        {/* Progress bar — gold 3-stop gradient, mirrors the Reward
           progress bar token. */}
        <View style={styles.barTrack}>
          <View style={[styles.barFillWrap, { width: `${percent}%` }]}>
            <LinearGradient
              colors={tokens.gradient.rewardBarFill}
              locations={tokens.gradient.rewardBarFillLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        </View>
      </View>

      {/* Gold play CTA — visual sibling of the Vault COMPRAR pill. */}
      <View style={styles.ctaWrap}>
        <LinearGradient
          colors={['#FFE890', '#FFC83D', '#C8881C'] as [string, string, string]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="play" size={13} color="#3D2A00" />
      </View>

      {/* Subtle dim accent on the left rim — keeps a hint of the
         article's dimension without overwhelming the gold brand. */}
      <View style={[styles.dimAccent, { backgroundColor: dim.color }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: tokens.space[4],
    marginBottom: tokens.space[3],
    borderRadius: tokens.radius.lg,
    backgroundColor: 'rgba(36, 42, 88, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.4)',
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3] + 2,
    paddingRight: tokens.space[3] + 44, // room for the CTA on the right
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
  // The whole glyph sits in the top-right corner, clipped by overflow.
  glyphWrap: {
    position: 'absolute',
    right: -50,
    top: -30,
    opacity: 0.09,
  },
  // Slim left bar tinted by the material's dim — barely visible, just
  // ties the card to its category without competing with the gold rim.
  dimAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kickerText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.text.hi,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  percentText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.semantic.coinLight,
  },
  metaSep: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
  },
  metaText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
  },
  barTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  ctaWrap: {
    position: 'absolute',
    right: 12,
    top: '50%',
    width: 36,
    height: 36,
    marginTop: -18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 138, 0.55)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
