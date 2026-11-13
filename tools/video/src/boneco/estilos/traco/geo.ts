// Traço editorial — geometria: vetores, caminho suave (Catmull-Rom → Bézier) e o contorno de um
// membro (cápsula afinada com perfil de músculo dos dois lados).
import type { P } from '../../esqueleto';

export type { P };
/** ponto com flag de canto (3º valor = 1: o caminho faz quina ali em vez de curva) */
export type Q = P | [number, number, number];

const RAD = Math.PI / 180;
export const f1 = (v: number) => (Math.round(v * 100) / 100).toString();
export const fp = (p: Q) => `${f1(p[0])} ${f1(p[1])}`;

export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const lerpP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const suave01 = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

/** direção de um osso de ângulo `a` (0 = baixo, + = pra +x) */
export const dirDe = (a: number): P => [Math.sin(a * RAD), Math.cos(a * RAD)];
/** a "frente" do osso (90° da direção): pra um osso pendurado (a = 0) é +x */
export const frenteDe = (a: number): P => [Math.cos(a * RAD), -Math.sin(a * RAD)];
/** ângulo (convenção dos ossos) do vetor a→b */
export const angDe = (a: P, b: P) => Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD;

/** base local: origem `o`, eixo `d` (comprimento) e `n` (largura). Devolve (x ao longo, y pro lado). */
export const base = (o: P, d: P, n: P) => (x: number, y: number): P => [o[0] + d[0] * x + n[0] * y, o[1] + d[1] * x + n[1] * y];

/** gira um vetor (graus, sentido SVG) */
export const gira = (v: P, a: number): P => {
  const c = Math.cos(a * RAD);
  const s = Math.sin(a * RAD);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};

/**
 * Caminho suave pelos pontos (Catmull-Rom uniforme virando cúbicas). Ponto com 3º valor = 1 é
 * quina. `tens` < 1 deixa as curvas mais retas.
 */
export function suave(pts: Q[], fechado = true, tens = 1): string {
  const n = pts.length;
  if (n < 2) return '';
  const get = (i: number): Q => (fechado ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const canto = (p: Q) => p.length === 3 && p[2] === 1;
  let d = `M${fp(pts[0])}`;
  const segs = fechado ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const k = tens / 6;
    const c1: P = canto(p1) ? [p1[0], p1[1]] : [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = canto(p2) ? [p2[0], p2[1]] : [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${fp(c1)} ${fp(c2)} ${fp(p2)}`;
  }
  return fechado ? `${d}Z` : d;
}

/** polígono reto */
export const poli = (pts: Q[]) => `M${pts.map(fp).join('L')}Z`;

/** elipse girada como caminho (pra entrar em clipPath junto com os outros) */
export const elipse = (c: P, rx: number, ry: number, a = 0): string => {
  const pts: P[] = [];
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    pts.push(add(c, gira([Math.cos(t) * rx, Math.sin(t) * ry], a)));
  }
  return suave(pts);
};

/**
 * Perfil de um osso: nós [t (0..1 ao longo), raio do lado da FRENTE, raio do lado de TRÁS].
 * A frente é `frenteDe(ângulo)`: num membro pendurado, o lado +x.
 */
export type Perfil = [number, number, number][];

/**
 * Contorno de um membro de um osso só, de `a` até `b`, com pontas redondas. Os pontos saem em
 * ordem (frente de a→b, ponta em b, trás de b→a, ponta em a) pra virar `suave(...)`.
 */
export function membro(a: P, b: P, perfil: Perfil, pontaA = true, pontaB = true): P[] {
  const L = dist(a, b) || 1e-6;
  const d: P = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
  const n: P = [d[1], -d[0]];
  const at = (t: number, off: number): P => [a[0] + d[0] * L * t + n[0] * off, a[1] + d[1] * L * t + n[1] * off];
  const out: P[] = [];
  for (const [t, rf] of perfil) out.push(at(t, rf));
  const last = perfil[perfil.length - 1];
  const first = perfil[0];
  const cap = (c: P, rf: number, rb: number, dirSign: number, from: 'f' | 'b') => {
    const r = (rf + rb) / 2;
    const pts: P[] = [];
    // semicírculo: da frente pra trás (ponta b) ou de trás pra frente (ponta a)
    for (let i = 1; i < 6; i++) {
      const th = (i / 6) * Math.PI;
      const cs = Math.cos(th);
      const side = from === 'f' ? cs * (cs > 0 ? rf : rb) : -cs * (-cs > 0 ? rf : rb);
      pts.push([c[0] + n[0] * side + d[0] * dirSign * r * Math.sin(th), c[1] + n[1] * side + d[1] * dirSign * r * Math.sin(th)]);
    }
    return pts;
  };
  if (pontaB) out.push(...cap(at(last[0], 0), last[1], last[2], 1, 'f'));
  for (let i = perfil.length - 1; i >= 0; i--) out.push(at(perfil[i][0], -perfil[i][2]));
  if (pontaA) out.push(...cap(at(first[0], 0), first[1], first[2], -1, 'b'));
  return out;
}

/** raio do perfil no ponto t (média dos dois lados), interpolado */
export const raioEm = (perfil: Perfil, t: number) => {
  for (let i = 1; i < perfil.length; i++) {
    const [t0, f0, b0] = perfil[i - 1];
    const [t1, f2, b1] = perfil[i];
    if (t <= t1) {
      const k = (t - t0) / Math.max(1e-6, t1 - t0);
      return [lerp(f0, f2, k), lerp(b0, b1, k)] as [number, number];
    }
  }
  const l = perfil[perfil.length - 1];
  return [l[1], l[2]] as [number, number];
};

/** um perfil com folga (roupa por cima): soma `e` nos dois lados, corta entre t0 e t1 */
export const folga = (perfil: Perfil, e: number, t0 = 0, t1 = 1, eTras = e): Perfil => {
  const out: Perfil = [];
  const [f0, b0] = raioEm(perfil, t0);
  out.push([t0, f0 + e, b0 + eTras]);
  for (const [t, f, b] of perfil) if (t > t0 + 1e-3 && t < t1 - 1e-3) out.push([t, f + e, b + eTras]);
  const [f2, b2] = raioEm(perfil, t1);
  out.push([t1, f2 + e, b2 + eTras]);
  return out;
};

/** marca um ponto como quina pro `suave` */
export const canto = (p: P): Q => [p[0], p[1], 1];

/** amostra o Catmull-Rom fechado pelos pontos: `k` pontos por trecho (pra deformar o contorno) */
export function denso(pts: P[], k = 8): P[] {
  const n = pts.length;
  const out: P[] = [];
  const g = (i: number) => pts[((i % n) + n) % n];
  for (let i = 0; i < n; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    for (let s = 0; s < k; s++) {
      const t = s / k;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/** caminho de polilinha fechada (pontos densos) */
export const linhaFechada = (pts: P[]) => `M${pts.map(fp).join('L')}Z`;
