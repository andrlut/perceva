/* eslint-env node */
/**
 * Cover-image generation via the Gemini API (Nano Banana / Gemini 2.5 Flash
 * Image). Covers are ATMOSPHERIC and TEXTLESS — exactly the job image models
 * are good at — at ~$0.039/image. The infographic (which needs correct text
 * and data) is rendered from code instead; see lib/infographic.mjs.
 *
 * Requires GEMINI_API_KEY (an AI Studio key with billing enabled — image
 * generation has no API free tier). Returns the raw image bytes; the caller
 * transcodes to a 2:3 webp.
 */

import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

/** Style guardrails appended to every cover prompt so output stays on-brand. */
const STYLE_SUFFIX =
  ' Atmospheric, cinematic, evocative editorial cover art. Deep dark background ' +
  '(near-black navy/indigo), dramatic directional light, rich color, subtle depth ' +
  'and texture, tasteful and premium. Portrait 2:3 composition with clear negative ' +
  'space in the upper third for a title overlay. ABSOLUTELY NO text, no words, no ' +
  'letters, no numbers, no logos, no watermarks, no UI. Not a collage, not a meme.';

/**
 * Generate a cover image.
 * @param {object} opts
 * @param {string} opts.prompt   the scene description (textless)
 * @param {string} [opts.apiKey] defaults to process.env.GEMINI_API_KEY
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
export async function generateCover({ prompt, apiKey = process.env.GEMINI_API_KEY }) {
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Get an AI Studio key at https://aistudio.google.com, ' +
        'enable billing on its project (image gen has no free tier), then set the env var.',
    );
  }
  if (!prompt || !prompt.trim()) throw new Error('Cover prompt is empty.');

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt.trim() + STYLE_SUFFIX,
    config: {
      responseModalities: ['IMAGE'],
      // 2:3 portrait. Note js-genai issue #1009: some SDK versions ignore this
      // for gemini-2.5-flash-image — the ffmpeg cover-crop downstream is the
      // safety net, so a square result still becomes a clean 2:3 webp.
      imageConfig: { aspectRatio: '2:3' },
    },
  });

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

  // No image came back — surface any text the model returned (often a refusal
  // or safety note) so the failure is diagnosable.
  const textPart = parts.find((p) => p.text)?.text;
  throw new Error(
    'Gemini returned no image' + (textPart ? `. Model said: ${textPart.slice(0, 300)}` : '.'),
  );
}
