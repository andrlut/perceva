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
};
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
const frameAtIndex = (s: Pick<Scene, 'caption' | 'say' | 'speech' | 'lead'>, idx: number) => {
  const text = spoken(s);
  const units = (upto: number) => {
    let u = 0;
    for (let i = 0; i < upto; i++) {
      u += 1;
      if (/[.!?:]/.test(text[i]) && text[i + 1] === ' ') u += PAUSE.stop;
      else if (text[i] === ',') u += PAUSE.comma;
    }
    return u;
  };
  const talk = Math.max(1, s.speech - SPEECH_TAIL);
  return s.lead + Math.round((units(idx) / units(text.length)) * talk);
};

/** Frame local em que a fala chega a `phrase`. */
export const cue = (s: Pick<Scene, 'caption' | 'say' | 'speech' | 'lead'>, phrase: string) =>
  frameAtIndex(s, speechIndex(s, phrase));

/** Fim estimado da fala (sem a cauda de silêncio), em frame local. */
export const speechEnd = (s: Pick<Scene, 'speech' | 'lead'>) => s.lead + Math.max(1, s.speech - SPEECH_TAIL);
