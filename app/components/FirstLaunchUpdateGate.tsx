import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * First-launch update gate (2026-10-19). A store install runs the bundle
 * EMBEDDED in the binary — as old as the last store build — and expo-updates
 * only downloads the newest OTA in the background, applying it on the NEXT
 * cold start. So a friend who installed from the Play Store went through
 * login and the whole onboarding on a weeks-old app.
 *
 * On an embedded launch (fresh install, or right after a store update) this
 * holds the app behind a short "preparing" screen, fetches the newest update
 * and reloads into it before anything else renders. Every other launch
 * passes straight through.
 *
 * Loop breaker, PERSISTED (memory: theme-boot-loop — an in-memory flag is
 * wiped by the very reload it should remember): the embedded bundle's id is
 * written to AsyncStorage BEFORE trying, and a launch that finds its own id
 * there skips the gate. A reload that somehow lands back on the embedded
 * bundle therefore boots normally instead of trying again.
 *
 * Fails open: no network, a slow server or any error → the app renders on
 * what it has (the background download still applies next time). The whole
 * wait is capped at MAX_WAIT_MS.
 */

const ATTEMPT_KEY = 'perceva.firstLaunchUpdate.attempted';
const CHECK_TIMEOUT_MS = 6000;
const MAX_WAIT_MS = 20000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

const GATE_ACTIVE = !__DEV__ && Updates.isEnabled && Updates.isEmbeddedLaunch;

export function FirstLaunchUpdateGate({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [open, setOpen] = useState(!GATE_ACTIVE);
  const reloadingRef = useRef(false);
  // The native launch check may finish its own background download first.
  const { isUpdatePending } = Updates.useUpdates();

  const reload = () => {
    if (reloadingRef.current) return;
    reloadingRef.current = true;
    Updates.reloadAsync().catch(() => setOpen(true));
  };

  useEffect(() => {
    if (!open && isUpdatePending) reload();
  }, [isUpdatePending, open]);

  useEffect(() => {
    if (open) return;
    let alive = true;
    const cap = setTimeout(() => alive && setOpen(true), MAX_WAIT_MS);
    (async () => {
      try {
        const me = Updates.updateId ?? 'embedded';
        if ((await AsyncStorage.getItem(ATTEMPT_KEY)) === me) {
          if (alive) setOpen(true);
          return;
        }
        await AsyncStorage.setItem(ATTEMPT_KEY, me);
        const check = await withTimeout(Updates.checkForUpdateAsync(), CHECK_TIMEOUT_MS);
        if (!check.isAvailable) {
          if (alive) setOpen(true);
          return;
        }
        const fetched = await withTimeout(
          Updates.fetchUpdateAsync(),
          MAX_WAIT_MS - CHECK_TIMEOUT_MS,
        );
        if (!alive) return;
        if (fetched.isNew) reload();
        else setOpen(true);
      } catch {
        if (alive) setOpen(true);
      }
    })();
    return () => {
      alive = false;
      clearTimeout(cap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (open) return <>{children}</>;
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={tokens.brand.violet2} />
      <Text style={styles.text}>{t('firstLaunchUpdate.preparing')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[3],
    backgroundColor: tokens.bg.deep,
    paddingHorizontal: tokens.space[6],
  },
  text: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: tokens.text.mid,
    textAlign: 'center',
  },
});
