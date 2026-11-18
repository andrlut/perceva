import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import type { LifeScene } from '@/lib/api/lifeVision';
import type { DimensionId, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

/**
 * The pieces of "A vida que eu quero" — drawn by the screen (/vida), the Eu
 * tab's entry card and the screen's (i) alike, so the guide's replicas are
 * the real thing (docs/informativo-de-tela.md). Presentational only: no
 * queries, no navigation.
 */

const GOLD = tokens.semantic.coin;

/** An area's chip: its colour dot + label. */
export function DimChip({ dim }: { dim: DimensionId }) {
  const meta = useMetaLookup();
  return (
    <View style={styles.dimChip}>
      <View style={[styles.dot, { backgroundColor: DIMENSION_META[dim].color }]} />
      <Text style={styles.dimChipText}>{meta.dim(dim).label}</Text>
    </View>
  );
}

/** The headline + the three things, numbered, each with its area. */
export function VidaScenes({ headline, scenes }: { headline?: string | null; scenes: LifeScene[] }) {
  return (
    <View style={styles.scenesCard}>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}
      {scenes.map((s, i) => (
        <View key={i} style={styles.scene}>
          <Text style={styles.sceneNum}>{i + 1}</Text>
          <View style={styles.sceneBody}>
            <Text style={styles.sceneText}>{s.text}</Text>
            <DimChip dim={s.dim} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** A titled block of the screen (Sem culpa, O que sai, Primeira prática). */
export function VidaSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** The guilt-free subs, as chips in their area's colour. */
export function VidaSubChips({ subs }: { subs: SubId[] }) {
  const meta = useMetaLookup();
  return (
    <View style={styles.chips}>
      {subs.map((sub) => (
        <View key={sub} style={styles.chip}>
          <View
            style={[styles.dot, { backgroundColor: DIMENSION_META[SUB_META[sub].dimensionId].color }]}
          />
          <Text style={styles.chipText}>{meta.sub(sub).label}</Text>
        </View>
      ))}
    </View>
  );
}

/** What goes: struck-through chips. */
export function VidaCutChips({ cuts }: { cuts: string[] }) {
  return (
    <View style={styles.chips}>
      {cuts.map((c, i) => (
        <View key={i} style={[styles.chip, styles.cutChip]}>
          <Text style={[styles.chipText, styles.cutText]}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

/** The first practice, tied to thing 1. */
export function VidaPracticeRow({
  title,
  icon,
  archived,
}: {
  title: string;
  icon: string | null;
  archived?: boolean;
}) {
  const { t } = useT();
  return (
    <View style={styles.practice}>
      <View style={styles.practiceIcon}>
        <AppIcon name={icon || 'checkmark-circle-outline'} size={18} color={tokens.text.hi} />
      </View>
      <View style={styles.practiceBody}>
        <Text style={styles.practiceTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.practiceCaption}>
          {archived ? t('vida.practiceArchived') : t('vida.practiceTied')}
        </Text>
      </View>
    </View>
  );
}

/**
 * The card on top of Eu › Desejada. With a vision: the headline and the
 * three things, compact. Without: an invitation with the gold button — the
 * same anatomy as the pillar's first-step card.
 */
export function VidaEntryCard({
  headline,
  scenes,
  onPress,
}: {
  headline?: string | null;
  scenes: LifeScene[] | null;
  onPress: () => void;
}) {
  const { t } = useT();
  const empty = !scenes || scenes.length === 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.entry, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={t('vida.entryA11y')}
    >
      <View style={styles.entryHead}>
        <View style={styles.entryIcon}>
          <Ionicons name="sparkles-outline" size={18} color={tokens.semantic.coinLight} />
        </View>
        <View style={styles.entryHeadText}>
          <Text style={styles.entryEyebrow}>{t('vida.title')}</Text>
          <Text style={styles.entryTitle} numberOfLines={2}>
            {empty ? t('vida.entryEmptyTitle') : headline || t('vida.subtitle')}
          </Text>
        </View>
        {empty ? (
          <View style={styles.entryBtn}>
            <Text style={styles.entryBtnText}>{t('vida.draw')}</Text>
            <Ionicons name="arrow-forward" size={14} color={tokens.semantic.coinInk} />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={tokens.text.mid} />
        )}
      </View>
      {!empty &&
        scenes.map((s, i) => (
          <View key={i} style={styles.entryScene}>
            <View style={[styles.dot, { backgroundColor: DIMENSION_META[s.dim].color }]} />
            <Text style={styles.entrySceneText} numberOfLines={1}>
              {s.text}
            </Text>
          </View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
  dimChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
  },
  dimChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  scenesCard: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
  },
  headline: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    lineHeight: 27,
    color: GOLD,
  },
  scene: { flexDirection: 'row', gap: tokens.space[3], alignItems: 'flex-start' },
  sceneNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinInk,
    backgroundColor: GOLD,
  },
  sceneBody: { flex: 1, gap: 6 },
  sceneText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.hi,
  },
  section: {
    gap: tokens.space[2],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  sectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
  },
  chipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  cutChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  cutText: {
    color: tokens.text.mid,
    textDecorationLine: 'line-through',
  },
  practice: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[3] },
  practiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
  },
  practiceBody: { flex: 1, gap: 2 },
  practiceTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  practiceCaption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },
  entry: {
    gap: 8,
    padding: 14,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
  },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryHeadText: { flex: 1, gap: 1 },
  entryEyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  entryTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  entryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: tokens.radius.pill,
    backgroundColor: GOLD,
  },
  entryBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinInk,
  },
  entryScene: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 52,
  },
  entrySceneText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.base,
  },
});
