#!/usr/bin/env node
/**
 * emit-material-migration.mjs — drafter payload → TEXT migration SQL.
 *
 * Turns the reviewer-approved material payload (the JSON the learning-drafter
 * returns, saved to a file) into the `<YYYYMMDD>NNNNNN_learning_material_<slug>.sql`
 * migration that the publisher used to write by hand: one
 * `insert into public.learning_material (...) on conflict (slug) do update`
 * plus the `learning_material_sub` rows. The `ideas` column is NOT set here —
 * `emit-migration.mjs --with-cover` does that once the images exist.
 *
 * Usage:
 *   node emit-material-migration.mjs --payload <payload.json> [--out <path>] [--stdout]
 *                                    [--reviewer "<one-line verdict>"]
 *
 * Fails closed (exit 1) on: missing required fields, a text field containing
 * its own dollar-quote tag, takeaways outside 1..5, subs outside 1..2, a
 * non-http(s) source_url, or an existing --out file (migrations are write-once).
 * Writes UTF-8 without BOM; diagnostics go to stderr so --stdout is pure SQL.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase', 'migrations');

const USAGE =
  'Usage: node emit-material-migration.mjs --payload <payload.json> [--out <path>] [--stdout] [--reviewer "<verdict>"]';

const DIMENSIONS = ['health', 'body', 'mind', 'wealth', 'bonds', 'craft'];
const SUBS = [
  'sleep', 'nutrition', 'strength', 'dexterity', 'learn', 'contemplate',
  'money', 'career', 'circle', 'romance', 'play', 'build',
];
const TYPES = ['explainer', 'summary', 'news'];

function die(msg) {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(1);
}
function info(msg) {
  process.stderr.write(`${msg}\n`);
}

function parseArgs(argv) {
  const args = { payload: null, out: null, stdout: false, reviewer: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--payload') args.payload = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--stdout') args.stdout = true;
    else if (a === '--reviewer') args.reviewer = argv[++i] ?? '';
    else die(`Unknown option ${a}\n  ${USAGE}`);
  }
  if (!args.payload) die(`Missing --payload. ${USAGE}`);
  return args;
}

/** Dollar-quote `text` with `tag`; refuses if the text could close the quote. */
function dq(tag, text, field) {
  const s = String(text ?? '');
  if (s.includes(`$${tag}$`)) die(`${field} contains the dollar-quote tag $${tag}$`);
  if (s.includes('$$')) die(`${field} contains "$$"`);
  return `$${tag}$${s}$${tag}$`;
}

function requireString(p, key, { min = 1 } = {}) {
  const v = p[key];
  if (typeof v !== 'string' || v.trim().length < min) die(`payload.${key} missing or empty`);
  return v;
}

function nextCounterPath(slug) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const prefix = `${y}${m}${d}`;
  let n = 1;
  if (existsSync(MIGRATIONS_DIR)) {
    for (const f of readdirSync(MIGRATIONS_DIR)) {
      const match = f.match(/^(\d{8})(\d{6})_/);
      if (match && match[1] === prefix) n = Math.max(n, Number(match[2]) + 1);
    }
  }
  return join(MIGRATIONS_DIR, `${prefix}${String(n).padStart(6, '0')}_learning_material_${slug}.sql`);
}

function buildSql(p, reviewerLine) {
  const slug = requireString(p, 'slug');
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) die(`payload.slug "${slug}" must match ^[a-z0-9-]{3,80}$`);
  const type = requireString(p, 'type');
  if (!TYPES.includes(type)) die(`payload.type "${type}" not in ${TYPES.join('|')}`);
  const dimension = requireString(p, 'dimension_id');
  if (!DIMENSIONS.includes(dimension)) die(`payload.dimension_id "${dimension}" not in ${DIMENSIONS.join('|')}`);
  const topic = requireString(p, 'topic');
  const minutes = Number(p.reading_minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) die('payload.reading_minutes must be an integer 1..60');
  const subs = Array.isArray(p.subs) ? p.subs : [];
  if (subs.length < 1 || subs.length > 2) die('payload.subs must have 1..2 entries');
  for (const s of subs) if (!SUBS.includes(s)) die(`payload.subs contains unknown sub "${s}"`);

  for (const k of ['title_pt', 'title_en', 'summary_pt', 'summary_en', 'body_pt', 'body_en', 'tracking_pt', 'tracking_en', 'source_label_pt', 'source_label_en']) {
    requireString(p, k);
  }
  const sourceUrl = requireString(p, 'source_url');
  if (!/^https?:\/\//.test(sourceUrl)) die('payload.source_url must be http(s)');

  for (const k of ['takeaways_pt', 'takeaways_en']) {
    const arr = p[k];
    if (!Array.isArray(arr) || arr.length < 1 || arr.length > 5) die(`payload.${k} must have 1..5 entries`);
    for (const t of arr) if (typeof t !== 'string' || !t.trim()) die(`payload.${k} has an empty entry`);
  }
  if (p.takeaways_pt.length !== p.takeaways_en.length) die('takeaways_pt and takeaways_en differ in length');

  if (!p.reasoning_log || typeof p.reasoning_log !== 'object') die('payload.reasoning_log missing');
  const rlog = JSON.stringify(p.reasoning_log);

  const takeaways = (arr, tagBase) => `array[${arr.map((t, i) => dq(`${tagBase}${i}`, t, `takeaways[${i}]`)).join(', ')}]`;

  const lines = [];
  lines.push(`-- Learning material: ${slug} (${type})`);
  lines.push(`-- Topic: ${topic.replace(/\r?\n/g, ' ')} | dimension: ${dimension} | subs: ${subs.join(', ')}`);
  lines.push(`-- Pipeline: planner -> researcher -> drafter (ideias primeiro) -> reviewer${reviewerLine ? ` (${reviewerLine})` : ''}`);
  lines.push(`-- Primary source: ${sourceUrl}`);
  lines.push(`-- GENERATED by tools/content-media/emit-material-migration.mjs — do not hand-edit; fix the payload and re-emit.`);
  lines.push(`-- The \`ideas\` column is set by the sibling migration from emit-migration.mjs (after the images exist).`);
  lines.push('');
  lines.push('insert into public.learning_material (');
  lines.push('  slug, type, dimension_id, topic, reading_minutes,');
  lines.push('  title_pt, title_en, summary_pt, summary_en,');
  lines.push('  body_pt, body_en,');
  lines.push('  takeaways_pt, takeaways_en,');
  lines.push('  tracking_pt, tracking_en,');
  lines.push('  source_url, source_label_pt, source_label_en,');
  lines.push('  reasoning_log');
  lines.push(') values (');
  lines.push(`  ${dq('slug', slug, 'slug')}, ${dq('ty', type, 'type')}, ${dq('dim', dimension, 'dimension_id')}, ${dq('top', topic, 'topic')}, ${minutes},`);
  lines.push(`  ${dq('tpt', p.title_pt, 'title_pt')}, ${dq('ten', p.title_en, 'title_en')},`);
  lines.push(`  ${dq('spt', p.summary_pt, 'summary_pt')}, ${dq('sen', p.summary_en, 'summary_en')},`);
  lines.push(`  ${dq('bpt', p.body_pt, 'body_pt')},`);
  lines.push(`  ${dq('ben', p.body_en, 'body_en')},`);
  lines.push(`  ${takeaways(p.takeaways_pt, 'tk')}, ${takeaways(p.takeaways_en, 'te')},`);
  lines.push(`  ${dq('trpt', p.tracking_pt, 'tracking_pt')}, ${dq('tren', p.tracking_en, 'tracking_en')},`);
  lines.push(`  ${dq('url', sourceUrl, 'source_url')}, ${dq('lpt', p.source_label_pt, 'source_label_pt')}, ${dq('len', p.source_label_en, 'source_label_en')},`);
  lines.push(`  ${dq('rlog', rlog, 'reasoning_log')}::jsonb`);
  lines.push(')');
  lines.push('on conflict (slug) do update set');
  lines.push('  type            = excluded.type,');
  lines.push('  dimension_id    = excluded.dimension_id,');
  lines.push('  topic           = excluded.topic,');
  lines.push('  reading_minutes = excluded.reading_minutes,');
  lines.push('  title_pt        = excluded.title_pt,');
  lines.push('  title_en        = excluded.title_en,');
  lines.push('  summary_pt      = excluded.summary_pt,');
  lines.push('  summary_en      = excluded.summary_en,');
  lines.push('  body_pt         = excluded.body_pt,');
  lines.push('  body_en         = excluded.body_en,');
  lines.push('  takeaways_pt    = excluded.takeaways_pt,');
  lines.push('  takeaways_en    = excluded.takeaways_en,');
  lines.push('  tracking_pt     = excluded.tracking_pt,');
  lines.push('  tracking_en     = excluded.tracking_en,');
  lines.push('  source_url      = excluded.source_url,');
  lines.push('  source_label_pt = excluded.source_label_pt,');
  lines.push('  source_label_en = excluded.source_label_en,');
  lines.push('  reasoning_log   = excluded.reasoning_log,');
  lines.push('  updated_at      = now();');
  lines.push('');
  lines.push('insert into public.learning_material_sub (material_id, sub_id)');
  lines.push('select m.id, s.sub_id');
  lines.push('from public.learning_material m');
  lines.push(`cross join (values ${subs.map((s, i) => `(${dq(`sub${i}`, s, `subs[${i}]`)})`).join(', ')}) as s(sub_id)`);
  lines.push(`where m.slug = ${dq('slug', slug, 'slug')}`);
  lines.push('on conflict do nothing;');
  lines.push('');
  return { sql: lines.join('\n'), slug };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const payloadPath = resolve(args.payload);
  if (!existsSync(payloadPath)) die(`payload not found: ${payloadPath}`);
  let payload;
  try {
    payload = JSON.parse(readFileSync(payloadPath, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    die(`${payloadPath} is not valid JSON: ${e.message}`);
  }
  const { sql, slug } = buildSql(payload, args.reviewer);
  if (args.stdout) {
    process.stdout.write(sql);
    info('  (--stdout: nothing written)');
    return;
  }
  const outPath = args.out ? resolve(args.out) : nextCounterPath(slug);
  if (existsSync(outPath)) die(`${outPath} already exists — migrations are write-once; pick another --out`);
  writeFileSync(outPath, sql, { encoding: 'utf8' });
  info(`✓ written ${relative(REPO_ROOT, outPath)} (${Buffer.byteLength(sql, 'utf8')} bytes, utf-8)`);
  info('  Next: art-director -> generate.mjs -> upload -> emit-migration.mjs --with-cover -> ONE db push');
}

main();
