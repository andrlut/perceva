// Assemble app/lib/icons/catalog.ts from tools/icons/curated.json (the agent-curated
// list) + the review patch layer below (labels, keywords, splits, adds, drops),
// then run a search self-check. Run from the repo root:
//   node tools/icons/build-catalog.mjs tools/icons/curated.json app/lib/icons/catalog.ts
// To add an icon: edit ADD / PATCH here (or curated.json), regenerate, commit both.
import fs from 'node:fs';

import { createRequire } from 'node:module';
import path from 'node:path';
// Glyph maps come from the installed @expo/vector-icons. Run from a checkout
// with node_modules (the root checkout), or point PERCEVA_NODE_MODULES at one.
// <…>/node_modules/@expo/vector-icons/package.json → three dirnames up is the
// node_modules that holds the package (also right under pnpm's .pnpm realpath).
const require = createRequire(import.meta.url);
const NM =
  process.env.PERCEVA_NODE_MODULES ??
  path.dirname(path.dirname(path.dirname(require.resolve('@expo/vector-icons/package.json'))));
const ION = JSON.parse(fs.readFileSync(`${NM}/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json`, 'utf8'));
const MDI = JSON.parse(fs.readFileSync(`${NM}/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json`, 'utf8'));
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const exists = (id) => (id.startsWith('mdi:') ? has(MDI, id.slice(4)) : has(ION, id));

const [,, inPath, outPath] = process.argv;
const raw = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const result = raw.result ?? raw;
const ORDER = ['health', 'food', 'sport', 'mind', 'work', 'tech', 'home', 'people', 'fun', 'outdoors', 'quit', 'time', 'symbols'];
const CHIP_ICON = {
  health: 'heart', food: 'restaurant', sport: 'barbell', mind: 'book', work: 'briefcase', tech: 'phone-portrait',
  home: 'home', people: 'people', fun: 'game-controller', outdoors: 'leaf', quit: 'ban', time: 'time', symbols: 'sparkles',
};
// Category words (both languages) folded into every entry's haystack, so the
// category NAME finds its icons ("esporte", "tech", "comida").
const CATEGORY_KW = {
  health: 'saúde saude health sono sleep bem-estar wellness',
  food: 'comida food alimentação alimentacao bebida drink',
  sport: 'esporte esportes sport sports exercício exercicio exercise treino workout',
  mind: 'mente mind estudo study aprender learn',
  work: 'trabalho work dinheiro money carreira career finanças financas finance',
  tech: 'tech tecnologia technology telas screens digital',
  home: 'casa home rotina routine tarefas domésticas chores',
  people: 'pessoas people afeto relações relacionamento relationships família family social',
  fun: 'lazer fun diversão diversao hobby cultura culture entretenimento entertainment',
  outdoors: 'natureza nature ar livre outdoors viagem travel transporte',
  quit: 'largar quit parar stop evitar avoid vício vicio vice hábito habit cut back',
  time: 'tempo time rotina planning organização organizacao planejamento agenda',
  symbols: 'símbolos simbolos symbols energia energy motivação motivation',
};

// ── Review patches ─────────────────────────────────────────────────────────
// [category, id] → new fields (label overrides / keyword additions).
const PATCH = [
  // drinking (rewards-as-penalty): "beber", "bebida", "drink", "drinking", "alcohol"
  ['*', 'beer', { kw: '+ beber bebida drink drinking alcohol' }],
  ['*', 'wine', { kw: '+ beber bebida drink drinking alcohol' }],
  ['*', 'mdi:glass-cocktail', { pt: 'drink', en: 'cocktail', kw: '+ beber bebida drink drinking alcohol álcool coquetel' }],
  ['*', 'mdi:bottle-wine', { kw: '+ beber bebida drink drinking alcohol álcool' }],
  ['*', 'mdi:smoking', { kw: '+ nicotine nicotina vape pod fumar smoke tabaco' }],
  // studying — the learn sub's default is `book`
  ['*', 'book', { kw: '+ estudar estudo study aprender learn curso course prova exam' }],
  ['*', 'library', { kw: '+ estudar estudo study curso course prova exam' }],
  ['*', 'school', { kw: '+ estudar estudo study curso course aula class prova exam' }],
  ['*', 'mdi:notebook', { kw: '+ estudar estudo lição lesson dever homework curso course prova exam' }],
  ['*', 'easel', { kw: '+ curso course aula estudar' }],
  // habits to cut
  ['*', 'mdi:candy', { kw: '+ chocolate' }],
  ['*', 'mdi:candy-off', { kw: '+ chocolate açúcar sugar' }],
  ['*', 'mdi:cannabis', { kw: '+ droga drogas drugs' }],
  ['*', 'mdi:slot-machine', { kw: '+ apostas aposta bets betting cassino casino' }],
  ['*', 'ban', { kw: '+ largar parar evitar zero quit stop avoid proibido' }],
  ['*', 'mdi:hamburger-off', { kw: '+ delivery ifood pedir junk' }],
  ['*', 'fast-food', { kw: '+ delivery ifood pedir' }],
  ['quit', 'mdi:pill-off', { pt: 'drogas', en: 'drugs', kw: 'droga remédio pills vício' }],
  ['quit', 'mdi:gesture-swipe-vertical', { id: 'logo-instagram', pt: 'redes sociais', en: 'social media', kw: 'rede social scroll rolagem rolar feed instagram tiktok youtube facebook whatsapp zap celular' }],
  // everyday words a pt-BR user types
  ['*', 'alarm', { kw: '+ alarme' }],
  ['*', 'call', { kw: '+ ligar telefonema' }],
  ['*', 'mdi:broom', { kw: '+ limpar limpeza clean cleaning' }],
  ['*', 'mdi:vacuum', { kw: '+ limpar limpeza clean cleaning' }],
  ['*', 'trending-up', { kw: '+ investir investimento invest poupar' }],
  ['*', 'mdi:piggy-bank', { kw: '+ investir investimento invest poupar economizar save' }],
  ['*', 'restaurant', { kw: '+ almoço jantar lunch dinner' }],
  ['*', 'mdi:human-male-female', { kw: '+ namorada namorado girlfriend boyfriend' }],
  ['*', 'pencil', { kw: '+ desenhar draw' }],
  ['*', 'mdi:meditation', { kw: '+ meditar meditate' }],
  ['*', 'laptop', { kw: '+ computador computer' }],
  ['*', 'desktop', { kw: '+ computador computer pc' }],
  ['*', 'mdi:hiking', { kw: '+ hike' }],
  // glyph semantics
  ['*', 'fitness', { pt: 'cardio', en: 'cardio', kw: 'treino exercício fitness workout coração heart' }],
  ['*', 'barbell', { kw: '+ treino exercício exercise workout' }],
  ['*', 'mdi:run', { kw: '+ treino exercício exercise workout' }],
  ['*', 'ribbon', { pt: 'prêmio', en: 'award', kw: 'roseta fita ribbon' }],
  ['*', 'mdi:flower-tulip', { pt: 'tulipa', en: 'tulip', kw: 'flor flores buquê bouquet' }],
];
// Same glyph, genuinely different meaning per category → a distinct glyph
// in the second category, so the label a cell announces is the label the
// section shows.
const SPLIT = [
  ['quit', 'mdi:bottle-soda', { id: 'mdi:bottle-soda-classic', pt: 'refrigerante', en: 'soda', kw: 'coca refri açúcar sugar' }],
  ['quit', 'dice', { id: 'mdi:poker-chip', pt: 'apostas', en: 'gambling', kw: 'aposta bets betting jogo de azar cassino casino' }],
  ['health', 'moon', { id: 'mdi:sleep', pt: 'sono', en: 'sleep', kw: 'dormir noite night' }],
  ['home', 'bulb', null], // dropped: 'lâmpada' — home already has a lamp
  ['time', 'mdi:target', { id: 'mdi:bullseye-arrow', pt: 'meta', en: 'goal', kw: 'alvo objetivo target' }],
  ['outdoors', 'fish', { id: 'mdi:hook', pt: 'pesca', en: 'fishing', kw: 'pescar peixe anzol' }],
  ['work', 'people', { id: 'mdi:account-group', pt: 'equipe', en: 'team', kw: 'time grupo group' }],
  // near-duplicate glyphs
  ['*', 'mdi:calculator-variant', null],
  ['*', 'mdi:format-list-checks', null],
  ['home', 'mdi:shower-head', null],
  ['*', 'stopwatch', null],
];
const ADD = {
  fun: [
    { id: 'balloon', pt: 'balão', en: 'balloon', kw: 'festa party aniversário birthday' },
    { id: 'logo-youtube', pt: 'youtube', en: 'youtube', kw: 'vídeo video canal' },
  ],
  home: [
    { id: 'shirt', pt: 'camiseta', en: 't-shirt', kw: 'roupa roupas clothes' },
    { id: 'construct', pt: 'ferramentas', en: 'tools', kw: 'construir build reforma consertar fix' },
  ],
  people: [{ id: 'logo-whatsapp', pt: 'whatsapp', en: 'whatsapp', kw: 'zap mensagem message' }],
  quit: [
    { id: 'mdi:food-off', pt: 'jejum', en: 'fasting', kw: 'sem comer beliscar snacking' },
    { id: 'mdi:food-takeout-box', pt: 'delivery', en: 'takeout', kw: 'ifood pedir comida' },
    { id: 'mdi:hand-back-left', pt: 'roer unha', en: 'nail biting', kw: 'unha unhas nails' },
  ],
  health: [{ id: 'mdi:content-cut', pt: 'cabelo', en: 'haircut', kw: 'barba barbeiro salão corte' }],
  mind: [
    { id: 'mdi:hands-pray', pt: 'oração', en: 'prayer', kw: 'rezar orar igreja gratidão pray' },
    { id: 'mdi:head-heart', pt: 'terapia', en: 'therapy', kw: 'psicólogo terapeuta saúde mental mental health' },
  ],
  outdoors: [{ id: 'mdi:motorbike', pt: 'moto', en: 'motorbike', kw: 'motocicleta motorcycle' }],
};

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const mergeKw = (base, add) => {
  if (!add) return base || undefined;
  const words = add.startsWith('+') ? `${base ?? ''} ${add.slice(1)}` : add;
  return clean(words).toLowerCase() || undefined;
};

const dropped = [];
const cats = [];
for (const cid of ORDER) {
  const c = result.categories.find((x) => x.id === cid);
  if (!c) { console.error('MISSING CATEGORY', cid); process.exit(1); }
  let entries = [];
  const seen = new Set();
  for (const e of c.entries) {
    const id = String(e.id).trim();
    if (!exists(id)) { dropped.push(`${cid}: ${id} (no glyph)`); continue; }
    if (seen.has(id)) { dropped.push(`${cid}: ${id} (dup in category)`); continue; }
    seen.add(id);
    entries.push({ id, pt: clean(e.pt).toLowerCase(), en: clean(e.en).toLowerCase(), kw: clean(e.kw).toLowerCase() || undefined });
  }
  // splits / drops
  for (const [scope, id, repl] of SPLIT) {
    if (scope !== '*' && scope !== cid) continue;
    const i = entries.findIndex((x) => x.id === id);
    if (i < 0) continue;
    if (repl === null) entries.splice(i, 1);
    else entries[i] = { ...repl, pt: repl.pt.toLowerCase(), en: repl.en.toLowerCase(), kw: clean(repl.kw).toLowerCase() || undefined };
  }
  // patches
  for (const [scope, id, p] of PATCH) {
    if (scope !== '*' && scope !== cid) continue;
    const i = entries.findIndex((x) => x.id === id);
    if (i < 0) continue;
    const cur = entries[i];
    entries[i] = {
      id: p.id ?? cur.id,
      pt: (p.pt ?? cur.pt).toLowerCase(),
      en: (p.en ?? cur.en).toLowerCase(),
      kw: mergeKw(cur.kw, p.kw),
    };
  }
  // additions
  for (const a of ADD[cid] ?? []) {
    if (!entries.some((x) => x.id === a.id)) entries.push({ ...a, kw: clean(a.kw).toLowerCase() || undefined });
  }
  for (const e of entries) if (!exists(e.id)) { console.error('PATCH glyph missing:', cid, e.id); process.exit(1); }
  cats.push({ id: cid, icon: CHIP_ICON[cid], kw: CATEGORY_KW[cid], entries });
}

// One label per id across categories (first occurrence wins; the meaning
// differs → SPLIT gave it another glyph above). Keywords are unioned.
const canon = new Map();
for (const c of cats) for (const e of c.entries) {
  const k = canon.get(e.id);
  if (!k) canon.set(e.id, { pt: e.pt, en: e.en, kw: new Set((e.kw ?? '').split(' ').filter(Boolean)) });
  else {
    if (k.pt !== e.pt || k.en !== e.en) {
      // fold the second label into keywords so the search still finds it
      for (const w of [e.pt, e.en]) w.split(' ').forEach((x) => k.kw.add(x));
    }
    (e.kw ?? '').split(' ').filter(Boolean).forEach((x) => k.kw.add(x));
  }
}
for (const c of cats) for (const e of c.entries) {
  const k = canon.get(e.id);
  e.pt = k.pt; e.en = k.en;
  const kw = [...k.kw].filter((w) => !k.pt.split(' ').includes(w) && !k.en.split(' ').includes(w)).join(' ');
  e.kw = kw || undefined;
}

const esc = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
let out = `import { normalizeSearch } from '@/lib/icons';

/**
 * The categorized, bilingual icon catalog behind IconPickerModal.
 * GENERATED on 2026-09-22 from a curated list + review patches; every id was
 * verified against the Ionicons / MaterialCommunityIcons glyph maps at
 * generation time. Bare ids are Ionicons, \`mdi:\` ids are
 * MaterialCommunityIcons (see lib/icons). Labels are what a person types to
 * find the icon, in both app languages; an id that lives in more than one
 * category carries the SAME label everywhere (a different meaning gets a
 * different glyph), so the cell announces what the section shows.
 */
export type IconCategoryId =
  | ${ORDER.map((c) => `'${c}'`).join('\n  | ')};

export interface IconEntry {
  id: string;
  /** Short pt-BR label (search + accessibility). */
  pt: string;
  /** Short en-US label. */
  en: string;
  /** Extra search words, both languages. */
  kw?: string;
}

export interface IconCategory {
  id: IconCategoryId;
  /** Chip glyph. */
  icon: string;
  /** Category words (both languages) every entry is searchable by. */
  kw: string;
  entries: IconEntry[];
}

export const ICON_CATEGORIES: IconCategory[] = [
`;
for (const c of cats) {
  out += `  {\n    id: '${c.id}',\n    icon: '${c.icon}',\n    kw: ${esc(c.kw)},\n    entries: [\n`;
  for (const e of c.entries) {
    out += `      { id: ${esc(e.id)}, pt: ${esc(e.pt)}, en: ${esc(e.en)}${e.kw ? `, kw: ${esc(e.kw)}` : ''} },\n`;
  }
  out += `    ],\n  },\n`;
}
out += `];

interface IndexedEntry extends IconEntry {
  category: IconCategoryId;
  /** Pre-normalized haystack: labels + keywords + category words + the glyph slug. */
  haystack: string;
}

const INDEX: IndexedEntry[] = ICON_CATEGORIES.flatMap((c) =>
  c.entries.map((e) => ({
    ...e,
    category: c.id,
    haystack: normalizeSearch(
      [e.pt, e.en, e.kw ?? '', c.kw, e.id.replace(/^mdi:/, '').replace(/-/g, ' ')].join(' '),
    ),
  })),
);

const BY_ID = new Map(INDEX.map((e) => [e.id, e]));

/** Human label for an id in the app language; a glyph slug when the id is
 *  not in the catalog (an old row, a Studio edit). */
export function iconLabel(id: string, locale: 'pt' | 'en'): string {
  const e = BY_ID.get(id);
  if (e) return locale === 'pt' ? e.pt : e.en;
  return id.replace(/^mdi:/, '').replace(/-/g, ' ');
}

/** Entries whose labels / keywords / category / slug contain the
 *  (normalized) query, label matches first. */
export function searchIcons(normalizedQuery: string, locale: 'pt' | 'en'): IconEntry[] {
  const q = normalizedQuery.trim();
  if (!q) return [];
  const starts: IconEntry[] = [];
  const contains: IconEntry[] = [];
  // An id can live in several categories; the search lists it once.
  const seen = new Set<string>();
  for (const e of INDEX) {
    if (seen.has(e.id)) continue;
    const label = normalizeSearch(locale === 'pt' ? e.pt : e.en);
    if (label.startsWith(q)) {
      starts.push(e);
      seen.add(e.id);
    } else if (e.haystack.includes(q)) {
      contains.push(e);
      seen.add(e.id);
    }
  }
  return [...starts, ...contains];
}
`;
fs.writeFileSync(outPath, out, 'utf8');
console.log(`wrote ${outPath}: ${cats.length} categories, ${cats.reduce((n, c) => n + c.entries.length, 0)} icons`);
for (const c of cats) console.log(`  ${c.id}: ${c.entries.length}`);
if (dropped.length) console.log('dropped:\n  ' + dropped.join('\n  '));

// ── Search self-check (same logic as the TS) ───────────────────────────────
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const index = cats.flatMap((c) => c.entries.map((e) => ({ ...e, haystack: norm([e.pt, e.en, e.kw ?? '', c.kw, e.id.replace(/^mdi:/, '').replace(/-/g, ' ')].join(' ')) })));
const search = (q, locale) => {
  q = norm(q); const seen = new Set(); const starts = []; const contains = [];
  for (const e of index) { if (seen.has(e.id)) continue; const l = norm(locale === 'pt' ? e.pt : e.en); if (l.startsWith(q)) { starts.push(e); seen.add(e.id); } else if (e.haystack.includes(q)) { contains.push(e); seen.add(e.id); } }
  return [...starts, ...contains];
};
const QUERIES = [['pt','cigarro'],['pt','celular'],['pt','chip'],['pt','computador'],['pt','equilíbrio'],['pt','tech'],['pt','esporte'],['pt','comida'],['pt','beber'],['pt','bebida'],['pt','estudar'],['pt','curso'],['pt','redes sociais'],['pt','apostas'],['pt','vape'],['pt','limpar'],['pt','investir'],['pt','treino'],['pt','lazer'],['pt','largar'],['en','drinking'],['en','study'],['en','sports'],['en','tech'],['en','computer'],['en','balance']];
console.log('--- search self-check (first 4) ---');
for (const [loc, q] of QUERIES) {
  const r = search(q, loc);
  console.log(`${loc} "${q}" → ${r.length}: ${r.slice(0, 4).map((e) => `${e.id}(${loc === 'pt' ? e.pt : e.en})`).join(', ')}${r.length === 0 ? '  <<< EMPTY' : ''}`);
}
