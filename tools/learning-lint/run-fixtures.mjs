#!/usr/bin/env node
// run-fixtures — self-test do lint.mjs contra fixtures/.
//
// Cada subpasta de fixtures/ é um modo do linter (MODES abaixo). Dentro dela,
// pass*.json precisa sair com exit 0 e fail-*.json com exit 1 E pelo menos uma
// linha [FAIL] — assim um JSON quebrado (exit 1 por exceção, sem [FAIL]) não
// passa por "falha esperada". Qualquer outro nome é ignorado com aviso.
//
// Usage:
//   node run-fixtures.mjs             # exit 0 = tudo bateu, 1 = alguma discrepância (ou nenhuma fixture)
//   node run-fixtures.mjs --verbose   # mostra a saída completa do linter de cada fixture

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LINT = join(HERE, 'lint.mjs');
const FIXTURES = join(HERE, 'fixtures');
// subpasta → flag do lint.mjs
const MODES = { ideas: '--ideas', reels: '--reels', spec: '--spec', draft: '--draft' };
const verbose = process.argv.includes('--verbose');

if (!existsSync(FIXTURES)) {
  console.error(`no fixtures dir at ${FIXTURES}`);
  process.exit(1);
}

let ok = 0, bad = 0, skipped = 0;
const dirs = readdirSync(FIXTURES).filter((d) => statSync(join(FIXTURES, d)).isDirectory()).sort();
for (const dir of dirs) {
  const flag = MODES[dir];
  if (!flag) { console.log(`── ${dir}: no linter mode mapped in run-fixtures.mjs, skipping`); continue; }
  const files = readdirSync(join(FIXTURES, dir)).filter((f) => f.endsWith('.json')).sort();
  console.log(`── ${dir} (${flag}) — ${files.length} fixtures`);
  for (const f of files) {
    const expected = f.startsWith('pass') ? 0 : f.startsWith('fail-') ? 1 : null;
    if (expected === null) { console.log(`  · ${f}  skipped (name must start with "pass" or "fail-")`); skipped++; continue; }
    const r = spawnSync(process.execPath, [LINT, flag, join(FIXTURES, dir, f)], { encoding: 'utf8' });
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    const failLines = out.split(/\r?\n/).filter((l) => l.includes('[FAIL]'));
    const warns = (out.match(/\[WARN\]/g) || []).length;
    const matched = r.status === expected && (expected === 0 ? failLines.length === 0 : failLines.length > 0);
    if (matched) {
      ok++;
      const detail = expected === 0
        ? `exit 0${warns ? ` (${warns} WARN)` : ''}`
        : `exit 1, ${failLines.length} FAIL${warns ? `, ${warns} WARN` : ''}`;
      console.log(`  ✓ ${f}  ${detail}`);
      // pra fixture de falha, mostra o motivo — é o que prova que ela falha pela regra certa
      if (expected === 1 && !verbose) for (const l of failLines) console.log(`      ${l.trim()}`);
    } else {
      bad++;
      console.log(`  ✗ ${f}  expected exit ${expected}, got ${r.status ?? 'null'} with ${failLines.length} FAIL`);
    }
    if (verbose || !matched) {
      for (const l of out.split(/\r?\n/)) if (l.trim()) console.log(`      ${l}`);
    }
  }
}

console.log(`\n${ok} matched, ${bad} mismatched, ${skipped} skipped`);
if (ok + bad === 0) { console.error('no fixtures ran — a green run with nothing checked is not green'); process.exit(1); }
process.exit(bad > 0 ? 1 : 0);
