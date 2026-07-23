import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  AUTH_REDIRECT_URL,
  CODE_MAX_LENGTH,
  CODE_MIN_LENGTH,
  localizeAuthError,
  RESEND_COOLDOWN_SECONDS,
  sanitizeCode,
  useRecoveryStore,
} from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { tokens } from '@/theme';

/**
 * Two-step recovery: request a code, then type it in.
 *
 * We deliberately do NOT rely on the emailed link. Supabase answers the
 * verify endpoint with a 303 to `rpgtasks://auth/callback#...`, and Chrome
 * on Android refuses to follow a server-initiated redirect into a custom
 * scheme — the link dead-ends and burns the token. The 6-digit OTP keeps
 * the browser out of the flow entirely.
 *
 * verifyOtp({ type: 'recovery' }) is also what emits PASSWORD_RECOVERY,
 * which is the event AuthGate needs to route to /reset-password. The old
 * fragment path called setSession(), which only ever emits SIGNED_IN.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useT();
  const setRecovering = useRecoveryStore((s) => s.setRecovering);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Under edge-to-edge Android never resizes the window for the keyboard, so
  // the container below reserves the keyboard height instead (same pattern as
  // mood-checkin). Scroll to the end AFTER that reflow so the primary button
  // and toggles land just above the keyboard.
  useEffect(() => {
    if (keyboardHeight <= 0) return;
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60,
    );
    return () => clearTimeout(id);
  }, [keyboardHeight]);

  const requestCode = async (isResend: boolean) => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(t('auth.forgot.emailNeeded'), t('auth.forgot.emailNeededBody'));
      return;
    }

    const setBusy = isResend ? setIsResending : setIsSubmitting;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: AUTH_REDIRECT_URL,
      });
      if (error) {
        Alert.alert(t('auth.forgot.couldNotSend'), localizeAuthError(error, t));
        return;
      }
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      if (isResend) {
        setCode('');
        Alert.alert(t('auth.forgot.resent'), t('auth.forgot.resentBody', { email: trimmed }));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = () => requestCode(false);
  const handleResend = () => requestCode(true);

  /** Back to the email step — the only escape from a typo'd address. */
  const handleChangeEmail = () => {
    setSent(false);
    setCode('');
    setCooldown(0);
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < CODE_MIN_LENGTH) {
      Alert.alert(t('auth.forgot.codeNeeded'), t('auth.forgot.codeNeededBody'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedCode,
        type: 'recovery',
      });
      if (error) {
        Alert.alert(t('auth.forgot.couldNotVerify'), localizeAuthError(error, t));
        return;
      }
      // verifyOtp emits PASSWORD_RECOVERY, which the root listener turns
      // into isRecovering. Set it here too so routing to /reset-password
      // never depends on listener/render ordering.
      setRecovering(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Reserve the real keyboard height on the flex container: under
          edge-to-edge (SDK 54) Android does NOT resize the window for the
          keyboard, and a KeyboardAvoidingView with behavior=undefined does
          nothing there. `useKeyboardHeight` fires on both platforms, so this
          replaces the KAV on iOS too (same pattern as mood-checkin). */}
      <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>{t('auth.forgot.title')}</Text>
          <Text style={styles.brandTagline}>{t('auth.forgot.subtitle')}</Text>
        </View>

        {sent ? (
          <View style={styles.form}>
            <View style={styles.successBox}>
              <Ionicons name="mail" size={36} color={tokens.semantic.xp} />
              <Text style={styles.successTitle}>{t('auth.forgot.emailSent')}</Text>
              <Text style={styles.successSub}>
                {t('auth.forgot.emailSentBody', { email: email.trim() })}
              </Text>
            </View>

            <Text style={[styles.label, { marginTop: tokens.space[6] }]}>
              {t('auth.forgot.codeLabel')}
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(v) => setCode(sanitizeCode(v))}
              keyboardType="number-pad"
              maxLength={CODE_MAX_LENGTH}
              placeholder={t('auth.forgot.codePlaceholder')}
              placeholderTextColor={tokens.text.faint}
              editable={!isSubmitting}
              autoFocus
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || isSubmitting) && styles.primaryButtonPressed,
              ]}
              onPress={handleVerify}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={tokens.text.hi} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('auth.forgot.verify')}</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleResend}
              disabled={isResending || cooldown > 0}
              style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.6 }]}
            >
              {isResending ? (
                <ActivityIndicator color={tokens.text.mid} />
              ) : (
                <Text style={[styles.toggleText, cooldown > 0 && styles.toggleTextMuted]}>
                  {cooldown > 0
                    ? t('auth.forgot.resendIn', { seconds: cooldown })
                    : t('auth.forgot.resend')}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleChangeEmail}
              disabled={isSubmitting || isResending}
              style={({ pressed }) => [styles.toggleTight, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.toggleText}>{t('auth.forgot.wrongEmail')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.fields.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder={t('auth.fields.emailPlaceholder')}
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
                <Text style={styles.primaryButtonText}>{t('auth.forgot.submit')}</Text>
              )}
            </Pressable>
          </View>
        )}
        </ScrollView>
      </View>

      {/* After the scroll container so it renders on top and stays fixed
          while the content scrolls under it. */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={20} color={tokens.text.hi} />
        <Text style={styles.backText}>{t('auth.forgot.back')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.bg.base },
  flex: { flex: 1 },
  // flexGrow + center keeps the closed-keyboard layout visually identical to
  // the old centered View; once the keyboard shrinks the viewport the content
  // becomes scrollable instead of hiding behind it.
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.space[6],
    paddingVertical: tokens.space[8],
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
  codeInput: {
    textAlign: 'center',
    letterSpacing: 6,
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  toggle: { marginTop: tokens.space[5], alignItems: 'center' },
  toggleTight: { marginTop: tokens.space[3], alignItems: 'center' },
  toggleText: { ...tokens.type.body, color: tokens.text.mid },
  toggleTextMuted: { color: tokens.text.faint },
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
