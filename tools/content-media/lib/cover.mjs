/* eslint-env node */
/**
 * Cover-image generation via the Gemini API (Nano Banana 2 / Gemini 3.1 Flash
 * Image). Covers are ATMOSPHERIC and TEXTLESS — exactly the job image models
 * are good at — at ~$0.067/image (1K). The infographic (which needs correct
 * text and data) is rendered from code instead; see lib/infographic.mjs.
 *
 * The same call also produces the per-IDEA images (Recanto em ideias): same
 * house style, same style references, but 4:5 with the subject centered and
 * no reserved title band — the idea card overlays its title on a framed copy,
 * not on empty space. `aspect` selects the format sentence and the model's
 * aspectRatio; everything else in the request is shared. `generateIdeaImage`
 * is the thin 4:5 entry point.
 *
 * Requires GEMINI_API_KEY (an AI Studio key with billing enabled — image
 * generation has no API free tier). Returns the raw image bytes; the caller
 * transcodes to a webp (2:3 cover crop, 4:5 idea crop).
 *
 * MODEL HISTORY: the covers currently live were made with
 * gemini-2.5-flash-image, which SHUTS DOWN 2026-10-02. 3.1 is the successor.
 * Because a prose style description does not survive that jump, the house look
 * is now also carried by style reference IMAGES — see lib/styleRefs.mjs.
 *
 * DOCS WARNING: ai.google.dev/gemini-api/docs/image-generation renders a
 * sample using `ai.interactions.create` with a `response_format` object. That
 * API DOES NOT EXIST in @google/genai — `ai.models.generateContent` with
 * `config.imageConfig` is the real surface, confirmed against the installed
 * typings. Do not "fix" this file to match that page.
 */

import { GoogleGenAI } from '@google/genai';

import { loadStyleRefs } from './styleRefs.mjs';

// gemini-2.5-flash-image shuts down 2026-10-02. We default to the STABLE 3.1
// id rather than gemini-3.1-flash-image-preview (which the deprecation page
// suggests): preview aliases churn, and escaping exactly that kind of
// retirement is the point. GEMINI_IMAGE_MODEL overrides without a code change.
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

// 1K is also the current default, but pinning it guards against a default bump
// to 2K, which costs 1.5x for pixels the 768x1152 crop throws away. Known
// js-genai bug: imageSize is sometimes a no-op and output is ~1K regardless —
// which is what we want anyway.
const IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE || '1K';

/**
 * Style guardrails appended to every cover prompt so output matches the
 * Perceva house style: FLAT VECTOR ILLUSTRATION (like the domino / candle
 * covers), never photorealistic. Deep navy background, warm gold accent.
 *
 * Kept deliberately unchanged when style references were introduced: the refs
 * and the model both moved in one step, and changing a third variable would
 * have made the comparison uninterpretable. Two things here can never be
 * replaced by images no matter how good the refs get — an image cannot express
 * a PROHIBITION ("no text, no logos"), and the empty upper third is a hard
 * downstream contract (the app overlays a title there).
 *
 * KNOWN WART, measured on the 3.1 migration: "navy-to-indigo gradient" is not
 * what the live covers actually look like (they are a desaturated charcoal
 * navy), and on 3.1 that wording alone produces a saturated purple. The style
 * refs override it, so it only bites in the degraded prompt-only path. If you
 * ever rewrite the colour sentences, do it in its own commit so the effect is
 * attributable, and re-run the comparison in style-refs/README.md.
 *
 * The suffix is one string split in three — stem, per-aspect FORMAT sentence,
 * tail — so the idea images can share everything but the format line. For
 * '2:3' the concatenation is byte-identical to the suffix that produced the
 * live covers (see `styleSuffix`).
 */
const STYLE_STEM =
  ' Flat vector illustration in a modern, minimal editorial style — bold clean ' +
  'simple shapes, smooth flat color fills with soft gradients, gentle depth, low ' +
  'detail. NOT photorealistic, NOT a photograph, NOT a 3D render, not painterly, ' +
  'no textures. Deep dark navy-to-indigo gradient background with a subtle radial ' +
  'glow. Warm golden light as the focal accent, plus one harmonious accent color. ' +
  'Calm, premium, a quiet sense of wonder. ';

/**
 * The format sentence is the ONLY part of the suffix that knows what the image
 * is for. '2:3' keeps the empty upper third the app's title overlay depends
 * on; '4:5' is the idea image, which is shown whole (the card frames it and
 * puts the title on top), so a reserved band would just read as a hole.
 */
const FORMAT_SENTENCE = {
  '2:3':
    'Vertical portrait 2:3 with generous empty negative space in the upper third ' +
    'for a title overlay later.',
  '4:5':
    'Vertical portrait 4:5, subject centered with breathing room on all sides; ' +
    'no title area, no empty band.',
};

const STYLE_TAIL =
  ' ABSOLUTELY NO text, words, letters, numbers, logos, watermarks, charts or UI.';

export const ASPECTS = Object.keys(FORMAT_SENTENCE);

/**
 * Full style suffix for one aspect. Exported so a test can pin the '2:3'
 * result to the historical string without reaching into the module.
 */
export function styleSuffix(aspect) {
  const format = FORMAT_SENTENCE[aspect];
  if (!format) {
    throw new Error(`Unsupported aspect "${aspect}". Use one of: ${ASPECTS.join(', ')}`);
  }
  return STYLE_STEM + format + STYLE_TAIL;
}

/**
 * Scopes the reference images BEFORE the model sees them. This must never sit
 * after the scene description, where it reads as a modifier on the scene
 * ("do not draw the subject") and fights it.
 */
const REF_BRIEF =
  'The images that follow are STYLE REFERENCES from the same publication. ' +
  'Match their rendering technique, palette, lighting, level of detail and ' +
  'compositional language. Do NOT reproduce, edit, remix or extend their ' +
  'subjects, objects or scenes — they define only the look, never the content. ' +
  'Do not copy any mark, logo, letter or number from them.';

/** The counter to the model dropping into image-EDITING mode on the refs. */
const SCENE_LEAD = 'Now generate ONE completely new image. Scene: ';

// ── transient-failure retry ────────────────────────────────────────────────
// Deliberately NOT httpOptions.retryOptions: when the SDK's own retry is on,
// runFetch throws a bare Error('Retryable HTTP Error: …') BEFORE the error body
// is parsed, so ApiError.status and the JSON detail ("model is overloaded",
// quota info, "model not found") are lost. For an unattended cron whose only
// artifact is one log line, that trade is bad.
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 4000;

function isTransient(err) {
  if (RETRY_STATUSES.has(err?.status)) return true;
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|deadline|fetch failed|ECONNRESET|ETIMEDOUT/i.test(
    String(err?.message ?? ''),
  );
}

/** Google puts "retryDelay":"25s" in RESOURCE_EXHAUSTED bodies — honour it. */
function serverRetryDelayMs(err) {
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(String(err?.message ?? ''));
  return m ? Math.min(Number(m[1]) * 1000, 60_000) : 0;
}

async function withRetry(fn, onWarn) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // 400 (bad imageConfig), 403 (billing off) and 404 (bad model id) must
      // fail on the first attempt, so the log says WHY instead of stalling.
      if (attempt >= MAX_ATTEMPTS || !isTransient(err)) throw err;
      const backoff = BASE_DELAY_MS * 3 ** (attempt - 1); // 4s, 12s
      const jittered = backoff * (0.75 + Math.random() * 0.5);
      const wait = Math.round(Math.max(jittered, serverRetryDelayMs(err)));
      onWarn?.(
        `Gemini ${err?.status ?? 'transitório'} — tentativa ${attempt}/${MAX_ATTEMPTS}, ` +
          `aguardando ${Math.round(wait / 1000)}s`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// ── request/response plumbing ──────────────────────────────────────────────
function buildContents(prompt, refParts, aspect) {
  const scene = prompt.trim() + styleSuffix(aspect);
  // No refs -> byte-identical to the request that produced the live covers.
  if (refParts.length === 0) return scene;
  return [{ text: REF_BRIEF }, ...refParts, { text: SCENE_LEAD + scene }];
}

function extractImage(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      return {
        buffer: Buffer.from(inline.data, 'base64'),
        mimeType: inline.mimeType || inline.mime_type || 'image/png',
      };
    }
  }
  return null;
}

/**
 * Generate a cover (or, with `aspect: '4:5'`, an idea) image.
 * @param {object} opts
 * @param {string} opts.prompt   the scene description (textless)
 * @param {'2:3' | '4:5'} [opts.aspect] '2:3' (cover, default) or '4:5' (idea)
 * @param {string} [opts.apiKey] defaults to process.env.GEMINI_API_KEY
 * @param {(msg: string) => void} [opts.onWarn]
 * @returns {Promise<{ buffer: Buffer, mimeType: string, refs: string[] }>}
 */
export async function generateCover({
  prompt,
  aspect = '2:3',
  apiKey = process.env.GEMINI_API_KEY,
  onWarn = (m) => console.warn(`      ! ${m}`),
}) {
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Get an AI Studio key at https://aistudio.google.com, ' +
        'enable billing on its project (image gen has no free tier), then set the env var.',
    );
  }
  if (!prompt || !prompt.trim()) throw new Error('Cover prompt is empty.');
  // Validate before any network call so a bad aspect fails in the log, not
  // as a 400 from the API three retries later.
  styleSuffix(aspect);

  const ai = new GoogleGenAI({ apiKey });
  const { parts: refParts, names: refNames } = await loadStyleRefs(onWarn);

  const call = (parts) =>
    withRetry(
      () =>
        ai.models.generateContent({
          model: MODEL,
          contents: buildContents(prompt, parts, aspect),
          config: {
            responseModalities: ['IMAGE'],
            // 2:3 and 4:5 portrait are both natively supported by 3.1. The
            // ffmpeg crop downstream stays as the safety net: aspectRatio is
            // still reported as ignored in some cases, and a square result
            // has to become a clean webp of the right shape either way.
            imageConfig: { aspectRatio: aspect, imageSize: IMAGE_SIZE },
          },
        }),
      onWarn,
    );

  let response = await call(refParts);
  let image = extractImage(response);
  let used = refNames;

  // Image inputs make safety/likeness filters likelier to fire, and a filtered
  // response returns text instead of an image. One prompt-only retry beats
  // shipping a material with no cover at all. NOT routed through withRetry —
  // a refusal is deterministic, and paying for it three times buys nothing.
  if (!image && refParts.length > 0) {
    onWarn?.('sem imagem com refs de estilo — repetindo só com o prompt');
    response = await call([]);
    image = extractImage(response);
    used = [];
  }

  if (!image) {
    // Surface any text the model returned (often a refusal or safety note) so
    // the failure is diagnosable.
    const textPart = (response?.candidates?.[0]?.content?.parts ?? []).find((p) => p.text)?.text;
    throw new Error(
      'Gemini returned no image' + (textPart ? `. Model said: ${textPart.slice(0, 300)}` : '.'),
    );
  }

  return { ...image, refs: used };
}

/**
 * One idea image: 4:5, subject centered, no title band. Same model, same
 * style references, same retry and prompt-only fallback as the cover — the
 * only difference is the aspect. Caller crops to 960×1200 webp.
 * @param {Omit<Parameters<typeof generateCover>[0], 'aspect'>} opts
 */
export function generateIdeaImage(opts) {
  return generateCover({ ...opts, aspect: '4:5' });
}
