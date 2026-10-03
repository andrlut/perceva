import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GuideAiButton, GuideAiIcon } from '@/components/guide/GuideAiButton';
import { GuideLabel } from '@/components/guide/GuideStep';
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
   * A screen's guide: the question the AI door sends. Present → a fixed AI
   * circle beside the close X, and the full AI block as the guide's LAST
   * section, after `children`.
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
 * guide — passes `children` and `aiPrompt`: the steps first (components/
 * guide; the Minhas ideias guide is the template), the AI block last, and
 * an AI circle fixed beside the X. The guide teaches better than the AI, so
 * the AI ends the sheet instead of opening it; neither AI door ever hides
 * (grey and pointing at Ajustes while the AI is off).
 *
 * `**palavra**` in the body renders bold (the one markup it reads): the
 * key word of each paragraph in bold lets the reader scan what can be done
 * — tap, hold, favorites — without reading the rest.
 *
 * The body scrolls when it outgrows the screen (header and button stay
 * put). The sheet is a plain View with the scrim as an absoluteFill
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
            <View style={styles.headerActions}>
              {aiPrompt ? <GuideAiIcon prompt={aiPrompt} onLeave={onClose} /> : null}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.6 },
                ]}
                // Inner side trimmed when the AI circle sits beside it, so
                // the two hit areas never overlap.
                hitSlop={aiPrompt ? { top: 10, bottom: 10, left: 4, right: 10 } : 10}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Ionicons name="close" size={20} color={tokens.text.mid} />
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={children || aiPrompt ? styles.guide : undefined}
            showsVerticalScrollIndicator={false}
          >
            {body ? <Text style={styles.body}>{renderBold(body)}</Text> : null}
            {children}
            {aiPrompt ? (
              <View style={styles.aiEnd}>
                <GuideLabel>{t('guide.aiLabel')}</GuideLabel>
                <GuideAiButton prompt={aiPrompt} onLeave={onClose} />
              </View>
            ) : null}
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
  // The AI circle and the X, side by side; 10px apart so their trimmed
  // inner hit areas (4px each) never meet.
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  // The guide's last section: its label sits close to the block.
  aiEnd: {
    gap: tokens.space[2],
    marginTop: tokens.space[1],
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
