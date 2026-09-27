import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/** Server guard (`learning_idea_collect_note_len`); the field stops here too. */
const MAX_LENGTH = 2000;
/** Below this many characters left, the counter appears. */
const COUNTER_FROM = 1800;

interface Props {
  visible: boolean;
  ideaTitle: string;
  /** Current note, or null when there is none yet. */
  note: string | null;
  onCancel: () => void;
  /** Empty string clears the note — the RPC treats blank as "delete". */
  onSave: (note: string) => void;
}

/**
 * Writing the note about an idea. Opened from the long-press menu in
 * "Minhas ideias" — never on the way in or out of reading, because the note
 * must not become one more step between absorbing an idea and moving on.
 *
 * One note per idea, edited in place: the value is the commitment the
 * reader made with themselves ("swap the whey to the morning"), not a diary,
 * so there is no history and no formatting. Emptying the field and saving
 * deletes it, which is the gesture people already expect from a text box.
 */
export function IdeaNoteSheet({ visible, ideaTitle, note, onCancel, onSave }: Props) {
  const { t } = useT();
  const [draft, setDraft] = useState(note ?? '');

  // Re-seed whenever the sheet opens for a (possibly different) idea; the
  // parent keeps this mounted, so without it the previous idea's text stays.
  useEffect(() => {
    if (visible) setDraft(note ?? '');
  }, [visible, note]);

  const trimmed = draft.trim();
  const isEmpty = trimmed.length === 0;
  const hadNote = (note ?? '').trim().length > 0;
  const left = MAX_LENGTH - draft.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.icon}>
              <Ionicons name="create-outline" size={18} color={tokens.brand.violet2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('learning.ideas.note.title')}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {ideaTitle}
              </Text>
            </View>
          </View>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('learning.ideas.note.placeholder')}
            placeholderTextColor={tokens.text.dim}
            multiline
            autoFocus
            maxLength={MAX_LENGTH}
            style={styles.input}
            textAlignVertical="top"
            accessibilityLabel={t('learning.ideas.note.title')}
          />

          <Text style={styles.hint}>
            {draft.length >= COUNTER_FROM
              ? t('learning.ideas.note.left', { count: left })
              : hadNote
                ? t('learning.ideas.note.clearHint')
                : t('learning.ideas.note.privateHint')}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.btnGhostText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(trimmed)}
              accessibilityRole="button"
              disabled={isEmpty && !hadNote}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                isEmpty && !hadNote && styles.btnDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {isEmpty && hadNote
                  ? t('learning.ideas.note.delete')
                  : t('learning.ideas.note.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: tokens.space[4],
    paddingBottom: tokens.space[6],
    gap: tokens.space[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.base,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.dim,
    lineHeight: 16,
  },
  input: {
    minHeight: 132,
    maxHeight: 240,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.base,
    padding: tokens.space[3],
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: tokens.text.hi,
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
    marginTop: -tokens.space[1],
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.space[2],
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: tokens.bg.base,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  btnGhostText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  btnPrimary: {
    backgroundColor: tokens.brand.violet,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPrimaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
