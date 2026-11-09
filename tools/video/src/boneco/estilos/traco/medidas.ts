// Traço editorial — proporção (adulto de ~6,3 cabeças, membros longos) e as larguras do corpo
// por gênero, tipo de corpo e idade. Tudo em unidades do boneco (chão y = 0, 1 cabeça = 26).
import type { Proporcao } from '../../esqueleto';
import type { Pessoa } from '../../elenco';
import type { Perfil } from './geo';

export const PROP: Proporcao = {
  cabeca: 26,
  cabecaLarg: 20,
  pescoco: 10,
  tronco: 56,
  ombros: 18,
  quadris: 9.5,
  braco: 32,
  antebraco: 27,
  mao: 15,
  coxa: 41,
  canela: 38,
  tornozelo: 5,
  pe: 22,
};

export function propDe(p: Pessoa): Proporcao {
  const m = p.genero === 'm';
  const idoso = p.idade === 'idoso';
  const c = p.corpo;
  const ombroExtra = c === 'esguio' ? -1 : c === 'forte' ? 2 : c === 'largo' ? 1.6 : 0;
  const quadrilExtra = c === 'esguio' ? -0.6 : c === 'largo' ? 1.8 : c === 'forte' ? 0.3 : 0;
  return {
    ...PROP,
    cabeca: m ? 27.5 : 26.5,
    cabecaLarg: m ? 21.5 : 20.5,
    pescoco: idoso ? 8.8 : m ? 10 : 9.5,
    tronco: (m ? 58 : 55) - (idoso ? 2 : 0),
    ombros: (m ? 19.5 : 17) + ombroExtra,
    quadris: (m ? 9 : 10) + quadrilExtra,
    braco: m ? 33 : 31.5,
    antebraco: m ? 28 : 26.5,
    mao: m ? 17 : 16,
    coxa: (m ? 42 : 41) - (idoso ? 1 : 0),
    canela: (m ? 39 : 38) - (idoso ? 1 : 0),
    pe: m ? 25 : 23,
  };
}

/** Larguras e volumes do corpo (o que o esqueleto não diz). */
export type Corpo = {
  /** perfis dos ossos: [t, raio da frente, raio de trás] */
  braco: Perfil;
  antebraco: Perfil;
  coxa: Perfil;
  canela: Perfil;
  /** anéis do tronco: nível v (unidades acima da pélvis) → meia largura a, profundidade da frente bf e de trás bb */
  aneis: [number, number, number, number][];
  pescoco: number;
  /** 0..1: quanto o peito/busto avança */
  busto: number;
  barriga: number;
  /** curvatura da parte de cima das costas (idoso) */
  corcunda: number;
  /** cor dos lábios */
  labio: string;
};

export function corpoDe(p: Pessoa, prop: Proporcao): Corpo {
  const m = p.genero === 'm';
  const c = p.corpo;
  const idoso = p.idade === 'idoso';
  const maduro = p.idade === 'maduro';
  // fator de largura dos membros
  const k = (m ? 1.32 : 1.2) * (c === 'esguio' ? 0.9 : c === 'forte' ? 1.16 : c === 'largo' ? 1.24 : 1) * (idoso ? 0.92 : 1) * (m ? 1.08 : 1);
  const kc = 1.2 * (c === 'esguio' ? 0.9 : c === 'forte' ? 1.1 : c === 'largo' ? 1.24 : 1) * (m ? 0.97 : 1.03) * (idoso ? 0.93 : 1);
  const T = prop.tronco;
  const O = prop.ombros;
  // ombro (deltoide) → cotovelo
  const braco: [number, number, number][] = [
    [0, 3.7 * k, 3.6 * k],
    [0.18, 3.6 * k, 3.4 * k],
    [0.5, 3.0 * k, 3.1 * k],
    [1, 2.35 * k, 2.35 * k],
  ];
  const antebraco: [number, number, number][] = [
    [0, 2.35 * k, 2.35 * k],
    [0.25, 2.75 * k, 2.6 * k],
    [0.7, 2.1 * k, 2.0 * k],
    [1, 1.7 * k, 1.65 * k],
  ];
  const coxa: [number, number, number][] = [
    [0, 6.6 * kc, 6.4 * kc],
    [0.3, 6.1 * kc, 5.6 * kc],
    [0.75, 4.6 * kc, 4.2 * kc],
    [1, 3.75 * kc, 3.75 * kc],
  ];
  // canela: a panturrilha avança pra TRÁS no primeiro terço
  const canela: [number, number, number][] = [
    [0, 3.75 * kc, 3.75 * kc],
    [0.28, 3.3 * kc, 4.5 * kc],
    [0.62, 2.75 * kc, 3.0 * kc],
    [1, 2.05 * kc, 2.05 * kc],
  ];
  const busto = m ? 0.25 : idoso ? 0.6 : 1;
  const barriga = c === 'largo' ? (m ? 1.7 : 1.3) : idoso || maduro ? 0.4 : 0;
  const larg = (c === 'largo' ? 1.24 : c === 'esguio' ? 0.94 : c === 'forte' ? 1.05 : 1) * 1.05;
  const cint = (m ? (c === 'forte' ? 0.8 : 0.9) : c === 'largo' ? 0.88 : 0.8) + (idoso ? 0.1 : 0);
  const quad = m ? 0.92 : c === 'esguio' ? 1.0 : 1.1;
  const P = prop.quadris;
  // [v, a, bf, bb]  — v sobe da pélvis; a = meia largura de frente
  const aneis: [number, number, number, number][] = [
    [-13, (P + 3.2) * quad * larg, 6.2 * larg, (m ? 6.6 : 7.6) * larg],
    [-5, (P + 4.6) * quad * larg, 7 * larg, (m ? 8 : 9.6) * larg],
    [6, (P + 4.1) * quad * larg * (m ? 1 : 0.97), (7.2 + barriga * 4.6) * larg, (m ? 7.4 : 8) * larg],
    [T * 0.3, O * cint * larg * (m ? 0.72 : 0.68) + 2, (7 + barriga * 5.6) * larg, 6.2 * larg],
    [T * 0.5, O * 0.8 * larg + (m ? 0.6 : 0), (7.8 + barriga * 3.2 + busto * 0.6) * larg, 6.6 * larg],
    [T * 0.66, O * 0.84 * larg + (m ? 1.4 : 0.6), (8.4 + busto * 2.6 + barriga) * larg, (7 + (idoso ? 1.2 : 0)) * larg],
    [T * 0.8, O * 0.88 * larg + (m ? 1.6 : 0.8), (7.6 + busto * 0.8) * larg, (7.4 + (idoso ? 2.2 : 0)) * larg],
    [T * 0.92, O + 1.2, 6 * larg, (7 + (idoso ? 2.4 : 0)) * larg],
  ];
  const labio = m ? '#B8605E' : '#C8566A';
  return {
    braco,
    antebraco,
    coxa,
    canela,
    aneis,
    pescoco: (m ? 0.3 : 0.26) * prop.cabecaLarg * (c === 'forte' ? 1.08 : c === 'largo' ? 1.1 : 1),
    busto,
    barriga,
    corcunda: idoso ? 1 : 0,
    labio,
  };
}
