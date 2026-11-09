// Volume suave — o "kit" de um boneco num quadro: junta os <defs> (gradientes, recortes,
// desfoque) com ids prefixados pelo uid, e sabe de onde vem a luz.
//
// A técnica de volume (sem contorno nenhum):
//  - cada peça tem um gradiente da luz (em cima à esquerda) pra sombra, com uma faixa de
//    luz rebatida fria na borda de sombra (o que separa a peça do fundo navy);
//  - a luz de recorte (`luz` do lugar, dourada por padrão) é uma cópia da silhueta do grupo
//    deslocada PRA LUZ e desenhada por baixo: sobra uma lasca nítida só nas bordas que olham
//    pra luz, afinando sozinha nas pontas. Por grupo (o braço inteiro, a perna inteira): assim
//    a junta do cotovelo não ganha um risco dourado no meio.
import React from 'react';
import { type P, comp, perp, ponto, soma, esc, sub, unit, mixP, dist } from './geo';
import { type Mat, mistura } from './cor';

export type Stop = [number, string, number?];

const stopEls = (stops: Stop[]) => stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />);

export class Kit {
  defs: React.ReactElement[] = [];
  private n = 0;
  private cache = new Map<string, string>();
  /** vetor unitário que aponta PRA luz (em cima à esquerda; o espelho do Boneco vira o desenho, então a luz vem do outro lado aqui dentro) */
  readonly paraLuz: P;
  constructor(
    readonly uid: string,
    readonly luz: string,
    readonly espelho: boolean,
  ) {
    this.paraLuz = unit([espelho ? 0.55 : -0.55, -0.84]);
  }
  id(p: string) {
    return `${this.uid}-v${p}${this.n++}`;
  }
  /** gradiente linear em unidades do boneco */
  lin(a: P, b: P, stops: Stop[]): string {
    const id = this.id('l');
    this.defs.push(
      <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
        {stopEls(stops)}
      </linearGradient>,
    );
    return `url(#${id})`;
  }
  /** gradiente linear na caixa da peça (0..1) */
  linCaixa(x1: number, y1: number, x2: number, y2: number, stops: Stop[], chave?: string): string {
    if (chave && this.cache.has(chave)) return this.cache.get(chave)!;
    const id = this.id('b');
    this.defs.push(
      <linearGradient key={id} id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
        {stopEls(stops)}
      </linearGradient>,
    );
    const u = `url(#${id})`;
    if (chave) this.cache.set(chave, u);
    return u;
  }
  /** gradiente radial na caixa da peça */
  radCaixa(cx: number, cy: number, r: number, stops: Stop[], chave?: string, fx?: number, fy?: number): string {
    if (chave && this.cache.has(chave)) return this.cache.get(chave)!;
    const id = this.id('r');
    this.defs.push(
      <radialGradient key={id} id={id} cx={cx} cy={cy} r={r} fx={fx ?? cx} fy={fy ?? cy}>
        {stopEls(stops)}
      </radialGradient>,
    );
    const u = `url(#${id})`;
    if (chave) this.cache.set(chave, u);
    return u;
  }
  /** gradiente radial em unidades do boneco */
  rad(c: P, r: number, stops: Stop[], f?: P): string {
    const id = this.id('u');
    this.defs.push(
      <radialGradient key={id} id={id} gradientUnits="userSpaceOnUse" cx={c[0]} cy={c[1]} r={r} fx={f?.[0] ?? c[0]} fy={f?.[1] ?? c[1]}>
        {stopEls(stops)}
      </radialGradient>,
    );
    return `url(#${id})`;
  }
  /** recorte (union dos paths); devolve o `url(#…)` */
  recorte(ds: string[]): string {
    const id = this.id('c');
    this.defs.push(
      <clipPath key={id} id={id} clipPathUnits="userSpaceOnUse">
        {ds.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </clipPath>,
    );
    return `url(#${id})`;
  }
  /** desfoque (sombra de contato macia), em unidades do boneco */
  desfoque(sd: number): string {
    const chave = `blur${sd}`;
    if (this.cache.has(chave)) return this.cache.get(chave)!;
    const id = this.id('f');
    this.defs.push(
      <filter key={id} id={id} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation={sd} />
      </filter>,
    );
    const u = `url(#${id})`;
    this.cache.set(chave, u);
    return u;
  }

  /** máscara que esmaece a peça de cima pra baixo (de `de` a `ate`, frações da caixa) */
  esmaece(de: number, ate: number): string {
    const chave = `esm${de}-${ate}`;
    if (this.cache.has(chave)) return this.cache.get(chave)!;
    const g = this.id('g');
    const id = this.id('m');
    this.defs.push(
      <linearGradient key={g} id={g} x1={0} y1={0} x2={0} y2={1}>
        <stop offset={de} stopColor="#FFFFFF" />
        <stop offset={ate} stopColor="#000000" />
      </linearGradient>,
      <mask key={id} id={id} maskContentUnits="objectBoundingBox">
        <rect x={0} y={0} width={1} height={1} fill={`url(#${g})`} />
      </mask>,
    );
    const u = `url(#${id})`;
    this.cache.set(chave, u);
    return u;
  }

  /** o lado iluminado de uma direção de eixo: a normal que olha pra luz e quanto olha (0..1) */
  ladoLuz(eixo: P): { n: P; k: number } {
    let n = perp(unit(eixo));
    let k = ponto(n, this.paraLuz);
    if (k < 0) {
      n = esc(n, -1);
      k = -k;
    }
    return { n, k };
  }

  /** preenchimento de um tubo (membro): gradiente atravessando a largura, da luz pra sombra */
  tubo(a: P, b: P, r: number, m: Mat): string {
    const eixo = dist(a, b) < 1e-3 ? ([0, 1] as P) : sub(b, a);
    const { n, k } = this.ladoLuz(eixo);
    const meio = mixP(a, b, 0.5);
    const luz = mistura(m.base, m.luz, 0.35 + 0.65 * k);
    return this.lin(soma(meio, esc(n, r)), soma(meio, esc(n, -r)), [
      [0, luz],
      [0.34, m.base],
      [0.8, m.sombra],
      [1, m.rebate],
    ]);
  }

  /** preenchimento de um volume redondo (cabeça, tronco, mão, sapato): radial com o foco na luz */
  bolha(m: Mat, forte = 1): string {
    const cx = this.espelho ? 0.66 : 0.34;
    return this.radCaixa(
      cx,
      0.3,
      0.95,
      [
        [0, mistura(m.base, m.luz, forte)],
        [0.42, m.base],
        [0.84, m.sombra],
        [1, m.rebate],
      ],
      `bolha${m.base}${forte}${this.espelho}`,
    );
  }

  /** gradiente linear que vai da luz pra sombra numa caixa (tronco de roupa: mais suave que a bolha) */
  caixa(m: Mat): string {
    const x1 = this.espelho ? 0.9 : 0.1;
    return this.linCaixa(
      x1,
      0.05,
      1 - x1,
      0.95,
      [
        [0, m.luz],
        [0.4, m.base],
        [0.85, m.sombra],
        [1, m.rebate],
      ],
      `caixa${m.base}${this.espelho}`,
    );
  }
}

/** `sem` = sem luz de recorte (sombra interna, que não tem borda própria) */
export type Peca = { d: string; fill: string; op?: number; sem?: boolean };

/**
 * Um grupo com volume: a luz de recorte (quente, pra luz) e o rebatido (frio, do outro lado)
 * por baixo, as peças por cima. `giro` = rotação do grupo (a cabeça) pra o deslocamento da
 * lasca continuar apontando pra luz do mundo.
 */
export const Vol: React.FC<{ k: Kit; pecas: Peca[]; giro?: number; forca?: number; children?: React.ReactNode; largura?: number }> = ({ k, pecas, giro = 0, forca = 1, children, largura = 0.55 }) => {
  const a = (-giro * Math.PI) / 180;
  const L = k.paraLuz;
  const l: P = [L[0] * Math.cos(a) - L[1] * Math.sin(a), L[0] * Math.sin(a) + L[1] * Math.cos(a)];
  const d = largura;
  const visiveis = pecas.filter((p) => p.d);
  const comBorda = visiveis.filter((p) => !p.sem);
  return (
    <g>
      <g transform={`translate(${-l[0] * d * 0.7} ${-l[1] * d * 0.7})`} opacity={0.2 * forca}>
        {comBorda.map((p, i) => (
          <path key={i} d={p.d} fill="#8E9BFF" />
        ))}
      </g>
      <g transform={`translate(${l[0] * d} ${l[1] * d})`} opacity={0.88 * forca}>
        {comBorda.map((p, i) => (
          <path key={i} d={p.d} fill={k.luz} />
        ))}
      </g>
      {visiveis.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} opacity={p.op} />
      ))}
      {children}
    </g>
  );
};

/** comprimento de um vetor (re-export prático) */
export const tam = comp;
