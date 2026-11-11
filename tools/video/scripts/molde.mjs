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
// --voz-de [tag] (fase 3): o piloto reaproveita a voz APROVADA — o build copia mp3, voiced.json,
// timings.json e pauses.json da chave de verdade (sem valor, ou "real") ou da chave de outro piloto
// (--voz-de <outra-tag>) pra chave do piloto. A fala que o piloto não mudou fica "voz em dia" e as
// deixas caem nas pausas medidas; a que mudou aparece como "voz a gravar". Rode build → stills →
// render; voice no piloto regravaria (e pagaria) as falas mudadas.
const vozDe = (() => {
  const i = argv.indexOf('--voz-de');
  if (i < 0) return null;
  const v = argv[i + 1];
  return !v || v.startsWith('--') || v === 'real' ? '' : v;
})();
if (vozDe !== null && !tag) {
  console.error('✗ --voz-de é do piloto (--tag): a chave de verdade já tem a voz dela');
  process.exit(1);
}
if (vozDe !== null && vozDe === tag) {
  console.error(`✗ --voz-de ${vozDe}: é a própria chave do piloto`);
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
/** A chave de onde o piloto puxa a voz (--voz-de): a de verdade, ou a de outro piloto. */
const vozKey = (idea, lang) => `${slug}.${idea}${vozDe ? `-${vozDe}` : ''}.${lang}`;
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
// fase 3: `ate` (fim de ação/run), `cresce`/`fecha`/`toque` (lente), `quebra` (partículas), `divide` (corpo)
const CUE_KEYS = ['cue', 'turn', 'from', 'until', 'at', 'win', 'glow', 'out', 'arrives', 'leaves', 'semana', 'ate', 'cresce', 'quebra', 'fecha', 'divide', 'toque'];
// `fim: "cena"` (2026-11-10, André): sem o card no fim — ele é coletado na tela do app, ao fim da ideia; o
// vídeo usa o tempo do card pra conteúdo (perto de 60 s de fala) e fecha na ação do verso, demonstrada
const LIMITS = { caption: 150, kicker: 24, label: 22, chip: 30, pill: 22, bloco: 16, lines: [4, 8], seconds: 58, bridgeLines: [2, 4], bridgeSeconds: 24, semCardLines: [6, 12], semCardSeconds: 70 };

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
  const max = l.scene === 'cena' && p.plano === 'fechado' ? catalog.objectsMax.cenaFechado : l.scene === 'cena' && p.ambiente ? catalog.objectsMax.cenaAmbiente : catalog.objectsMax[l.scene];
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

// ------------------------------------------------------------------ lint da fase 3
// MOLDE.md, "Fase 3". ERRO = o que quebraria o render, cortaria em silêncio ou fere a régua do
// parceiro: texto de tela que a voz não diz, deixas das listas novas, energia como carga (na fase 3),
// acoes / faz / dentro / lente / reserva fora do contrato. AVISO = gosto de roteiro: palco vazio,
// mesma cara, pessoa parada, a ação que não cabe até a próxima deixa (regras 1–4/13/14 do desenho).
const MOODS = ['ok', 'feliz', 'cansado', 'focado'];
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const isPiece = (name) => typeof name === 'string' && (catalog.pieces.includes(name) || (name.startsWith('ion:') && name.slice(4) in ions));
/** texto de tela comparado com a fala: sem acento, maiúscula, asterisco nem pontuação */
const TELA = (s) => fold(plain(String(s))).replace(/[.,;:!?…"“”'‘’()«»\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
const ENERGIA = new RegExp(`^(${catalog.energiaProibida.join('|')})`);
/** cenas que enchem a tela sozinhas (não precisam de lugar, não contam como "pessoa parada") */
const TELA_CHEIA = ['mapa', 'caderno', 'comparar', 'multidao', 'verso'];
/** cenas com a protagonista de pé num lugar */
const COM_LUGAR = ['pessoa', 'lista', 'cena', 'pensa', 'virada', 'semana', 'faz'];
/** Segundos estimados da fala até o caractere `i` (mesma régua do build --silent). */
const tempoAte = (text, i, lang) => {
  const head = text.slice(0, Math.max(0, i));
  return head.length / (lang === 'en' ? 15.5 : 14.5) + (head.match(/[.!?:](\s|$)/g) ?? []).length * 0.35 + (head.match(/,/g) ?? []).length * 0.15;
};
/** Onde a deixa cai na fala (índice no texto falado; se ela só estiver na legenda, proporcional). */
const posDe = (l, phrase) => {
  const spoken = plain(l.say ?? l.caption ?? '');
  const i = spoken.indexOf(phrase);
  if (i >= 0) return i;
  const cap = plain(l.caption ?? '');
  const j = cap.indexOf(phrase);
  return j < 0 ? -1 : Math.round((j / Math.max(1, cap.length)) * spoken.length);
};
/** Quadros de uma rep (catalog.acaoQuadros = espelho de CICLO em src/elenco/acao.tsx; o scenes.tsx confere). */
const quadrosDe = (a) => {
  const q = catalog.acaoQuadros[a.acao];
  return q ? (a.ritmo === 'lento' ? q.lento : a.ritmo === 'rapido' ? q.rapido : q.n) : 0;
};

/** Todo texto de tela novo da fala (rótulos, passos, regiões, camadas, partículas, reserva). */
const rotulosDe = (p) => {
  const out = [];
  for (const r of p.rotulos ?? []) out.push(['rotulos', r?.text]);
  for (const x of p.passos ?? []) if (x?.rotulo !== undefined) out.push(['passos', x.rotulo]);
  for (const x of p.regioes ?? []) if (x?.rotulo !== undefined) out.push(['regioes', x.rotulo]);
  const c = p.lente?.conteudo ?? {};
  for (const k of c.camadas ?? []) if (k?.rotulo) out.push(['camadas', k.rotulo.text]);
  if (c.particulas?.rotulo) out.push(['particulas', c.particulas.rotulo.text]);
  if (c.particulas?.destaque?.rotulo !== undefined) out.push(['destaque', c.particulas.destaque.rotulo]);
  if (c.reserva?.rotulo) out.push(['reserva', c.reserva.rotulo.text]);
  if (p.reserva?.rotulo) out.push(['reserva', p.reserva.rotulo.text]);
  return out;
};

/** Os nomes de ícone da fala (peças e ícones de chip/bloco), sem o prefixo ion:. */
const iconesDe = (p) =>
  [
    p.gives, p.holding, p.thought, p.left?.object, p.right?.object, p.pill?.p,
    ...(p.objects ?? []).map((o) => o?.p), ...(p.acoes ?? []).map((a) => a?.peca), ...(p.passos ?? []).map((a) => a?.peca),
    ...[...(p.chips ?? []), ...(p.items ?? [])].map((c) => c?.icon), ...(p.blocks ?? []).flatMap((b) => [b?.icon, b?.then?.icon]),
  ]
    .filter((x) => typeof x === 'string')
    .map((x) => x.replace(/^ion:/, ''));

/**
 * Uma lista de ações (`acoes` da cena ou `passos` do faz). `ctx.holding` = a peça da cena; `ctx.nextAmb`
 * = o lugar da fala seguinte (o `para` fora do quadro só vale antes de trocar de lugar).
 */
function lintAcoes(where, l, list, what, ctx, lang, errors, warns) {
  const id = l.id;
  if (!Array.isArray(list) || !list.length) return errors.push(where(id, `${what}: lista vazia (sem ${what}, a cena sai como antes)`));
  const spoken = plain(l.say ?? l.caption ?? '');
  let lastPos = -1;
  for (const [i, a] of list.entries()) {
    const t = `${what}[${i}]`;
    if (!a || typeof a !== 'object') {
      errors.push(where(id, `${t}: precisa de { acao }`));
      continue;
    }
    if (!catalog.acoes.includes(a.acao)) errors.push(where(id, `${t}: acao "${a.acao}" não existe (${catalog.acoes.join(', ')})`));
    if (a.reps !== undefined && !isInt(a.reps, 1, 4)) errors.push(where(id, `${t}: reps ${a.reps} (inteiro de 1 a 4)`));
    if (a.ritmo !== undefined && !catalog.ritmos.includes(a.ritmo)) errors.push(where(id, `${t}: ritmo "${a.ritmo}" (${catalog.ritmos.join(', ')})`));
    const anda = a.acao === 'andar' || a.acao === 'correr';
    if ((a.de !== undefined || a.para !== undefined) && !anda) errors.push(where(id, `${t}: de/para só em andar e correr (${a.acao} acontece no lugar)`));
    if (a.de !== undefined && !(isNum(a.de) && a.de >= 0 && a.de <= 1080)) errors.push(where(id, `${t}: de ${a.de} (x na tela, de 0 a 1080)`));
    if (a.para !== undefined) {
      if (!(isNum(a.para) && a.para >= -200 && a.para <= 1280)) errors.push(where(id, `${t}: para ${a.para} (x na tela, de -200 a 1280)`));
      else if ((a.para < 0 || a.para > 1080) && ctx.nextAmb === ctx.amb)
        warns.push(where(id, `${t}: para ${a.para} sai do quadro — só vale antes de uma troca de ambiente (a fala seguinte está no mesmo lugar)`));
    }
    // correr de frente atravessando o quadro lê "deslizando" (crítica): o `para` do correr é o "vem pra câmera"
    if (a.acao === 'correr' && isNum(a.para) && Math.abs(a.para - (a.de ?? 540)) > 40)
      warns.push(where(id, `${t}: correr não atravessa o quadro de lado (de frente, lê "deslizando") — o para liga o "vem pra câmera" (até a escala 1,25 na cena) e o de só ancora o x; trajeto de lado é do andar`));
    if ((a.acao === 'mexer' || a.acao === 'beber') && !(a.peca || ctx.holding || list.slice(0, i).some((b) => b?.peca && b.acao !== 'levantar')))
      errors.push(where(id, `${t}: ${a.acao} pede peça na mão (holding da cena ou peca da ação) — não se bebe de mão vazia`));
    if (a.acao === 'levantar' && a.peca && a.peca !== 'peso') warns.push(where(id, `${t}: levantar com "${a.peca}" — o halter é o peso, nas duas mãos`));
    if (i > 0 && !a.cue) {
      if (ctx.faz) errors.push(where(id, `${t}: só o 1º passo pode não ter cue (os outros entram na deixa)`));
      else warns.push(where(id, `${t}: sem cue — entra logo depois da anterior`));
    }
    // as deixas seguem a ordem da fala; `ate` vem depois do `cue`
    if (typeof a.cue === 'string') {
      const pos = posDe(l, a.cue);
      if (pos >= 0 && pos < lastPos) errors.push(where(id, `${t}: a deixa "${a.cue}" vem antes da deixa da ação anterior na fala (as ações seguem a ordem da fala)`));
      if (pos >= 0) lastPos = pos;
      if (typeof a.ate === 'string' && posDe(l, a.ate) >= 0 && posDe(l, a.ate) <= pos) errors.push(where(id, `${t}: ate "${a.ate}" vem antes (ou junto) do cue "${a.cue}"`));
    }
    // a ação sem laço (saltar, levantar, beber) cabe até a próxima deixa — ou é cortada no meio (crítica, efforts2)
    const q = catalog.acaoQuadros[a.acao];
    if (q && !q.laco) {
      const ini = a.cue ? posDe(l, a.cue) : 0;
      const nxt = list.slice(i + 1).find((b) => typeof b?.cue === 'string' && posDe(l, b.cue) > ini);
      const fimPos = typeof a.ate === 'string' ? posDe(l, a.ate) : nxt ? posDe(l, nxt.cue) : -1;
      if (ini >= 0) {
        const tIni = tempoAte(spoken, ini, lang);
        const tFim = fimPos >= 0 ? tempoAte(spoken, fimPos, lang) : tempoAte(spoken, spoken.length, lang) + (l.hold ?? 0);
        const dur = (quadrosDe(a) * (a.reps ?? 1)) / 30;
        if (dur > tFim - tIni + 0.1)
          warns.push(where(id, `${t}: ${a.acao} × ${a.reps ?? 1} dura ~${dur.toFixed(1)} s e só tem ~${Math.max(0, tFim - tIni).toFixed(1)} s até ${fimPos >= 0 ? 'a próxima deixa' : 'o fim da fala'} (ritmo "rapido", menos reps ou hold)`));
      }
    }
  }
}

/** O tanque (dentro → reserva, e lente → conteudo.reserva). */
function lintReserva(where, id, r, what, errors) {
  if (!r || typeof r !== 'object') return errors.push(where(id, `${what} precisa de { nivel: [{ v }] }`));
  if (r.conteudo !== undefined && !catalog.conteudos.includes(r.conteudo)) errors.push(where(id, `${what}.conteudo "${r.conteudo}" (${catalog.conteudos.join(', ')})`));
  if (!Array.isArray(r.nivel) || !r.nivel.length) errors.push(where(id, `${what}.nivel: pelo menos um { v } (0 a 1)`));
  else {
    for (const [i, n] of r.nivel.entries()) if (!(isNum(n?.v) && n.v >= 0 && n.v <= 1)) errors.push(where(id, `${what}.nivel[${i}].v ${n?.v} (de 0 a 1)`));
    if (r.nivel[0]?.cue) errors.push(where(id, `${what}.nivel[0] não tem cue (é o nível de quando o tanque aparece)`));
  }
  for (const k of ['gasta', 'pinga']) if (r[k] !== undefined && !(Array.isArray(r[k]) && r[k].every((x) => typeof x?.cue === 'string'))) errors.push(where(id, `${what}.${k}: lista de { cue }`));
}

/** A lente (dentro e cena). */
function lintLente(where, l, p, errors, warns) {
  const id = l.id;
  const L = p.lente;
  if (!L || typeof L !== 'object') return errors.push(where(id, 'lente precisa de { sobre, conteudo }'));
  const sobres = [...catalog.regioes, 'peca'];
  if (!sobres.includes(L.sobre)) errors.push(where(id, `lente.sobre "${L.sobre}" não existe (${sobres.join(', ')})`));
  if (L.tamanho !== undefined && !catalog.tamanhos.includes(L.tamanho)) errors.push(where(id, `lente.tamanho "${L.tamanho}" (${catalog.tamanhos.join(', ')})`));
  if (l.scene === 'cena') {
    if (L.cresce) errors.push(where(id, 'lente.cresce só no dentro (na cena a lente é callout)'));
    if (L.tamanho && L.tamanho !== 'callout') errors.push(where(id, `lente.tamanho "${L.tamanho}" na cena: só callout`));
    if (!['mesa', 'chao'].includes(p.setting ?? 'chao')) errors.push(where(id, `lente na cena só com setting mesa ou chao (não ${p.setting})`));
  }
  if (L.sobre === 'peca' && !(p.holding || (p.acoes ?? []).some((a) => a?.peca))) errors.push(where(id, 'lente.sobre "peca" pede holding (ou uma ação com peca): a lente nasce da peça da mão'));
  const c = L.conteudo;
  if (!c || typeof c !== 'object') return errors.push(where(id, 'lente.conteudo: { camadas: [...] } ou { reserva: {...} }'));
  if (c.reserva && c.camadas) errors.push(where(id, 'lente.conteudo: camadas OU reserva, não os dois'));
  if (c.reserva) return lintReserva(where, id, c.reserva, 'lente.conteudo.reserva', errors);
  const cam = c.camadas;
  if (!Array.isArray(cam) || cam.length < 1 || cam.length > 3) return errors.push(where(id, 'lente.conteudo.camadas: de 1 a 3 camadas'));
  for (const [i, k] of cam.entries()) {
    const t = `camadas[${i}]`;
    if (!catalog.texturas.includes(k?.textura)) errors.push(where(id, `${t}: textura "${k?.textura}" (${catalog.texturas.join(', ')})`));
    if (k?.tom !== undefined && !catalog.tons.includes(k.tom)) errors.push(where(id, `${t}: tom "${k.tom}" (${catalog.tons.join(', ')})`));
    if (k?.peso !== undefined && !isInt(k.peso, 1, 3)) errors.push(where(id, `${t}: peso ${k.peso} (1, 2 ou 3)`));
    if (k?.then !== undefined && !catalog.thens.includes(k.then)) errors.push(where(id, `${t}: then "${k.then}" (${catalog.thens.join(', ')})`));
    if (k?.rotulo !== undefined && !(typeof k.rotulo?.text === 'string' && typeof k.rotulo?.cue === 'string')) errors.push(where(id, `${t}.rotulo: { text, cue }`));
  }
  if (L.turn && !cam.some((k) => k?.then)) warns.push(where(id, 'lente.turn sem camada com then: nada muda na deixa'));
  if (c.ritmo !== undefined && !catalog.ritmosLente.includes(c.ritmo)) errors.push(where(id, `lente.conteudo.ritmo "${c.ritmo}" (${catalog.ritmosLente.join(', ')})`));
  const pt = c.particulas;
  if (pt === undefined) return;
  if (!catalog.formas.includes(pt?.forma)) errors.push(where(id, `particulas.forma "${pt?.forma}" (${catalog.formas.join(', ')})`));
  const cores = pt?.cor === undefined ? [] : Array.isArray(pt.cor) ? pt.cor : [pt.cor];
  for (const x of cores) if (!catalog.cores.includes(x)) errors.push(where(id, `particulas.cor "${x}" (${catalog.cores.join(', ')}; ou uma lista delas)`));
  if (pt?.n !== undefined && !isInt(pt.n, 6, 24)) errors.push(where(id, `particulas.n ${pt.n} (inteiro de 6 a 24)`));
  if (pt?.de !== undefined && pt.de !== 'topo' && !isInt(pt.de, 0, cam.length - 1)) errors.push(where(id, `particulas.de ${pt.de} ("topo" ou o índice de uma camada, 0 a ${cam.length - 1})`));
  if (pt?.atravessa !== undefined) {
    // atravessar a parede pede uma banda embaixo dela
    if (!isInt(pt.atravessa?.camada, 0, cam.length - 2)) errors.push(where(id, `particulas.atravessa.camada ${pt.atravessa?.camada} (a camada que elas atravessam precisa de outra embaixo: 0 a ${cam.length - 2})`));
    if (typeof pt.atravessa?.cue !== 'string') errors.push(where(id, 'particulas.atravessa precisa de cue'));
  }
  if (pt?.destaque !== undefined && !(typeof pt.destaque?.cue === 'string' && typeof pt.destaque?.rotulo === 'string')) errors.push(where(id, 'particulas.destaque: { cue, rotulo }'));
  if (pt?.forma === 'ponto' && (pt.quebra || pt.atravessa || pt.correnteza)) warns.push(where(id, 'particulas: quebra/atravessa/correnteza são do cordão (os pontos ignoram)'));
  if (pt?.forma === 'cordao' && (pt.destaque || pt.boiam)) warns.push(where(id, 'particulas: destaque/boiam são dos pontos (o cordão ignora)'));
}

/** Cena dentro (corpo de vidro ou lupa). */
function lintDentro(where, l, p, errors, warns) {
  const id = l.id;
  const plano = p.plano ?? 'corpo';
  if (!['corpo', 'lupa'].includes(plano)) return errors.push(where(id, `dentro: plano "${plano}" (corpo ou lupa)`));
  const corpo = ['fluxos', 'divide', 'regioes', 'origem', 'reserva'].filter((k) => p[k] !== undefined);
  if (p.pessoa !== undefined && !catalog.pessoas.includes(p.pessoa)) errors.push(where(id, `pessoa "${p.pessoa}" (${catalog.pessoas.join(', ')})`));
  if (plano === 'corpo') {
    if (p.pessoa !== undefined) errors.push(where(id, 'dentro (corpo) não aceita pessoa: canto/grande é de onde ela fica no plano lupa'));
    if (p.ambiente) errors.push(where(id, 'dentro (corpo) não aceita ambiente: o corpo de vidro enche a tela'));
    if (p.holding) errors.push(where(id, 'dentro (corpo) não aceita holding'));
    if (p.acoes) errors.push(where(id, 'dentro (corpo) não aceita acoes (ela fica de frente, de vidro): acoes são do plano lupa'));
    if (!corpo.length && !p.lente) warns.push(where(id, 'dentro (corpo) sem fluxos, regioes, lente nem reserva: o corpo de vidro fica vazio'));
  } else {
    if (!p.ambiente) errors.push(where(id, 'dentro (lupa) precisa de ambiente (ela no lugar, a lente sobre ela)'));
    if (!p.lente) errors.push(where(id, 'dentro (lupa) precisa de lente'));
    if (corpo.length) errors.push(where(id, `dentro (lupa): ${corpo.join(', ')} são do plano corpo`));
  }
  if (p.origem !== undefined && !catalog.origens.includes(p.origem)) errors.push(where(id, `origem "${p.origem}" (${catalog.origens.join(', ')})`));
  if (p.fluxos !== undefined) {
    if (!Array.isArray(p.fluxos) || p.fluxos.length < 1 || p.fluxos.length > 3) errors.push(where(id, 'fluxos: de 1 a 3'));
    else
      for (const [i, f] of p.fluxos.entries()) {
        if (!catalog.regioes.includes(f?.para)) errors.push(where(id, `fluxos[${i}].para "${f?.para}" (${catalog.regioes.join(', ')})`));
        if (f?.cor !== undefined && !catalog.cores.includes(f.cor)) errors.push(where(id, `fluxos[${i}].cor "${f.cor}" (${catalog.cores.join(', ')})`));
        if (f?.particula !== undefined && !catalog.particula.includes(f.particula)) errors.push(where(id, `fluxos[${i}].particula "${f.particula}" (${catalog.particula.join(', ')})`));
      }
  }
  if (p.divide !== undefined && !((p.fluxos ?? []).length >= 2)) errors.push(where(id, 'divide pede 2 fluxos ou mais (o fio único se abre num caminho por fluxo)'));
  if (p.regioes !== undefined) {
    if (!Array.isArray(p.regioes) || p.regioes.length > 3) errors.push(where(id, 'regioes: no máximo 3'));
    else
      for (const [i, r] of p.regioes.entries()) {
        if (!catalog.regioes.includes(r?.parte)) errors.push(where(id, `regioes[${i}].parte "${r?.parte}" (${catalog.regioes.join(', ')})`));
        if (typeof r?.cue !== 'string') errors.push(where(id, `regioes[${i}] precisa de cue (a região acende na deixa)`));
        if (r?.efeito !== undefined && !catalog.efeitos.includes(r.efeito)) errors.push(where(id, `regioes[${i}].efeito "${r.efeito}" (${catalog.efeitos.join(', ')})`));
        if (r?.cor !== undefined && !catalog.cores.includes(r.cor)) errors.push(where(id, `regioes[${i}].cor "${r.cor}" (${catalog.cores.join(', ')})`));
      }
  }
  if (p.reserva !== undefined) lintReserva(where, id, p.reserva, 'reserva', errors);
}

/** Cena faz: a pessoa fazendo em passos, o medidor e o elenco. */
function lintFaz(where, l, p, ctx, lang, errors, warns) {
  const id = l.id;
  const passos = p.passos;
  const [lo, hi] = catalog.faz.passos;
  if (!Array.isArray(passos) || passos.length < lo || passos.length > hi) errors.push(where(id, `faz precisa de ${lo} a ${hi} passos`));
  if (Array.isArray(passos) && passos.length) lintAcoes(where, l, passos, 'passos', { ...ctx, faz: true }, lang, errors, warns);
  if (p.acoes) errors.push(where(id, 'faz usa passos, não acoes'));
  const elenco = p.elenco ?? [];
  if (!Array.isArray(elenco) || elenco.length > catalog.faz.elenco) errors.push(where(id, `elenco: no máximo ${catalog.faz.elenco} figurantes`));
  else {
    const herX = passos?.[0]?.de ?? 540;
    const herSize = elenco.length ? 360 : 400;
    const seen = new Map();
    for (const [i, e] of elenco.entries()) {
      const t = `elenco[${i}]`;
      if (!isInt(e?.seed, 0, 50)) errors.push(where(id, `${t}: seed ${e?.seed} (inteiro)`));
      if (!(isNum(e?.x) && e.x >= 0 && e.x <= 1080)) errors.push(where(id, `${t}: x ${e?.x} (de 0 a 1080)`));
      if (!catalog.acoes.includes(e?.acao)) errors.push(where(id, `${t}: acao "${e?.acao}" (${catalog.acoes.join(', ')})`));
      if (typeof e?.cue !== 'string') errors.push(where(id, `${t} precisa de cue (o figurante entra na deixa)`));
      if (e?.size !== undefined && !(isNum(e.size) && e.size >= catalog.faz.elencoSize)) errors.push(where(id, `${t}: size ${e.size} (≥ ${catalog.faz.elencoSize}: nada pequeno na tela)`));
      if (e?.para !== undefined && e.acao !== 'andar') errors.push(where(id, `${t}: para só no andar`));
      // rodada 2: reps (sem: saltar/levantar repetem em laço até o ate) e ritmo, como nos passos
      if (e?.reps !== undefined && !isInt(e.reps, 1, 4)) errors.push(where(id, `${t}: reps ${e.reps} (inteiro de 1 a 4; sem reps, saltar/levantar repetem até o ate)`));
      if (e?.ritmo !== undefined && !catalog.ritmos.includes(e.ritmo)) errors.push(where(id, `${t}: ritmo "${e.ritmo}" (${catalog.ritmos.join(', ')})`));
      // cada um num esforço diferente; ninguém correndo junto com ela (lê disputa); ninguém na caixa dela
      if (seen.has(e?.acao)) warns.push(where(id, `${t}: ${e.acao} de novo (elenco[${seen.get(e.acao)}] já faz) — cada figurante num esforço diferente`));
      else seen.set(e?.acao, i);
      if (e?.acao === 'correr' && passos?.some((x) => x?.acao === 'correr')) warns.push(where(id, `${t}: correndo junto com ela lê corrida/disputa — dê outro esforço`));
      if (isNum(e?.x) && Math.abs(e.x - herX) < (herSize + (e.size ?? 240)) / 2) warns.push(where(id, `${t}: x ${e.x} cruza a caixa dela (x ${herX}, ${herSize} px)`));
    }
  }
  const m = p.medidor;
  if (m !== undefined) {
    if (!(isNum(m?.nivel) && m.nivel >= 0 && m.nivel <= 1)) errors.push(where(id, `medidor.nivel ${m?.nivel} (de 0 a 1)`));
    if (m?.gasta !== undefined && !(isNum(m.gasta) && m.gasta > 0 && m.gasta <= 0.5)) errors.push(where(id, `medidor.gasta ${m.gasta} (o gole por passo: até 0,5)`));
    if (m?.lado !== undefined && !['esquerda', 'direita'].includes(m.lado)) errors.push(where(id, `medidor.lado "${m.lado}" (esquerda ou direita)`));
    const fim = (m?.nivel ?? 0) - (m?.gasta ?? catalog.faz.medidorGasta) * (passos?.length ?? 0);
    if (isNum(m?.nivel) && fim < catalog.faz.medidorPiso) errors.push(where(id, `medidor termina em ${fim.toFixed(2)} (nivel − gasta × passos ≥ ${catalog.faz.medidorPiso}: o tanque nunca chega perto do vazio)`));
  }
}

/** Tudo da fase 3 numa fala (as props já resolvidas no idioma). */
function lintFase3(where, l, lines, i, lang, fase3, errors, warns) {
  const id = l.id;
  const p = l.props ?? {};
  const spoken = TELA(l.say ?? l.caption ?? '');
  const cap = TELA(l.caption ?? '');
  // humor
  for (const k of ['mood', 'to']) if (p[k] !== undefined && !MOODS.includes(p[k])) errors.push(where(id, `${k} "${p[k]}" (${MOODS.join(', ')})`));
  // 5. texto de tela = fala
  const rot = rotulosDe(p);
  if (rot.length > catalog.rotulo.porFala) errors.push(where(id, `${rot.length} rótulos na fala (no máximo ${catalog.rotulo.porFala}: palavra demais vira slide)`));
  for (const [onde, text] of rot) {
    if (typeof text !== 'string' || !text.trim()) {
      errors.push(where(id, `rótulo sem texto (${onde})`));
      continue;
    }
    if (text.length > catalog.rotulo.max) errors.push(where(id, `rótulo longo: "${text}" (${text.length} > ${catalog.rotulo.max})`));
    const t = TELA(text);
    if (!spoken.includes(t) && !cap.includes(t)) errors.push(where(id, `rótulo "${text}" (${onde}) não está na fala — texto de tela é o que a voz diz`));
  }
  if (rot.length && l.scene === 'verso') errors.push(where(id, 'o verso não leva rótulo (o card já é o texto)'));
  for (const [j, r] of (p.rotulos ?? []).entries()) {
    if (typeof r?.cue !== 'string') errors.push(where(id, `rotulos[${j}] precisa de cue (a palavra se escreve quando a voz chega nela)`));
    if (r?.tom !== undefined && !catalog.tonsRotulo.includes(r.tom)) errors.push(where(id, `rotulos[${j}].tom "${r.tom}" (${catalog.tonsRotulo.join(', ')})`));
    if (r?.seta !== undefined && !(catalog.regioes.includes(r.seta) || (Array.isArray(r.seta) && r.seta.length === 2 && r.seta.every(isNum)))) errors.push(where(id, `rotulos[${j}].seta: uma região (${catalog.regioes.join(', ')}) ou [x, y]`));
    if (r?.x !== undefined && !(isNum(r.x) && r.x >= 0 && r.x <= 1080)) errors.push(where(id, `rotulos[${j}].x ${r.x} (0 a 1080)`));
    if (r?.y !== undefined && !(isNum(r.y) && r.y >= 280 && r.y <= 1360)) errors.push(where(id, `rotulos[${j}].y ${r.y} (o palco: 280 a 1360)`));
  }
  // 7. energia não se desenha como carga (régua do parceiro, lição da r2)
  for (const ic of iconesDe(p))
    if (ENERGIA.test(ic) && (fase3 || lang === LANGS[0])) (fase3 ? errors : warns).push(where(id, `"${ic}" desenha energia como carga (bateria, raio, chama, foguete…) — ${fase3 ? 'proibido na fase 3' : 'evite'}; mostre o mecanismo (o tanque, o corpo por dentro)`));
  // escopo das props novas
  const only = (keys, scenes, msg) => {
    for (const k of keys) if (p[k] !== undefined && !scenes.includes(l.scene)) errors.push(where(id, `${k} não existe na cena "${l.scene}" (${msg})`));
  };
  only(['acoes'], catalog.acaoScenes, `só ${catalog.acaoScenes.join(', ')}`);
  only(['lente'], ['cena', 'dentro'], 'só cena e dentro');
  only(['passos', 'medidor', 'elenco'], ['faz'], 'só faz');
  only(['fluxos', 'divide', 'regioes', 'origem', 'reserva'], ['dentro'], 'só dentro, plano corpo');
  only(['plano'], ['cena', 'dentro', 'pensa', 'faz'], 'cena, pensa e faz: fechado; dentro: corpo ou lupa');
  only(['pessoa'], ['dentro'], 'só dentro, plano lupa');
  if (l.scene === 'cena' && p.plano !== undefined) {
    if (p.plano !== 'fechado') errors.push(where(id, `plano "${p.plano}" na cena: só "fechado" (corpo e lupa são do dentro)`));
    else if ((p.setting ?? 'chao') !== 'mesa') errors.push(where(id, 'plano "fechado" só com setting mesa (o balcão, a pia): ela do peito pra cima'));
  }
  // pensa fechado (rodada 2): ela do peito pra cima atrás do balcão do lugar, o balão junto da cabeça
  if (l.scene === 'pensa' && p.plano !== undefined && p.plano !== 'fechado') errors.push(where(id, `plano "${p.plano}" no pensa: só "fechado"`));
  // faz fechado (acabamento): a câmera perto (zoom 1,35); o x do elenco passa a ser o x na tela
  if (l.scene === 'faz' && p.plano !== undefined && p.plano !== 'fechado') errors.push(where(id, `plano "${p.plano}" no faz: só "fechado"`));
  // run.casas (rodada 2): o calendário para nessa casa ("uns dias" = 4–7, "semanas" = 35)
  for (const [j, o] of (Array.isArray(p.objects) ? p.objects : []).entries()) {
    const casas = o?.run?.casas;
    if (casas === undefined) continue;
    if (o.p !== 'calendario') errors.push(where(id, `objects[${j}].run.casas só na peça calendario (é a casa onde ele para), não em "${o.p}"`));
    if (!isInt(casas, ...catalog.calendarioCasas)) errors.push(where(id, `objects[${j}].run.casas ${casas} (inteiro de ${catalog.calendarioCasas.join(' a ')})`));
  }
  // acabamento: `run` no relógio para os ponteiros numa hora só ("o mesmo horário"); deixa nele não anda nada
  for (const [j, o] of (Array.isArray(p.objects) ? p.objects : []).entries())
    if (o?.p === 'relogio' && o.run && (o.run.cue !== undefined || o.run.ate !== undefined))
      warns.push(where(id, `objects[${j}]: run no relogio só PARA os ponteiros (8 h, a fala inteira) — run.cue/run.ate não fazem nada aqui (use "run": {})`));
  // acabamento: a pessoa da frente do card do verso (sem, feliz de braços pra cima — como sempre)
  if (p.frente !== undefined) {
    if (l.scene !== 'verso') errors.push(where(id, `frente não existe na cena "${l.scene}" (só no verso: a pessoa da frente do card)`));
    if (!p.frente || typeof p.frente !== 'object' || Array.isArray(p.frente)) errors.push(where(id, 'frente precisa de { mood?, arms? }'));
    else {
      for (const k of Object.keys(p.frente)) if (!['mood', 'arms'].includes(k)) errors.push(where(id, `frente.${k} não existe (mood, arms)`));
      if (p.frente.mood !== undefined && !MOODS.includes(p.frente.mood)) errors.push(where(id, `frente.mood "${p.frente.mood}" (${MOODS.join(', ')})`));
      if (p.frente.arms !== undefined && !catalog.arms.includes(p.frente.arms)) errors.push(where(id, `frente.arms "${p.frente.arms}" (${catalog.arms.join(', ')})`));
    }
  }
  const nextAmb = lines[i + 1]?.props?.ambiente;
  const ctx = { holding: p.holding, amb: p.ambiente, nextAmb };
  if (p.acoes !== undefined) {
    if (l.scene === 'cena' && !['mesa', 'chao'].includes(p.setting ?? 'chao')) errors.push(where(id, `acoes na cena só com setting mesa ou chao (no ${p.setting} ela está sentada)`));
    lintAcoes(where, l, p.acoes, 'acoes', ctx, lang, errors, warns);
  }
  if (p.lente !== undefined && ['cena', 'dentro'].includes(l.scene)) lintLente(where, l, p, errors, warns);
  if (l.scene === 'dentro') lintDentro(where, l, p, errors, warns);
  if (l.scene === 'faz') lintFaz(where, l, p, ctx, lang, errors, warns);
  if (!fase3) return;
  // 1. palco vazio (aviso; o desenho previa erro — cortado nesta leva)
  if (COM_LUGAR.includes(l.scene) && !p.ambiente) warns.push(where(id, `palco vazio: dê um lugar (ambiente) ou use uma cena de tela cheia (${['dentro', ...TELA_CHEIA.filter((x) => x !== 'verso')].join(', ')})`));
}

/** Regras da ideia inteira na fase 3: mesma cara (2), pessoa parada (4), soco seguido (13). */
function lintIdeaFase3(ideaId, lines, lang, warns) {
  const falas = lines.filter((l) => l.scene !== 'verso');
  const amb = falas.map((l) => l.props?.ambiente).filter(Boolean);
  const conta = amb.reduce((m, a) => m.set(a, (m.get(a) ?? 0) + 1), new Map());
  for (const [a, n] of conta) if (n > falas.length * 0.6) warns.push(`${ideaId}/${lang}: mesma cara — ${a} em ${n} de ${falas.length} falas (no máximo 60%)`);
  const cheia = falas.some((l) => TELA_CHEIA.includes(l.scene) || (l.scene === 'dentro' && (l.props?.plano ?? 'corpo') === 'corpo'));
  if (conta.size < 2 && !(conta.size === 1 && cheia)) warns.push(`${ideaId}/${lang}: mesma cara — a ideia precisa de 2 lugares, ou 1 lugar e 1 cena de tela cheia (dentro, mapa, caderno, comparar)`);
  const parada = falas.filter((l) => {
    const p = l.props ?? {};
    return ['pessoa', 'cena', 'pensa', 'lista', 'virada', 'semana'].includes(l.scene) && !p.acoes?.length && !p.lente;
  });
  if (parada.length > 2) warns.push(`${ideaId}/${lang}: pessoa parada em ${parada.length} falas (${parada.map((l) => l.id).join(', ')}) — no máximo 2 sem acoes, passos, lente ou cena de dentro`);
}

/**
 * Mesma cara entre ideias do mesmo roteiro (regra 3 e crítica 1c), só entre as ideias na fase 3:
 * cada uma tem um lugar que nenhuma outra usa (a "assinatura"), e o mesmo plano (cena + peça na mão +
 * lugar + hora) não aparece em duas ideias.
 */
function lintSlugFase3(vs, ideaIds, warns) {
  const ids = ideaIds.filter((id) => ((vs.ideas[id].fase ?? vs.fase) ?? 0) >= 3);
  if (ids.length < 2) return;
  const lang = LANGS[0];
  const lines = Object.fromEntries(ids.map((id) => [id, vs.ideas[id].lines.map((raw) => resolveLine(raw, lang)).filter((l) => l.scene !== 'verso')]));
  const ambs = Object.fromEntries(ids.map((id) => [id, new Set(lines[id].map((l) => l.props?.ambiente).filter(Boolean))]));
  for (const id of ids) {
    const proprio = [...ambs[id]].filter((a) => ids.every((o) => o === id || !ambs[o].has(a)));
    if (!proprio.length) warns.push(`${id}: mesma cara — nenhum lugar só desta ideia (${[...ambs[id]].join(', ') || 'sem lugar'}); dê a ela uma assinatura`);
  }
  const plano = (l) => {
    const p = l.props ?? {};
    const mao = p.holding ?? (p.acoes ?? p.passos ?? []).find((a) => a?.peca)?.peca;
    return mao && p.ambiente ? `${l.scene} · ${mao} · ${p.ambiente} · ${p.hora ?? 'hora padrão'}` : null;
  };
  const visto = new Map();
  for (const id of ids)
    for (const l of lines[id]) {
      const k = plano(l);
      if (!k) continue;
      const prev = visto.get(k);
      if (prev && prev[0] !== id) warns.push(`${id}/${l.id}: mesma cara — o mesmo plano de ${prev[0]}/${prev[1]} (${k}); troque a hora, o lugar ou a peça`);
      else if (!prev) visto.set(k, [id, l.id]);
    }
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

function lintIdea(ideaId, spec, card, lang, errors, warns, root = {}) {
  const where = (l, m) => `${ideaId}/${lang}/${l}: ${m}`;
  const lines = spec.lines;
  if (!Array.isArray(lines) || !lines.length) return errors.push(`${ideaId}: sem lines`);
  // fase 3 (na ideia ou na raiz do roteiro): a régua nova — vinheta aberta, energia como carga é erro,
  // e os avisos de palco vazio / mesma cara / pessoa parada. Sem ela, o roteiro antigo passa como antes.
  const fase = spec.fase ?? root.fase;
  if (fase !== undefined && !isInt(fase, 1, 3)) errors.push(`${ideaId}: fase ${fase} (1, 2 ou 3)`);
  const fase3 = (fase ?? 0) >= 3;
  const prot = spec.protagonista;
  if (prot !== undefined) {
    if (!prot || !isInt(prot.seed, 0, 50)) errors.push(`${ideaId}: protagonista.seed ${prot?.seed} (inteiro: a pessoa do elenco)`);
    if (prot?.skin !== undefined && !/^#[0-9a-f]{6}$/i.test(prot.skin)) errors.push(`${ideaId}: protagonista.skin "${prot.skin}" (cor #rrggbb)`);
    // crítica: pele escura justo no gancho mais "derrotado" não (a pessoa de pele escura nunca no lado que perde)
    if (['#8D5A3B', '#5C3A24'].includes(String(prot?.skin).toUpperCase()) && resolveLine(lines[0], lang).props?.mood === 'cansado' && lang === LANGS[0])
      warns.push(`${ideaId}: protagonista de pele escura num gancho "cansado" — escolha outra ideia pra ela (régua do parceiro)`);
  }
  const resolved = lines.map((raw) => resolveLine(raw, lang));
  // abertura de porta (bridge "tour"): a história do porquê que emenda no tutorial da tela, sem verso
  const bridge = spec.bridge === 'tour';
  const semCard = spec.fim === 'cena';
  const range = bridge ? LIMITS.bridgeLines : semCard ? LIMITS.semCardLines : LIMITS.lines;
  if (spec.bridge !== undefined && !bridge) errors.push(`${ideaId}: bridge "${spec.bridge}" (só "tour")`);
  if (spec.fim !== undefined && !semCard) errors.push(`${ideaId}: fim "${spec.fim}" (só "cena")`);
  if (semCard && lines.some((l) => l.scene === 'verso')) errors.push(`${ideaId}: fim "cena" não tem verso (o card é coletado na tela do app)`);
  if (lines.length < range[0] || lines.length > range[1]) errors.push(`${ideaId}: ${lines.length} falas (faixa ${range.join('–')})`);
  const last = lines[lines.length - 1];
  if (bridge && lines.some((l) => l.scene === 'verso')) errors.push(`${ideaId}: abertura de porta não tem verso (ela emenda na tela: tools/video/TOUR.md)`);
  if (!bridge && !semCard && last.scene !== 'verso') errors.push(`${ideaId}: a última cena tem que ser "verso" (a voz lê o card)`);
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
    const l = resolved[i];
    if (!l.id || ids.has(l.id)) errors.push(where(l.id, 'id vazio ou repetido'));
    ids.add(l.id);
    if (!catalog.scenes.includes(l.scene)) errors.push(where(l.id, `cena "${l.scene}" não existe (${catalog.scenes.join(', ')})`));
    lintStage(where, l, i, errors, warns);
    lintFase3(where, l, resolved, i, lang, fase3, errors, warns);
    // 13. soco de câmera em duas falas seguidas (MOLDE.md, densidade): o segundo não conta
    const soco = (x) => x?.props?.camera?.move === 'push' && x.props.camera.cue;
    if (i > 0 && soco(l) && soco(resolved[i - 1])) warns.push(where(l.id, `push com deixa logo depois do de ${resolved[i - 1].id}: dois socos seguidos, o segundo não conta`));
    // 14. pele escura no lado que perde: a outra pessoa do comparar tem pele escura até a fase 3
    if (l.scene === 'comparar' && !fase3 && lang === LANGS[0]) warns.push(where(l.id, 'comparar: a outra pessoa (o lado que perde) sai com pele escura — com "fase": 3 ela sai com pele clara (régua do parceiro)'));
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
      ...(l.props?.blocks ?? []).map((b) => b.label), ...(l.props?.heads ?? []), ...rotulosDe(l.props ?? {}).map(([, t]) => t)].filter((x) => typeof x === 'string' && x);
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
    const pieces = [p.gives, p.holding, p.thought, p.left?.object, p.right?.object, p.pill?.p, ...(p.objects ?? []).map((o) => o.p), ...(p.acoes ?? []).map((a) => a?.peca), ...(p.passos ?? []).map((a) => a?.peca)].filter(Boolean);
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
  if (fase3) lintIdeaFase3(ideaId, resolved, lang, warns);
  const est = chars / (lang === 'en' ? 15.5 : 14.5) + extra + lines.length * 0.6;
  const cap = bridge ? LIMITS.bridgeSeconds : semCard ? LIMITS.semCardSeconds : LIMITS.seconds;
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
    for (const lang of LANGS) lintIdea(id, vs.ideas[id], card, lang, errors, warns, vs);
  }
  lintSlugFase3(vs, ideaIds, warns);
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

/**
 * --voz-de: copia a voz de `from` (chave da voz aprovada) pra `to` (a chave do piloto) — os mp3 das
 * falas que o piloto tem, voiced.json (o texto que cada tomada leu e passou no QA), timings.json e
 * pauses.json. Sobrescreve a voz que o piloto tinha (é o que a flag pede).
 */
function copiaVoz(from, to, lines) {
  const src = pubDir(from);
  const dst = pubDir(to);
  if (!fs.existsSync(path.join(src, 'timings.json'))) die(`--voz-de: ${from} não tem voz gravada (sem timings.json em ${path.relative(repo, src)})`);
  let n = 0;
  for (const l of lines) {
    const f = path.join(src, `${l.id}.mp3`);
    if (fs.existsSync(f)) {
      fs.copyFileSync(f, path.join(dst, `${l.id}.mp3`));
      n++;
    }
  }
  for (const f of ['timings.json', 'pauses.json']) if (fs.existsSync(path.join(src, f))) fs.copyFileSync(path.join(src, f), path.join(dst, f));
  // voiced.json: o texto que cada tomada leu. Chave anterior ao voiced.json (a régua antiga): sai do
  // spec dela — toda fala com mp3 que não estava na fila (changed.json) leu o texto daquele spec
  if (fs.existsSync(path.join(src, 'voiced.json'))) fs.copyFileSync(path.join(src, 'voiced.json'), path.join(dst, 'voiced.json'));
  else {
    const spec = fs.existsSync(path.join(src, 'spec.json')) ? readJson(path.join(src, 'spec.json')) : null;
    if (!spec) die(`--voz-de: ${from} sem voiced.json nem spec.json — não dá pra saber o que cada tomada leu`);
    const fila = fs.existsSync(path.join(src, 'changed.json')) ? readJson(path.join(src, 'changed.json')) : [];
    const voiced = Object.fromEntries(spec.lines.filter((l) => !fila.includes(l.id) && fs.existsSync(path.join(src, `${l.id}.mp3`))).map((l) => [l.id, l.say ?? l.caption]));
    fs.writeFileSync(path.join(dst, 'voiced.json'), JSON.stringify(voiced, null, 2));
  }
  console.log(`· ${to}: voz de ${from} (${n} de ${lines.length} falas)`);
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
        ...((src.fase ?? ctx.vs.fase) != null ? { fase: src.fase ?? ctx.vs.fase } : {}),
        ...(src.protagonista ? { protagonista: src.protagonista } : {}),
        // boneco v5 (src/boneco) e acabamento do fundo (src/molde/visual.ts), por ideia ou na raiz
        ...((src.boneco ?? ctx.vs.boneco) ? { boneco: src.boneco ?? ctx.vs.boneco } : {}),
        ...((src.visual ?? ctx.vs.visual) ? { visual: src.visual ?? ctx.vs.visual } : {}),
        // sem o card no fim (o render deixa passar de 60 s: o tempo do card virou conteúdo)
        ...(src.fim ? { fim: src.fim } : {}),
        lines,
      };
      // --voz-de: a voz aprovada vem pra chave do piloto ANTES de conferir o que falta gravar
      if (vozDe !== null) copiaVoz(vozKey(id, lang), k, lines);
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

/**
 * Quem narra a chave. Em ordem:
 *  1. --voz <chave> do elenco (vozes.json, escolha do André em 2026-11-11): ElevenLabs no eleven_v4, o
 *     roteiro numa tomada só; voz vetada ou de outro idioma para aqui;
 *  2. os flags crus --tts eleven --voice <id> [--model] [--sex] [--inteiro] (testes de voz);
 *  3. a voz que JÁ gravou a chave (voz.json): regravar uma fala sem dizer a voz nunca troca de narrador
 *     no meio do vídeo — em 10/11 um `voice` sem --tts regravou as falas pendentes com a Kore por cima
 *     da ElevenLabs;
 *  4. a Kore (Gemini), a de sempre.
 */
const ELENCO = readJson(path.join(root, 'vozes.json'));
function vozDaChave(k, lang) {
  const nome = arg('voz');
  if (nome) {
    if (ELENCO.vetadas[nome]) die(`--voz ${nome}: vetada (${ELENCO.vetadas[nome]})`);
    const v = ELENCO.vozes[nome];
    if (!v) die(`--voz ${nome}: não está em vozes.json (${Object.keys(ELENCO.vozes).join(', ')})`);
    if (!v.lang.split(',').includes(lang)) die(`--voz ${nome}: é voz de ${v.lang}, não de ${lang} — rode com --lang ${v.lang.split(',')[0]}`);
    return v.provedor === 'elevenlabs'
      ? { tts: 'eleven', voice: v.id, model: v.modelo, sex: v.sexo, inteiro: true }
      : { tts: 'gemini', voice: v.id, sex: v.sexo };
  }
  if (arg('tts') || arg('voice'))
    return { tts: arg('tts') === 'eleven' ? 'eleven' : 'gemini', voice: arg('voice'), model: arg('model'), sex: arg('sex'), inteiro: argv.includes('--inteiro') };
  const gravada = path.join(pubDir(k), 'voz.json');
  if (fs.existsSync(gravada)) {
    const g = readJson(gravada);
    const sexo = Object.values(ELENCO.vozes).find((v) => v.id === g.voice_id)?.sexo ?? 'any';
    if (g.provedor === 'elevenlabs') return { tts: 'eleven', voice: g.voice_id, model: g.model, sex: sexo };
    if (g.voice_id) return { tts: 'gemini', voice: g.voice_id, sex: sexo };
  }
  return { tts: 'gemini' };
}

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
      // O QA por transcrição e a medida das pausas são os mesmos pra qualquer voz; o --measure segue no
      // tts-gemini (só mede o arquivo, não importa quem gravou).
      const v = vozDaChave(k, lang);
      const tts = v.tts === 'eleven' ? 'tts-eleven.mjs' : 'tts-gemini.mjs';
      const extra = [...(v.voice ? ['--voice', v.voice] : []), ...(v.model ? ['--model', v.model] : [])];
      const qaExtra = [...extra, '--tts', v.tts, ...(v.sex ? ['--sex', v.sex] : [])];
      const pending = pendingLines(pubDir(k), spec.lines);
      const changed = only ? only.split(',') : pending.map((l) => l.id);
      if (changed.length) {
        node(tts, ['--dir', dir, '--lang', lang, ...extra, ...(v.inteiro ? ['--inteiro'] : []), '--only', changed.join(',')]);
        // o tts-eleven anota a voz; a do Gemini anota aqui (senão um voz.json velho da ElevenLabs mandaria na próxima regravação)
        if (v.tts === 'gemini') fs.writeFileSync(path.join(pubDir(k), 'voz.json'), JSON.stringify({ provedor: 'gemini', voice_id: v.voice ?? 'Kore' }, null, 2));
        console.log(`  voz de ${k}: ${Object.values(ELENCO.vozes).find((x) => x.id === (v.voice ?? 'Kore'))?.nome ?? v.voice}${v.inteiro ? ' (tomada única)' : ''}`);
      } else node('tts-gemini.mjs', ['--dir', dir, '--lang', lang, '--measure']);
      try {
        // QA de tudo que foi gravado agora (as falas antigas já passaram antes)
        if (changed.length) node('qa-voice.mjs', ['--dir', dir, '--lang', lang, '--fix', ...qaExtra, '--only', changed.join(',')]);
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
