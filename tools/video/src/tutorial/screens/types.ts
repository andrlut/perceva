// O contrato de uma réplica de tela pro tutorial. Cada tela (Recompensas hoje;
// Práticas, Recanto e Eu depois) entrega estas peças e o Tour faz o resto:
// lê o roteiro, aplica os toques pelo comportamento da tela, anima e filma.
import type React from 'react';
import type { Rect } from '../ui';
import type { Device } from './chrome';
import type { Lang } from './i18n';

/** O estado da tela a partir de um quadro. A história começa no quadro -1000 (estado inicial). */
export type Snap<S> = { frame: number; state: S };
/**
 * Mudança de estado; `delay` em quadros depois do toque (ex.: a comemoração abre quando a mutação volta).
 * `lift`: a mudança põe OUTRA coisa debaixo do dedo (um modal abre ali, a grade fecha o vão do
 * cartão tocado): a mão e a onda saem já, sem estacionar nem esperar a próxima ação em cima do
 * que entrou. Fechar um modal e voltar pra tela de baixo não levanta: a mão segue pro próximo gesto.
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
  /** valores animados do quadro f (saldo contando, modal abrindo…) */
  view: (h: Snap<S>[], f: number) => V;
  layout: (s: S, v: V, ctx: C, h: Snap<S>[], f: number) => L;
  Render: React.FC<{ s: S; v: V; L: L; ctx: C; pressed: string | null }>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyScreen = ScreenModule<any, any, any, any>;

export const HISTORY_START = -1000;

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
