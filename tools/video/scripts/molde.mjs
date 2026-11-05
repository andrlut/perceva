// Molde genérico do vídeo de ideia — do roteiro revisado ao MP4 no bucket.
//
//   node scripts/molde.mjs lint    --slug <slug>                      só o lint do roteiro (sem gastar nada)
//   node scripts/molde.mjs build   --slug <slug> [--idea <id>] [--lang pt|en|both]
//   node scripts/molde.mjs voice   --slug <slug> [--idea <id>] [--lang …] [--only a,b]   TTS + QA (--fix) por fala
//   node scripts/molde.mjs stills  --slug <slug> [--idea <id>] [--lang …]  um quadro por cena + folha de contato
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
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

const videoSpecFile = path.join(repo, 'learning-drops/video-specs', `${slug}.json`);
const ideasSpecFile = path.join(repo, 'learning-drops/ideas-specs', `${slug}.json`);
const inboxDir = firstExisting(path.join(repo, 'learning-drops/inbox', slug), path.join(mainRoot(), 'learning-drops/inbox', slug));

const key = (idea, lang) => `${slug}.${idea}.${lang}`;
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
const CUE_KEYS = ['cue', 'turn', 'from', 'until', 'at', 'win', 'glow', 'out', 'arrives', 'leaves'];
const LIMITS = { caption: 150, kicker: 24, label: 22, chip: 30, pill: 22, lines: [4, 8], seconds: 58 };

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
  if (lines.length < LIMITS.lines[0] || lines.length > LIMITS.lines[1]) errors.push(`${ideaId}: ${lines.length} falas (faixa ${LIMITS.lines.join('–')})`);
  const last = lines[lines.length - 1];
  if (last.scene !== 'verso') errors.push(`${ideaId}: a última cena tem que ser "verso" (a voz lê o card)`);
  const ids = new Set();
  let chars = 0;
  let extra = 0;
  for (const raw of lines) {
    const l = resolveLine(raw, lang);
    if (!l.id || ids.has(l.id)) errors.push(where(l.id, 'id vazio ou repetido'));
    ids.add(l.id);
    if (!catalog.scenes.includes(l.scene)) errors.push(where(l.id, `cena "${l.scene}" não existe (${catalog.scenes.join(', ')})`));
    if (l.scene === 'verso') {
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
      ...(l.props?.chips ?? []).map((c) => c.text), ...(l.props?.items ?? []).map((c) => c.text)].filter(Boolean);
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
  if (est > LIMITS.seconds) errors.push(`${ideaId}/${lang}: ~${est.toFixed(0)} s estimados (teto ${LIMITS.seconds} s) — corte falas`);
  else if (est > LIMITS.seconds - 6) warns.push(`${ideaId}/${lang}: ~${est.toFixed(0)} s estimados, perto do teto`);
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
      if (!hasImg) console.warn(`! ${k}: sem imagem 4:5 da ideia — o card do verso sai sem foto`);
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
        lines,
      };
      // a voz de uma fala que não mudou continua válida; fala que mudou é regravada no `voice`
      const prev = fs.existsSync(path.join(dir, 'spec.json')) ? readJson(path.join(dir, 'spec.json')) : null;
      const changed = lines.filter((l) => {
        const p = prev?.lines?.find((x) => x.id === l.id);
        return !p || (p.say ?? p.caption) !== (l.say ?? l.caption) || !fs.existsSync(path.join(dir, `${l.id}.mp3`));
      });
      fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
      fs.writeFileSync(path.join(dir, 'changed.json'), JSON.stringify(changed.map((l) => l.id)));
      console.log(`✓ ${k}: ${lines.length} cenas${changed.length ? ` · voz a gravar: ${changed.map((l) => l.id).join(', ')}` : ' · voz em dia'}`);
    }
  }
}

// ------------------------------------------------------------------ voice
const node = (script, args) => execFileSync('node', [path.join(root, 'scripts', script), ...args], { stdio: 'inherit', cwd: root });

function voice(ctx) {
  const only = arg('only');
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      const dir = `molde/${k}`;
      if (!fs.existsSync(path.join(pubDir(k), 'spec.json'))) die(`${k}: rode build antes`);
      const changed = only ? only.split(',') : readJson(path.join(pubDir(k), 'changed.json'));
      if (changed.length) node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--only', changed.join(',')]);
      else node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--measure']);
      try {
        // QA de tudo que foi gravado agora (as falas antigas já passaram antes)
        if (changed.length) node('qa-voice.mjs', ['--dir', dir, '--lang', lang, '--fix', '--only', changed.join(',')]);
      } catch {
        die(`${k}: QA da voz reprovou depois das tentativas — reescreva a fala (homófono, palavra difícil) e rode de novo`);
      }
      node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--measure']);
      fs.writeFileSync(path.join(pubDir(k), 'changed.json'), '[]');
    }
}

// ------------------------------------------------------------------ stills + render
async function stills(ctx) {
  const { renderStill, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await serve();
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      const composition = await selectComposition({ serveUrl, id: 'Molde', inputProps: { specKey: k, spec: null, scenes: [] } });
      const dir = path.join(outDir(k), 'stills');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const files = [];
      for (const [i, s] of composition.props.scenes.entries()) {
        // fim da fala: TODAS as deixas já entraram (a 75% uma virada no fim da frase não aparecia)
        const frame = s.scene === 'verso' ? s.start + Math.round(s.frames * 0.9) : s.start + s.lead + s.speech - 6;
        const f = path.join(dir, `${String(i + 1).padStart(2, '0')}.png`);
        await renderStill({ serveUrl, composition, frame, output: f, scale: 0.4, inputProps: { specKey: k, spec: null, scenes: [] } });
        files.push(f);
      }
      const sheet = path.join(outDir(k), 'sheet.png');
      const cols = Math.min(4, files.length);
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

async function render(ctx) {
  const { renderMedia, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await serve();
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
      const card = ctx.cards[id];
      const dir = outDir(k);
      fs.mkdirSync(path.join(dir, 'pub'), { recursive: true });
      const full = path.join(dir, 'video.mp4');
      const inputProps = { specKey: k, spec: null, scenes: [] };
      const composition = await selectComposition({ serveUrl, id: 'Molde', inputProps });
      let shown = -1;
      await renderMedia({
        serveUrl,
        composition,
        codec: 'h264',
        outputLocation: full,
        inputProps,
        onProgress: ({ progress }) => {
          const pct = Math.floor(progress * 10) * 10;
          if (pct !== shown) process.stdout.write(`${(shown = pct)}% `);
        },
      });
      console.log('');
      // versão do app: 720p, AAC 96k, faststart — ~2,5 MB por 50 s
      const name = `${card.file ?? `idea.${card.ordinal}`}.${lang}.r${rev}`;
      const mp4 = path.join(dir, 'pub', `${name}.mp4`);
      const poster = path.join(dir, 'pub', `${name}.poster.webp`);
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', full, '-vf', 'scale=720:1280', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', mp4]);
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '3.5', '-i', mp4, '-frames:v', '1', '-vf', 'scale=720:-1', '-c:v', 'libwebp', '-quality', '82', poster]);
      const secs = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
      const video = { path: `${slug}/${name}.mp4`, duration_seconds: Math.round(secs), poster: `${slug}/${name}.poster.webp`, producer: 'remotion' };
      fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ ...video, local: path.relative(repo, mp4), localPoster: path.relative(repo, poster), rev }, null, 2));
      console.log(`✓ ${k}: ${secs.toFixed(1)} s · ${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB · ${video.path}`);
    }
}

// ------------------------------------------------------------------ upload + videos
function upload(ctx) {
  const supa = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'supabase', 'supabase.exe') : 'supabase';
  const bin = fs.existsSync(supa) ? supa : 'supabase';
  for (const id of ctx.ideaIds)
    for (const lang of LANGS) {
      const k = key(id, lang);
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
  const out = arg('out');
  if (!out) die('videos precisa de --out <arquivo.json>');
  const base = path.join(root, 'out', 'molde');
  const entry = {};
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const [s, idea, lang] = d.split('.');
    if (s !== slug || (onlyIdea && idea !== onlyIdea)) continue;
    const vj = path.join(base, d, 'video.json');
    if (!fs.existsSync(vj)) continue;
    const { path: p, duration_seconds, poster } = readJson(vj);
    entry[idea] ??= { pt: null, en: null };
    entry[idea][lang] = { path: p, duration_seconds, poster };
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
