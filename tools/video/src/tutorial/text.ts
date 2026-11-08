// Medida de texto das réplicas de tela — o mesmo Manrope do app, sem depender
// do navegador (o layout precisa ser determinístico em qualquer quadro, antes
// da fonte carregar). As larguras vêm de metrics.json (fontTools, sem kerning:
// erro de 1–2%, invisível num botão).
//
// Altura de linha: o app roda no Android, onde um <Text> SEM lineHeight
// explícito ocupa (yMax − yMin) da fonte (includeFontPadding, o padrão do RN).
// Com lineHeight explícito, a linha tem exatamente aquele valor.
import M from './metrics.json';

export type Weight = 500 | 600 | 700 | 800;

type Face = { yMax: number; yMin: number; adv: Record<string, number> };
const FACES = M.weights as unknown as Record<string, Face>;
const face = (w: Weight) => FACES[String(w)];

/** Largura de `s` em dp, com o letterSpacing do RN (soma depois de cada caractere). */
export const textWidth = (s: string, size: number, weight: Weight, letterSpacing = 0): number => {
  const { adv } = face(weight);
  let w = 0;
  for (const ch of s) w += (adv[ch] ?? M.fallback) * size + letterSpacing;
  return w;
};

/** Altura de UMA linha de um <Text> sem lineHeight (Android, includeFontPadding). */
export const naturalLine = (size: number, weight: Weight): number => {
  const f = face(weight);
  return size * (f.yMax - f.yMin);
};

/** Quebra gulosa por palavra, como o Chrome faz (é ele que desenha a réplica). */
export const wrap = (s: string, size: number, weight: Weight, maxWidth: number, letterSpacing = 0): string[] => {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && textWidth(next, size, weight, letterSpacing) > maxWidth) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
};

/** Quantas linhas o texto ocupa, com teto (numberOfLines do RN). */
export const lineCount = (s: string, size: number, weight: Weight, maxWidth: number, max: number, letterSpacing = 0) =>
  Math.min(max, wrap(s, size, weight, maxWidth, letterSpacing).length);
