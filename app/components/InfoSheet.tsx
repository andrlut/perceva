import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GuideAiButton } from '@/components/guide/GuideAiButton';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Plain explanation. Optional once `children` carries a guide. */
  body?: string;
  /** Optional accent color for the title text + close icon. */
  accent?: string;
  /**
   * A screen's guide: the question the AI door sends. Present → the
   * GuideAiButton is the FIRST thing under the title, outside the scroll.
   */
  aiPrompt?: string;
  /** Rich guide content (GuideStep rows, a playground), after the body. */
  children?: React.ReactNode;
}

/**
 * Centered info modal for short explanations (how-it-works copy on a chip,
 * why-this-rule blurbs). Replaces native Alert.alert in surfaces where the
 * native dialog was failing to show on some devices.
 *
 * Two uses, one chassis. A field's (i) passes `body`. A SCREEN's (i) — its
 * guide — passes `aiPrompt` and `children`: the AI door first (never hidden;
 * grey and pointing at Ajustes while the AI is off), then the steps
 * (components/guide, the Minhas ideias guide is the template).
 *
 * `**palavra**` in the body renders bold (the one markup it reads): the
 * key word of each paragraph in bold lets the reader scan what can be done
 * — tap, hold, favorites — without reading the rest.
 *
 * The body scrolls when it outgrows the screen (header, AI door and button
 * stay put). The sheet is a plain View with the scrim as an absoluteFill
 * sibling behind it: a Pressable sheet would take the touch responder and
 * kill the ScrollView's native scroll.
 *
 * Tap the backdrop or the close icon to dismiss. Body text supports plain
 * \n line breaks for bullet lists.
 */
export function InfoSheet({
  visible,
  onClose,
  title,
  body,
  accent = tokens.brand.violet2,
  aiPrompt,
  children,
}: Props) {
  const { t } = useT();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: accent }]} numberOfLines={2}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={tokens.text.mid} />
            </Pressable>
          </View>
          {aiPrompt ? <GuideAiButton prompt={aiPrompt} onLeave={onClose} /> : null}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={children ? styles.guide : undefined}
            showsVerticalScrollIndicator={false}
          >
            {body ? <Text style={styles.body}>{renderBold(body)}</Text> : null}
            {children}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.okBtn,
              { backgroundColor: accent },
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={4}
          >
            <Text style={styles.okBtnText}>{t('common.gotIt')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Splits on `**…**`; odd segments are the bold ones. */
function renderBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={styles.bold}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space[5],
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    padding: tokens.space[5],
    gap: tokens.space[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  // A guide's rows breathe more than a paragraph's lines.
  guide: {
    gap: tokens.space[4],
    paddingBottom: tokens.space[1],
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 21,
    color: tokens.text.base,
  },
  bold: {
    fontFamily: 'Manrope_800ExtraBold',
    color: tokens.text.hi,
  },
  okBtn: {
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  okBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.3,
    color: tokens.text.hi,
  },
});
