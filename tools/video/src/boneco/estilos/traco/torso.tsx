// Traço editorial — o tronco vestido: a parte de cima da roupa (top, regata, camiseta, manga longa,
// moletom com capuz e bolso canguru, camisa com gola e botões, blusa com decote em V, blazer com
// lapela sobre a camisa, pijama com viés), o pescoço com o decote, avental e crachá.
import React from 'react';
import { type Ctx, rimDe } from './ctx';
import { type P, type Q, add, canto, elipse, lerp, mul, poli, sub, suave } from './geo';
import { Vol } from './Vol';
import { clara, lum, mix, sombra, sombraPele } from './cor';

const RAD = Math.PI / 180;

type Decote = { tipo: 'redondo' | 'canoa' | 'v' | 'nadador' | 'gola'; fundo: number; abre: number };

const decoteDe = (c: Ctx): Decote => {
  const T = c.tr.T;
  switch (c.roupa.cima.tipo) {
    case 'top':
      return { tipo: 'nadador', fundo: T - 7.5, abre: 3.6 };
    case 'regata':
      return { tipo: 'canoa', fundo: T - 6.5, abre: 2.4 };
    case 'blusa':
      return { tipo: 'v', fundo: T - 8, abre: 1.4 };
    case 'blazer':
      return { tipo: 'v', fundo: T * 0.44, abre: 1.0 };
    case 'camisa':
    case 'pijama':
      return { tipo: 'gola', fundo: T - 2.8, abre: 0.4 };
    default:
      return { tipo: 'redondo', fundo: T + 0.4, abre: 0.7 };
  }
};

/** ponto no anel do pescoço (th: −90 lado −x, 0 frente, 90 lado +x) */
const naGola = (c: Ctx, th: number, v: number, rr: number): P => {
  const { tr } = c;
  const t = th * RAD;
  const u = tr.pescoco.u + rr * Math.sin(t) * tr.cphi + rr * 0.95 * Math.cos(t) * tr.sphi;
  return tr.pt(u, v);
};

/** altura (v) da base do pescoço do lado th: de 3/4 e perfil a nuca (−x) é mais alta que a frente */
const bg = (c: Ctx, th: number) => {
  const frente = c.j.vista === 'frente';
  const k = (1 - Math.cos(th * RAD)) / 2;
  return c.tr.T + lerp(frente ? 2.6 : 2.0, frente ? 5.6 : 6.0, k);
};

/** contorno do tronco vestido, da barra (vh) até os ombros, com folga e (eBarra na barra) */
const contorno = (c: Ctx, vh: number, e: number, eBarra = e, topo = true): P[] => {
  const { tr, j } = c;
  const T = tr.T;
  const niveis = [vh, -5, 6, 0.3 * T, 0.5 * T, 0.66 * T, 0.8 * T, 0.92 * T].filter((v, k) => k === 0 || v > vh + 1.5);
  const eDe = (v: number) => lerp(eBarra, e, Math.min(1, Math.max(0, (v - vh) / 14)));
  const cima = tr.cima(T);
  const lado: P = [-cima[1], cima[0]];
  const pts: P[] = [];
  // barra: de −x pra +x, com a frente um tico mais baixa (é a frente de uma elipse)
  pts.push(tr.pt(tr.xm(vh, eBarra), vh));
  pts.push(tr.pt(tr.meio(vh, eBarra) * 0.7, vh - 0.5 - 1.1 * tr.sphi));
  for (const v of niveis) pts.push(tr.pt(tr.xM(v, eDe(v)), v));
  if (topo) {
    pts.push(add(add(j.ombro[1], mul(cima, 3.0 + e * 0.6)), mul(lado, 0.6 + e * 0.5)));
    pts.push(naGola(c, 76, bg(c, 75) - 2.2, tr.pescoco.r + 2.6));
    pts.push(naGola(c, 70, bg(c, 75), tr.pescoco.r + 0.3));
    pts.push(naGola(c, -70, bg(c, -75), tr.pescoco.r + 0.3));
    pts.push(naGola(c, -76, bg(c, -75) - 2.2, tr.pescoco.r + 2.6));
    pts.push(add(add(j.ombro[0], mul(cima, 3.0 + e * 0.6)), mul(lado, -0.6 - e * 0.5)));
  }
  for (const v of [...niveis].reverse()) if (v > vh) pts.push(tr.pt(tr.xm(v, eDe(v)), v));
  return pts;
};

/** a abertura do decote (pele): da lateral do pescoço até o fundo, na superfície */
const aberturaDecote = (c: Ctx, d: Decote): Q[] => {
  const { tr } = c;
  const T = tr.T;
  const r = tr.pescoco.r + d.abre;
  const pts: Q[] = [];
  if (d.tipo === 'v' || d.tipo === 'gola') {
    pts.push(naGola(c, -82, bg(c, -75) + 0.2, r));
    pts.push(naGola(c, -55, T + 0.8, r * 0.9));
    pts.push(canto(tr.pt(tr.meio(d.fundo), d.fundo)));
    pts.push(naGola(c, 55, T + 0.8, r * 0.9));
    pts.push(naGola(c, 82, bg(c, 75) + 0.2, r));
    pts.push(tr.pt(tr.pescoco.u, T + 6));
    return pts;
  }
  const n = 9;
  for (let k = 0; k <= n; k++) {
    const th = -88 + (176 * k) / n;
    const fundo = Math.cos(th * RAD) ** 1.6;
    const v = lerp(bg(c, th) + 0.2, d.fundo, fundo);
    const rr = d.tipo === 'canoa' || d.tipo === 'nadador' ? r * (1 + 0.15 * fundo) : r;
    pts.push(th === 0 && d.tipo !== 'redondo' ? tr.pt(tr.meio(v), v) : naGola(c, th, v, rr));
  }
  pts.push(tr.pt(tr.pescoco.u, T + 6));
  return pts;
};

/** o pescoço (com a pele do decote, numa forma só) */
export const Pescoco: React.FC<{ c: Ctx; sombraQueixo: string }> = ({ c, sombraQueixo }) => {
  const { tr, j, prop, uid } = c;
  const T = tr.T;
  // de 3/4 e perfil o pescoço é mais estreito na tela e sai de trás da mandíbula (a garganta
  // fica atrás do queixo, a nuca embaixo da orelha)
  const r = tr.pescoco.r * (j.vista === 'frente' ? 1 : 0.8);
  const d = decoteDe(c);
  const baseP = tr.pt(tr.pescoco.u, T - 1.5);
  const a = j.ang.cabeca * RAD;
  const lx = j.vista === 'frente' ? 0 : -0.17 * prop.cabecaLarg;
  const ly = (j.vista === 'frente' ? 0.18 : 0.2) * prop.cabeca;
  const topo: P = [j.cabeca[0] + lx * Math.cos(a) - ly * Math.sin(a), j.cabeca[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  const dir = sub(topo, baseP);
  const L = Math.hypot(dir[0], dir[1]) || 1;
  const n: P = [dir[1] / L, -dir[0] / L];
  const dn: P = [-dir[0] / L, -dir[1] / L];
  const pesc = suave([add(add(baseP, mul(n, r * 1.06)), mul(dn, -0.2)), add(baseP, mul(dn, 1.0)), add(add(baseP, mul(n, -r * 1.06)), mul(dn, -0.2)), add(topo, mul(n, -r * 0.98)), add(topo, mul(n, r * 0.92))]);
  const ab = suave(aberturaDecote(c, d));
  const id = `${uid}-pesc`;
  const pele = c.pele;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-q`}>
          <path d={pesc} />
        </clipPath>
      </defs>
      {/* o colo (pele do decote) na luz do peito; o pescoço meio-tom mais escuro, embaixo da
          cabeça — é o que separa cabeça e pescoço sem contorno */}
      <Vol id={`${id}-ab`} ds={[ab]} cor={pele} sombra={c.peleS} s={1.0} luzDir={c.L} />
      <Vol id={id} ds={[pesc]} cor={mix(pele, c.peleS, 0.42)} sombra={c.peleS} s={1.1} luzDir={c.L} />
      <g clipPath={`url(#${id}-q)`}>
        <path d={sombraQueixo} fill={sombraPele(pele, 1.15)} opacity={0.7} />
      </g>
    </g>
  );
};

/** a parte de cima da roupa, sem o pescoço (o pescoço vem depois e cobre o meio do decote) */
export const Cima: React.FC<{ c: Ctx; parte: 'pele' | 'roupa' | 'gola' }> = ({ c, parte }) => {
  const { tr, roupa, uid, j } = c;
  const T = tr.T;
  const cima = roupa.cima;
  const cor = cima.cor;
  const cor2 = cima.cor2;
  const S = sombra(cor);
  const rim = { cor: rimDe(c, cor, 0.55), r: 0.5 };
  const id = `${uid}-cima`;
  const d = decoteDe(c);

  if (parte === 'pele') {
    // tronco nu por baixo do top/regata (ombros, barriga)
    if (cima.tipo !== 'top' && cima.tipo !== 'regata') return null;
    return <Vol id={`${id}-p`} ds={[suave(contorno(c, -4, 0))]} cor={c.pele} sombra={c.peleS} s={3.0} luzDir={c.L} rim={{ cor: rimDe(c, c.pele, 0.6), r: 0.5 }} />;
  }

  if (parte === 'gola') {
    // o que fica POR CIMA do pescoço: ribana, gola de camisa, capuz, lapela, cordão, crachá
    const el: React.ReactNode[] = [];
    if (d.tipo === 'redondo') {
      const pts: P[] = [];
      for (let k = 0; k <= 8; k++) {
        const th = -84 + (168 * k) / 8;
        const v = lerp(bg(c, th), d.fundo, Math.cos(th * RAD) ** 1.6);
        pts.push(naGola(c, th, v, tr.pescoco.r + d.abre));
      }
      el.push(<path key="rib" d={suave(pts, false)} stroke={cor2 && cima.tipo === 'camiseta' ? cor2 : sombra(cor, 0.55)} strokeWidth={1.0} fill="none" strokeLinecap="round" />);
      if (cima.tipo === 'moletom') {
        // cordões do capuz
        for (const s of [-1, 1]) {
          const a = naGola(c, s * 28, d.fundo + 1.2, tr.pescoco.r + 1.5);
          const z = add(a, mul(tr.cima(T), -7.5));
          el.push(<path key={`co${s}`} d={`M${a[0]} ${a[1]}L${z[0]} ${z[1]}`} stroke={cor2 ?? '#F4F5FF'} strokeWidth={0.55} strokeLinecap="round" />);
          el.push(<circle key={`cp${s}`} cx={z[0]} cy={z[1]} r={0.45} fill={cor2 ?? '#F4F5FF'} />);
        }
      }
    }
    if (d.tipo === 'canoa' || d.tipo === 'nadador') {
      // debrum do decote
      const pts: P[] = [];
      for (let k = 0; k <= 8; k++) {
        const th = -80 + (160 * k) / 8;
        const f = Math.cos(th * RAD) ** 1.6;
        const v = lerp(bg(c, th) - 0.6, d.fundo, f);
        pts.push(th === 0 ? tr.pt(tr.meio(v), v) : naGola(c, th, v, (tr.pescoco.r + d.abre) * (1 + 0.15 * f)));
      }
      el.push(<path key="deb" d={suave(pts, false)} stroke={cor2 ?? sombra(cor, 0.5)} strokeWidth={0.7} fill="none" strokeLinecap="round" />);
    }
    if (d.tipo === 'v' && cima.tipo === 'blusa') {
      const pts = [naGola(c, -80, bg(c, -75), tr.pescoco.r + d.abre), tr.pt(tr.meio(d.fundo), d.fundo), naGola(c, 80, bg(c, 75), tr.pescoco.r + d.abre)];
      el.push(<path key="vt" d={`M${pts[0][0]} ${pts[0][1]}L${pts[1][0]} ${pts[1][1]}L${pts[2][0]} ${pts[2][1]}`} stroke={cor2 ?? sombra(cor, 0.5)} strokeWidth={0.75} fill="none" strokeLinejoin="round" strokeLinecap="round" />);
    }
    if (d.tipo === 'gola') {
      // gola de camisa/pijama: o pé da gola abraça a base do pescoço e as duas pontas caem na frente
      const corG = cor;
      const r0 = tr.pescoco.r + 0.25;
      const pe: P[] = [];
      const topoG: P[] = [];
      for (let k = 0; k <= 10; k++) {
        const th = -96 + (192 * k) / 10;
        pe.push(naGola(c, th, bg(c, th) - 0.4, r0 + 0.35));
        topoG.push(naGola(c, th, bg(c, th) + 1.5, r0));
      }
      el.push(<Vol key="pg" id={`${id}-pg`} ds={[suave([...pe, ...topoG.reverse()], true, 0.6)]} cor={sombra(corG, 0.25)} sombra={sombra(corG, 0.8)} s={0.5} luzDir={c.L} />);
      for (const s of [-1, 1] as const) {
        const aba = suave([
          canto(naGola(c, s * 5, T - 2.6, r0 + 0.4)),
          naGola(c, s * 34, bg(c, s * 34) + 0.2, r0),
          naGola(c, s * 70, bg(c, s * 70) + 1.3, r0 + 0.2),
          naGola(c, s * 88, bg(c, s * 88) + 0.4, r0 + 0.9),
          canto(naGola(c, s * 52, T - 4.6, r0 + 3.2)),
        ]);
        el.push(<Vol key={`ga${s}`} id={`${id}-ga${s}`} ds={[aba]} cor={s === 1 ? clara(corG, 0.1) : corG} sombra={sombra(corG, 0.7)} s={0.6} luzDir={c.L} />);
        if (cima.tipo === 'pijama' && cor2) el.push(<path key={`gv${s}`} d={aba} fill="none" stroke={cor2} strokeWidth={0.5} />);
      }
    }
    if (cima.tipo === 'blazer') {
      // camisa por baixo (gola) + lapelas
      const shirt = cor2 ?? '#F4F5FF';
      for (const s of [-1, 1] as const) {
        const golaC = suave([naGola(c, s * 88, bg(c, s * 80) + 0.8, tr.pescoco.r + 0.4), naGola(c, s * 70, bg(c, s * 80) - 2, tr.pescoco.r + 1.9), canto(tr.pt(tr.meio(T - 3.6) + s * 1.6, T - 4)), naGola(c, s * 10, T - 0.6, tr.pescoco.r + 0.4)]);
        el.push(<path key={`sg${s}`} d={golaC} fill={s === 1 ? shirt : sombra(shirt, 0.35)} />);
        const lap = suave([
          naGola(c, s * 80, bg(c, s * 80) - 0.8, tr.pescoco.r + 1.6),
          canto(naGola(c, s * 74, T - 3.4, tr.pescoco.r + 5.2)),
          canto(naGola(c, s * 52, T - 5.0, tr.pescoco.r + 5.6)),
          tr.sup(s * 34, T * 0.6),
          canto(tr.pt(tr.meio(d.fundo), d.fundo)),
          naGola(c, s * 40, T - 2.2, tr.pescoco.r + 2.0),
        ]);
        el.push(<Vol key={`la${s}`} id={`${id}-la${s}`} ds={[lap]} cor={s === 1 ? clara(cor, 0.12) : cor} sombra={sombra(cor, 0.9)} s={0.8} luzDir={c.L} />);
      }
      const bt = tr.pt(tr.meio(d.fundo - 3), d.fundo - 3);
      el.push(<circle key="bt" cx={bt[0]} cy={bt[1]} r={0.75} fill={sombra(cor, 1.3)} />);
    }
    // crachá no cordão
    if (roupa.extras?.includes('cracha')) {
      const card = tr.sup(cima.tipo === 'blazer' ? 30 : 0, T * 0.58);
      const g1 = naGola(c, -60, bg(c, -75) - 1, tr.pescoco.r + 1);
      const g2 = naGola(c, 60, bg(c, 75) - 1, tr.pescoco.r + 1);
      el.push(<path key="cd" d={`M${g1[0]} ${g1[1]}L${card[0]} ${card[1] - 2.2}L${g2[0]} ${g2[1]}`} stroke={c.pessoa.cor} strokeWidth={0.55} fill="none" strokeLinejoin="round" />);
      const g = tr.giro(T * 0.58);
      el.push(
        <g key="cc" transform={`translate(${card[0]} ${card[1]}) rotate(${g})`}>
          <rect x={-1.9} y={-2.2} width={3.8} height={5.0} rx={0.5} fill="#F4F5FF" />
          <rect x={-1.9} y={-2.2} width={3.8} height={1.3} rx={0.5} fill={c.pessoa.cor} />
          <rect x={-1.2} y={0.2} width={2.4} height={0.4} rx={0.2} fill="#9AA0C4" />
          <rect x={-1.2} y={1.1} width={1.6} height={0.4} rx={0.2} fill="#C9CEE8" />
        </g>,
      );
    }
    return <g>{el}</g>;
  }

  // ------------------------------------------------------------ a peça
  const el: React.ReactNode[] = [];
  const tipo = cima.tipo;
  if (tipo === 'top' || tipo === 'regata') {
    // top: faixa do busto + alças; regata: corpo até a cava + alças
    const vb = tipo === 'top' ? 0.47 * T : -6;
    const e = tipo === 'top' ? 0.15 : 0.45;
    const niveis = [vb, -5, 6, 0.3 * T, 0.5 * T, 0.66 * T].filter((v, k) => k === 0 || v > vb + 1.5);
    const pts: P[] = [];
    pts.push(tr.pt(tr.xm(vb, e), vb));
    pts.push(tr.pt(tr.meio(vb, e) * 0.7, vb - 0.4 - 0.8 * tr.sphi));
    for (const v of niveis) pts.push(tr.pt(tr.xM(v, e), v));
    // cava da frente → alça → decote → alça → cava de trás
    pts.push(tr.pt(tr.xM(0.74 * T, e) - 1.2, 0.74 * T));
    const alca = tipo === 'top' ? 1.8 : 2.6;
    pts.push(naGola(c, 72, bg(c, 75) - 1.6, tr.pescoco.r + d.abre + alca));
    pts.push(naGola(c, 76, bg(c, 75) - 1.0, tr.pescoco.r + d.abre));
    for (let k = 1; k < 8; k++) {
      const th = 76 - (152 * k) / 8;
      const f = Math.cos(th * RAD) ** 1.6;
      const v = lerp(bg(c, th) - 1.0, d.fundo, f);
      pts.push(Math.abs(th) < 1 ? tr.pt(tr.meio(v), v) : naGola(c, th, v, (tr.pescoco.r + d.abre) * (1 + 0.15 * f)));
    }
    pts.push(naGola(c, -76, bg(c, -75) - 1.0, tr.pescoco.r + d.abre));
    pts.push(naGola(c, -72, bg(c, -75) - 1.6, tr.pescoco.r + d.abre + alca));
    pts.push(tr.pt(tr.xm(0.74 * T, e) + 1.2, 0.74 * T));
    for (const v of [...niveis].reverse()) if (v > vb) pts.push(tr.pt(tr.xm(v, e), v));
    el.push(<Vol key="t" id={`${id}-t`} ds={[suave(pts)]} cor={cor} sombra={S} s={2.6} luzDir={c.L} rim={rim} />);
    if (tipo === 'top' && cor2) {
      // elástico de baixo do top
      const a = [tr.pt(tr.xm(vb, e + 0.05), vb), tr.pt(tr.meio(vb, e) * 0.7, vb - 0.4 - 0.8 * tr.sphi), tr.pt(tr.xM(vb, e + 0.05), vb)];
      const b = [tr.pt(tr.xM(vb + 2.4, e + 0.05), vb + 2.4), tr.pt(tr.meio(vb + 2.4, e) * 0.7, vb + 2.0 - 0.8 * tr.sphi), tr.pt(tr.xm(vb + 2.4, e + 0.05), vb + 2.4)];
      el.push(<path key="el" d={suave([...a, ...b], true, 0.5)} fill={cor2} />);
    }
    return <g>{el}</g>;
  }

  const solta = tipo === 'moletom' || tipo === 'pijama' || tipo === 'blusa';
  const e = tipo === 'moletom' ? 1.5 : tipo === 'blazer' ? 1.3 : solta ? 1.2 : tipo === 'camisa' ? 0.9 : 0.6;
  const vh = tipo === 'blazer' ? -12 : tipo === 'moletom' ? -9.5 : tipo === 'camiseta' || tipo === 'manga-longa' ? -7.5 : -9;
  const eBarra = tipo === 'blusa' ? e + 1.6 : tipo === 'moletom' ? e - 0.6 : tipo === 'blazer' ? e + 0.6 : e + 0.3;
  if (tipo === 'moletom') {
    // o capuz dobrado atrás do pescoço
    const cap = suave([naGola(c, -96, bg(c, -75) - 2.5, tr.pescoco.r + 3.6), naGola(c, -118, bg(c, -75) + 2.4, tr.pescoco.r + 2.8), naGola(c, 180, bg(c, -75) + 4.2, tr.pescoco.r + 1.8), naGola(c, 118, bg(c, 75) + 2.4, tr.pescoco.r + 2.8), naGola(c, 96, bg(c, 75) - 2.5, tr.pescoco.r + 3.6)]);
    el.push(<Vol key="cap" id={`${id}-cap`} ds={[cap]} cor={sombra(cor, 0.35)} sombra={sombra(cor, 1)} s={1} luzDir={c.L} />);
  }
  el.push(<Vol key="c" id={`${id}-c`} ds={[suave(contorno(c, vh, e, eBarra))]} cor={cor} sombra={S} s={2.8} luzDir={c.L} rim={rim} />);
  const corDet = cor2 ?? sombra(cor, 0.6);
  if (tipo === 'moletom') {
    // ribana da barra + bolso canguru
    const a = [tr.pt(tr.xm(vh, eBarra), vh), tr.pt(tr.meio(vh, eBarra) * 0.7, vh - 0.5 - 1.1 * tr.sphi), tr.pt(tr.xM(vh, eBarra), vh)];
    const v2 = vh + 3.2;
    const b = [tr.pt(tr.xM(v2, eBarra), v2), tr.pt(tr.meio(v2, eBarra) * 0.7, v2 - 0.5 - 1.1 * tr.sphi), tr.pt(tr.xm(v2, eBarra), v2)];
    el.push(<path key="rb" d={suave([...a, ...b], true, 0.5)} fill={sombra(cor, 0.4)} />);
    const bolso = suave([canto(tr.sup(-48, v2 + 0.8, e)), canto(tr.sup(-34, 0.3 * T, e)), canto(tr.sup(34, 0.3 * T, e)), canto(tr.sup(48, v2 + 0.8, e))]);
    el.push(<path key="bo" d={bolso} fill={sombra(cor, 0.28)} />);
    el.push(<path key="bo2" d={`M${tr.sup(-34, 0.3 * T, e).join(' ')}L${tr.sup(-48, v2 + 0.8, e).join(' ')}`} stroke={sombra(cor, 0.9)} strokeWidth={0.6} strokeLinecap="round" />);
    el.push(<path key="bo3" d={`M${tr.sup(34, 0.3 * T, e).join(' ')}L${tr.sup(48, v2 + 0.8, e).join(' ')}`} stroke={sombra(cor, 0.9)} strokeWidth={0.6} strokeLinecap="round" />);
  }
  if (tipo === 'camisa' || tipo === 'pijama' || tipo === 'blazer') {
    // abertura da frente (vista) e botões
    const pts: P[] = [];
    const v0 = tipo === 'blazer' ? d.fundo - 3 : T - 5;
    for (let k = 0; k <= 5; k++) {
      const v = lerp(v0, vh, k / 5);
      pts.push(tr.pt(tr.meio(v, e) + (tipo === 'blazer' ? 0 : 0.5), v));
    }
    el.push(<path key="pl" d={suave(pts, false)} stroke={tipo === 'blazer' ? sombra(cor, 0.9) : tipo === 'pijama' && cor2 ? cor2 : sombra(cor, 0.5)} strokeWidth={tipo === 'pijama' ? 0.6 : 0.45} fill="none" />);
    if (tipo !== 'blazer') {
      for (let k = 0; k < 4; k++) {
        const v = lerp(T - 7, 4, k / 3);
        const p = tr.pt(tr.meio(v, e) + 1.4 * tr.cphi + 0.5, v);
        el.push(<circle key={`bt${k}`} cx={p[0]} cy={p[1]} r={0.45} fill={cor2 && tipo === 'camisa' ? cor2 : lum(cor) > 0.7 ? '#9AA0C4' : clara(cor, 0.55)} />);
      }
      // bolso no peito
      const bp = (th: number, v: number) => tr.sup(th, v, e);
      const bolso = suave([canto(bp(-58, 0.74 * T)), canto(bp(-28, 0.74 * T)), bp(-29, 0.6 * T), bp(-43, 0.57 * T), bp(-57, 0.6 * T)], true, 0.5);
      el.push(<path key="bol" d={bolso} fill={sombra(cor, 0.22)} />);
      el.push(<path key="bol2" d={`M${bp(-58, 0.74 * T).join(' ')}L${bp(-28, 0.74 * T).join(' ')}`} stroke={tipo === 'pijama' && cor2 ? cor2 : sombra(cor, 0.6)} strokeWidth={0.5} />);
    } else {
      // bolsos embutidos do blazer
      for (const s of [-1, 1]) {
        const a = tr.sup(s * 40, 0.12 * T, e);
        const z = tr.sup(s * 66, 0.1 * T, e);
        el.push(<path key={`wp${s}`} d={`M${a[0]} ${a[1]}L${z[0]} ${z[1]}`} stroke={sombra(cor, 1)} strokeWidth={0.7} strokeLinecap="round" />);
      }
    }
    if (tipo === 'pijama' && cor2) {
      // viés da barra
      const a = [tr.pt(tr.xm(vh, eBarra), vh), tr.pt(tr.meio(vh, eBarra) * 0.7, vh - 0.5 - 1.1 * tr.sphi), tr.pt(tr.xM(vh, eBarra), vh)];
      el.push(<path key="vb" d={suave(a, false)} stroke={cor2} strokeWidth={0.8} fill="none" />);
    }
  }
  if (tipo === 'blusa' && cor2) {
    // estampa de bolinhas na cor 2 (uma blusa de verdade, não uma túnica lisa)
    for (const [th, v] of [
      [-50, 0.62 * T],
      [-12, 0.7 * T],
      [28, 0.6 * T],
      [55, 0.74 * T],
      [-35, 0.42 * T],
      [5, 0.47 * T],
      [42, 0.38 * T],
      [-58, 0.2 * T],
      [-20, 0.24 * T],
      [18, 0.18 * T],
      [52, 0.12 * T],
      [-38, 0.02 * T],
      [0, -0.02 * T],
      [36, -0.06 * T],
    ] as [number, number][]) {
      if (v < vh + 1.5) continue;
      const p = tr.sup(th, v, e);
      el.push(<circle key={`pd${th}_${v}`} cx={p[0]} cy={p[1]} r={0.62} fill={cor2} opacity={0.85} />);
    }
  }
  // avental
  if (roupa.extras?.includes('avental')) {
    const corA = '#F2EBDD';
    const pts: Q[] = [
      canto(tr.sup(-38, 0.76 * T, e + 0.2)),
      canto(tr.sup(38, 0.76 * T, e + 0.2)),
      tr.sup(44, 0.3 * T, e + 0.4),
      tr.sup(70, 0.02 * T, e + 1.2),
    ];
    const q1 = j.quadril[1];
    const k1 = j.joelho[1];
    const q0 = j.quadril[0];
    const k0 = j.joelho[0];
    const fr1: P = add(q1, mul(sub(k1, q1), 0.78));
    const fr0: P = add(q0, mul(sub(k0, q0), 0.78));
    pts.push(add(fr1, [3.2, 0]));
    pts.push(add(fr0, [-3.2 + (tr.sphi > 0.3 ? 2.5 : 0), 0.4]));
    pts.push(tr.sup(-70, 0.02 * T, e + 1.2));
    pts.push(tr.sup(-44, 0.3 * T, e + 0.4));
    el.push(<Vol key="av" id={`${id}-av`} ds={[suave(pts, true, 0.7)]} cor={corA} sombra={sombra(corA)} s={2.2} luzDir={c.L} />);
    const bolso = suave([canto(tr.sup(-26, 0.12 * T, e + 1)), canto(tr.sup(26, 0.12 * T, e + 1)), tr.sup(24, -0.06 * T, e + 1.3), tr.sup(-24, -0.06 * T, e + 1.3)], true, 0.5);
    el.push(<path key="avb" d={bolso} fill={mix(corA, c.pessoa.cor, 0.35)} />);
    const s1 = tr.sup(-38, 0.76 * T, e + 0.2);
    const s2 = tr.sup(38, 0.76 * T, e + 0.2);
    const n1 = naGola(c, -70, bg(c, -75) - 0.4, tr.pescoco.r + 0.6);
    const n2 = naGola(c, 70, bg(c, 75) - 0.4, tr.pescoco.r + 0.6);
    el.push(<path key="avs" d={`M${s1[0]} ${s1[1]}L${n1[0]} ${n1[1]}M${s2[0]} ${s2[1]}L${n2[0]} ${n2[1]}`} stroke={corA} strokeWidth={0.8} strokeLinecap="round" />);
  }
  void elipse;
  void poli;
  return <g>{el}</g>;
};
