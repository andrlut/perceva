import { create } from 'zustand';

/**
 * Playback speed for the Recanto's media — the idea videos and the deep-dive
 * audio share one ladder: 1× → 1,25× → 1,5× → 2× → back to 1×.
 *
 * The idea videos carry the choice across ideas (the next video in the
 * pager, another idea opened on top) for as long as the app runs — someone
 * who watches at 1,5× wants the next one at 1,5× too. Unlike the sound
 * (lib/ideaSound), speed never surprises anyone in a quiet room, so it does
 * not reset on leaving the ideas. In memory only: a fresh launch is 1×.
 * Pitch is preserved by the players (expo-video `preservesPitch` defaults to
 * true; the audio pane sets `shouldCorrectPitch`).
 */
export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export const nextSpeed = (s: number): PlaybackSpeed => {
  const i = PLAYBACK_SPEEDS.indexOf(s as PlaybackSpeed);
  return PLAYBACK_SPEEDS[(i + 1) % PLAYBACK_SPEEDS.length];
};

/** "1×", "1,25×" (pt) / "1.25×" (en). */
export const formatSpeed = (s: number, locale: string) =>
  `${locale.startsWith('pt') ? String(s).replace('.', ',') : String(s)}×`;

interface IdeaSpeedState {
  speed: PlaybackSpeed;
  set: (speed: PlaybackSpeed) => void;
}

export const useIdeaSpeed = create<IdeaSpeedState>((set) => ({
  speed: 1,
  set: (speed) => set({ speed }),
}));
