import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ENTRY_TILE_ART_HEIGHT, EntryTile } from '@/components/learning/EntryTile';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * "Treinar" — the Recanto's door to the Treino do dia, beside the Explorar
 * tile in one row (same EntryTile shell). Shown by the parent only when the
 * reader has at least one favorite; the count is the favorites due today.
 * Without `onPress` it is the guide's replica.
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
  return (
    <EntryTile
      art={
        <View style={styles.art}>
          <Ionicons name="school-outline" size={20} color={tokens.semantic.coin} />
          {due > 0 ? <View style={styles.dot} /> : null}
        </View>
      }
      title={t('learning.ideas.train.tile')}
      subtitle={
        due > 0
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
