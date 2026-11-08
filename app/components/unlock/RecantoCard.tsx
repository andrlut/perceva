import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFeaturedIdea } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { ideaImageUriFromPath } from '@/lib/ideas';
import { useDoorPending, useIsLocked, useUnlockStore } from '@/lib/unlock/store';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The Recanto's card on Hoje (Onboarding simples, André's call 19/10): one
 * FIXED, strong idea about habits — not the newest one — as the lure into
 * Aprender while that tab is still locked. Opening it is the progression
 * trigger for the Aprender tab ("Abrir uma ideia pelo card"); the tab's own
 * animated door still runs on its first open.
 *
 * Shows while Aprender is locked OR its door has not been seen yet; gone for
 * grandfathered accounts (nothing to unlock) and once the tab was opened.
 */
export function RecantoCard() {
  const { t, locale } = useT();
  const router = useRouter();
  const locked = useIsLocked('learning');
  const doorPending = useDoorPending('learning');
  const unlock = useUnlockStore((s) => s.unlock);
  const idea = useFeaturedIdea();

  if (!locked && !doorPending) return null;
  if (!idea.data) return null;

  const row = idea.data;
  const dim = DIMENSION_META[row.dimension_id];
  const title = (locale === 'pt' ? row.title_pt : row.title_en) || row.title_pt;
  const image = ideaImageUriFromPath(row.image_path);

  const open = () => {
    Haptics.selectionAsync().catch(() => {});
    if (locked) void unlock('learning', 'progress');
    router.push({
      pathname: '/idea/[slug]',
      params: { slug: row.slug, idea: String(row.ordinal) },
    });
  };

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.card, { borderColor: `${dim.color}55` }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('home.recantoCard.a11y', { title })}
    >
      <View style={[styles.thumb, { backgroundColor: dim.bg }]}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="bulb-outline" size={22} color={dim.color} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.eyebrowRow}>
          <Ionicons name="bulb" size={12} color={tokens.semantic.coin} />
          <Text style={styles.eyebrow}>{t('home.recantoCard.eyebrow')}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.cta, { color: dim.color }]}>{t('home.recantoCard.cta')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Lives inside Hoje's taskList: no horizontal margin of its own, so it
  // spans the same width as the practice cards, with their radius.md.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    marginTop: tokens.space[2],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    backgroundColor: tokens.bg.surface,
  },
  pressed: { opacity: 0.85 },
  thumb: {
    width: 56,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 3 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  cta: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    marginTop: 2,
  },
});
