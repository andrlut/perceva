import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRecoveryStore } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { tokens } from '@/theme';

/**
 * Shown after the user lands in the app via a password-recovery email link.
 * The deep-link handler exchanges the token for a session and Supabase
 * emits PASSWORD_RECOVERY → useRecoveryStore.isRecovering becomes true →
 * AuthGate routes here. Submitting calls auth.updateUser({ password }).
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const setRecovering = useRecoveryStore((s) => s.setRecovering);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', "Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Could not update', error.message);
        return;
      }
      // Clear the recovery flag so AuthGate stops routing here.
      setRecovering(false);
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbort = async () => {
    // Sign the user out so they're back on /login fresh.
    setRecovering(false);
    await supabase.auth.signOut();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Pick a new password</Text>
          <Text style={styles.brandTagline}>
            You arrived here via a recovery email. Set a fresh password and
            you&apos;re back in.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="At least 6 characters"
            placeholderTextColor={tokens.text.faint}
            editable={!isSubmitting}
            autoFocus
          />

          <Text style={[styles.label, { marginTop: tokens.space[4] }]}>
            Confirm
          </Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Type it again"
            placeholderTextColor={tokens.text.faint}
            editable={!isSubmitting}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.primaryButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={tokens.text.hi} />
            ) : (
              <Text style={styles.primaryButtonText}>Update password</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleAbort}
            disabled={isSubmitting}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>Cancel and sign out</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.bg.base },
  inner: {
    flex: 1,
    paddingHorizontal: tokens.space[6],
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: tokens.space[8] },
  brandTitle: { ...tokens.type.display, color: tokens.text.hi },
  brandTagline: {
    ...tokens.type.body,
    color: tokens.text.mid,
    marginTop: tokens.space[2],
    textAlign: 'center',
    paddingHorizontal: tokens.space[2],
  },
  form: { gap: 0 },
  label: {
    ...tokens.type.eyebrow,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: tokens.space[2],
  },
  input: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[4],
    color: tokens.text.hi,
    ...tokens.type.bodyLg,
  },
  primaryButton: {
    backgroundColor: tokens.brand.violet,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[4],
    alignItems: 'center',
    marginTop: tokens.space[7],
  },
  primaryButtonPressed: { opacity: 0.8 },
  primaryButtonText: { ...tokens.type.h3, color: tokens.text.hi },
  toggle: { marginTop: tokens.space[5], alignItems: 'center' },
  toggleText: { ...tokens.type.body, color: tokens.text.mid },
});
