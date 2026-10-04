import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

/**
 * Sound for the idea videos — OFF unless the reader turns it on.
 *
 * Opening an idea in a quiet room must never start talking, so every video
 * starts muted and only the sound button on the video unmutes it. Once
 * turned on, the choice carries over while the reader keeps going through
 * ideas (the next video in the pager, another idea opened on top), and
 * resets to muted the moment they LEAVE the ideas — the last idea screen
 * unmounts — or the app goes to the background. In memory only, never
 * persisted: a fresh visit always starts silent.
 */
interface IdeaSoundState {
  on: boolean;
  set: (on: boolean) => void;
}

export const useIdeaSound = create<IdeaSoundState>((set) => ({
  on: false,
  set: (on) => set({ on }),
}));

/** Idea screens currently mounted — the reset waits for the last one. */
let mountedScreens = 0;

/**
 * Mount in every idea screen. Resets the sound when the last idea screen
 * unmounts, and whenever the app leaves the foreground.
 */
export function useIdeaSoundSession() {
  useEffect(() => {
    mountedScreens += 1;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') useIdeaSound.getState().set(false);
    });
    return () => {
      sub.remove();
      mountedScreens -= 1;
      if (mountedScreens <= 0) {
        mountedScreens = 0;
        useIdeaSound.getState().set(false);
      }
    };
  }, []);
}
