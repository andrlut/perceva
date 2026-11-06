// O contrato de uma réplica de tela pro tutorial. Cada tela (Recompensas hoje;
// Práticas, Recanto e Eu depois) entrega estas peças e o Tour faz o resto:
// lê o roteiro, aplica os toques pelo comportamento da tela, anima e filma.
import type React from 'react';
import { Easing } from 'remotion';
import type { Rect } from '../ui';
import type { Device } from './chrome';
import type { Lang } from './i18n';

/** O estado da tela a partir de um quadro. A história começa no quadro -1000 (estado inicial). */
export type Snap<S> = { frame: number; state: S };
/**
 * Mudança de estado; `delay` em quadros depois do toque (ex.: a comemoração abre quando a mutação volta).
 * `lift`: a mudança põe OUTRA coisa debaixo do dedo (um modal abre ali, a grade fecha o vão do
 * cartão tocado, um modal FECHA e a loja reaparece embaixo): a mão, o disco e a onda saem junto
 * com o que o toque tirou, sem estacionar nem esperar a próxima ação em cima do que entrou. Nada
 * do toque sobrevive na tela de baixo (o disco do Aproveita! ficava 2 quadros em cima da loja).
 */
export type TimedPatch<S> = { delay?: number; patch: Partial<S>; lift?: boolean };

export type ScreenModule<S, V, L extends { targets: Record<string, Rect> }, C> = {
  id: string;
  device: Device;
  makeCtx: (o: { fixture: string; lang: Lang }) => C;
  initial: (ctx: C, patch?: Partial<S>) => S;
  /** o que o APP faz quando esse alvo é tocado (null = o app não faz nada ali) */
  tap: (target: string, s: S, ctx: C) => TimedPatch<S>[] | null;
  /** segurar (menu da recompensa, por exemplo); ausente = a tela não tem segurar replicado */
  hold?: (target: string, s: S, ctx: C) => TimedPatch<S>[] | null;
  /** rolagem (dp) que traz o alvo pra perto do topo */
  scrollFor: (target: string, s: S, ctx: C) => number;
  /**
   * Os alvos que são CONTROLE tocável (botão, chip, aba, cartão que abre algo), como padrões de
   * chave de alvo (`card:{id}:cta`). A mão parada e o contato do arrasto guardam distância deles
   * (HAND.CLEAR, engine.ts). Superfície neutra (corpo de cartão que não faz nada, cabeçalho de
   * seção, o saldo) fica fora da lista.
   */
  controls?: string[];
  /** valores animados do quadro f (saldo contando, modal abrindo…). A rolagem: o motor manda
   *  `{ scroll, scrollMotion }` — com `scrollMotion` (um SwipeMotion) a tela anima por
   *  `swipeProgress`, a mesma conta do dedo; `'instant'` = a tela já está lá (o layout anima, ex.:
   *  o vão que fecha); null = SCROLL_EASE. */
  view: (h: Snap<S>[], f: number) => V;
  /** `L.hidden` (opcional): alvos que só existem pra câmera e destaque mirarem antes de aparecer (o
   *  modal que ainda vai abrir) — a mão não os trata como controle, porque não estão na tela */
  layout: (s: S, v: V, ctx: C, h: Snap<S>[], f: number) => L;
  Render: React.FC<{ s: S; v: V; L: L; ctx: C; pressed: string | null }>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyScreen = ScreenModule<any, any, any, any>;

export const HISTORY_START = -1000;

/** Chave de alvo casa com o padrão? `{id}` vale qualquer id (`card:{id}:cta` casa `card:cafe:cta`). */
export const matchKey = (pattern: string, key: string) => {
  if (!pattern.includes('{id}')) return pattern === key;
  const re = new RegExp(`^${pattern.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace('{id}', '[\\w-]+')}$`);
  return re.test(key);
};

/**
 * A curva da rolagem animada SEM dedo (um `scroll` sem `swipe`): sai andando já no primeiro quadro
 * e assenta devagar. A rolagem do arrasto usa `swipeProgress` (abaixo), não esta.
 */
export const SCROLL_EASE = Easing.bezier(0.2, 0.55, 0.3, 1);

/**
 * O arrasto de verdade, em duas partes, com a mesma conta pro conteúdo (a tela) e pro dedo (engine.ts):
 * - `drag` quadros APERTADO: o conteúdo anda exatamente o que o dedo anda (1:1 — o dedo fica em cima
 *   do mesmo ponto do conteúdo o tempo todo). O dedo sai do repouso e solta ainda andando, a `rel`
 *   vezes a velocidade média (`frac` do caminho total nesse trecho).
 * - `mom` quadros de inércia, depois que solta: o conteúdo segue com a velocidade da soltura e freia
 *   (ease-out cúbico) — o resto (1 − frac) do caminho. `mom` sai da conta (mesma velocidade dos dois
 *   lados da soltura), então a inércia é curta e honesta: nunca um salto, nunca o dobro do dedo.
 * (Antes o conteúdo andava 2–3× o que o dedo andava, e a lista escorregava debaixo do dedo apertado.)
 */
export type SwipeMotion = { drag: number; frac: number; rel: number; mom: number };
export const swipeMotion = (drag: number, frac: number, rel: number): SwipeMotion => ({ drag, frac, rel, mom: (3 * (1 - frac) * drag) / (frac * rel) });
/** 0..1 do caminho total da rolagem, `t` quadros depois do contato. */
export const swipeProgress = (t: number, m: SwipeMotion) => {
  if (t <= 0) return 0;
  if (t < m.drag) {
    const u = t / m.drag;
    // cúbica com g(0)=0, g'(0)=0, g(1)=1, g'(1)=rel
    return m.frac * ((m.rel - 2) * u * u * u + (3 - m.rel) * u * u);
  }
  const w = Math.min(1, (t - m.drag) / m.mom);
  return m.frac + (1 - m.frac) * (1 - Math.pow(1 - w, 3));
};
/** Quadros até a rolagem do arrasto assentar. */
export const swipeFrames = (m: SwipeMotion) => m.drag + m.mom;

export const stateAt = <S,>(h: Snap<S>[], f: number): S => {
  let s = h[0].state;
  for (const x of h) {
    if (x.frame <= f) s = x.state;
    else break;
  }
  return s;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** A última mudança de um valor até o quadro f: de onde, pra onde, quando. */
export const lastChange = <S, T>(h: Snap<S>[], f: number, pick: (s: S) => T) => {
  let to = pick(h[0].state);
  let from = to;
  let at = HISTORY_START;
  for (let i = 1; i < h.length; i++) {
    if (h[i].frame > f) break;
    const v = pick(h[i].state);
    if (!same(v, to)) {
      from = to;
      to = v;
      at = h[i].frame;
    }
  }
  return { from, to, at };
};

/**
 * Fase de um modal: aberto desde `openedAt` (com o conteúdo atual) ou
 * fechando (o último conteúdo, por `fade` quadros, pra sair em fade como o
 * Modal do RN; `since` = quadros desde que fechou). null = nada na tela.
 */
export const modalPhase = <S, T>(
  h: Snap<S>[],
  f: number,
  pick: (s: S) => T | null,
  fade: number,
): { c: T; age: number; closing: boolean; fade: number; since: number } | null => {
  let content: T | null = null;
  let openedAt = HISTORY_START;
  let last: T | null = null;
  let closedAt = HISTORY_START;
  for (const x of h) {
    if (x.frame > f) break;
    const v = pick(x.state);
    if (v && !content) openedAt = x.frame;
    if (!v && content) {
      last = content;
      closedAt = x.frame;
    }
    content = v;
  }
  if (content) return { c: content, age: f - openedAt, closing: false, fade: Math.min(1, (f - openedAt) / fade), since: 0 };
  if (last && f - closedAt < fade) return { c: last, age: 1e4, closing: true, fade: 1 - (f - closedAt) / fade, since: f - closedAt };
  return null;
};

/** O próximo valor que o modal vai mostrar depois de f — pra câmera e destaque mirarem
 *  antes de ele abrir. Só olha pra frente: depois que o modal fecha, os alvos dele somem
 *  e o destaque que estava neles apaga sozinho. */
export const nextValue = <S, T>(h: Snap<S>[], f: number, pick: (s: S) => T | null): T | null => {
  for (const x of h) {
    if (x.frame <= f) continue;
    const v = pick(x.state);
    if (v) return v;
  }
  return null;
};
