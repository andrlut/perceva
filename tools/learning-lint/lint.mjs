#!/usr/bin/env node
// learning-lint — deterministic validator for Learning material bodies.
//
// The app renderer (app/components/LearningBody.tsx) is intentionally lenient:
// it silently drops unknown fenced directives and any list-icon / compare line
// that doesn't match its regex. That leniency is how a whole recipe list can
// render as an empty box (the career-capital bug). This linter is STRICTER than
// the renderer on purpose — it fails on exactly the shapes the renderer would
// swallow, so content loss is caught before a migration ships.
//
// Usage:
//   node lint.mjs --all <release-dir>        # lint every <slug>/draft.json under it
//   node lint.mjs --draft <path/draft.json>  # lint one draft payload
//   node lint.mjs --body <path.md> --locale pt|en   # lint a raw markdown body
//   node lint.mjs --spec <path/media-spec.json>     # lint a media-spec
//
// Exit code 0 = no FAILs (WARNs allowed), 1 = at least one FAIL, 2 = bad input.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const GLYPHMAP_PATH = resolve(HERE, '../content-media/ionicons-glyphmap.json');

// ─── icon set ────────────────────────────────────────────────────────────────
let ICONS = new Set();
try {
  ICONS = new Set(Object.keys(JSON.parse(readFileSync(GLYPHMAP_PATH, 'utf8'))));
} catch (e) {
  console.error(`WARN: could not load glyphmap at ${GLYPHMAP_PATH}: ${e.message}`);
}

const FENCE_NAMES = new Set(['stat', 'quote', 'callout', 'compare', 'list-icon', 'progress', 'ex']);
const CALLOUT_KINDS = new Set(['warn', 'info', 'tip', 'love']);

const WORD_FAIL_LO = 800, WORD_FAIL_HI = 1500;
const WORD_WARN_LO = 950, WORD_WARN_HI = 1250;

// ─── core body linter ────────────────────────────────────────────────────────
function lintBody(body, ctx) {
  const problems = [];
  const fail = (msg, line) => problems.push({ sev: 'FAIL', msg, line });
  const warn = (msg, line) => problems.push({ sev: 'WARN', msg, line });

  if (typeof body !== 'string' || !body.trim()) {
    fail('body is empty or not a string');
    return problems;
  }

  // SQL dollar-quote safety — a body containing the quote tag breaks the migration.
  for (const tag of ['$body_pt$', '$body_en$', '$$']) {
    if (body.includes(tag)) fail(`body contains SQL dollar-quote tag "${tag}" — will break the migration`);
  }

  const lines = body.split(/\r?\n/);
  let h1 = 0, h2 = 0, cardCount = 0;
  let lastMeaningfulBlock = null;
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw;
    const ln = i + 1;
    if (!line.trim()) { i++; continue; }

    // single-line source directive
    if (line.startsWith(':::source')) {
      if (!/^:::source\[[^\]]*\](\([^)]*\))?\s*$/.test(line)) {
        fail('malformed :::source — must be :::source[label](url) on one line', ln);
      } else if (!/^:::source\[[^\]]+\]\(https?:\/\/[^)]+\)\s*$/.test(line)) {
        warn(':::source has empty label or non-http(s) url', ln);
      }
      lastMeaningfulBlock = 'source';
      i++; continue;
    }

    // fenced directive
    if (line.startsWith(':::') && line.trim() !== ':::') {
      const header = line.slice(3).trim();
      const name = (header.match(/^[a-zA-Z0-9-]+/) || [''])[0];
      if (!FENCE_NAMES.has(name)) {
        fail(`unknown directive ":::${name}" — renderer will DROP this whole block`, ln);
      } else {
        cardCount++;
      }
      // collect content until standalone :::
      const start = ln;
      const buf = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') { buf.push([i + 1, lines[i]]); i++; }
      const closed = i < lines.length;
      if (!closed) {
        fail(`unclosed ":::${name}" fence opened at line ${start} — consumes rest of body`, start);
      } else {
        i++; // skip closing :::
      }
      // interior checks
      if (name === 'list-icon') {
        let items = 0;
        for (const [bln, bl] of buf) {
          if (!bl.trim()) continue;
          const m = bl.match(/^\s*([a-zA-Z0-9-]+)\s*\|\s*(.+)$/);
          if (!m) {
            fail(`list-icon line not "icon | text" (renderer drops it): ${JSON.stringify(bl.trim()).slice(0, 60)}`, bln);
          } else {
            items++;
            if (ICONS.size && !ICONS.has(m[1])) {
              fail(`list-icon uses unknown Ionicon "${m[1]}"`, bln);
            }
          }
        }
        if (items === 0) fail('list-icon renders EMPTY — no valid "icon | text" lines', start);
      } else if (name === 'compare') {
        let sides = 0;
        for (const [bln, bl] of buf) {
          if (!bl.trim()) continue;
          if (!/^\s*(left|right)\s*\|\s*.+$/.test(bl)) {
            fail(`compare line not "left|…"/"right|…" (renderer drops it): ${JSON.stringify(bl.trim()).slice(0, 60)}`, bln);
          } else sides++;
        }
        if (sides === 0) fail('compare renders EMPTY — no valid left/right lines', start);
      } else if (name === 'callout') {
        const km = header.match(/kind=([a-zA-Z]+)/);
        if (km && !CALLOUT_KINDS.has(km[1])) warn(`callout kind="${km[1]}" unknown → renders as info`, start);
      } else if (name === 'stat') {
        if (!/^stat\[[^\]]+\]/.test(header)) warn('stat has no [value] — renders blank number', start);
      } else if (name === 'progress') {
        if (!/val=\d+/.test(header)) warn('progress missing val=N', start);
      }
      lastMeaningfulBlock = name;
      continue;
    }

    // headings
    if (/^#### /.test(line) || /^#####/.test(line)) {
      fail('#### or deeper heading — renderer has no h4, renders as literal broken text', ln);
      lastMeaningfulBlock = 'p'; i++; continue;
    }
    if (line.startsWith('### ')) { lastMeaningfulBlock = 'h3'; i++; continue; }
    if (line.startsWith('## ')) { h2++; lastMeaningfulBlock = 'h2'; i++; continue; }
    if (line.startsWith('# ')) { h1++; lastMeaningfulBlock = 'h1'; i++; continue; }

    // markdown shapes the renderer does NOT support → render as literal text
    if (/^\s*\d+\.\s/.test(line)) warn('numbered-list line renders as literal "1." text — use prose or - bullets', ln);
    if (/^\s*\|.*\|/.test(line)) fail('pipe-table row renders as literal text — tables unsupported', ln);
    if (/!\[[^\]]*\]\([^)]*\)/.test(line)) fail('markdown image renders as literal text — images unsupported in body', ln);
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) warn('horizontal rule renders as literal text', ln);

    // bullets / quotes / paragraph — consume like the parser does
    if (line.startsWith('- ')) { while (i < lines.length && lines[i].startsWith('- ')) i++; lastMeaningfulBlock = 'list'; continue; }
    if (line.startsWith('> ')) { while (i < lines.length && lines[i].startsWith('> ')) i++; lastMeaningfulBlock = 'quote'; continue; }
    // paragraph
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|- |> |:::)/.test(lines[i])) i++;
    lastMeaningfulBlock = 'p';
  }

  // structure
  if (h1 > 0) fail(`found ${h1} H1 (# ) heading(s) — body should use ## for the 3 ideas, no H1`);
  if (h2 !== 3) fail(`expected exactly 3 "## " sections, found ${h2}`);
  if (lastMeaningfulBlock !== 'source') fail('body must END with a :::source[…](url) attribution');
  const bodyCards = cardCount; // fenced directives (excl. single-line source)
  if (bodyCards >= 4) fail(`${bodyCards} visual cards in body — max 2 (prose-led)`);
  else if (bodyCards === 3) warn('3 visual cards — spec prefers ≤2 (prose-led)');

  // word count — WARN-only (editorial length is the reviewer's call, not a render-safety gate).
  // Only a near-empty body is a hard failure.
  const words = (body.match(/\S+/g) || []).length;
  if (words < 300) fail(`word count ${words} — body is far too short / likely broken`);
  else if (words < WORD_FAIL_LO || words > WORD_FAIL_HI) warn(`word count ${words} outside typical ${WORD_FAIL_LO}-${WORD_FAIL_HI}`);
  else if (words < WORD_WARN_LO || words > WORD_WARN_HI) warn(`word count ${words} outside preferred ${WORD_WARN_LO}-${WORD_WARN_HI}`);

  // academic-outline artifacts the drafter is told to fold into prose
  if (/\*\*(Claim|Evidência|Evidence|Contestado|Contested|Nuance)\*\*\s*:/.test(body)) {
    fail('academic outline label (**Claim**: / **Evidência**: …) leaked into prose');
  }

  return problems.map((p) => ({ ...p, h2, words, cards: bodyCards }));
}

// ─── draft payload linter ────────────────────────────────────────────────────
function lintDraft(draft, name) {
  const out = [];
  const push = (loc, probs) => probs.forEach((p) => out.push({ ...p, where: `${name}:${loc}` }));

  for (const loc of ['pt', 'en']) {
    const body = draft[`body_${loc}`];
    push(`body_${loc}`, lintBody(body, { name, loc }));
  }

  // bilingual parity
  const h2pt = (draft.body_pt || '').split(/\r?\n/).filter((l) => l.startsWith('## ')).length;
  const h2en = (draft.body_en || '').split(/\r?\n/).filter((l) => l.startsWith('## ')).length;
  if (h2pt !== h2en) out.push({ sev: 'WARN', msg: `PT has ${h2pt} sections, EN has ${h2en}`, where: `${name}:bilingual` });

  for (const f of ['takeaways', 'tracking']) {
    const pt = draft[`${f}_pt`], en = draft[`${f}_en`];
    if (f === 'takeaways') {
      if (!Array.isArray(pt) || !pt.length) out.push({ sev: 'FAIL', msg: 'takeaways_pt empty', where: `${name}:takeaways_pt` });
      if (!Array.isArray(en) || !en.length) out.push({ sev: 'FAIL', msg: 'takeaways_en empty', where: `${name}:takeaways_en` });
      if (Array.isArray(pt) && Array.isArray(en) && pt.length !== en.length)
        out.push({ sev: 'WARN', msg: `takeaways count PT ${pt.length} vs EN ${en.length}`, where: `${name}:takeaways` });
      if (Array.isArray(pt) && pt.length > 5) out.push({ sev: 'FAIL', msg: `takeaways_pt has ${pt.length} (max 5)`, where: `${name}:takeaways_pt` });
    } else {
      if (!pt || !String(pt).trim()) out.push({ sev: 'FAIL', msg: 'tracking_pt empty', where: `${name}:tracking_pt` });
      if (!en || !String(en).trim()) out.push({ sev: 'FAIL', msg: 'tracking_en empty', where: `${name}:tracking_en` });
    }
  }
  // required scalar fields
  for (const f of ['title_pt', 'title_en', 'summary_pt', 'summary_en', 'source_url']) {
    if (!draft[f] || !String(draft[f]).trim()) out.push({ sev: 'FAIL', msg: `${f} missing`, where: `${name}:${f}` });
  }
  return out;
}

// ─── media-spec linter (matches tools/content-media/media-spec.example.json) ───
function lintSpec(spec, name) {
  const out = [];
  if (!spec.dimension_id) out.push({ sev: 'FAIL', msg: 'dimension_id missing (generate.mjs requires it)', where: `${name}` });
  if (!spec.cover || !String(spec.cover.prompt || '').trim())
    out.push({ sev: 'FAIL', msg: 'cover.prompt missing', where: `${name}:cover` });
  const ig = spec.infographic || {};
  const bi = (o, f) => o && o[f] && String(o[f].pt || '').trim() && String(o[f].en || '').trim();
  if (!bi(ig, 'headline')) out.push({ sev: 'FAIL', msg: 'infographic.headline.pt/en missing (locale won\'t render)', where: `${name}:infographic` });
  if (!bi(ig, 'subhead')) out.push({ sev: 'WARN', msg: 'infographic.subhead.pt/en missing', where: `${name}:infographic` });
  if (!bi(ig, 'eyebrow')) out.push({ sev: 'WARN', msg: 'infographic.eyebrow.pt/en missing', where: `${name}:infographic` });
  const pts = ig.points || [];
  if (pts.length !== 3) out.push({ sev: 'FAIL', msg: `infographic has ${pts.length} points (need exactly 3)`, where: `${name}:infographic` });
  pts.forEach((p, idx) => {
    if (!p.icon || (ICONS.size && !ICONS.has(p.icon)))
      out.push({ sev: 'FAIL', msg: `point ${idx + 1} icon "${p.icon}" not a valid Ionicon`, where: `${name}:point${idx + 1}` });
    if (!bi(p, 'title')) out.push({ sev: 'WARN', msg: `point ${idx + 1} title.pt/en incomplete`, where: `${name}:point${idx + 1}` });
    if (!bi(p, 'body')) out.push({ sev: 'WARN', msg: `point ${idx + 1} body.pt/en incomplete`, where: `${name}:point${idx + 1}` });
  });
  if (ig.stat && ig.stat.icon && ICONS.size && !ICONS.has(ig.stat.icon))
    out.push({ sev: 'FAIL', msg: `stat icon "${ig.stat.icon}" not a valid Ionicon`, where: `${name}:stat` });
  if (!bi(ig, 'source')) out.push({ sev: 'WARN', msg: 'infographic.source.pt/en missing', where: `${name}:infographic` });
  return out;
}

// Teaser reels spec (learning-drops/reels-specs/<slug>.json) — formato
// "Explorar" aprovado 2026-08-11: 3 cards, manchete + lede, sem resposta.
const REEL_METAPHORS = new Set(['trio', 'ring', 'asymmetry', 'solo']);
function lintReels(spec, name) {
  const out = [];
  const reels = spec.reels || [];
  if (reels.length !== 3)
    out.push({ sev: 'FAIL', msg: `spec.reels tem ${reels.length} cards (precisa de exatamente 3)`, where: name });
  reels.forEach((r, idx) => {
    const w = `${name}:reel${idx + 1}`;
    if (!REEL_METAPHORS.has(r.metaphor))
      out.push({ sev: 'FAIL', msg: `metaphor "${r.metaphor}" inválida (trio|ring|asymmetry|solo)`, where: w });
    for (const loc of ['pt', 'en']) {
      const h = String(r.headline?.[loc] ?? '').trim();
      const l = String(r.lede?.[loc] ?? '').trim();
      if (!h) out.push({ sev: 'FAIL', msg: `headline.${loc} vazia`, where: w });
      else if (h.length > 48) out.push({ sev: 'FAIL', msg: `headline.${loc} com ${h.length} chars (máx 48)`, where: w });
      if (!l) out.push({ sev: 'FAIL', msg: `lede.${loc} vazio`, where: w });
      else if (l.length > 215) out.push({ sev: 'FAIL', msg: `lede.${loc} com ${l.length} chars (máx 215)`, where: w });
      else if (l.length < 120) out.push({ sev: 'WARN', msg: `lede.${loc} curto (${l.length} chars; alvo 140-215)`, where: w });
      if (h.includes('…') || l.includes('…'))
        out.push({ sev: 'FAIL', msg: `reticências "…" em ${loc} (parecem texto cortado)`, where: w });
    }
    for (const k of ['a', 'b', 'symbol']) {
      const ic = r.icons?.[k];
      if (ic && ic !== 'minus' && ICONS.size && !ICONS.has(ic))
        out.push({ sev: 'WARN', msg: `icons.${k} "${ic}" não é Ionicon válido (cai no ícone da dimensão)`, where: w });
    }
  });
  return out;
}

// ─── driver ────────────────────────────────────────────────────────────────
function report(all) {
  const fails = all.filter((p) => p.sev === 'FAIL');
  const warns = all.filter((p) => p.sev === 'WARN');
  for (const p of all) {
    const loc = p.line ? `:${p.line}` : '';
    console.log(`  ${p.sev === 'FAIL' ? '✗' : '⚠'} [${p.sev}] ${p.where || ''}${loc}  ${p.msg}`);
  }
  return { fails: fails.length, warns: warns.length };
}

const args = process.argv.slice(2);
function argVal(flag) { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; }

let exit = 0;
if (args.includes('--all')) {
  const dir = resolve(argVal('--all'));
  const slugs = readdirSync(dir).filter((d) => {
    const p = join(dir, d);
    return statSync(p).isDirectory() && existsSync(join(p, 'draft.json'));
  });
  console.log(`Linting ${slugs.length} drafts in ${dir}\n`);
  let tf = 0, tw = 0;
  for (const slug of slugs.sort()) {
    const draft = JSON.parse(readFileSync(join(dir, slug, 'draft.json'), 'utf8'));
    console.log(`── ${slug}`);
    const probs = lintDraft(draft, slug);
    if (!probs.length) console.log('  ✓ clean');
    const { fails, warns } = report(probs);
    tf += fails; tw += warns;
  }
  console.log(`\nTOTAL: ${tf} FAIL, ${tw} WARN across ${slugs.length} drafts`);
  exit = tf > 0 ? 1 : 0;
} else if (argVal('--draft')) {
  const path = resolve(argVal('--draft'));
  const draft = JSON.parse(readFileSync(path, 'utf8'));
  const probs = lintDraft(draft, path);
  const { fails } = report(probs.length ? probs : []);
  if (!probs.length) console.log('✓ clean');
  exit = fails > 0 ? 1 : 0;
} else if (argVal('--body')) {
  const path = resolve(argVal('--body'));
  const body = readFileSync(path, 'utf8');
  const probs = lintBody(body, { name: path, loc: argVal('--locale') || '?' });
  const { fails } = report(probs);
  if (!probs.length) console.log('✓ clean');
  exit = fails > 0 ? 1 : 0;
} else if (argVal('--spec')) {
  const path = resolve(argVal('--spec'));
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  const probs = lintSpec(spec, path);
  const { fails } = report(probs);
  if (!probs.length) console.log('✓ clean');
  exit = fails > 0 ? 1 : 0;
} else if (argVal('--reels')) {
  const path = resolve(argVal('--reels'));
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  const probs = lintReels(spec, path);
  const { fails } = report(probs);
  if (!probs.length) console.log('✓ clean');
  exit = fails > 0 ? 1 : 0;
} else if (argVal('--reels-all')) {
  const dir = resolve(argVal('--reels-all'));
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  console.log(`Linting ${files.length} reels specs in ${dir}\n`);
  let tf = 0, tw = 0;
  for (const f of files.sort()) {
    const spec = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const probs = lintReels(spec, f);
    if (probs.length) console.log(`── ${f}`);
    const { fails, warns } = report(probs);
    tf += fails; tw += warns;
  }
  console.log(`\nTOTAL: ${tf} FAIL, ${tw} WARN across ${files.length} reels specs`);
  exit = tf > 0 ? 1 : 0;
} else {
  console.error('usage: lint.mjs --all <dir> | --draft <file> | --body <file> [--locale pt|en] | --spec <file> | --reels <file> | --reels-all <dir>');
  exit = 2;
}
process.exit(exit);
