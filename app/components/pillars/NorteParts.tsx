import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The pieces of the Norte by area — drawn by the panel (Eu › Desejada) and by
 * the tab's (i) alike, so the guide's replicas are the real thing
 * (docs/informativo-de-tela.md). Presentational only: no queries, no
 * navigation.
 */

const GOLD = tokens.semantic.coin;

/**
 * The area's phrase, above its ruler: "Quero poder escolher…" and what the
 * person wrote; under it, how it is today when they said. With nothing
 * written yet, a scene of "A vida que eu quero" in this area stands in as a
 * suggestion (module on), or the line invites them to write.
 */
export function NorthPhrase({
  want,
  today,
  seal,
  suggestion,
}: {
  want: string | null;
  today?: string | null;
  /** The phrase reads exactly like a scene of "A vida que eu quero". */
  seal?: boolean;
  /** A scene of this area, shown while nothing is written. */
  suggestion?: string | null;
}) {
  const { t } = useT();
  return (
    <View style={styles.phrase}>
      <Text style={styles.eyebrow}>{t('norte.wantLabel')}</Text>
      {want ? (
        <Text style={styles.want}>{want}</Text>
      ) : suggestion ? (
        <Text style={[styles.want, styles.suggested]}>{suggestion}</Text>
      ) : (
        <Text style={styles.empty}>{t('norte.wantEmpty')}</Text>
      )}
      {today ? (
        <Text style={styles.today}>
          <Text style={styles.todayLabel}>{t('norte.todayInline')} </Text>
          {today}
        </Text>
      ) : null}
      {(seal || (!want && suggestion)) && (
        <VidaSeal suggestion={!want && !!suggestion} />
      )}
    </View>
  );
}

/** "da vida que eu quero" — the phrase (or the suggestion) came from there. */
export function VidaSeal({ suggestion }: { suggestion?: boolean }) {
  const { t } = useT();
  return (
    <View style={styles.seal}>
      <Ionicons name="sparkles" size={11} color={tokens.semantic.coinLight} />
      <Text style={styles.sealText}>
        {suggestion ? t('norte.sealSuggestion') : t('norte.seal')}
      </Text>
    </View>
  );
}

/**
 * "Ainda é isso?" — inside the card of an area whose phrase was written (or
 * last confirmed) six months ago or more. "Ainda é" keeps it and resets the
 * clock; "Mudar" opens the editor on the area.
 */
export function NorthReview({
  reached,
  onKeep,
  onChange,
}: {
  /** Sub names whose target today already reached. */
  reached?: string[];
  onKeep: () => void;
  onChange: () => void;
}) {
  const { t } = useT();
  return (
    <View style={styles.review}>
      <View style={styles.reviewHead}>
        <Ionicons name="time-outline" size={15} color={GOLD} />
        <Text style={styles.reviewText}>
          {t('norte.reviewQuestion')}
          {reached && reached.length > 0 ? (
            <Text style={styles.reviewReached}>
              {' '}
              {t('norte.reviewReached', { subs: reached.join(', ') })}
            </Text>
          ) : null}
        </Text>
      </View>
      <View style={styles.reviewBtns}>
        <Pressable
          onPress={onKeep}
          style={({ pressed }) => [styles.btn, styles.btnKeep, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          hitSlop={6}
        >
          <Text style={styles.btnKeepText}>{t('norte.reviewKeep')}</Text>
        </Pressable>
        <Pressable
          onPress={onChange}
          style={({ pressed }) => [styles.btn, styles.btnChange, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          hitSlop={6}
        >
          <Text style={styles.btnChangeText}>{t('norte.reviewChange')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A folded area: its two subs "today → target" on one muted line. */
export function NorthFolded({ line }: { line: string }) {
  return (
    <Text style={styles.folded} numberOfLines={1}>
      {line}
    </Text>
  );
}

const styles = StyleSheet.create({
  phrase: { gap: 4 },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: GOLD,
  },
  want: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.hi,
  },
  suggested: { color: tokens.text.mid, fontStyle: 'italic' },
  empty: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: tokens.text.dim,
  },
  today: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.mid,
  },
  todayLabel: { fontFamily: 'Manrope_800ExtraBold', color: tokens.text.dim },
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
  },
  sealText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.semantic.coinLight,
  },
  review: {
    gap: 8,
    padding: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255, 200, 61, 0.08)',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reviewText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.hi,
  },
  reviewReached: { fontFamily: 'Manrope_500Medium', color: tokens.text.mid },
  reviewBtns: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: tokens.radius.pill,
  },
  btnKeep: { backgroundColor: GOLD },
  btnKeepText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12.5,
    color: tokens.semantic.coinInk,
  },
  btnChange: { borderWidth: 1, borderColor: tokens.border.strong },
  btnChangeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12.5,
    color: tokens.text.hi,
  },
  folded: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
    fontVariant: ['tabular-nums'],
  },
});
