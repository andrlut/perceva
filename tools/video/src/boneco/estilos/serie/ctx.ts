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
  segura?: 'halter' | 'copo';
  toque?: { ponto: [number, number]; forca: number };
};
