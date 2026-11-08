// Lente (fase 3): a lupa redonda que mostra o que acontece DENTRO (da pele, do copo, do músculo).
//
// Abre na deixa (sem deixa, quando a fala começa): o círculo nasce na âncora e assenta no centro com
// MOLA.entra, ligado a ela por um cone (as duas tangentes, um véu violeta e um ponto-anel na âncora).
// Aro dourado de 8 px com sombra interna embaixo do topo e o brilho do vidro no alto à esquerda.
// `cresce`: em 20 q a lente passa de 2400 px, o aro sai da tela e o conteúdo reescala pra caixa de
// 1000 × 1080 do palco. `fecha`: volta pra âncora em 8 q (sai()).
//
// Dentro, um de dois conteúdos:
//  - camadas (1..3 bandas horizontais, altura pelo `peso`): liso | rede | dobras | fluxo | agua, com
//    `then` rareia | renova na deixa `turn` da lente (sem turn, na deixa dela), o dedo do `toque` e
//    partículas ponto | cordao (topo, quebra, atravessa, correnteza, boiam, destaque);
//  - reserva: o Reservatorio (src/elenco/reservatorio.tsx) no centro, com 0,8 da altura.
// Os rótulos de camada, partícula e reserva usam o Rotulo, dentro do círculo ou colados no aro.
//
// Não confundir com a `Lente` de src/components.tsx (vinheta redonda presa ao quadro).
// Importa só TIPOS de scenes.tsx (sem ciclo de import).
import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOLA, ramp, sai } from '../components';
import { Reservatorio, mix, reservaAt, rnd } from '../elenco/reservatorio';
import { C, dimColor } from '../theme';
import { cue } from '../timeline';
import type { Rect } from './ambientes';
import { Rotulo, rotuloRect } from './rotulo';
import type { MS } from './scenes';
import type { Camada, CorFluxo, LenteSpec, Particulas } from './spec';

/** O quadrado que a lente ocupa (vai pro `busy` da cena: rótulo e cenário saem dali). */
export const lenteRect = (centro: [number, number], diametro: number): Rect => [centro[0] - diametro / 2, centro[1] - diametro / 2, centro[0] + diametro / 2, centro[1] + diametro / 2];

// ------------------------------------------------------------------ medidas e utilidades

/** A lente que cresce: diâmetro final, centro e a caixa do conteúdo (o palco). */
const CRESCE = { q: 20, d: 2400, centro: [540, 940] as [number, number], w: 1000, h: 1080 };
const FECHA = 8;
/** Ar em cima do corte de pele (o dedo precisa de uma superfície pra apertar). */
const GAP = 0.15;
/** Quanto o afundado do dedo desce em cada divisa (a de cima afunda, as de baixo comprimem). */
const FAT = [1, 0.6, 0.25];
const SHADE = 'rgba(10,14,38,0.26)';
const AR = mix(C.deep, C.surface, 0.5);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);
const f1 = (v: number) => v.toFixed(1);

const corDe = (c: CorFluxo) => (c === 'ouro' ? C.gold : dimColor(c));
/** Sem cor: as frentes misturadas de sempre (nunca ouro, pra o destaque se separar). */
const MISTA: CorFluxo[] = ['mind', 'bonds', 'health', 'craft'];
const paleta = (cor?: CorFluxo | CorFluxo[]) => (cor === undefined ? MISTA : Array.isArray(cor) ? (cor.length ? cor : MISTA) : [cor]).map(corDe);

const TOM_PADRAO: Record<Camada['textura'], NonNullable<Camada['tom']>> = { liso: 'fundo', rede: 'area', dobras: 'violeta', fluxo: 'violeta', agua: 'violeta' };
const tomDe = (c: Camada, accent: string, pele: string) => {
  const t = c.tom ?? TOM_PADRAO[c.textura];
  return t === 'pele' ? pele : t === 'area' ? accent : t === 'violeta' ? C.violet : t === 'ouro' ? C.gold : C.surface2;
};

type Banda = { y0: number; y1: number };
/** As bandas (y0..y1 na caixa do conteúdo). Corte de pele (ou com dedo) deixa ar em cima. */
const bandasDe = (camadas: Camada[], h: number, toque?: string): Banda[] => {
  const first = camadas[0];
  const gap = first && first.textura !== 'agua' && (first.tom === 'pele' || toque) ? GAP * h : 0;
  const total = camadas.reduce((a, c) => a + (c.peso ?? 1), 0) || 1;
  let y = gap;
  return camadas.map((c) => {
    const bh = ((h - gap) * (c.peso ?? 1)) / total;
    const b = { y0: y, y1: y + bh };
    y += bh;
    return b;
  });
};
/** Onde o cordão descansa: na banda `de`, ou no alto da primeira. */
const restoCordao = (bs: Banda[], h: number, p: Particulas) => {
  const b = typeof p.de === 'number' ? bs[p.de] : undefined;
  if (b) return (b.y0 + b.y1) / 2;
  if (!bs[0]) return h * 0.4;
  return bs.length > 1 ? bs[0].y0 + (bs[0].y1 - bs[0].y0) * 0.74 : h * 0.42;
};
/** O cordão parte em pedaços de 2 ou 3 contas (fixos pelo índice). */
const grupos = (n: number) => {
  const out: number[][] = [];
  for (let j = 0, g = 0; j < n; g++) {
    const sz = Math.min(rnd(g, 21) < 0.5 ? 2 : 3, n - j);
    out.push(Array.from({ length: sz }, (_, k) => j + k));
    j += sz;
  }
  if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(...out.pop()!);
  return out;
};
const contas = (p: Particulas) => Math.round(Math.max(6, Math.min(24, p.n ?? (p.forma === 'cordao' ? 24 : 14))));
const raioPonto = (i: number, u: number) => (15 + 6 * rnd(i, 74)) * u;
/** Raio da conta do cordão. */
const CONTA = 13;
/** Qual ponto vira o destaque (um do meio da nuvem, nunca o do centro exato). */
const DESTAQUE = 1;

/** O dedo do `toque`: chega em 12 q, afunda em 6, segura 6, solta com MOLA.pousa e sai. */
const toqueEm = (frame: number, a: number, fps: number) => {
  const f = frame - a;
  if (f < 0) return null;
  const chega = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const press = f < 12 ? 0 : f < 18 ? ease((f - 12) / 6) : f < 24 ? 1 : 1 - spring({ frame: f - 24, fps, config: MOLA.pousa });
  const vai = sai(frame, a + 27, 12);
  return { chega, press, vai };
};

// ------------------------------------------------------------------ as camadas

/** As camadas de dentro, numa caixa w × h (o círculo recorta). Bandas que tocam a borda se estendem
 *  pra fora da caixa, pra que a lente crescida não mostre emenda. */
export const Camadas: React.FC<{
  s: MS;
  camadas: Camada[];
  particulas?: Particulas;
  toque?: string;
  ritmo?: 'devagar' | 'normal';
  turnAt: number;
  w: number;
  h: number;
  accent: string;
  pele: string;
}> = ({ s, camadas, particulas, toque, ritmo, turnAt, w, h, accent, pele }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = `cm${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const sp = ritmo === 'devagar' ? 0.5 : 1;
  const te = frame * sp;
  const u = w / 760;
  const bs = bandasDe(camadas, h, toque);
  const n = bs.length;
  const gapless = n > 0 && bs[0].y0 <= 0.001;

  // o dedo e o afundado que ele faz
  const tq = toque ? toqueEm(frame, cue(s, toque), fps) : null;
  const fundo = 30 * u;
  const dent = (x: number) => (tq ? tq.press * fundo * Math.exp(-(((x - w / 2) / (100 * u)) ** 2)) : 0);
  const xs = Array.from({ length: 49 }, (_, i) => -0.15 * w + (1.3 * w * i) / 48);
  /** y da divisa i no x (0 = topo da banda 0; n = fundo da última). As das bordas se estendem. */
  const divisa = (i: number, x: number) => {
    if (i === 0 && gapless) return -0.6 * h;
    if (i >= n) return 1.6 * h;
    return bs[i].y0 + (FAT[i] ?? 0) * dent(x);
  };
  const linha = (i: number) => xs.map((x) => `${f1(x)},${f1(divisa(i, x))}`);
  const bandaPath = (i: number) => `M${linha(i).join(' L')} L${linha(i + 1).reverse().join(' L')} Z`;
  const topo = (i: number) => (i === 0 && gapless ? -0.6 * h : bs[i].y0);
  const fim = (i: number) => (i === n - 1 ? 1.6 * h : bs[i].y1);
  const desce = (i: number, x: number, y: number) => {
    const b = bs[i];
    return (FAT[i] ?? 0) * dent(x) * Math.max(0, 1 - (y - b.y0) / Math.max(1, b.y1 - b.y0));
  };

  const textura = (c: Camada, i: number) => {
    const b = bs[i];
    const bh = b.y1 - b.y0;
    const tone = tomDe(c, accent, pele);
    const y0 = topo(i);
    const y1 = fim(i);
    const X0 = -0.2 * w;
    const XW = 1.4 * w;

    if (c.textura === 'liso') {
      return (
        <>
          <rect x={X0} y={y0} width={XW} height={y1 - y0} fill={tone} />
          <rect x={X0} y={b.y1 - 0.3 * bh} width={XW} height={y1 - (b.y1 - 0.3 * bh)} fill="rgba(10,14,38,0.14)" />
          {i === 0 && gapless ? null : <polyline points={linha(i).join(' ')} stroke="rgba(255,255,255,0.26)" strokeWidth={16 * u} fill="none" />}
        </>
      );
    }

    if (c.textura === 'agua') {
      return (
        <>
          <defs>
            <linearGradient id={`${id}a${i}`} x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0" stopColor={mix(tone, C.deep, 0.42)} />
              <stop offset="1" stopColor={mix(tone, C.deep, 0.8)} />
            </linearGradient>
          </defs>
          <rect x={X0} y={Math.max(y0, b.y0 - 0.6 * h)} width={XW} height={Math.min(y1, b.y1 + 0.6 * h) - Math.max(y0, b.y0 - 0.6 * h)} fill={`url(#${id}a${i})`} />
          {[0, 1, 2].map((j) => (
            <ellipse
              key={`c${j}`}
              cx={w * (0.24 + 0.26 * j) + 34 * u * Math.sin(te / 60 + j * 2)}
              cy={b.y0 + bh * (0.28 + 0.22 * j)}
              rx={110 * u}
              ry={28 * u}
              fill="rgba(255,255,255,0.045)"
            />
          ))}
          {/* reflexos lentos: ondinhas curtas que derivam (nunca linhas de lado a lado) */}
          {Array.from({ length: 7 }, (_, j) => {
            const y = b.y0 + bh * (0.12 + 0.76 * rnd(j, 66)) + 10 * u * Math.sin(te / 45 + j * 1.3);
            const x = w * (0.06 + 0.62 * rnd(j, 67)) + 40 * u * Math.sin(te / 70 + j);
            const len = (110 + 90 * rnd(j, 68)) * u;
            const q = (9 + 5 * Math.sin(te / 30 + j)) * u;
            return (
              <path
                key={`r${j}`}
                d={`M${f1(x)} ${f1(y)} q${f1(len / 4)} ${f1(-q)} ${f1(len / 2)} 0 t${f1(len / 2)} 0`}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={6 * u}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </>
      );
    }

    if (c.textura === 'fluxo') {
      const yMax = Math.min(y1, b.y1 + 0.45 * h);
      const span = 1.5 * w;
      return (
        <>
          <rect x={X0} y={y0} width={XW} height={y1 - y0} fill={mix(tone, C.deep, 0.62)} />
          {Array.from({ length: 20 }, (_, j) => {
            const yy = b.y0 + (yMax - b.y0) * (0.08 + 0.84 * rnd(j, 61));
            const len = (60 + 80 * rnd(j, 62)) * u;
            const spd = (4 + 3 * rnd(j, 63)) * u * sp;
            const x = ((rnd(j, 64) * span + frame * spd) % span) - 0.25 * w;
            return <rect key={j} x={f1(x)} y={f1(yy - 3.5 * u)} width={f1(len)} height={f1(7 * u)} rx={3.5 * u} fill={mix(tone, '#FFFFFF', 0.32)} opacity={0.38 + 0.25 * rnd(j, 65)} />;
          })}
        </>
      );
    }

    if (c.textura === 'dobras') {
      const base = b.y0 + 0.66 * bh;
      /** Uma vilosidade: dedo de lados ondulados e ponta redonda, que se curva com o balanço. */
      const vilo = (hg: number, bend: number, r: number) => {
        const ty = -hg + r;
        return `M${f1(-r * 0.9)} ${f1(12 * u)} L${f1(-r * 0.9)} 0 C${f1(-r * 0.75)} ${f1(-hg * 0.35)} ${f1(-r * 1.15 + bend * 0.6)} ${f1(-hg * 0.6)} ${f1(-r + bend)} ${f1(ty)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(r + bend)} ${f1(ty)} C${f1(r * 1.15 + bend * 0.6)} ${f1(-hg * 0.6)} ${f1(r * 0.75)} ${f1(-hg * 0.35)} ${f1(r * 0.9)} 0 L${f1(r * 0.9)} ${f1(12 * u)} Z`;
      };
      /** O lado da sombra (a direita) da mesma vilosidade. */
      const viloSombra = (hg: number, bend: number, r: number) => {
        const ty = -hg + r;
        const k = 0.3 * r;
        return `M${f1(bend + 0.2 * r)} ${f1(ty - 0.98 * r)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(r + bend)} ${f1(ty)} C${f1(r * 1.15 + bend * 0.6)} ${f1(-hg * 0.6)} ${f1(r * 0.75)} ${f1(-hg * 0.35)} ${f1(r * 0.9)} 0 L${f1(r * 0.9)} ${f1(12 * u)} L${f1(k)} ${f1(12 * u)} L${f1(k)} 0 C${f1(k)} ${f1(-hg * 0.35)} ${f1(k + bend * 0.6)} ${f1(-hg * 0.6)} ${f1(k + bend)} ${f1(ty)} Z`;
      };
      const villi: React.ReactNode[] = [];
      // duas fileiras: a de trás mais escura, meio passo de lado e um pouco mais alta (a parede tem fundo)
      for (const row of [0, 1]) {
        const step = 66 * u;
        for (let j = 0, x = -0.15 * w + (row ? 0 : step / 2); x < 1.15 * w; j++, x += step) {
          const seed = j + row * 50;
          const r = (19 + 6 * rnd(seed, 52)) * u;
          const hg = 0.5 * bh * (0.8 + 0.34 * rnd(seed, 51)) * (row ? 1 : 1.12);
          const bend = 10 * u * Math.sin(te / 22 + j * 0.8 + row);
          const yb = base + (row ? 8 : -2) * u + (FAT[i] ?? 0) * dent(x);
          const d = vilo(hg, bend, r);
          villi.push(
            <g key={`${row}.${j}`} transform={`translate(${f1(x)} ${f1(yb)})`}>
              <path d={d} fill={row ? tone : mix(tone, C.deep, 0.45)} />
              {row ? (
                <>
                  <path d={viloSombra(hg, bend, r)} fill={SHADE} />
                  <circle cx={-0.35 * r + bend} cy={-hg + 0.8 * r} r={0.24 * r} fill="rgba(255,255,255,0.24)" />
                </>
              ) : null}
            </g>,
          );
        }
      }
      const wallTop = xs.map((x) => `${f1(x)},${f1(base + 14 * u + (FAT[i] ?? 0) * dent(x))}`);
      return (
        <>
          <rect x={X0} y={y0} width={XW} height={y1 - y0} fill={mix(tone, C.deep, 0.8)} />
          {villi}
          <path d={`M${wallTop.join(' L')} L${f1(1.15 * w)},${f1(y1)} L${f1(-0.15 * w)},${f1(y1)} Z`} fill={mix(tone, C.deep, 0.18)} />
          <polyline points={wallTop.join(' ')} stroke="rgba(255,255,255,0.12)" strokeWidth={5 * u} fill="none" />
        </>
      );
    }

    // rede: células que puxam fios na cor do tom e tecem a malha
    const rows = Math.max(2, 2 * Math.round(bh / (236 * u)));
    const sy = bh / rows;
    const sx = 150 * u;
    const cols = Math.ceil((1.3 * w) / sx) + 1;
    const x0 = -0.15 * w;
    const renova = c.then === 'renova' && frame > turnAt;
    const rareia = c.then === 'rareia' && frame > turnAt;
    const off = renova ? ((frame - turnAt) * 2.2 * u * sp) % bh : 0;
    const kMin = y0 < b.y0 ? -Math.ceil((b.y0 - y0) / bh) : 0;
    const kMax = Math.ceil((Math.min(y1, b.y1 + 0.6 * h) - b.y0) / bh) - 1 + (renova ? 1 : 0);
    const cresceAt = c.cresce ? cue(s, c.cresce) : null;
    const cell = (r: number, cc: number) => {
      const k = r * 97 + cc;
      return {
        x: x0 + cc * sx + (r % 2 ? sx / 2 : 0) + (rnd(k, 31) - 0.5) * 0.34 * sx,
        y: (r + 0.5) * sy + (rnd(k, 32) - 0.5) * 0.36 * sy,
        r: (22 + 8 * rnd(k, 33)) * u,
        a: (rnd(k, 34) - 0.5) * 50,
        k,
      };
    };
    const fios: React.ReactNode[] = [];
    const celulas: React.ReactNode[] = [];
    const cellColor = mix(tone, '#FFFFFF', 0.42);
    const nucleo = mix(tone, C.deep, 0.3);
    for (let tile = kMin; tile <= kMax; tile++) {
      const ty = b.y0 - off + tile * bh;
      const at = (r: number, cc: number) => {
        const p = cell(r, cc);
        const y = ty + p.y + (r >= rows ? bh : 0);
        return { ...p, sx: p.x, sy: y + desce(i, p.x, y) };
      };
      for (let r = 0; r < rows; r++)
        for (let cc = 0; cc < cols; cc++) {
          const A = at(r, cc);
          const nb: [number, number][] = [
            [r, cc + 1],
            [r + 1, cc],
            [r + 1, cc + (r % 2 ? 1 : -1)],
          ];
          nb.forEach(([rr, c2], kind) => {
            if (c2 < 0 || c2 >= cols) return;
            const B = rr >= rows ? (() => { const q = at(rr - rows, c2); return { ...q, sy: q.sy + bh }; })() : at(rr, c2);
            const li = A.k * 3 + kind;
            const p = cresceAt == null ? 1 : ramp(frame, cresceAt + rnd(li, 43) * 26 / sp, 16 / sp);
            if (p <= 0) return;
            let wf = 1;
            if (rareia) wf = rnd(li, 41) < 0.6 ? 1 - ramp(frame, turnAt + (rnd(li, 42) * 30) / sp, 40 / sp) : 1 - 0.3 * ramp(frame, turnAt, 40 / sp);
            if (wf <= 0.02) return;
            const mx = (A.sx + B.sx) / 2;
            const my = (A.sy + B.sy) / 2;
            const dx = B.sx - A.sx;
            const dy = B.sy - A.sy;
            const bend = (rnd(li, 44) - 0.5) * 0.35;
            fios.push(
              <path
                key={`f${tile}.${li}`}
                d={`M${f1(A.sx)} ${f1(A.sy)} Q${f1(mx - dy * bend)} ${f1(my + dx * bend)} ${f1(B.sx)} ${f1(B.sy)}`}
                stroke={tone}
                strokeWidth={5 * u * wf}
                strokeLinecap="round"
                fill="none"
                opacity={0.55 + 0.45 * wf}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
              />,
            );
          });
          // a célula respira; renovando, as que entram por baixo nascem pequenas e crescem subindo
          const born = renova && tile > 0 ? clamp01((b.y1 - A.sy) / (0.32 * bh)) : 1;
          const sc = born * (1 + 0.05 * Math.sin(te / 16 + A.k));
          if (sc <= 0.02) continue;
          const rx = A.r * 1.15;
          const ry = A.r * 0.85;
          celulas.push(
            <g key={`c${tile}.${A.k}`} transform={`translate(${f1(A.sx)} ${f1(A.sy)}) rotate(${f1(A.a)}) scale(${sc.toFixed(3)})`}>
              <ellipse rx={rx} ry={ry} fill={cellColor} />
              <path d={`M${rx} 0 A${rx} ${ry} 0 0 1 ${-rx} 0 Z`} fill={SHADE} />
              <circle cx={-0.1 * A.r} cy={-0.06 * A.r} r={0.32 * A.r} fill={nucleo} />
              <circle cx={-0.48 * rx} cy={-0.42 * ry} r={0.16 * A.r} fill="rgba(255,255,255,0.4)" />
            </g>,
          );
        }
    }
    return (
      <>
        <rect x={X0} y={y0} width={XW} height={y1 - y0} fill={mix(tone, C.deep, 0.7)} />
        {fios}
        {celulas}
      </>
    );
  };

  // lascas que se soltam do topo quando uma camada se renova
  const renovando = camadas.some((c) => c.then === 'renova') && frame > turnAt && n > 0;
  const lascas: React.ReactNode[] = [];
  if (renovando) {
    const period = 54 / sp;
    const since = frame - turnAt;
    const tone = mix(tomDe(camadas[0], accent, pele), '#FFFFFF', 0.3);
    for (let j = 0; j < 6; j++) {
      if (since < (j * period) / 6) continue;
      // cada lasca descola da superfície, sobe girando devagar e some; a seguinte nasce noutro ponto
      const cyc = since / period - j / 6;
      const ph = cyc - Math.floor(cyc);
      const seed = j + 7 * Math.floor(cyc);
      const x0 = w * (0.2 + 0.6 * rnd(seed, 91));
      const x = x0 + 22 * u * Math.sin(ph * 3 + j);
      const y = divisa(0, x0) - 2 * u - ph * 78 * u;
      const op = Math.pow(1 - ph, 0.8) * Math.min(1, ph * 8);
      const rot = ph * 120 * (rnd(seed, 92) < 0.5 ? 1 : -1) - 8;
      lascas.push(
        <g key={j} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`} opacity={op}>
          <rect x={-18 * u} y={-6.5 * u} width={36 * u} height={13 * u} rx={5.5 * u} fill={tone} />
          <rect x={-18 * u} y={1.5 * u} width={36 * u} height={5 * u} rx={2.5 * u} fill="rgba(10,14,38,0.12)" />
          <rect x={-12 * u} y={-4.5 * u} width={14 * u} height={3 * u} rx={1.5 * u} fill="rgba(255,255,255,0.4)" />
        </g>,
      );
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <defs>
        {bs.map((_, i) => (
          <clipPath key={i} id={`${id}b${i}`}>
            <path d={bandaPath(i)} />
          </clipPath>
        ))}
      </defs>
      {camadas.map((c, i) => (
        <g key={i} clipPath={`url(#${id}b${i})`}>
          {textura(c, i)}
        </g>
      ))}
      {lascas}
      {tq && toque ? <Sombra x={w / 2} y={divisa(0, w / 2)} u={u} press={tq.press} /> : null}
      {particulas ? <Particles s={s} p={particulas} bs={bs} w={w} h={h} u={u} sp={sp} te={te} /> : null}
      {tq && n > 0 ? <Dedo x={w / 2} y={divisa(0, w / 2)} w={w} u={u} pele={pele} chega={tq.chega} vai={tq.vai} /> : null}
    </svg>
  );
};

/** A sombrinha embaixo da ponta do dedo (só enquanto aperta). */
const Sombra: React.FC<{ x: number; y: number; u: number; press: number }> = ({ x, y, u, press }) =>
  press > 0.02 ? <ellipse cx={x} cy={y + 4 * u} rx={70 * u} ry={10 * u} fill="rgba(10,14,38,0.22)" opacity={clamp01(press)} /> : null;

/** A ponta de um dedo (tom da pele), descendo do alto à direita até (x, y). */
const Dedo: React.FC<{ x: number; y: number; w: number; u: number; pele: string; chega: number; vai: number }> = ({ x, y, w, u, pele, chega, vai }) => {
  const back = (1 - chega + vai) * 0.9 * w;
  if (back >= 0.89 * w) return null;
  // eixo do dedo: aponta pra baixo e pra esquerda (rotate 30° leva o +y local pra (-0,5; 0,87))
  const tx = x + 0.5 * back;
  const ty = y - 0.866 * back;
  const L = 0.9 * w;
  const r = 36 * u;
  return (
    <g transform={`translate(${f1(tx)} ${f1(ty)}) rotate(30)`}>
      <rect x={-r} y={-L} width={2 * r} height={L} rx={r} fill={mix(pele, C.deep, 0.28)} />
      <rect x={-r} y={-L} width={1.55 * r} height={L} rx={0.78 * r} fill={pele} />
      <rect x={-0.72 * r} y={-1.95 * r} width={1.15 * r} height={1.45 * r} rx={0.5 * r} fill={mix(pele, '#FFFFFF', 0.42)} opacity={0.9} />
      <rect x={-0.62 * r} y={-3.4 * r} width={1.1 * r} height={0.16 * r} rx={0.08 * r} fill={mix(pele, C.deep, 0.32)} opacity={0.5} />
    </g>
  );
};

/** Uma partícula redonda: a cor, a sombra embaixo à direita e um brilho pequeno. `sx`/`sy` amassam. */
const Bola: React.FC<{ x: number; y: number; r: number; fill: string; sx?: number; sy?: number; op?: number }> = ({ x, y, r, fill, sx = 1, sy = 1, op = 1 }) => (
  <g transform={`translate(${f1(x)} ${f1(y)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`} opacity={op}>
    <circle r={r} fill={fill} />
    <path d={`M${f1(r)} 0 A${f1(r)} ${f1(r)} 0 0 1 ${f1(-r)} 0 Z`} fill={SHADE} transform="rotate(-35)" />
    <circle cx={-0.36 * r} cy={-0.36 * r} r={0.26 * r} fill="rgba(255,255,255,0.45)" />
  </g>
);

/** A estrelinha de 4 pontas do destaque (sem raios). */
const Estrela: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const q = 0.16 * s;
  return (
    <path
      d={`M0 ${f1(-s)} Q${f1(q)} ${f1(-q)} ${f1(s)} 0 Q${f1(q)} ${f1(q)} 0 ${f1(s)} Q${f1(-q)} ${f1(q)} ${f1(-s)} 0 Q${f1(-q)} ${f1(-q)} 0 ${f1(-s)} Z`}
      fill={C.gold2}
      transform={`translate(${f1(x)} ${f1(y)})`}
    />
  );
};

/** As partículas (ponto | cordao), na caixa das camadas. */
const Particles: React.FC<{ s: MS; p: Particulas; bs: Banda[]; w: number; h: number; u: number; sp: number; te: number }> = ({ s, p, bs, w, h, u, sp, te }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = paleta(p.cor);
  const N = contas(p);

  if (p.forma === 'ponto') {
    const reg = typeof p.de === 'number' ? bs[p.de] : undefined;
    const cx0 = w / 2;
    const cy0 = reg ? (reg.y0 + reg.y1) / 2 : h / 2;
    const R = 0.34 * Math.min(w, h);
    const appear = p.cue ? cue(s, p.cue) : null;
    const dAt = p.destaque ? cue(s, p.destaque.cue) : null;
    const items: React.ReactNode[] = [];
    let lead: React.ReactNode = null;
    for (let i = 0; i < N; i++) {
      let x: number;
      let y: number;
      if (reg) {
        x = w * (0.14 + 0.72 * rnd(i, 71));
        y = reg.y0 + (reg.y1 - reg.y0) * (0.2 + 0.6 * rnd(i, 72));
      } else {
        // espalhados num disco (ângulo de ouro), sem amontoar
        const ang = i * 2.39996 + 0.6;
        const rad = R * Math.sqrt((i + 0.6) / N) * (0.88 + 0.12 * rnd(i, 73));
        x = cx0 + Math.cos(ang) * rad;
        y = cy0 + Math.sin(ang) * rad;
      }
      const amp = (p.boiam ? 16 : 4) * u;
      x += amp * Math.sin(te / 37 + i * 1.3);
      y += amp * 0.7 * Math.cos(te / 29 + i * 0.7);
      let r = raioPonto(i, u);
      let fill = cols[i % cols.length];
      let sc = 1;
      if (appear != null) {
        const k = spring({ frame: frame - appear - i * 1.2, fps, config: p.de === 'topo' ? MOLA.entra : MOLA.pousa });
        if (k <= 0.001) continue;
        if (p.de === 'topo') y = lerp(-0.12 * h, y, k);
        else sc = k;
      }
      if (dAt != null && i === DESTAQUE % N) {
        // o destaque vem pro centro, cresce 2,2× e fica dourado, com a estrelinha
        const kd = spring({ frame: frame - dAt, fps, config: MOLA.entra });
        x = lerp(x, cx0, kd);
        y = lerp(y, cy0, kd);
        r *= 1 + 1.2 * kd;
        fill = mix(fill, C.gold, Math.min(1, kd * 1.3));
        const ks = spring({ frame: frame - dAt - 6, fps, config: MOLA.pousa });
        const ss = 0.95 * r * ks * (1 + 0.06 * Math.sin(frame / 5));
        lead = (
          <>
            <Bola x={x} y={y} r={r * sc} fill={fill} />
            {ss > 0.5 ? <Estrela x={x + 1.25 * r} y={y - 1.25 * r} s={ss} /> : null}
          </>
        );
        continue;
      }
      const op = dAt != null ? 1 - 0.55 * ramp(frame, dAt, 10) : 1;
      items.push(<Bola key={i} x={x} y={y} r={r * sc} fill={fill} op={op} />);
    }
    return (
      <>
        {items}
        {lead}
      </>
    );
  }

  // cordao: contas em cadeia que ondulam; partem em pedaços, atravessam uma camada e a correnteza leva
  const rb = CONTA * u;
  const passo = 2.05 * rb;
  const restY = restoCordao(bs, h, p);
  const x0 = w / 2 - ((N - 1) * passo) / 2;
  const enter = p.cue ? cue(s, p.cue) : null;
  const qAt = p.quebra ? cue(s, p.quebra) : null;
  const atv = p.atravessa ? { camada: p.atravessa.camada, at: cue(s, p.atravessa.cue) } : null;
  const partiu = qAt != null && frame >= qAt;
  const gs = grupos(N);
  const G = gs.length;
  const cord = mix(cols[0], C.deep, 0.45);
  /** A conta j na corrente: ondulando no lugar; com `de: topo`, descendo em serpente na deixa. */
  const conta = (j: number) => {
    const x = x0 + j * passo;
    let y = restY + 14 * u * Math.sin(j * 0.5 - te * 0.14);
    let sc = 1;
    if (enter != null) {
      const kj = spring({ frame: frame - enter - j * 0.6, fps, config: MOLA.entra });
      if (p.de === 'topo') y = lerp(-0.22 * h - (N - j) * 2 * u, y, kj);
      else sc = kj;
      if (kj <= 0.001) sc = 0;
    }
    return { x, y, sc };
  };
  const out: React.ReactNode[] = [];
  if (!partiu) {
    const all = Array.from({ length: N }, (_, j) => conta(j));
    if (all.some((q) => q.sc > 0)) out.push(<polyline key="cord" points={all.map((q) => `${f1(q.x)},${f1(q.y)}`).join(' ')} stroke={cord} strokeWidth={5 * u} strokeLinejoin="round" fill="none" />);
    all.forEach((q, j) => {
      if (q.sc > 0) out.push(<Bola key={`b${j}`} x={q.x} y={q.y} r={rb * q.sc} fill={cols[j % cols.length]} />);
    });
    return <>{out}</>;
  }
  gs.forEach((beads, g) => {
    const pos = beads.map((j) => ({ j, ...conta(j) }));
    const gcx = pos.reduce((a, q) => a + q.x, 0) / pos.length;
    // partiu: cada pedaço dá um pop e eles se afastam
    const kb = spring({ frame: frame - (qAt ?? 0) - g * 0.5, fps, config: MOLA.entra });
    const pop = 1 + 0.32 * (1 - spring({ frame: frame - (qAt ?? 0) - g * 0.5, fps, config: MOLA.pousa }));
    let sx = pop;
    let sy = pop;
    let dx = (g - (G - 1) / 2) * 0.62 * passo * kb;
    let dy = ((rnd(g, 81) - 0.5) * 56 * u + 8 * u * Math.sin(te / 20 + g)) * kb;
    if (atv) {
      // atravessa: em cascata de 3 q, desce até a camada, aperta ao passar e entra na de baixo
      const a = atv.at + (g * 3) / sp;
      const ta = clamp01((frame - a) / (16 / sp));
      const wall = bs[atv.camada];
      const below = bs[atv.camada + 1];
      if (wall && ta > 0) {
        const ty = below ? lerp(below.y0, below.y1, 0.35 + 0.3 * rnd(g, 82)) : wall.y1 + 40 * u;
        const ny = lerp(restY + dy, ty, ease(ta));
        dy = ny - restY;
        const uu = (ny - wall.y0) / Math.max(1, wall.y1 - wall.y0);
        if (uu > 0 && uu < 1) {
          const sq = Math.sin(Math.PI * uu);
          sy *= 1 - 0.3 * sq;
          sx *= 1 + 0.12 * sq;
        }
        // correnteza: na banda de baixo, a corrente leva o pedaço pra direita
        if (p.correnteza && ta >= 1) {
          const dt = (frame - (a + 16 / sp)) * sp;
          dx += dt * 9 * u + 0.16 * dt * dt * u;
        }
      }
    }
    const cx = gcx + dx;
    const cy = restY + dy;
    if (cx - pos.length * passo > w * 1.15) return;
    const pts = pos.map((q) => [cx + (q.x - gcx) * sx, cy + (q.y - restY) * sy] as [number, number]);
    if (pts.length > 1) out.push(<polyline key={`k${g}`} points={pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')} stroke={cord} strokeWidth={5 * u} strokeLinejoin="round" fill="none" />);
    pos.forEach((q, n) => out.push(<Bola key={`b${q.j}`} x={pts[n][0]} y={pts[n][1]} r={rb} fill={cols[q.j % cols.length]} sx={sx} sy={sy} />));
  });
  return <>{out}</>;
};

// ------------------------------------------------------------------ a lente

/** Arco de círculo (graus; 0° = direita, 90° = embaixo). */
const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${f1(x0)} ${f1(y0)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(x1)} ${f1(y1)}`;
};

export const Lente: React.FC<{ s: MS; spec: LenteSpec; ancora: [number, number]; centro: [number, number]; diametro: number; accent: string; pele: string }> = ({
  s,
  spec,
  ancora,
  centro,
  diametro,
  accent,
  pele,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const openAt = spec.cue ? cue(s, spec.cue) : s.lead;
  const k = spring({ frame: frame - openAt, fps, config: MOLA.entra });
  const growAt = spec.cresce ? cue(s, spec.cresce) : null;
  const g = growAt == null ? 0 : interpolate(frame, [growAt, growAt + CRESCE.q], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const closeAt = spec.fecha ? cue(s, spec.fecha) : null;
  const c = closeAt == null ? 0 : sai(frame, closeAt, FECHA);
  if (k <= 0.002 || c >= 1) return null;
  const turnAt = spec.turn ? cue(s, spec.turn) : openAt;

  // o círculo: da âncora ao centro; crescendo, pro meio do palco; fechando, de volta à âncora
  let ox = lerp(ancora[0], centro[0], k);
  let oy = lerp(ancora[1], centro[1], k);
  let D = diametro * k;
  ox = lerp(ox, CRESCE.centro[0], g);
  oy = lerp(oy, CRESCE.centro[1], g);
  D = lerp(D, CRESCE.d, g);
  ox = lerp(ox, ancora[0], c);
  oy = lerp(oy, ancora[1], c);
  D *= 1 - c;
  const R = D / 2;
  // a caixa do conteúdo: o quadrado do círculo, ou o palco quando cresce
  const W = lerp(diametro, CRESCE.w, g);
  const H = lerp(diametro, CRESCE.h, g);
  const cs = Math.min(k, 1.03) * (1 - c);
  const left = ox - (W * cs) / 2;
  const top = oy - (H * cs) / 2;
  const toScreen = (y: number) => top + y * cs;

  // o cone: as tangentes da âncora ao aro, o véu e o ponto-anel
  const L = Math.hypot(ancora[0] - ox, ancora[1] - oy);
  const coneOp = clamp01(k * 1.4) * (1 - g) * (1 - c);
  let cone: React.ReactNode = null;
  if (L > R + 10 && coneOp > 0.01) {
    const al = Math.acos(R / L);
    const th = Math.atan2(ancora[1] - oy, ancora[0] - ox);
    const t1 = [ox + R * Math.cos(th + al), oy + R * Math.sin(th + al)];
    const t2 = [ox + R * Math.cos(th - al), oy + R * Math.sin(th - al)];
    cone = (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <polygon points={`${f1(ancora[0])},${f1(ancora[1])} ${f1(t1[0])},${f1(t1[1])} ${f1(t2[0])},${f1(t2[1])}`} fill={C.violet} opacity={0.12 * coneOp} />
        <line x1={ancora[0]} y1={ancora[1]} x2={t1[0]} y2={t1[1]} stroke={C.violet2} strokeWidth={3} strokeLinecap="round" opacity={0.55 * coneOp} />
        <line x1={ancora[0]} y1={ancora[1]} x2={t2[0]} y2={t2[1]} stroke={C.violet2} strokeWidth={3} strokeLinecap="round" opacity={0.55 * coneOp} />
        <circle cx={ancora[0]} cy={ancora[1]} r={13} fill="rgba(10,14,38,0.55)" stroke={C.gold} strokeWidth={4.5} opacity={coneOp} />
        <circle cx={ancora[0]} cy={ancora[1]} r={4.5} fill={C.gold} opacity={coneOp} />
      </svg>
    );
  }

  // o conteúdo
  const conteudo = spec.conteudo;
  const res = 'reserva' in conteudo ? conteudo.reserva : null;
  const cam = 'camadas' in conteudo ? conteudo : null;
  const S = diametro >= 640 ? 52 : 46;
  const lh = (() => {
    const r = rotuloRect('x', 0, 0, S);
    return r[3] - r[1];
  })();
  const rotulos: React.ReactNode[] = [];
  let inner: React.ReactNode = null;

  if (res) {
    const st = reservaAt(s, res, frame);
    const rot = !!res.rotulo;
    const tankH = H * (0.8 - (rot ? 0.08 * g : 0));
    const tw = tankH / 1.35;
    const tcy = H / 2 - (rot ? 0.05 * H * g : 0);
    inner = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 46%, ${C.surface2} 0%, ${C.deep} 72%)` }} />
        <div style={{ position: 'absolute', left: W / 2 - tw / 2, top: tcy - tankH / 2 }}>
          <Reservatorio t={frame} size={tw} nivel={st.nivel} jato={st.jato} pinga={st.pinga} assenta={st.assenta} conteudo={res.conteudo} />
        </div>
      </>
    );
    if (res.rotulo) {
      // colado no aro embaixo; com a lente crescida, logo abaixo do tanque
      const yAro = oy + R - lh / 2;
      const yPalco = toScreen(tcy + tankH / 2 + 0.02 * H);
      rotulos.push(<Rotulo key="res" s={s} text={res.rotulo.text} cue={res.rotulo.cue} x={ox} y={lerp(yAro, yPalco, g)} size={S} accent={accent} />);
    }
  } else if (cam) {
    const bs = bandasDe(cam.camadas, H, cam.toque);
    const p = cam.particulas;
    const u = W / 760;
    inner = (
      <>
        <div style={{ position: 'absolute', left: -0.3 * W, top: -0.6 * H, width: 1.6 * W, height: 2.2 * H, background: AR }} />
        <Camadas s={s} camadas={cam.camadas} particulas={p} toque={cam.toque} ritmo={cam.ritmo} turnAt={turnAt} w={W} h={H} accent={accent} pele={pele} />
      </>
    );
    const chord = (ys: number) => Math.sqrt(Math.max(0, R * R - (ys - oy) * (ys - oy)));
    cam.camadas.forEach((cm, i) => {
      if (!cm.rotulo || !bs[i]) return;
      const ys = toScreen((bs[i].y0 + bs[i].y1) / 2);
      // a banda que as partículas atravessam leva o rótulo encostado na parede, à esquerda
      const lado = p?.atravessa?.camada === i;
      const x = lado ? Math.max(40, ox - chord(ys) + 34) : ox;
      rotulos.push(<Rotulo key={`c${i}`} s={s} text={cm.rotulo.text} cue={cm.rotulo.cue} x={x} y={ys - lh / 2} size={S} align={lado ? 'left' : 'center'} accent={accent} />);
    });
    if (p?.rotulo) {
      let y: number;
      if (p.forma === 'cordao') {
        const ys = toScreen(restoCordao(bs, H, p));
        const acima = ys - 2.8 * CONTA * u * cs - lh;
        y = acima > oy - R + 0.06 * D ? acima : ys + 2.8 * CONTA * u * cs;
      } else y = toScreen(0.1 * H);
      rotulos.push(<Rotulo key="p" s={s} text={p.rotulo.text} cue={p.rotulo.cue} x={ox} y={y} size={S} accent={accent} />);
    }
    if (p?.forma === 'ponto' && p.destaque) {
      const reg = typeof p.de === 'number' ? bs[p.de] : undefined;
      const cy0 = reg ? (reg.y0 + reg.y1) / 2 : H / 2;
      const rD = raioPonto(DESTAQUE % contas(p), u) * 2.2;
      rotulos.push(<Rotulo key="d" s={s} text={p.destaque.rotulo} cue={p.destaque.cue} x={ox} y={toScreen(cy0 + rD) + 26 * cs} size={S} tom="ouro" accent={accent} />);
    }
  }
  const rotOp = clamp01((k - 0.6) / 0.3) * (1 - c);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {cone}
      <div
        style={{
          position: 'absolute',
          left: ox - R,
          top: oy - R,
          width: D,
          height: D,
          borderRadius: '50%',
          overflow: 'hidden',
          background: C.deep,
          boxShadow: '0 28px 64px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ position: 'absolute', left: left - (ox - R), top: top - (oy - R), width: W, height: H, transform: `scale(${cs.toFixed(4)})`, transformOrigin: '0 0' }}>{inner}</div>
      </div>
      {/* aro dourado de 8 px com sombra interna embaixo do topo; brilho do vidro e do aro no alto à esquerda */}
      <div
        style={{
          position: 'absolute',
          left: ox - R,
          top: oy - R,
          width: D,
          height: D,
          borderRadius: '50%',
          boxShadow: `inset 0 0 0 8px ${C.gold}, inset 0 18px 34px rgba(10,14,38,0.5)`,
        }}
      />
      {D > 40 && D < 1800 ? (
        <svg width={D} height={D} viewBox={`0 0 ${f1(D)} ${f1(D)}`} style={{ position: 'absolute', left: ox - R, top: oy - R, overflow: 'visible' }}>
          <path d={arco(R, R, R - 8 - 0.05 * D, 198, 246)} stroke="rgba(255,255,255,0.13)" strokeWidth={Math.min(26, 0.03 * D)} strokeLinecap="round" fill="none" />
          <path d={arco(R, R, R - 3, 192, 258)} stroke={C.gold2} strokeWidth={3} strokeLinecap="round" fill="none" />
          <path d={arco(R, R, R - 4, 12, 78)} stroke={C.goldDeep} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
        </svg>
      ) : null}
      {rotOp > 0.01 ? <div style={{ position: 'absolute', inset: 0, opacity: rotOp }}>{rotulos}</div> : null}
    </div>
  );
};
