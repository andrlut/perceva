import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * "Treinar" — the Recanto's door to the Treino do dia, sitting beside the
 * Explorar card in one row. Same anatomy as that card (art on the left, a
 * title and one line of count on the right, glass with the gold rim), so the
 * row reads as two siblings and not as a banner plus a button. Shown by the
 * parent only when the reader has at least one favorite; the count is the
 * favorites due today. Without `onPress` it is the guide's replica.
 */
export function TrainEntryTile({
  due,
  onPress,
  style,
}: {
  due: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  const subtitle =
    due > 0
      ? t('learning.ideas.train.tileDue', { count: due })
      : t('learning.ideas.train.caughtUpShort');
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${t('learning.ideas.train.tile')} · ${subtitle}`}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.art}>
          <Ionicons name="school-outline" size={20} color={tokens.semantic.coin} />
          {due > 0 ? <View style={styles.dot} /> : null}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {t('learning.ideas.train.tile')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  // Same footprint as the Explorar thumbnail stack's height, so both tiles
  // come out the same height without a fixed one.
  art: {
    width: 36,
    height: 42,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: tokens.semantic.coin,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
    marginTop: 1,
  },
});
