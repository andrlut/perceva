// O acabamento do fundo (2026-11-09, pedido do André): "o fundo fica embaçado demais às vezes,
// não dá pra ver a riqueza dos detalhes" e "as cores, por mais que sigam a paleta, poderiam
// parecer mais vivas". Opt-in por vídeo (spec.visual ou a prop `visual` do Molde, pra comparar o
// mesmo quadro com e sem): sem ele, os vídeos publicados saem idênticos (diff de pixel 0).
//   nitido → as camadas do lugar sem desfoque; o primeiro plano com desfoque leve (só profundidade);
//            o rack focus do push vai a 2 px no máximo (era 7)
//   vivo   → o lugar com +35% de saturação e +12% de luz; figurantes menos apagados; o escuro em
//            volta da protagonista (Spot), das laterais (Vinheta) e dos cantos (Lente) pela metade
import { createContext, useContext } from 'react';

export type Visual = { nitido: boolean; vivo: boolean };
export const VISUAL_ANTES: Visual = { nitido: false, vivo: false };
export const VisualContext = createContext<Visual>(VISUAL_ANTES);
export const useVisual = () => useContext(VisualContext);

/** O que o spec/prop escreve → as chaves. */
export const visualDe = (v?: string): Visual => (v === 'v5' ? { nitido: true, vivo: true } : v === 'nitido' ? { nitido: true, vivo: false } : VISUAL_ANTES);

/** Filtro de cada camada do lugar. `antes` = a régua dos vídeos publicados. */
export const filtroCamada = (part: 'back' | 'mid' | 'front', v: Visual, antes: string): string | undefined => {
  if (!v.nitido && !v.vivo) return antes;
  const cor = v.vivo ? 'saturate(1.35) brightness(1.12)' : '';
  if (part === 'front') return [v.nitido ? 'blur(3px) brightness(0.74)' : antes, v.vivo ? 'saturate(1.1)' : ''].filter(Boolean).join(' ');
  return [v.nitido ? '' : antes, cor].filter(Boolean).join(' ') || undefined;
};

/** Teto do desfoque do fundo no push (rack focus). */
export const focoMax = (v: Visual) => (v.nitido ? 2 : 7);

/** Filtro dos figurantes (pessoas ao fundo): mais vivos com `vivo`, sem deixar de ser fundo. */
export const filtroFigurante = (v: Visual, antes: string) => (v.vivo ? 'saturate(0.85) brightness(0.92)' : antes);
