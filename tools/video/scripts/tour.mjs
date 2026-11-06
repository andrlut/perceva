// Tutorial de tela (réplica + câmera + destaque + dedo) — do roteiro revisado ao MP4.
//
//   node scripts/tour.mjs lint    --tour <tela>                       só o lint do roteiro (grátis)
//   node scripts/tour.mjs build   --tour <tela> [--lang pt|en|both] [--silent]
//   node scripts/tour.mjs voice   --tour <tela> [--lang …] [--only a,b]   TTS Kore + QA por transcrição (--fix)
//   node scripts/tour.mjs stills  --tour <tela> [--lang …]             um quadro por batida + folha de contato + audit do movimento
//   node scripts/tour.mjs frames  --tour <tela> [--lang …] (--frames a,b | --plan f.json) [--scale 1] [--clean]
//                                                                       quadros avulsos + frames/index.json
//   node scripts/tour.mjs render  --tour <tela> [--lang …] [--rev N]   MP4 + versão do app (720p) + pôster (barra se o audit do movimento falhar)
//                                  com "intro" no roteiro: renderiza a composição Porta (o porquê com o elenco + este tutorial)
//   node scripts/tour.mjs all     --tour <tela> [--lang …] [--silent]  build → voice → stills → render
//   node scripts/tour.mjs replica [--screen rewards] [--fixture inicio] [--lang pt] [--state '{"goal":null}'] [--name x]
//   node scripts/tour.mjs upload  --tour <tela> [--lang …] [--rev N]   sobe pro bucket learning-media (checkout principal)
//
// --silent: sem voz — tempos estimados pelo tamanho da fala, sem áudio. Serve pra
// conferir quadros (stills) sem gastar TTS; nunca pra publicar.
//
// Entrada: tools/video/tours/<tela>.json (roteiro bilíngue, versionado; formato em TOUR.md)
// Saída:   public/tour/<tela>.<lang>/  spec resolvido + voz (gitignored)
//          out/tour/<tela>.<lang>/     stills/, sheet.png, video.mp4, pub/doors/<file>.<lang>.r<rev>.mp4 (+ .poster.webp), video.json
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { markVoiced, pendingLines } from './voiced.mjs';

const root = path.resolve(import.meta.dirname, '..');
const repo = path.resolve(root, '..', '..');
const argv = process.argv.slice(2);
const step = argv[0];
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i > 0 ? argv[i + 1] : d;
};
const flag = (n) => argv.includes(`--${n}`);
const tourName = arg('tour');
const langArg = arg('lang', 'both');
const LANGS = langArg === 'both' ? ['pt', 'en'] : [langArg];
const SILENT = flag('silent');
const BUCKET_URL = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media';

const die = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const TARGETS = readJson(path.join(root, 'src/tutorial/screens/targets.json'));
const FIXTURES = { rewards: readJson(path.join(root, 'src/tutorial/screens/rewards.fixtures.json')) };
const ions = readJson(path.join(root, 'src/molde/ionicons-full.json'));
/** FREE_LIMITS do app (lido do .ts, sem importar): { task, reward, skill, quest } */
const FREE_LIMITS = (() => {
  try {
    const src = fs.readFileSync(path.join(repo, 'app', 'lib', 'premium', 'limits.ts'), 'utf8');
    const block = /FREE_LIMITS\s*=\s*\{([^}]*)\}/.exec(src)?.[1] ?? '';
    return Object.fromEntries([...block.matchAll(/(\w+)\s*:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]));
  } catch {
    return {};
  }
})();

const tourFile = (t) => path.join(root, 'tours', `${t}.json`);
const key = (lang) => `${tourName}.${lang}`;
/** a abertura do porquê (molde): public/molde/<slug>.<idea>.<lang>/ */
const introKey = (spec, lang) => `${spec.intro.slug}.${spec.intro.idea}.${lang}`;
const pubDir = (k) => path.join(root, 'public', 'tour', k);
const outDir = (k) => path.join(root, 'out', 'tour', k);

// ------------------------------------------------------------------ resolução {pt,en}
const plain = (s) => s.replace(/\*/g, '');
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const resolve = (v, lang) => {
  if (Array.isArray(v)) return v.map((x) => resolve(x, lang));
  if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    if (ks.length && ks.every((k) => k === 'pt' || k === 'en')) return v[lang];
    return Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, resolve(x, lang)]));
  }
  return v;
};
/** Campos de batida que podem vir direto na fala (viram uma batida em "@start"). */
const LINE_BEAT_KEYS = ['focus', 'camera', 'do', 'target', 'scroll', 'set', 'callout', 'pulse', 'tone'];
const resolveLine = (raw, lang) => {
  const { pt, en, beats = [], ...rest } = raw;
  const r = resolve(rest, lang);
  const lineBeat = Object.fromEntries(LINE_BEAT_KEYS.filter((k) => k in r).map((k) => [k, r[k]]));
  for (const k of LINE_BEAT_KEYS) delete r[k];
  const all = [...(Object.keys(lineBeat).length ? [{ at: '@start', ...lineBeat }] : []), ...resolve(beats, lang)];
  return { ...r, ...(raw[lang] ?? {}), beats: all };
};

// ------------------------------------------------------------------ lint
// Mesma régua do molde: nada de dado de pesquisa na voz/legenda.
const BANNED = {
  pt: /\b(estudos?|pesquisas?|pesquisador\w*|cientistas?|amostras?|participantes?|voluntari\w*|universidades?|revistas?|experimentos?|estatistic\w*|dados|comprovad\w*|por cento|porcento|vezes mais|et al)\b/,
  en: /\b(stud(y|ies)|research\w*|scientists?|samples?|participants?|volunteers?|universit(y|ies)|journals?|experiments?|statistic\w*|data|proven|percent|times more|et al)\b/,
};
const LIMITS = { caption: 150, kicker: 24, title: 24, callout: 24, lines: [4, 8], seconds: [25, 40], hardSeconds: 45 };
const CPS = { pt: 14.5, en: 15.5 };
const ACTIONS = ['tap', 'hold', 'point', 'swipe'];
const SPECIAL = ['@start', '@end'];

/** alvo válido pra tela? pattern "card:{id}" casa com qualquer id da fixture */
const matchTarget = (list, id, fx) =>
  list.some((p) => {
    if (!p.includes('{id}')) return p === id;
    const re = new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{id\\}', '([\\w-]+)')}$`);
    const m = re.exec(id);
    return !!m && fx.rewards.some((r) => r.id === m[1]);
  });

function lintTour(spec, lang, errors, warns) {
  const where = (l, m) => `${lang}/${l}: ${m}`;
  const screen = TARGETS[spec.screen];
  if (!screen) return errors.push(`tela "${spec.screen}" não tem réplica (tem: ${Object.keys(TARGETS).filter((k) => !k.startsWith('_')).join(', ')})`);
  const fx = FIXTURES[spec.screen]?.[spec.fixture ?? 'inicio'];
  if (!fx) return errors.push(`fixture "${spec.fixture}" não existe pra ${spec.screen}`);
  const known = [...screen.static, ...screen.patterns];
  for (const r of fx.rewards ?? []) if (!(r.icon in ions)) errors.push(`fixture ${spec.fixture}: ícone "${r.icon}" não existe no Ionicons`);
  // a porta é vista sobretudo no plano grátis: a loja da fixture não passa do teto do free
  const cap = FREE_LIMITS[spec.screen === 'rewards' ? 'reward' : spec.screen];
  const capWarn = `fixture ${spec.fixture}: ${fx.rewards?.length} recompensas ativas, mas o plano grátis cabe ${cap} (app/lib/premium/limits.ts) — quem vê a porta no free nunca teria essa loja`;
  if (cap && (fx.rewards?.length ?? 0) > cap && !warns.includes(capWarn)) warns.push(capWarn);
  const lines = spec.lines ?? [];
  if (lines.length < LIMITS.lines[0] || lines.length > LIMITS.lines[1]) errors.push(`${lines.length} falas (faixa ${LIMITS.lines.join('–')})`);
  const kicker = resolve(spec.kicker, lang);
  if (!kicker) errors.push(`${lang}: sem kicker`);
  else if (kicker.length > LIMITS.kicker) errors.push(`${lang}: kicker longo (${kicker.length} > ${LIMITS.kicker})`);
  for (const k of Object.keys(spec.state ?? {})) if (!screen.state.includes(k)) errors.push(`state.${k}: a tela não tem esse estado (${screen.state.join(', ')})`);
  // abertura (o porquê com o elenco): uma ideia do molde com bridge "tour" — o lint do texto dela é o do molde
  if (spec.intro) {
    const f = path.join(repo, 'learning-drops', 'video-specs', `${spec.intro.slug}.json`);
    const idea = fs.existsSync(f) ? readJson(f).ideas?.[spec.intro.idea] : null;
    if (!idea) errors.push(`intro: sem ideia "${spec.intro.idea}" em learning-drops/video-specs/${spec.intro.slug}.json`);
    else if (idea.bridge !== 'tour') errors.push(`intro: a ideia "${spec.intro.idea}" precisa de bridge "tour" (abertura sem verso)`);
  }
  const ids = new Set();
  let chars = 0;
  let extra = 0;
  lines.forEach((raw, li) => {
    const l = resolveLine(raw, lang);
    if (!l.id || ids.has(l.id)) errors.push(where(l.id, 'id vazio ou repetido'));
    ids.add(l.id);
    const cap = l.caption;
    if (typeof cap !== 'string' || !cap.trim()) return errors.push(where(l.id, 'sem caption'));
    const spoken = plain(l.say ?? cap);
    chars += spoken.length;
    extra += (l.pre ?? 0) + (l.hold ?? 0);
    if (plain(cap).length > LIMITS.caption) errors.push(where(l.id, `legenda com ${plain(cap).length} caracteres (teto ${LIMITS.caption})`));
    const stars = (cap.match(/\*/g) ?? []).length;
    if (stars % 2 || stars > 2) errors.push(where(l.id, 'destaque *…*: no máximo um, e fechado'));
    if (l.title && l.title.length > LIMITS.title) errors.push(where(l.id, `título longo: "${l.title}"`));
    for (const t of [cap, l.say].filter(Boolean)) {
      const m = BANNED[lang].exec(fold(t));
      if (m) errors.push(where(l.id, `"${m[0]}" em "${t}" — tutorial ensina a tela, sem estudo nem dado`));
      if (/\d|%/.test(t)) warns.push(where(l.id, `número na fala: "${t}" (só se for da tela, nunca de pesquisa)`));
    }
    if (!raw.pt?.caption || !raw.en?.caption) errors.push(`${l.id}: precisa de pt.caption e en.caption (versões nativas)`);
    const hay = [plain(cap), spoken];
    let lastIdx = -1;
    for (const b of l.beats) {
      const at = b.at;
      if (typeof at !== 'string' || !at) {
        errors.push(where(l.id, 'batida sem "at"'));
        continue;
      }
      if (!SPECIAL.includes(at)) {
        if (!hay.some((h) => h.includes(at))) errors.push(where(l.id, `deixa "${at}" não está na fala "${plain(cap)}"`));
        const idx = spoken.indexOf(at);
        if (idx >= 0 && idx < lastIdx && !(b.after > 0)) warns.push(where(l.id, `deixa "${at}" vem antes da batida anterior na fala — confira a ordem`));
        if (idx >= 0) lastIdx = idx;
      }
      for (const t of [b.focus, b.target].filter((x) => typeof x === 'string')) {
        if (!matchTarget(known, t, fx)) errors.push(where(l.id, `alvo "${t}" não existe na réplica ${spec.screen} (screens/targets.json)`));
      }
      if (b.do !== undefined) {
        if (!ACTIONS.includes(b.do)) errors.push(where(l.id, `ação "${b.do}" não existe (${ACTIONS.join(', ')})`));
        const target = b.target ?? b.focus;
        if (b.do !== 'swipe' && !target) errors.push(where(l.id, `"${b.do}" sem alvo (target ou focus na mesma batida)`));
        if (b.do === 'tap' && target && !matchTarget(screen.tap, target, fx)) {
          const why = matchTarget(screen.pointOnly, target, fx) ? 'leva pra outra tela (ou não faz nada) no app — use "point"' : 'a réplica não sabe responder esse toque';
          errors.push(where(l.id, `tap em "${target}": ${why}`));
        }
        if (b.do === 'hold') errors.push(where(l.id, `"hold" ainda não tem comportamento replicado em ${spec.screen}`));
        if (b.do === 'swipe' && b.scroll === undefined) errors.push(where(l.id, '"swipe" precisa de "scroll" (dp ou alvo)'));
      }
      if (typeof b.scroll === 'string' && !matchTarget(known, b.scroll, fx)) errors.push(where(l.id, `scroll pra alvo inexistente "${b.scroll}"`));
      if (b.camera !== undefined && !['wide', 'focus', 'hold'].includes(b.camera) && typeof b.camera !== 'number') errors.push(where(l.id, `camera "${b.camera}" inválida`));
      if (typeof b.camera === 'number' && (b.camera < 1 || b.camera > 2.5)) errors.push(where(l.id, `zoom ${b.camera} fora de 1–2,5`));
      if (b.callout && b.callout.length > LIMITS.callout) errors.push(where(l.id, `etiqueta longa: "${b.callout}" (≤ ${LIMITS.callout})`));
      for (const k of Object.keys(b.set ?? {})) if (!screen.state.includes(k)) errors.push(where(l.id, `set.${k}: estado inexistente`));
    }
    if (li === 0 && !l.beats.some((b) => b.at === '@start' && b.camera === 'wide')) warns.push(where(l.id, 'a 1ª fala devia abrir com a tela inteira (camera "wide" em @start) — é o plano que faz a pessoa reconhecer a tela'));
  });
  // regra do formato: o fecho é o (i) pulsando — "a tela explica cada parte"
  const last = lines.length ? resolveLine(lines[lines.length - 1], lang) : null;
  if (last && !last.beats.some((b) => b.focus === 'info' && b.pulse)) errors.push(`${lang}: a última fala tem que destacar o (i) com pulse (focus "info", pulse true)`);
  // PT e EN têm as MESMAS batidas (só a deixa muda de idioma)
  const est = chars / CPS[lang] + extra + lines.length * 0.75 + 1.8;
  if (est > LIMITS.hardSeconds) errors.push(`${lang}: ~${est.toFixed(0)} s estimados (teto ${LIMITS.hardSeconds} s)`);
  else if (est < LIMITS.seconds[0] || est > LIMITS.seconds[1]) warns.push(`${lang}: ~${est.toFixed(0)} s estimados (alvo ${LIMITS.seconds.join('–')} s)`);
  return est;
}

function load() {
  if (!tourName) die('falta --tour <tela> (tools/video/tours/<tela>.json)');
  const f = tourFile(tourName);
  if (!fs.existsSync(f)) die(`sem roteiro: ${path.relative(repo, f)}`);
  const spec = readJson(f);
  const errors = [];
  const warns = [];
  const est = {};
  for (const lang of LANGS) est[lang] = lintTour(spec, lang, errors, warns);
  for (const w of warns) console.warn(`! ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    die(`${errors.length} erro(s) no roteiro ${path.relative(repo, f)}`);
  }
  return { spec, est };
}

// ------------------------------------------------------------------ build
function build(ctx) {
  for (const lang of LANGS) {
    const k = key(lang);
    const dir = pubDir(k);
    fs.mkdirSync(dir, { recursive: true });
    const lines = ctx.spec.lines.map((raw) => {
      const l = resolveLine(raw, lang);
      return {
        id: l.id,
        caption: l.caption,
        ...(l.say ? { say: l.say } : {}),
        ...(l.pre ? { pre: l.pre } : {}),
        ...(l.hold ? { hold: l.hold } : {}),
        ...(l.title ? { title: l.title } : {}),
        beats: l.beats,
      };
    });
    const out = {
      key: k,
      tour: tourName,
      screen: ctx.spec.screen,
      fixture: ctx.spec.fixture ?? 'inicio',
      lang,
      kicker: resolve(ctx.spec.kicker, lang),
      ...(ctx.spec.state ? { state: ctx.spec.state } : {}),
      silent: SILENT,
      file: ctx.spec.file ?? tourName,
      rev: ctx.spec.rev ?? 1,
      ...(ctx.spec.posterAt ? { posterAt: ctx.spec.posterAt } : {}),
      ...(ctx.spec.style?.[lang] ? { style: ctx.spec.style[lang] } : {}),
      ...(ctx.spec.intro ? { introKey: introKey(ctx.spec, lang) } : {}),
      lines,
    };
    // a régua é o texto que a voz leu e passou no QA (voiced.json), não o build anterior
    const prev = fs.existsSync(path.join(dir, 'spec.json')) ? readJson(path.join(dir, 'spec.json')) : null;
    const changed = pendingLines(dir, lines, prev);
    fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(out, null, 2));
    fs.writeFileSync(path.join(dir, 'changed.json'), JSON.stringify(changed.map((l) => l.id)));
    // tempos estimados (modo sem voz): mesma conta do lint, por fala
    const est = lines.map((l) => ({ id: l.id, seconds: Math.round((plain(l.say ?? l.caption).length / CPS[lang] + 0.35) * 1000) / 1000 }));
    fs.writeFileSync(path.join(dir, 'timings.est.json'), JSON.stringify(est, null, 2));
    const voiced = fs.existsSync(path.join(dir, 'timings.json'));
    console.log(
      `✓ ${k}: ${lines.length} falas · ${SILENT ? 'SEM VOZ (tempos estimados)' : changed.length ? `voz a gravar: ${changed.map((l) => l.id).join(', ')}` : 'voz em dia'}` +
        (!SILENT && !voiced ? ' · rode `voice`' : ''),
    );
  }
}

// ------------------------------------------------------------------ voice (mesmos scripts do molde: Kore, QA por transcrição)
const node = (script, args) => execFileSync('node', [path.join(root, 'scripts', script), ...args], { stdio: 'inherit', cwd: root });

function voice() {
  const only = arg('only');
  for (const lang of LANGS) {
    const k = key(lang);
    const dir = `tour/${k}`;
    const specFile = path.join(pubDir(k), 'spec.json');
    if (!fs.existsSync(specFile)) die(`${k}: rode build antes`);
    const spec = readJson(specFile);
    if (spec.silent) die(`${k}: o build foi --silent — rode build sem --silent antes da voz`);
    const pending = pendingLines(pubDir(k), spec.lines);
    const changed = only ? only.split(',') : pending.map((l) => l.id);
    if (changed.length) node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--only', changed.join(',')]);
    try {
      if (changed.length) node('qa-voice.mjs', ['--dir', dir, '--lang', lang, '--fix', '--only', changed.join(',')]);
    } catch (e) {
      if (e.status === 2) die(`${k}: o QA da voz ficou sem resposta da API (nada foi reprovado) — rode voice de novo daqui a pouco`);
      die(`${k}: QA da voz reprovou depois das tentativas — reescreva a fala (homófono, palavra difícil) e rode de novo`);
    }
    node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--measure']);
    // só o que foi gravado e passou no QA vira "em dia"; um --only não apaga o resto da fila
    const left = markVoiced(pubDir(k), spec.lines, changed, pending);
    fs.writeFileSync(path.join(pubDir(k), 'changed.json'), JSON.stringify(left.map((l) => l.id)));
    if (left.length) console.warn(`! ${k}: ainda sem voz em dia: ${left.map((l) => l.id).join(', ')}`);
  }
}

// ------------------------------------------------------------------ stills + render
let bundled;
const serve = async () => {
  const { bundle } = await import('@remotion/bundler');
  bundled ??= await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
  return bundled;
};
const tile = (files, sheet, cols) =>
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-start_number', '1', '-i', path.join(path.dirname(files[0]), '%02d.png'),
    '-vf', `tile=${cols}x${Math.ceil(files.length / cols)}:padding=12:color=0x0A0E26`, '-frames:v', '1', sheet,
  ]);

/**
 * O audit do movimento que o plano faz (engine.ts, plan.audit → props.motion; tabela em TOUR.md):
 * a mão saindo do palco (`stage`), parada perto de um controle (`rest`), andando por cima de um
 * controle alheio (`path`), o dedo do arrasto perto de controle no caminho inteiro (`contact`), o
 * conteúdo que não anda 1:1 com o dedo ou inércia longa (`drag`), anel fora do alvo (`ring`), alvo
 * que salta num quadro (`jump`), mão aparecendo num salto (`pop`) e dois títulos juntos (`title`).
 * Mostra cada problema com o segundo; devolve quantos.
 */
const reportMotion = (k, motion) => {
  if (!motion) return 0;
  const sec = (f) => (f / 30).toFixed(2);
  for (const i of motion.issues) console.warn(`! ${k} ${sec(i.frame)} s${i.to ? `–${sec(i.to)} s` : ''} [${i.rule}] ${i.what}`);
  const drags = (motion.swipes ?? []).map((s) => `${s.fingerPx}/${s.contentPx} px`).join(', ');
  console.log(`  ${k}: movimento — ${motion.issues.length ? `${motion.issues.length} problema(s)` : 'ok'} · ${motion.entries.length} aparições da mão · ${motion.swipes.length} arrastos (dedo/conteúdo: ${drags || '—'})`);
  return motion.issues.length;
};

async function stills() {
  const { renderStill, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await serve();
  for (const lang of LANGS) {
    const k = key(lang);
    if (!fs.existsSync(path.join(pubDir(k), 'spec.json'))) die(`${k}: rode build antes`);
    const inputProps = { tourKey: k, spec: null, scenes: [], mode: 'tour' };
    const composition = await selectComposition({ serveUrl, id: 'Tour', inputProps });
    const { scenes, marks, spec } = composition.props;
    const dir = path.join(outDir(k), 'stills');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    // um quadro na abertura, um logo depois de cada batida assentar, e o último. O toque com
    // `lift` (o que entra debaixo do dedo: um modal, o vão do Mirar) apaga mão e onda em T+8, então
    // o quadro de assentar (T+9) já não prova o toque: esse toque é tirado em T+4 — dedo apertando
    // e onda saindo do controle — e o T+9 (a mão já fora, o que entrou no lugar) só entra se a
    // folha tiver espaço (SHEET_MAX)
    const SHEET_MAX = 25; // 5 × 5
    const clampF = (f) => Math.max(0, Math.min(composition.durationInFrames - 1, f));
    const near = (list, f) => list.some((q) => Math.abs(q.frame - f) < 4);
    const picks = [{ frame: 12, what: 'abertura', line: scenes[0].id }];
    const extras = [];
    for (const m of marks) {
      const label = `${m.do ?? 'foco'} ${m.target ?? m.focus ?? ''} @ "${m.at}"`.trim();
      if (m.do === 'tap' && m.lift) {
        picks.push({ frame: m.frame + 4, beat: m.frame, what: `${label} · contato (T+4): dedo apertando o controle e a onda saindo dele; a mão já começa a apagar (lift)`, line: m.line });
        extras.push({ frame: m.frame + 9, beat: m.frame, what: `${label} · T+9: mão e onda já saíram (lift); o que o toque pôs debaixo do dedo está no lugar`, line: m.line });
        continue;
      }
      const settle = m.do === 'tap' ? 9 : m.do === 'swipe' ? 26 : m.do === 'point' ? 6 : 16;
      picks.push({ frame: m.frame + settle, beat: m.frame, what: label, line: m.line });
    }
    picks.push({ frame: composition.durationInFrames - 2, what: 'fecho', line: scenes[scenes.length - 1].id });
    const uniq = [];
    for (const p of picks.map((x) => ({ ...x, frame: clampF(x.frame) }))) if (!near(uniq, p.frame)) uniq.push(p);
    for (const p of extras.map((x) => ({ ...x, frame: clampF(x.frame) }))) if (uniq.length < SHEET_MAX && !near(uniq, p.frame)) uniq.push(p);
    uniq.sort((a, b) => a.frame - b.frame);
    const files = [];
    for (const [i, p] of uniq.entries()) {
      const f = path.join(dir, `${String(i + 1).padStart(2, '0')}.png`);
      await renderStill({ serveUrl, composition, frame: p.frame, output: f, scale: 0.4, inputProps });
      files.push(f);
    }
    fs.writeFileSync(
      path.join(dir, 'index.json'),
      JSON.stringify(
        uniq.map((p, i) => ({
          n: i + 1,
          frame: p.frame,
          seconds: +(p.frame / 30).toFixed(2),
          ...(p.beat !== undefined ? { beat: p.beat, t: `T${p.frame - p.beat >= 0 ? '+' : ''}${p.frame - p.beat}` } : {}),
          line: p.line,
          shows: p.what,
          caption: scenes.find((s) => s.id === p.line)?.caption,
        })),
        null,
        2,
      ),
    );
    // todas as batidas em quadros (com lift e o quadro em que a mão parte): base pra `frames`
    fs.writeFileSync(path.join(dir, 'marks.json'), JSON.stringify({ durationInFrames: composition.durationInFrames, marks }, null, 2));
    // o audit do movimento (cada aparição da mão, cada arrasto, cada problema): o revisor lê junto da folha
    fs.writeFileSync(path.join(dir, 'motion.json'), JSON.stringify(composition.props.motion ?? null, null, 2));
    reportMotion(k, composition.props.motion);
    const sheet = path.join(outDir(k), 'sheet.png');
    tile(files, sheet, Math.min(5, files.length));
    console.log(`✓ ${k}: ${files.length} quadros (${(composition.durationInFrames / 30).toFixed(1)} s${spec.silent ? ', SEM VOZ' : ''}) · folha ${path.relative(repo, sheet)}`);
  }
}

/**
 * Quadros avulsos pra conferir movimento: `--frames 300,302,…` ou `--plan <json>` — uma lista
 * [{ frame, window?, expect? }] ou { pt: [...], en: [...] } (o que cada quadro deveria mostrar).
 * `--clean` apaga a pasta antes (quadro velho não engana o revisor). Escreve frames/index.json.
 */
async function frames() {
  const { renderStill, selectComposition, openBrowser } = await import('@remotion/renderer');
  const serveUrl = await serve();
  const plan = arg('plan') ? readJson(path.resolve(arg('plan'))) : null;
  const fromArg = (arg('frames') ?? '').split(',').filter(Boolean).map((n) => ({ frame: Number(n) }));
  const scale = Number(arg('scale', '0.5'));
  // um navegador só pra todos os quadros (abrir um por quadro custa segundos cada)
  const browser = await openBrowser('chrome', { forceDeviceScaleFactor: scale });
  try {
    for (const lang of LANGS) {
      const k = key(lang);
      const items = plan ? (Array.isArray(plan) ? plan : plan[lang] ?? []) : fromArg;
      if (!items.length) die(`${k}: nenhum quadro (--frames a,b,c ou --plan <json>)`);
      const inputProps = { tourKey: k, spec: null, scenes: [], mode: 'tour' };
      const composition = await selectComposition({ serveUrl, id: 'Tour', inputProps, puppeteerInstance: browser });
      const { scenes } = composition.props;
      const dir = path.join(outDir(k), 'frames');
      if (flag('clean')) fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const indexFile = path.join(dir, 'index.json');
      const index = new Map((fs.existsSync(indexFile) ? readJson(indexFile) : []).map((e) => [e.frame, e]));
      for (const it of items) {
        const file = `f${String(it.frame).padStart(4, '0')}.png`;
        await renderStill({ serveUrl, composition, frame: it.frame, output: path.join(dir, file), scale, inputProps, puppeteerInstance: browser });
        const line = [...scenes].reverse().find((s) => s.start <= it.frame) ?? scenes[0];
        index.set(it.frame, {
          file,
          frame: it.frame,
          seconds: +(it.frame / 30).toFixed(2),
          line: line.id,
          ...(it.window ? { window: it.window } : {}),
          ...(it.t ? { t: it.t } : {}),
          ...(it.expect ? { expect: it.expect } : {}),
          caption: line.caption,
        });
        process.stdout.write('.');
      }
      fs.writeFileSync(indexFile, JSON.stringify([...index.values()].sort((a, b) => a.frame - b.frame), null, 2));
      console.log(`\n✓ ${k}: ${items.length} quadros (escala ${scale}) · ${path.relative(repo, dir)}`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

async function replica() {
  const { renderStill, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await serve();
  const inputProps = {
    tourKey: '',
    spec: null,
    scenes: [],
    mode: 'replica',
    screen: arg('screen', 'rewards'),
    fixture: arg('fixture', 'inicio'),
    lang: arg('lang', 'pt') === 'en' ? 'en' : 'pt',
    state: JSON.parse(arg('state', '{}')),
  };
  const composition = await selectComposition({ serveUrl, id: 'Tour', inputProps });
  const dir = path.join(root, 'out', 'tour', 'replica');
  fs.mkdirSync(dir, { recursive: true });
  const name = arg('name', `${inputProps.screen}.${inputProps.fixture}.${inputProps.lang}`);
  const f = path.join(dir, `${name}.png`);
  await renderStill({ serveUrl, composition, frame: 0, output: f, scale: Number(arg('scale', '0.5')), inputProps });
  console.log(`✓ ${path.relative(repo, f)}`);
}

async function render() {
  const { renderMedia, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await serve();
  for (const lang of LANGS) {
    const k = key(lang);
    const inputProps = { tourKey: k, spec: null, scenes: [], mode: 'tour' };
    const composition = await selectComposition({ serveUrl, id: 'Tour', inputProps });
    const spec = composition.props.spec;
    if (spec.silent && !flag('allow-silent')) die(`${k}: o build é --silent (sem voz) — rode build + voice antes de renderizar (ou --allow-silent pra um rascunho)`);
    // legenda nova sobre voz velha: fala cujo texto não é o que a voz leu e passou no QA
    const tourPending = spec.silent ? [] : pendingLines(pubDir(k), spec.lines);
    if (tourPending.length) die(`${k}: fala sem voz em dia (${tourPending.map((l) => l.id).join(', ')}) — node scripts/tour.mjs voice --tour ${tourName} --lang ${lang}`);
    // a régua da mão e do título (TOUR.md) barra o render; --allow-motion só pra rascunho
    if (reportMotion(k, composition.props.motion) && !flag('allow-motion')) die(`${k}: o movimento quebra as regras da mão/título (acima) — corrija o motor ou o roteiro (ou --allow-motion pra um rascunho)`);
    const rev = Number(arg('rev', String(spec.rev)));
    const dir = outDir(k);
    fs.mkdirSync(path.join(dir, 'pub', 'doors'), { recursive: true });
    const full = path.join(dir, 'video.mp4');
    // com abertura, o filme é a composição Porta (a história do porquê emendada neste tutorial);
    // o audit do movimento acima continua sendo o do tutorial, que é onde a mão anda
    let film = { composition, inputProps };
    if (spec.introKey) {
      const ik = path.join(root, 'public', 'molde', spec.introKey);
      const [islug, iidea] = spec.introKey.split('.');
      // a abertura vem de outro roteiro (learning-drops/video-specs/<slug>.json): o render publicável
      // refaz o build dela aqui, pra nunca sair com cena/legenda velha (o build não grava voz)
      if (!spec.silent) node('molde.mjs', ['build', '--slug', islug, '--idea', iidea, '--lang', lang]);
      if (!fs.existsSync(path.join(ik, 'spec.json'))) die(`${k}: falta a abertura ${spec.introKey} — node scripts/molde.mjs build --slug ${islug} --idea ${iidea} (+ voice)`);
      const introSpec = readJson(path.join(ik, 'spec.json'));
      if (!spec.silent && (introSpec.silent || !fs.existsSync(path.join(ik, 'timings.json'))))
        die(`${k}: a abertura ${spec.introKey} está sem voz — node scripts/molde.mjs build --slug ${islug} --idea ${iidea} (sem --silent) + voice`);
      const introPending = spec.silent ? [] : pendingLines(ik, introSpec.lines);
      if (introPending.length) die(`${k}: a abertura tem fala sem voz em dia (${introPending.map((l) => l.id).join(', ')}) — node scripts/molde.mjs voice --slug ${islug} --idea ${iidea} --lang ${lang}`);
      const props = { introKey: spec.introKey, tourKey: k };
      film = { composition: await selectComposition({ serveUrl, id: 'Porta', inputProps: props }), inputProps: props };
      console.log(`· ${k}: abertura ${spec.introKey} + tutorial = ${(film.composition.durationInFrames / 30).toFixed(1)} s`);
    }
    let shown = -1;
    await renderMedia({
      serveUrl,
      composition: film.composition,
      codec: 'h264',
      outputLocation: full,
      inputProps: film.inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 10) * 10;
        if (pct !== shown) process.stdout.write(`${(shown = pct)}% `);
      },
    });
    console.log('');
    // versão do app: 720p, AAC 96k, faststart (a mesma do molde)
    const name = `${spec.file}.${lang}.r${rev}${spec.silent ? '.silent' : ''}`;
    const mp4 = path.join(dir, 'pub', 'doors', `${name}.mp4`);
    const poster = path.join(dir, 'pub', 'doors', `${name}.poster.webp`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', full, '-vf', 'scale=720:1280', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', mp4]);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(spec.posterAt ?? 1.2), '-i', mp4, '-frames:v', '1', '-vf', 'scale=720:-1', '-c:v', 'libwebp', '-quality', '82', poster]);
    const secs = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
    const video = { path: `doors/${name}.mp4`, duration_seconds: Math.round(secs), poster: `doors/${name}.poster.webp`, producer: 'remotion-tour' };
    fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ ...video, local: path.relative(repo, mp4), localPoster: path.relative(repo, poster), rev, silent: spec.silent }, null, 2));
    console.log(`✓ ${k}: ${secs.toFixed(1)} s · ${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB · ${video.path}`);
  }
}

// ------------------------------------------------------------------ upload (do checkout principal, como o molde)
function upload() {
  const mainRoot = () => {
    try {
      return path.dirname(execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repo }).toString().trim());
    } catch {
      return repo;
    }
  };
  const supa = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'supabase', 'supabase.exe') : 'supabase';
  const bin = fs.existsSync(supa) ? supa : 'supabase';
  for (const lang of LANGS) {
    const k = key(lang);
    const vj = path.join(outDir(k), 'video.json');
    if (!fs.existsSync(vj)) die(`${k}: rode render antes`);
    const v = readJson(vj);
    if (v.silent) die(`${k}: o render é sem voz — não sobe`);
    const rev = Number(arg('rev', String(v.rev)));
    if (v.rev !== rev) die(`${k}: o render é r${v.rev}, não r${rev}`);
    const linked = mainRoot();
    for (const [local, remote, type] of [[v.local, v.path, 'video/mp4'], [v.localPoster, v.poster, 'image/webp']]) {
      const rel = path.relative(linked, path.join(repo, local)).replace(/\\/g, '/');
      execFileSync(bin, ['storage', 'cp', `./${rel}`, `ss:///learning-media/${remote}`, '--content-type', type, '--cache-control', 'public, max-age=31536000, immutable', '--experimental', '--linked'], { cwd: linked, stdio: 'inherit' });
    }
    console.log(`✓ ${k}: no bucket (${BUCKET_URL}/${v.path})`);
  }
}

// ------------------------------------------------------------------ main
if (step === 'replica') await replica();
else {
  const ctx = load();
  if (step === 'lint') console.log(`✓ roteiro ok: ${tourName} (${LANGS.map((l) => `${l} ~${ctx.est[l].toFixed(0)} s`).join(' · ')})`);
  else if (step === 'build') build(ctx);
  else if (step === 'voice') voice();
  else if (step === 'stills') await stills();
  else if (step === 'frames') await frames();
  else if (step === 'render') await render();
  else if (step === 'upload') upload();
  else if (step === 'all') {
    build(ctx);
    if (!SILENT) voice();
    await stills();
    await render();
  } else die(`passo desconhecido: ${step}`);
}
