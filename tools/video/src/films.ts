import type React from 'react';
import manifestoScript from './script.json';
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
};

export const FILMS = {
  manifesto: { lines: manifestoScript.lines, voDir: 'vo', scenes: MANIFESTO, noCaption: ['tagline'] },
} satisfies Record<string, Film>;

export type FilmId = keyof typeof FILMS;
