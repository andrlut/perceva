// Molde genérico do vídeo de ideia — do roteiro revisado ao MP4 no bucket.
//
//   node scripts/molde.mjs lint    --slug <slug>                      só o lint do roteiro (sem gastar nada)
//   node scripts/molde.mjs build   --slug <slug> [--idea <id>] [--lang pt|en|both] [--silent]
//   node scripts/molde.mjs voice   --slug <slug> [--idea <id>] [--lang …] [--only a,b]   TTS + QA (--fix) por fala
//   node scripts/molde.mjs stills  --slug <slug> [--idea <id>] [--lang …] [--at 0.1,0.5,1] [--scale 0.4]
//                                  um quadro por cena (ou vários: frações da fala) + folha de contato
//   node scripts/molde.mjs render  --slug <slug> [--idea <id>] [--lang …] [--rev N]      MP4 + versão do app + pôster
//   node scripts/molde.mjs upload  --slug <slug> [--idea <id>] [--lang …] [--rev N]      sobe pro bucket learning-media
//   node scripts/molde.mjs videos  --slug <slug> --out <file.json>    junta os video.json no formato do emit-migration --videos
//   node scripts/molde.mjs all     --slug <slug> …                    build → voice → stills → render
//
// Entrada: learning-drops/video-specs/<slug>.json (roteiro bilíngue, versionado)
//        + learning-drops/ideas-specs/<slug>.json (título e verso VERBATIM — o roteiro nunca reescreve o card)
//        + learning-drops/inbox/<slug>/manifest.json (imagem 4:5 da ideia e dimensão; cai pro checkout principal)
// Saída:  public/molde/<slug>.<idea>.<lang>/  (spec resolvido + voz)   — gitignored
//         out/molde/<slug>.<idea>.<lang>/     (stills, sheet.png, video.mp4, pub/, video.json)
//
// Correção cirúrgica: mude UMA fala no roteiro → `build` → `voice --only <id>` → `render --rev N+1` → `upload`.
// As outras falas ficam com a mesma tomada de voz; o bucket nunca sobrescreve (cada revisão é um arquivo novo).
//
// Prévia SEM voz (testar cena, câmera, ambiente sem gastar TTS): `build --silent` estima o tempo de cada
// fala pelo texto (timings.silent.json — o timings.json da voz gravada fica intocado) e marca o spec como
// silencioso; `stills` e `render` funcionam igual (o render vira out/molde/<key>/preview.mp4, sem pub/
// nem video.json, então não tem como subir prévia pro bucket). Rode `build` sem --silent pra voltar.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { markVoiced, pendingLines } from './voiced.mjs';
import { measurePauses as measurePausesIn } from './pauses.mjs';

const root = path.resolve(import.meta.dirname, '..');
const repo = path.resolve(root, '..', '..');
const argv = process.argv.slice(2);
const step = argv[0];
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i > 0 ? argv[i + 1] : d;
};
const slug = arg('slug');
const onlyIdea = arg('idea');
const langArg = arg('lang', 'both');
const rev = Number(arg('rev', '1'));
// --identity <id>: comparação de identidade (src/identidade) — stills e render saem à parte
// (out/molde/<key>/identidade/<id>.mp4, sheet-<id>.png), sem pub/ nem video.json
const identity = arg('identity');
// --sfx: com os efeitos sonoros sintetizados (scripts/sfx.mjs) por baixo da voz
const sfxOn = argv.includes('--sfx');
const idProps = { ...(identity ? { identity } : {}), ...(sfxOn ? { sfx: true } : {}) };
const silent = argv.includes('--silent');
// --roteiro <arquivo> + --tag <nome>: piloto lado a lado (requinte, fase 2). Lê outro roteiro e grava
// em chaves à parte (<slug>.<ideia>-<tag>.<lang>), então a voz e o vídeo de verdade ficam intocados;
// piloto nunca sobe (upload/videos recusam) e sai sem pub/ nem video.json, como a prévia.
const roteiro = arg('roteiro');
const tag = arg('tag');
if (roteiro && !tag) {
  console.error('✗ --roteiro pede --tag (o piloto grava em chaves à parte, nunca por cima do vídeo de verdade)');
  process.exit(1);
}
const LANGS = langArg === 'both' ? ['pt', 'en'] : [langArg];
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/molde/catalog.json'), 'utf8'));
const ions = JSON.parse(fs.readFileSync(path.join(root, 'src/molde/ionicons-full.json'), 'utf8'));
const BUCKET_URL = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media';

const die = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
if (!step || !slug) die('uso: node scripts/molde.mjs <lint|build|voice|stills|render|upload|videos|all> --slug <slug> [--idea <id>] [--lang pt|en|both]');

/** Checkout principal (o inbox é gitignored e só existe lá quando rodamos de um worktree). */
const mainRoot = () => {
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repo }).toString().trim();
    return path.dirname(common);
  } catch {
    return repo;
  }
};
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const firstExisting = (...files) => files.find((f) => f && fs.existsSync(f));

const videoSpecFile = roteiro ? path.resolve(roteiro) : path.join(repo, 'learning-drops/video-specs', `${slug}.json`);
const ideasSpecFile = path.join(repo, 'learning-drops/ideas-specs', `${slug}.json`);
const inboxDir = firstExisting(path.join(repo, 'learning-drops/inbox', slug), path.join(mainRoot(), 'learning-drops/inbox', slug));

const key = (idea, lang) => `${slug}.${idea}${tag ? `-${tag}` : ''}.${lang}`;
const pubDir = (k) => path.join(root, 'public', 'molde', k);
const outDir = (k) => path.join(root, 'out', 'molde', k);

// ------------------------------------------------------------------ lint
const plain = (s) => s.replace(/\*/g, '');
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Nada de dado de pesquisa no vídeo (feedback 2026-11-04): fica no texto e no áudio.
const BANNED = {
  pt: /\b(estudos?|pesquisas?|pesquisador\w*|cientistas?|amostras?|participantes?|voluntari\w*|universidades?|revistas?|experimentos?|estatistic\w*|dados|comprovad\w*|por cento|porcento|vezes mais|et al)\b/,
  en: /\b(stud(y|ies)|research\w*|scientists?|samples?|participants?|volunteers?|universit(y|ies)|journals?|experiments?|statistic\w*|data|proven|percent|times more|et al)\b/,
};
const CUE_KEYS = ['cue', 'turn', 'from', 'until', 'at', 'win', 'glow', 'out', 'arrives', 'leaves', 'semana'];
const LIMITS = { caption: 150, kicker: 24, label: 22, chip: 30, pill: 22, bloco: 16, lines: [4, 8], seconds: 58, bridgeLines: [2, 4], bridgeSeconds: 24 };

/** câmera, passagem e ambiente: valem pra qualquer cena (o ambiente só nas que têm pessoa de pé) */
function lintStage(where, l, i, errors, warns) {
  const p = l.props ?? {};
  const oneOf = (v, list, what) => {
    if (v !== undefined && !list.includes(v)) errors.push(where(l.id, `${what} "${v}" não existe (${list.join(', ')})`));
  };
  if (p.camera !== undefined) {
    if (!p.camera || typeof p.camera !== 'object' || !p.camera.move) errors.push(where(l.id, 'camera precisa de { move }'));
    else {
      oneOf(p.camera.move, catalog.camera.moves, 'camera.move');
      oneOf(p.camera.focus, catalog.camera.focus, 'camera.focus');
      oneOf(p.camera.forca, catalog.camera.forca, 'camera.forca');
      if (p.camera.focus === 'mapa' && l.scene !== 'mapa') errors.push(where(l.id, 'camera.focus "mapa" só existe na cena mapa'));
      for (const k of Object.keys(p.camera)) if (!['move', 'focus', 'cue', 'forca'].includes(k)) errors.push(where(l.id, `camera.${k} não existe (move, focus, cue, forca)`));
    }
  }
  oneOf(p.transicao, catalog.transicao, 'transicao');
  if (p.transicao && i === 0) warns.push(where(l.id, 'transicao na 1ª cena não tem efeito (é a passagem PRA esta cena)'));
  if (p.ambiente !== undefined) {
    oneOf(p.ambiente, catalog.ambientes, 'ambiente');
    if (!catalog.ambienteScenes.includes(l.scene))
      errors.push(where(l.id, `cena "${l.scene}" não aceita ambiente (só ${catalog.ambienteScenes.join(', ')}${l.scene === 'comparar' ? '; no comparar é left.ambiente / right.ambiente' : ''})`));
    // só o pensa senta a pessoa na plateia; nas outras cenas ela fica de pé na frente da turma
    if (p.ambiente === 'treinamento' && l.scene !== 'pensa')
      warns.push(where(l.id, `treinamento na cena "${l.scene}": a pessoa fica na frente da turma, virada pra câmera, e lê como quem apresenta (pra "assistir à aula", use a cena pensa: ela senta na plateia)`));
  }
  oneOf(p.gente, catalog.gente, 'gente');
  oneOf(p.hora, catalog.hora, 'hora');
  if ((p.gente || p.hora) && !p.ambiente) warns.push(where(l.id, 'gente/hora sem ambiente não fazem nada'));
  for (const side of ['left', 'right']) {
    oneOf(p[side]?.ambiente, catalog.ambientes, `${side}.ambiente`);
    oneOf(p[side]?.hora, catalog.hora, `${side}.hora`);
    if (p[side]?.ambiente && l.scene !== 'comparar') errors.push(where(l.id, `${side}.ambiente só existe no comparar`));
  }
  // quantas peças cabem: o resto seria cortado em silêncio
  const max = l.scene === 'cena' && p.ambiente ? catalog.objectsMax.cenaAmbiente : catalog.objectsMax[l.scene];
  const n = (p.objects ?? []).length;
  if (n && max === undefined) errors.push(where(l.id, `cena "${l.scene}" não desenha objects`));
  else if (n > max) errors.push(where(l.id, `${n} objects; a cena ${l.scene}${p.ambiente ? ' com ambiente' : ''} mostra no máximo ${max}${l.scene === 'cena' && !p.ambiente ? ' (com ambiente: até 6)' : ''}`));
}

/**
 * cena caderno (fase 2, "demonstrar a ideia"): a página onde o exemplo se escreve — cada tarefa com
 * NOME (`label`), a barra do tempo (`size`) e a marca de energia (`feel`). Os mesmos blocos do mapa,
 * então o caderno e o mapa contam o mesmo dia. Nome é obrigatório aqui (é o que a cena mostra).
 */
function lintCaderno(where, l, errors) {
  const p = l.props ?? {};
  const b = p.blocks;
  const [lo, hi] = catalog.caderno.blocks;
  if (!Array.isArray(b) || b.length < lo || b.length > hi) return errors.push(where(l.id, `caderno precisa de ${lo} a ${hi} blocks`));
  for (const [i, x] of b.entries()) {
    const t = `block ${i + 1}`;
    if (!x.label) errors.push(where(l.id, `${t}: o caderno escreve o nome da tarefa — falta label`));
    if (!catalog.feel.includes(x.feel)) errors.push(where(l.id, `${t}: feel "${x.feel}" não existe (${catalog.feel.join(', ')})`));
    if (x.size !== undefined && !(Number.isInteger(x.size) && x.size >= 1 && x.size <= 3)) errors.push(where(l.id, `${t}: size ${x.size} (inteiro de 1 a 3)`));
    if (x.then) errors.push(where(l.id, `${t}: "then" é do mapa (no caderno a pessoa só anota)`));
    if (x.icon !== undefined && !(x.icon in ions)) errors.push(where(l.id, `${t}: ícone "${x.icon}" não existe no Ionicons`));
  }
  if (p.heads !== undefined && (!Array.isArray(p.heads) || p.heads.length !== 3)) errors.push(where(l.id, 'heads: os três títulos das colunas (tarefa, tempo, energia)'));
}

/** cena mapa: blocos do dia (ícone = o que é, feel = como pesa, size = quanto do dia) */
function lintMapa(where, l, errors) {
  const p = l.props ?? {};
  const b = p.blocks;
  const [lo, hi] = catalog.mapa.blocks;
  if (!Array.isArray(b) || b.length < lo || b.length > hi) return errors.push(where(l.id, `mapa precisa de ${lo} a ${hi} blocks`));
  const okSize = (v) => v === undefined || (Number.isInteger(v) && v >= catalog.mapa.size[0] && v <= catalog.mapa.size[1]);
  let before = 0;
  let after = 0;
  let changes = 0;
  for (const [i, x] of b.entries()) {
    const tag = `block ${i + 1}`;
    if (!x.icon || !(x.icon in ions)) errors.push(where(l.id, `${tag}: ícone "${x.icon}" não existe no Ionicons`));
    if (!catalog.feel.includes(x.feel)) errors.push(where(l.id, `${tag}: feel "${x.feel}" não existe (${catalog.feel.join(', ')})`));
    if (!okSize(x.size)) errors.push(where(l.id, `${tag}: size ${x.size} (inteiro de ${catalog.mapa.size.join(' a ')})`));
    before += x.size ?? 1;
    if (x.then) {
      changes++;
      if (x.then.feel !== undefined && !catalog.feel.includes(x.then.feel)) errors.push(where(l.id, `${tag}: then.feel "${x.then.feel}" não existe`));
      if (!okSize(x.then.size)) errors.push(where(l.id, `${tag}: then.size ${x.then.size} (inteiro de ${catalog.mapa.size.join(' a ')})`));
      if (x.then.icon !== undefined && !(x.then.icon in ions)) errors.push(where(l.id, `${tag}: then.icon "${x.then.icon}" não existe no Ionicons`));
      for (const k of Object.keys(x.then)) if (!['feel', 'size', 'icon'].includes(k)) errors.push(where(l.id, `${tag}: then.${k} não existe (feel, size, icon)`));
    }
    after += x.then?.size ?? x.size ?? 1;
  }
  const cap = catalog.mapa.sizeSum;
  if (before > cap || after > cap) errors.push(where(l.id, `o dia soma ${Math.max(before, after)} de tamanho (teto ${cap}): blocos ficariam pequenos demais`));
  if (changes && !p.turn) errors.push(where(l.id, 'blocos com "then" precisam da deixa "turn" (a segunda batida)'));
  if (p.turn && !changes) errors.push(where(l.id, '"turn" no mapa sem nenhum bloco com "then": nada muda na virada'));
  if (p.side !== undefined && !['left', 'right'].includes(p.side)) errors.push(where(l.id, `side "${p.side}" (left ou right)`));
}

/** Troca todo {pt, en} pelo idioma; o resto passa igual. */
const resolve = (v, lang) => {
  if (Array.isArray(v)) return v.map((x) => resolve(x, lang));
  if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    if (ks.length && ks.every((k) => k === 'pt' || k === 'en')) return v[lang];
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x, lang)]));
  }
  return v;
};

/** Uma fala no idioma: as chaves `pt`/`en` da fala (caption, say) sobem; os {pt,en} das props se resolvem. */
const resolveLine = (raw, lang) => {
  const { pt, en, ...rest } = raw;
  return { ...resolve(rest, lang), ...(raw[lang] ?? {}) };
};

function lintIdea(ideaId, spec, card, lang, errors, warns) {
  const where = (l, m) => `${ideaId}/${lang}/${l}: ${m}`;
  const lines = spec.lines;
  if (!Array.isArray(lines) || !lines.length) return errors.push(`${ideaId}: sem lines`);
  // abertura de porta (bridge "tour"): a história do porquê que emenda no tutorial da tela, sem verso
  const bridge = spec.bridge === 'tour';
  const range = bridge ? LIMITS.bridgeLines : LIMITS.lines;
  if (spec.bridge !== undefined && !bridge) errors.push(`${ideaId}: bridge "${spec.bridge}" (só "tour")`);
  if (lines.length < range[0] || lines.length > range[1]) errors.push(`${ideaId}: ${lines.length} falas (faixa ${range.join('–')})`);
  const last = lines[lines.length - 1];
  if (bridge && lines.some((l) => l.scene === 'verso')) errors.push(`${ideaId}: abertura de porta não tem verso (ela emenda na tela: tools/video/TOUR.md)`);
  if (!bridge && last.scene !== 'verso') errors.push(`${ideaId}: a última cena tem que ser "verso" (a voz lê o card)`);
  // passagens (requinte fase 1, src/molde/transicao.tsx `passagens`): o padrão é o mergulho, o
  // hexágono só abre o verso, e só UMA passagem que anda (chicote/desliza/zoom) vale por vídeo
  let socoAt = null;
  for (const [i, raw] of lines.entries()) {
    const t = raw.props?.transicao;
    if (!t || i === 0) continue;
    if (t === 'hexa' && raw.scene !== 'verso') warns.push(where(raw.id, 'transicao "hexa" só abre o verso (é a assinatura) — aqui vira mergulho'));
    if (['chicote', 'desliza', 'zoom'].includes(t)) {
      if (socoAt) warns.push(where(raw.id, `transicao "${t}": o vídeo já soca em ${socoAt} (uma passagem que anda por vídeo) — aqui vira mergulho`));
      else socoAt = raw.id;
    }
  }
  const ids = new Set();
  let chars = 0;
  let extra = 0;
  for (const [i, raw] of lines.entries()) {
    const l = resolveLine(raw, lang);
    if (!l.id || ids.has(l.id)) errors.push(where(l.id, 'id vazio ou repetido'));
    ids.add(l.id);
    if (!catalog.scenes.includes(l.scene)) errors.push(where(l.id, `cena "${l.scene}" não existe (${catalog.scenes.join(', ')})`));
    lintStage(where, l, i, errors, warns);
    if (l.scene === 'mapa') lintMapa(where, l, errors);
    if (l.scene === 'caderno') lintCaderno(where, l, errors);
    if (l.scene === 'verso') {
      // a voz do verso é o card: deixa de câmera aqui não teria o que casar
      if (l.props?.camera?.cue) errors.push(where(l.id, 'camera.cue no verso (a fala é o card; use a câmera sem deixa)'));
      if (l.id !== last.id) errors.push(where(l.id, 'verso só pode ser a última cena'));
      chars += card.claim[lang].length;
      extra += (l.pre ?? 0.8) + (l.hold ?? 1.4);
      continue;
    }
    const cap = l.caption;
    if (typeof cap !== 'string' || !cap.trim()) {
      errors.push(where(l.id, 'sem caption'));
      continue;
    }
    const spoken = plain(l.say ?? cap);
    chars += spoken.length;
    extra += (l.pre ?? 0) + (l.hold ?? 0);
    if (plain(cap).length > LIMITS.caption) errors.push(where(l.id, `legenda com ${plain(cap).length} caracteres (teto ${LIMITS.caption})`));
    const stars = (cap.match(/\*/g) ?? []).length;
    if (stars % 2 || stars > 2) errors.push(where(l.id, 'destaque *…*: no máximo um, e fechado'));
    const texts = [cap, l.say, l.props?.kicker, l.props?.left?.label, l.props?.right?.label, l.props?.pill?.text,
      ...(l.props?.chips ?? []).map((c) => c.text), ...(l.props?.items ?? []).map((c) => c.text),
      ...(l.props?.blocks ?? []).map((b) => b.label), ...(l.props?.heads ?? [])].filter(Boolean);
    for (const b of l.props?.blocks ?? []) if (b.label && b.label.length > LIMITS.bloco) errors.push(where(l.id, `nome de tarefa longo: "${b.label}" (${b.label.length} > ${LIMITS.bloco})`));
    for (const t of texts) {
      if (/\d|%/.test(t)) errors.push(where(l.id, `número na tela/voz: "${t}" (dado fica no texto e no áudio, não no vídeo)`));
      const m = BANNED[lang].exec(fold(t));
      if (m) errors.push(where(l.id, `"${m[0]}" em "${t}" — vídeo conta a ideia como história, sem estudo nem dado`));
    }
    const p = l.props ?? {};
    if (p.kicker && p.kicker.length > LIMITS.kicker) errors.push(where(l.id, `kicker longo (${p.kicker.length} > ${LIMITS.kicker})`));
    for (const side of ['left', 'right']) if (p[side]?.label?.length > LIMITS.label) errors.push(where(l.id, `rótulo ${side} longo`));
    for (const c of [...(p.chips ?? []), ...(p.items ?? [])]) {
      if (c.text.length > LIMITS.chip) errors.push(where(l.id, `chip longo: "${c.text}"`));
      if (!(c.icon in ions)) errors.push(where(l.id, `ícone "${c.icon}" não existe no Ionicons`));
    }
    if (l.scene === 'comparar' && !(p.left?.label && p.right?.label)) errors.push(where(l.id, 'comparar precisa de left.label e right.label'));
    if (l.scene === 'lista' && !(p.items?.length >= 1 && p.items.length <= 3)) errors.push(where(l.id, 'lista precisa de 1 a 3 items'));
    // peças
    const pieces = [p.gives, p.holding, p.thought, p.left?.object, p.right?.object, p.pill?.p, ...(p.objects ?? []).map((o) => o.p)].filter(Boolean);
    for (const name of pieces) {
      const ok = catalog.pieces.includes(name) || (name.startsWith('ion:') && name.slice(4) in ions);
      if (!ok) errors.push(where(l.id, `peça "${name}" não existe (elenco: ${catalog.pieces.join(', ')}; ou ion:<nome>)`));
    }
    // deixas: toda frase de deixa tem que estar na fala (senão a peça entra na hora errada — ou o render quebra)
    const hay = [plain(cap), spoken];
    const cues = [];
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        if (CUE_KEYS.includes(k) && typeof v === 'string') cues.push(v);
        else if (typeof v === 'object') walk(v);
      }
    };
    walk(p);
    for (const c of cues) if (!hay.some((h) => h.includes(c))) errors.push(where(l.id, `deixa "${c}" não está na fala "${plain(cap)}"`));
  }
  const est = chars / (lang === 'en' ? 15.5 : 14.5) + extra + lines.length * 0.6;
  const cap = bridge ? LIMITS.bridgeSeconds : LIMITS.seconds;
  if (est > cap) errors.push(`${ideaId}/${lang}: ~${est.toFixed(0)} s estimados (teto ${cap} s${bridge ? ' na abertura: o tutorial vem depois' : ''}) — corte falas`);
  else if (est > cap - (bridge ? 3 : 6)) warns.push(`${ideaId}/${lang}: ~${est.toFixed(0)} s estimados, perto do teto`);
}

function load() {
  if (!fs.existsSync(videoSpecFile)) die(`sem roteiro: ${path.relative(repo, videoSpecFile)}`);
  const vs = readJson(videoSpecFile);
  // Vídeo que não é de ideia (ex.: as portas das abas, slug "doors") traz o card no próprio
  // roteiro: ideas.<id>.card = { title, claim, file? } em {pt,en}. Ideia publicada nunca faz isso.
  const inline = Object.values(vs.ideas ?? {}).every((i) => i.card);
  if (!inline && !fs.existsSync(ideasSpecFile)) die(`sem ideas-spec: ${path.relative(repo, ideasSpecFile)}`);
  const is = inline ? { ideas: Object.entries(vs.ideas).map(([id, i]) => ({ id, ...i.card })) } : readJson(ideasSpecFile);
  const manifest = inboxDir && fs.existsSync(path.join(inboxDir, 'manifest.json')) ? readJson(path.join(inboxDir, 'manifest.json')) : null;
  const ideaIds = Object.keys(vs.ideas ?? {}).filter((id) => !onlyIdea || id === onlyIdea);
  if (!ideaIds.length) die(`nenhuma ideia ${onlyIdea ? `"${onlyIdea}" ` : ''}no roteiro`);
  const errors = [];
  const warns = [];
  const cards = {};
  for (const id of ideaIds) {
    const card = is.ideas.find((i) => i.id === id);
    if (!card) {
      errors.push(`${id}: não existe no ideas-spec (o roteiro só conta ideia publicada)`);
      continue;
    }
    cards[id] = card;
    for (const lang of LANGS) lintIdea(id, vs.ideas[id], card, lang, errors, warns);
  }
  for (const w of warns) console.warn(`! ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    die(`${errors.length} erro(s) no roteiro ${path.relative(repo, videoSpecFile)}`);
  }
  return { vs, is, manifest, ideaIds, cards };
}

// ------------------------------------------------------------------ build
const DIM_LABEL = {
  pt: { health: 'Saúde', body: 'Corpo', mind: 'Mente', wealth: 'Prosperidade', bonds: 'Vínculos', craft: 'Ofício' },
  en: { health: 'Health', body: 'Body', mind: 'Mind', wealth: 'Wealth', bonds: 'Bonds', craft: 'Craft' },
};

async function cardImage(ctx, ideaId, dest) {
  const own = ctx.cards[ideaId]?.image;
  if (own) {
    fs.copyFileSync(path.join(repo, own), dest);
    return true;
  }
  const asset = ctx.manifest?.assets?.find((a) => a.role === 'idea' && a.idea_id === ideaId);
  if (!asset) return false;
  const local = inboxDir && path.join(inboxDir, asset.localPath);
  if (local && fs.existsSync(local)) {
    fs.copyFileSync(local, dest);
    return true;
  }
  const res = await fetch(`${BUCKET_URL}/${asset.bucketPath}`);
  if (!res.ok) return false;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function build(ctx) {
  for (const id of ctx.ideaIds) {
    const card = ctx.cards[id];
    const src = ctx.vs.ideas[id];
    const dimension = src.dimension ?? ctx.vs.dimension ?? ctx.manifest?.dimension_id;
    if (!dimension) die(`${id}: sem dimensão (ponha "dimension" no roteiro ou gere o manifest)`);
    for (const lang of LANGS) {
      const k = key(id, lang);
      const dir = pubDir(k);
      fs.mkdirSync(dir, { recursive: true });
      const hasImg = await cardImage(ctx, id, path.join(dir, 'card.webp'));
      if (!hasImg && src.bridge !== 'tour') console.warn(`! ${k}: sem imagem 4:5 da ideia — o card do verso sai sem foto`);
      const lines = src.lines.map((raw, i) => {
        const l = resolveLine(raw, lang);
        const out = { id: l.id, scene: l.scene, caption: l.caption, ...(l.say ? { say: l.say } : {}), ...(l.pre ? { pre: l.pre } : {}), ...(l.hold ? { hold: l.hold } : {}), props: l.props ?? {} };
        if (i === 0 && !out.props.kicker) out.props.kicker = DIM_LABEL[lang][dimension];
        if (l.scene === 'verso') Object.assign(out, { caption: card.claim[lang], pre: l.pre ?? 0.8, hold: l.hold ?? 1.4 });
        return out;
      });
      const spec = {
        key: k,
        slug,
        idea: id,
        lang,
        dimension,
        dimensionLabel: DIM_LABEL[lang][dimension],
        title: card.title[lang],
        claim: card.claim[lang],
        image: hasImg ? `molde/${k}/card.webp` : null,
        style: src.style?.[lang],
        ...(silent ? { silent: true } : {}),
        // fase 3 (por ideia, opcionais): a régua do molde e a protagonista do vídeo — sem eles, o de sempre
        ...(src.fase != null ? { fase: src.fase } : {}),
        ...(src.protagonista ? { protagonista: src.protagonista } : {}),
        lines,
      };
      // a voz de uma fala que não mudou continua válida; fala que mudou é regravada no `voice`
      // (a régua é o texto que a voz leu e passou no QA — voiced.json —, não o build anterior)
      const prev = fs.existsSync(path.join(dir, 'spec.json')) ? readJson(path.join(dir, 'spec.json')) : null;
      const changed = pendingLines(dir, lines, prev);
      fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
      fs.writeFileSync(path.join(dir, 'changed.json'), JSON.stringify(changed.map((l) => l.id)));
      if (silent) {
        // prévia: o tempo de cada fala estimado pelo texto (pausas pesam), num arquivo à parte
        const est = lines.map((l) => {
          const text = plain(l.say ?? l.caption);
          const stops = (text.match(/[.!?:](\s|$)/g) ?? []).length;
          const commas = (text.match(/,/g) ?? []).length;
          return { id: l.id, seconds: +(text.length / (lang === 'en' ? 15.5 : 14.5) + stops * 0.35 + commas * 0.15 + 0.3).toFixed(3) };
        });
        fs.writeFileSync(path.join(dir, 'timings.silent.json'), JSON.stringify(est, null, 2));
        const secs = est.reduce((a, t) => a + t.seconds, 0);
        console.log(`✓ ${k}: ${lines.length} cenas · PRÉVIA SEM VOZ (~${secs.toFixed(0)} s de fala estimados) — rode build sem --silent antes da voz`);
        continue;
      }
      console.log(`✓ ${k}: ${lines.length} cenas${changed.length ? ` · voz a gravar: ${changed.map((l) => l.id).join(', ')}` : ' · voz em dia'}`);
    }
  }
}

// ------------------------------------------------------------------ voz medida
// pauses.json (scripts/pauses.mjs): as deixas ancoram nas pausas reais da gravação
const measurePauses = (k) => measurePausesIn(pubDir(k));

// ------------------------------------------------------------------ voice
const node = (script, args) => execFileSync('node', [path.join(root, 'scripts', script), ...args], { stdio: 'inherit', cwd: root });

function voice(ctx) {
  const only = arg('only');
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      const dir = `molde/${k}`;
      const specFile = path.join(pubDir(k), 'spec.json');
      if (!fs.existsSync(specFile)) die(`${k}: rode build antes`);
      const spec = readJson(specFile);
      if (spec.silent) die(`${k}: o build foi --silent — rode build sem --silent antes da voz`);
      const pending = pendingLines(pubDir(k), spec.lines);
      const changed = only ? only.split(',') : pending.map((l) => l.id);
      if (changed.length) node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--only', changed.join(',')]);
      else node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--measure']);
      try {
        // QA de tudo que foi gravado agora (as falas antigas já passaram antes)
        if (changed.length) node('qa-voice.mjs', ['--dir', dir, '--lang', lang, '--fix', '--only', changed.join(',')]);
      } catch (e) {
        if (e.status === 2) die(`${k}: o QA da voz ficou sem resposta da API (nada foi reprovado) — rode voice de novo daqui a pouco`);
        die(`${k}: QA da voz reprovou depois das tentativas — reescreva a fala (homófono, palavra difícil) e rode de novo`);
      }
      node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--measure']);
      measurePauses(k);
      // só o que foi gravado e passou no QA vira "em dia"; um --only não apaga o resto da fila
      const left = markVoiced(pubDir(k), spec.lines, changed, pending);
      fs.writeFileSync(path.join(pubDir(k), 'changed.json'), JSON.stringify(left.map((l) => l.id)));
      if (left.length) console.warn(`! ${k}: ainda sem voz em dia: ${left.map((l) => l.id).join(', ')}`);
    }
}

// ------------------------------------------------------------------ stills + render
/** Mede a voz de todas as chaves do passo ANTES do bundle: ele copia public/ na hora, e o que for gravado depois dá 404. */
const measureAll = (ctx) => {
  for (const id of ctx.ideaIds) for (const lang of LANGS) if (fs.existsSync(path.join(pubDir(key(id, lang)), 'spec.json'))) measurePauses(key(id, lang));
};

async function stills(ctx) {
  const { renderStill, selectComposition } = await import('@remotion/renderer');
  measureAll(ctx);
  const serveUrl = await serve();
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      const composition = await selectComposition({ serveUrl, id: 'Molde', inputProps: { specKey: k, spec: null, scenes: [], ...idProps } });
      const dir = path.join(outDir(k), identity ? `stills-${identity}` : 'stills');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const files = [];
      // --at 0.1,0.5,1: vários quadros por cena (frações da fala) — pra ver câmera, entrada de peça e virada.
      // Sem --at: um quadro no fim da fala, onde TODAS as deixas já entraram (a 75% uma virada no fim da frase não aparecia).
      const fracs = arg('at') ? arg('at').split(',').map(Number) : null;
      const scale = Number(arg('scale', '0.4'));
      let n = 0;
      for (const s of composition.props.scenes) {
        const frames = fracs
          ? fracs.map((f) => (s.scene === 'verso' ? s.start + Math.round(s.frames * (0.1 + 0.8 * f)) : s.start + s.lead + Math.round(f * Math.max(1, s.speech - 6))))
          : [s.scene === 'verso' ? s.start + Math.round(s.frames * 0.9) : s.start + s.lead + s.speech - 6];
        for (const frame of frames) {
          const f = path.join(dir, `${String(++n).padStart(2, '0')}.png`);
          await renderStill({ serveUrl, composition, frame, output: f, scale, inputProps: { specKey: k, spec: null, scenes: [], ...idProps } });
          files.push(f);
        }
      }
      const sheet = path.join(outDir(k), identity ? `sheet-${identity}.png` : 'sheet.png');
      const cols = fracs ? fracs.length : Math.min(4, files.length);
      fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(composition.props.scenes.map((s, i) => ({ n: i + 1, id: s.id, scene: s.scene, caption: s.caption }))));
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-start_number', '1', '-i', path.join(dir, '%02d.png'), '-vf', `tile=${cols}x${Math.ceil(files.length / cols)}:padding=12:color=0x0A0E26`, '-frames:v', '1', sheet]);
      console.log(`✓ ${k}: ${files.length} quadros · folha ${path.relative(repo, sheet)}`);
    }
}

let bundled;
const serve = async () => {
  const { bundle } = await import('@remotion/bundler');
  bundled ??= await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
  return bundled;
};

/**
 * Medidor de ritmo (scripts/ritmo.mjs) depois de todo render — só AVISA, não barra. A régua é a dos
 * estilos de referência (requinte, 2026-11-07): quase-parada entre 16% e 55%, nenhum trecho de
 * mais de 1 s sem nada grande se mexendo. `--sem-ritmo` pula (≈20 s por vídeo).
 */
const ritmo = (mp4, out) => {
  if (argv.includes('--sem-ritmo')) return;
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'ritmo.mjs'), mp4, '--json', out, '--end-hold', '2'], { encoding: 'utf8', maxBuffer: 64e6 });
  if (r.status === 2 || !fs.existsSync(out)) return console.warn(`! ritmo: não consegui medir ${path.basename(mp4)}`);
  const j = readJson(out);
  const holes = j.ritmo.buracos_mortos;
  const list = holes.map(([a, b]) => `${a}–${b} s`).join(' · ');
  console.log(
    `  ritmo: ${Math.round(j.fracao_parada * 100)}% em quase-parada (referência 16–55%) · amplitude ${j.amplitude.toFixed(1)}x · ${j.picos.length} pico(s) · ` +
      `${holes.length ? `${holes.length} buraco(s) > 1 s: ${list}` : 'nenhum buraco > 1 s'}${j.ritmo.passou ? '' : ' — AVISO (não barra)'} · ${path.relative(repo, out)}`,
  );
};

// versão do app (720p): lanczos na redução e x264 afinado pra animação chapada (menos bloco no
// degradê e no texto) — fase 1 do requinte; antes era bicúbico sem tune (e ~20% maior no mesmo crf)
const PUB_ENCODE = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p'];

async function render(ctx) {
  const { renderMedia, selectComposition } = await import('@remotion/renderer');
  measureAll(ctx);
  const serveUrl = await serve();
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      const card = ctx.cards[id];
      const dir = outDir(k);
      // abertura de porta: nunca sai sozinha — vai dentro do vídeo da porta (tour.mjs render, composição Porta)
      const bridge = ctx.vs.ideas[id].bridge === 'tour';
      const preview = bridge || !!tag || !!readJson(path.join(pubDir(k), 'spec.json')).silent;
      fs.mkdirSync(path.join(dir, 'pub'), { recursive: true });
      // prévia sem voz: só o mp4 de conferência, sem pub/ nem video.json (não tem como ir pro bucket)
      if (identity) fs.mkdirSync(path.join(dir, 'identidade'), { recursive: true });
      const full = identity
        ? path.join(dir, 'identidade', `${identity}${sfxOn ? '-som' : ''}.mp4`)
        : path.join(dir, tag ? `piloto${sfxOn ? '-som' : ''}.mp4` : preview ? 'preview.mp4' : 'video.mp4');
      const inputProps = { specKey: k, spec: null, scenes: [], ...idProps };
      const composition = await selectComposition({ serveUrl, id: 'Molde', inputProps });
      let shown = -1;
      await renderMedia({
        serveUrl,
        composition,
        codec: 'h264',
        // fase 1 do requinte: captura sem perda. O padrão da API é JPEG 80 (o setJpegQuality do
        // remotion.config.ts só vale na linha de comando) — degrau no navy e filete dourado borrado
        imageFormat: 'png',
        outputLocation: full,
        inputProps,
        onProgress: ({ progress }) => {
          const pct = Math.floor(progress * 10) * 10;
          if (pct !== shown) process.stdout.write(`${(shown = pct)}% `);
        },
      });
      console.log('');
      ritmo(full, full.replace(/\.mp4$/, '.ritmo.json'));
      if (identity) {
        console.log(`✓ ${k}: comparação de identidade "${identity}" · ${path.relative(repo, full)} (não sobe)`);
        continue;
      }
      if (bridge) {
        console.log(`✓ ${k}: abertura de conferência · ${path.relative(repo, full)} (o vídeo da porta sai do tour.mjs render)`);
        continue;
      }
      if (tag) {
        console.log(`✓ ${k}: PILOTO "${tag}" · ${path.relative(repo, full)} (não sobe)`);
        continue;
      }
      if (preview) {
        console.log(`✓ ${k}: PRÉVIA SEM VOZ · ${path.relative(repo, full)} (rode build sem --silent + voice antes do render de verdade)`);
        continue;
      }
      // versão do app: 720p, AAC 96k, faststart — ~2,5 MB por 50 s
      const name = `${card.file ?? `idea.${card.ordinal}`}.${lang}.r${rev}`;
      const mp4 = path.join(dir, 'pub', `${name}.mp4`);
      const poster = path.join(dir, 'pub', `${name}.poster.webp`);
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', full, ...PUB_ENCODE, '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', mp4]);
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '3.5', '-i', mp4, '-frames:v', '1', '-vf', 'scale=720:-1', '-c:v', 'libwebp', '-quality', '82', poster]);
      const secs = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
      const video = { path: `${slug}/${name}.mp4`, duration_seconds: Math.round(secs), poster: `${slug}/${name}.poster.webp`, producer: 'remotion' };
      fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ ...video, local: path.relative(repo, mp4), localPoster: path.relative(repo, poster), rev }, null, 2));
      console.log(`✓ ${k}: ${secs.toFixed(1)} s · ${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB · ${video.path}`);
    }
}

// ------------------------------------------------------------------ upload + videos
function upload(ctx) {
  if (tag) die('piloto (--tag) não sobe pro bucket: aprove, passe o roteiro pro learning-drops/video-specs e rode de novo');
  const supa = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'supabase', 'supabase.exe') : 'supabase';
  const bin = fs.existsSync(supa) ? supa : 'supabase';
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      if (ctx.vs.ideas[id].bridge === 'tour') {
        console.log(`· ${k}: abertura de porta — sobe dentro do vídeo da porta (tour.mjs upload)`);
        continue;
      }
      const vj = path.join(outDir(k), 'video.json');
      if (!fs.existsSync(vj)) die(`${k}: rode render antes`);
      const v = readJson(vj);
      if (v.rev !== rev) die(`${k}: o render é r${v.rev}, não r${rev}`);
      // o CLI do storage quer caminho RELATIVO e roda do checkout PRINCIPAL — é lá que o projeto
      // está linkado (supabase/.temp); um worktree mora dentro dele, então o relativo funciona
      const linked = mainRoot();
      for (const [local, remote, type] of [[v.local, v.path, 'video/mp4'], [v.localPoster, v.poster, 'image/webp']]) {
        const rel = path.relative(linked, path.join(repo, local)).replace(/\\/g, '/');
        execFileSync(bin, ['storage', 'cp', `./${rel}`, `ss:///learning-media/${remote}`, '--content-type', type, '--cache-control', 'public, max-age=31536000, immutable', '--experimental', '--linked'], { cwd: linked, stdio: 'inherit' });
      }
      console.log(`✓ ${k}: no bucket (${v.path})`);
    }
}

function videos() {
  if (tag) die('piloto (--tag) não entra no videos.json');
  const out = arg('out');
  if (!out) die('videos precisa de --out <arquivo.json>');
  const base = path.join(root, 'out', 'molde');
  const entry = {};
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const [s, idea, lang] = d.split('.');
    if (s !== slug || (onlyIdea && idea !== onlyIdea)) continue;
    const vj = path.join(base, d, 'video.json');
    if (!fs.existsSync(vj)) continue;
    const { path: p, duration_seconds, poster, producer } = readJson(vj);
    entry[idea] ??= { pt: null, en: null };
    entry[idea][lang] = { path: p, duration_seconds, poster, ...(producer ? { producer } : {}) };
  }
  if (!Object.keys(entry).length) die(`nenhum video.json de ${slug} — rode render`);
  const file = path.resolve(out);
  const prev = fs.existsSync(file) ? readJson(file) : {};
  prev[slug] = entry;
  fs.writeFileSync(file, JSON.stringify(prev, null, 2));
  console.log(`✓ ${Object.keys(entry).length} ideia(s) → ${file}`);
}

// ------------------------------------------------------------------ main
if (step === 'videos') videos();
else {
  const ctx = load();
  if (step === 'lint') console.log(`✓ roteiro ok: ${ctx.ideaIds.join(', ')} (${LANGS.join(' + ')})`);
  else if (step === 'build') await build(ctx);
  else if (step === 'voice') voice(ctx);
  else if (step === 'stills') await stills(ctx);
  else if (step === 'render') await render(ctx);
  else if (step === 'upload') upload(ctx);
  else if (step === 'all') {
    await build(ctx);
    voice(ctx);
    await stills(ctx);
    await render(ctx);
  } else die(`passo desconhecido: ${step}`);
}
