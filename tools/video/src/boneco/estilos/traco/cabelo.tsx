// Traço editorial — os 12 cabelos do elenco, no espaço local da cabeça.
//
// Dois jeitos de montar:
//  - CALOTA (curto, fade, grisalho, calvo, coque, rabo): o contorno do crânio empurrado pra fora
//    pela espessura do cabelo + a linha do cabelo (testa, costeleta, em volta da orelha).
//  - VOLUME (chanel, cacheado, black, ondulado, longo, tranças): a massa inteira (inclusive a que
//    fica atrás da cabeça e do pescoço) vai ATRÁS; a parte que fica na frente do rosto é a mesma
//    massa recortada pela "região da frente" (acima da linha do cabelo e as cortinas laterais).
//    Uma forma só → a sombra e a luz de recorte continuam sem emenda.
import React from 'react';
import type { Ctx } from './ctx';
import { rimDe } from './ctx';
import { type P, add, gira, lerp, linhaFechada, suave } from './geo';
import { Vol } from './Vol';
import { clara, mix, sombra } from './cor';
import { contornoLocal } from './cabeca';

const RAD = Math.PI / 180;
type F = [number, number];

const angulo = (p: P) => Math.atan2(p[0], -p[1]) / RAD;

/** contorno do crânio empurrado pra fora entre os ângulos a0 (−, atrás/esquerda) e a1 (+, frente/direita) */
const calotaFora = (c: Ctx, a0: number, a1: number, esp: (a: number) => number): P[] => {
  const cont = contornoLocal(c);
  const sel = cont
    .map((p) => ({ p, a: angulo(p) }))
    .filter((o) => o.a >= a0 && o.a <= a1)
    .sort((x, y) => y.a - x.a);
  return sel.map(({ p, a }) => {
    const n = Math.hypot(p[0], p[1]) || 1;
    const e = esp(a);
    return [p[0] + (p[0] / n) * e, p[1] + (p[1] / n) * e] as P;
  });
};

const fr = (c: Ctx, pts: F[], espelha = false): P[] => {
  const W = c.prop.cabecaLarg;
  const H = c.prop.cabeca;
  const base = pts.map(([x, y]) => [x * W, y * H] as P);
  if (!espelha) return base;
  const outro = [...pts]
    .reverse()
    .map(([x, y]) => [-x * W, y * H] as P);
  return [...base, ...outro];
};

/** desloca x (perfil: a orelha fica mais pra frente que na vista de 3/4) */
const lado = (c: Ctx, pts: F[]): F[] => (c.j.vista === 'perfil' ? pts.map(([x, y]) => [x > 0.3 ? x : x + (x < -0.5 ? 0.06 : 0.17), y]) : pts);

/** nuvem de cachos: círculos ao longo de um contorno + o miolo */
const nuvem = (c: Ctx, contorno: P[], r: number, passo: number, fase = 0): string[] => {
  const ds: string[] = [suave(contorno)];
  const n = contorno.length;
  let acc = fase;
  for (let i = 0; i < n; i++) {
    const a = contorno[i];
    const b = contorno[(i + 1) % n];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (acc < L) {
      const k = acc / L;
      const p: P = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      const rr = r * (0.85 + 0.3 * Math.abs(Math.sin(i * 1.7 + acc)));
      ds.push(circulo(p, rr));
      acc += passo;
    }
    acc -= L;
  }
  void c;
  return ds;
};

const circulo = (p: P, r: number) => `M${p[0] - r} ${p[1]}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

type Cabelo = {
  /** a massa toda (vai atrás) */
  volume?: string[];
  /** a região da frente (recorte da massa que passa por cima do rosto) */
  frente?: P[];
  /** formas que vão SÓ na frente (calota, mechas por cima do ombro) */
  porCima?: string[];
  /** coisas desenhadas atrás que não são a massa (coque, rabo, tranças) */
  atrasExtra?: React.ReactNode;
  /** detalhes por cima (risca, brilho, prendedor) */
  detalhe?: React.ReactNode;
  brilho?: P[];
};

const cabeloDe = (c: Ctx, Ll: P): Cabelo => {
  const { pessoa, j, t } = c;
  const v = j.vista;
  const W = c.prop.cabecaLarg;
  const H = c.prop.cabeca;
  const m = pessoa.genero === 'm';
  const cor = pessoa.corCabelo;
  const S = sombra(cor);
  const balanço = Math.sin(t / 22) * 2.5;
  switch (pessoa.cabelo) {
    case 'curto':
    case 'fade':
    case 'grisalho':
    case 'coque':
    case 'rabo': {
      const tipo = pessoa.cabelo;
      const topo = tipo === 'fade' ? 2.4 : tipo === 'grisalho' ? (m ? 2.0 : 2.8) : tipo === 'curto' ? 1.9 : 0.9;
      const lados = tipo === 'fade' ? 0.45 : tipo === 'grisalho' ? (m ? 0.9 : 1.6) : tipo === 'curto' ? 0.95 : 0.55;
      const onda = tipo === 'grisalho' && !m ? 0.45 : 0;
      const esp = (a: number) => {
        const k = Math.cos(Math.min(90, Math.abs(a)) * RAD);
        return lados + (topo - lados) * k * k + onda * Math.sin(a * 0.35);
      };
      let pts: P[];
      if (v === 'frente') {
        const out = calotaFora(c, -96, 96, esp);
        const linha: F[] =
          tipo === 'grisalho' && !m
            ? [[-0.5, 0.1], [-0.45, -0.02], [-0.44, -0.16], [-0.3, -0.24], [-0.12, -0.22], [0.08, -0.3], [0.3, -0.31], [0.44, -0.18], [0.45, -0.02], [0.5, 0.1]]
            : tipo === 'coque' || tipo === 'rabo'
              ? [[-0.5, 0.02], [-0.46, -0.04], [-0.42, -0.2], [-0.25, -0.32], [0, -0.355], [0.25, -0.32], [0.42, -0.2], [0.46, -0.04], [0.5, 0.02]]
              : [[-0.5, 0.04], [-0.455, 0.03], [-0.435, -0.16], [-0.3, -0.3], [-0.06, -0.345], [0.12, -0.33], [0.32, -0.3], [0.435, -0.16], [0.455, 0.03], [0.5, 0.04]];
        pts = [...out, ...fr(c, linha)];
      } else {
        const nuca = tipo === 'grisalho' && !m ? -150 : -140;
        const out = calotaFora(c, nuca, 66, esp);
        const linha: F[] = lado(c, [
          [-0.37, 0.24],
          [-0.4, 0.03],
          [-0.33, -0.06],
          [-0.24, -0.04],
          [-0.2, 0.06],
          [-0.15, -0.08],
          tipo === 'grisalho' && !m ? [0.0, -0.2] : [0.02, -0.26],
          tipo === 'grisalho' && !m ? [0.22, -0.24] : [0.24, -0.32],
          [0.42, -0.31],
        ]);
        pts = [...out, ...fr(c, linha)];
      }
      const ds = [suave(pts)];
      let atrasExtra: React.ReactNode = null;
      let detalhe: React.ReactNode = null;
      if (tipo === 'coque') {
        const bc: P = v === 'frente' ? [0, -0.6 * H] : [-0.34 * W, -0.52 * H];
        const r = 0.2 * W;
        atrasExtra = (
          <g>
            <Vol id={`${c.uid}-coq`} ds={[circulo(bc, r)]} cor={cor} sombra={S} s={1.2} luzDir={Ll} rim={{ cor: rimDe(c, cor, 0.6), r: 0.45 }} />
            <path d={`M${bc[0] - r * 0.6} ${bc[1]}Q${bc[0]} ${bc[1] - r * 0.8} ${bc[0] + r * 0.6} ${bc[1] - r * 0.1}`} stroke={S} strokeWidth={0.5} fill="none" strokeLinecap="round" />
          </g>
        );
      }
      if (tipo === 'rabo') {
        // o rabo cai da nuca um tico pra TRÁS (−x) e balança; de frente ele some atrás da cabeça e
        // aparece dos lados do pescoço quando balança
        const tie: P = v === 'frente' ? [0, -0.36 * H] : [-0.53 * W, -0.2 * H];
        const ang = (v === 'frente' ? balanço * 4 : -16) + balanço - j.ang.tronco * 0.6;
        const dir = gira([0, 1], -ang);
        const fim = add(tie, [dir[0] * 1.05 * H, dir[1] * 1.05 * H]);
        const n: P = [dir[1], -dir[0]];
        const rabo = suave([
          add(tie, [n[0] * 2.2, n[1] * 2.2]),
          add(lerpP2(tie, fim, 0.45), [n[0] * 3.0, n[1] * 3.0]),
          add(fim, [n[0] * 0.4, n[1] * 0.4]),
          add(fim, [-n[0] * 0.8 + dir[0], -n[1] * 0.8 + dir[1]]),
          add(lerpP2(tie, fim, 0.5), [-n[0] * 2.4, -n[1] * 2.4]),
          add(tie, [-n[0] * 2.0, -n[1] * 2.0]),
        ]);
        atrasExtra = <Vol id={`${c.uid}-rab`} ds={[rabo]} cor={cor} sombra={S} s={1.3} luzDir={Ll} rim={{ cor: rimDe(c, cor, 0.6), r: 0.45 }} />;
        if (v !== 'frente') detalhe = <circle cx={tie[0]} cy={tie[1]} r={1.3} fill={pessoa.cor} />;
      }
      if (tipo === 'fade') {
        // degradê: a parte de baixo dos lados deixa a pele aparecer
        detalhe = (
          <g>
            <defs>
              <clipPath id={`${c.uid}-fade`}>
                <path d={ds[0]} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${c.uid}-fade)`}>
              <rect x={-W} y={-0.16 * H} width={2 * W} height={H} fill={mix(cor, c.pele, 0.42)} />
              <rect x={-W} y={-0.22 * H} width={2 * W} height={0.06 * H} fill={mix(cor, c.pele, 0.2)} />
            </g>
          </g>
        );
      }
      const brilho: P[] = v === 'frente' ? fr(c, [[-0.28, -0.45], [-0.05, -0.52], [0.2, -0.5]]) : fr(c, [[-0.25, -0.5], [0.0, -0.55], [0.22, -0.47]]);
      return { porCima: ds, atrasExtra, detalhe, brilho: tipo === 'fade' ? undefined : brilho };
    }
    case 'calvo': {
      // ferradura: lados e nuca; o topo é pele (com brilho)
      const esp = () => 0.75;
      let ds: string[];
      if (v === 'frente') {
        ds = [-1, 1].map((s) => {
          const out = calotaFora(c, s > 0 ? 68 : -104, s > 0 ? 104 : -68, esp);
          const dentro: P[] = fr(c, s > 0 ? [[0.49, 0.1], [0.45, -0.02], [0.44, -0.14], [0.47, -0.2]] : [[-0.47, -0.2], [-0.44, -0.14], [-0.45, -0.02], [-0.49, 0.1]]);
          return suave([...out, ...dentro]);
        });
      } else {
        const out = calotaFora(c, -146, -62, (a) => 0.9 + 0.4 * Math.cos((a + 100) * RAD));
        const dentro = fr(c, lado(c, [[-0.38, 0.24], [-0.4, 0.04], [-0.32, -0.07], [-0.22, -0.05], [-0.19, 0.04], [-0.17, -0.1], [-0.3, -0.2], [-0.5, -0.2]]));
        ds = [suave([...out, ...dentro])];
      }
      const brilhoPele = v === 'frente' ? ([0.08 * W, -0.38 * H] as P) : ([0.12 * W, -0.4 * H] as P);
      return {
        porCima: ds,
        detalhe: <ellipse cx={brilhoPele[0]} cy={brilhoPele[1]} rx={0.16 * W} ry={0.05 * H} transform={`rotate(-12 ${brilhoPele[0]} ${brilhoPele[1]})`} fill={clara(c.pele, 0.35)} opacity={0.55} />,
      };
    }
    case 'chanel':
    case 'longo': {
      const longo = pessoa.cabelo === 'longo';
      const fim = longo ? 1.5 : 0.4;
      if (v === 'frente') {
        const vol = fr(c, [[0, -0.6], [0.38, -0.53], [0.58, -0.3], [0.62, 0.0], [0.62, fim * 0.6], [0.6, fim], [0.36, fim - 0.02], [0.0, fim + 0.02]], true);
        const frente = fr(c, [
          [-0.8, fim + 0.1],
          [-0.37, fim + 0.02],
          [-0.39, 0.14],
          [-0.4, -0.12],
          [-0.3, -0.28],
          [-0.06, -0.345],
          [0.18, -0.3],
          [0.36, -0.2],
          [0.41, -0.06],
          [0.39, 0.15],
          [0.37, fim + 0.02],
          [0.8, fim + 0.1],
          [0.8, -1.2],
          [-0.8, -1.2],
        ]);
        return { volume: [suave(vol)], frente, brilho: fr(c, [[-0.32, -0.42], [-0.08, -0.52], [0.18, -0.5]]) };
      }
      const vol = fr(c, lado(c, [[0.08, -0.6], [0.4, -0.48], [0.5, -0.28], [0.52, 0.0], [0.5, 0.3], [0.47, fim - 0.02], [0.2, fim + 0.02], [-0.35, fim + 0.02], [-0.62, fim - 0.02], [-0.68, 0.1], [-0.62, -0.3], [-0.38, -0.56]]));
      const frente = fr(c, lado(c, [[0.9, -0.36], [0.44, -0.31], [0.22, -0.27], [0.02, -0.19], [-0.1, -0.06], [-0.13, 0.15], [-0.15, fim + 0.02], [-0.9, fim + 0.1], [-0.9, -1.2], [0.9, -1.2]]));
      return { volume: [suave(vol)], frente, brilho: fr(c, [[-0.3, -0.48], [0.0, -0.56], [0.26, -0.47]]) };
    }
    case 'ondulado': {
      if (v === 'frente') {
        const vol = fr(c, [[0, -0.66], [0.32, -0.62], [0.52, -0.46], [0.6, -0.2], [0.55, 0.12], [0.44, 0.2], [0.0, 0.24]], true);
        const frente = fr(c, [[-1, 0.12], [-0.47, 0.07], [-0.44, -0.14], [-0.33, -0.3], [-0.12, -0.31], [0.1, -0.37], [0.3, -0.33], [0.44, -0.16], [0.47, 0.07], [1, 0.12], [1, -1.2], [-1, -1.2]]);
        return { volume: [suave(vol)], frente, brilho: fr(c, [[-0.3, -0.46], [-0.05, -0.55], [0.22, -0.52]]) };
      }
      const vol = fr(c, lado(c, [[0.0, -0.66], [0.3, -0.62], [0.48, -0.44], [0.52, -0.26], [0.2, 0.0], [-0.2, 0.3], [-0.45, 0.34], [-0.63, 0.12], [-0.64, -0.24], [-0.47, -0.54], [-0.2, -0.65]]));
      const frente = fr(c, lado(c, [[1, -0.3], [0.44, -0.27], [0.25, -0.31], [0.04, -0.25], [-0.12, -0.1], [-0.19, 0.05], [-0.23, -0.04], [-0.31, -0.08], [-0.41, 0.02], [-0.42, 0.3], [-1, 0.4], [-1, -1.2], [1, -1.2]]));
      return { volume: [suave(vol)], frente, brilho: fr(c, [[-0.28, -0.5], [0.0, -0.58], [0.26, -0.5]]) };
    }
    case 'cacheado':
    case 'black': {
      const black = pessoa.cabelo === 'black';
      let contorno: P[];
      if (black) {
        const ctr: P = v === 'frente' ? [0, -0.2 * H] : [-0.12 * W, -0.22 * H];
        contorno = [];
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          contorno.push([ctr[0] + Math.sin(a) * 0.86 * W, ctr[1] - Math.cos(a) * 0.78 * H]);
        }
      } else if (v === 'frente') {
        contorno = fr(c, [[0, -0.66], [0.42, -0.58], [0.66, -0.36], [0.76, 0.0], [0.76, 0.38], [0.66, 0.7], [0.4, 0.8], [0.0, 0.62]], true);
      } else {
        contorno = fr(c, lado(c, [[0.22, -0.66], [0.47, -0.44], [0.52, -0.2], [0.48, 0.2], [0.42, 0.52], [0.05, 0.66], [-0.38, 0.8], [-0.76, 0.58], [-0.86, 0.18], [-0.8, -0.26], [-0.58, -0.58], [-0.2, -0.7]]));
      }
      const ds = nuvem(c, contorno, (black ? 0.15 : 0.13) * W, (black ? 0.17 : 0.15) * W);
      const frente =
        v === 'frente'
          ? fr(c, black ? [[-1.2, 0.12], [-0.46, 0.08], [-0.44, -0.15], [-0.28, -0.31], [0, -0.35], [0.28, -0.31], [0.44, -0.15], [0.46, 0.08], [1.2, 0.12], [1.2, -1.5], [-1.2, -1.5]] : [[-1, 1.1], [-0.43, 0.62], [-0.45, 0.2], [-0.44, -0.12], [-0.3, -0.3], [0, -0.36], [0.3, -0.3], [0.44, -0.12], [0.45, 0.2], [0.43, 0.62], [1, 1.1], [1, -1.4], [-1, -1.4]])
          : fr(c, lado(c, [[1, -0.36], [0.44, -0.32], [0.2, -0.3], [0.0, -0.22], [-0.12, -0.07], [-0.2, -0.07], [-0.37, 0.0], [-0.42, 0.3], [-0.3, 0.95], [-1.2, 1.1], [-1.2, -1.4], [1, -1.4]]));
      // cachinhos na linha do cabelo (a borda da frente também é de cacho)
      return { volume: ds, frente };
    }
    case 'trancas': {
      // calota rente com risca no meio + as tranças (atrás) e três por cima do ombro (de frente)
      const esp = (a: number) => 0.7 + 0.5 * Math.cos(Math.min(90, Math.abs(a)) * RAD) ** 2;
      let pts: P[];
      if (v === 'frente') {
        pts = [...calotaFora(c, -98, 98, esp), ...fr(c, [[-0.5, 0.08], [-0.45, 0.02], [-0.43, -0.17], [-0.28, -0.31], [0, -0.35], [0.28, -0.31], [0.43, -0.17], [0.45, 0.02], [0.5, 0.08]])];
      } else {
        pts = [...calotaFora(c, -150, 66, esp), ...fr(c, lado(c, [[-0.38, 0.24], [-0.4, 0.03], [-0.33, -0.07], [-0.23, -0.05], [-0.18, 0.03], [-0.14, -0.1], [0.02, -0.27], [0.24, -0.32], [0.42, -0.31]]))];
      }
      const trancas: { a: P; len: number; ang: number }[] = [];
      if (v === 'frente') {
        for (let k = 0; k < 7; k++) {
          const s = k % 2 ? 1 : -1;
          const q = Math.floor(k / 2);
          trancas.push({ a: [s * (0.36 + q * 0.05) * W, (-0.1 + q * 0.06) * H], len: (1.5 - q * 0.08) * H, ang: s * (6 + q * 3) });
        }
      } else {
        // as tranças saem da nuca e caem pelas costas (um tico pra trás), por cima do ombro de trás
        const recua = v === 'perfil' ? 0.06 : 0;
        for (let k = 0; k < 9; k++) {
          const x = lerp(-0.2, -0.6, k / 8) - recua;
          const y = lerp(-0.2, 0.08, k / 8);
          trancas.push({ a: [x * W, y * H], len: (1.5 - Math.abs(k - 4) * 0.04) * H, ang: -3 - k * 1.6 });
        }
      }
      const corT = cor;
      const desenhaTranca = (tr: { a: P; len: number; ang: number }, k: number) => {
        const ang = tr.ang + balanço * (0.6 + 0.1 * (k % 3)) - j.ang.tronco * 0.7 + (v === 'frente' ? 0 : -j.ang.cabeca * 0.3);
        const d = gira([0, 1], -ang);
        const n: P = [d[1], -d[0]];
        const pts2: P[] = [];
        const zig: P[] = [];
        const passos = Math.round(tr.len / 0.95);
        for (let s = 0; s <= passos; s++) {
          const u = s / passos;
          const curva = Math.sin(u * Math.PI) * 1.2 * (k % 2 ? 1 : -1);
          const p = add(tr.a, [d[0] * tr.len * u + n[0] * curva, d[1] * tr.len * u + n[1] * curva]);
          pts2.push(p);
          zig.push(add(p, [n[0] * (s % 2 ? 0.55 : -0.55), n[1] * (s % 2 ? 0.55 : -0.55)]));
        }
        const fim = pts2[pts2.length - 1];
        return (
          <g key={`tr${k}`}>
            <path d={suave(pts2, false)} stroke={k % 3 === 1 ? S : corT} strokeWidth={1.55} fill="none" strokeLinecap="round" />
            <path d={`M${zig.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}`} stroke={clara(corT, 0.28)} strokeWidth={0.32} fill="none" opacity={0.8} />
            {k % 2 === 0 ? <circle cx={fim[0]} cy={fim[1]} r={0.75} fill="#FFC83D" /> : null}
          </g>
        );
      };
      const atrasExtra = <g>{trancas.map((tr, k) => desenhaTranca(tr, k))}</g>;
      const risca = v === 'frente' ? <path d={`M0 ${-0.35 * H}L0 ${-0.58 * H}`} stroke={clara(c.pele, 0)} strokeWidth={0.3} opacity={0.7} /> : null;
      return { porCima: [suave(pts)], atrasExtra, detalhe: risca, brilho: v === 'frente' ? fr(c, [[-0.28, -0.46], [-0.05, -0.53], [0.2, -0.5]]) : fr(c, [[-0.25, -0.5], [0.0, -0.55], [0.22, -0.47]]) };
    }
  }
  return {};
};

const lerpP2 = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** o que vai ATRÁS da cabeça (e do tronco): a massa dos cabelos de volume, coque, rabo, tranças */
export const cabeloAtras = (c: Ctx, Ll: P): React.ReactNode => {
  const h = cabeloDe(c, Ll);
  const cor = c.pessoa.corCabelo;
  if (!h.volume && !h.atrasExtra) return null;
  return (
    <g>
      {h.volume ? <Vol id={`${c.uid}-cva`} ds={h.volume} cor={cor} sombra={sombra(cor)} s={2.2} luzDir={Ll} rim={{ cor: rimDe(c, cor, 0.6), r: 0.5 }} /> : null}
      {h.atrasExtra}
    </g>
  );
};

/** o que vai NA FRENTE da cabeça: a calota, a franja, as cortinas e os detalhes */
export const cabeloFrente = (c: Ctx, Ll: P): React.ReactNode => {
  const h = cabeloDe(c, Ll);
  const cor = c.pessoa.corCabelo;
  const S = sombra(cor);
  const rim = { cor: rimDe(c, cor, 0.6), r: 0.5 };
  const el: React.ReactNode[] = [];
  const cid = `${c.uid}-cfr`;
  let clipBrilho: string | null = null;
  if (h.volume && h.frente) {
    el.push(
      <g key="vf">
        <defs>
          <clipPath id={cid}>
            <path d={linhaFechada(h.frente)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${cid})`}>
          <Vol id={`${c.uid}-cvf`} ds={h.volume} cor={cor} sombra={S} s={2.2} luzDir={Ll} rim={rim} />
        </g>
      </g>,
    );
    clipBrilho = h.volume[0];
  }
  if (h.porCima) {
    el.push(<Vol key="pc" id={`${c.uid}-cpc`} ds={h.porCima} cor={cor} sombra={S} s={1.6} luzDir={Ll} rim={rim} />);
    clipBrilho = h.porCima[0];
  }
  if (h.detalhe) el.push(<g key="dt">{h.detalhe}</g>);
  if (h.brilho && clipBrilho) {
    el.push(
      <g key="br">
        <defs>
          <clipPath id={`${cid}-b`}>
            <path d={clipBrilho} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${cid}-b)`}>
          <path d={suave(h.brilho, false)} stroke={clara(cor, 0.3)} strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.55} />
        </g>
      </g>,
    );
  }
  // brincos depois do cabelo (a argola aparece por baixo dos cachos)
  if (c.pessoa.brinco && c.j.vista === 'frente') {
    const W = c.prop.cabecaLarg;
    const H = c.prop.cabeca;
    for (const s of [-1, 1]) {
      el.push(<circle key={`bri${s}`} cx={s * 0.5 * W} cy={0.24 * H} r={1.05} fill="none" stroke="#FFC83D" strokeWidth={0.42} />);
    }
  }
  return <g>{el}</g>;
};
