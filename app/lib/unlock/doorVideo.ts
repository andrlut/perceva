/** The four screens with a door video, in tab order (the `me_*` pillar
 *  unlocks have no door of their own). */
export const DOOR_VIDEO_SCREENS = ['practices', 'rewards', 'learning', 'me'] as const;
export type DoorVideoScreen = (typeof DOOR_VIDEO_SCREENS)[number];

/** Opens a screen's video to watch again (app/door-video.tsx) — from its (i)
 *  or from Ajustes › Tutorial. Closable, unlike the door's first opening. */
export function doorVideoHref(feature: DoorVideoScreen, source: 'guide' | 'settings') {
  return { pathname: '/door-video' as const, params: { feature, source } };
}
