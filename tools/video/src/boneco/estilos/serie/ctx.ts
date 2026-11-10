// "Animação de série" — o contexto de um boneco no quadro (tudo o que as partes precisam).
import type { Humor, Juntas, Proporcao } from '../../esqueleto';
import type { Pessoa, Roupa } from '../../elenco';
import type { Pintor } from './base';
import type { Fisico, Mov, Tronco } from './fisico';

export type Ctx = {
  j: Juntas;
  prop: Proporcao;
  fis: Fisico;
  tr: Tronco;
  mov: Mov;
  pessoa: Pessoa;
  roupa: Roupa;
  humor: Humor;
  t: number;
  uid: string;
  pt: Pintor;
  /** +1 luz da direita da TELA (com espelho, o desenho é virado: −1) */
  luzX: number;
  pele: string;
  peleSombra: string;
  seed: number;
  segura?: 'halter' | 'copo' | 'coqueteleira' | 'suco';
  /** a mão de TRÁS também segura (halter: um em cada mão; copo/coqueteleira: as duas na mesma peça) */
  seguraDuas?: boolean;
  toque?: { ponto: [number, number]; forca: number; marca?: number };
  /** 0..1: o corpo de vidro (ver estilo.ts) */
  vidro: number;
  /** mãos (com o que seguram) e pés redesenhados POR CIMA do vidro */
  extremidades: import('react').ReactNode[];
};
