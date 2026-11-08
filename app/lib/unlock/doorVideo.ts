/** The four screens with a door video, in tab order (the `me_*` pillar
 *  unlocks have no door of their own). */
export const DOOR_VIDEO_SCREENS = ['practices', 'rewards', 'learning', 'me'] as const;
export type DoorVideoScreen = (typeof DOOR_VIDEO_SCREENS)[number];
/** Every video the player can open: the four screens plus the app overview
 *  (the site's Vitrine in its in-app cut — the intro opens with it). */
export type ScreenVideoKey = DoorVideoScreen | 'overview';
export const isScreenVideoKey = (v: unknown): v is ScreenVideoKey =>
  v === 'overview' || DOOR_VIDEO_SCREENS.includes(v as DoorVideoScreen);

/** Opens a screen's video to watch again (app/door-video.tsx) — from its (i)
 *  or from Ajustes › Tutorial. Closable, unlike the door's first opening. */
export function doorVideoHref(feature: ScreenVideoKey, source: 'guide' | 'settings') {
  return { pathname: '/door-video' as const, params: { feature, source } };
}
