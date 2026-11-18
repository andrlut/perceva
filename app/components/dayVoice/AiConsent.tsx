import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The LGPD consent of "Conte seu dia", shown once on /day-voice before the
 * first request (and again after a revoke in Ajustes, or when the text's
 * version goes up — AI_CONSENT_VERSION). Body only: the screen's footer
 * carries "Agora não" / "Aceitar e continuar", in the same chassis as the
 * rest of the screen.
 *
 * Three cards, one question each: what goes to the model, what is kept,
 * how to switch it off. The server refuses every request without a current
 * consent (ai_begin → no_consent), so this screen is the only way in.
 */
export function AiConsent() {
  const { t } = useT();

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t('dayVoice.consent.title')}</Text>
        <Text style={styles.lead}>{t('dayVoice.consent.lead')}</Text>
      </View>

      <View style={styles.card}>
        <CardHead icon="paper-plane-outline" title={t('dayVoice.consent.sendsTitle')} />
        <Text style={styles.sub}>{t('dayVoice.consent.sendsSub')}</Text>
        <Item icon="mic-outline" text={t('dayVoice.consent.sendsSpeech')} />
        <Item icon="today-outline" text={t('dayVoice.consent.sendsDay')} />
        <Item icon="newspaper-outline" text={t('dayVoice.consent.sendsWeek')} />
        <Item icon="person-outline" text={t('dayVoice.consent.sendsProfile')} />
      </View>

      <View style={styles.card}>
        <CardHead icon="lock-closed-outline" title={t('dayVoice.consent.keepsTitle')} />
        <Text style={styles.body}>{t('dayVoice.consent.keepsBody')}</Text>
      </View>

      <View style={styles.card}>
        <CardHead icon="toggle-outline" title={t('dayVoice.consent.offTitle')} />
        <Text style={styles.body}>{t('dayVoice.consent.offBody')}</Text>
      </View>
    </View>
  );
}

function CardHead({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.cardHead}>
      <Ionicons name={icon} size={18} color={tokens.brand.violet2} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

function Item({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={14} color={tokens.text.mid} />
      </View>
      <Text style={styles.itemText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[3],
  },
  hero: {
    alignItems: 'center',
    gap: tokens.space[2],
    paddingVertical: tokens.space[2],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  lead: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.mid,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[3],
    gap: tokens.space[2],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  cardTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.dim,
    marginTop: -4,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13.5,
    lineHeight: 19,
    color: tokens.text.base,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
  },
  itemText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: tokens.text.base,
  },
});
