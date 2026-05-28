import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { tokens } from '@/theme';

interface Props {
  children: React.ReactNode;
  /**
   * Overlay a soft gold halo at the top of the screen — "minted" feel
   * used by the Learn tab to align with the Perceva brand vocabulary
   * already in Rewards. Off by default to keep every other screen
   * unchanged. opacity ≤ 10% — more than that reads as yellow tint.
   */
  withGoldHalo?: boolean;
}

export function ScreenBackground({ children, withGoldHalo = false }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={tokens.gradient.screenAmbient}
        locations={tokens.gradient.screenAmbientLocations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      />
      {withGoldHalo && (
        <LinearGradient
          colors={['rgba(255,200,61,0.10)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg.deep,
  },
});
