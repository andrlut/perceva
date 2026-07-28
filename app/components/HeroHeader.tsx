import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useMomentum } from '@/lib/api/momentum';
import { useSkillStates } from '@/lib/api/skills';
import { useT } from '@/lib/i18n';
import { useDiscBlend } from '@/lib/psych/useDiscBlend';
import { levelProgress, momentumTier } from '@/lib/xp';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

type IoniconName = keyof typeof Ionicons.glyphMap;

function StatChip({
  icon,
  color,
  value,
}: {
  icon: IoniconName;
  color: string;
  value: string;
}) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const AVATAR = 92;
const RING_R = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

/**
 * Iris-Wrapped Avatar — full-width header for the Eu tab. A Perceva-native
 * composition: concentric brand rings + gold-path signature + dim-tile
 * center + XP progress arc wrapping the whole avatar. The eyebrow carries
 * the user's DISC archetype (an earned, self-knowledge identity — "LV 12 ·
 * O TIMONEIRO") instead of a level-derived nickname; the name reads big and
 * quiet; a glance-stat strip (one number per pillar) sits below.
 *
 * Not a card — no border, full-width, soft violet halo + brand watermark.
 * The text column is tappable: it opens the DISC result, or invites the
 * test when none is taken. Data is read via hooks; self-contained.
 */
export function HeroHeader() {
  const character = useCharacter();
  const { t } = useT();
  const router = useRouter();
  const blend = useDiscBlend();
  const momentum = useMomentum();
  const skillStates = useSkillStates();

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
  const goDisc = () => router.push('/disc');

  // Glance-stat strip — one stat per pillar. All from queries the Eu tab
  // already mounts (useCharacter/useMomentum/useSkillStates), so cache hits.
  const selfAvg = useMemo(() => {
    const rows = (character.data?.subScores ?? []).filter(
      (r) => r.source === 'self',
    );
    if (rows.length === 0) return 0;
    const sum = rows.reduce((s, r) => s + (r.score_decimal ?? r.score), 0);
    return sum / rows.length;
  }, [character.data?.subScores]);

  const momTier = useMemo(() => {
    const attrs = momentum.data?.attributes ?? [];
    if (attrs.length === 0) return momentumTier(0);
    const sum = attrs.reduce((s, a) => s + a.momentum, 0);
    return momentumTier(Math.round(sum / attrs.length));
  }, [momentum.data?.attributes]);

  const medals = useMemo(
    () =>
      (skillStates.data ?? []).filter(
        (s) => s.currentTier.tier_name !== 'beginner',
      ).length,
    [skillStates.data],
  );

  return (
    <View style={styles.root}>
      {/* Brand watermark — a faint Perceva glyph on the right edge, the same
          gilded mark the Learn and Autoconhecimento surfaces carry. Behind
          everything, non-interactive. Gives the header the branded feel the
          other tabs have instead of a bare avatar row. */}
      <View style={styles.watermark} pointerEvents="none">
        <PercevaGlyph size={190} bare palette="primary" idSuffix="hero-mark" />
      </View>

      {/* Ambient violet halo — a soft radial that tails into the screen
          background on its own. The old top-left disk was clipped flat at the
          header's bottom edge (overflow:hidden), which read as a hard seam;
          this fades to transparent well before any edge, matching VaultHero. */}
      <View style={styles.halo} pointerEvents="none">
        <Svg width={520} height={360} viewBox="0 0 520 360">
          <Defs>
            <RadialGradient id="hero-halo" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#9B82FF" stopOpacity={0.22} />
              <Stop offset="0.55" stopColor="#9B82FF" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#9B82FF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={260} cy={180} r={260} fill="url(#hero-halo)" />
        </Svg>
      </View>

      <View style={styles.row}>
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

        {/* Text column — tappable into the DISC result / test. */}
        <Pressable
          style={styles.textCol}
          onPress={goDisc}
          disabled={blend.status === 'loading'}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={
            archetype
              ? t('hero.discChipA11y', { name: archetype })
              : t('hero.discCtaA11y')
          }
        >
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
        </Pressable>
      </View>

      {/* Glance-stat strip — one number per pillar (perceived score average,
          practiced-momentum tier, desired-medal count). Read-only. */}
      <View style={styles.statStrip}>
        <StatChip
          icon="eye-outline"
          color={tokens.brand.violet2}
          value={selfAvg.toFixed(1)}
        />
        <StatChip
          icon="pulse"
          color={tokens.semantic.xp2}
          value={t(`home.momentum.tier.${momTier}`).toUpperCase()}
        />
        <StatChip
          icon="compass-outline"
          color={tokens.semantic.coin}
          value={String(medals)}
        />
      </View>

      {/* Faint horizontal divider — separates header from the tab body
          without drawing a hard line. The XP progress story already lives
          in the avatar's ring; a second bar here was redundant. */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.06)',
          'rgba(255,255,255,0.06)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.divider}
      />

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
    top: -110,
    left: '50%',
    marginLeft: -260,
    width: 520,
    height: 360,
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
  statStrip: {
    flexDirection: 'row',
    gap: tokens.space[2],
    marginTop: tokens.space[3],
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  statValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    marginTop: 18,
    marginHorizontal: -20,
  },
});
