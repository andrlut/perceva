import type { TranslateOptions } from '@/lib/i18n';

/**
 * Screen guides — a screen's (i): InfoSheet + components/guide. THE MODEL
 * every screen follows, built so the sheet and its AI prompt can never
 * disagree about what the screen does (full recipe:
 * docs/informativo-de-tela.md; the reference is Minhas ideias,
 * components/ideas/CollectionGuide.tsx).
 *
 *  1. Every option of the screen is an ITEM, in i18n under `<screen>.help`:
 *       items.<key>.title / .body — what the sheet shows (short, scannable)
 *       items.<key>.ai           — what only the AI gets: the mechanics the
 *                                  sheet leaves to its replicas
 *     plus screenName, purpose and examples, the prompt's frame.
 *  2. One ordered key list per screen (e.g. COLLECTION_GUIDE_ITEMS). The
 *     sheet renders every key and the prompt is built from the same list,
 *     so an option is in both or in neither — the AI can no longer skip
 *     "notas" because the prompt only named the topic.
 *  3. buildGuidePrompt frames it: which screen, what it is for, every
 *     option with its mechanics, then the ask — each one, none skipped,
 *     with examples from the person's own data through the connector.
 *
 * The prompt carries no personal data, only how the screen works. When the
 * dedicated guides MCP exists, the `ai` texts become what it serves and the
 * prompt shrinks to "read the guide of screen X".
 */

type Translate = (key: string, options?: TranslateOptions) => string;

export interface GuideItemText {
  title: string;
  body: string;
  ai: string;
}

export interface GuidePromptSpec {
  /** The screen's name as the app shows it ("Minhas ideias"). */
  screen: string;
  /** One sentence, first person: what the screen is for. */
  purpose: string;
  /** Where the examples come from, completing "com exemplos …". */
  examples: string;
  items: GuideItemText[];
}

/** Reads `<prefix>.items.<key>.{title,body,ai}` for each key, in order.
 *  Every item has all three: an option the AI is told nothing about is
 *  exactly the gap this model exists to close. */
export function guideItems(
  t: Translate,
  prefix: string,
  keys: readonly string[],
): GuideItemText[] {
  return keys.map((k) => ({
    title: t(`${prefix}.items.${k}.title`),
    body: t(`${prefix}.items.${k}.body`),
    ai: t(`${prefix}.items.${k}.ai`),
  }));
}

/** The whole prompt of a screen whose texts live under `prefix`
 *  (screenName, purpose, examples, items.<key>.*), for the keys shown —
 *  a guide passes only the keys its modules leave on screen. */
export function screenGuidePrompt(
  t: Translate,
  prefix: string,
  keys: readonly string[],
): string {
  return buildGuidePrompt(t, {
    screen: t(`${prefix}.screenName`),
    purpose: t(`${prefix}.purpose`),
    examples: t(`${prefix}.examples`),
    items: guideItems(t, prefix, keys),
  });
}

/** The AI door's prompt: `guide.prompt` with one bullet per item. */
export function buildGuidePrompt(t: Translate, spec: GuidePromptSpec): string {
  const items = spec.items
    .map((it) => `• ${it.title}: ${it.body} ${it.ai}`)
    .join('\n');
  return t('guide.prompt', {
    screen: spec.screen,
    purpose: spec.purpose,
    items,
    examples: spec.examples,
  });
}
