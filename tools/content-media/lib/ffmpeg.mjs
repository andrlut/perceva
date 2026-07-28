/* eslint-env node */
/**
 * ffmpeg helpers for the content-media pipeline.
 *
 * ffmpeg is NOT on PATH in this environment — it was installed via winget and
 * lives under %LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*. We glob
 * for it and fall back to a bare `ffmpeg` (in case a future machine has it on
 * PATH). Override with the FFMPEG_PATH env var.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Resolve the ffmpeg executable, memoized. */
let cachedFfmpeg = null;
export function resolveFfmpeg() {
  if (cachedFfmpeg) return cachedFfmpeg;

  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    cachedFfmpeg = process.env.FFMPEG_PATH;
    return cachedFfmpeg;
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const pkgRoot = join(localAppData, 'Microsoft', 'WinGet', 'Packages');
    try {
      const dir = readdirSync(pkgRoot).find((d) => d.startsWith('Gyan.FFmpeg'));
      if (dir) {
        // e.g. .../Gyan.FFmpeg_*/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe
        const buildDir = readdirSync(join(pkgRoot, dir)).find((d) =>
          d.startsWith('ffmpeg-'),
        );
        if (buildDir) {
          const candidate = join(pkgRoot, dir, buildDir, 'bin', 'ffmpeg.exe');
          if (existsSync(candidate)) {
            cachedFfmpeg = candidate;
            return cachedFfmpeg;
          }
        }
      }
    } catch {
      /* fall through to PATH lookup */
    }
  }

  // Last resort: assume it's on PATH.
  cachedFfmpeg = 'ffmpeg';
  return cachedFfmpeg;
}

function run(args) {
  const bin = resolveFfmpeg();
  execFileSync(bin, ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
}

/**
 * Convert any raster image to webp at an EXACT target size, cover-cropping to
 * fill (center) so the output always matches width×height regardless of the
 * source aspect ratio. This is the safety net for the known js-genai bug where
 * `imageConfig.aspectRatio` is sometimes ignored — even a square input becomes
 * a clean 2:3 cover.
 */
export function toWebpCover(inputPath, outputPath, width, height, quality = 82) {
  const vf = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
  ].join(',');
  run(['-i', inputPath, '-vf', vf, '-c:v', 'libwebp', '-q:v', String(quality), outputPath]);
}

/**
 * Convert a raster image to webp, downscaling to `maxWidth` but preserving the
 * source aspect ratio (no crop). Used for infographics that are already
 * rendered at the exact target size — this just does the webp encode + a
 * safety clamp on width.
 */
export function toWebp(inputPath, outputPath, maxWidth, quality = 82) {
  const vf = `scale='min(${maxWidth},iw)':-2`;
  run(['-i', inputPath, '-vf', vf, '-c:v', 'libwebp', '-q:v', String(quality), outputPath]);
}
