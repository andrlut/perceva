import type React from 'react';
import manifestoScript from './script.json';
import recantoScript from './script.recanto.json';
import { SCENES as RECANTO } from './recanto/scenes';
import { SCENES as MANIFESTO } from './scenes';
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
};

export const FILMS = {
  manifesto: { lines: manifestoScript.lines, voDir: 'vo', scenes: MANIFESTO, noCaption: ['tagline'] },
  // a cena 'close' já escreve ler / lembrar / fazer na tela
  recanto: { lines: recantoScript.lines, voDir: 'vo-recanto', scenes: RECANTO, noCaption: ['close', 'tagline'], captionTop: 1440 },
} satisfies Record<string, Film>;

export type FilmId = keyof typeof FILMS;
