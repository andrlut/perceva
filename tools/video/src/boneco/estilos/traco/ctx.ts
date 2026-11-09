// Traço editorial — o contexto que toda peça do desenho recebe.
import type { Juntas, Proporcao } from '../../esqueleto';
import type { Pessoa, Roupa } from '../../elenco';
import type { Corpo } from './medidas';
import type { Tronco } from './tronco';
import type { P } from './geo';
import { mix, sombra, sombraPele } from './cor';

export type Ctx = {
  j: Juntas;
  prop: Proporcao;
  corpo: Corpo;
  pessoa: Pessoa;
  roupa: Roupa;
  uid: string;
  /** direção da luz (unitário): vem do alto, do lado pra onde a pessoa olha */
  L: P;
  /** cor da luz de recorte */
  luz: string;
  tr: Tronco;
  t: number;
  /** a pele e a sombra dela */
  pele: string;
  peleS: string;
};

/** cor do membro de TRÁS: a mesma, um passo pra sombra (é o que separa as duas pernas de 3/4) */
export const atras = (c: Ctx, cor: string, i: 0 | 1, pele = false) => {
  if (i === 1) return cor;
  const k = c.j.vista === 'frente' ? 0.18 : 0.4;
  return mix(cor, pele ? sombraPele(cor) : sombra(cor), k);
};

export const rimDe = (c: Ctx, cor: string, k = 0.72) => mix(cor, c.luz, k);
