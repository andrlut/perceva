#!/usr/bin/env node
/* eslint-env node */
/**
 * video — post-process one Gemini Notebook download before upload.
 *
 *   node video.mjs --in <mp4> --out <mp4> [--poster <webp>] [--poster-at <s>] [--no-trim]
 *                  [--window 12] [--threshold 225] [--padding 0.15]
 *       Cuts the near-white end card (or stream-copies when none is found),
 *       optionally writes a first-frame poster, and prints ONE JSON line:
 *       { input, output, cutAt, durationSeconds, width, height, poster }
 *
 *   node video.mjs --probe <file>
 *       Prints { durationSeconds, width, height, fps, videoCodec, audioCodec }.
 *
 *   node video.mjs --audio --in <file> --out <m4a>
 *       Deep dive → AAC 64k mono +faststart. Prints { input, output, durationSeconds, bytes }.
 *
 * stdout carries only the JSON line (pipe it into the run manifest);
 * everything else goes to stderr. Exit 1 on any failure, with the reason.
 * Library: ./lib/video.mjs.
 */

import { resolve } from 'node:path';

import { OUTRO_DEFAULTS, posterWebp, probe, transcodeAudio, trimOutro } from './lib/video.mjs';

const USAGE = [
  'Usage:',
  '  node video.mjs --in <mp4> --out <mp4> [--poster <webp>] [--no-trim]',
  `                 [--window ${OUTRO_DEFAULTS.window}] [--threshold ${OUTRO_DEFAULTS.threshold}] [--padding ${OUTRO_DEFAULTS.padding}]`,
  '  node video.mjs --probe <file>',
  '  node video.mjs --audio --in <file> --out <m4a>',
].join('\n');

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function num(name, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) die(`${name} expects a number, got "${raw}"`);
  return n;
}

function parseArgs(argv) {
  const args = { in: null, out: null, poster: null, probe: null, audio: false, trim: true, window: undefined, threshold: undefined, padding: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) die(`${a} needs a value\n${USAGE}`);
      return v;
    };
    if (a === '--in') args.in = next();
    else if (a === '--out') args.out = next();
    else if (a === '--poster') args.poster = next();
    else if (a === '--poster-at') args.posterAt = num(a, next());
    else if (a === '--probe') args.probe = next();
    else if (a === '--audio') args.audio = true;
    else if (a === '--no-trim') args.trim = false;
    else if (a === '--window') args.window = num(a, next());
    else if (a === '--threshold') args.threshold = num(a, next());
    else if (a === '--padding') args.padding = num(a, next());
    else if (a === '--help' || a === '-h') {
      console.error(USAGE);
      process.exit(0);
    } else die(`Unknown option ${a}\n${USAGE}`);
  }
  return args;
}

function emit(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.probe) {
    emit(probe(resolve(args.probe)));
    return;
  }

  if (!args.in || !args.out) die(`--in and --out are required\n${USAGE}`);
  const input = resolve(args.in);
  const output = resolve(args.out);

  if (args.audio) {
    console.error(`▶ audio · ${input}`);
    const r = transcodeAudio(input, output);
    console.error(`  ✓ ${output} (${r.durationSeconds.toFixed(1)}s, ${(r.bytes / 1e6).toFixed(2)} MB)`);
    emit({ input, output, durationSeconds: r.durationSeconds, bytes: r.bytes });
    return;
  }

  console.error(`▶ video · ${input}`);
  const trim = trimOutro(input, output, {
    cutAt: args.trim ? undefined : null,
    window: args.window,
    threshold: args.threshold,
    padding: args.padding,
  });
  console.error(`  · ${trim.reason}`);
  console.error(
    trim.cutAt == null
      ? `  ✓ ${output} (stream copy, ${trim.durationSeconds.toFixed(2)}s)`
      : `  ✓ ${output} (re-encoded, ${trim.durationSeconds.toFixed(2)}s)`,
  );

  let poster = null;
  if (args.poster) {
    const p = posterWebp(output, resolve(args.poster), args.posterAt != null ? { at: args.posterAt } : {});
    poster = p.path;
    console.error(`  ✓ poster ${p.path} (${p.width}x${p.height}, ${(p.bytes / 1024).toFixed(1)} KB, frame at ${p.at}s)`);
  }

  const { width, height } = probe(output);
  emit({ input, output, cutAt: trim.cutAt, durationSeconds: trim.durationSeconds, width, height, poster });
}

try {
  main();
} catch (e) {
  die(e?.message ?? String(e));
}
