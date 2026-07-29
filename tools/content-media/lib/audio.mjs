/* eslint-env node */
/**
 * Two-host podcast audio via the Gemini API multi-speaker TTS
 * (gemini-2.5-flash-preview-tts). Reproduces the "NotebookLM feel" from a
 * dialogue script the learning-audio-writer agent produced — WE write the
 * script (brand voice, faithful to the article); Gemini only voices it.
 *
 * Cost: ~$0.15 per 10-min episode (25 audio tokens/sec × $10/1M). Output is
 * raw PCM (24 kHz, 16-bit, mono) which we wrap as WAV; the caller transcodes
 * to AAC .m4a with ffmpeg.
 *
 * Quality drifts past a few minutes, so long dialogues are split into ~word-
 * budget segments, each synthesized separately and concatenated (same PCM
 * format → lossless Buffer join).
 */

import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const SAMPLE_RATE = 24000; // Gemini TTS output: 24 kHz, 16-bit, mono
const WORDS_PER_SEGMENT = 360; // ~2.4 min at ~150 wpm — safely under the drift threshold

/** Wrap raw signed-16-bit-LE mono PCM as a WAV file buffer. */
export function pcmToWav(pcm, sampleRate = SAMPLE_RATE) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Split dialogue turns into segments of ~WORDS_PER_SEGMENT words (never mid-turn). */
function segmentTurns(turns) {
  const segments = [];
  let cur = [];
  let words = 0;
  for (const t of turns) {
    const w = String(t.text || '').split(/\s+/).filter(Boolean).length;
    if (words + w > WORDS_PER_SEGMENT && cur.length) {
      segments.push(cur);
      cur = [];
      words = 0;
    }
    cur.push(t);
    words += w;
  }
  if (cur.length) segments.push(cur);
  return segments;
}

function extractPcm(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inlineData ?? p.inline_data;
    if (inline?.data) return Buffer.from(inline.data, 'base64');
  }
  const text = parts.find((p) => p.text)?.text;
  throw new Error('Gemini returned no audio' + (text ? `. Model said: ${text.slice(0, 200)}` : '.'));
}

/**
 * Synthesize a two-host dialogue to a single PCM buffer.
 * @param {object} opts
 * @param {Array<{speaker:string,text:string}>} opts.turns
 * @param {Array<{name:string,voice:string}>} opts.hosts  exactly 2 (Gemini caps multispeaker at 2)
 * @param {string} [opts.style] natural-language delivery instruction (prepended)
 * @param {string} [opts.apiKey]
 * @param {(msg:string)=>void} [opts.onProgress]
 * @returns {Promise<{ pcm: Buffer, sampleRate: number, segments: number }>}
 */
export async function synthesizeDialogue({ turns, hosts, style, apiKey = process.env.GEMINI_API_KEY, onProgress }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
  if (!Array.isArray(turns) || turns.length === 0) throw new Error('No dialogue turns.');
  if (!Array.isArray(hosts) || hosts.length !== 2) {
    throw new Error('Gemini multispeaker needs exactly 2 hosts.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const [a, b] = hosts;
  const styleLine =
    style || `Leia como um podcast de dois apresentadores — tom caloroso, natural e conversacional, com ritmo humano:`;

  const speechConfig = {
    multiSpeakerVoiceConfig: {
      speakerVoiceConfigs: [
        { speaker: a.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: a.voice } } },
        { speaker: b.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: b.voice } } },
      ],
    },
  };

  const segments = segmentTurns(turns);
  const pcmChunks = [];
  for (let i = 0; i < segments.length; i++) {
    onProgress?.(`segmento ${i + 1}/${segments.length}`);
    const script = segments[i].map((t) => `${t.speaker}: ${t.text}`).join('\n');
    const contents = `${styleLine}\n\n${script}`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { responseModalities: ['AUDIO'], speechConfig },
    });
    pcmChunks.push(extractPcm(response));
  }

  return { pcm: Buffer.concat(pcmChunks), sampleRate: SAMPLE_RATE, segments: segments.length };
}
