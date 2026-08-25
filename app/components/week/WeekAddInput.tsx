import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { tokens } from '@/theme';

/**
 * The dashed "add a line to the sheet" input — one concept, one component.
 * Owns its draft state; the parent only receives the trimmed title.
 */
export function WeekAddInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (title: string) => void;
}) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    onSubmit(title);
  };

  return (
    <View style={styles.addRow}>
      <Ionicons name="add" size={16} color={tokens.text.dim} />
      <TextInput
        style={styles.addInput}
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        placeholderTextColor={tokens.text.faint}
        returnKeyType="done"
        onSubmitEditing={submit}
        blurOnSubmit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  addInput: {
    flex: 1,
    fontFamily: tokens.font.family,
    fontSize: 14,
    color: tokens.text.hi,
    padding: 0,
  },
});
