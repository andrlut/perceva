// Volume suave — geometria: vetores, tubos (membros afinando), caminho suave e casco convexo.
// Tudo em unidades do boneco (y pra baixo). Nada aqui sabe de pessoa nem de roupa.

export type P = [number, number];
export const RAD = Math.PI / 180;

export const soma = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const esc = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const comp = (a: P) => Math.hypot(a[0], a[1]);
export const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const unit = (a: P): P => {
  const n = comp(a) || 1e-6;
  return [a[0] / n, a[1] / n];
};
export const ponto = (a: P, b: P) => a[0] * b[0] + a[1] * b[1];
/** perpendicular (gira 90° no sentido horário da tela) */
export const perp = (a: P): P => [-a[1], a[0]];
export const mixP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const suaviza = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
/** direção do ângulo da convenção do esqueleto (0 = baixo, + = pra +x) */
export const dirAng = (a: number): P => [Math.sin(a * RAD), Math.cos(a * RAD)];
/** gira um ponto em volta da origem (graus, sentido do SVG) */
export const gira = (p: P, a: number): P => {
  const c = Math.cos(a * RAD);
  const s = Math.sin(a * RAD);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};

const f2 = (x: number) => (Math.round(x * 100) / 100).toString();

/** polígono → path com retas */
export const poli = (pts: P[], fecha = true) => (pts.length ? `M${pts.map((p) => `${f2(p[0])} ${f2(p[1])}`).join('L')}${fecha ? 'Z' : ''}` : '');

/** caminho suave (Catmull-Rom → Bézier) passando pelos pontos */
export function suave(pts: P[], fecha = true, k = 1 / 6): string {
  const n = pts.length;
  if (n < 3) return poli(pts, fecha);
  const at = (i: number) => (fecha ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  const last = fecha ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return fecha ? `${d}Z` : d;
}

/**
 * Tubo reto de `a` a `b` com raio variando ao longo (perfil r(t), t 0..1): o membro que afina,
 * com a panturrilha e o bíceps. Pontas redondas (junta) ou quase retas (barra da manga/calça).
 */
export function tubo(a: P, b: P, r: (t: number) => number, o: { n?: number; pontaA?: 'redonda' | 'reta'; pontaB?: 'redonda' | 'reta' } = {}): P[] {
  const L = dist(a, b);
  const d: P = L < 1e-4 ? [0, 1] : unit(sub(b, a));
  const nn = perp(d);
  const N = o.n ?? 10;
  const ladoA: P[] = [];
  const ladoB: P[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = soma(a, esc(d, L * t));
    const rr = r(t);
    ladoA.push(soma(c, esc(nn, rr)));
    ladoB.push(soma(c, esc(nn, -rr)));
  }
  const M = 9;
  const capB: P[] = [];
  const rb = r(1);
  const kb = o.pontaB === 'reta' ? 0.22 : 1;
  for (let k = 1; k < M; k++) {
    const an = (k / M) * Math.PI;
    capB.push(soma(b, soma(esc(nn, Math.cos(an) * rb), esc(d, Math.sin(an) * rb * kb))));
  }
  const capA: P[] = [];
  const ra = r(0);
  const ka = o.pontaA === 'reta' ? 0.22 : 1;
  for (let k = 1; k < M; k++) {
    const an = (k / M) * Math.PI;
    capA.push(soma(a, soma(esc(nn, -Math.cos(an) * ra), esc(d, -Math.sin(an) * ra * ka))));
  }
  return [...ladoA, ...capB, ...ladoB.reverse(), ...capA];
}

/** elipse amostrada (centro, raios, giro em graus) */
export function elipse(c: P, rx: number, ry: number, giro = 0, n = 28): P[] {
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(soma(c, gira([Math.cos(a) * rx, Math.sin(a) * ry], giro)));
  }
  return out;
}

/** casco convexo (cadeia monótona) */
export function casco(pts: P[]): P[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: P[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

/** área com sinal (positiva = horário na tela, y pra baixo) */
export const area = (pts: P[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};

/** reamostra um polígono fechado em passos de `passo` (mantém a forma) */
export function reamostra(pts: P[], passo: number): P[] {
  const out: P[] = [];
  const n = pts.length;
  let resto = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const L = dist(a, b);
    let s = resto;
    while (s < L) {
      out.push(mixP(a, b, s / L));
      s += passo;
    }
    resto = s - L;
  }
  return out;
}

/**
 * Borda de cacho: reamostra e empurra pra fora em calombos redondos (cachos, black, crespo).
 * `amp` = altura do calombo, `onda` = largura de cada cacho.
 */
export function cachos(pts: P[], amp: number, onda: number, fase = 0): P[] {
  const r = reamostra(pts, onda / 4);
  const sentido = area(pts) > 0 ? 1 : -1;
  const n = r.length;
  return r.map((p, i) => {
    const a = r[(i - 1 + n) % n];
    const b = r[(i + 1) % n];
    const t = unit(sub(b, a));
    // normal pra fora
    const nf: P = sentido > 0 ? [t[1], -t[0]] : [-t[1], t[0]];
    const k = Math.abs(Math.sin(((i + fase) / 4) * Math.PI));
    return soma(p, esc(nf, amp * (k ** 0.6 - 0.35)));
  });
}

/** semente determinística 0..1 */
export const hash = (s: string | number) => {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};
