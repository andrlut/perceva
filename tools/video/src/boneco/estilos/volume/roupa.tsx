// Volume suave — o tronco e a roupa de cima (com decote, gola, botões, lapela, viés, capuz),
// o quadril da calça e a saia, e os extras do peito (avental, crachá). Tudo desenhado nas
// coordenadas do tronco (u lateral, v pra cima a partir da pélvis) e levado pro mundo pelo
// `mapa` — assim a mesma roupa vira de frente, 3/4 e perfil com o corpo.
import React from 'react';
import type { Juntas, Proporcao } from '../../esqueleto';
import type { Pessoa, Roupa } from '../../elenco';
import { type P, RAD, clamp, dist, lerp, poli, soma, sub, suave, unit } from './geo';
import { ajusta, material, mistura } from './cor';
import { type Kit, type Peca, Vol } from './kit';
import type { Med, Tronco } from './corpo';

export type RCtx = { k: Kit; j: Juntas; prop: Proporcao; med: Med; pessoa: Pessoa; roupa: Roupa; tr: Tronco; t: number; pescocoTopo: P };

const fmt = (x: number) => Math.round(x * 100) / 100;

/** a altura do cós (fração do tronco) e a folga do quadril de cada parte de baixo */
export const COS: Record<Roupa['baixo']['tipo'], number> = { legging: 0.38, jeans: 0.3, calca: 0.32, moletom: 0.32, short: 0.3, pijama: 0.32, saia: 0.34 };

type Cfg = { folga: number; barra: number; gola: 'careca' | 'u' | 'v' | 'colarinho' | 'pijama' | 'blazer' | 'alca'; nw: number; dip: number };

function cfgDe(c: RCtx): Cfg {
  const { roupa, tr, med } = c;
  const T = tr.T;
  const rN = med.rPescoco;
  switch (roupa.cima.tipo) {
    case 'top':
      return { folga: 0.25, barra: 0.6 * T, gola: 'alca', nw: rN + 4.2, dip: 0.15 * T };
    case 'regata':
      return { folga: 0.6, barra: -0.01 * T, gola: 'alca', nw: rN + 2.2, dip: 0.14 * T };
    case 'camiseta':
      return { folga: 1.2, barra: -0.04 * T, gola: 'careca', nw: rN + 1.5, dip: 3.4 };
    case 'manga-longa':
      return { folga: 0.9, barra: -0.04 * T, gola: 'careca', nw: rN + 1.3, dip: 3.0 };
    case 'moletom':
      return { folga: 2.0, barra: 0.0, gola: 'careca', nw: rN + 1.8, dip: 2.8 };
    case 'camisa':
      return { folga: 1.2, barra: roupa.contexto === 'trabalho' ? 0.31 * T : -0.05 * T, gola: 'colarinho', nw: rN + 1.4, dip: 2.6 };
    case 'blusa':
      return { folga: 1.3, barra: 0.03 * T, gola: 'v', nw: rN + 2.2, dip: 0.15 * T };
    case 'blazer':
      return { folga: 1.9, barra: -0.13 * T, gola: 'blazer', nw: rN + 2.4, dip: 0.44 * T };
    case 'pijama':
      return { folga: 1.8, barra: -0.05 * T, gola: 'pijama', nw: rN + 1.8, dip: 0.18 * T };
  }
}

export function troncoEls(c: RCtx) {
  const { k, j, med, pessoa, roupa, tr } = c;
  const T = tr.T;
  const w = tr.w;
  const s = tr.s;
  const M = (pts: P[]) => pts.map(([u, v]) => tr.mapa(u, v));
  const pel = j.pelvis;
  const a = j.ang.tronco * RAD;
  const cT = Math.cos(a);
  const sT = Math.sin(a);
  const inv = (p: P): P => {
    const d = sub(p, pel);
    return [d[0] * cT + d[1] * sT, d[0] * sT - d[1] * cT];
  };
  const rN = med.rPescoco;
  const mP = material(pessoa.pele, 'pele');

  // ---- a pele: tronco + pescoço num contorno só (sem emenda na base do pescoço)
  const nb: P = [-(med.chaves[0].B - med.chaves[0].F) * s * 0.3, T];
  const nt = inv(c.pescocoTopo);
  const e = unit(sub(nt, nb));
  const n: P = [e[1], -e[0]];
  const at = (p: P, u: number, v: number): P => [p[0] + n[0] * u + e[0] * v, p[1] + n[1] * u + e[1] * v];
  const ombroD: P = [tr.borda(0.99 * T, 1), 0.99 * T];
  const ombroE: P = [tr.borda(0.99 * T, -1), 0.99 * T];
  const mid: P = [(nb[0] + nt[0]) / 2, (nb[1] + nt[1]) / 2];
  const pescoco: P[] = [
    [lerp(ombroD[0], nb[0] + rN, 0.55), T + 0.6],
    at(nb, rN * 1.22, 1.4),
    at(mid, rN * 0.98, 0),
    at(nt, rN * 0.92, 0),
    at(nt, 0, 2.5),
    at(nt, -rN * 0.92, 0),
    at(mid, -rN * 0.98, 0),
    at(nb, -rN * 1.22, 1.4),
    [lerp(ombroE[0], nb[0] - rN, 0.55), T + 0.6],
  ];
  // a pele termina no cós (abaixo dele é a calça, desenhada antes)
  const baixoV = COS[roupa.baixo.tipo] * T + 0.4;
  const pelePts = [...tr.lado(baixoV, 0.99 * T, 1), ...M(pescoco), ...tr.lado(0.99 * T, baixoV, -1), tr.mapa(tr.meio(baixoV) * 0.5, baixoV - 0.6)];
  const dPele = suave(pelePts);

  // ---- a roupa de cima
  const cfg = cfgDe(c);
  const cima = roupa.cima;
  const mt = material(cima.cor);
  const m2 = cima.cor2 ? material(cima.cor2) : null;
  const f = cfg.folga;
  const meioT = tr.meio(T);
  // a gola: um anel em volta da base do pescoço, o da frente desce `dip`
  const anel = (nw: number, v0: number, dip: number, forma: 'u' | 'v', de = 90, ate = -90, passos = 10): P[] => {
    const out: P[] = [];
    for (let q = 0; q <= passos; q++) {
      const fi = lerp(de, ate, q / passos);
      const x = nw * Math.sin(fi * RAD);
      const z = (nw + 1.2) * Math.cos(fi * RAD);
      const u = x * w + z * s + nb[0];
      const ab = forma === 'v' ? Math.max(0, 1 - Math.abs(fi) / 90) ** 1.25 : Math.max(0, Math.cos(fi * RAD)) ** 1.6;
      out.push([u, v0 - dip * ab]);
    }
    return out;
  };
  const trapD: P = [lerp(ombroD[0], nb[0] + cfg.nw * w, 0.5), T + 0.5];
  const trapE: P = [lerp(ombroE[0], nb[0] - cfg.nw * w, 0.5), T + 0.5];
  const ombroDf: P = [tr.borda(0.99 * T, 1, f), 0.99 * T + f * 0.4];
  const ombroEf: P = [tr.borda(0.99 * T, -1, f), 0.99 * T + f * 0.4];
  let topo: P[];
  let vLadoTopo = 0.99 * T;
  if (cfg.gola === 'alca') {
    vLadoTopo = 0.78 * T;
    const larg = cima.tipo === 'top' ? 3.4 : 4.6;
    topo = [
      [tr.borda(0.86 * T, 1, f) * 0.78, 0.9 * T],
      [(cfg.nw + larg) * w + nb[0] + meioT * 0.25, 1.0 * T],
      [cfg.nw * w + nb[0] + meioT * 0.35, 1.01 * T],
      ...anel(cfg.nw, 1.0 * T, cfg.dip, 'u', 72, -72, 10),
      [-cfg.nw * w + nb[0] + meioT * 0.15, 1.01 * T],
      [-(cfg.nw + larg) * w + nb[0], 1.0 * T],
      [tr.borda(0.86 * T, -1, f) * 0.78, 0.9 * T],
    ];
  } else {
    const forma = cfg.gola === 'careca' || cfg.gola === 'colarinho' ? 'u' : 'v';
    topo = [ombroDf, trapD, ...anel(cfg.nw, T + 1.3, cfg.dip, forma), trapE, ombroEf];
  }
  const barra = cfg.barra;
  const roupaPts = [...tr.lado(barra, vLadoTopo, 1, f), ...M(topo), ...tr.lado(vLadoTopo, barra, -1, f), tr.mapa(tr.meio(barra) * 0.5, barra - 1.4)];
  const dRoupa = suave(roupaPts);
  const fRoupa = k.caixa(mt);

  const pecas: Peca[] = [{ d: dPele, fill: k.caixa(mP) }];
  const antes: React.ReactNode[] = [];
  const det: React.ReactNode[] = [];
  const linha = (pts: P[], cor: string, wd: number, op = 1, dash?: string) => <path key={`l${det.length}`} d={suave(M(pts), false)} stroke={cor} strokeWidth={wd} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={op} strokeDasharray={dash} />;

  // camisa por baixo do blazer (aparece no V)
  if (cfg.gola === 'blazer') {
    const corC = cima.cor2 ?? '#F4F5FF';
    const mc = material(corC);
    const insert = [...anel(cfg.nw - 0.4, T + 1.6, 3, 'u', 95, -95, 8), [tr.meio(0.5 * T), 0.5 * T] as P];
    pecas.push({ d: suave(M(insert)), fill: k.caixa(mc) });
    // a gola da camisa
    const gD = anel(cfg.nw - 0.4, T + 1.6, 3, 'u', 95, 20, 4);
    const gE = anel(cfg.nw - 0.4, T + 1.6, 3, 'u', -20, -95, 4);
    pecas.push({ d: suave(M([...gD, [meioT + 1.6 * w, T - 6]])), fill: k.caixa(material(ajusta(corC, 0.03))) });
    pecas.push({ d: suave(M([[meioT - 1.6 * w, T - 6], ...gE])), fill: k.caixa(material(ajusta(corC, -0.02))) });
  }
  pecas.push({ d: dRoupa, fill: fRoupa });

  // ---- detalhes por peça
  const decote = (dip: number, nw: number, forma: 'u' | 'v', v0: number) => anel(nw, v0, dip, forma);
  if (cfg.gola === 'careca') {
    // a gola canelada
    det.push(linha(decote(cfg.dip, cfg.nw, 'u', T + 1.3).map(([u, v]) => [u, v - 0.6] as P), m2?.base ?? mt.sombra, 1.3, m2 ? 0.95 : 0.7));
  }
  if (cfg.gola === 'alca') {
    const viés = m2?.base ?? mt.luz;
    det.push(linha(anel(cfg.nw, 1.0 * T, cfg.dip, 'u', 72, -72, 10).map(([u, v]) => [u, v - 0.5] as P), viés, 0.9, 0.95));
    if (cima.tipo === 'top' && m2) {
      // a faixa elástica embaixo do busto
      const fx = [...tr.lado(barra, barra + 3.2, 1, f + 0.15, 3), ...tr.lado(barra + 3.2, barra, -1, f + 0.15, 3), tr.mapa(tr.meio(barra) * 0.5, barra - 1.4)];
      pecas.push({ d: suave(fx), fill: k.caixa(m2) });
    }
  }
  if (cfg.gola === 'colarinho' || cfg.gola === 'pijama') {
    // abas da gola + carcela com botões
    const v0 = T + 1.3;
    const pj = cfg.gola === 'pijama';
    const ab = anel(cfg.nw, v0, cfg.dip, pj ? 'v' : 'u', 100, -100, 12);
    const fim = pj ? 0.66 * T : 0.86 * T;
    const ponta = pj ? 7.5 : 6.2;
    const corGola = mistura(cima.cor, '#FFFFFF', 0.12);
    const mg = material(corGola);
    const abaD: P[] = [ab[0], [ab[0][0], ab[0][1] + 1.6], ab[3], [ab[5][0] + ponta * w * 0.5 + meioT * 0.1, ab[5][1] - ponta]];
    const abaE: P[] = [ab[12], [ab[12][0], ab[12][1] + 1.6], ab[9], [ab[7][0] - ponta * w * 0.5 + meioT * 0.1, ab[7][1] - ponta]];
    pecas.push({ d: suave(M(abaD)), fill: k.caixa(mg) }, { d: suave(M(abaE)), fill: k.caixa(mg) });
    if (pj && m2) {
      det.push(linha([abaD[2], abaD[3]], m2.base, 0.75), linha([abaE[2], abaE[3]], m2.base, 0.75));
    }
    // carcela
    const vs: P[] = [];
    for (let v = (pj ? T - cfg.dip : T - 4); v >= barra + 2; v -= 3) vs.push([tr.meio(v), v]);
    if (vs.length > 1) det.push(linha(vs, pj && m2 ? m2.base : mt.sombra, pj ? 0.75 : 0.5, 0.8));
    for (let v = fim; v >= barra + 4; v -= 7.5) {
      const p = tr.mapa(tr.meio(v) + 1.0 * w, v);
      det.push(<circle key={`bt${v}`} cx={p[0]} cy={p[1]} r={0.62} fill={m2?.base ?? mt.fundo} />);
    }
    if (pj && m2) {
      // bolso no peito com viés
      const bx = tr.borda(0.62 * T, -1) * 0.45 + meioT * 0.2;
      const bol: P[] = [
        [bx - 3.6 * w, 0.72 * T],
        [bx + 3.6 * w, 0.72 * T],
        [bx + 3.4 * w, 0.6 * T],
        [bx - 3.4 * w, 0.6 * T],
      ];
      det.push(<path key="bolso" d={poli(M(bol))} fill={mt.sombra} opacity={0.25} />, linha([bol[0], bol[1]], m2.base, 0.7));
    }
  }
  if (cima.tipo === 'camisa' && roupa.contexto === 'trabalho') {
    // cinto (camisa pra dentro) com fivela dourada
    const cinto = [...tr.lado(barra - 2.4, barra + 0.4, 1, 1.4, 2), ...tr.lado(barra + 0.4, barra - 2.4, -1, 1.4, 2)];
    pecas.push({ d: suave(cinto), fill: k.caixa(material('#4A2E24')) });
    const fv = tr.mapa(tr.meio(barra - 1), barra - 1);
    det.push(<rect key="fivela" x={fv[0] - 1.8} y={fv[1] - 1.5} width={3.6} height={3} rx={0.7} fill="none" stroke="#FFC83D" strokeWidth={0.8} />);
  }
  if (cfg.gola === 'v' && m2) {
    det.push(linha(anel(cfg.nw, T + 1.3, cfg.dip, 'v').map(([u, v]) => [u, v - 0.5] as P), m2.base, 1.0, 0.95));
  }
  if (cfg.gola === 'blazer') {
    // lapelas: duas tiras ao longo do V, com o entalhe
    const ab = anel(cfg.nw, T + 1.3, cfg.dip, 'v', 95, -95, 12);
    const vFundo = T + 1.3 - cfg.dip;
    const larg = 4.2;
    const lapD: P[] = [ab[0], ab[2], [tr.meio(vFundo), vFundo], [tr.meio(vFundo) + 2.5 * w, vFundo + 4], [ab[3][0] + larg * w, ab[3][1] - 3], [ab[1][0] + larg * w * 0.9, ab[1][1] - 2.2], [ab[0][0] + 1.6 * w, ab[0][1] - 1.2]];
    const lapE: P[] = [ab[12], ab[10], [tr.meio(vFundo), vFundo], [tr.meio(vFundo) - 2.5 * w, vFundo + 4], [ab[9][0] - larg * w, ab[9][1] - 3], [ab[11][0] - larg * w * 0.9, ab[11][1] - 2.2], [ab[12][0] - 1.6 * w, ab[12][1] - 1.2]];
    const ml = material(ajusta(cima.cor, 0.05));
    pecas.push({ d: suave(M(lapD)), fill: k.caixa(ml) }, { d: suave(M(lapE)), fill: k.caixa(ml) });
    const bt = tr.mapa(tr.meio(0.3 * T) + 0.4, 0.3 * T);
    det.push(<circle key="botao" cx={bt[0]} cy={bt[1]} r={1.0} fill={mt.fundo} />, <circle key="botao2" cx={bt[0] - 0.3} cy={bt[1] - 0.3} r={0.35} fill={mt.luz} opacity={0.7} />);
    // bolsos (lapelinhas)
    for (const ld of [1, -1] as const) {
      const u0 = tr.borda(0.12 * T, ld) * 0.62 + meioT * 0.2;
      det.push(linha([[u0 - 3.4 * w, 0.12 * T], [u0 + 3.4 * w, 0.12 * T]], mt.fundo, 0.55, 0.7));
    }
    // costura do meio das costas/frente embaixo do botão
    det.push(linha([[tr.meio(0.3 * T), 0.28 * T], [tr.meio(barra) * 0.9, barra + 0.5]], mt.fundo, 0.45, 0.5));
  }
  if (cima.tipo === 'moletom') {
    const rib = [...tr.lado(barra, barra + 3.2, 1, f + 0.1, 2), ...tr.lado(barra + 3.2, barra, -1, f + 0.1, 2), tr.mapa(tr.meio(barra) * 0.5, barra - 1.4)];
    pecas.push({ d: suave(rib), fill: k.caixa(material(ajusta(cima.cor, -0.07))) });
    // bolso canguru
    const u0 = tr.meio(0.2 * T) * 0.7;
    const bw = tr.borda(0.2 * T, 1, f) * 0.55 + Math.abs(tr.borda(0.2 * T, -1, f)) * 0.55;
    const bol: P[] = [
      [u0 - bw * 0.45, 0.07 * T],
      [u0 + bw * 0.45, 0.07 * T],
      [u0 + bw * 0.34, 0.29 * T],
      [u0 - bw * 0.34, 0.29 * T],
    ];
    det.push(<path key="canguru" d={suave(M(bol))} fill={mt.sombra} opacity={0.28} />);
    det.push(linha([bol[2], [u0 + bw * 0.42, 0.14 * T]], mt.fundo, 0.5, 0.6), linha([bol[3], [u0 - bw * 0.42, 0.14 * T]], mt.fundo, 0.5, 0.6));
    // cordões do capuz
    for (const ld of [-1, 1] as const) {
      const u = meioT + ld * 2.2 * Math.max(0.4, w);
      const p0: P = [u, T - 2.2];
      const p1: P = [u + ld * 0.3, T - 12];
      det.push(linha([p0, [u + ld * 0.5, T - 7], p1], m2?.base ?? '#F4F5FF', 0.7));
      const pp = tr.mapa(...p1);
      det.push(<rect key={`ag${ld}`} x={pp[0] - 0.55} y={pp[1]} width={1.1} height={2} rx={0.5} fill={mt.fundo} />);
    }
    // capuz atrás do pescoço
    const cz = -s * (rN + 2.5);
    const capuz: P[] = [
      [-(cfg.nw + 5) * w + cz, T - 1],
      [-(cfg.nw + 5.5) * Math.max(w, 0.6) + cz, T + 3.5],
      [cz - s * 2, T + 6.5],
      [(cfg.nw + 4.5) * Math.max(w, 0.5) + cz, T + 3.5],
      [(cfg.nw + 4.5) * w + cz, T - 1],
    ];
    antes.push(<Vol key="capuz" k={k} pecas={[{ d: suave(M(capuz)), fill: k.caixa(material(ajusta(cima.cor, -0.1))) }]} />);
  }
  if (cima.tipo === 'blusa') {
    // a barra com um tico de godê e as dobras do caimento
    det.push(linha([[tr.borda(0.42 * T, 1, f) * 0.7, 0.42 * T], [tr.borda(0.15 * T, 1, f) * 0.65, 0.12 * T]], mt.sombra, 0.6, 0.35));
  }
  if (cima.tipo === 'camiseta' || cima.tipo === 'moletom' || cima.tipo === 'manga-longa' || cima.tipo === 'pijama') {
    // dobras de caimento: do sovaco pra cintura, do lado da sombra
    const ld = k.espelho ? -1 : 1;
    const u1 = tr.borda(0.72 * T, ld as 1 | -1, f) * 0.72;
    const u2 = tr.borda(0.32 * T, ld as 1 | -1, f) * 0.55;
    det.push(linha([[u1, 0.72 * T], [lerp(u1, u2, 0.5) - ld * 0.6, 0.52 * T], [u2, 0.3 * T]], mt.sombra, 0.7, 0.35));
  }

  // corpo largo: a barriga lê de cara (um volume claro em cima e a sombra embaixo, dentro da roupa)
  if (med.largo && cfg.barra < 0.3 * T) {
    const rec = k.recorte([dRoupa]);
    const c0 = tr.mapa(tr.meio(0.3 * T) * 1.05, 0.3 * T);
    const c1 = tr.mapa(tr.meio(0.12 * T) * 1.1, 0.1 * T);
    const lw = (tr.borda(0.3 * T, 1, f) - tr.borda(0.3 * T, -1, f)) * 0.36;
    det.push(
      <g key="barriga" clipPath={rec}>
        <ellipse cx={c0[0] - (k.espelho ? -1 : 1) * lw * 0.15} cy={c0[1] - 1} rx={lw} ry={0.15 * T} fill={mt.luz} opacity={0.3} filter={k.desfoque(1.6)} />
        <ellipse cx={c1[0]} cy={c1[1] + 1} rx={lw * 1.15} ry={0.07 * T} fill={mt.fundo} opacity={0.4} filter={k.desfoque(1.4)} />
      </g>,
    );
  }

  // ---- extras do peito
  const extras = roupa.extras ?? [];
  const sobre: React.ReactNode[] = [];
  if (extras.includes('avental')) {
    const cor = mistura(pessoa.cor, '#FFFFFF', 0.7);
    const ma = material(cor);
    const mc = meioT;
    const bw = 5.2 * Math.max(w, 0.6);
    const pts: P[] = [
      [mc - bw, 0.84 * T],
      [mc + bw, 0.84 * T],
      [tr.meio(0.5 * T) + bw * 1.15, 0.5 * T],
      [tr.borda(0.36 * T, 1, f + 0.5) * 0.92, 0.36 * T],
      [tr.borda(0.05 * T, 1, f + 0.8) * 0.95, -0.36 * T],
      [tr.meio(0) * 0.6, -0.4 * T],
      [tr.borda(0.05 * T, -1, f + 0.8) * 0.95, -0.36 * T],
      [tr.borda(0.36 * T, -1, f + 0.5) * 0.92, 0.36 * T],
      [tr.meio(0.5 * T) - bw * 1.15, 0.5 * T],
    ];
    const dA = suave(M(pts));
    sobre.push(
      <g key="avental">
        {linha([[mc - bw * 0.85, 0.84 * T], [nb[0] - rN * 0.9, T + 2]], pessoa.cor, 0.9)}
        {linha([[mc + bw * 0.85, 0.84 * T], [nb[0] + rN * 0.9, T + 2]], pessoa.cor, 0.9)}
        <Vol k={k} pecas={[{ d: dA, fill: k.caixa(ma) }]}>
          <path d={suave(M([[mc - 4.2 * w, 0.06 * T], [mc + 4.2 * w, 0.06 * T], [mc + 3.8 * w, -0.12 * T], [mc - 3.8 * w, -0.12 * T]]))} fill={pessoa.cor} opacity={0.75} />
          {linha([[mc - 4.2 * w, 0.06 * T], [mc + 4.2 * w, 0.06 * T]], ajusta(pessoa.cor, -0.12), 0.6)}
          {linha([[tr.borda(0.36 * T, -1, f + 0.5) * 0.92, 0.36 * T], [tr.borda(0.36 * T, 1, f + 0.5) * 0.92, 0.36 * T]], pessoa.cor, 1.2, 0.9)}
        </Vol>
      </g>,
    );
  }
  if (extras.includes('cracha')) {
    const fim: P = [tr.meio(0.6 * T) + 1.2 * w, 0.58 * T];
    const cd: P = [nb[0] + rN * 1.05 * Math.max(w, 0.5), T + 1.5];
    const ce: P = [nb[0] - rN * 1.05 * Math.max(w, 0.5), T + 1.5];
    const pf = tr.mapa(...fim);
    sobre.push(
      <g key="cracha">
        {linha([cd, [fim[0] + 1, fim[1] + 3], fim], pessoa.cor, 0.8)}
        {linha([ce, [fim[0] - 1, fim[1] + 3], fim], pessoa.cor, 0.8)}
        <g transform={`rotate(${fmt(-j.ang.tronco * 0.6 + 4)} ${fmt(pf[0])} ${fmt(pf[1])})`}>
          <rect x={pf[0] - 3} y={pf[1]} width={6} height={8} rx={1} fill="#F4F5FF" />
          <rect x={pf[0] - 3} y={pf[1]} width={6} height={2} rx={1} fill={pessoa.cor} />
          <rect x={pf[0] - 2} y={pf[1] + 2.8} width={2.2} height={2.6} rx={0.5} fill={mistura(pessoa.cor, '#FFFFFF', 0.4)} />
          <rect x={pf[0] + 0.7} y={pf[1] + 3.2} width={1.6} height={0.5} fill="#9AA0C4" />
          <rect x={pf[0] + 0.7} y={pf[1] + 4.4} width={1.2} height={0.5} fill="#9AA0C4" />
        </g>
      </g>,
    );
  }

  return {
    antes,
    el: (
      <>
        <Vol k={k} pecas={pecas}>
          {det}
        </Vol>
        {sobre}
      </>
    ),
    dPele,
    dRoupa,
    ds: [dPele, dRoupa],
  };
}

/** o quadril da calça (cós, gancho) — ou a saia por cima das coxas */
export function quadrilEls(c: RCtx) {
  const { k, j, med, roupa, tr } = c;
  const T = tr.T;
  const b = roupa.baixo;
  const mt = material(b.cor);
  const M = (pts: P[]) => pts.map(([u, v]) => tr.mapa(u, v));
  const det: React.ReactNode[] = [];
  if (b.tipo === 'saia') {
    const vC = 0.34 * T;
    const p0 = j.joelho[0];
    const p1 = j.joelho[1];
    const q0: P = [lerp(j.quadril[0][0], p0[0], 0.8), lerp(j.quadril[0][1], p0[1], 0.8)];
    const q1: P = [lerp(j.quadril[1][0], p1[0], 0.8), lerp(j.quadril[1][1], p1[1], 0.8)];
    const r = med.rCoxa(0.8) + 3.6;
    const xL = Math.min(q0[0], q1[0]) - r;
    const xR = Math.max(q0[0], q1[0]) + r;
    const yH = Math.max(q0[1], q1[1]) + 1;
    const pts: P[] = [tr.mapa(tr.borda(vC, 1, 1), vC), tr.mapa(tr.borda(0, 1, 2.2), 0), [xR, yH - 1], [(xL + xR) / 2, yH + 1.6], [xL, yH - 1], tr.mapa(tr.borda(0, -1, 2.2), 0), tr.mapa(tr.borda(vC, -1, 1), vC), tr.mapa(tr.meio(vC) * 0.5, vC + 0.5)];
    const d = suave(pts);
    const hip = tr.mapa(tr.meio(0.1 * T), 0.1 * T);
    det.push(
      <path key="dob1" d={`M${fmt(hip[0] + 3)} ${fmt(hip[1])}Q${fmt(xR - 6)} ${fmt(yH - 6)} ${fmt(xR - 4)} ${fmt(yH)}`} stroke={mt.sombra} strokeWidth={0.7} fill="none" opacity={0.4} />,
      <path key="dob2" d={`M${fmt(hip[0] - 3)} ${fmt(hip[1])}Q${fmt(xL + 7)} ${fmt(yH - 6)} ${fmt(xL + 6)} ${fmt(yH)}`} stroke={mt.sombra} strokeWidth={0.7} fill="none" opacity={0.4} />,
    );
    return { el: <Vol k={k} pecas={[{ d, fill: k.caixa(mt) }]}>{det}</Vol>, ds: [d] };
  }
  const vC = COS[b.tipo] * T;
  const fo = { legging: 0.45, jeans: 1.1, calca: 1.25, moletom: 2.2, short: 1.6, pijama: 2.3 }[b.tipo as 'jeans'];
  const Qw = c.prop.quadris * tr.w;
  const cr = med.rCoxa(0);
  const pts: P[] = [
    ...tr.lado(0, vC, 1, fo, 4),
    tr.mapa(tr.meio(vC) * 0.6, vC + 0.6),
    ...tr.lado(vC, 0, -1, fo, 4),
  ];
  // o gancho: um V raso logo abaixo das juntas do quadril (as coxas, desenhadas antes, saem dali)
  const fundo = M([
    [-Qw - cr * 0.55, -0.03 * T],
    [tr.meio(0) * 0.2 - Qw * 0.15, -0.1 * T],
    [tr.meio(0) * 0.2 + Qw * 0.15, -0.1 * T],
    [Qw + cr * 0.55, -0.03 * T],
  ]);
  const d = suave([...pts, ...fundo]);
  // cós e o que cada calça tem na cintura
  if (b.tipo === 'legging') {
    const cos = [...tr.lado(vC - 3.2, vC, 1, fo + 0.1, 2), ...tr.lado(vC, vC - 3.2, -1, fo + 0.1, 2)];
    det.push(<path key="cos" d={suave(cos)} fill={b.cor2 ?? mt.luz} opacity={b.cor2 ? 0.95 : 0.5} />);
  } else if (b.tipo === 'jeans' || b.tipo === 'calca') {
    const l = M([
      [tr.borda(vC - 2.4, 1, fo), vC - 2.4],
      [tr.meio(vC - 2.4), vC - 3],
      [tr.borda(vC - 2.4, -1, fo), vC - 2.4],
    ]);
    det.push(<path key="cos" d={suave(l, false)} stroke={mt.sombra} strokeWidth={0.55} fill="none" opacity={0.8} />);
    if (b.tipo === 'jeans') {
      const bt = tr.mapa(tr.meio(vC - 1.2), vC - 1.2);
      det.push(<circle key="bt" cx={bt[0]} cy={bt[1]} r={0.75} fill="#E8B547" />);
      // bolso da frente (a curva) do lado da frente
      const ld = tr.w < 0.9 ? 1 : 1;
      const p = M([
        [tr.borda(vC - 3, ld as 1, fo) * 0.92, vC - 3],
        [tr.borda(vC - 3, ld as 1, fo) * 0.62, vC - 6],
        [tr.borda(vC - 9, ld as 1, fo) * 0.95, vC - 9],
      ]);
      det.push(<path key="bolso" d={suave(p, false)} stroke={mistura(b.cor, '#FFD58A', 0.5)} strokeWidth={0.4} strokeDasharray="1 0.9" fill="none" opacity={0.8} />);
    }
  } else if (b.tipo === 'moletom' || b.tipo === 'pijama' || b.tipo === 'short') {
    const l = M([
      [tr.borda(vC - 2.6, 1, fo), vC - 2.6],
      [tr.meio(vC - 2.6), vC - 3.1],
      [tr.borda(vC - 2.6, -1, fo), vC - 2.6],
    ]);
    det.push(<path key="cos" d={suave(l, false)} stroke={mt.sombra} strokeWidth={0.6} fill="none" opacity={0.7} />);
    if (b.tipo !== 'pijama') {
      const p = tr.mapa(tr.meio(vC - 1.4), vC - 1.4);
      det.push(<path key="cord" d={`M${fmt(p[0] - 0.8)} ${fmt(p[1])}l-0.6 4M${fmt(p[0] + 0.8)} ${fmt(p[1])}l0.4 4.2`} stroke={b.cor2 ?? '#F4F5FF'} strokeWidth={0.55} strokeLinecap="round" />);
    }
  }
  const xL = tr.mapa(tr.borda(0.1 * T, -1, fo), 0.1 * T);
  const xR = tr.mapa(tr.borda(0.1 * T, 1, fo), 0.1 * T);
  const [la, lb] = k.espelho ? [xR, xL] : [xL, xR];
  const fill = k.lin(la, lb, [
    [0, mistura(mt.base, mt.luz, 0.8)],
    [0.4, mt.base],
    [0.85, mt.sombra],
    [1, mt.rebate],
  ]);
  // o quadril esmaece embaixo: a calça continua nas coxas sem emenda (as coxas vêm antes)
  return {
    el: (
      <g mask={k.esmaece(0.66, 0.97)}>
        <Vol k={k} pecas={[{ d, fill }]}>{det}</Vol>
      </g>
    ),
    ds: [d],
  };
}

export const _d = dist;
export const _c = clamp;
