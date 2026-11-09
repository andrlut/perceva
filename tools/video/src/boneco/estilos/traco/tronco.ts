// Traço editorial — a geometria do tronco. O tronco é uma pilha de ANÉIS (meia largura de frente,
// profundidade da frente e de trás) projetada pela vista: de frente vale a largura; de 3/4 e de
// perfil, a profundidade aparece (peito/busto/barriga pra +x, costas e glúteo pra −x). Toda peça
// (camiseta, decote, botões, bolso) é posta NA SUPERFÍCIE (ângulo em volta do anel + nível), então
// acompanha a vista e a inclinação sem regra especial.
import type { Juntas, Proporcao } from '../../esqueleto';
import type { Corpo } from './medidas';
import { type P, lerp, suave01 } from './geo';

const RAD = Math.PI / 180;

export type Tronco = {
  T: number;
  cphi: number;
  sphi: number;
  /** ponto do corpo: u = de lado (+x da tela quando o tronco está em pé), v = sobe da pélvis */
  pt: (u: number, v: number) => P;
  anel: (v: number) => [number, number, number];
  /** silhueta do lado +x (frente, na vista de 3/4) e do lado −x, com folga `e` */
  xM: (v: number, e?: number) => number;
  xm: (v: number, e?: number) => number;
  /** ponto da superfície da FRENTE: th −90 (lado −x) .. 0 (meio da frente) .. 90 (lado +x) */
  sup: (th: number, v: number, e?: number) => P;
  /** u do meio da frente no nível v */
  meio: (v: number, e?: number) => number;
  /** a linha do pescoço: base (centro) e meia largura */
  pescoco: { u: number; v: number; r: number };
  /** ângulo do anel no nível v (pra girar detalhes) */
  giro: (v: number) => number;
  /** direção "pra cima" da coluna no nível v */
  cima: (v: number) => P;
};

export function troncoDe(j: Juntas, prop: Proporcao, corpo: Corpo): Tronco {
  const cphi = j.largura;
  const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
  const T = Math.hypot(j.peito[0] - j.pelvis[0], j.peito[1] - j.pelvis[1]);
  const tr = j.ang.tronco;
  // o tronco "avança" pra +x na vista de 3/4: o ombro da frente (o braço que passa por cima) fica
  // no LADO do tronco, não na frente do peito
  // (rodada 2: o esqueleto pôs o ombro da frente em −x na vista de 3/4 — o tronco não precisa mais
  // "avançar" pra +x pra o braço da frente cair no lado do corpo)
  const desl = (_v: number) => 0;
  const giro = (v: number) => (v >= 0 ? lerp(tr * 0.35, tr, suave01(v / (0.5 * T))) : tr * 0.35);
  const cima = (v: number): P => {
    const a = giro(v) * RAD;
    return [Math.sin(a), -Math.cos(a)];
  };
  const espinha = (v: number): P => {
    if (v >= 0) {
      const k = v / T;
      return [lerp(j.pelvis[0], j.peito[0], k), lerp(j.pelvis[1], j.peito[1], k)];
    }
    const c = cima(v);
    return [j.pelvis[0] + c[0] * v, j.pelvis[1] + c[1] * v];
  };
  const pt = (u: number, v: number): P => {
    const a = giro(v) * RAD;
    const s = espinha(v);
    const uu = u + desl(v);
    return [s[0] + Math.cos(a) * uu, s[1] + Math.sin(a) * uu];
  };
  // a corcunda leve do idoso: o alto das costas arredonda
  const aneis = corpo.aneis.map(([v, a, bf, bb]) => [(v / prop.tronco) * T, a, bf, bb] as [number, number, number, number]);
  const anel = (v: number): [number, number, number] => {
    if (v <= aneis[0][0]) return [aneis[0][1], aneis[0][2], aneis[0][3]];
    for (let i = 1; i < aneis.length; i++) {
      const [v1, a1, f1, b1] = aneis[i];
      if (v <= v1) {
        const [v0, a0, f0, b0] = aneis[i - 1];
        const k = suave01((v - v0) / (v1 - v0));
        return [lerp(a0, a1, k), lerp(f0, f1, k), lerp(b0, b1, k)];
      }
    }
    const l = aneis[aneis.length - 1];
    return [l[1], l[2], l[3]];
  };
  const xM = (v: number, e = 0) => {
    const [a, bf] = anel(v);
    return Math.hypot((a + e) * cphi, (bf + e) * sphi);
  };
  const xm = (v: number, e = 0) => {
    const [a, , bb] = anel(v);
    return -Math.hypot((a + e) * cphi, (bb + e) * sphi);
  };
  const sup = (th: number, v: number, e = 0) => {
    const [a, bf] = anel(v);
    const t = th * RAD;
    return pt((a + e) * Math.sin(t) * cphi + (bf + e) * Math.cos(t) * sphi, v);
  };
  const meio = (v: number, e = 0) => (anel(v)[1] + e) * sphi;
  // o pescoço sai um tico atrás do meio (de 3/4 e perfil), sempre perto da cabeça
  const pescoco = { u: j.vista === 'frente' ? 0 : -0.04 * prop.cabecaLarg, v: T, r: corpo.pescoco };
  return { T, cphi, sphi, pt, anel, xM, xm, sup, meio, pescoco, giro, cima };
}
