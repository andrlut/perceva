import type React from 'react';
import manifestoScript from './script.json';
import recantoScript from './script.recanto.json';
import { SCENES as RECANTO } from './recanto/scenes';
import { SCENES as MANIFESTO } from './manifesto/scenes';
import type { Line, Scene } from './timeline';

// Cada filme = roteiro (falas) + pasta de voz + cenas. Pra um vídeo novo:
// src/script.<id>.json, cenas em src/<id>/scenes.tsx e uma entrada aqui.
type Film = {
  lines: Line[];
  voDir: string;
  scenes: Record<string, React.FC<{ s: Scene }>>;
  /** cenas sem legenda (a própria cena já escreve a fala na tela) */
  noCaption: string[];
  /** topo da legenda queimada (padrão LAYOUT.captionTop) */
  captionTop?: number;
  /** teto de duração: o render falha se o filme passar disso */
  maxSeconds?: number;
};

/** Falas de um corte (ver `in` no roteiro). */
const cut = (lines: Line[], id: string) => lines.filter((l) => !l.in || l.in.includes(id));

// Manifesto v2: a cena 'why' e a 'sign' já escrevem a fala em letra grande.
const MANIFESTO_BASE = { voDir: 'vo', scenes: MANIFESTO, noCaption: ['why', 'whyB', 'sign'], captionTop: 1140, maxSeconds: 60 };

export const FILMS = {
  manifesto: { ...MANIFESTO_BASE, lines: cut(manifestoScript.lines as Line[], 'a') },
  // gancho B (dor) pro teste A/B do anúncio — mesmo corpo
  manifestoB: { ...MANIFESTO_BASE, lines: cut(manifestoScript.lines as Line[], 'b') },
  // a cena 'close' já escreve ler / lembrar / fazer na tela
  recanto: { lines: recantoScript.lines, voDir: 'vo-recanto', scenes: RECANTO, noCaption: ['close', 'tagline'], captionTop: 1440 },
} satisfies Record<string, Film>;

export type FilmId = keyof typeof FILMS;
