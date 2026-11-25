import { requireOptionalNativeModule } from 'expo';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Native speech-to-text for "Conte seu dia" — the phone's OWN recognizer
 * (Android SpeechRecognizer / iOS SFSpeechRecognizer) through
 * expo-speech-recognition. Free, and the audio never reaches our server:
 * only the text does.
 *
 * GUARDED on purpose. The package's JS calls requireNativeModule at import
 * time, which THROWS where the native module isn't compiled in: Expo Go and
 * every store build older than the one that added the plugin. Those still
 * receive this bundle by OTA (runtimeVersion = appVersion), so the package is
 * only required after requireOptionalNativeModule finds the module; without
 * it `speechAvailable` is false and the screen keeps the text box, where the
 * keyboard's own microphone (Gboard / iOS dictation) does the same job.
 */

type SpeechModule = typeof import('expo-speech-recognition');

let cached: SpeechModule | null | undefined;

function loadSpeech(): SpeechModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = requireOptionalNativeModule('ExpoSpeechRecognition')
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('expo-speech-recognition') as SpeechModule)
      : null;
  } catch {
    cached = null;
  }
  return cached;
}

/** True when this binary carries the native recognizer. */
export const speechAvailable: boolean = loadSpeech() != null;

/**
 * Keep the screen on while listening. Nobody touches the phone while telling
 * the day, so the screen timed out mid-sentence, the app went to background
 * and the recognizer stopped (owner, 2026-11-25). ExpoKeepAwake ships inside
 * every build (it is a dependency of `expo` itself), but it is reached
 * through requireOptionalNativeModule all the same, so a binary without it
 * just keeps the old behavior instead of crashing on import.
 */
interface KeepAwakeModule {
  activate?: (tag: string) => Promise<void>;
  deactivate?: (tag: string) => Promise<void>;
}

const KEEP_AWAKE_TAG = 'perceva-dictation';
let keepAwake: KeepAwakeModule | null | undefined;

function setScreenAwake(on: boolean) {
  if (keepAwake === undefined) {
    try {
      keepAwake = requireOptionalNativeModule<KeepAwakeModule>('ExpoKeepAwake');
    } catch {
      keepAwake = null;
    }
  }
  try {
    const pending = on
      ? keepAwake?.activate?.(KEEP_AWAKE_TAG)
      : keepAwake?.deactivate?.(KEEP_AWAKE_TAG);
    pending?.catch(() => {});
  } catch {
    // no activity to hold (app backgrounded) — nothing to undo
  }
}

export type DictationError = 'permission' | 'unavailable' | 'failed';

/**
 * Press-to-talk dictation. `start(base)` begins listening and calls
 * `onText(base + what was heard so far)` on every interim and final result,
 * so the text box fills live; `stop()` ends it (a final result follows).
 * Continuous: it keeps listening through pauses until stop() or silence.
 */
export function useDictation(params: {
  lang: string;
  onText: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<DictationError | null>(null);
  const baseRef = useRef('');
  const onTextRef = useRef(params.onText);
  onTextRef.current = params.onText;

  useEffect(() => {
    const mod = loadSpeech();
    if (!mod) return;
    const M = mod.ExpoSpeechRecognitionModule;
    const subs = [
      M.addListener('start', () => {
        setListening(true);
        setScreenAwake(true);
      }),
      M.addListener('end', () => {
        setListening(false);
        setScreenAwake(false);
      }),
      M.addListener('result', (ev) => {
        // Android (continuous) reports one segment per pause; the joined
        // transcript of the first alternative is what was said so far.
        const heard = ev.results[0]?.transcript ?? '';
        const base = baseRef.current;
        const joined = base && heard ? `${base} ${heard}` : base || heard;
        onTextRef.current(joined);
        if (ev.isFinal && heard) baseRef.current = joined;
      }),
      M.addListener('error', (ev) => {
        setListening(false);
        setScreenAwake(false);
        // "aborted" is our own stop; "no-speech" is silence — neither is news.
        if (ev.error === 'aborted' || ev.error === 'no-speech') return;
        setError(
          ev.error === 'not-allowed' ? 'permission'
          : ev.error === 'service-not-allowed' || ev.error === 'language-not-supported' ? 'unavailable'
          : 'failed',
        );
      }),
    ];
    return () => {
      for (const s of subs) s.remove();
      setScreenAwake(false);
      try {
        M.abort();
      } catch {
        // nothing was running
      }
    };
  }, []);

  const start = useCallback(
    async (base: string) => {
      const mod = loadSpeech();
      if (!mod) {
        setError('unavailable');
        return;
      }
      const M = mod.ExpoSpeechRecognitionModule;
      setError(null);
      const perm = await M.requestPermissionsAsync();
      if (!perm.granted) {
        setError('permission');
        return;
      }
      baseRef.current = base.trim();
      M.start({
        lang: params.lang,
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
      });
    },
    [params.lang],
  );

  const stop = useCallback(() => {
    const mod = loadSpeech();
    if (!mod) return;
    try {
      mod.ExpoSpeechRecognitionModule.stop();
    } catch {
      setListening(false);
    }
  }, []);

  return { available: speechAvailable, listening, error, start, stop };
}
