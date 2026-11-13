// O que já tem voz conferida, por fala — public/<molde|tour>/<key>/voiced.json = { <id>: "<texto lido>" }.
//
// Antes, "fala a regravar" era a diferença entre o build novo e o build ANTERIOR (changed.json). Isso
// perdia edição: um `build --silent` (prévia) gravava o texto novo no spec, o `build` seguinte comparava
// com ele, achava nada mudado (o mp3 velho ainda estava lá) e a legenda nova saía sobre a voz velha, sem
// QA nenhum. Agora a régua é o texto que a voz LEU e passou no QA: fala cujo texto difere do voiced.json
// (ou sem mp3) está pendente, não importa quantos builds passaram no meio.
import fs from 'node:fs';
import path from 'node:path';

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const textOf = (l) => l.say ?? l.caption;

/**
 * As falas sem voz em dia, em `dir` (a pasta pública da chave), pros `lines` do spec resolvido.
 * Sem voiced.json (pasta anterior a este arquivo), cai na régua antiga: no build, o spec do build
 * anterior (`prevSpec`, null = primeiro build); no voice/render (`prevSpec` omitido), o changed.json.
 */
export function pendingLines(dir, lines, prevSpec) {
  const f = path.join(dir, 'voiced.json');
  const voiced = fs.existsSync(f) ? readJson(f) : null;
  const legacy = !voiced && prevSpec === undefined && fs.existsSync(path.join(dir, 'changed.json')) ? readJson(path.join(dir, 'changed.json')) : null;
  return lines.filter((l) => {
    if (!fs.existsSync(path.join(dir, `${l.id}.mp3`))) return true;
    if (voiced) return voiced[l.id] !== textOf(l);
    if (prevSpec === undefined) return legacy ? legacy.includes(l.id) : false;
    const p = prevSpec?.lines?.find((x) => x.id === l.id);
    return !p || textOf(p) !== textOf(l);
  });
}

/**
 * ANTES de gravar: as falas `ids` deixam de estar em dia. Se a gravação ou o QA morrerem no meio, elas
 * continuam pendentes e o próximo `voice` regrava e confere de novo — sem isso, uma troca de voz, um
 * --only ou a queda pra Kore que morresse no meio deixava tomada sem QA (ou dois narradores) "em dia".
 */
export function unmarkVoiced(dir, ids) {
  const f = path.join(dir, 'voiced.json');
  if (!fs.existsSync(f)) return;
  const voiced = readJson(f);
  for (const id of ids) delete voiced[id];
  fs.writeFileSync(f, JSON.stringify(voiced, null, 2));
}

/**
 * Depois do QA: as falas `ids` passam a ter voz em dia com o texto do spec atual. Sem voiced.json
 * ainda, as falas que NÃO estavam pendentes também entram (estavam em dia pela régua antiga).
 */
export function markVoiced(dir, lines, ids, pendingBefore) {
  const f = path.join(dir, 'voiced.json');
  const pend = new Set(pendingBefore.map((l) => l.id));
  const voiced = fs.existsSync(f) ? readJson(f) : Object.fromEntries(lines.filter((l) => !pend.has(l.id)).map((l) => [l.id, textOf(l)]));
  for (const l of lines) if (ids.includes(l.id)) voiced[l.id] = textOf(l);
  fs.writeFileSync(f, JSON.stringify(voiced, null, 2));
  return lines.filter((l) => voiced[l.id] !== textOf(l) || !fs.existsSync(path.join(dir, `${l.id}.mp3`)));
}
