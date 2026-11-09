// Traço editorial — os moldes da cabeça (contorno por vista, em frações da largura W e da altura H
// da cabeça, a partir do centro, y pra baixo) e onde cada traço do rosto mora.
import type { Vista } from '../../esqueleto';
import type { P } from './geo';

/** contorno da cabeça (sentido horário, começando no topo), em frações [x × W, y × H] */
export const CONTORNO: Record<Vista, (m: boolean) => P[]> = {
  frente: (m) => {
    const lado: P[] = [
      [0, -0.5],
      [0.24, -0.475],
      [0.4, -0.39],
      [0.48, -0.24],
      [0.5, -0.07],
      [0.487, 0.07],
      [0.46, 0.19],
      m ? [0.43, 0.31] : [0.405, 0.3],
      m ? [0.29, 0.445] : [0.25, 0.43],
      m ? [0.12, 0.505] : [0.1, 0.5],
      [0, 0.512],
    ];
    const outro = lado
      .slice(1, -1)
      .reverse()
      .map(([x, y]) => [-x, y] as P);
    return [...lado, ...outro];
  },
  'tres-quartos': (m) => [
    [-0.02, -0.52],
    [0.22, -0.48],
    [0.37, -0.39],
    [0.44, -0.23],
    [0.465, -0.08],
    [0.44, 0.0],
    [0.455, 0.1],
    [0.44, 0.2],
    m ? [0.385, 0.33] : [0.36, 0.33],
    m ? [0.3, 0.45] : [0.27, 0.45],
    [0.16, 0.51],
    [0.04, 0.475],
    m ? [-0.2, 0.34] : [-0.18, 0.325],
    [-0.31, 0.2],
    [-0.4, 0.08],
    [-0.47, -0.0],
    [-0.54, -0.16],
    [-0.5, -0.34],
    [-0.32, -0.48],
  ],
  perfil: (m) => [
    [-0.05, -0.52],
    [0.2, -0.48],
    [0.35, -0.39],
    [0.42, -0.22],
    [0.445, -0.06],
    [0.42, 0.01],
    [0.49, 0.1],
    [0.555, 0.165],
    [0.47, 0.205],
    [0.47, 0.24],
    [0.445, 0.275],
    [0.462, 0.31],
    [0.41, 0.36],
    m ? [0.43, 0.445] : [0.415, 0.44],
    [0.32, 0.505],
    [0.12, 0.48],
    m ? [-0.13, 0.39] : [-0.11, 0.38],
    [-0.3, 0.2],
    [-0.48, 0.02],
    [-0.56, -0.18],
    [-0.48, -0.38],
    [-0.3, -0.5],
  ],
};

export type Olho = { c: P; ew: number; lado: 1 | -1; fs: number };

/** os olhos visíveis (centro em frações, meia largura em W) */
export const OLHOS: Record<Vista, Olho[]> = {
  frente: [
    { c: [-0.205, 0.025], ew: 0.088, lado: -1, fs: 1 },
    { c: [0.205, 0.025], ew: 0.088, lado: 1, fs: 1 },
  ],
  'tres-quartos': [
    { c: [-0.04, 0.025], ew: 0.088, lado: -1, fs: 1 },
    { c: [0.325, 0.025], ew: 0.064, lado: 1, fs: 0.72 },
  ],
  perfil: [{ c: [0.33, 0.02], ew: 0.055, lado: 1, fs: 0.55 }],
};

/** orelhas: centro, meia largura, meia altura (frações) */
export const ORELHAS: Record<Vista, { c: P; rx: number; ry: number; lado: 1 | -1; atras: boolean }[]> = {
  frente: [
    { c: [-0.5, 0.085], rx: 0.065, ry: 0.11, lado: -1, atras: true },
    { c: [0.5, 0.085], rx: 0.065, ry: 0.11, lado: 1, atras: true },
  ],
  'tres-quartos': [{ c: [-0.3, 0.075], rx: 0.07, ry: 0.115, lado: -1, atras: false }],
  perfil: [{ c: [-0.1, 0.075], rx: 0.075, ry: 0.115, lado: -1, atras: false }],
};
