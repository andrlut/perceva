import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * M6 — Aprender (Recanto). v3 (2026-10): the old two steps (the tab, then a
 * card on the "Minhas ideias" bulb whose Próximo ended the module) never
 * showed HOW to reach a material, an idea or a video — "aparece, você clica
 * no botão e ele sai". Now the user walks the real path once, doing each
 * gesture:
 *
 *   0. (home)     Learn bottom-nav tab        — awaitEvent LEARN_NAVIGATED
 *   1. (learn)    a materials row             — awaitEvent MATERIAL_OPENED
 *                 (emitted by IdeasMaterialScreen on mount, so a locked
 *                 cover — the premium lock screen — never advances it;
 *                 "Abrir um material" opens the screen's pick)
 *   2. (material) the sticky start button     — awaitEvent IDEA_OPENED
 *                 (emitted by IdeaScreen on mount; "Abrir a ideia" opens
 *                 the button's idea)
 *   3. (idea)     the media (video or image)  — Next
 *   4. (idea)     THE card                    — awaitEvent IDEA_FLIPPED
 *                 (the flip advances in place; "Continuar o tour" too)
 *   5. (idea)     absorbed: what absorbing gives — Next closes the idea +
 *                 material screens for the Recanto (leaveM6Flow). The user
 *                 leaves when ready: no timer, so the flip's own feedback
 *                 (gold rim, the +XP banner) is seen.
 *   6. (learn)    Explorar (the stories deck) — Next
 *   7. (learn)    the "Minhas ideias" bulb    — Next → Wrap-up
 *
 * Back-outs heal: closing the idea screen at steps 3–4 rewinds to step 2
 * (the material screen's focus effect); leaving the material lands on
 * step 1 (the Learn tab's `rewindOnFocus`).
 */
export const M6_EVENTS = {
  LEARN_NAVIGATED: 'learn:navigated',
  MATERIAL_OPENED: 'learn:material-opened',
  IDEA_OPENED: 'learn:idea-opened',
  IDEA_FLIPPED: 'learn:idea-flipped',
} as const;

/** Step indices the screens key their tour plumbing on. */
export const M6_STEP = {
  MATERIALS: 1,
  MATERIAL: 2,
  MEDIA: 3,
  CARD: 4,
  ABSORBED: 5,
  EXPLORE: 6,
  MY_IDEAS: 7,
} as const;

interface M6Options {
  /**
   * False when the Learn tab has no material to open for the user (empty
   * or fully locked feed): step 1 then offers only "Pular este passo",
   * which jumps to the next step that lives on the tab (Explorar).
   */
  canOpenMaterial?: boolean;
}

export function buildM6Steps(t: Translator, opts: M6Options = {}): ScreenedStep[] {
  const canOpenMaterial = opts.canOpenMaterial ?? true;
  return [
    {
      screen: 'home',
      title: t('tour.m6.step1.title'),
      body: t('tour.m6.step1.body'),
      position: 'bottom',
      awaitEvent: M6_EVENTS.LEARN_NAVIGATED,
      target: 'tab.learning',
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'learn',
      title: t('tour.m6.step2.title'),
      body: t('tour.m6.step2.body'),
      position: 'bottom',
      awaitEvent: M6_EVENTS.MATERIAL_OPENED,
      target: 'learn.materials',
      awaitCtaLabel: canOpenMaterial ? t('tour.m6.step2.cta') : undefined,
      assistSkipsToSameScreen: !canOpenMaterial,
    },
    {
      screen: 'material',
      title: t('tour.m6.step3.title'),
      body: t('tour.m6.step3.body'),
      // The start button is pinned to the bottom of the screen.
      position: 'top',
      awaitEvent: M6_EVENTS.IDEA_OPENED,
      target: 'material.start',
      awaitCtaLabel: t('tour.m6.step3.cta'),
    },
    {
      screen: 'idea',
      title: t('tour.m6.step4.title'),
      body: t('tour.m6.step4.body'),
      position: 'bottom',
      target: 'idea.media',
    },
    {
      screen: 'idea',
      title: t('tour.m6.step5.title'),
      body: t('tour.m6.step5.body'),
      // The page scrolls the card just under the tooltip.
      position: 'top',
      awaitEvent: M6_EVENTS.IDEA_FLIPPED,
      target: 'idea.card',
      awaitCtaLabel: t('tour.m6.step5.cta'),
    },
    {
      screen: 'idea',
      title: t('tour.m6.step6.title'),
      body: t('tour.m6.step6.body'),
      // No spotlight: the screen stays bright, the +XP banner on top shows.
      position: 'bottom',
      primaryLabel: t('tour.m6.step6.cta'),
    },
    {
      screen: 'learn',
      title: t('tour.m6.step7.title'),
      body: t('tour.m6.step7.body'),
      position: 'bottom',
      target: 'learn.explore',
    },
    {
      screen: 'learn',
      title: t('tour.m6.step8.title'),
      body: t('tour.m6.step8.body'),
      // The bulb FAB sits at the bottom corner, so the card opens above it.
      position: 'top',
      target: 'learn.my-ideas',
    },
  ];
}
