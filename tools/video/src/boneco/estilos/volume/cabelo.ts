// Volume suave — cabelo. Cada corte é uma pilha de ANÉIS em volta da cabeça (altura y, raio
// lateral rx, raio de frente-trás rz, e a abertura do rosto em azimute). Projetar os anéis pelo
// giro da cabeça (frente 0°, 3/4 28°, perfil 90°) dá, sozinho, o contorno certo em toda vista:
//  - a camada de TRÁS é a largura total de cada anel (o que aparece em volta da cabeça);
//  - a camada da FRENTE é só o que está virado pra câmera (z > 0): a calota, a franja e as
//    cortinas que cobrem a orelha — de 3/4 a cortina de um lado aparece e a do outro some atrás
//    do rosto, sem desenhar nada à mão por vista.
// Coordenadas: as da cabeça (origem no centro, y pra baixo, unidades do boneco).
import type { Cabelo } from '../../elenco';
import { type P, RAD, clamp, lerp, suaviza } from './geo';

/** rzT = raio de trás (o cabelo curto cola na nuca; sem ele, o de trás é igual ao da frente) */
type Anel = { y: number; rx: number; rz: number; rzT?: number; gap?: [number, number] | null; dx?: number };

export type Tranca = { pts: P[]; r: number; frente: boolean };
export type CabeloGeo = {
  tras: P[][];
  frente: P[][];
  /** faixas de brilho (polígonos), recortadas pela frente */
  brilho: P[][];
  /** fios (linhas abertas) que seguem o caimento */
  fios: P[][];
  trancas: Tranca[];
  coque?: { c: P; r: number; frente: boolean };
  rabo?: { pts: P[]; frente: boolean };
  cacho: number; // 0 = liso; senão a amplitude do calombo
  ondaCacho: number;
  fade: boolean;
  calvo: boolean;
  /** topo do cabelo (y) e raio na testa — pro boné e a faixa */
  topo: number;
};

export type Giro = { th: number; c: number; s: number };
export const giroDe = (graus: number): Giro => ({ th: graus, c: Math.cos(graus * RAD), s: Math.sin(graus * RAD) });

/** projeta um ponto 3D da cabeça (x lateral, y, z pra frente) */
export const projeta3 = (g: Giro, x: number, y: number, z: number): { p: P; z: number } => ({ p: [x * g.c + z * g.s, y], z: -x * g.s + z * g.c });

const CZ = -0.04; // o crânio fica um tico atrás do centro do rosto (fração de W)

function projetaAneis(aneis: Anel[], g: Giro, W: number): { tras: P[]; frente: P[][] } {
  const cz = CZ * W;
  const Lo: P[] = [];
  const Ro: P[] = [];
  const fLo: P[] = [];
  const fLi: P[] = [];
  const fRi: P[] = [];
  const fRo: P[] = [];
  let algumFechado = false;
  for (const a of aneis) {
    let mn = Infinity;
    let mx = -Infinity;
    let vmn = Infinity;
    let vmx = -Infinity;
    let eMn = Infinity;
    let eMx = -Infinity;
    let dMn = Infinity;
    let dMx = -Infinity;
    const dx = a.dx ?? 0;
    for (let f = -180; f <= 180; f += 3) {
      if (a.gap && f > a.gap[0] && f < a.gap[1]) continue;
      const x = a.rx * Math.sin(f * RAD);
      const cf = Math.cos(f * RAD);
      const z = (cf >= 0 ? a.rz : a.rzT ?? a.rz) * cf + cz;
      const xp = x * g.c + z * g.s + dx;
      const zp = -x * g.s + z * g.c;
      mn = Math.min(mn, xp);
      mx = Math.max(mx, xp);
      if (zp > 0) {
        vmn = Math.min(vmn, xp);
        vmx = Math.max(vmx, xp);
        if (a.gap) {
          if (f <= a.gap[0]) {
            eMn = Math.min(eMn, xp);
            eMx = Math.max(eMx, xp);
          } else {
            dMn = Math.min(dMn, xp);
            dMx = Math.max(dMx, xp);
          }
        }
      }
    }
    if (mn === Infinity) continue;
    Lo.push([mn, a.y]);
    Ro.push([mx, a.y]);
    if (!a.gap) {
      if (vmn < Infinity) {
        algumFechado = true;
        fLo.push([vmn, a.y]);
        fRo.push([vmx, a.y]);
      }
    } else {
      if (eMn < Infinity && eMx - eMn > 0.05) {
        fLo.push([eMn, a.y]);
        fLi.push([eMx, a.y]);
      }
      if (dMn < Infinity && dMx - dMn > 0.05) {
        fRi.push([dMn, a.y]);
        fRo.push([dMx, a.y]);
      }
    }
  }
  const tras = [...Ro, ...Lo.reverse()];
  let frente: P[][];
  if (algumFechado) frente = [[...fLo, ...fLi.reverse(), ...fRi, ...fRo.reverse()]];
  else {
    // sem calota (careca): dois tufos separados
    frente = [];
    if (fLo.length > 1) frente.push([...fLo, ...fLi.reverse()]);
    if (fRi.length > 1) frente.push([...fRi, ...fRo.reverse()]);
  }
  return { tras, frente: frente.filter((p) => p.length > 2) };
}

/**
 * O cabelo de um tipo, na vista. `grav` = direção da gravidade nas coordenadas da cabeça (o
 * cabelo comprido cai pro chão mesmo com a cabeça inclinada); `arrasto` 0..1 = quanto ele vai
 * pra trás com o corpo em movimento (corrida); `t` = quadro (balanço).
 */
export function cabeloGeo(tipo: Cabelo, W: number, H: number, g: Giro, o: { grav: P; arrasto: number; t: number; idoso: boolean; esp: number }): CabeloGeo {
  const cy = -0.06 * H;
  const ry = 0.44 * H;
  // raio do crânio + volume na altura y (acima do equador, elipsoide inflado; abaixo, cai reto)
  const raio = (y: number, vol: number, queda = 0): { rx: number; rz: number } => {
    if (y <= cy) {
      const e = clamp((y - cy) / (ry + vol), -1, 1);
      const k = Math.sqrt(Math.max(0, 1 - e * e));
      return { rx: (0.5 * W + vol) * k, rz: (0.56 * W + vol) * k };
    }
    return { rx: 0.5 * W + vol + queda, rz: 0.56 * W + vol + queda * 0.6 };
  };
  const balanco = Math.sin(o.t / 9) * 0.6;
  // deslocamento do cabelo que pende (abaixo de y0): gravidade + arrasto + balanço
  const pende = (y: number, y0: number) => {
    if (y <= y0) return 0;
    const d = y - y0;
    return (d * o.grav[0]) / Math.max(0.3, o.grav[1]) - d * 0.28 * o.arrasto + balanco * d * 0.04;
  };
  const passo = H * 0.025;
  const faixa = (y0: number, y1: number, f: (y: number) => Anel | null): Anel[] => {
    const out: Anel[] = [];
    for (let y = y0; y <= y1 + 1e-6; y += passo) {
      const a = f(y);
      if (a) out.push(a);
    }
    return out;
  };
  const fr = (y: number) => y / H; // fração da cabeça
  const topoDe = (vol: number) => cy - ry - vol;

  const geo: CabeloGeo = { tras: [], frente: [], brilho: [], fios: [], trancas: [], cacho: 0, ondaCacho: 0, fade: false, calvo: false, topo: topoDe(2) };

  // a linha do cabelo na testa: a abertura começa em `testa` e chega a `lado` graus na têmpora
  const abertura = (y: number, testa: number, lado: number, tempora = -0.12, assim = 0): [number, number] | null => {
    const x = fr(y);
    if (x < testa) return null;
    const k = suaviza(testa, tempora, x) ** 0.55;
    const gg = lerp(10, lado, k);
    return [-gg * (1 - assim), gg * (1 + assim)];
  };

  let aneis: Anel[] = [];
  const vol = { curto: 2.6, chanel: 2.8, ondulado: 4.0, cacheado: 6.5, black: 12, trancas: 1.5, coque: 1.4, rabo: 1.4, longo: 2.2, calvo: 1.4, grisalho: 3.4, fade: 1.3 }[tipo];
  geo.topo = topoDe(vol);

  switch (tipo) {
    case 'curto':
    case 'fade': {
      const fade = tipo === 'fade';
      geo.fade = fade;
      aneis = faixa(topoDe(vol) + 0.4, 0.16 * H, (y) => {
        const x = fr(y);
        const v = fade ? lerp(vol, 0.5, suaviza(-0.3, -0.05, x)) : lerp(vol, 1, suaviza(-0.1, 0.15, x));
        const r = raio(y, v, -suaviza(0, 0.16, x) * 1.6);
        const rzT = r.rz - v * 0.7 - 1.2 * suaviza(-0.25, 0.1, x);
        let gap: [number, number] | null;
        if (x < (fade ? -0.38 : -0.4)) gap = null;
        else if (x < 0.02) gap = abertura(y, fade ? -0.38 : -0.4, fade ? 76 : 82, fade ? -0.26 : -0.16, fade ? 0 : 0.14);
        else {
          const gg = lerp(96, 128, suaviza(0.03, 0.12, x)) + 46 * suaviza(0.1, 0.16, x) ** 1.5;
          gap = [-gg, gg];
        }
        return { y, ...r, rzT, gap };
      });
      break;
    }
    case 'chanel': {
      aneis = faixa(topoDe(vol) + 0.4, 0.47 * H, (y) => {
        const x = fr(y);
        const queda = x > -0.06 ? 2.2 * suaviza(-0.06, 0.3, x) - 2.4 * suaviza(0.36, 0.47, x) : 0;
        const r = raio(y, vol, queda);
        // franja lateral: a abertura nasce mais pra direita (o cabelo cai da risca pra esquerda)
        const gap = x < -0.37 ? null : x < -0.1 ? abertura(y, -0.37, 56, -0.12, 0.35) : ([-56, 62] as [number, number]);
        return { y, ...r, gap, dx: pende(y, 0.1 * H) };
      });
      break;
    }
    case 'ondulado': {
      aneis = faixa(topoDe(vol) + 0.4, 0.3 * H, (y) => {
        const x = fr(y);
        const r = raio(y, vol, -1.2 * suaviza(0.1, 0.3, x));
        let gap: [number, number] | null;
        if (x < -0.36) gap = null;
        else if (x < 0.0) gap = abertura(y, -0.36, 74, -0.1, -0.2);
        else gap = [-lerp(84, 118, suaviza(0, 0.22, x)), lerp(84, 118, suaviza(0, 0.22, x))];
        return { y, ...r, gap, dx: pende(y, 0.1 * H) };
      });
      geo.cacho = 1.3;
      geo.ondaCacho = 10;
      break;
    }
    case 'cacheado':
    case 'black': {
      const black = tipo === 'black';
      const fim = black ? 0.28 : 1.05;
      aneis = faixa(topoDe(vol) + 0.6, fim * H, (y) => {
        const x = fr(y);
        const queda = black ? -vol * 0.9 * suaviza(0.0, fim, x) ** 1.5 : 7 * suaviza(-0.06, 0.55, x) - 9 * suaviza(0.7, fim, x) ** 1.4;
        const r = raio(y, vol, queda);
        const gap = x < -0.36 ? null : abertura(y, -0.36, black ? 64 : 60, -0.16);
        return { y, ...r, gap, dx: pende(y, 0.2 * H) };
      });
      geo.cacho = black ? 1.6 : 1.9;
      geo.ondaCacho = black ? 5 : 6;
      break;
    }
    case 'grisalho': {
      aneis = faixa(topoDe(vol) + 0.4, 0.2 * H, (y) => {
        const x = fr(y);
        const vg = lerp(vol, 1.4, suaviza(-0.1, 0.2, x));
        const r0 = raio(y, vg, -1.4 * suaviza(0.05, 0.2, x));
        const r = { ...r0, rzT: r0.rz - vg * 0.4 };
        let gap: [number, number] | null;
        if (x < -0.37) gap = null;
        else if (x < 0.02) gap = abertura(y, -0.37, 72, -0.12, 0.1);
        else {
          const gg = lerp(100, 130, suaviza(0.02, 0.14, x)) + 44 * suaviza(0.12, 0.2, x) ** 1.5;
          gap = [-gg, gg];
        }
        return { y, ...r, gap };
      });
      geo.cacho = 1.1;
      geo.ondaCacho = 4.6;
      break;
    }
    case 'calvo': {
      geo.calvo = true;
      // a ferradura: dos lados acima da orelha e em volta da nuca, afinando na têmpora
      aneis = faixa(-0.24 * H, 0.2 * H, (y) => {
        const x = fr(y);
        const v = vol * suaviza(-0.24, -0.15, x) ** 0.7;
        const r0 = raio(y, v, -0.8 * suaviza(0.05, 0.2, x));
        const r = { ...r0, rzT: r0.rz - v * 0.55 };
        const lado = x < -0.06 ? lerp(132, 82, suaviza(-0.24, -0.06, x)) : x < 0.02 ? lerp(82, 104, suaviza(-0.06, 0.02, x)) : lerp(104, 150, suaviza(0.02, 0.2, x));
        return { y, ...r, gap: [-lado, lado] as [number, number] };
      });
      break;
    }
    case 'trancas':
    case 'coque':
    case 'rabo':
    case 'longo': {
      const longo = tipo === 'longo';
      const fim = longo ? 1.75 : 0.14;
      aneis = faixa(topoDe(vol) + 0.4, fim * H, (y) => {
        const x = fr(y);
        const queda = longo ? 1.4 * suaviza(0, 0.4, x) - 2 * suaviza(1.4, 1.75, x) : -1 * suaviza(0.05, 0.14, x);
        const r = raio(y, vol, queda);
        let gap: [number, number] | null;
        if (x < -0.38) gap = null;
        else if (longo) gap = x < -0.1 ? abertura(y, -0.38, 56, -0.12) : [-56, 56];
        else if (x < 0.0) gap = abertura(y, -0.38, 80, -0.1);
        else gap = [-lerp(98, 130, suaviza(0, 0.13, x)), lerp(98, 130, suaviza(0, 0.13, x))];
        return { y, ...r, gap, dx: longo ? pende(y, 0.15 * H) : 0 };
      });
      break;
    }
  }

  // de perfil a abertura do rosto alarga: a cortina fica atrás da maçã do rosto, não em cima dela
  const alarga = 26 * g.s * g.s;
  if (alarga > 0.5) for (const a of aneis) if (a.gap && a.gap[1] - a.gap[0] > 60) a.gap = [a.gap[0] - alarga, a.gap[1] + alarga * 0.3];
  const pr = projetaAneis(aneis, g, W);
  geo.tras = [pr.tras];
  geo.frente = pr.frente;

  // brilho: um crescente que acompanha a calota em cima, do lado da luz (afinando nas pontas)
  if (!geo.calvo) {
    const v = vol + 0.2;
    const hw = Math.hypot((0.5 * W + v) * g.c, (0.56 * W + v) * g.s);
    const x0 = CZ * W * g.s;
    const ryH = 0.44 * H + v;
    const crescente = (a0: number, a1: number, fora: number, larg: number): P[] => {
      const ext: P[] = [];
      const int: P[] = [];
      for (let q = 0; q <= 12; q++) {
        const sq = q / 12;
        const ang = (lerp(a0, a1, sq) * Math.PI) / 180;
        const e = fora - larg * Math.sin(Math.PI * sq);
        ext.push([x0 + Math.cos(ang) * hw * fora, -0.06 * H + Math.sin(ang) * ryH * fora]);
        int.push([x0 + Math.cos(ang) * hw * e, -0.06 * H + Math.sin(ang) * ryH * e]);
      }
      return [...ext, ...int.reverse()];
    };
    // espelho: a luz vem da direita aqui dentro
    const m = (a: number) => (o.esp > 0 ? a : 180 - a + 360);
    const [a0, a1] = o.esp > 0 ? [198, 292] : [m(292), m(198)];
    geo.brilho.push(crescente(a0, a1, 0.86, 0.17));
    const [b0, b1] = o.esp > 0 ? [214, 272] : [m(272), m(214)];
    geo.brilho.push(crescente(b0, b1, 0.8, 0.05));
  }

  // fios: meridianos da coroa até a borda da frente (só no cabelo liso/ondulado)
  if (['curto', 'chanel', 'ondulado', 'longo', 'coque', 'rabo', 'trancas'].includes(tipo)) {
    const ATE: Record<string, number> = { curto: -0.22, chanel: 0.44, ondulado: 0.2, longo: 1.6, coque: -0.2, rabo: -0.2, trancas: -0.2 };
    const ate = ATE[tipo] ?? 0;
    const meridianos = tipo === 'chanel' ? [-150, -120, -96, -70, 66, 92] : tipo === 'longo' ? [-150, -118, -92, -70, 68, 94, 120] : tipo === 'curto' ? [-150, -125, -100, -75, -50, -25, 0, 25, 50, 75] : [-120, -80, -40, 0, 40, 80];
    for (const f of meridianos) {
      const linha: P[] = [];
      for (let y = geo.topo + 0.08 * H; y <= ate * H; y += passo) {
        const a = aneis.find((q) => Math.abs(q.y - y) < passo / 2);
        if (!a) continue;
        if (a.gap && f > a.gap[0] && f < a.gap[1]) break;
        const q = projeta3(g, (a.rx - 0.4) * Math.sin(f * RAD), y, (a.rz - 0.4) * Math.cos(f * RAD) + CZ * W);
        if (q.z <= 0.3) {
          if (linha.length) break;
          continue;
        }
        linha.push([q.p[0] + (a.dx ?? 0), y]);
      }
      if (linha.length > 2) geo.fios.push(linha);
    }
  }

  // tranças: saem da linha de trás/lados e caem com a gravidade; as das têmporas caem na frente do ombro
  if (tipo === 'trancas') {
    const angs = [-168, -146, -124, -104, -86, -70, 70, 86, 104, 124, 146, 168, 180];
    angs.forEach((f0, i) => {
      const f = g.s > 0.9 && Math.abs(f0) < 106 ? Math.sign(f0) * (106 + (Math.abs(f0) - 70) * 0.4) : f0;
      const y0 = Math.abs(f) < 80 ? -0.1 * H : Math.abs(f) < 110 ? 0.0 * H : 0.08 * H;
      const r = raio(y0, vol);
      const q = projeta3(g, r.rx * Math.sin(f * RAD), y0, r.rz * Math.cos(f * RAD) + CZ * W);
      const comp = (1.85 + 0.25 * Math.sin(i * 2.3)) * H;
      const abre = (q.p[0] >= 0 ? 1 : -1) * (0.05 + 0.04 * Math.cos(i)) * W;
      const pts: P[] = [];
      const N = 22;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const d = comp * t;
        const ext = abre * Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5);
        const sw = (Math.sin(o.t / 8 + i) * 0.5 + balanco) * d * 0.03;
        pts.push([q.p[0] + ext + (d * o.grav[0]) / Math.max(0.3, o.grav[1]) - d * 0.3 * o.arrasto + sw, q.p[1] + d * o.grav[1]]);
      }
      geo.trancas.push({ pts, r: 0.058 * W, frente: q.z > 0.02 * W && Math.abs(f) < 100 });
    });
  }

  if (tipo === 'coque') {
    const y0 = -0.47 * H;
    const q = projeta3(g, 0, y0, -0.42 * W + CZ * W);
    geo.coque = { c: q.p, r: 0.23 * W, frente: q.z > 0 };
  }

  if (tipo === 'rabo') {
    const y0 = -0.26 * H;
    const q = projeta3(g, 0, y0, -0.58 * W + CZ * W);
    const comp = 1.25 * H;
    const pts: P[] = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const d = comp * t;
      const sw = balanco * d * 0.06;
      // sai da cabeça pra trás e cai
      const sai = -0.12 * W * Math.sin(Math.min(1, t * 3) * Math.PI * 0.5) * (g.s + 0.3);
      pts.push([q.p[0] + sai + (d * o.grav[0]) / Math.max(0.3, o.grav[1]) - d * 0.35 * o.arrasto + sw, q.p[1] + d * o.grav[1]]);
    }
    geo.rabo = { pts, frente: false };
  }

  return geo;
}
