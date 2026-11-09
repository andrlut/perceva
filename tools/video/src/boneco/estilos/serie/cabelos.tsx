// "Animação de série" — os 12 cabelos, no quadro LOCAL da cabeça (base W 48 × H 58, centro em
// (0,0), queixo em y = +29, topo do crânio em −29, rosto pra +x de 3/4 e de perfil).
// Cada cabelo tem uma massa de TRÁS (atrás da cabeça e do corpo) e uma de FRENTE (por cima do
// rosto), cor com sombra própria e um brilho (especular) no alto. O que pende solto — trança,
// rabo, cachos compridos — balança atrasado em relação ao corpo (mov.balanco, sem tremer).
import React from 'react';
import type { Cabelo } from '../../elenco';
import { type Forma, type P, type PQ, LINHA, TINTA, Traco, add, dirDe, gira, linha, luma, mix, mul, suave } from './base';

export type VistaCab = 'frente' | 'tq' | 'perfil';

export type CabeloDesenho = {
  atras: Forma[];
  frente: Forma[];
  /** tranças/mechas da frente (desenhadas por cima do corpo, com a cabeça) */
  soltas: Forma[];
  detalhesAtras?: React.ReactNode;
  detalhesFrente?: React.ReactNode;
  detalhesSoltas?: React.ReactNode;
  /** as orelhas aparecem? (cabelo por cima esconde) */
  orelha: 'toda' | 'meia' | 'nada';
};

export type CabeloOpts = {
  tipo: Cabelo;
  cor: string;
  vista: VistaCab;
  /** ângulo do que pende (graus, + = pra +x) já no quadro LOCAL da cabeça */
  balanco: number;
  corrida: number;
  t: number;
  seed: number;
  f: boolean;
};

const esp = (pts: P[]): P[] => pts.map(([x, y]) => [-x, y] as P);
/** fecha uma forma simétrica a partir da metade direita (de cima pra baixo) e da borda interna */
const sim = (fora: P[], dentro: P[] = []): P[] => {
  const d2 = esp([...dentro].reverse());
  if (dentro.length && Math.abs(dentro[dentro.length - 1][0]) < 0.01) d2.shift();
  const f2 = esp([...fora].reverse());
  if (Math.abs(fora[0][0]) < 0.01) f2.pop();
  return [...fora, ...dentro, ...d2, ...f2];
};

/** arco com calombos (cacho, black): de a0 a a1 (rad; 0 = direita, −π/2 = topo) */
function nuvem(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, bojo: number, fase = 0): P[] {
  const out: P[] = [];
  const tot = n * 4;
  for (let k = 0; k <= tot; k++) {
    const a = a0 + ((a1 - a0) * k) / tot;
    const b = Math.abs(Math.sin(((k / 4) * Math.PI) + fase)) ** 0.7;
    out.push([cx + Math.cos(a) * (rx + bojo * b), cy + Math.sin(a) * (ry + bojo * b)]);
  }
  return out;
}

const corDe = (cor: string) => {
  const branco = luma(cor) > 0.6;
  return {
    base: cor,
    sombra: branco ? mix(cor, '#6E74A8', 0.42) : mix(cor, '#0B0820', 0.42),
    brilho: branco ? '#FFFFFF' : mix(cor, '#C9B8FF', 0.38),
  };
};

/** uma trança: cadeia de gomos alternados, pendendo do ponto `raiz` com o balanço */
function tranca(raiz: P, comp: number, ang: number, ondas: number, cor: ReturnType<typeof corDe>, larg = 3.6): { formas: Forma[]; det: React.ReactNode[] } {
  const formas: Forma[] = [];
  const det: React.ReactNode[] = [];
  const nSeg = Math.max(4, Math.round(comp / 4.6));
  let p = raiz;
  for (let k = 0; k < nSeg; k++) {
    const a = ang * (0.45 + (0.55 * k) / nSeg) + Math.sin(ondas - k * 0.55) * 4 * (k / nSeg);
    const d = dirDe(a);
    const q = add(p, mul(d, 4.6));
    const m = mul(add(p, q), 0.5);
    const lado = k % 2 ? 1 : -1;
    const rot = (Math.atan2(d[1], d[0]) * 180) / Math.PI + lado * 14;
    const w = larg * (k === nSeg - 1 ? 0.8 : 1);
    const pts: P[] = [];
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      pts.push(add(m, gira([Math.cos(t) * 2.9, Math.sin(t) * (w / 2)], rot)));
    }
    formas.push({ d: suave(pts), cor: cor.base, sombra: cor.sombra, k: 0.9, rim: false });
    det.push(<Traco key={`b${k}`} d={linha([add(m, gira([-1.2, -w * 0.18], rot)), add(m, gira([1.2, -w * 0.28], rot))])} w={0.55} cor={cor.brilho} op={0.75} />);
    p = q;
  }
  // ponteira dourada
  det.push(<circle key="pt" cx={p[0]} cy={p[1]} r={1.5} fill="#FFC83D" stroke={TINTA} strokeWidth={0.45} />);
  return { formas, det };
}

export function cabeloDe(o: CabeloOpts): CabeloDesenho {
  const c = corDe(o.cor);
  const fm = (pts: PQ[], k = 2.6): Forma => ({ d: suave(pts), cor: c.base, sombra: c.sombra, k });
  // brilho especular: traços quebrados acompanhando o fio (um arco inteiro vira capacete)
  const brilho = (pts: P[], w = 2.2, op = 0.85) => (
    <path d={linha(pts)} fill="none" stroke={c.brilho} strokeWidth={w} strokeLinecap="round" opacity={op} pathLength={100} strokeDasharray="34 12 20 100" />
  );
  const fio = (pts: P[], op = 0.55) => <Traco d={linha(pts)} w={LINHA.fino * 0.85} cor={c.sombra} op={op} />;
  const v = o.vista;
  const tq = v !== 'frente';
  const bal = o.balanco;
  const sw = (y: number) => Math.sin((bal * Math.PI) / 180) * Math.max(0, y) * 0.9;
  const out: CabeloDesenho = { atras: [], frente: [], soltas: [], orelha: 'toda' };

  switch (o.tipo) {
    case 'curto': {
      // curto liso de lado: topete leve, laterais rentes, entradinhas, costeleta
      if (!tq) {
        out.frente = [fm([[-24.6, -6.5], [-25.2, -15], [-23.6, -24], [-17, -31.4], [-8, -34.2], [2, -36.2], [11, -35.6], [18.6, -31.6], [23.8, -24.4], [25.4, -15], [24.6, -6.5], [22.8, -5.8], [22.4, -11.2], [20, -15.2], [15, -16.4], [9, -15.6], [3, -17.6], [-3, -18.4], [-9, -18.2], [-14, -17.4], [-19.6, -15], [-22.4, -11.2], [-22.8, -5.8]])];
        out.detalhesFrente = (
          <g>
            {fio([[-8, -33.6], [-9, -27]])}
            {fio([[-6, -31.6], [2, -28.4], [10, -23.6], [15.6, -17.4]])}
            {fio([[-2, -34.6], [8, -31.6], [15, -26.6], [20.6, -19.6]])}
            {fio([[-12, -31], [-16, -24], [-19, -16]])}
            {brilho([[-3, -32.6], [5, -31.6], [11, -28.6]], 2)}
          </g>
        );
      } else {
        out.frente = [fm([[-20.4, 9], [-24.8, 2], [-26, -9], [-23.4, -21], [-15, -29.6], [-4, -33.6], [7, -35], [15.6, -32.4], [21.4, -26], [23.6, -18], [22.6, -12.2], [20.6, -12.4], [17, -16], [11, -16.4], [5, -17.8], [-1, -16.8], [-4.6, -12.6], [-5.2, -6], [-5.6, -2.4], [-7.8, -2.2], [-8.8, -6.8], [-12.6, -8.4], [-15.8, -5], [-17, 3]])];
        out.detalhesFrente = (
          <g>
            {fio([[-6, -31], [2, -29], [10, -25], [17, -19]])}
            {fio([[-14, -26], [-6, -24], [2, -20]])}
            {fio([[-20, -16], [-18.6, -8], [-19, 2]])}
            {brilho([[-4, -31.6], [4, -32], [12, -29.6]], 2)}
          </g>
        );
      }
      break;
    }
    case 'fade': {
      if (!tq) {
        out.frente = [
          { ...fm(sim([[0, -31.6], [6, -31.6], [15.6, -29.4], [22.6, -23], [24.8, -14], [24, -6]], [[22.4, -5], [22, -11], [17, -15.6], [8, -16.6], [0, -16.8]])), op: 0.55 },
          fm(sim([[0, -31.6], [6, -31.6], [15.6, -29.4], [21.6, -24], [22, -20]], [[20, -15.8], [8, -16.6], [0, -16.8]])),
        ];
      } else {
        out.frente = [
          { ...fm([[-19.6, 8], [-24.6, 1], [-25.4, -10], [-22, -22.2], [-13, -29.8], [0, -32.2], [10.6, -30.8], [18.6, -25.8], [22.6, -18], [22.4, -12.4], [21, -12.6], [14, -16], [5, -16.8], [-3, -15.4], [-5.2, -9], [-5.4, -2.6], [-7.6, -2.2], [-9.4, -7], [-13.6, -8.6], [-17, -4.6], [-17.6, 4]]), op: 0.55 },
          fm([[21, -12.6], [22.6, -18], [18.6, -25.8], [10.6, -30.8], [0, -32.2], [-13, -29.8], [-21, -23], [-22.4, -17.4], [-12, -19.4], [-4.4, -16.4], [5, -16.8], [14, -16]]),
        ];
      }
      // textura crespa: pequenos "c" no alto
      const cs: P[] = tq
        ? [[-14, -25], [-6, -28], [3, -29], [11, -27], [-10, -21], [0, -23], [9, -21.6], [16, -22]]
        : [[-15, -24], [-7, -27.6], [0, -28.6], [7, -27.6], [15, -24], [-10, -20.6], [0, -21.6], [10, -20.6]];
      out.detalhesFrente = (
        <g>
          {cs.map(([x, y], k) => (
            <Traco key={k} d={linha([[x - 1, y + 0.6], [x, y - 0.4], [x + 1, y + 0.4]])} w={0.6} cor={c.sombra} op={0.8} />
          ))}
          {brilho(tq ? [[-12, -27.4], [-2, -30], [7, -29.4]] : [[-10, -28.6], [0, -30], [10, -28.6]], 1.6, 0.6)}
        </g>
      );
      break;
    }
    case 'ondulado': {
      if (!tq) {
        out.frente = [fm([[24.8, 6], [27, -3], [28, -13], [26, -23], [19, -31], [8, -35], [-5, -35.4], [-17, -31.6], [-25, -24], [-27.6, -14], [-26.8, -4], [-24.6, 6], [-22.8, 5], [-23, 0], [-22.2, -8], [-18, -14], [-11, -17.2], [-3, -18.6], [4, -17.6], [10, -14.4], [16, -15.8], [21.4, -11.6], [23, -4], [22.8, 5]])];
        out.detalhesFrente = (
          <g>
            {fio([[-20, -26], [-15, -22], [-17, -17], [-13, -15]])}
            {fio([[-2, -33], [-6, -27], [-2, -22], [-5, -18]])}
            {fio([[12, -31], [8, -25], [12, -20], [10, -15]])}
            {fio([[24, -18], [21, -13], [24, -6], [22, 2]])}
            {fio([[-24, -12], [-21, -6], [-24, 0], [-22, 4]])}
            {brilho([[-14, -29], [-5, -32.2], [6, -32.6], [14, -30]])}
          </g>
        );
        out.orelha = 'meia';
      } else {
        out.frente = [fm([[-20, 12], [-24.4, 6], [-27.2, -4], [-27.2, -14], [-23.4, -25], [-14, -32.6], [0, -35.6], [12, -33.6], [20.6, -27.6], [24.6, -19], [24.2, -12], [21.6, -12], [17, -15.6], [12.4, -13.6], [6.4, -17], [-1.6, -16.6], [-5.6, -10.6], [-6, -2], [-8, 0], [-9.6, -7.4], [-14, -8.6], [-16.8, -2], [-17, 8]])];
        out.detalhesFrente = (
          <g>
            {fio([[6, -33], [3, -27], [7, -21], [4, -17]])}
            {fio([[16, -29], [13, -23], [17, -17]])}
            {fio([[-10, -31], [-13, -24], [-10, -17], [-13, -11]])}
            {fio([[-21, -20], [-24, -12], [-21, -4], [-23, 4]])}
            {brilho([[-12, -30], [-2, -33.4], [9, -32.6]])}
          </g>
        );
        out.orelha = 'meia';
      }
      break;
    }
    case 'chanel': {
      const ponta = sw(26);
      if (!tq) {
        out.atras = [fm([[-29.6, -6], [-30.2, 10], [-28.4 + ponta, 24.6], [-24.4 + ponta, 28.4], [-12, 24.6], [0, 23.6], [12, 24.6], [24.4 + ponta, 28.4], [28.4 + ponta, 24.6], [30.2, 10], [29.6, -6], [24, -26], [0, -34], [-24, -26]], 3)];
        out.frente = [
          fm([[-20.6 + ponta, 25.2], [-27.6 + ponta, 27.6], [-29.6 + ponta * 0.6, 22], [-30.2, 10], [-29.8, -6], [-26, -23], [-15.6, -31.6], [-2, -34.6], [12, -33], [23, -27], [28.6, -16], [30, -2], [30, 12], [28.6 + ponta * 0.6, 23], [25.4 + ponta, 27.8], [19.6 + ponta, 25.8], [21.6, 16], [22.6, 4], [22.2, -6], [18, -9.6], [10, -12.4], [2, -13.6], [-6, -15], [-12, -13], [-17.4, -9], [-21.6, -4], [-22.6, 6], [-21.6, 16]], 3),
        ];
        out.detalhesFrente = (
          <g>
            {fio([[7, -33.6], [4, -24], [-4, -16]])}
            {fio([[12, -31], [12, -22], [6, -13.8]])}
            {fio([[-14, -29], [-20, -18], [-24, -2], [-25, 18]])}
            {fio([[22, -24], [26, -8], [26.6, 10], [24, 24]])}
            {brilho([[-18, -24], [-8, -30.4], [4, -31.4], [15, -28]], 2.4)}
          </g>
        );
      } else {
        out.atras = [fm([[-27, -10], [-28.6, 6], [-27.6 + ponta, 20], [-22.6 + ponta, 27.6], [-14, 27], [-6, 24], [2, 24], [12, 26], [20 + ponta, 27], [24 + ponta, 22], [25.4, 6], [24.6, -10], [16, -30], [-4, -34]], 3)];
        out.frente = [
          fm([[-6 + ponta, 27.4], [-15.6 + ponta, 28.6], [-23.6 + ponta, 27.8], [-27.4 + ponta * 0.6, 20], [-28.8, 6], [-28, -10], [-23.6, -23.6], [-13, -31.6], [0, -34.6], [12.6, -32.6], [20.6, -27], [24.6, -18], [23.8, -10], [21.4, -11], [16, -12.6], [8, -13.4], [0, -15.6], [-6, -12], [-8.4, -4], [-8.6, 8], [-7.4, 18]], 3),
        ];
        out.detalhesFrente = (
          <g>
            {fio([[9, -33], [5, -23], [-2, -15]])}
            {fio([[16, -29], [16, -20], [11, -13.2]])}
            {fio([[-14, -29], [-19, -16], [-20, 4], [-18, 22]])}
            {fio([[-24, -16], [-25, 4], [-22, 24]])}
            {brilho([[-16, -26], [-5, -31.6], [8, -31.6]], 2.4)}
          </g>
        );
      }
      out.orelha = 'nada';
      break;
    }
    case 'longo': {
      const ponta = sw(60);
      const cx = tq ? -4 : 0;
      out.atras = [fm([[cx - 30, -8], [cx - 31, 20], [cx - 30 + ponta, 52], [cx - 24 + ponta, 76], [cx + ponta, 80], [cx + 24 + ponta, 76], [cx + 30 + ponta, 52], [cx + 31, 20], [cx + 30, -8], [cx + 24, -27], [cx, -35], [cx - 24, -27]], 4)];
      if (!tq) {
        out.frente = [fm([[0, -34.6], [-14, -32], [-25, -24], [-29.8, -8], [-30.4, 14], [-31 + ponta * 0.5, 40], [-26 + ponta * 0.6, 58], [-21.6 + ponta * 0.6, 54], [-22.6, 30], [-22.4, 8], [-21.6, -6], [-16, -14], [-6, -17.4], [0, -21], [6, -17.4], [16, -14], [21.6, -6], [22.4, 8], [22.6, 30], [21.6 + ponta * 0.6, 54], [26 + ponta * 0.6, 58], [31 + ponta * 0.5, 40], [30.4, 14], [29.8, -8], [25, -24], [14, -32]], 3)];
        out.detalhesFrente = (
          <g>
            {fio([[0, -33], [0, -24]])}
            {fio([[-12, -29], [-22, -12], [-26, 20], [-26, 48]])}
            {fio([[12, -29], [22, -12], [26, 20], [26, 48]])}
            {brilho([[-18, -24], [-8, -30], [-2, -31]], 2.2)}
            {brilho([[2, -31], [8, -30], [18, -24]], 2.2)}
          </g>
        );
      } else {
        out.frente = [fm([[-8.6 + ponta * 0.6, 58], [-14 + ponta * 0.6, 58], [-24 + ponta * 0.5, 30], [-28.6, 6], [-28, -10], [-23.6, -23.6], [-13, -31.6], [0, -34.6], [12.6, -32.6], [20.6, -27], [24.6, -18], [23.8, -10], [21.4, -11], [14, -14.6], [6, -17.6], [0, -19], [-6, -12], [-8.6, -4], [-9.4, 12], [-8, 36]], 3)];
        out.detalhesFrente = (
          <g>
            {fio([[4, -33], [-2, -20]])}
            {fio([[-16, -28], [-20, -8], [-18, 20], [-14, 48]])}
            {brilho([[-16, -26], [-5, -31.6], [8, -31.6]], 2.4)}
          </g>
        );
      }
      out.orelha = 'nada';
      break;
    }
    case 'cacheado':
    case 'black': {
      const black = o.tipo === 'black';
      const bal2 = sw(20) * 0.5;
      const cx = tq ? -5 : 0;
      const atras = black ? nuvem(cx, -15, 43, 38, Math.PI * 0.6, Math.PI * 2.4, 13, 3.8) : nuvem(cx, -2, 36, 38, Math.PI * 0.58, Math.PI * 2.42, 12, 4);
      const atrasP: P[] = atras.map(([x, y]) => [x + (y > 0 ? bal2 * (y / 30) : 0), y] as P);
      out.atras = [{ d: suave(atrasP), cor: c.base, sombra: c.sombra, k: 4 }];
      const caps: P[] = black
        ? tq
          ? [...nuvem(-5, -15, 41, 36, Math.PI * 0.93, Math.PI * 1.93, 9, 3.6), [24.6, -12], [20, -14.6], [12, -17.4], [3, -18.4], [-4, -15.6], [-7.4, -10], [-10, -4], [-16, -1], [-24, 4]]
          : [...nuvem(0, -15, 42, 37, Math.PI * 0.97, Math.PI * 2.03, 10, 3.6), [26, -4], [22.4, -9], [18, -14.4], [10, -17.6], [0, -18.6], [-10, -17.6], [-18, -14.4], [-22.4, -9], [-26, -4]]
        : tq
        ? [...nuvem(-2, -6, 27.6, 29.6, Math.PI * 0.86, Math.PI * 1.9, 7, 3.2), [24.2, -12], [20, -14.4], [15, -17.6], [9, -16.4], [3, -19], [-3, -16.6], [-7.4, -11], [-9.6, -4], [-12, 2], [-16, 6]]
        : [...nuvem(0, -4, 29.6, 31, Math.PI * 0.94, Math.PI * 2.06, 8, 3.4), [22.6, -4], [21.6, -10], [18.4, -14], [13, -16.6], [7, -15], [0, -18.4], [-7, -15], [-13, -16.6], [-18.4, -14], [-21.6, -10], [-22.6, -4]];
      out.frente = [{ d: suave(caps), cor: c.base, sombra: c.sombra, k: 3 }];
      // cachos: espirais curtas (sombra) e alguns brilhos
      const pos: P[] = tq
        ? [[-18, -24], [-8, -28], [4, -29], [14, -25], [-22, -12], [-16, -2], [-26, 6], [-30, 18], [-20, 22]]
        : [[-18, -24], [-6, -29], [6, -29], [18, -24], [-25, -10], [25, -10], [-30, 10], [30, 10], [-28, 24], [28, 24]];
      out.detalhesFrente = (
        <g>
          {pos.slice(0, black ? 6 : 4).map(([x, y], k) => (
            <Traco key={`f${k}`} d={linha([[x - 1.6, y + 1], [x - 1, y - 1.2], [x + 1, y - 1.4], [x + 1.6, y + 0.4], [x + 0.2, y + 1.2]])} w={0.7} cor={c.sombra} op={0.85} />
          ))}
          {brilho(tq ? [[-14, -26], [-4, -30], [6, -30]] : [[-12, -27], [0, -30.6], [12, -27]], 2.2, 0.7)}
        </g>
      );
      out.detalhesAtras = (
        <g>
          {pos.slice(4).map(([x, y], k) => (
            <Traco key={`a${k}`} d={linha([[x - 1.8, y + 1.2], [x - 1.2, y - 1.4], [x + 1.2, y - 1.6], [x + 1.8, y + 0.4], [x + 0.2, y + 1.4]])} w={0.8} cor={c.sombra} op={0.85} />
          ))}
        </g>
      );
      out.orelha = black ? 'meia' : 'nada';
      break;
    }
    case 'trancas': {
      // touca rente com as divisões, tranças atrás (muitas) e duas na frente do ombro
      if (!tq) {
        out.frente = [fm(sim([[0, -32.4], [9, -31.6], [18, -27.6], [23.6, -20], [25.4, -10], [25, 0]], [[23, 0], [22.6, -8], [18.6, -14], [9, -17.4], [0, -18.4]]), 2)];
      } else {
        out.frente = [fm([[-20, 6], [-25, 0], [-26, -10], [-22.6, -22.6], [-13.2, -30.6], [0, -32.8], [11.2, -31.2], [19.4, -26], [23.2, -18], [22.8, -12], [21, -12.6], [14, -16.6], [5, -17.6], [-3, -15.8], [-5.4, -9.6], [-6, -2], [-9, -1], [-10, -6.6], [-14, -8], [-17, -3], [-18, 4]], 2)];
      }
      const div = tq
        ? [[[-12, -30], [-16, -14]], [[-2, -32.4], [-6, -16]], [[8, -31.6], [6, -17.4]], [[-20, -22], [-2, -26], [16, -24]]]
        : [[[-12, -30], [-15, -16]], [[0, -32.4], [0, -18.4]], [[12, -30], [15, -16]], [[-21, -20], [0, -25.6], [21, -20]]];
      const raizes: P[] = tq
        ? [[-24, -2], [-22, 4], [-19, 8], [-15, 9], [-26, -10], [-12, 10]]
        : [[-24, 0], [-21, 4], [-16, 6], [16, 6], [21, 4], [24, 0], [-10, 8], [10, 8]];
      const detA: React.ReactNode[] = [];
      raizes.forEach((r, k) => {
        const tr = tranca(r, 50 + ((k * 7) % 11), bal * 0.9 + (r[0] < 0 ? 4 : -4) + (tq ? -6 : 0), o.t / 7 + k, c);
        out.atras.push(...tr.formas);
        detA.push(<g key={k}>{tr.det}</g>);
      });
      out.detalhesAtras = <g>{detA}</g>;
      // as da frente: caem por cima do ombro (só do lado que aparece)
      const frenteR: P[] = tq ? [[-7, 2], [-9, 4]] : [[-22.6, 4], [-20.4, 6], [22.6, 4], [20.4, 6]];
      const detF: React.ReactNode[] = [];
      frenteR.forEach((r, k) => {
        const tr = tranca(r, 44 + k * 3, bal * 0.6 + (r[0] < 0 ? -3 : 3), o.t / 6 + k * 1.7, c, 3.4);
        out.soltas.push(...tr.formas);
        detF.push(<g key={k}>{tr.det}</g>);
      });
      out.detalhesFrente = (
        <g>
          {div.map((d, k) => (
            <Traco key={k} d={linha(d as P[])} w={0.6} cor={c.sombra} op={0.9} />
          ))}
          {brilho(tq ? [[-12, -27], [-2, -30], [8, -29.4]] : [[-10, -28.4], [0, -30], [10, -28.4]], 1.8, 0.7)}
        </g>
      );
      out.detalhesSoltas = <g>{detF}</g>;
      out.orelha = 'toda';
      break;
    }
    case 'coque':
    case 'rabo': {
      // touca lisa puxada pra trás
      if (!tq) {
        out.frente = [fm(sim([[0, -32], [9, -31.2], [18, -27.4], [23.8, -19.6], [25, -10], [24.2, -2]], [[22.6, -2], [22, -9], [17, -15], [8, -17], [0, -17.4]]), 2)];
      } else {
        out.frente = [fm([[-20, 4], [-24.6, -2], [-25.6, -12], [-22.6, -23], [-13, -30.6], [0, -32.6], [11, -31], [19.4, -26], [23.2, -18], [22.8, -12], [21, -12.6], [14, -16.2], [5, -17], [-3, -15.4], [-6, -10], [-6.6, -3], [-9.6, -6.6], [-14, -8.2], [-17.6, -4], [-18, 2]], 2)];
      }
      // os fios puxados pra trás convergem pro prendedor (lê como cabelo preso, não touca)
      const alvo: P = o.tipo === 'coque' ? (tq ? [-14, -31] : [0, -36]) : tq ? [-22, -16] : [0, -30];
      const de: P[] = tq ? [[18, -20], [10, -17.4], [2, -17], [-4, -12], [14, -26], [4, -30]] : [[-16, -16], [-8, -17.4], [0, -17.6], [8, -17.4], [16, -16], [-21, -10], [21, -10]];
      const det: React.ReactNode[] = de.map((p, k) => <g key={`fp${k}`}>{fio([p, [(p[0] * 2 + alvo[0]) / 3, (p[1] * 2 + alvo[1]) / 3 - 2.4], alvo], 0.5)}</g>);
      if (o.tipo === 'coque') {
        const cc: P = tq ? [-14, -31] : [0, -36.6];
        const pts: P[] = [];
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          pts.push([cc[0] + Math.cos(a) * 9.6, cc[1] + Math.sin(a) * 8.6]);
        }
        out.atras.push(fm(pts, 2.4));
        det.push(<Traco key="cq" d={linha([[cc[0] - 7, cc[1] + 1], [cc[0] - 2, cc[1] - 4], [cc[0] + 6, cc[1] - 1]])} w={0.7} cor={c.sombra} />);
        det.push(<Traco key="cqb" d={linha([[cc[0] - 5, cc[1] - 4.4], [cc[0] + 1, cc[1] - 7]])} w={1.6} cor={c.brilho} op={0.7} />);
      } else {
        // rabo: preso atrás, pende e balança
        // de frente o rabo fica atrás da cabeça: só a ponta aparece balançando do lado do pescoço
        const raiz: P = tq ? [-22, -16] : [0, -14];
        const comp = 40;
        const pts: P[] = [];
        const n = 7;
        const lados: [P[], P[]] = [[], []];
        let p = raiz;
        for (let k = 0; k <= n; k++) {
          const a = (tq ? -14 : 16) + bal * (0.3 + (0.5 * k) / n) + Math.sin(o.t / 8 - k * 0.6) * (2 + 6 * o.corrida) * (k / n);
          const d = dirDe(a);
          const w = 6.2 * (1 - (k / n) * 0.75);
          lados[0].push(add(p, mul([d[1], -d[0]], w)));
          lados[1].push(add(p, mul([-d[1], d[0]], w)));
          p = add(p, mul(d, comp / n));
        }
        pts.push(...lados[0], p, ...lados[1].reverse());
        out.atras.push({ d: suave(pts), cor: c.base, sombra: c.sombra, k: 2.4 });
        if (tq) det.push(<circle key="pr" cx={raiz[0]} cy={raiz[1]} r={2.4} fill="#FFC83D" stroke={TINTA} strokeWidth={0.6} />);
      }
      det.push(<g key="br">{brilho(tq ? [[-12, -27], [-2, -30], [8, -29.4]] : [[-10, -28.4], [0, -30], [10, -28.4]], 2, 0.7)}</g>);
      out.detalhesFrente = <g>{det}</g>;
      out.orelha = 'toda';
      break;
    }
    case 'grisalho': {
      // curto, macio, volume de ondinhas, branco/cinza
      const cap: P[] = tq
        ? [...nuvem(-2, -8, 25.4, 25.6, Math.PI * 0.72, Math.PI * 1.92, 7, 2.4), [23, -12], [20, -14.6], [14, -15.4], [8, -17.6], [1, -16], [-4.4, -12.6], [-6.6, -6], [-9.4, -6.6], [-13.6, -7.6], [-17.6, -2.4], [-19.6, 6]]
        : [...nuvem(0, -7, 26.6, 26, Math.PI * 0.97, Math.PI * 2.03, 8, 2.6), [22.2, -2], [21.6, -9], [16, -15], [8, -16.2], [2, -18], [-5, -15.6], [-12, -16.4], [-18, -13], [-21.6, -8], [-22.2, -2]];
      out.frente = [{ d: suave(cap), cor: c.base, sombra: c.sombra, k: 3 }];
      const ond: P[] = tq ? [[-16, -22], [-6, -27], [6, -27], [-20, -10]] : [[-16, -22], [-5, -27], [6, -27], [16, -22]];
      out.detalhesFrente = (
        <g>
          {ond.map(([x, y], k) => (
            <Traco key={k} d={linha([[x - 2.6, y + 1.4], [x - 0.6, y - 0.8], [x + 2, y + 0.2]])} w={0.65} cor={c.sombra} op={0.85} />
          ))}
          {brilho(tq ? [[-14, -26], [-4, -30], [6, -29.6]] : [[-12, -27], [0, -30], [12, -27]], 2.2, 0.9)}
        </g>
      );
      out.orelha = 'meia';
      break;
    }
    case 'calvo': {
      if (!tq) {
        const lado = (s: number): P[] => [[22.4 * s, -13], [25.2 * s, -12], [26.4 * s, -4], [25 * s, 3], [22.6 * s, 3.4], [22 * s, -4]];
        out.frente = [fm(lado(1), 1.4), fm(lado(-1), 1.4)];
        out.orelha = 'toda';
      } else {
        out.frente = [fm([[-6.6, -4], [-8, -10], [-15, -14.6], [-22.6, -13], [-26, -3], [-24, 8], [-19.4, 13.6], [-17, 6], [-14.2, -6], [-9.8, -6.4]], 1.6)];
        out.orelha = 'toda';
      }
      out.detalhesFrente = <g>{brilho(tq ? [[-10, -25], [-1, -27.6], [7, -27]] : [[-8, -26.4], [0, -27.6], [8, -26.4]], 2.4, 0.55)}</g>;
      break;
    }
  }
  return out;
}
