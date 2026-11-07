export const FPS = 30;
/** Frames de silêncio antes da fala em cada cena. */
export const LEAD = 6;
/** Respiro depois da fala, antes do crossfade. */
export const TAIL = 8;
/** Duração do crossfade entre cenas — sobrepõe o fim de uma ao começo da outra. */
export const FADE = 10;
/** A última cena segura a assinatura na tela. */
export const HOLD = 54;

export type Line = {
  id: string;
  caption: string;
  say?: string;
  /** segundos de imagem ANTES da fala começar (cena que precisa respirar antes) */
  pre?: number;
  /** segundos de imagem DEPOIS da fala (deixar um gesto ou um texto assentar) */
  hold?: number;
  /** cortes em que a fala entra (ex.: ['a'] = só no gancho A); ausente = em todos */
  in?: string[];
  /**
   * A voz medida (requinte, fase 2): onde a fala começa e termina dentro do mp3 e as pausas no
   * meio, em segundos (ffmpeg silencedetect, `molde.mjs` grava em pauses.json). Com ela as deixas
   * deixam de ser só estimadas: cada pausa de pontuação vira uma âncora de tempo real.
   */
  voice?: Voice;
};
export type Voice = { start: number; end: number; pauses: [number, number][] };
export type Timing = { id: string; seconds: number };
export type Scene = Line & {
  /** frames de fala */
  speech: number;
  /** duração total da cena (inclui o FADE de saída) */
  frames: number;
  /** frame global em que a cena começa */
  start: number;
  /** frame local em que a fala começa (LEAD + pre) */
  lead: number;
};

export const buildTimeline = (lines: Line[], timings: Timing[]): { scenes: Scene[]; total: number } => {
  let cursor = 0;
  const scenes = lines.map((line, i) => {
    const t = timings.find((x) => x.id === line.id);
    if (!t) throw new Error(`Sem voz para "${line.id}" — rode node scripts/tts-gemini.mjs`);
    const speech = Math.round(t.seconds * FPS);
    const last = i === lines.length - 1;
    const lead = LEAD + Math.round((line.pre ?? 0) * FPS);
    const extra = Math.round((line.hold ?? 0) * FPS);
    const frames = lead + speech + extra + TAIL + (last ? HOLD : FADE);
    const scene = { ...line, speech, frames, start: cursor, lead };
    cursor += frames - (last ? 0 : FADE);
    return scene;
  });
  return { scenes, total: cursor };
};

/** Texto sem os marcadores de destaque. */
export const plain = (s: string) => s.replace(/\*/g, '');

/** Cauda de silêncio no fim de cada WAV (tts-gemini.mjs deixa 0,25 s). */
const SPEECH_TAIL = 8;
/** Peso das pausas, em "caracteres": fim de frase ≈ 0,7 s, vírgula ≈ 0,25 s. */
const PAUSE = { stop: 12, comma: 4 };

const spoken = (s: Pick<Scene, 'caption' | 'say'>) => plain(s.say ?? s.caption);

/** Pausa de pontuação no caractere i: fim de frase, dois-pontos ou vírgula. */
const pauseAt = (text: string, i: number) => (/[.!?:]/.test(text[i]) && text[i + 1] === ' ' ? PAUSE.stop : text[i] === ',' ? PAUSE.comma : 0);
/** "Tamanho" do texto até `upto`: um por caractere + o peso das pausas. */
const unitsOf = (text: string, upto: number) => {
  let u = 0;
  for (let i = 0; i < upto; i++) u += 1 + pauseAt(text, i);
  return u;
};

/**
 * Âncoras de tempo da fala [índice do caractere, segundos no mp3], a partir da voz medida: o
 * começo, o fim e cada pausa medida que casa com uma pontuação (a pontuação mais perto do tempo
 * estimado, na ordem). Pausa sem pontuação (a voz respirou no meio da frase) fica de fora.
 */
const anchorsOf = (text: string, v: Voice): [number, number][] => {
  const U = unitsOf(text, text.length);
  const span = Math.max(0.1, v.end - v.start);
  const marks: { i: number; t: number }[] = [];
  for (let i = 0; i < text.length; i++) if (pauseAt(text, i)) marks.push({ i, t: v.start + (unitsOf(text, i + 1) / U) * span });
  const out: [number, number][] = [[0, v.start]];
  let from = 0;
  for (const [a, b] of v.pauses) {
    const mid = (a + b) / 2;
    let best = -1;
    for (let j = from; j < marks.length; j++) if (best < 0 || Math.abs(marks[j].t - mid) < Math.abs(marks[best].t - mid)) best = j;
    if (best < 0 || Math.abs(marks[best].t - mid) > Math.max(0.6, span * 0.12)) continue;
    // a pontuação termina quando a pausa começa; a palavra seguinte (depois do espaço) nasce no fim dela
    out.push([marks[best].i + 1, a], [Math.min(text.length, marks[best].i + 2), b]);
    from = best + 1;
  }
  out.push([text.length, v.end]);
  return out;
};

/** Posição de `phrase` no texto falado (cai pra legenda, proporcional, se não achar). */
const speechIndex = (s: Pick<Scene, 'caption' | 'say'>, phrase: string) => {
  const text = spoken(s);
  const idx = text.indexOf(phrase);
  if (idx >= 0) return idx;
  const cap = plain(s.caption);
  const ci = cap.indexOf(phrase);
  if (ci < 0) throw new Error(`cue: "${phrase}" não está em "${cap}"`);
  return Math.round((ci / cap.length) * text.length);
};

/**
 * Frame local (dentro da cena) em que a fala chega ao caractere `idx` —
 * estimado pelo comprimento do texto, com peso extra nas pausas. Bom o
 * bastante pra voz sintética; com a voz real o modelo continua valendo, e
 * dá pra trocar por marcações manuais se algum ponto ficar fora.
 */
export const frameAtIndex = (s: Pick<Scene, 'caption' | 'say' | 'speech' | 'lead' | 'voice'>, idx: number) => {
  const text = spoken(s);
  const units = (upto: number) => unitsOf(text, upto);
  if (s.voice) {
    // voz medida: interpola entre as âncoras reais (começo, pausas casadas, fim)
    const an = anchorsOf(text, s.voice);
    let k = 0;
    while (k < an.length - 2 && an[k + 1][0] <= idx) k++;
    const [ia, ta] = an[k];
    const [ib, tb] = an[k + 1];
    const f = ib > ia ? (units(Math.min(idx, ib)) - units(ia)) / Math.max(1e-6, units(ib) - units(ia)) : 0;
    return s.lead + Math.round((ta + Math.max(0, Math.min(1, f)) * (tb - ta)) * FPS);
  }
  const talk = Math.max(1, s.speech - SPEECH_TAIL);
  return s.lead + Math.round((units(idx) / units(text.length)) * talk);
};

/** Frame local em que a fala chega a cada palavra (o verso acende com a voz). */
export const wordFrames = (s: Pick<Scene, 'caption' | 'say' | 'speech' | 'lead' | 'voice'>) => {
  const text = spoken(s);
  const out: { word: string; at: number }[] = [];
  for (const m of text.matchAll(/\S+/g)) out.push({ word: m[0], at: frameAtIndex(s, m.index ?? 0) });
  return out;
};

/** Frame local em que a fala chega a `phrase`. */
export const cue = (s: Pick<Scene, 'caption' | 'say' | 'speech' | 'lead' | 'voice'>, phrase: string) =>
  frameAtIndex(s, speechIndex(s, phrase));

/** Fim da fala (sem a cauda de silêncio), em frame local — medido quando a voz foi medida. */
export const speechEnd = (s: Pick<Scene, 'speech' | 'lead' | 'voice'>) =>
  s.voice ? s.lead + Math.round(s.voice.end * FPS) : s.lead + Math.max(1, s.speech - SPEECH_TAIL);
