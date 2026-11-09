// "Animação de série" — o corpo vestido: pernas (com calçado), cintura, saia, tronco, braços.
// Cada função devolve UMA camada (ver base.tsx): o forro grosso fecha a silhueta e cada peça de
// roupa tem a sua linha fina. A roupa é de verdade: decote, manga do tamanho certo, bainha,
// costura dourada no jeans, vinco na calça social, punho canelado no moletom, viés no pijama.
import React from 'react';
import { ao } from '../../esqueleto';
import {
  type Forma,
  type Grupo,
  type P,
  type PQ,
  LINHA,
  TINTA,
  Traco,
  add,
  capsula,
  clamp,
  clareia,
  dirDe,
  dist,
  escurece,
  lerp,
  lerpP,
  linha,
  luma,
  mix,
  mul,
  norm,
  perp,
  sombraDe,
  sub,
  suave, sw } from './base';
import type { Ctx } from './ctx';
import { maoDe } from './maos';
import { copo, garrafa, halter } from './objetos';

// ------------------------------------------------------------------ roupa: leitura do contrato

const TOPO_CINTURA: Record<string, number> = { legging: 0.32, jeans: 0.2, calca: 0.22, moletom: 0.22, pijama: 0.24, short: 0.22, saia: 0.3 };

/** onde termina a peça de cima (vf) — camisa social de trabalho vai pra dentro da calça */
const barraCima = (c: Ctx) => {
  const tp = c.roupa.cima.tipo;
  if (tp === 'top') return 0.6;
  if (tp === 'camisa' && c.roupa.contexto === 'trabalho') return TOPO_CINTURA[c.roupa.baixo.tipo] - 0.025;
  return { regata: -0.03, camiseta: -0.05, 'manga-longa': -0.05, moletom: -0.07, camisa: -0.07, blusa: -0.04, blazer: -0.17, pijama: -0.07 }[tp] ?? -0.05;
};

const folgaCima = (tp: string) => ({ top: 0.35, regata: 0.6, camiseta: 1.3, 'manga-longa': 0.9, moletom: 2.6, camisa: 1.7, blusa: 1.4, blazer: 2.3, pijama: 2.3 })[tp] ?? 1;

type Manga = { ate: 'nada' | 'curta' | 'cotovelo' | 'dobrada' | 'longa'; folga: number; punho?: 'canelado' | 'camisa' | 'viés' | 'blazer' };
const mangaDe = (c: Ctx): Manga => {
  const tp = c.roupa.cima.tipo;
  if (tp === 'top' || tp === 'regata') return { ate: 'nada', folga: 0 };
  if (tp === 'camiseta') return { ate: 'curta', folga: 1.7 };
  if (tp === 'blusa') return { ate: 'cotovelo', folga: 1.5 };
  if (tp === 'manga-longa') return { ate: 'longa', folga: 0.9 };
  if (tp === 'moletom') return { ate: 'longa', folga: 2.3, punho: 'canelado' };
  if (tp === 'camisa') return c.roupa.contexto === 'trabalho' ? { ate: 'longa', folga: 1.5, punho: 'camisa' } : { ate: 'dobrada', folga: 1.6 };
  if (tp === 'blazer') return { ate: 'longa', folga: 2.0, punho: 'blazer' };
  return { ate: 'longa', folga: 2.1, punho: 'viés' };
};

const contraste = (c: string) => (luma(c) > 0.62 ? escurece(c, 0.55) : '#F4F5FF');

// ------------------------------------------------------------------ pernas

/** a pélvis da calça/short/legging (o "calção" que liga as duas pernas) */
export function pelvisForma(c: Ctx): Forma | null {
  const { tr, roupa } = c;
  const b = roupa.baixo;
  if (b.tipo === 'saia') return null;
  const top = TOPO_CINTURA[b.tipo];
  const e = b.tipo === 'legging' ? 0.45 : b.tipo === 'moletom' || b.tipo === 'pijama' ? 2.2 : 1.3;
  const uc = tr.s * tr.F(0) * 0.3;
  const pts: PQ[] = [
    [...tr.P(tr.xr(top, e), top), 1] as PQ,
    tr.P(tr.xr(0.1, e), 0.1),
    tr.P(tr.xr(0, e + 0.3), 0),
    tr.P(tr.xr(-0.08, e), -0.08),
    tr.P(lerp(tr.xr(-0.14, e), uc, 0.5), -0.16),
    tr.P(uc, -0.18),
    tr.P(lerp(tr.xl(-0.14, e), uc, 0.5), -0.16),
    tr.P(tr.xl(-0.08, e), -0.08),
    tr.P(tr.xl(0, e + 0.3), 0),
    tr.P(tr.xl(0.1, e), 0.1),
    [...tr.P(tr.xl(top, e), top), 1] as PQ,
    tr.P(tr.uFrente(0, top, e), top - 0.012),
  ];
  return { d: suave(pts), cor: b.cor, k: 5 };
}

type PartesPerna = { pele: Forma[]; calca: Forma[]; pe: { formas: Forma[]; detalhes: React.ReactNode }; detalhes: React.ReactNode };

function pernaPartes(c: Ctx, i: 0 | 1): PartesPerna {
  const { j, fis, roupa } = c;
  const b = roupa.baixo;
  const q = j.quadril[i];
  const jo = j.joelho[i];
  const to = j.tornozelo[i];
  const frente = j.vista === 'frente';
  const cb = fis.canela[1];
  const coxaD = (e: number, e1 = e, fim?: number) =>
    capsula(q, fim == null ? jo : lerpP(q, jo, fim), fis.coxa[0] + e, fim == null ? fis.coxa[1] + e1 : lerp(fis.coxa[0], fis.coxa[1], fim) + e1, {
      bn: [0.9, 0.2],
      bm: [1.3, 0.5],
      fimB: fim == null ? 'redondo' : 'reto',
    });
  const canD = (e0: number, e1: number, ext = 0, reto = false) => {
    const dirC = norm(sub(to, jo));
    return capsula(jo, add(to, mul(dirC, ext)), fis.canela[0] + e0, fis.canela[2] + e1, {
      bn: frente ? [cb * 0.7, cb * 0.2] : [cb, cb * 0.35],
      bm: frente ? [cb * 0.5, 0] : [0.4, 0],
      fimB: reto ? 'reto' : 'redondo',
    });
  };
  const pele: Forma[] = [];
  const calca: Forma[] = [];
  const peleF = (d: string): Forma => ({ d, cor: c.pele, sombra: c.peleSombra, k: 3.6, uniao: 'pele' });
  const pano = (d: string, cor = b.cor, k = 3.8): Forma => ({ d, cor, k, uniao: 'calca' });
  const det: React.ReactNode[] = [];
  const dirCoxa = norm(sub(jo, q));
  const dirCan = norm(sub(to, jo));
  // lado "de fora" da perna (onde mora a listra/costura): de frente, pra fora do corpo
  const nC = perp(dirCoxa);
  const nK = perp(dirCan);
  const fora = frente ? (i === 0 ? 1 : -1) : 0.35;
  const listra = (e: number, ate: P, r: [number, number, number]) =>
    linha([add(q, mul(nC, (fis.coxa[0] + e) * 0.62 * fora)), add(jo, mul(nC, (fis.coxa[1] + e) * 0.75 * fora)), add(ate, mul(nK, r[2] * 0.7 * fora))]);
  const curta = b.tipo === 'short' || b.tipo === 'saia';
  if (curta) {
    pele.push(peleF(coxaD(0)), peleF(canD(0, 0)));
  }
  if (b.tipo === 'short') {
    calca.push(pano(coxaD(2.3, 3.0, 0.5)));
    if (b.cor2) det.push(<Traco key="lst" d={linha([add(q, mul(nC, (fis.coxa[0] + 2.3) * 0.6 * fora)), add(lerpP(q, jo, 0.48), mul(nC, (fis.coxa[0] + 2.8) * 0.75 * fora))])} w={1.6} cor={b.cor2} />);
  } else if (b.tipo === 'legging') {
    calca.push(pano(coxaD(0.45, 0.4)), pano(canD(0.4, 0.35, -0.4, true)));
    if (b.cor2) det.push(<Traco key="lst" d={listra(0.45, to, [0, 0, fis.canela[2]])} w={1.5} cor={b.cor2} />);
  } else if (b.tipo !== 'saia') {
    const f = { jeans: [1.7, 2.1, 2.7, 3.0], calca: [2.1, 2.5, 3.2, 3.4], moletom: [2.9, 3.4, 1.7, 0.6], pijama: [2.9, 3.4, 3.6, 2.6] }[b.tipo] ?? [2, 2.4, 3, 3];
    calca.push(pano(coxaD(f[0], f[1])), pano(canD(f[1], f[2], f[3], true)));
    const hem = add(to, mul(dirCan, f[3]));
    if (b.tipo === 'jeans') {
      // costura lateral dourada (o pesponto do jeans) e a barra dobrada
      det.push(<Traco key="cos" d={listra(f[0], hem, [0, 0, fis.canela[2] + f[2]])} w={0.7} cor="#E8B85A" tracejado="1.6 1.1" />);
      const nh = perp(dirCan);
      const r = fis.canela[2] + f[2];
      det.push(<Traco key="bar" d={linha([add(add(hem, mul(dirCan, -2.4)), mul(nh, r)), add(add(hem, mul(dirCan, -2.4)), mul(nh, -r))])} w={LINHA.fino} />);
    } else if (b.tipo === 'calca') {
      // vinco no meio da perna (calça social)
      det.push(<Traco key="vin" d={linha([add(q, mul(nC, -1.5)), add(jo, mul(nK, -0.8)), add(hem, mul(nK, -0.6))])} w={LINHA.fino} op={0.55} />);
    } else if (b.tipo === 'moletom') {
      const r = fis.canela[2] + f[2];
      const nh = perp(dirCan);
      const p0 = add(hem, mul(dirCan, -3.4));
      calca.push(pano(capsula(p0, hem, r + 0.3, r, { fimA: 'reto', fimB: 'reto' }), escurece(b.cor, 0.12), 1.2));
      for (const s of [-0.5, 0, 0.5]) det.push(<Traco key={`cn${s}`} d={linha([add(add(p0, mul(nh, r * s)), mul(dirCan, 0.4)), add(add(hem, mul(nh, r * s)), mul(dirCan, -0.4))])} w={LINHA.fino * 0.7} op={0.5} />);
      // pano sobrando acima do punho
      det.push(<Traco key="dob" d={linha([add(add(p0, mul(dirCan, -3)), mul(nh, r + 1.6)), add(add(p0, mul(dirCan, -1.2)), mul(nh, r * 0.2))])} w={LINHA.fino} op={0.7} />);
    } else if (b.tipo === 'pijama' && b.cor2) {
      const nh = perp(dirCan);
      const r = fis.canela[2] + f[2];
      det.push(<Traco key="vies" d={linha([add(add(hem, mul(dirCan, -1.4)), mul(nh, r)), add(add(hem, mul(dirCan, -1.4)), mul(nh, -r))])} w={1.3} cor={b.cor2} />);
    }
  }
  // dobra atrás do joelho quando ele dobra
  const dob = j.ang.coxa[i] - j.ang.canela[i];
  if (dob > 28) {
    const bis = norm(add(mul(dirCoxa, -1), dirCan));
    const r = fis.coxa[1] + (curta || b.tipo === 'legging' ? 0 : 2.2);
    const p = add(jo, mul(bis, r * 0.7));
    const tg = perp(bis);
    det.push(<Traco key="joe" d={linha([add(p, mul(tg, -r * 0.45)), add(p, mul(bis, r * 0.25)), add(p, mul(tg, r * 0.45))])} w={LINHA.fino} op={0.8} />);
  }
  return { pele, calca, pe: calcado(c, i), detalhes: <g>{det}</g> };
}

/** calçado: tênis de sola grossa e cadarço, sapato, chinelo, meia, bota — de lado ou de frente */
function calcado(c: Ctx, i: 0 | 1): { formas: Forma[]; detalhes: React.ReactNode } {
  const { j, prop, roupa } = c;
  const cal = roupa.calcado;
  const to = j.tornozelo[i];
  const sola = ao(to, j.ang.canela[i], prop.tornozelo);
  const sk = prop.pe / 30;
  const det: React.ReactNode[] = [];
  const formas: Forma[] = [];
  const corSola = cal.sola ?? (cal.tipo === 'sapato' ? escurece(cal.cor, 0.45) : cal.tipo === 'bota' ? '#3A2A22' : '#F4F5FF');
  const pano = (d: string, cor: string, k = 2): Forma => ({ d, cor, k });
  if (j.vista === 'frente') {
    // de frente: o bico vem pra câmera, um tico aberto pra fora
    const sx = i === 0 ? -1 : 1;
    const o: P = [sola[0] + sx * 1.8, sola[1]];
    const kf = (c.fis.canela[2] / 4.4) * 1.12;
    const Q = (x: number, y: number): P => [o[0] + x * sx * sk * kf, o[1] - y * sk * Math.min(1.15, kf)];
    const Qs = (a: [number, number][]) => a.map(([x, y]) => Q(x, y));
    if (cal.tipo === 'chinelo') {
      formas.push(pano(suave(Qs([[-6, 0], [6.5, 0], [7, 1.2], [6.4, 2.2], [-6, 2.2], [-6.6, 1.1]])), cal.cor, 1));
      formas.push({ d: suave(Qs([[-4.6, 2], [-4.8, 5.6], [-3, 8.6], [0.5, 9.4], [3.4, 8.4], [5, 5.2], [5.4, 2]])), cor: c.pele, sombra: c.peleSombra, k: 1.5 });
      det.push(<Traco key="tira" d={linha(Qs([[-4.3, 4.8], [0.4, 7.2], [4.8, 4.6]]))} w={1.6} cor={cal.cor} />);
      det.push(<Traco key="ded" d={linha(Qs([[-3.6, 2.6], [-3.6, 3.6]]))} w={LINHA.fino} />);
      det.push(<Traco key="ded2" d={linha(Qs([[-1.2, 2.6], [-1.2, 3.8]]))} w={LINHA.fino} />);
      det.push(<Traco key="ded3" d={linha(Qs([[1.3, 2.6], [1.3, 3.8]]))} w={LINHA.fino} />);
    } else if (cal.tipo === 'meia') {
      formas.push(pano(suave(Qs([[-5.4, 0.2], [5.8, 0.2], [6.2, 3], [5.2, 8], [3.2, 12.5], [-2.6, 12.5], [-4.6, 8], [-6, 3]])), cal.cor, 1.6));
      det.push(<Traco key="can" d={linha(Qs([[-3, 10.6], [3.4, 10.6]]))} w={LINHA.fino} op={0.6} />);
    } else {
      const baixa = cal.tipo === 'sapato';
      const hs = baixa ? 1.8 : 3.4;
      formas.push(pano(suave(Qs([[-6.2, 0], [6.6, 0], [7.2, hs * 0.5], [6.8, hs], [-6.4, hs], [-6.9, hs * 0.5]])), corSola, 1));
      formas.push(
        pano(
          suave(Qs(baixa ? [[-6, hs - 0.2], [-5.6, 6], [-3.2, 8.6], [0.4, 9.2], [3.8, 8.4], [5.9, 5.8], [6.4, hs - 0.2]] : [[-6, hs - 0.2], [-5.6, 7.6], [-3.4, 11.2], [0.3, 12.2], [3.8, 11], [6, 7.6], [6.4, hs - 0.2]])),
          cal.cor,
          2,
        ),
      );
      if (cal.tipo === 'tenis') {
        const lc = contraste(cal.cor);
        for (const y of [6.6, 8.4, 10.2]) det.push(<Traco key={`l${y}`} d={linha(Qs([[-1.6, y], [2, y - 0.2]]))} w={0.85} cor={lc} />);
        det.push(<Traco key="bico" d={linha(Qs([[-4.6, 4.6], [0.4, 5.4], [5, 4.6]]))} w={LINHA.fino} op={0.6} />);
      } else if (cal.tipo === 'sapato') {
        det.push(<path key="bri" d={suave(Qs([[-2.6, 5.2], [1.2, 6.4], [2.6, 5.6], [-1, 4.6]]))} fill="#FFFFFF" opacity={0.3} />);
      }
    }
    return { formas, detalhes: <g>{det}</g> };
  }
  // de lado / 3/4: quadro do pé (x pra ponta, y pra cima, pro tornozelo)
  const fd = dirDe(j.ang.pe[i]);
  const cand = perp(fd);
  const up = (cand[0] * (to[0] - sola[0]) + cand[1] * (to[1] - sola[1]) >= 0 ? cand : mul(cand, -1)) as P;
  const Q = (x: number, y: number): P => add(add(sola, mul(fd, x * sk)), mul(up, y * sk));
  const Qs = (a: [number, number][]) => a.map(([x, y]) => Q(x, y));
  if (cal.tipo === 'chinelo') {
    formas.push(pano(suave(Qs([[-8.6, 0], [22.6, 0], [23.9, 1.1], [23.1, 2.3], [-8.6, 2.3], [-9.3, 1.1]])), cal.cor, 1));
    formas.push({ d: suave(Qs([[-8, 2.1], [-8.6, 6.4], [-5.4, 10], [0.2, 10.4], [6, 8.8], [13.6, 5.8], [20.2, 4.8], [22.6, 3.6], [22, 2.1]])), cor: c.pele, sombra: c.peleSombra, k: 2 });
    det.push(<Traco key="tira" d={linha(Qs([[16.6, 5.8], [11.5, 7.2], [5.2, 8.6], [1, 9.6]]))} w={1.8} cor={cal.cor} />);
    det.push(<Traco key="ded" d={linha(Qs([[19.6, 3], [20, 4.6]]))} w={LINHA.fino} />);
    return { formas, detalhes: <g>{det}</g> };
  }
  if (cal.tipo === 'meia') {
    formas.push(pano(suave(Qs([[-8.2, 0.6], [-9.2, 4.4], [-7.6, 9.2], [-4.6, 13], [1.6, 13.2], [4.4, 11], [12, 7.2], [19.8, 4.8], [23, 3], [22.6, 0.8], [10, 0], [-4, 0]])), cal.cor, 1.8));
    det.push(<Traco key="can" d={linha(Qs([[-5, 11.2], [3.2, 11.4]]))} w={LINHA.fino} op={0.6} />);
    det.push(<Traco key="calc" d={linha(Qs([[-8.4, 4.5], [-5.6, 1.4]]))} w={LINHA.fino} op={0.35} />);
    return { formas, detalhes: <g>{det}</g> };
  }
  if (cal.tipo === 'sapato') {
    formas.push(pano(suave(Qs([[-8, 0], [22.5, 0], [24.4, 1.3], [23.6, 2.1], [-8.4, 2.1]])), corSola, 0.8));
    formas.push(pano(suave(Qs([[-8.2, 1.9], [-8.7, 7.2], [-6.8, 9.8], [-1.6, 9.7], [2.6, 9.4], [9, 7.6], [16.4, 5.3], [22, 4.1], [24.2, 2.4], [23, 1.9]])), cal.cor, 2));
    det.push(<path key="bri" d={suave(Qs([[14, 5.6], [19.5, 4.5], [20.6, 3.8], [15, 4.7]]))} fill="#FFFFFF" opacity={0.35} />);
    det.push(<Traco key="lac" d={linha(Qs([[3.6, 9.2], [7.8, 7.8]]))} w={LINHA.fino} />);
    det.push(<Traco key="salto" d={linha(Qs([[-3, 0.2], [-3, 2]]))} w={LINHA.fino} />);
    return { formas, detalhes: <g>{det}</g> };
  }
  // tênis (e bota, que sobe pela canela)
  const bota = cal.tipo === 'bota';
  formas.push(pano(suave(Qs([[-8.6, 0], [22.4, 0], [24.6, 1.5], [24.3, 3.7], [16, 3.5], [4, 3.7], [-8.2, 4.1], [-9.6, 2.1]])), corSola, 1));
  formas.push(
    pano(
      suave(
        Qs(
          bota
            ? [[-8.4, 3.9], [-8.6, 12], [-6.6, 19], [2.8, 19.4], [5.4, 13.4], [12, 8.6], [19, 6.4], [22.8, 5.2], [24, 3.7], [16, 3.4], [4, 3.6]]
            : [[-8.4, 3.9], [-8.9, 8.5], [-7.6, 11.8], [-3.5, 12.6], [0.5, 12.1], [3.2, 14.2], [5.6, 13.4], [7.2, 11], [13, 8.2], [19, 6.4], [22.8, 5.2], [24, 3.7], [16, 3.4], [4, 3.6]],
        ),
      ),
      cal.cor,
      2.2,
    ),
  );
  if (!bota) {
    // aba do calcanhar na cor da sola
    formas.push(pano(suave(Qs([[-8.9, 7], [-9.2, 11.4], [-7.4, 12.2], [-6.2, 8], [-7.6, 6.4]])), corSola, 0.8));
  }
  const lc = luma(cal.cor) > 0.62 ? (cal.sola && luma(cal.sola) < 0.62 ? cal.sola : escurece(cal.cor, 0.5)) : '#F4F5FF';
  const cad: [number, number][][] = bota
    ? [[[4.2, 15], [6.2, 16]], [[5.4, 12.4], [7.6, 13.4]], [[7.6, 10.4], [9.6, 11.6]]]
    : [[[6.6, 11.3], [8.6, 12.5]], [[8.8, 10.1], [10.6, 11.4]], [[11, 9], [12.6, 10.3]]];
  cad.forEach((s, k) => det.push(<Traco key={`c${k}`} d={linha(Qs(s))} w={1} cor={lc} />));
  det.push(<Traco key="bico" d={linha(Qs([[17.4, 3.6], [18.6, 5.2], [20.2, 6.1]]))} w={LINHA.fino} op={0.7} />);
  det.push(<Traco key="lat" d={linha(Qs([[-4.6, 5.4], [3, 7.6], [9.6, 6.4]]))} w={1.1} cor={mix(corSola, cal.cor, 0.2)} op={0.9} />);
  det.push(<Traco key="mid" d={linha(Qs([[-7.6, 2.2], [20, 1.9]]))} w={LINHA.fino * 0.7} op={0.35} />);
  return { formas, detalhes: <g>{det}</g> };
}

/**
 * A camada de uma perna. A de trás (0) leva junto a pélvis da calça (forro comum: a costura
 * pélvis↔perna some). A da frente (1) repinta a pélvis por cima do próprio forro: a linha da
 * perna some dentro do quadril e a coxa "nasce" da calça sem emenda.
 */
export function camadaPerna(c: Ctx, i: 0 | 1, key: string): React.ReactNode {
  const p = pernaPartes(c, i);
  const pel = pelvisForma(c);
  const grupos: Grupo[] = [];
  const mascara = pel && i === 1 ? c.pt.pinta(pel, 'mask') : null;
  const mascara2 = pel && i === 1 ? c.pt.pinta(pel, 'mask2') : null;
  if (p.pele.length) grupos.push({ formas: p.pele, antes: mascara });
  grupos.push({ formas: p.pe.formas, linha: LINHA.dentro, depois: p.pe.detalhes, antes: p.pele.length ? null : mascara });
  const calca = [...p.calca];
  if (pel && i === 0) calca.unshift({ ...pel, uniao: 'calca', k: p.calca[0]?.k ?? pel.k });
  if (calca.length) grupos.push({ formas: calca, linha: LINHA.dentro, meio: mascara2, depois: p.detalhes });
  else grupos.push({ formas: [], depois: p.detalhes });
  return c.pt.camada(grupos, key);
}

/** cós, braguilha, bolso, cinto (desenhados por cima das duas pernas) */
export function detalhesCintura(c: Ctx): React.ReactNode {
  const { tr, roupa } = c;
  const b = roupa.baixo;
  if (b.tipo === 'saia') return null;
  const top = TOPO_CINTURA[b.tipo];
  const e = b.tipo === 'legging' ? 0.45 : b.tipo === 'moletom' || b.tipo === 'pijama' ? 2.2 : 1.3;
  const out: React.ReactNode[] = [];
  const faixa = (v: number) => linha([tr.P(tr.xl(v, e), v), tr.P(tr.uFrente(0, v, e), v - 0.01), tr.P(tr.xr(v, e), v)]);
  if (b.tipo === 'legging') {
    out.push(<Traco key="cos" d={faixa(top - 0.07)} w={LINHA.fino} op={0.8} />);
    if (b.cor2) out.push(<Traco key="cos2" d={faixa(top - 0.035)} w={1.4} cor={b.cor2} />);
  } else if (b.tipo === 'jeans' || b.tipo === 'calca') {
    out.push(<Traco key="cos" d={faixa(top - 0.05)} w={LINHA.fino} />);
    const uf = tr.uFrente(0, top, e);
    out.push(<Traco key="brag" d={linha([tr.P(uf + 0.5, top - 0.05), tr.P(uf + 1.4, -0.06), tr.P(uf - 0.4, -0.13)])} w={LINHA.fino} op={0.85} />);
    if (b.tipo === 'jeans') {
      const ub = tr.uFrente(tr.W(0.1) * 0.62, top - 0.05, e);
      out.push(<Traco key="bol" d={linha([tr.P(ub - 1.8, top - 0.05), tr.P(ub + 1.6, 0.08), tr.P(tr.xr(0.06, e), 0.04)])} w={LINHA.fino} cor="#E8B85A" />);
    }
    if (c.roupa.contexto === 'trabalho' || (b.tipo === 'calca' && c.roupa.cima.tipo === 'camisa')) {
      // cinto com fivela dourada
      out.push(<Traco key="cin" d={faixa(top - 0.025)} w={2.6} cor={escurece('#5A3A2A', 0.15)} />);
      const fv = tr.frente(0, top - 0.025, e + 0.4);
      out.push(<rect key="fiv" x={fv[0] - 1.7} y={fv[1] - 1.6} width={3.4} height={3.2} rx={0.6} fill="none" stroke="#FFC83D" style={sw(0.9)} />);
    }
  } else {
    // elástico com cordão (moletom, pijama, short)
    out.push(<Traco key="cos" d={faixa(top - 0.06)} w={LINHA.fino} />);
    const fv = tr.frente(0.8, top - 0.06, e);
    const cord = b.cor2 ?? '#F4F5FF';
    out.push(<Traco key="cor1" d={linha([fv, add(fv, [-0.6 + c.mov.osc * 0.4, 4.2])])} w={0.8} cor={cord} />);
    out.push(<Traco key="cor2" d={linha([add(fv, [1.3, 0]), add(fv, [1.9 + c.mov.osc * 0.4, 3.6])])} w={0.8} cor={cord} />);
  }
  return <g>{out}</g>;
}

/** saia (camada própria, por cima das pernas): evasê até o joelho, acompanha as coxas */
export function camadaSaia(c: Ctx, key: string): React.ReactNode {
  const { j, tr, fis, roupa } = c;
  const b = roupa.baixo;
  if (b.tipo !== 'saia') return null;
  const top = 0.3;
  const em = (i: 0 | 1, fr: number) => lerpP(j.quadril[i], j.joelho[i], fr);
  const fr = 0.86;
  const xs = [0, 1].flatMap((i) => {
    const p = em(i as 0 | 1, fr);
    const r = lerp(fis.coxa[0], fis.coxa[1], fr) + 3.4;
    return [p[0] - r, p[0] + r];
  });
  const yb = (em(0, fr)[1] + em(1, fr)[1]) / 2 + 1.5 + Math.sin(c.t / 9) * 0.3;
  const xL = Math.min(...xs) - 1.5 + c.mov.osc * 1.2;
  const xR = Math.max(...xs) + 1.5 + c.mov.osc * 1.2;
  const pts: PQ[] = [
    [...tr.P(tr.xr(top, 1.2), top), 1] as PQ,
    tr.P(tr.xr(0.05, 2.4), 0.05),
    [xR, yb - 0.5, 1],
    [(xR + xL) / 2, yb + 1],
    [xL, yb - 0.5, 1],
    tr.P(tr.xl(0.05, 2.4), 0.05),
    [...tr.P(tr.xl(top, 1.2), top), 1] as PQ,
    tr.P(tr.uFrente(0, top, 1.2), top - 0.01),
  ];
  const d = suave(pts);
  const prega = (k: number) => linha([tr.P(lerp(tr.xl(0.12, 1.5), tr.xr(0.12, 1.5), k), 0.12), [lerp(xL, xR, k), yb]]);
  return c.pt.camada(
    [
      {
        formas: [{ d, cor: b.cor, k: 5 }],
        depois: (
          <g>
            <Traco d={prega(0.33)} w={LINHA.fino} op={0.45} />
            <Traco d={prega(0.66)} w={LINHA.fino} op={0.45} />
            <Traco d={linha([tr.P(tr.xl(top - 0.05, 1.2), top - 0.05), tr.P(tr.uFrente(0, top - 0.05, 1.2), top - 0.06), tr.P(tr.xr(top - 0.05, 1.2), top - 0.05)])} w={LINHA.fino} />
          </g>
        ),
      },
    ],
    key,
  );
}

// ------------------------------------------------------------------ tronco

/** contorno do tronco (pele ou peça de cima), de `de` (vf da barra) até os ombros */
function contornoTronco(c: Ctx, o: { e: number; eBarra?: number; de: number; alca?: boolean; reto?: boolean }): string {
  const { tr } = c;
  const e = o.e;
  const eb = o.eBarra ?? e;
  const ef = (vf: number) => lerp(eb, e, clamp((vf - o.de) / 0.45));
  const lv = [o.de, ...[-0.08, 0, 0.1, 0.2, 0.32, 0.42, 0.54, 0.66, 0.76].filter((v) => v > o.de + 0.04)];
  const dir: PQ[] = lv.map((v) => tr.P(tr.xr(v, ef(v)), v));
  const esq: PQ[] = lv.map((v) => tr.P(tr.xl(v, ef(v)), v)).reverse();
  const vC = 0.975;
  let topo: PQ[];
  if (o.alca) {
    const a = tr.nr + 4.4;
    topo = [
      tr.P(tr.xr(0.84, e), 0.84),
      tr.P(lerp(tr.xr(0.84, e), tr.nc + a * tr.w + tr.s * 3, 0.75), 0.93),
      [...tr.P(tr.nc + a * tr.w + tr.s * 2.5, 1.02), 1] as PQ,
      tr.P(tr.nc + tr.nr * 0.9, 1.06),
      tr.P(tr.nc - tr.nr * 0.9, 1.06),
      [...tr.P(tr.nc - a * tr.w - tr.s * 0.5, 1.02), 1] as PQ,
      tr.P(lerp(tr.xl(0.84, e), tr.nc - a * tr.w - tr.s, 0.75), 0.93),
      tr.P(tr.xl(0.84, e), 0.84),
    ];
    dir.splice(dir.length - 1, 1);
    esq.splice(0, 1);
  } else {
    topo = [
      tr.P(tr.cantoR(e), vC),
      tr.P(lerp(tr.cantoR(e), tr.nc + tr.nr, 0.55), 1.025),
      tr.P(tr.nc + tr.nr * 0.95, 1.06),
      tr.P(tr.nc - tr.nr * 0.95, 1.06),
      tr.P(lerp(tr.cantoL(e), tr.nc - tr.nr, 0.55), 1.025),
      tr.P(tr.cantoL(e), vC),
    ];
  }
  dir[0] = [...(dir[0] as P), 1] as PQ;
  esq[esq.length - 1] = [...(esq[esq.length - 1] as P), 1] as PQ;
  const barra = tr.P(tr.uFrente(0, o.de, eb), o.de - (o.reto ? 0 : 0.014));
  return suave([...dir, ...topo, ...esq, barra]);
}

/** decote (pele por cima da peça): `fundo` = vf do ponto mais baixo, `meia` = meia largura, V ou U */
function decote(c: Ctx, fundo: number, meia: number, v = false): { d: string; borda: string } {
  const { tr } = c;
  const l: P = tr.frente(-meia, 1.0);
  const r: P = tr.frente(meia, 1.0);
  const b: P = tr.frente(0, fundo, 0.3);
  const ml = tr.frente(-meia * 0.72, lerp(fundo, 1.0, 0.45), 0.2);
  const mr = tr.frente(meia * 0.72, lerp(fundo, 1.0, 0.45), 0.2);
  const borda: PQ[] = v ? [l, lerpP(l, b, 0.5), [...b, 1] as PQ, lerpP(r, b, 0.5), r] : [l, ml, b, mr, r];
  const cima: P[] = [tr.P(tr.nc + tr.nr * 0.8, 1.1), tr.P(tr.nc - tr.nr * 0.8, 1.1)];
  return { d: suave([...borda, ...cima]), borda: linha(borda) };
}

export function camadaTronco(c: Ctx, key: string): React.ReactNode {
  const { j, tr, fis, roupa, prop } = c;
  const cima = roupa.cima;
  const tp = cima.tipo;
  const cor = cima.cor;
  const cor2 = cima.cor2;
  const grupos: Grupo[] = [];
  // capuz atrás do pescoço (moletom)
  if (tp === 'moletom') {
    const cc = tr.P(tr.nc - tr.s * tr.nr * 0.9, 0.99);
    const rx = tr.nr * (1.25 + 0.75 * tr.w) + 2;
    const d = suave([
      [cc[0] - rx, cc[1] + 2],
      [cc[0] - rx * 0.8, cc[1] - 4.5],
      [cc[0], cc[1] - 6.6],
      [cc[0] + rx * 0.8, cc[1] - 4.5],
      [cc[0] + rx, cc[1] + 2],
      [cc[0], cc[1] + 5],
    ]);
    grupos.push({ formas: [{ d, cor: escurece(cor, 0.12), k: 2.5 }] });
  }
  // pescoço: da base (um tico pra trás) até dentro da cabeça
  const W = prop.cabecaLarg;
  const Hc = prop.cabeca;
  const a = (j.ang.cabeca * Math.PI) / 180;
  const naCab = (lx: number, ly: number): P => [j.cabeca[0] + lx * Math.cos(a) - ly * Math.sin(a), j.cabeca[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  const topoPesc = naCab(-tr.s * W * 0.12, Hc * 0.18);
  const basePesc = tr.P(tr.nc, 0.86);
  const pesc = capsula(basePesc, topoPesc, fis.pescoco * 1.08, fis.pescoco * 0.95);
  const idP = c.pt.id('pesc');
  const queixo = naCab(tr.s * W * 0.12, Hc * 0.5);
  grupos.push({
    formas: [{ d: pesc, cor: c.pele, sombra: c.peleSombra, k: 2.4 }],
    depois: (
      <g>
        <clipPath id={idP}>
          <path d={pesc} />
        </clipPath>
        <ellipse clipPath={`url(#${idP})`} cx={queixo[0] - 1} cy={queixo[1] + 1.2} rx={W * 0.42} ry={Hc * 0.11} fill={c.peleSombra} />
      </g>
    ),
  });
  const topoCintura = TOPO_CINTURA[roupa.baixo.tipo] ?? 0.2;
  // pele do tronco (aparece no top, na regata e no decote)
  grupos.push({ formas: [{ d: contornoTronco(c, { e: 0, de: topoCintura - 0.015, reto: true }), cor: c.pele, sombra: c.peleSombra, k: 5 }] });
  // a peça de cima
  const de = barraCima(c);
  const e = folgaCima(tp);
  const solta = tp === 'moletom' || tp === 'pijama' || tp === 'blazer' || tp === 'camisa';
  const corpoD = contornoTronco(c, { e, eBarra: solta ? e + 0.8 : e, de, alca: tp === 'regata' || tp === 'top' });
  const det: React.ReactNode[] = [];
  const formasCima: Forma[] = [{ d: corpoD, cor, k: 6 }];
  const L = LINHA.fino;
  const peleChapada = (d: string, k: string) => <path key={k} d={d} fill={c.pele} />;
  // estampa de bolinhas da blusa (cor2)
  if (tp === 'blusa' && cor2) {
    const pid = `${c.uid}-poa`;
    det.push(
      <g key="poa">
        <defs>
          <pattern id={pid} patternUnits="userSpaceOnUse" width={7} height={7} patternTransform={`rotate(${j.ang.tronco})`}>
            <circle cx={1.8} cy={1.8} r={0.85} fill={cor2} />
            <circle cx={5.3} cy={5.3} r={0.85} fill={cor2} />
          </pattern>
        </defs>
        <path d={corpoD} fill={`url(#${pid})`} opacity={0.9} />
      </g>,
    );
  }
  const frente0 = (vf: number, dz = 0.2) => tr.frente(0, vf, dz);
  if (tp === 'top') {
    const dc = decote(c, 0.86, tr.nr + 3.2);
    det.push(peleChapada(dc.d, 'dec'), <Traco key="db" d={dc.borda} w={L} />);
    // faixa elástica embaixo do busto
    const fx = linha([tr.P(tr.xl(0.635, e), 0.635), tr.P(tr.uFrente(0, 0.635, e), 0.625), tr.P(tr.xr(0.635, e), 0.635)]);
    det.push(<Traco key="fx" d={fx} w={2.2} cor={cor2 ?? escurece(cor, 0.25)} />);
    // umbigo
    const um = tr.frente(0, 0.33, 0);
    det.push(<Traco key="umb" d={linha([[um[0] - 0.6, um[1]], [um[0] + 0.6, um[1] + 0.3]])} w={L} op={0.6} />);
  } else if (tp === 'regata') {
    const dc = decote(c, 0.8, tr.nr + 3.4);
    det.push(peleChapada(dc.d, 'dec'), <Traco key="db" d={dc.borda} w={1.3} cor={cor2 ?? escurece(cor, 0.25)} />, <Traco key="db2" d={dc.borda} w={L} />);
  } else if (tp === 'camisa') {
    const dc = decote(c, 0.88, tr.nr + 1.2, true);
    det.push(peleChapada(dc.d, 'dec'));
    // gola de ponta, carcela com botões, bolso no peito
    const g = (s: number): P[] => [tr.frente(s * (tr.nr + 1.6), 1.035), tr.frente(s * (tr.nr + 3.6), 0.93, 0.6), tr.frente(s * 1.2, 0.875, 0.8)];
    for (const s of [-1, 1]) {
      const [p0, p1, p2] = g(s);
      det.push(<path key={`g${s}`} d={suave([[...p0, 1] as PQ, [...p1, 1] as PQ, [...p2, 1] as PQ, tr.frente(s * (tr.nr * 0.5), 0.97, 0.4)])} fill={cor} stroke={TINTA} style={sw(L)} strokeLinejoin="round" />);
    }
    det.push(<Traco key="car" d={linha([frente0(0.875), frente0(de + 0.02)])} w={L} />);
    for (const v of [0.74, 0.58, 0.42, 0.26].filter((x) => x > de + 0.05)) {
      const p = tr.frente(0.9, v, 0.4);
      det.push(<circle key={`b${v}`} cx={p[0]} cy={p[1]} r={0.75} fill={cor2 ?? contraste(cor)} />);
    }
    const bo = (lado: number, vf: number) => tr.frente(lado, vf, 0.3);
    det.push(<path key="bol" d={suave([[...bo(-tr.W(0.7) * 0.25, 0.75), 1] as PQ, [...bo(-tr.W(0.7) * 0.68, 0.75), 1] as PQ, [...bo(-tr.W(0.7) * 0.68, 0.62), 1] as PQ, [...bo(-tr.W(0.7) * 0.25, 0.62), 1] as PQ], false)} fill="none" stroke={cor2 ?? escurece(cor, 0.35)} style={sw(L)} />);
  } else if (tp === 'blazer') {
    // a camisa (cor2) no V, a gola dela, e as lapelas com o entalhe
    const sh = cor2 ?? '#F4F5FF';
    const vb = 0.5;
    const v: P[] = [tr.frente(-(tr.nr + 1.6), 1.02), tr.frente(-1.2, vb, 0.4), tr.frente(1.2, vb, 0.4), tr.frente(tr.nr + 1.6, 1.02)];
    det.push(<path key="cam" d={suave([...v.map((p) => [...p, 1] as PQ), tr.P(tr.nc, 1.08)])} fill={sh} stroke={TINTA} style={sw(L)} strokeLinejoin="round" />);
    const dc = decote(c, 0.93, tr.nr + 0.8, true);
    det.push(peleChapada(dc.d, 'dec'), <Traco key="db" d={dc.borda} w={L} />);
    for (const s of [-1, 1]) {
      const p0 = tr.frente(s * (tr.nr + 1.4), 1.035);
      const ent = tr.frente(s * (tr.nr + 5.6), 0.86, 1);
      const ent2 = tr.frente(s * (tr.nr + 3.4), 0.82, 1);
      const pt = tr.frente(s * (tr.nr + 7.4), 0.79, 1.2);
      const fim = tr.frente(s * 0.9, vb - 0.02, 0.6);
      const lap: PQ[] = [[...p0, 1], [...ent, 1], [...ent2, 1], [...pt, 1], fim, [...tr.frente(s * 2.2, vb + 0.12, 0.6), 1] as PQ, tr.frente(s * (tr.nr + 0.2), 0.94, 0.5)] as PQ[];
      det.push(<path key={`lap${s}`} d={suave(lap)} fill={sombraDe(cor, 0.12)} stroke={TINTA} style={sw(LINHA.dentro)} strokeLinejoin="round" />);
    }
    // fechamento e botões
    det.push(<Traco key="fec" d={linha([tr.frente(0, vb - 0.02, 0.6), tr.frente(0.6, de + 0.06, 0.6), tr.frente(2.4, de + 0.01, 0.6)])} w={L} />);
    for (const vv of [vb - 0.07, vb - 0.27]) {
      const p = tr.frente(1.2, vv, 0.8);
      det.push(<circle key={`bt${vv}`} cx={p[0]} cy={p[1]} r={0.95} fill={escurece(cor, 0.35)} />);
    }
    for (const s of [-1, 1]) {
      const p = tr.frente(s * tr.W(0.05) * 0.62, 0.06, 1);
      det.push(<Traco key={`bol${s}`} d={linha([add(p, [-3.2, 0]), add(p, [3.2, 0.2])])} w={LINHA.dentro} />);
    }
  } else if (tp === 'pijama') {
    const dc = decote(c, 0.86, tr.nr + 1.6, true);
    det.push(peleChapada(dc.d, 'dec'));
    const vies = cor2 ?? '#F4F5FF';
    for (const s of [-1, 1]) {
      const g: PQ[] = [[...tr.frente(s * (tr.nr + 1.4), 1.03), 1] as PQ, [...tr.frente(s * (tr.nr + 4.4), 0.9, 0.8), 1] as PQ, [...tr.frente(s * 1.4, 0.83, 0.8), 1] as PQ, tr.frente(s * tr.nr * 0.5, 0.96, 0.4)];
      det.push(<path key={`g${s}`} d={suave(g)} fill={cor} stroke={vies} style={sw(1.1)} strokeLinejoin="round" />);
      det.push(<path key={`gl${s}`} d={suave(g)} fill="none" stroke={TINTA} style={sw(0.45)} strokeLinejoin="round" />);
    }
    det.push(<Traco key="car" d={linha([frente0(0.83), frente0(de + 0.01)])} w={1.1} cor={vies} />);
    for (const v of [0.72, 0.52, 0.32, 0.12]) {
      const p = tr.frente(1.4, v, 0.4);
      det.push(<circle key={`b${v}`} cx={p[0]} cy={p[1]} r={0.8} fill={vies} />);
    }
    const bo = (lado: number, vf: number) => tr.frente(lado, vf, 0.3);
    det.push(<Traco key="bol" d={linha([bo(-tr.W(0.7) * 0.22, 0.72), bo(-tr.W(0.7) * 0.66, 0.72)])} w={1.1} cor={vies} />);
    det.push(<Traco key="barra" d={linha([tr.P(tr.xl(de + 0.012, e + 0.8), de + 0.012), frente0(de), tr.P(tr.xr(de + 0.012, e + 0.8), de + 0.012)])} w={1.1} cor={vies} />);
  } else if (tp === 'blusa') {
    const dc = decote(c, 0.85, tr.nr + 2.4, true);
    det.push(peleChapada(dc.d, 'dec'), <Traco key="db" d={dc.borda} w={1.3} cor={cor2 ?? escurece(cor, 0.3)} />, <Traco key="db2" d={dc.borda} w={L} />);
  } else {
    // gola careca (camiseta, manga longa, moletom)
    const dc = decote(c, 0.945, tr.nr + 1.1);
    det.push(peleChapada(dc.d, 'dec'));
    det.push(<Traco key="rib" d={dc.borda} w={1.5} cor={cor2 && tp !== 'manga-longa' ? cor2 : escurece(cor, 0.18)} />, <Traco key="rib2" d={dc.borda} w={L} />);
    if (tp === 'moletom') {
      // cordões do capuz (balançam), bolso canguru, barra canelada
      const cord = cor2 ?? '#F4F5FF';
      const ba = c.mov.osc * 1.6 + Math.sin(c.t / 11) * 0.3;
      for (const s of [-1, 1]) {
        const p0 = tr.frente(s * 2.2, 0.96, 0.4);
        const p1: P = add(p0, [ba + s * 0.3 + c.mov.balanco * 0.04, 8.6]);
        det.push(<Traco key={`cd${s}`} d={linha([p0, lerpP(p0, p1, 0.5), p1])} w={0.95} cor={cord} />, <rect key={`ag${s}`} x={p1[0] - 0.55} y={p1[1]} width={1.1} height={1.8} fill={escurece(cord, 0.3)} />);
      }
      const bk: PQ[] = [
        [...tr.frente(-tr.W(0.3) * 0.62, 0.36, 0.6), 1] as PQ,
        [...tr.frente(tr.W(0.3) * 0.62, 0.36, 0.6), 1] as PQ,
        [...tr.frente(tr.W(0.1) * 0.78, 0.04, 0.6), 1] as PQ,
        [...tr.frente(-tr.W(0.1) * 0.78, 0.04, 0.6), 1] as PQ,
      ];
      det.push(<path key="bk" d={suave(bk)} fill={escurece(cor, 0.06)} stroke={TINTA} style={sw(L)} strokeLinejoin="round" />);
      det.push(<Traco key="bar" d={linha([tr.P(tr.xl(de + 0.05, e + 0.8), de + 0.05), tr.frente(0, de + 0.04, e), tr.P(tr.xr(de + 0.05, e + 0.8), de + 0.05)])} w={L} />);
    }
  }
  // dobras: embaixo do braço, e a barriga empurrando a camiseta
  if (tp !== 'top' && tp !== 'regata') {
    det.push(<Traco key="ax" d={linha([tr.P(tr.xr(0.8, e) - 1.2, 0.8), tr.P(tr.xr(0.72, e) - 3.6, 0.7)])} w={L} op={0.55} />);
    if (fis.barriga > 0.3 && tp !== 'blazer') det.push(<Traco key="bar" d={linha([tr.frente(-tr.W(0.3) * 0.55, 0.28, e), tr.frente(-tr.W(0.3) * 0.1, 0.24, e), tr.frente(tr.W(0.3) * 0.3, 0.27, e)])} w={L} op={0.5} />);
  }
  grupos.push({ formas: formasCima, linha: LINHA.dentro, depois: <g>{det}</g> });
  // extras do tronco: avental, crachá
  const ex = roupa.extras ?? [];
  if (ex.includes('avental')) {
    const ac = '#F4F5FF';
    const pts: PQ[] = [
      [...tr.frente(-tr.nr - 0.4, 0.8, e + 0.5), 1] as PQ,
      [...tr.frente(tr.nr + 0.4, 0.8, e + 0.5), 1] as PQ,
      tr.frente(tr.W(0.42) * 0.72, 0.5, e + 0.8),
      tr.frente(tr.W(0.2) * 0.82, 0.25, e + 1),
      [...tr.P(tr.uFrente(tr.W(0) * 0.75, 0, e) + 3, -0.6), 1] as PQ,
      [...tr.P(tr.uFrente(-tr.W(0) * 0.75, 0, e) - 2, -0.6), 1] as PQ,
      tr.frente(-tr.W(0.2) * 0.82, 0.25, e + 1),
      tr.frente(-tr.W(0.42) * 0.72, 0.5, e + 0.8),
    ];
    const bolso: PQ[] = [[...tr.frente(-5, 0.16, e + 1.2), 1] as PQ, [...tr.frente(5, 0.16, e + 1.2), 1] as PQ, [...tr.frente(5, 0.02, e + 1.2), 1] as PQ, [...tr.frente(-5, 0.02, e + 1.2), 1] as PQ];
    grupos.push({
      formas: [{ d: suave(pts), cor: ac, k: 4 }],
      linha: LINHA.dentro,
      depois: (
        <g>
          <path d={suave(bolso)} fill="none" stroke={c.pessoa.cor} style={sw(1)} />
          <Traco d={linha([tr.frente(-tr.W(0.42) * 0.72, 0.48, e + 0.8), tr.P(tr.xl(0.46, e) - 1.5, 0.43)])} w={1.2} cor={ac} />
          <Traco d={linha([tr.frente(-tr.nr, 0.82, e + 0.5), tr.P(tr.nc - tr.nr * 0.7, 1.06)])} w={1.2} cor={ac} />
          <Traco d={linha([tr.frente(tr.nr, 0.82, e + 0.5), tr.P(tr.nc + tr.nr * 0.7, 1.06)])} w={1.2} cor={ac} />
          <Traco d={linha([tr.frente(-tr.W(0.42) * 0.7, 0.5, e + 0.9), tr.frente(tr.W(0.42) * 0.7, 0.5, e + 0.9)])} w={LINHA.fino} op={0.4} />
        </g>
      ),
    });
  }
  if (ex.includes('cracha')) {
    const card = tr.frente(-tr.W(0.6) * 0.42, 0.56, e + 0.6);
    const ang = j.ang.tronco;
    const cw = 6.4;
    const ch = 8.6;
    det.push(
      <g key="cracha">
        <Traco d={linha([tr.P(tr.nc - tr.nr * 0.8, 1.04), lerpP(tr.P(tr.nc - tr.nr * 0.8, 1.04), card, 0.5), add(card, [0, -ch / 2])])} w={0.9} cor={c.pessoa.cor} />
        <Traco d={linha([tr.P(tr.nc + tr.nr * 0.8, 1.04), tr.frente(0, 0.8, e), add(card, [0.6, -ch / 2])])} w={0.9} cor={c.pessoa.cor} />
        <g transform={`rotate(${ang} ${card[0]} ${card[1]})`}>
          <rect x={card[0] - cw / 2} y={card[1] - ch / 2} width={cw} height={ch} rx={1} fill="#F4F5FF" stroke={TINTA} style={sw(LINHA.fino)} />
          <rect x={card[0] - cw / 2} y={card[1] - ch / 2} width={cw} height={2.2} rx={0.6} fill={c.pessoa.cor} />
          <rect x={card[0] - 1.6} y={card[1] - 0.6} width={3.2} height={3.2} rx={0.5} fill={mix(c.pessoa.cor, '#FFFFFF', 0.55)} />
        </g>
      </g>,
    );
  }
  return c.pt.camada(grupos, key);
}

// ------------------------------------------------------------------ braços

/**
 * Um braço. Com `encurta` < 0,8 (o braço aponta pra câmera, ex.: mão no rosto de frente) vira
 * ESCORÇO de animação: o braço fica um tico mais grosso (vem pra perto), o antebraço é desenhado
 * POR CIMA do começo dele com linha própria e a dobra do cotovelo leva o traço.
 */
export function camadaBraco(c: Ctx, i: 0 | 1, key: string): React.ReactNode {
  const { j, fis, roupa } = c;
  const o = j.ombro[i];
  const co = j.cotovelo[i];
  const pu = j.punho[i];
  const enc = j.encurta?.[i] ?? 1;
  const escorco = enc < 0.8;
  const kE = 1 + 0.2 * (1 - enc);
  const r: [number, number, number] = [fis.braco[0] * kE, fis.braco[1] * kE, fis.braco[2]];
  const peleF = (d: string): Forma => ({ d, cor: c.pele, sombra: c.peleSombra, k: 2.6, uniao: 'pele' });
  const peleBraco = peleF(capsula(o, co, r[0], r[1], { bn: [0.6, 0.1], bm: [1.0, 0.3] }));
  const peleAnte = peleF(capsula(co, pu, r[1], r[2], { bn: [0.9, 0.2], bm: [0.6, 0.1] }));
  // a garrafinha vai na mão livre que APARECE: a da frente (1) se estiver solta, senão a de trás
  const ex = roupa.extras ?? [];
  const livre = (k: 0 | 1) => (j.mao[k] === 'solta' || j.mao[k] === 'fechada') && !(k === 1 && c.segura);
  const maoGarrafa = ex.includes('garrafa') ? (livre(1) ? 1 : livre(0) ? 0 : -1) : -1;
  const comGarrafa = i === maoGarrafa;
  const maoPose = comGarrafa ? 'segura' : j.mao[i];
  const mao = maoDe(c, i, maoPose);
  const grupos: Grupo[] = [];
  // o objeto vai ANTES da mão: os dedos fecham por cima dele
  if (maoPose === 'segura') {
    if (comGarrafa) grupos.push(garrafa(c, i));
    else if (c.segura === 'halter' && i === 1) grupos.push(halter(c, i));
    else if (c.segura === 'copo' && i === 1) grupos.push(copo(c, i));
  }
  const palma = mao.formas.map((f) => ({ ...f, uniao: 'pele' }));
  const gruposMao = (): Grupo[] => {
    if (!mao.frente?.length) return [];
    // polegar/indicador: linha fina própria, mas a base some dentro da palma (máscara)
    const masc = (
      <g>
        {c.pt.pintaUniao(palma, 'mm')}
        {mao.detalhesPalma}
      </g>
    );
    return [{ formas: mao.frente, linha: LINHA.fino, meio: masc, depois: mao.detalhes }];
  };
  // manga: pedaço de cima (ombro → cotovelo) e de baixo (cotovelo → punho)
  const m = mangaDe(c);
  const cor = roupa.cima.cor;
  const cor2 = roupa.cima.cor2;
  const dob = j.ang.antebraco[i] - j.ang.braco[i];
  const det: React.ReactNode[] = [];
  const mc: Forma[] = [];
  const mb: Forma[] = [];
  const du = norm(sub(co, o));
  const df = norm(sub(pu, co));
  const pano = (d: string, k = 2.8, cc = cor): Forma => ({ d, cor: cc, k, uniao: 'manga' });
  if (m.ate === 'curta') {
    const fim = lerpP(o, co, escorco ? 0.62 : 0.5);
    const rr = lerp(r[0], r[1], 0.5) + m.folga + 0.5;
    mc.push(pano(capsula(o, fim, r[0] + m.folga, rr, { fimB: 'reto' })));
    if (cor2) {
      const n = perp(du);
      const p = add(fim, mul(du, -1));
      det.push(<Traco key="bm" d={linha([add(p, mul(n, rr)), add(p, mul(n, -rr))])} w={1.8} cor={cor2} />);
    }
  } else if (m.ate === 'cotovelo') {
    mc.push(pano(capsula(o, co, r[0] + m.folga, r[1] + m.folga + 0.8)));
    const fim = lerpP(co, pu, 0.22);
    mb.push(pano(capsula(co, fim, r[1] + m.folga + 0.8, lerp(r[1], r[2], 0.22) + m.folga + 1.4, { fimB: 'reto' })));
  } else if (m.ate === 'dobrada') {
    // manga arregaçada: até o meio do antebraço, com a dobra mais clara
    mc.push(pano(capsula(o, co, r[0] + m.folga, r[1] + m.folga + 0.4)));
    const fim = lerpP(co, pu, 0.36);
    mb.push(pano(capsula(co, fim, r[1] + m.folga + 0.4, lerp(r[1], r[2], 0.36) + m.folga + 0.9, { fimB: 'reto' })));
    const ini = lerpP(co, pu, 0.16);
    mb.push(pano(capsula(ini, fim, lerp(r[1], r[2], 0.16) + m.folga + 1.1, lerp(r[1], r[2], 0.36) + m.folga + 1.1, { fimA: 'reto', fimB: 'reto' }), 1.2, clareia(cor, 0.12)));
  } else if (m.ate === 'longa') {
    mc.push(pano(capsula(o, co, r[0] + m.folga, r[1] + m.folga + 0.3)));
    const fimP = add(pu, mul(df, m.punho === 'canelado' ? 0.6 : 1.2));
    mb.push(pano(capsula(co, fimP, r[1] + m.folga + 0.3, r[2] + m.folga * 0.75, { fimB: 'reto' })));
    const n = perp(df);
    const rr = r[2] + m.folga * 0.75;
    if (m.punho === 'canelado') {
      const p0 = add(fimP, mul(df, -2.6));
      mb.push(pano(capsula(p0, fimP, rr, rr - 0.3, { fimA: 'reto', fimB: 'reto' }), 1, escurece(cor, 0.1)));
    } else if (m.punho === 'camisa' || m.punho === 'blazer') {
      const p0 = add(fimP, mul(df, -2.4));
      det.push(<Traco key="pc" d={linha([add(p0, mul(n, rr)), add(p0, mul(n, -rr))])} w={LINHA.fino} />);
      if (m.punho === 'blazer') {
        // o punho da camisa (cor2) aparecendo
        const sh = cor2 ?? '#F4F5FF';
        mb.push(pano(capsula(add(fimP, mul(df, -0.6)), add(fimP, mul(df, 0.9)), r[2] + 1.2, r[2] + 1.0, { fimA: 'reto', fimB: 'reto' }), 0.6, sh));
      }
    } else if (m.punho === 'viés') {
      const p0 = add(fimP, mul(df, -1.1));
      det.push(<Traco key="vi" d={linha([add(p0, mul(n, rr)), add(p0, mul(n, -rr))])} w={1.2} cor={cor2 ?? '#F4F5FF'} />);
    }
    if (roupa.cima.tipo === 'manga-longa' && cor2) {
      // listra esportiva ao longo da manga
      const nU = perp(du);
      det.push(<Traco key="lst" d={linha([add(o, mul(nU, -(r[0] + m.folga) * 0.35)), add(co, mul(perp(du), -(r[1] + m.folga) * 0.4)), add(fimP, mul(n, -rr * 0.4))])} w={1.4} cor={cor2} />);
    }
  }
  // dobra do cotovelo (pano junta na parte de dentro)
  const vestido = m.ate === 'longa' || m.ate === 'cotovelo' || m.ate === 'dobrada';
  if (Math.abs(dob) > 30) {
    const bis = norm(add(mul(du, -1), df));
    const rr = r[1] + (vestido ? m.folga : 0);
    const p = add(co, mul(bis, rr * 0.75));
    const tg = perp(bis);
    det.push(<Traco key="cot" d={linha([add(p, mul(tg, -rr * 0.4)), add(p, mul(bis, rr * 0.2)), add(p, mul(tg, rr * 0.4))])} w={LINHA.fino} op={0.75} />);
    if (m.ate === 'longa' && !escorco) det.push(<Traco key="cot2" d={linha([add(add(co, mul(du, -4)), mul(perp(du), (rr + 0.4) * Math.sign(-dob))), add(add(co, mul(du, -1.5)), mul(perp(du), rr * 0.4 * Math.sign(-dob)))])} w={LINHA.fino} op={0.55} />);
  }
  if (!escorco) {
    grupos.push({ formas: [peleBraco, peleAnte, ...palma], depois: mao.detalhesPalma ?? (mao.frente?.length ? null : mao.detalhes) });
    grupos.push(...gruposMao());
    if (!mao.frente?.length && mao.detalhesPalma) grupos.push({ formas: [], depois: mao.detalhes });
    const manga = [...mc, ...mb];
    if (manga.length) grupos.push({ formas: manga, linha: LINHA.dentro, depois: <g>{det}</g> });
    else if (det.length) grupos.push({ formas: [], depois: <g>{det}</g> });
  } else {
    // ESCORÇO: braço (e a manga dele) atrás; antebraço + mão por cima, com linha própria
    grupos.push({ formas: [peleBraco] });
    if (mc.length) grupos.push({ formas: mc, linha: LINHA.dentro });
    grupos.push({ formas: [peleAnte, ...palma], linha: LINHA.dentro * 1.1, depois: mao.detalhesPalma ?? (mao.frente?.length ? null : mao.detalhes) });
    grupos.push(...gruposMao());
    if (mb.length) grupos.push({ formas: mb, linha: LINHA.dentro });
    // o cotovelo que vem pra câmera: um arco de dobra na ponta e um brilho
    const pc = add(co, mul(norm(sub(o, co)), r[1] * 0.2));
    const tg = perp(df);
    det.push(<Traco key="esc" d={linha([add(pc, mul(tg, r[1] * 0.75)), add(pc, mul(df, -r[1] * 0.55)), add(pc, mul(tg, -r[1] * 0.75))])} w={LINHA.fino} op={0.7 * (1 - enc) / 0.45} />);
    grupos.push({ formas: [], depois: <g>{det}</g> });
  }
  // relógio no braço da frente
  if (i === 1 && ex.includes('relogio') && !(m.ate === 'longa')) {
    const a0 = add(pu, mul(df, -3.6));
    const a1 = add(pu, mul(df, -1.2));
    const pulseira = capsula(a0, a1, r[2] + 0.7, r[2] + 0.6, { fimA: 'reto', fimB: 'reto' });
    const esporte = roupa.contexto === 'esporte';
    const mid = lerpP(a0, a1, 0.5);
    const n = perp(df);
    const face = add(mid, mul(n, -(r[2] + 0.2) * (c.j.vista === 'frente' ? 0 : 0.6)));
    grupos.push({
      formas: [{ d: pulseira, cor: esporte ? c.pessoa.cor : '#3A2A22', k: 0.8 }],
      linha: LINHA.fino,
      depois: (
        <g>
          <circle cx={face[0]} cy={face[1]} r={2.1} fill={esporte ? '#1C2350' : '#F4F5FF'} stroke="#FFC83D" style={sw(0.7)} />
          {esporte && <circle cx={face[0]} cy={face[1]} r={1} fill={c.pessoa.cor} opacity={0.9} />}
        </g>
      ),
    });
  }
  return c.pt.camada(grupos, key);
}

export { dist };
