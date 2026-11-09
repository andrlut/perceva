// "Animação de série" — a cabeça: rosto (que CEDE ao dedo), olhos com íris e brilho, pálpebra
// que muda com o humor, sobrancelha desenhada, nariz, boca por humor, orelhas, barba, óculos,
// brinco, boné, faixa, fone — e o cabelo (cabelos.tsx).
//
// Tudo no quadro local da cabeça (base W 48 × H 58), num <g> com translate/rotate/scale. As
// âncoras do contrato (j.boca, j.bochecha, j.olhos) são ROSTO[vista] × (W, H) — a boca é
// desenhada exatamente ali e o contorno da bochecha da frente passa por ali de 3/4.
import React from 'react';
import { ROSTO } from '../../esqueleto';
import {
  type Forma,
  type Grupo,
  type P,
  type PQ,
  LINHA,
  TINTA,
  Traco,
  add,
  amostra,
  clamp,
  dist,
  escurece,
  gira,
  linha,
  mix,
  mul,
  norm,
  perp,
  sub,
  suave,
} from './base';
import { type CabeloDesenho, type VistaCab, cabeloDe } from './cabelos';
import type { Ctx } from './ctx';
import { dedoToque } from './maos';

const BW = 48;
const BH = 58;

export function quadroCabeca(c: Ctx) {
  const { j, prop } = c;
  const sx = prop.cabecaLarg / BW;
  const sy = prop.cabeca / BH;
  const a = j.ang.cabeca;
  const transform = `translate(${j.cabeca[0].toFixed(2)} ${j.cabeca[1].toFixed(2)}) rotate(${a.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})`;
  /** mundo → local */
  const paraLocal = (p: P): P => {
    const d = gira(sub(p, j.cabeca), -a);
    return [d[0] / sx, d[1] / sy];
  };
  const dirLocal = (v: P): P => norm(gira(v, -a));
  const vista: VistaCab = j.vista === 'frente' ? 'frente' : j.vista === 'tres-quartos' ? 'tq' : 'perfil';
  const L = dirLocal(c.pt.L);
  return { transform, paraLocal, dirLocal, vista, L, a };
}

/** contorno do rosto (local) */
function contorno(v: VistaCab, f: boolean, largo: boolean): P[] {
  if (v === 'tq' && largo) {
    return [
      [-1, -29.2], [10, -27.6], [17.6, -22.6], [21.4, -14.6], [21.9, -6.6], [21.3, -1.6], [21.6, 3.2], [21.2, 8.4], [20.4, 13.4],
      [19.2, 18.6], [16.4, 24.2], [11.4, 28.4], [4.4, 30.2], [-3, 29], [-10.4, 25], [-14.6, 20], [-17.8, 15.4],
      [-22.8, 9.2], [-25, 0.4], [-24.4, -9.4], [-21.4, -18], [-13.2, -25.8],
    ];
  }
  if (v === 'frente') {
    const jaw: P[] = f
      ? [[20.6, 14], [16.6, 20], [10.8, 25.4], [4.8, 28.6]]
      : largo
        ? [[22.4, 14], [20, 20.4], [13.6, 26.2], [6, 29]]
        : [[21.4, 14], [18.4, 20.4], [12.6, 26], [5.8, 28.9]];
    const half: P[] = [[10, -28], [17.6, -24], [22, -16.5], [23.7, -7.5], [23.8, 0.5], [23.1, 7.5], ...jaw];
    return [[0, -29.2], ...half, [0, 29.4], ...half.map(([x, y]) => [-x, y] as P).reverse()];
  }
  if (v === 'tq') {
    return [
      [-1, -29.2], [10, -27.6], [17.6, -22.6], [21.4, -14.6], [21.9, -6.6], [21.3, -1.6], [21.4, 3.2], [20.4, 8.4], [19.0, 13.4],
      [17.2, 18.4], [14.2, 23.6], [9.8, 27.6], [4.2, 29.3], [-2, 28.2], [-9.4, 24.2], [-13.6, 19.6], [-17.4, 15.4],
      [-22.6, 9.2], [-25, 0.4], [-24.4, -9.4], [-21.4, -18], [-13.2, -25.8],
    ];
  }
  return [
    [-2, -29.2], [9, -27.6], [16.6, -22.6], [20.6, -14.6], [21.8, -7.2], [20.8, -3.2], [22.0, 0.6], [25.4, 6.2], [26.4, 8.2],
    [25.0, 9.8], [22.0, 10.4], [22.2, 12.4], [22.8, 14.0], [21.6, 15.6], [22.2, 17.2], [20.6, 19.4], [21.4, 23.0], [19.6, 27.0],
    [14, 28.8], [6, 27.2], [-4.4, 21.6], [-10, 17.6], [-17, 15.2], [-22.8, 8], [-25.2, -2.4], [-23.6, -14.6], [-16, -24.8],
  ];
}

/** a pele cede ao dedo: o contorno empurrado na direção do dedo, com a bochecha estufando em volta */
function amassa(pts: P[], ponta: P, dirIn: P, forca: number): { pts: P[]; contato: P | null; fundo: number } {
  let dir = dirIn;
  // ponto do contorno mais perto da ponta do dedo
  let bi = 0;
  let bd = 1e9;
  pts.forEach((p, i) => {
    const d = dist(p, ponta);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  // o dedo está DENTRO do rosto (passou do contorno)? quanto
  const p0 = pts[bi];
  const n = pts.length;
  const tg0 = norm(sub(pts[(bi + 1) % n], pts[(bi - 1 + n) % n]));
  const dentro: P = [-tg0[1], tg0[0]];
  // a pele afunda pra DENTRO do rosto (normal), puxada um pouco pela direção do dedo
  const dd = norm(add(mul(dentro, 0.7), mul(dir, 0.3)));
  const pen = (ponta[0] - p0[0]) * dd[0] + (ponta[1] - p0[1]) * dd[1];
  if (bd > 4.5 || pen <= -0.8) return { pts, contato: bd < 6 ? p0 : null, fundo: 0 };
  // o afundado acompanha o dedo até ~2,8 (além disso o dedo, por cima, cobre)
  const fundo = Math.min(2.8, Math.max(0, pen) + 0.5) * (0.6 + 0.4 * forca);
  const R = 2.9;
  dir = dd;
  const out = pts.map((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];
    const tg = norm(sub(next, prev));
    const nOut: P = [tg[1], -tg[0]];
    const d = dist(p, p0);
    const g = Math.exp(-((d / R) ** 2));
    const bojo = Math.exp(-(((d - R * 1.7) / (R * 0.55)) ** 2)) * fundo * 0.3;
    return add(add(p, mul(dir, fundo * g)), mul(nOut, bojo));
  });
  return { pts: out, contato: p0, fundo };
}

const IRIS: Record<string, string> = {
  marina: '#7A5230',
  caio: '#3E2A1E',
  bia: '#3A2418',
  theo: '#6B4226',
  lucia: '#5A3A22',
  rafa: '#4F7AA6',
  celia: '#4A3020',
  antonio: '#5E7A44',
};

type Olho = { cx: number; cy: number; w: number; h: number; esq: boolean; abre: number; baixo: number; iris: P; far?: boolean };

function olho(c: Ctx, o: Olho, key: string, humor: string, cil: boolean): React.ReactNode {
  const { cx, cy, w, h, abre, baixo } = o;
  const s = o.esq ? -1 : 1; // canto de fora pro lado de fora
  const inn: P = [cx - (s * w) / 2, cy + 0.4];
  const out: P = [cx + (s * w) / 2, cy - 0.3];
  const topo = cy - (h / 2) * abre;
  const fundo = cy + (h / 2) * (1 - baixo);
  const corIris = IRIS[c.pessoa.id] ?? '#5A3A22';
  if (abre < 0.14) {
    // fechado: uma curva (feliz = arco pra cima, o resto = pálpebra pra baixo)
    const feliz = humor === 'feliz';
    const d = linha([inn, [cx, cy + (feliz ? -1.6 : 1.4)], out]);
    return (
      <g key={key}>
        <Traco d={d} w={1.25} />
        {cil && <Traco d={linha([out, [out[0] + s * 1.4, out[1] - 0.6]])} w={0.9} />}
      </g>
    );
  }
  const sup: P[] = [inn, [cx - (s * w) / 4, topo + (h / 2) * abre * 0.12], [cx + (s * w) * 0.12, topo], out];
  const inf: P[] = [out, [cx + (s * w) / 5, fundo - baixo * 1.2], [cx - (s * w) / 4, fundo - baixo * 0.4]];
  const branco = suave([...sup, ...inf.slice(1)] as PQ[]);
  const id = c.pt.id('olho');
  const ri = Math.min(h * 0.36, w * 0.34) * (humor === 'surpresa' ? 0.86 : 1);
  const ic = add([cx, cy], o.iris);
  return (
    <g key={key}>
      <clipPath id={id}>
        <path d={branco} />
      </clipPath>
      <path d={branco} fill="#FBFAFF" />
      <g clipPath={`url(#${id})`}>
        <ellipse cx={ic[0]} cy={ic[1]} rx={ri * (o.far ? 0.8 : 1)} ry={ri} fill={corIris} />
        <ellipse cx={ic[0]} cy={ic[1]} rx={ri * 0.62 * (o.far ? 0.8 : 1)} ry={ri * 0.62} fill={mix(corIris, '#FFFFFF', 0.18)} opacity={0.5} />
        <ellipse cx={ic[0]} cy={ic[1]} rx={ri * 0.5 * (o.far ? 0.8 : 1)} ry={ri * 0.5} fill="#120E22" />
        <circle cx={ic[0] + ri * 0.38} cy={ic[1] - ri * 0.42} r={ri * 0.3} fill="#FFFFFF" />
        <circle cx={ic[0] - ri * 0.35} cy={ic[1] + ri * 0.35} r={ri * 0.13} fill="#FFFFFF" opacity={0.8} />
        {/* sombra da pálpebra de cima no branco */}
        <path d={linha(sup)} stroke="#C4BFE2" strokeWidth={1.1} fill="none" opacity={0.4} transform="translate(0 0.75)" />
      </g>
      {/* linha da pálpebra de cima (grossa) + cílio no canto de fora */}
      <Traco d={linha(sup)} w={1.35} />
      {cil && <Traco d={linha([out, [out[0] + s * 1.6, out[1] - 0.9]])} w={0.95} />}
      <Traco d={linha(inf)} w={0.6} op={0.55} />
      {/* dobra da pálpebra */}
      {!o.far && <Traco d={linha([[cx - (s * w) * 0.3, topo - 1.5], [cx + (s * w) * 0.05, topo - 2.1], [cx + (s * w) * 0.42, topo - 1.4]])} w={0.55} op={0.45} />}
    </g>
  );
}

/** sobrancelha: forma afinada (grossa no meio, fina na ponta), altura/inclinação pelo humor */
function sobrancelha(ini: P, fim: P, arco: number, grossura: number, cor: string, key: string): React.ReactNode {
  const m = mul(add(ini, fim), 0.5);
  const n = perp(norm(sub(fim, ini)));
  const up: P = n[1] < 0 ? n : mul(n, -1);
  const pico = add(add(m, mul(sub(fim, ini), 0.12)), mul(up, arco));
  const a = add(ini, mul(up, grossura * 0.5));
  const b = add(pico, mul(up, grossura * 0.55));
  const cc = add(pico, mul(up, -grossura * 0.5));
  const d = add(ini, mul(up, -grossura * 0.5));
  return <path key={key} d={suave([a, b, [...fim, 1] as PQ, cc, d] as PQ[])} fill={cor} />;
}

export function camadaCabeloAtras(c: Ctx, cab: CabeloDesenho, key: string): React.ReactNode {
  if (!cab.atras.length) return null;
  const q = quadroCabeca(c);
  c.pt.tf = q.transform;
  const camada = c.pt.camada([{ formas: cab.atras, depois: cab.detalhesAtras }], 'ca', q.L, LINHA.fora * 0.95);
  c.pt.tf = undefined;
  return (
    <g key={key} transform={q.transform}>
      {camada}
    </g>
  );
}

export function cabeloPronto(c: Ctx): CabeloDesenho {
  const q = quadroCabeca(c);
  // balanço no quadro local: pendurado no mundo, a cabeça girada
  const balLocal = c.mov.balanco - c.j.ang.cabeca * 0.6;
  return cabeloDe({ tipo: c.pessoa.cabelo, cor: c.pessoa.corCabelo, vista: q.vista, balanco: balLocal, corrida: c.mov.corrida, t: c.t, seed: c.seed, f: c.pessoa.genero === 'f' });
}

export function camadaCabeca(c: Ctx, cab: CabeloDesenho, key: string): React.ReactNode {
  const { pessoa, humor, j, roupa } = c;
  const q = quadroCabeca(c);
  const v = q.vista;
  const f = pessoa.genero === 'f';
  const idoso = pessoa.idade === 'idoso';
  const R = ROSTO[j.vista];
  const boca: P = [R.boca[0] * BW, R.boca[1] * BH];
  const olhos: P = [R.olhos[0] * BW, R.olhos[1] * BH];
  const pele = c.pele;
  const ps = c.peleSombra;

  // ---- contorno (com o dedo, a pele cede)
  let pts = amostra(contorno(v, f, pessoa.corpo === 'largo'), 5);
  let contato: P | null = null;
  let fundo = 0;
  let pontaL: P | null = null;
  let dirL: P = [1, 0];
  if (c.toque && j.mao[1] === 'aponta') {
    // a ponta do indicador desenhado e a direção em que ele entra (ver maos.tsx → dedoToque)
    const dd = dedoToque(c, 1);
    pontaL = q.paraLocal(dd.T);
    dirL = q.dirLocal(dd.fd);
    const am = amassa(pts, pontaL, dirL, 1);
    pts = am.pts;
    contato = am.contato;
    fundo = am.fundo;
  }
  const rostoD = suave(pts);
  const formasRosto: Forma[] = [{ d: rostoD, cor: pele, sombra: ps, k: 5.2 }];

  // ---- orelhas
  const orelhaD = (s: number): string =>
    v === 'frente'
      ? suave(([[22.4, -3.4], [25.6, -4.6], [27.4, -1], [26.8, 4.4], [24.8, 8.8], [22.2, 9.6]] as P[]).map(([x, y]) => [x * s, y] as P))
      : v === 'tq'
        ? suave([[-7.2, -4], [-10.4, -5.6], [-13.6, -3.6], [-14.2, 1.6], [-12.8, 6.8], [-9.8, 10], [-7.2, 9.6], [-6.6, 4]])
        : suave([[-2.6, -4.4], [-6.6, -5.8], [-10, -3.6], [-10.6, 2], [-9, 7.4], [-5.8, 10], [-3.2, 9], [-2.4, 3]]);
  const orelhaDentro = (s: number) =>
    v === 'frente'
      ? linha(([[23.6, -1.4], [25.4, -1.6], [25.6, 2.6], [24, 6]] as P[]).map(([x, y]) => [x * s, y] as P))
      : v === 'tq'
        ? linha([[-9, -2.6], [-11.6, -1.4], [-11.4, 3.6], [-9.4, 6.8]])
        : linha([[-4.6, -2.6], [-8, -1.4], [-7.8, 4], [-5.2, 6.6]]);
  const mostraOrelha = cab.orelha !== 'nada';
  const orelhasAtras: Forma[] = mostraOrelha && v === 'frente' ? [{ d: orelhaD(1), cor: pele, sombra: ps, k: 1.6 }, { d: orelhaD(-1), cor: pele, sombra: ps, k: 1.6 }] : [];
  const orelhaFrente: Forma[] = mostraOrelha && v !== 'frente' ? [{ d: orelhaD(1), cor: pele, sombra: ps, k: 1.4 }] : [];
  const brincoPos: P[] = v === 'frente' ? [[-24.4, 10.6], [24.4, 10.6]] : v === 'tq' ? [[-9.6, 11.2]] : [[-5.6, 11]];

  // ---- olhos (piscar + fecha da pose + humor)
  const per = 118 + Math.floor(c.seed * 40);
  const fase = (c.t + c.seed * 300) % per;
  const pisca = fase < 5 ? Math.sin((fase / 5) * Math.PI) : 0;
  const fecha = clamp(Math.max(j.fecha, pisca));
  const H = {
    ok: { abre: 1.0, baixo: 0.06, bro: 0, bIn: 0, arco: 1.4 },
    feliz: { abre: 0.86, baixo: 0.42, bro: -1.1, bIn: 0, arco: 1.9 },
    cansado: { abre: 0.42, baixo: 0.05, bro: 0.6, bIn: -1.8, arco: 0.6 },
    focado: { abre: 0.76, baixo: 0.2, bro: 0.5, bIn: -0.2, arco: 0.8 },
    surpresa: { abre: 1.18, baixo: 0, bro: -3.2, bIn: -0.6, arco: 2.6 },
  }[humor];
  const abre = H.abre * (1 - fecha);
  const olhar: P = v === 'frente' ? [0.3, 0.2] : [1.2, 0.2];
  const els: React.ReactNode[] = [];
  const corSob = pessoa.cabelo === 'grisalho' || pessoa.cabelo === 'calvo' ? mix(pessoa.corCabelo, '#6E74A8', 0.3) : escurece(pessoa.corCabelo, 0.15);
  const gr = f ? 1.7 : 2.3;
  // a linha dos olhos um tico acima da âncora: de 3/4 a âncora da bochecha fica logo embaixo do
  // olho de lá, e o dedo que aperta a bochecha não pode parecer cutucar o olho
  const oy = olhos[1] - 1.3;
  if (v === 'frente') {
    for (const s of [-1, 1]) {
      els.push(olho(c, { cx: 9.8 * s, cy: oy, w: 10, h: 8.6, esq: s < 0, abre, baixo: H.baixo, iris: olhar }, `o${s}`, humor, f));
      const ini: P = [4.4 * s, oy - 9.4 + H.bro + H.bIn];
      const fim: P = [15 * s, oy - 9.6 + H.bro - H.bIn * 0.3];
      els.push(sobrancelha(ini, fim, H.arco, gr, corSob, `b${s}`));
    }
  } else if (v === 'tq') {
    const xo = olhos[0];
    els.push(olho(c, { cx: xo - 8.8, cy: oy, w: 10, h: 8.6, esq: true, abre, baixo: H.baixo, iris: olhar }, 'o0', humor, f));
    // a bochecha empurrada pelo dedo sobe a pálpebra de baixo do olho de lá
    els.push(olho(c, { cx: xo + 7.2, cy: oy - 0.3, w: 6.2, h: 7.6, esq: false, abre, baixo: Math.min(0.6, H.baixo + (fundo / 2.6) * 0.32), iris: [olhar[0] * 0.7, olhar[1]], far: true }, 'o1', humor, f));
    els.push(sobrancelha([xo - 4.4, oy - 9.4 + H.bro + H.bIn], [xo - 14.4, oy - 9.6 + H.bro - H.bIn * 0.3], H.arco, gr, corSob, 'b0'));
    els.push(sobrancelha([xo + 3.0, oy - 9.2 + H.bro + H.bIn], [xo + 10.8, oy - 9.0 + H.bro - H.bIn * 0.3], H.arco * 0.8, gr * 0.9, corSob, 'b1'));
  } else {
    const xo = olhos[0];
    els.push(olho(c, { cx: xo + 1.4, cy: oy, w: 5.4, h: 8, esq: false, abre, baixo: H.baixo, iris: [1.2, 0.2], far: true }, 'o0', humor, f));
    els.push(sobrancelha([xo + 4.6, oy - 9.2 + H.bro + H.bIn], [xo - 3.4, oy - 9.6 + H.bro], H.arco, gr, corSob, 'b0'));
  }
  // olheira de cansaço
  if (humor === 'cansado') {
    const xs = v === 'frente' ? [-9.8, 9.8] : v === 'tq' ? [olhos[0] - 8.8] : [];
    xs.forEach((x, k) => els.push(<Traco key={`ol${k}`} d={linha([[x - 3.4, oy + 4.8], [x, oy + 6], [x + 3.4, oy + 4.8]])} w={0.7} cor={ps} op={0.9} />));
  }

  // ---- nariz
  const nariz: React.ReactNode[] = [];
  if (v === 'frente') {
    nariz.push(<path key="ns" d={suave([[-1.2, 2.6], [-2.6, 7.8], [-2.8, 9.8], [-0.6, 9.6], [-0.4, 5]])} fill={ps} opacity={0.55} />);
    nariz.push(<ellipse key="nb" cx={0.8} cy={7.8} rx={1.5} ry={1.1} fill="#FFFFFF" opacity={0.22} />);
    nariz.push(<Traco key="nl" d={linha([[-3.4, 8.6], [-2.4, 10.4], [0, 10.9], [2.4, 10.4], [3.4, 8.6]])} w={0.95} />);
  } else if (v === 'tq') {
    const xn = boca[0];
    nariz.push(<path key="ns" d={suave([[xn + 1.6, 2.2], [xn + 2.6, 8.4], [xn + 1.4, 10.4], [xn + 0.6, 6]])} fill={ps} opacity={0.6} />);
    nariz.push(<Traco key="nl" d={linha([[xn + 3.2, 0.8], [xn + 6, 7.4], [xn + 6.2, 9.4], [xn + 4.4, 10.8], [xn + 2.4, 10.4]])} w={0.95} />);
    nariz.push(<Traco key="nn" d={linha([[xn + 2.6, 10.4], [xn + 1.6, 9.2]])} w={0.8} />);
  } else {
    nariz.push(<Traco key="nn" d={linha([[22.6, 9.6], [21.2, 8.8], [20.6, 9.8]])} w={0.8} />);
  }

  // ---- bochechas coradas e marcas de idade
  const rosado = mix(pele, '#FF6B7A', 0.45);
  const bochechas: React.ReactNode[] = [];
  const bOp = humor === 'feliz' ? 0.42 : 0.26;
  if (v === 'frente') for (const s of [-1, 1]) bochechas.push(<ellipse key={`bc${s}`} cx={13.4 * s} cy={9.6} rx={4.4} ry={2.6} fill={rosado} opacity={bOp} />);
  else if (v === 'tq') {
    bochechas.push(<ellipse key="bc0" cx={-3.4} cy={9.8} rx={4.2} ry={2.6} fill={rosado} opacity={bOp} />);
    bochechas.push(<ellipse key="bc1" cx={16.6} cy={9.4} rx={2.4} ry={2.2} fill={rosado} opacity={bOp} />);
  } else bochechas.push(<ellipse key="bc0" cx={12} cy={9.6} rx={4} ry={2.6} fill={rosado} opacity={bOp} />);
  const idade: React.ReactNode[] = [];
  if (idoso) {
    const op = 0.6;
    if (v === 'frente') {
      for (const s of [-1, 1]) {
        idade.push(<Traco key={`nl${s}`} d={linha([[4.6 * s, 10.6], [7.4 * s, 13.8], [7.8 * s, 17.4]])} w={0.7} op={op} />);
        if (idoso) idade.push(<Traco key={`pg${s}`} d={linha([[15.6 * s, -0.6], [17.6 * s, -1.6]])} w={0.55} op={op} />, <Traco key={`pg2${s}`} d={linha([[15.8 * s, 1.4], [17.8 * s, 1.8]])} w={0.55} op={op} />);
      }
    } else if (v === 'tq') {
      idade.push(<Traco key="nl0" d={linha([[boca[0] - 3.6, 10.6], [boca[0] - 6.4, 13.8], [boca[0] - 6.8, 17.4]])} w={0.7} op={op} />);
      if (idoso) idade.push(<Traco key="pg0" d={linha([[olhos[0] - 14.4, 0], [olhos[0] - 16.4, -1]])} w={0.55} op={op} />, <Traco key="pg1" d={linha([[olhos[0] - 14.4, 2], [olhos[0] - 16.4, 2.6]])} w={0.55} op={op} />);
    }
  }

  // ---- boca (exatamente na âncora)
  const bx = boca[0];
  const by = boca[1];
  const kw = v === 'frente' ? 1 : v === 'tq' ? 0.78 : 0.34;
  const wl = 6.4 * kw * (v === 'tq' ? 1.15 : 1);
  const wr = 6.4 * kw * (v === 'tq' ? 0.85 : v === 'perfil' ? 0.2 : 1);
  const bocaEls: React.ReactNode[] = [];
  const lab = mix(pele, '#B23A55', 0.35);
  if (humor === 'feliz') {
    const d = suave([[...[bx - wl, by - 1.2], 1] as PQ, [bx, by - 0.2], [...[bx + wr, by - 1.5], 1] as PQ, [bx + wr * 0.5, by + 3.8], [bx - wl * 0.2, by + 5.2], [bx - wl * 0.7, by + 3.2]]);
    const id = c.pt.id('boca');
    bocaEls.push(
      <g key="bf">
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
        <path d={d} fill="#4A1830" />
        <g clipPath={`url(#${id})`}>
          <rect x={bx - wl - 1} y={by - 2.2} width={wl + wr + 2} height={3.1} fill="#FBFAFF" />
          <ellipse cx={bx - 0.4} cy={by + 5.4} rx={wl * 0.55} ry={2.4} fill="#E2677E" />
        </g>
        <Traco d={d} w={0.95} />
      </g>,
    );
  } else if (humor === 'surpresa') {
    bocaEls.push(<ellipse key="bs" cx={bx + (v === 'tq' ? -0.4 : 0)} cy={by + 1.2} rx={2.6 * (v === 'frente' ? 1 : 0.8)} ry={3.4} fill="#4A1830" stroke={TINTA} strokeWidth={0.95} />);
    bocaEls.push(<ellipse key="bs2" cx={bx} cy={by + 3} rx={1.5} ry={0.9} fill="#E2677E" />);
  } else if (humor === 'cansado') {
    bocaEls.push(<Traco key="bc" d={linha([[bx - wl * 0.8, by + 0.9], [bx - wl * 0.2, by + 0.2], [bx + wr * 0.4, by + 0.4], [bx + wr * 0.8, by + 1.1]])} w={0.95} />);
  } else if (humor === 'focado') {
    bocaEls.push(<Traco key="bc" d={linha([[bx - wl * 0.55, by + 0.4], [bx, by], [bx + wr * 0.55, by - 0.2]])} w={1.05} />);
    bocaEls.push(<Traco key="bc2" d={linha([[bx + wr * 0.55, by - 0.6], [bx + wr * 0.7, by + 0.2]])} w={0.7} />);
  } else {
    bocaEls.push(<Traco key="bc" d={linha([[bx - wl, by - 0.6], [bx - wl * 0.3, by + 1.0], [bx + wr * 0.4, by + 0.9], [bx + wr, by - 0.9]])} w={1.05} />);
    bocaEls.push(<Traco key="bl" d={linha([[bx - wl * 0.35, by + 3.2], [bx + wr * 0.25, by + 3.1]])} w={0.8} cor={lab} op={0.9} />);
  }
  if (f && humor !== 'surpresa' && humor !== 'feliz') {
    // um toque de cor no lábio (sem batom forte)
    bocaEls.unshift(<ellipse key="lb" cx={bx - 0.4} cy={by + 2.2} rx={wl * 0.42} ry={1.4} fill={lab} opacity={0.55} />);
  }

  // ---- barba / bigode
  const barbaG: Grupo[] = [];
  if (pessoa.barba) {
    const cor = pessoa.corCabelo;
    const sombra = mix(cor, '#0B0820', 0.35);
    let d = '';
    let big = '';
    if (v === 'frente') {
      d = suave([[-22.6, 1], [-22.4, 9], [-19.6, 17], [-13.6, 25.4], [-5.4, 30.2], [0, 30.8], [5.4, 30.2], [13.6, 25.4], [19.6, 17], [22.4, 9], [22.6, 1], [20.4, 2.6], [19, 9], [15, 13.6], [8, 15.6], [0, 15.2], [-8, 15.6], [-15, 13.6], [-19, 9], [-20.4, 2.6]]);
      big = suave([[-7.8, 14.6], [-4, 11.8], [0, 12.6], [4, 11.8], [7.8, 14.6], [4, 13.8], [0, 14.2], [-4, 13.8]]);
    } else if (v === 'tq') {
      d = suave([[-10.6, 4], [-12.6, 14], [-10.8, 21.6], [-4, 27.6], [4.2, 30.4], [10.6, 28.6], [15.4, 24], [18.2, 17.8], [19.4, 12], [17, 13], [14, 15.4], [9.6, 15.2], [4, 15.4], [-1, 13.6], [-4.6, 9], [-6.6, 2]]);
      big = suave([[bx - 6.8, by - 0.6], [bx - 3, by - 4], [bx + 1, by - 3.4], [bx + 5, by - 3.6], [bx + 6.4, by - 0.8], [bx + 2, by - 1.8], [bx - 3, by - 1.6]]);
    } else {
      d = suave([[-3, 4], [-6, 16], [0, 24], [8, 28.4], [16, 29.4], [21.8, 25], [21.2, 19.6], [17, 17], [14, 16], [8, 12], [2, 6]]);
      big = suave([[16, by - 0.8], [19, by - 3.2], [22.4, by - 2.8], [22, by - 0.8]]);
    }
    if (pessoa.barba === 'cheia') {
      barbaG.push({ formas: [{ d, cor, sombra, k: 2.4 }], linha: LINHA.dentro, depois: <Traco d={linha(v === 'frente' ? [[-12, 24], [0, 28.6], [12, 24]] : [[-2, 26], [6, 28.6], [14, 24]])} w={1.2} cor={mix(cor, '#C9B8FF', 0.3)} op={0.6} /> });
      barbaG.push({ formas: [{ d: big, cor, sombra, k: 1 }], linha: LINHA.fino });
    } else if (pessoa.barba === 'rala') {
      barbaG.push({ formas: [{ d, cor, sombra: null, op: 0.42 }] });
      barbaG.push({ formas: [{ d: big, cor, sombra: null, op: 0.6 }] });
    } else {
      barbaG.push({ formas: [{ d: big, cor, sombra, k: 1 }], linha: LINHA.fino, depois: <Traco d={linha(v === 'frente' ? [[-5, 12.8], [0, 12.4], [5, 12.8]] : [[bx - 3, by - 3], [bx + 3, by - 3.2]])} w={0.8} cor="#FFFFFF" op={0.5} /> });
    }
  }

  // ---- o dedo na pele: sombra macia do afundado, vinco e o brilho da bochecha estufada
  const toqueEls: React.ReactNode[] = [];
  if (c.toque && pontaL && (fundo > 0 || c.toque.forca > 0.3)) {
    const fz = clamp(fundo > 0 ? 0.45 + fundo / 2.6 : c.toque.forca * 0.8);
    const cen = contato && fundo > 0 ? add(contato, mul(dirL, fundo * 0.6)) : pontaL;
    const id = c.pt.id('toq');
    const ang = (Math.atan2(dirL[1], dirL[0]) * 180) / Math.PI;
    const tg = perp(dirL);
    const idClip = c.pt.id('toqc');
    toqueEls.push(
      <g key="toque">
        <defs>
          <radialGradient id={id}>
            <stop offset="0%" stopColor={ps} stopOpacity={0.95} />
            <stop offset="55%" stopColor={ps} stopOpacity={0.55} />
            <stop offset="100%" stopColor={ps} stopOpacity={0} />
          </radialGradient>
        </defs>
        <clipPath id={idClip}>
          <path d={rostoD} />
        </clipPath>
        <g clipPath={`url(#${idClip})`}>
          <ellipse cx={cen[0] - dirL[0] * 0.4} cy={cen[1] - dirL[1] * 0.4} rx={4.6} ry={3.6} transform={`rotate(${ang} ${cen[0]} ${cen[1]})`} fill={`url(#${id})`} opacity={fz} />
          {/* vincos dos dois lados do dedo */}
          <Traco d={linha([add(cen, add(mul(tg, 2.9), mul(dirL, -0.8))), add(cen, add(mul(tg, 2.4), mul(dirL, 0.9))), add(cen, add(mul(tg, 1.2), mul(dirL, 1.9)))])} w={0.5} cor={escurece(ps, 0.25)} op={0.85 * fz} />
          <Traco d={linha([add(cen, add(mul(tg, -2.9), mul(dirL, -0.8))), add(cen, add(mul(tg, -2.4), mul(dirL, 0.9))), add(cen, add(mul(tg, -1.2), mul(dirL, 1.9)))])} w={0.5} cor={escurece(ps, 0.25)} op={0.85 * fz} />
        </g>
      </g>,
    );
  }

  // ---- óculos
  const oculos: React.ReactNode[] = [];
  if (pessoa.oculos) {
    const corA = pessoa.id === 'antonio' ? '#9A7440' : pessoa.id === 'celia' ? mix(pessoa.cor, TINTA, 0.35) : '#1C2350';
    const esp = pessoa.id === 'antonio' ? 0.75 : 1.15;
    const lente = (cx: number, cy: number, w: number, h: number, k: string) => (
      <g key={k}>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={h * 0.38} fill="#FFFFFF" fillOpacity={0.08} stroke={corA} strokeWidth={esp} />
        <path d={linha([[cx - w * 0.28, cy + h * 0.2], [cx + w * 0.05, cy - h * 0.32]])} stroke="#FFFFFF" strokeWidth={0.9} opacity={0.45} strokeLinecap="round" />
      </g>
    );
    if (v === 'frente') {
      oculos.push(lente(-9.8, oy + 0.4, 12, 9.4, 'l0'), lente(9.8, oy + 0.4, 12, 9.4, 'l1'));
      oculos.push(<Traco key="pt" d={linha([[-3.8, oy - 0.4], [0, oy - 1.4], [3.8, oy - 0.4]])} w={esp} cor={corA} />);
      oculos.push(<Traco key="h0" d={linha([[-15.8, oy - 1], [-23, oy - 1.6]])} w={esp} cor={corA} />, <Traco key="h1" d={linha([[15.8, oy - 1], [23, oy - 1.6]])} w={esp} cor={corA} />);
    } else if (v === 'tq') {
      const xo = olhos[0];
      oculos.push(lente(xo - 8.8, oy + 0.4, 12, 9.4, 'l0'), lente(xo + 7.6, oy + 0.2, 7.6, 9.2, 'l1'));
      oculos.push(<Traco key="pt" d={linha([[xo - 2.8, oy - 0.6], [xo + 0.6, oy - 1.4], [xo + 3.8, oy - 0.6]])} w={esp} cor={corA} />);
      oculos.push(<Traco key="h0" d={linha([[xo - 14.8, oy - 1], [-8.4, oy - 2.2]])} w={esp} cor={corA} />);
    } else {
      const xo = olhos[0];
      oculos.push(<Traco key="l0" d={linha([[xo + 3.6, oy - 4.4], [xo + 4.2, oy + 4.6]])} w={esp * 1.4} cor={corA} />);
      oculos.push(<Traco key="h0" d={linha([[xo + 3.6, oy - 2], [-4.4, oy - 2.6]])} w={esp} cor={corA} />);
    }
  }

  // ---- brincos
  const brincos: React.ReactNode[] = [];
  if (pessoa.brinco) {
    brincoPos.forEach(([x, y], k) => {
      if (pessoa.id === 'bia') brincos.push(<circle key={k} cx={x} cy={y + 3.6} r={3.6} fill="none" stroke="#FFC83D" strokeWidth={1.1} />);
      else brincos.push(<g key={k}><circle cx={x} cy={y} r={1} fill="#FFC83D" /><ellipse cx={x} cy={y + 3} rx={1.3} ry={2} fill="#FFC83D" stroke={TINTA} strokeWidth={0.4} /></g>);
    });
  }

  // ---- acessórios de cabeça (boné, faixa, fone)
  const ex = roupa.extras ?? [];
  const acess: Grupo[] = [];
  if (ex.includes('bone')) {
    const copa = mix('#262C5E', pessoa.cor, 0.12);
    if (v === 'frente') {
      acess.push({
        formas: [
          { d: suave([[-25.4, -12], [-25, -24], [-15, -33.6], [0, -36.6], [15, -33.6], [25, -24], [25.4, -12], [12, -14], [0, -14.6], [-12, -14]]), cor: copa, k: 3 },
          { d: suave([[-22, -13.6], [0, -16.4], [22, -13.6], [23.6, -10.4], [0, -8.8], [-23.6, -10.4]]), cor: pessoa.cor, k: 1.4 },
        ],
        linha: LINHA.dentro,
        depois: (
          <g>
            <Traco d={linha([[-12, -30], [-6, -22], [-5, -15]])} w={LINHA.fino} op={0.35} />
            <Traco d={linha([[12, -30], [6, -22], [5, -15]])} w={LINHA.fino} op={0.35} />
            <circle cx={0} cy={-36.4} r={1.4} fill={pessoa.cor} />
            <circle cx={0} cy={-24} r={2.6} fill={pessoa.cor} opacity={0.9} />
          </g>
        ),
      });
    } else {
      acess.push({
        formas: [
          { d: suave([[-25.6, -8], [-25.4, -22], [-15, -32.6], [0, -35.4], [13, -33], [21.6, -25], [23.6, -14], [10, -15.6], [-8, -13.4]]), cor: copa, k: 3 },
          { d: suave([[14, -15.4], [23.4, -14.4], [34, -12.6], [35.4, -10.6], [30, -9.6], [19, -10.4], [13.6, -12]]), cor: pessoa.cor, k: 1.2 },
        ],
        linha: LINHA.dentro,
        depois: (
          <g>
            <Traco d={linha([[-4, -35], [4, -26], [10, -15.6]])} w={LINHA.fino} op={0.5} />
            <circle cx={-2} cy={-35.2} r={1.4} fill={pessoa.cor} />
          </g>
        ),
      });
    }
  }
  if (ex.includes('faixa')) {
    const cf = roupa.cima.cor2 ?? pessoa.cor;
    const d = v === 'frente' ? suave([[-25.2, -14], [0, -21.4], [25.2, -14], [25.4, -9.6], [0, -16.6], [-25.4, -9.6]]) : suave([[-24.8, -10], [-12, -19], [6, -21.6], [22.4, -17.6], [22.8, -13], [6, -16.8], [-10, -14.4], [-25, -5.6]]);
    acess.push({ formas: [{ d, cor: cf, k: 1.4 }], linha: LINHA.dentro, depois: <Traco d={v === 'frente' ? linha([[-18, -15.4], [0, -19.6], [18, -15.4]]) : linha([[-14, -15.4], [4, -19.4], [18, -16.8]])} w={0.8} cor={pessoa.cor} op={0.9} /> });
  }
  if (ex.includes('fone')) {
    const cc = pessoa.cor;
    if (v === 'frente') {
      acess.push({
        formas: [
          { d: suave([[-26.4, -2], [-29, -20], [-18, -35], [0, -39.6], [18, -35], [29, -20], [26.4, -2], [24, -2], [26, -19], [16.6, -32], [0, -36.4], [-16.6, -32], [-26, -19], [-24, -2]]), cor: '#262C5E', k: 1 },
          { d: suave([[-29, -4], [-29.4, 4], [-27, 9.6], [-23.6, 8.6], [-23.4, -3.6], [-26, -6]]), cor: cc, k: 1.6 },
          { d: suave([[29, -4], [29.4, 4], [27, 9.6], [23.6, 8.6], [23.4, -3.6], [26, -6]]), cor: cc, k: 1.6 },
        ],
        linha: LINHA.dentro,
      });
    } else {
      acess.push({
        formas: [
          { d: suave([[-12, -2], [-16, -22], [-6, -36.4], [8, -37.4], [14, -34], [9, -33.6], [-2, -33.4], [-12, -22], [-9, -2]]), cor: '#262C5E', k: 1 },
          { d: suave([[-15.4, -4.4], [-15.6, 6], [-12, 10.4], [-7.2, 9.4], [-6.2, -2], [-9.6, -6]]), cor: cc, k: 1.6 },
        ],
        linha: LINHA.dentro,
        depois: <ellipse cx={-10.8} cy={2.2} rx={2.2} ry={3.6} fill={escurece(cc, 0.25)} />,
      });
    }
  }

  // ---- montagem: rosto e orelhas → traços → barba → boca → cabelo → óculos/acessórios
  const L = q.L;
  const grupos: Grupo[] = [
    { formas: [...orelhasAtras, ...formasRosto], depois: v === 'frente' && mostraOrelha ? <g><Traco d={orelhaDentro(1)} w={0.7} op={0.7} /><Traco d={orelhaDentro(-1)} w={0.7} op={0.7} /></g> : null },
  ];
  if (orelhaFrente.length) grupos.push({ formas: orelhaFrente, linha: LINHA.dentro, depois: <Traco d={orelhaDentro(1)} w={0.7} op={0.7} /> });
  grupos.push({ formas: [], depois: <g>{bochechas}{idade}{nariz}{toqueEls}</g> });
  barbaG.forEach((g) => grupos.push(g));
  grupos.push({ formas: [], depois: <g>{bocaEls}{els}</g> });
  if (cab.frente.length) grupos.push({ formas: cab.frente, linha: LINHA.dentro * 1.25, depois: cab.detalhesFrente });
  if (cab.soltas.length) grupos.push({ formas: cab.soltas, linha: LINHA.dentro, depois: cab.detalhesSoltas });
  acess.forEach((g) => grupos.push(g));
  grupos.push({ formas: [], depois: <g>{oculos}{brincos}</g> });
  c.pt.tf = q.transform;
  const camada = c.pt.camada(grupos, 'cab', L);
  c.pt.tf = undefined;
  return (
    <g key={key} transform={q.transform}>
      {camada}
    </g>
  );
}
