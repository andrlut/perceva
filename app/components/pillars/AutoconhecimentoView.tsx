import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  BigFiveCard,
  DiscCard,
  EcrRCard,
  SchwartzCard,
  StrengthsCard,
  TypesCard,
} from '@/app/profile-mirror';
import { PercevaGlyph } from '@/components/PercevaGlyph';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Autoconhecimento sub-view (Pilar Percebida). Surfaces the 3 deeper
 * psychometric inventories — Big Five, Schwartz Values, ECR-R Attachment —
 * with their full result-summary cards (top-3 values, 5-trait bars,
 * attachment style headline) instead of bare name + status rows.
 *
 * The cards are the same ones rendered in /profile-mirror — reused via
 * export so the answer-preview surface stays consistent and we don't
 * duplicate score-fetching logic.
 *
 * These inventories do NOT feed the Avaliação hex (different measurement
 * model — personality / values / attachment, not life-area scores).
 */
export function AutoconhecimentoView() {
  const router = useRouter();
  const { t } = useT();
  return (
    <View style={styles.wrap}>
      {/* Very low-opacity Topo-Iris watermark behind the card list —
          background treatment only, must never compete with content. */}
      <View style={styles.watermark} pointerEvents="none">
        <PercevaGlyph size={280} bare palette="gilded" idSuffix="ac-mark" />
      </View>

      <View style={styles.hairline} />

      <View style={styles.kickerRow}>
        <Ionicons name="compass-outline" size={12} color="#FFE3A6" />
        <Text style={styles.kicker}>{t('autoconhecimento.kicker')}</Text>
      </View>

      <Text style={styles.lead}>{t('autoconhecimento.lead')}</Text>
      <View style={styles.list}>
        <BigFiveCard onOpen={() => router.push('/big-five')} />
        <SchwartzCard onOpen={() => router.push('/schwartz')} />
        <EcrRCard onOpen={() => router.push('/ecr-r')} />
        <DiscCard onOpen={() => router.push('/disc')} />
        <StrengthsCard onOpen={() => router.push('/strengths')} />
        <TypesCard onOpen={() => router.push('/types')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[3],
  },
  watermark: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: 280,
    height: 280,
    opacity: 0.06,
  },
  hairline: {
    height: 1,
    backgroundColor: 'rgba(255, 200, 61, 0.18)',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#FFE3A6',
  },
  lead: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.dim,
    fontStyle: 'italic',
  },
  list: {
    gap: tokens.space[3],
  },
});
