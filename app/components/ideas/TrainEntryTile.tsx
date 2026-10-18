import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ENTRY_TILE_ART_HEIGHT, EntryTile } from '@/components/learning/EntryTile';
import { useT } from '@/lib/i18n';
import { TRAIN_MIN_FAVORITES } from '@/lib/ideaTraining';
import { tokens } from '@/theme';

/**
 * "Treinar" — the Recanto's door to the Treino do dia, beside the Explorar
 * tile in one row (same EntryTile shell). Always there, so the training is
 * findable before it opens: below TRAIN_MIN_FAVORITES it counts favorites
 * toward the bar ("2 de 5 favoritas"); after, the favorites due today, or
 * "Em dia" — still tappable, training is open any time. Without `onPress`
 * it is the guide's replica.
 */
export function TrainEntryTile({
  due,
  favorites,
  onPress,
  style,
}: {
  due: number;
  favorites: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  const unlocked = favorites >= TRAIN_MIN_FAVORITES;
  return (
    <EntryTile
      art={
        <View style={styles.art}>
          <Ionicons name="school-outline" size={20} color={tokens.semantic.coin} />
          {unlocked && due > 0 ? <View style={styles.dot} /> : null}
        </View>
      }
      title={t('learning.ideas.train.tile')}
      subtitle={
        !unlocked
          ? t('learning.ideas.train.unlockCount', { count: favorites, min: TRAIN_MIN_FAVORITES })
          : due > 0
          ? t('learning.ideas.train.tileDue', { count: due })
          : t('learning.ideas.train.caughtUpShort')
      }
      onPress={onPress}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  art: {
    width: 36,
    height: ENTRY_TILE_ART_HEIGHT,
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
});
