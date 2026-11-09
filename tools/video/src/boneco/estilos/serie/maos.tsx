// "Animação de série" — mãos: 4 dedos + polegar, nas cinco poses do contrato.
// Quadro local da mão: x do punho pras pontas dos dedos (0 → mao), y pro lado do POLEGAR.
// A ponta do indicador da pose `aponta` cai EXATAMENTE em j.dedos (é ela que aperta a pele).
import React from 'react';
import type { Mao } from '../../esqueleto';
import { type Forma, type P, LINHA, Traco, add, capsula, dirDe, elipse, linha, mul, perp, sub, suave, sw } from './base';
import type { Ctx } from './ctx';

export type MaoDesenho = {
  /** a palma (entra na união com o antebraço: o punho não tem costura) */
  formas: Forma[];
  /** polegar / indicador por cima da palma, com linha fina própria (a base some dentro da palma) */
  frente?: Forma[];
  /** riscos da palma (ficam EMBAIXO do polegar e do indicador) */
  detalhesPalma?: React.ReactNode;
  detalhes: React.ReactNode;
  /** mapeia (x, y) local → mundo */
  M: (x: number, y: number) => P;
  ponta: P;
};

export function quadroMao(c: Ctx, i: 0 | 1) {
  const { j, prop, fis } = c;
  const o = j.punho[i];
  const u = dirDe(j.ang.mao[i]);
  const n = perp(u);
  let t: P;
  if (j.vista === 'frente') {
    // de frente: o polegar fica do lado do meio do corpo (mão pendurada ou palma pra frente no alto)
    const cx = j.pelvis[0];
    t = (n[0] * (cx - o[0]) >= 0 ? n : mul(n, -1)) as P;
  } else t = mul(n, -1);
  const sx = prop.mao / 18;
  // largura da mão: um tico mais estreita que o punho largo pediria (mão comprida lê melhor)
  const sy = (fis.braco[2] / 4.4) * 1.12;
  const M = (x: number, y: number): P => add(add(o, mul(u, x * sx)), mul(t, y * sy));
  return { M, u, t, sx, sy };
}

const pts = (M: (x: number, y: number) => P, a: [number, number][]): P[] => a.map(([x, y]) => M(x, y));

export function maoDe(c: Ctx, i: 0 | 1, pose: Mao): MaoDesenho {
  const { M, sy } = quadroMao(c, i);
  const pele = c.pele;
  const sombra = c.peleSombra;
  const fm = (d: string): Forma => ({ d, cor: pele, sombra, k: 1.5 });
  const cap = (a: [number, number], b: [number, number], ra: number, rb: number) => capsula(M(a[0], a[1]), M(b[0], b[1]), ra * sy, rb * sy);
  const tr = (a: [number, number][], w = LINHA.fino) => <Traco d={linha(pts(M, a))} w={w} />;
  const ponta = M(18, 0);
  if (pose === 'fechada' || pose === 'segura') {
    // punho: dorso, os nós dos dedos (4 calombos discretos), os dedos dobrados por baixo e o
    // polegar atravessando na frente
    const corpo = suave(pts(M, [[0, -3.4], [4, -4.6], [8.6, -5.0], [11.6, -4.4], [13.3, -2.6], [13.6, -0.2], [13.2, 2.4], [11.6, 4.4], [8.6, 5.0], [5, 4.8], [2.2, 4.1], [0, 3.4]]));
    const polegar = cap([3.0, 4.0], [10.0, 2.8], 2.1, 1.65);
    return {
      formas: [fm(corpo)],
      frente: [fm(polegar)],
      detalhes: (
        <g>
          {tr([[9.6, -4.3], [11.4, -3.6], [13.0, -2.4]], LINHA.fino * 0.8)}
          {tr([[10.4, -2.4], [12.6, -1.6]], LINHA.fino * 0.8)}
          {tr([[10.6, -0.4], [12.9, 0.3]], LINHA.fino * 0.8)}
          {tr([[10.4, 1.5], [12.4, 2.4]], LINHA.fino * 0.7)}
          {tr([[4.4, 2.7], [9.6, 1.6]], LINHA.fino * 0.85)}
          {tr([[9.0, 2.0], [10.4, 3.2]], LINHA.fino * 0.6)}
        </g>
      ),
      M,
      ponta,
    };
  }
  if (pose === 'aponta') {
    // indicador esticado no eixo da mão: a ponta cai EXATAMENTE em j.dedos (a pose põe ali a
    // bochecha); o resto da mão fechado, o dedo médio dobrado embaixo e o polegar encostado
    const punho = suave(pts(M, [[0, -3.4], [3.8, -4.6], [7.8, -4.9], [10.4, -4.1], [11.7, -2.4], [11.5, -0.4], [10.3, 1.4], [8.2, 3.8], [4.6, 4.6], [1.8, 4.1], [0, 3.4]]));
    const indicador = cap([7.2, 1.5], [16.75, 0.12], 1.62, 1.25);
    const polegar = cap([2.8, 4.0], [8.9, 3.7], 1.95, 1.45);
    const { u } = quadroMao(c, i);
    const ua = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
    const unha = M(16.3, 0.62);
    return {
      formas: [fm(punho)],
      frente: [fm(polegar), fm(indicador)],
      detalhesPalma: (
        <g>
          {tr([[11.6, -0.8], [10.8, 1.6], [8.6, 3.6]], LINHA.fino * 0.85)}
          {tr([[8.4, -4.6], [10.9, -3.4]], LINHA.fino * 0.6)}
        </g>
      ),
      detalhes: (
        <g>
          <path d={elipse(unha, 1.0 * sy, 0.56 * sy, ua)} fill="#FFFFFF" opacity={0.35} stroke="#14173D" style={sw(0.3)} strokeOpacity={0.5} />
          {tr([[12.6, 1.4], [12.8, -0.9]], LINHA.fino * 0.6)}
          {tr([[14.6, 1.1], [14.7, -0.7]], LINHA.fino * 0.5)}
        </g>
      ),
      M,
      ponta,
    };
  }
  if (pose === 'aberta') {
    const palma = suave(pts(M, [[0, -3.4], [4, -4.6], [9.4, -4.7], [10.4, -2.2], [10.4, 1.8], [9.6, 4.3], [6, 4.7], [3, 4.2], [0, 3.4]]));
    const dedo = (b: [number, number], ang: number, L: number, r0: number, r1: number) => {
      const a = (ang * Math.PI) / 180;
      return cap(b, [b[0] + Math.cos(a) * (L - r1), b[1] + Math.sin(a) * (L - r1)], r0, r1);
    };
    return {
      formas: [
        fm(palma),
        fm(dedo([9.0, -3.5], -20, 6.4, 1.15, 0.95)),
        fm(dedo([9.7, -1.3], -7, 7.9, 1.25, 1.02)),
        fm(dedo([9.8, 1.0], 4, 8.4, 1.28, 1.05)),
        fm(dedo([9.3, 3.2], 15, 7.6, 1.24, 1.02)),
        fm(dedo([3.6, 3.9], 54, 6.8, 1.75, 1.3)),
      ],
      detalhes: <g>{tr([[3.5, -2.2], [6.5, 0.4], [7.6, 3.2]], LINHA.fino * 0.9)}</g>,
      M,
      ponta,
    };
  }
  // solta: relaxada, dedos juntos levemente curvados, polegar à frente
  const mao = suave(pts(M, [[0, -3.2], [4.5, -4.3], [9.5, -4.2], [13.5, -3.3], [16.6, -1.8], [17.8, 0.2], [17.3, 2.0], [15.6, 2.7], [12.5, 2.9], [9.5, 3.4], [5, 3.9], [0, 3.3]]));
  const polegar = cap([4.4, 3.4], [10.4, 4.9], 1.9, 1.45);
  return {
    formas: [fm(mao)],
    frente: [fm(polegar)],
    detalhes: (
      <g>
        {tr([[12.4, -2.6], [15.8, -1.5]])}
        {tr([[12.8, -0.8], [16.9, -0.2]])}
        {tr([[12.8, 1.0], [16.6, 1.6]])}
        {tr([[5.6, 2.6], [9.8, 3.6]])}
      </g>
    ),
    M,
    ponta,
  };
}
