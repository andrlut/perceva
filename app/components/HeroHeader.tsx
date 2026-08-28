import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { PercevaGlyph } from '@/components/PercevaGlyph';
import { useCharacter } from '@/lib/api/character';
import { useT } from '@/lib/i18n';
import { useDiscBlend } from '@/lib/psych/useDiscBlend';
import { levelProgress } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

const AVATAR = 92;
const RING_R = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

/**
 * Iris-Wrapped Avatar — full-width header for the Eu tab. A Perceva-native
 * composition: concentric brand rings + gold-path signature + dim-tile
 * center + XP progress arc wrapping the whole avatar. The eyebrow carries
 * the user's DISC archetype (an earned, self-knowledge identity — "LV 12 ·
 * O TIMONEIRO") instead of a level-derived nickname; the name reads big and
 * quiet.
 *
 * Not a card — no border, full-width, soft violet halo + brand watermark.
 * The whole avatar + text block is tappable: it opens /perfil, the hero's
 * status sheet with the six deep instruments (the DISC archetype shown in
 * the eyebrow lives there too). Data is read via hooks; self-contained.
 */
export function HeroHeader() {
  const character = useCharacter();
  const { t } = useT();
  const router = useRouter();
  const blend = useDiscBlend();

  const totalXp = character.data?.character.total_xp ?? 0;
  const lp = levelProgress(totalXp);
  const displayName = character.data?.profile.display_name ?? 'Hero';

  // Dominant dim = the dim carrying the most XP. Falls back to "body"
  // for brand-new accounts where every dim is at zero. Drives the avatar
  // tile; the identity title now comes from DISC, not the dominant dim.
  const dominantDim = useMemo(() => {
    const dims = character.data?.dimensions ?? [];
    if (dims.length === 0) return null;
    return dims.reduce((a, b) => (b.xp > a.xp ? b : a), dims[0]);
  }, [character.data?.dimensions]);

  const dimId = dominantDim?.dimension_id ?? 'body';
  const dimMeta = DIMENSION_META[dimId];

  // Progress arc — proportion of the current level's XP earned.
  const progressFraction = lp.fraction;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progressFraction);

  const archetype = blend.status === 'ready' ? blend.content.name : null;
  const goPerfil = () => router.push('/perfil');

  return (
    <View style={styles.root}>
      {/* Brand watermark — a faint Perceva glyph on the right edge, the same
          gilded mark the Learn and Autoconhecimento surfaces carry. Behind
          everything, non-interactive. Gives the header the branded feel the
          other tabs have instead of a bare avatar row. */}
      <View style={styles.watermark} pointerEvents="none">
        <PercevaGlyph size={190} bare palette="primary" idSuffix="hero-mark" />
      </View>

      {/* Ambient violet halo — a soft radial glow behind the avatar. The SVG
          is SQUARE with the circle radius = half its side, so the gradient
          reaches full transparency exactly at every edge: no matter where the
          box ends there is no visible boundary, so it can never read as the
          hard seam / line the earlier rectangular version did (its bottom
          edge was clipped while the glow was still ~5% opaque). */}
      <View style={styles.halo} pointerEvents="none">
        <Svg width={520} height={520} viewBox="0 0 520 520">
          <Defs>
            <RadialGradient id="hero-halo" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#9B82FF" stopOpacity={0.22} />
              <Stop offset="0.55" stopColor="#9B82FF" stopOpacity={0.07} />
              <Stop offset="1" stopColor="#9B82FF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={260} cy={260} r={260} fill="url(#hero-halo)" />
        </Svg>
      </View>

      <Pressable
        style={styles.row}
        onPress={goPerfil}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={t('hero.perfilA11y')}
      >
        {/* Avatar — single SVG, layered: progress ring, brand rings,
            gold path, dim tile. Icon overlay sits on top in a View so
            we can use the Ionicon font directly. */}
        <View style={styles.avatarWrap}>
          <Svg width={AVATAR} height={AVATAR} viewBox={`0 0 ${AVATAR} ${AVATAR}`}>
            <Defs>
              <SvgLinearGradient
                id="xpRing"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <Stop offset="0" stopColor="#A08FFF" />
                <Stop offset="1" stopColor="#7B5CFF" />
              </SvgLinearGradient>
            </Defs>

            {/* XP progress ring — track + colored fill. Rotated -90 so
                fill starts at the top. */}
            <Circle
              cx={46}
              cy={46}
              r={RING_R}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={4}
              fill="none"
            />
            <Circle
              cx={46}
              cy={46}
              r={RING_R}
              stroke="url(#xpRing)"
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 46 46)`}
            />

            {/* Concentric brand rings — Topo Iris reference in miniature. */}
            <Circle
              cx={46}
              cy={46}
              r={34}
              stroke="rgba(255,227,166,0.35)"
              strokeWidth={1}
              fill="none"
            />
            <Circle
              cx={46}
              cy={46}
              r={28}
              stroke="rgba(255,227,166,0.35)"
              strokeWidth={1}
              fill="none"
            />
            <Circle
              cx={46}
              cy={46}
              r={22}
              stroke="rgba(255,227,166,0.35)"
              strokeWidth={1}
              fill="none"
            />

            {/* Gold diagonal — the brand signature. */}
            <Path
              d="M 22 65 Q 36 56 46 46 Q 56 36 70 27"
              fill="none"
              stroke="#FFE3A6"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.65}
            />
            <Circle cx={22} cy={65} r={1.8} fill="#FFE3A6" opacity={0.75} />
            <Circle cx={70} cy={27} r={1.8} fill="#FFE3A6" opacity={0.75} />

            {/* Dim tile — color matches the dominant dim. */}
            <Circle
              cx={46}
              cy={46}
              r={18}
              fill={dimMeta.bg}
              stroke={`${dimMeta.color}73`}
              strokeWidth={1}
            />
          </Svg>
          <View style={styles.avatarIcon} pointerEvents="none">
            <Ionicons
              name={dimMeta.iconName as never}
              size={22}
              color={dimMeta.color}
            />
          </View>
        </View>

        {/* Text column — part of the same /perfil press target. */}
        <View style={styles.textCol}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowLv}>LV {lp.level}</Text>
            {archetype && (
              <>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowTitle} numberOfLines={1}>
                  {archetype.toUpperCase()}
                </Text>
              </>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {blend.status === 'none' && (
            <View style={styles.discCta}>
              <Ionicons
                name="sparkles-outline"
                size={11}
                color={tokens.semantic.coinLight}
              />
              <Text style={styles.discCtaText}>{t('hero.discCta')}</Text>
              <Ionicons
                name="chevron-forward"
                size={11}
                color={tokens.semantic.coinLight}
              />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 20,
    // overflow visible so the radial halo and glyph watermark can tail off
    // into the screen background instead of being cut at the header box.
    overflow: 'visible',
  },
  halo: {
    position: 'absolute',
    top: -170,
    left: '50%',
    marginLeft: -260,
    width: 520,
    height: 520,
  },
  watermark: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -95,
    opacity: 0.06,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    position: 'relative',
  },
  avatarIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  eyebrowLv: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: tokens.brand.violet2,
    textTransform: 'uppercase',
  },
  eyebrowDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: tokens.text.faint,
  },
  eyebrowTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: tokens.semantic.coinLight,
    flexShrink: 1,
  },
  name: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: tokens.text.hi,
    marginTop: 2,
  },
  discCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  discCtaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.3,
    color: tokens.semantic.coinLight,
  },
});
