/* eslint-env node */
/**
 * Post-processing for the videos the Gemini Notebook produces ("Resumo em
 * Vídeo", formato "Curta": ~60 s, 720x1280 H.264 + AAC) before they go to the
 * `learning-media` bucket — the piece the `learning-notebook-runner` agent
 * calls between "downloaded" and "uploaded".
 *
 * What the Notebook hands us and what we change:
 *   - Every video ends with a near-white branded end card (~2–4 s) after the
 *     narration stops. We cut it. It is found by frame brightness, not by a
 *     fixed offset: the content averages ~207 luma (YAVG) even on its brightest
 *     scenes, the end card ~229 (migration 20260902000004 documents the cut
 *     that was first done by hand). The small in-video watermark is kept — it
 *     is the attribution.
 *   - A poster (first-frame webp) for the idea screen's video player.
 *   - Deep dives ("Resumo em Áudio") come down as ~34 MB .m4a; they are
 *     re-encoded to AAC 64k mono +faststart (~0.5 MB/min).
 *
 * Nothing here touches Supabase or git. Everything shells out to ffmpeg /
 * ffprobe (winget install, resolved by ./ffmpeg.mjs — FFMPEG_PATH overrides;
 * FFPROBE_PATH overrides the probe binary separately).
 *
 * Detection is deliberately conservative — a wrong cut loses narration, a
 * missed cut only leaves the end card in (visible, fixable later with a .v2
 * path). `detectOutroStart` returns null, and `trimOutro` stream-copies,
 * whenever the bright run does not look like an end card:
 *   - the last frame is not bright (already trimmed, or a dark ending);
 *   - the run covers the whole sampled window (no junction seen — widen
 *     `window` if the video really has a long white tail);
 *   - the run is shorter than `minRun` (a flash) or longer than `maxRun`
 *     (not a 2–4 s end card; look at it by hand).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { probeImageSize, resolveFfmpeg } from './ffmpeg.mjs';

export { resolveFfmpeg };

/** Frame-brightness defaults. See the header comment for where they come from. */
export const OUTRO_DEFAULTS = Object.freeze({
  /** seconds sampled from the end of the file */
  window: 12,
  /** YAVG at or above this is "end card"; content peaks ~207, the card ~229 */
  threshold: 225,
  /** a bright run shorter than this is a flash, not an end card */
  minRun: 0.5,
  /** a bright run longer than this is not the ~2–4 s end card — refuse to cut */
  maxRun: 8,
  /** seconds trimmed before the first bright frame (encoder fade-in safety) */
  padding: 0.15,
});

let cachedFfprobe = null;

/**
 * Resolve the ffprobe executable: FFPROBE_PATH, else the sibling of the
 * resolved ffmpeg (winget layout puts both in the same bin/), else PATH.
 * Memoized.
 * @returns {string}
 */
export function resolveFfprobe() {
  if (cachedFfprobe) return cachedFfprobe;
  if (process.env.FFPROBE_PATH && existsSync(process.env.FFPROBE_PATH)) {
    cachedFfprobe = process.env.FFPROBE_PATH;
    return cachedFfprobe;
  }
  const ffmpeg = resolveFfmpeg();
  const sibling = ffmpeg.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  cachedFfprobe = sibling !== ffmpeg && (sibling === 'ffprobe' || existsSync(sibling)) ? sibling : 'ffprobe';
  return cachedFfprobe;
}

/**
 * Run a binary, capturing stdout. Failures surface the tail of stderr, which
 * is where ffmpeg explains itself.
 * @param {string} bin
 * @param {string[]} args
 * @returns {string} stdout
 */
function capture(bin, args) {
  try {
    return execFileSync(bin, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    const tail = String(e.stderr || e.message || '').trim().split(/\r?\n/).slice(-6).join('\n');
    throw new Error(`${bin.split(/[\\/]/).pop()} failed (${args.slice(0, 6).join(' ')} …):\n${tail}`);
  }
}

/** ffmpeg with the flags every call here wants. */
function ffmpeg(args) {
  return capture(resolveFfmpeg(), ['-y', '-hide_banner', '-loglevel', 'error', '-nostdin', ...args]);
}

/** Seconds → ffmpeg time argument (never scientific notation). */
function sec(n) {
  return Math.max(0, n).toFixed(3);
}

function assertFile(path, what = 'input') {
  if (!path || !existsSync(path)) throw new Error(`${what} not found: ${path}`);
  if (!statSync(path).isFile()) throw new Error(`${what} is not a file: ${path}`);
}

function assertDistinct(input, output) {
  if (resolve(input).toLowerCase() === resolve(output).toLowerCase()) {
    throw new Error('output must differ from input (ffmpeg cannot write in place)');
  }
}

/** "30000/1001" → 29.97; "0/0" → null. */
function parseRate(r) {
  if (typeof r !== 'string') return null;
  const [n, d] = r.split('/').map(Number);
  if (!n || !d) return null;
  return Math.round((n / d) * 1000) / 1000;
}

/**
 * @typedef {object} ProbeInfo
 * @property {number} durationSeconds container duration (float)
 * @property {number|null} width  first video stream
 * @property {number|null} height
 * @property {number|null} fps    average frame rate of the first video stream
 * @property {string|null} videoCodec e.g. "h264"; null when there is no video
 * @property {string|null} audioCodec e.g. "aac"; null when there is no audio
 */

/**
 * Container duration + first video stream geometry, via `ffprobe -of json`.
 * Works for audio-only files too (width/height/fps come back null).
 * @param {string} path
 * @returns {ProbeInfo}
 */
export function probe(path) {
  assertFile(path);
  const out = capture(resolveFfprobe(), [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,codec_name,width,height,avg_frame_rate,r_frame_rate:format=duration',
    '-of', 'json',
    path,
  ]);
  let json;
  try {
    json = JSON.parse(out);
  } catch (e) {
    throw new Error(`ffprobe returned non-JSON for ${path}: ${e.message}`);
  }
  const streams = Array.isArray(json.streams) ? json.streams : [];
  const video = streams.find((s) => s.codec_type === 'video') ?? null;
  const audio = streams.find((s) => s.codec_type === 'audio') ?? null;
  const durationSeconds = parseFloat(json.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(`ffprobe found no usable duration for ${path}`);
  }
  return {
    durationSeconds,
    width: video?.width ?? null,
    height: video?.height ?? null,
    fps: parseRate(video?.avg_frame_rate) ?? parseRate(video?.r_frame_rate),
    videoCodec: video?.codec_name ?? null,
    audioCodec: audio?.codec_name ?? null,
  };
}

/**
 * @typedef {object} LumaSample
 * @property {number} t    absolute timestamp in seconds
 * @property {number} yavg average luma of the frame (0..255, signalstats YAVG)
 */

/**
 * Per-frame average luma from `from` to the end of the file, using ffmpeg's
 * `signalstats` + `metadata=print` on stdout. `-ss` before `-i` seeks fast
 * (keyframe, then decodes up to the exact time); `-copyts` keeps the original
 * timestamps so `t` is absolute; `-fps_mode passthrough` measures every
 * decoded frame instead of a CFR-resampled stream.
 * @param {string} path
 * @param {number} from seconds
 * @returns {LumaSample[]}
 */
export function sampleLuma(path, from = 0) {
  assertFile(path);
  const out = ffmpeg([
    '-ss', sec(from), '-copyts', '-i', path,
    '-an', '-sn', '-dn',
    '-fps_mode', 'passthrough',
    '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
    '-f', 'null', '-',
  ]);
  const samples = [];
  let t = null;
  for (const line of out.split(/\r?\n/)) {
    if (line.startsWith('frame:')) {
      const m = /pts_time:(-?[\d.]+)/.exec(line);
      t = m ? parseFloat(m[1]) : null;
    } else if (line.startsWith('lavfi.signalstats.YAVG=') && t != null) {
      const yavg = parseFloat(line.slice('lavfi.signalstats.YAVG='.length));
      if (Number.isFinite(yavg)) samples.push({ t, yavg });
      t = null;
    }
  }
  return samples;
}

/**
 * @typedef {object} TailAnalysis
 * @property {number|null} cutAt  seconds — first frame of the end card, or null
 * @property {string} reason      why cutAt is what it is (human-readable)
 * @property {number} from        where sampling started (seconds)
 * @property {number} durationSeconds
 * @property {number} frames      frames sampled
 * @property {number|null} runSeconds length of the trailing bright run (null when the last frame is not bright)
 * @property {number|null} lastYavg
 * @property {number|null} contentYavg YAVG of the last frame BEFORE the run (what the content looked like at the junction)
 */

/**
 * Full diagnostics behind `detectOutroStart` — what the CLI shows on stderr
 * and what the synthetic test asserts on.
 * @param {string} path
 * @param {{window?: number, threshold?: number, minRun?: number, maxRun?: number}} [opts]
 * @returns {TailAnalysis}
 */
export function analyzeTail(path, opts = {}) {
  const window = opts.window ?? OUTRO_DEFAULTS.window;
  const threshold = opts.threshold ?? OUTRO_DEFAULTS.threshold;
  const minRun = opts.minRun ?? OUTRO_DEFAULTS.minRun;
  const maxRun = opts.maxRun ?? OUTRO_DEFAULTS.maxRun;

  const { durationSeconds } = probe(path);
  const from = Math.max(0, durationSeconds - window);
  const samples = sampleLuma(path, from);
  const base = { from, durationSeconds, frames: samples.length };

  if (samples.length === 0) {
    return { ...base, cutAt: null, reason: 'no frames decoded in the window', runSeconds: null, lastYavg: null, contentYavg: null };
  }
  const last = samples[samples.length - 1];
  if (last.yavg < threshold) {
    return {
      ...base, cutAt: null, runSeconds: null, lastYavg: last.yavg, contentYavg: null,
      reason: `last frame YAVG ${last.yavg.toFixed(1)} < ${threshold} — no bright tail (already trimmed?)`,
    };
  }
  // Walk back over the trailing bright run.
  let i = samples.length - 1;
  while (i > 0 && samples[i - 1].yavg >= threshold) i--;
  const runStart = samples[i];
  const runSeconds = durationSeconds - runStart.t;
  const contentYavg = i > 0 ? samples[i - 1].yavg : null;
  const common = { ...base, runSeconds, lastYavg: last.yavg, contentYavg };

  if (i === 0) {
    return {
      ...common, cutAt: null,
      reason: `bright (≥${threshold}) for the whole ${window}s window — no junction seen; widen --window or inspect by hand`,
    };
  }
  if (runSeconds < minRun) {
    return { ...common, cutAt: null, reason: `bright run of ${runSeconds.toFixed(2)}s is shorter than minRun ${minRun}s — a flash, not an end card` };
  }
  if (runSeconds > maxRun) {
    return { ...common, cutAt: null, reason: `bright run of ${runSeconds.toFixed(2)}s is longer than maxRun ${maxRun}s — not a 2–4 s end card; inspect by hand` };
  }
  return {
    ...common, cutAt: runStart.t,
    reason: `end card from ${runStart.t.toFixed(3)}s (${runSeconds.toFixed(2)}s, YAVG ${contentYavg.toFixed(1)} → ${runStart.yavg.toFixed(1)})`,
  };
}

/**
 * Where the Notebook's near-white end card starts, in seconds — the first
 * frame from which YAVG stays ≥ `threshold` until the end of the file — or
 * null when there is no such run (already trimmed) or the run does not look
 * like an end card (see the header comment). Never cut on null.
 * @param {string} path
 * @param {{window?: number, threshold?: number, minRun?: number, maxRun?: number}} [opts]
 * @returns {number|null}
 */
export function detectOutroStart(path, opts = {}) {
  return analyzeTail(path, opts).cutAt;
}

/**
 * @typedef {object} TrimResult
 * @property {number|null} cutAt   where the end card started (null = nothing detected, stream-copied)
 * @property {number} durationSeconds duration of the OUTPUT file
 * @property {string} reason       detection diagnostics
 */

/**
 * Write `output` without the end card. When nothing is detected the input is
 * remuxed with stream copy (+faststart, bytes otherwise untouched); when it
 * is, the file is re-encoded ending at `cutAt - padding` (libx264 crf 22
 * preset medium, AAC 128k, +faststart, geometry untouched — a Notebook file
 * stays 720x1280). Pass `cutAt` to skip detection and cut at a known time.
 * @param {string} input
 * @param {string} output
 * @param {{padding?: number, window?: number, threshold?: number, minRun?: number, maxRun?: number, cutAt?: number|null}} [opts]
 * @returns {TrimResult}
 */
export function trimOutro(input, output, opts = {}) {
  assertFile(input);
  assertDistinct(input, output);
  const padding = opts.padding ?? OUTRO_DEFAULTS.padding;

  let cutAt;
  let reason;
  if (opts.cutAt !== undefined) {
    cutAt = opts.cutAt;
    reason = cutAt == null ? 'trim skipped by caller' : `cut at ${cutAt}s (given by caller)`;
  } else {
    const a = analyzeTail(input, opts);
    cutAt = a.cutAt;
    reason = a.reason;
  }

  if (cutAt == null) {
    ffmpeg(['-i', input, '-map', '0', '-c', 'copy', '-movflags', '+faststart', output]);
  } else {
    const end = cutAt - padding;
    if (!(end > 0.5)) throw new Error(`cut point ${cutAt}s minus padding ${padding}s leaves nothing (${end.toFixed(3)}s)`);
    ffmpeg([
      '-i', input,
      '-to', sec(end),
      '-map', '0:v:0', '-map', '0:a?',
      '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      output,
    ]);
  }
  return { cutAt, durationSeconds: probe(output).durationSeconds, reason };
}

/**
 * @typedef {object} PosterResult
 * @property {string} path
 * @property {number} at      the timestamp actually used (clamped into the file)
 * @property {number|null} width
 * @property {number|null} height
 * @property {number} bytes
 */

/**
 * One frame → webp poster (`-ss at -frames:v 1 -vf scale=W:-2 -c:v libwebp
 * -q:v Q`, the recipe the first posters were made with). `at` is clamped to
 * the file so a very short clip still gets a poster.
 * @param {string} input
 * @param {string} output
 * @param {{at?: number, width?: number, quality?: number}} [opts]
 * @returns {PosterResult}
 */
export function posterWebp(input, output, opts = {}) {
  assertFile(input);
  assertDistinct(input, output);
  const { durationSeconds } = probe(input);
  const wanted = opts.at ?? 1.0;
  const at = Math.max(0, Math.min(wanted, Math.max(0, durationSeconds - 0.25)));
  const width = opts.width ?? 720;
  const quality = opts.quality ?? 82;
  ffmpeg([
    '-ss', sec(at), '-i', input,
    '-frames:v', '1',
    '-vf', `scale=${width}:-2`,
    '-c:v', 'libwebp', '-q:v', String(quality),
    output,
  ]);
  if (!existsSync(output)) throw new Error(`poster was not written: ${output}`);
  const size = probeImageSize(output);
  return { path: output, at, width: size?.width ?? null, height: size?.height ?? null, bytes: statSync(output).size };
}

/**
 * Deep dive audio → AAC 64k mono .m4a with +faststart (the Learning audio
 * format, ~0.5 MB/min; the raw Notebook download is ~34 MB and over the
 * bucket's 30 MB audio cap). Same recipe as `toM4a` in ./ffmpeg.mjs, plus
 * `-vn` so a container that happens to carry video still yields audio-only.
 * @param {string} input
 * @param {string} output
 * @param {{bitrate?: string}} [opts]
 * @returns {{path: string, durationSeconds: number, bytes: number}}
 */
export function transcodeAudio(input, output, opts = {}) {
  assertFile(input);
  assertDistinct(input, output);
  ffmpeg([
    '-i', input, '-vn', '-sn', '-dn',
    '-c:a', 'aac', '-b:a', opts.bitrate ?? '64k', '-ac', '1',
    '-movflags', '+faststart',
    output,
  ]);
  if (!existsSync(output)) throw new Error(`audio was not written: ${output}`);
  return { path: output, durationSeconds: probe(output).durationSeconds, bytes: statSync(output).size };
}
