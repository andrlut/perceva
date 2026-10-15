import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { subscribeDialog, type DialogRequest } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * Renders a styled confirm/info dialog whenever `confirmAction` or
 * `showInfo` (from `@/lib/util/confirm`) is called anywhere in the app.
 *
 * Mounted once near the root in `app/app/_layout.tsx`. Subscribes to the
 * dialog event queue; one dialog visible at a time. If multiple requests
 * arrive while one is open, they queue up FIFO — only the current one is
 * shown, and the next one opens once the user dismisses the previous.
 *
 * Replaces the OS-native `window.confirm` / `Alert.alert` UIs that broke
 * the gold/violet aesthetic (especially on web, where the browser confirm
 * dialog is unstyled).
 *
 * iOS: the caller's promise resolves only AFTER the dialog has finished
 * dismissing (`onDismiss`). Callers navigate right after a confirm
 * ("Arquivar" → router.back() out of the task-form modal); dismissing a
 * native modal screen while this Modal is still fading out on top of it left
 * an invisible, touch-swallowing layer on iPhone — the app looked frozen
 * (user report, 2026-10-15). A timer backs `onDismiss` up in case it never
 * fires. Android has no such race and resolves at once.
 */
const DISMISS_FALLBACK_MS = 700;
export function ConfirmHost() {
  // FIFO queue of pending dialog requests. We render only `queue[0]` —
  // when the user resolves it we shift to expose the next one (or empty).
  const [queue, setQueue] = useState<DialogRequest[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeDialog((req) => {
      setQueue((prev) => [...prev, req]);
    });
    return unsubscribe;
  }, []);

  const current = queue[0] ?? null;
  // The answer of a dialog that is closing on iOS, delivered on onDismiss.
  const [closing, setClosing] = useState(false);
  const answerRef = useRef<{ req: DialogRequest; ok: boolean } | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = () => {
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
    const answer = answerRef.current;
    if (!answer) return;
    answerRef.current = null;
    answer.req.resolve(answer.ok);
    setClosing(false);
    setQueue((prev) => (prev[0] === answer.req ? prev.slice(1) : prev));
  };

  const handle = (ok: boolean) => {
    if (!current || answerRef.current) return;
    answerRef.current = { req: current, ok };
    if (Platform.OS !== 'ios') {
      finish();
      return;
    }
    setClosing(true);
    fallbackRef.current = setTimeout(finish, DISMISS_FALLBACK_MS);
  };

  useEffect(
    () => () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    },
    [],
  );

  const visible = current !== null && !closing;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      // Treat Android back / hardware dismiss as cancel (or OK for info,
      // since there's no cancel button).
      onRequestClose={() => handle(current?.kind === 'info' ? true : false)}
      onDismiss={finish}
      statusBarTranslucent
    >
      <Pressable
        style={styles.scrim}
        // Tap outside the card to dismiss — same as cancel for confirm,
        // same as OK for info.
        onPress={() => handle(current?.kind === 'info' ? true : false)}
      >
        {/* Inner Pressable absorbs taps on the card so they don't bubble
            up to the scrim and dismiss the dialog. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {current && (
            <>
              <Text style={styles.title}>{current.title}</Text>
              {current.message ? (
                <Text style={styles.message}>{current.message}</Text>
              ) : null}

              <View style={styles.actions}>
                {current.kind === 'confirm' ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.btn,
                        styles.btnGhost,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handle(false)}
                      accessibilityRole="button"
                      accessibilityLabel={current.cancelText}
                    >
                      <Text style={styles.btnGhostText}>
                        {current.cancelText}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.btn,
                        current.destructive
                          ? styles.btnDanger
                          : styles.btnPrimary,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handle(true)}
                      accessibilityRole="button"
                      accessibilityLabel={current.okText}
                    >
                      <Text
                        style={
                          current.destructive
                            ? styles.btnDangerText
                            : styles.btnPrimaryText
                        }
                      >
                        {current.okText}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      styles.btnPrimary,
                      styles.btnFull,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => handle(true)}
                    accessibilityRole="button"
                    accessibilityLabel={current.okText}
                  >
                    <Text style={styles.btnPrimaryText}>{current.okText}</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[5],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    padding: tokens.space[5],
    gap: tokens.space[3],
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  message: {
    ...tokens.type.body,
    color: tokens.text.mid,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.space[2],
    marginTop: tokens.space[3],
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
  },
  btnFull: {
    flex: 1,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  btnGhostText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.base,
  },
  btnPrimary: {
    backgroundColor: tokens.brand.violet,
  },
  btnPrimaryText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 14,
    color: '#fff',
  },
  btnDanger: {
    backgroundColor: tokens.semantic.danger,
  },
  btnDangerText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 14,
    color: '#fff',
  },
  btnPressed: {
    opacity: 0.8,
  },
});
