import { Ionicons } from '@expo/vector-icons';
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

import { AUTH_REDIRECT_URL } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { tokens } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Email needed', 'Type the email you signed up with.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: AUTH_REDIRECT_URL,
      });
      if (error) {
        // Surface rate-limit specifically — common with Supabase default SMTP.
        const msg = /rate limit/i.test(error.message)
          ? 'Email service is rate-limited right now. Wait a few minutes and try again, or ask the admin.'
          : error.message;
        Alert.alert('Could not send', msg);
        return;
      }
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={tokens.text.hi} />
          <Text style={styles.backText}>Back to login</Text>
        </Pressable>

        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Reset password</Text>
          <Text style={styles.brandTagline}>
            We&apos;ll send you a link to choose a new one.
          </Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="mail" size={36} color={tokens.semantic.xp} />
            <Text style={styles.successTitle}>Email sent</Text>
            <Text style={styles.successSub}>
              Check {email.trim()} for a link. Open it on this device — the app
              will pick it up and let you set a new password.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={tokens.text.faint}
              editable={!isSubmitting}
              autoFocus
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
                <Text style={styles.primaryButtonText}>Send reset link</Text>
              )}
            </Pressable>
          </View>
        )}
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
  backLink: {
    position: 'absolute',
    top: tokens.space[7],
    left: tokens.space[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    ...tokens.type.body,
    color: tokens.text.hi,
  },
  brand: { alignItems: 'center', marginBottom: tokens.space[8] },
  brandTitle: { ...tokens.type.display, color: tokens.text.hi },
  brandTagline: {
    ...tokens.type.body,
    color: tokens.text.mid,
    marginTop: tokens.space[2],
    textAlign: 'center',
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
  successBox: {
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[2],
  },
  successTitle: {
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  successSub: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[4],
  },
});
