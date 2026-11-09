// Traço editorial — braços, mangas (sem, curta, dobrada no cotovelo, longa com punho), as mãos
// (palma + polegar separado: solta, fechada, segura, aponta, aberta) e o que a mão carrega
// (halter com cabeça sextavada; copo de vidro com a água sempre na horizontal).
import React from 'react';
import type { Cima } from '../../elenco';
import { type Ctx, atras, rimDe } from './ctx';
import { type P, add, angDe, base, dirDe, dist, elipse, folga, frenteDe, lerp, lerpP, membro, mul, poli, sub, suave, clamp01 } from './geo';
import { Vol } from './Vol';
import { clara, mix, sombra, sombraPele } from './cor';

export type Manga = 'sem' | 'curta' | 'dobrada' | 'longa' | 'blusa';

export const mangaDe = (cima: Cima): Manga => {
  switch (cima.tipo) {
    case 'top':
    case 'regata':
      return 'sem';
    case 'camiseta':
      return 'curta';
    case 'blusa':
      return 'blusa';
    case 'camisa':
      return 'dobrada';
    default:
      return 'longa';
  }
};

const RAD = Math.PI / 180;

// ------------------------------------------------------------------ mãos

type MaoGeo = { b: (x: number, y: number) => P; L: number; k: number; centro: P; d: P; n: P };

const maoGeo = (c: Ctx, i: 0 | 1): MaoGeo => {
  const { j, prop } = c;
  const a = j.ang.mao[i];
  const d = dirDe(a);
  let n = frenteDe(a);
  // de frente o polegar fica do lado de DENTRO (pro corpo)
  if (j.vista === 'frente') n = mul(n, i === 0 ? 1 : -1);
  const L = prop.mao;
  const k = c.corpo.braco[0][1] / 3.7;
  const b = base(j.punho[i], d, n);
  return { b, L, k, centro: b(0.33 * L, 0), d, n };
};

/** a forma da mão (pele) para cada pose; devolve os caminhos e os riscos dos dedos */
const formaMao = (c: Ctx, i: 0 | 1, g: MaoGeo, tipo: string): { ds: string[]; riscos: P[][]; frente: string[]; unha: P[] } => {
  const { b, L, k } = g;
  const w = 1.0 * k;
  const ds: string[] = [];
  const frente: string[] = [];
  const riscos: P[][] = [];
  const unha: P[] = [];
  const cap = (a: P, z: P, r1: number, r2: number) => suave(membro(a, z, [[0, r1, r1], [1, r2, r2]]));
  if (tipo === 'aberta') {
    ds.push(suave([b(0, -1.5 * w), b(0.5 * L, -2.1 * w), b(0.55 * L, 0), b(0.5 * L, 2.0 * w), b(0.1 * L, 1.6 * w)]));
    const dedos: [number, number, number][] = [
      [1.5, 0.46, 13],
      [0.5, 0.52, 4],
      [-0.5, 0.48, -5],
      [-1.45, 0.38, -14],
    ];
    for (const [y, len, ang] of dedos) {
      const a = b(0.46 * L, y * w);
      const dir = [Math.cos(ang * RAD), Math.sin(ang * RAD)];
      const z = b(0.46 * L + dir[0] * len * L, y * w + dir[1] * len * L);
      void a;
      ds.push(cap(b(0.46 * L, y * w), z, 0.56 * w, 0.48 * w));
    }
    ds.push(cap(b(0.12 * L, 1.4 * w), b(0.12 * L + 0.26 * L, 1.4 * w + 0.32 * L), 0.75 * w, 0.55 * w));
    return { ds, riscos, frente, unha };
  }
  if (tipo === 'solta') {
    ds.push(suave([b(0, -1.45 * w), b(0.45 * L, -2.0 * w), b(0.8 * L, -1.55 * w), b(1.0 * L, -0.55 * w), b(0.97 * L, 0.55 * w), b(0.62 * L, 1.35 * w), b(0.38 * L, 1.75 * w), b(0.08 * L, 1.45 * w)]));
    ds.push(cap(b(0.16 * L, 1.25 * w), b(0.5 * L, 2.25 * w), 0.82 * w, 0.62 * w));
    riscos.push([b(0.66 * L, -0.45 * w), b(0.95 * L, -0.15 * w)]);
    riscos.push([b(0.64 * L, 0.45 * w), b(0.9 * L, 0.6 * w)]);
    return { ds, riscos, frente, unha };
  }
  // punho fechado (base de fechada, aponta e segura)
  ds.push(suave([b(0, -1.5 * w), b(0.32 * L, -2.15 * w), b(0.6 * L, -1.95 * w), b(0.7 * L, -0.6 * w), b(0.68 * L, 1.1 * w), b(0.56 * L, 1.95 * w), b(0.3 * L, 1.95 * w), b(0.05 * L, 1.5 * w)]));
  if (tipo === 'aponta') {
    // o indicador esticado: a ponta cai a 0,85 da mão (é o alvo do IK do toque)
    frente.push(cap(b(0.42 * L, 0.75 * w), b(0.85 * L - 0.55 * w, 0.15 * w), 0.7 * w, 0.58 * w));
    frente.push(cap(b(0.2 * L, 1.75 * w), b(0.5 * L, 1.55 * w), 0.72 * w, 0.6 * w));
    riscos.push([b(0.58 * L, -1.2 * w), b(0.66 * L, -0.4 * w)]);
    // a unha (do lado de cima do dedo)
    unha.push(b(0.85 * L - 0.95 * w, -0.25 * w));
  } else {
    frente.push(cap(b(0.18 * L, 1.7 * w), b(0.54 * L, 1.15 * w), 0.78 * w, 0.62 * w));
    riscos.push([b(0.5 * L, -1.35 * w), b(0.66 * L, -1.0 * w)]);
    riscos.push([b(0.52 * L, -0.4 * w), b(0.68 * L, -0.15 * w)]);
  }
  return { ds, riscos, frente, unha };
};

/** o halter (cabeça sextavada emborrachada + pegada cromada), atravessando o punho */
const halter = (c: Ctx, g: MaoGeo, id: string) => {
  const { b, L } = g;
  const cx = 0.33 * L;
  // halter emborrachado DOURADO: escuro some no fundo azul-marinho, o ouro é o destaque da marca
  const grafite = '#F2B630';
  const cabeca = (y: number) => {
    const pts: P[] = [];
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push(b(cx + Math.cos(a) * 4.8, y + Math.sin(a) * 2.1));
    }
    return poli(pts);
  };
  const y1 = 5.2;
  return (
    <g>
      <path d={poli([b(cx - 0.7, -y1), b(cx + 0.7, -y1), b(cx + 0.7, y1), b(cx - 0.7, y1)])} fill="#C9CEE8" />
      <Vol id={`${id}h0`} ds={[cabeca(-y1)]} cor={grafite} sombra={sombra(grafite, 0.8)} s={0.7} luzDir={c.L} rim={{ cor: rimDe(c, grafite, 0.55), r: 0.3 }} />
      <Vol id={`${id}h1`} ds={[cabeca(y1)]} cor={grafite} sombra={sombra(grafite, 0.8)} s={0.7} luzDir={c.L} rim={{ cor: rimDe(c, grafite, 0.55), r: 0.3 }} />
      {[-y1, y1].map((y, k) => (
        <path key={k} d={poli([b(cx - 4.1, y + (y > 0 ? -2.1 : 1.4)), b(cx + 4.1, y + (y > 0 ? -2.1 : 1.4)), b(cx + 4.1, y + (y > 0 ? -1.4 : 2.1)), b(cx - 4.1, y + (y > 0 ? -1.4 : 2.1))])} fill="#3A2A1A" opacity={0.85} />
      ))}
    </g>
  );
};

/** o copo: de pé longe da boca; perto da boca inclina até a borda encostar no lábio */
const copo = (c: Ctx, g: MaoGeo, id: string, parte: 'atras' | 'frente') => {
  const { j } = c;
  const H = 12.5;
  let cc = add(g.centro, mul(g.n, 0.6));
  const dm = dist(cc, j.boca);
  const perto = clamp01(1 - (dm - 7) / 16);
  const angBoca = angDe(cc, j.boca);
  let delta = angBoca - 180;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  const ang = 180 + delta * perto * 0.92;
  const a = dirDe(ang);
  // a borda vai até o lábio (o copo escorrega um tico na mão)
  const borda0 = add(cc, mul(a, H * 0.55));
  const alvo = add(j.boca, mul(sub(cc, j.boca), 0.06));
  const ajuste = mul(sub(alvo, borda0), perto ** 2 * 0.85);
  cc = add(cc, ajuste);
  const p = frenteDe(ang);
  const bb = base(cc, a, p);
  const rb = 2.7;
  const rt = 3.4;
  const vidro = suave([bb(-H * 0.45, -rb), bb(H * 0.55, -rt, ), bb(H * 0.55, rt), bb(-H * 0.45, rb)], true, 0.15);
  const dentro = suave([bb(-H * 0.36, -rb + 0.45), bb(H * 0.55, -rt + 0.45), bb(H * 0.55, rt - 0.45), bb(-H * 0.36, rb - 0.45)], true, 0.15);
  // nível da água: horizontal no mundo; sobe pra borda quando o copo deita
  const nivel = lerpP(bb(H * 0.08, 0), bb(H * 0.5, 0), perto * 0.85);
  const cid = `${id}-agua`;
  if (parte === 'atras') return null;
  return (
    <g>
      <defs>
        <clipPath id={cid}>
          <path d={dentro} />
        </clipPath>
      </defs>
      <path d={vidro} fill="#DDEBFF" opacity={0.28} />
      <g clipPath={`url(#${cid})`}>
        <rect x={nivel[0] - 30} y={nivel[1]} width={60} height={40} fill="#57C3F5" opacity={0.9} />
        <rect x={nivel[0] - 30} y={nivel[1]} width={60} height={0.7} fill="#BDEBFF" opacity={0.95} />
      </g>
      <path d={suave([bb(-H * 0.4, -rb + 0.6), bb(H * 0.48, -rt + 0.7)], false)} stroke="#FFFFFF" strokeWidth={0.6} opacity={0.55} strokeLinecap="round" />
      <path d={poli([bb(-H * 0.45, -rb), bb(-H * 0.36, -rb + 0.1), bb(-H * 0.36, rb - 0.1), bb(-H * 0.45, rb)])} fill="#FFFFFF" opacity={0.35} />
      <path d={elipse(bb(H * 0.55, 0), 0.45, rt, ang - 90)} fill="none" stroke="#FFFFFF" strokeWidth={0.35} opacity={0.7} />
    </g>
  );
};

/** mão completa + objeto */
export const Mao: React.FC<{ c: Ctx; i: 0 | 1; segura?: 'halter' | 'copo'; garrafa?: boolean }> = ({ c, i, segura, garrafa }) => {
  const tipo = c.j.mao[i];
  const g = maoGeo(c, i);
  const id = `${c.uid}-mao${i}`;
  const pele = atras(c, c.pele, i, true);
  const f = formaMao(c, i, g, tipo);
  const rim = i === 1 ? { cor: rimDe(c, pele, 0.6), r: 0.35 } : null;
  const objeto = tipo === 'segura' ? segura : undefined;
  const linhas = f.riscos.map((r, k) => <path key={k} d={suave(r, false)} stroke={sombraPele(pele, 1.1)} strokeWidth={0.32} fill="none" strokeLinecap="round" opacity={0.85} />);
  // garrafa d'água na mão solta/fechada de trás (extra "garrafa")
  const garrafaEl =
    garrafa && (tipo === 'solta' || tipo === 'fechada')
      ? (() => {
          const bb = base(add(g.centro, mul(g.n, 0.4)), [0, -1], [1, 0]);
          const corG = c.pessoa.cor;
          const corpo = suave([bb(-7, -2.6), bb(7, -2.6), bb(8.6, -1.6), bb(8.6, 1.6), bb(7, 2.6), bb(-7, 2.6)], true, 0.3);
          return (
            <g>
              <Vol id={`${id}g`} ds={[corpo]} cor={corG} sombra={sombra(corG)} s={1} luzDir={c.L} />
              <path d={poli([bb(8.4, -1.4), bb(10.4, -1.2), bb(10.4, 1.2), bb(8.4, 1.4)])} fill="#F4F5FF" />
              <path d={poli([bb(-1.5, -2.6), bb(1.5, -2.6), bb(1.5, 2.6), bb(-1.5, 2.6)])} fill="#F4F5FF" opacity={0.85} />
            </g>
          );
        })()
      : null;
  return (
    <g>
      {objeto === 'halter' ? halter(c, g, id) : null}
      {garrafaEl}
      <Vol id={id} ds={f.ds} cor={pele} sombra={sombraPele(pele)} s={0.9} luzDir={c.L} rim={rim} />
      {linhas}
      {objeto === 'copo' ? copo(c, g, id, 'frente') : null}
      {f.frente.length ? <Vol id={`${id}f`} ds={f.frente} cor={pele} sombra={sombraPele(pele)} s={0.6} luzDir={c.L} rim={rim} /> : null}
      {f.unha.map((u, k) => (
        <path key={`un${k}`} d={elipse(u, 0.62 * g.k, 0.4 * g.k, Math.atan2(g.d[1], g.d[0]) / RAD)} fill={clara(pele, 0.35)} opacity={0.9} />
      ))}
      {objeto === 'copo' ? (
        // os dedos por cima do vidro
        <path
          d={suave([g.b(0.22 * g.L, 1.9), g.b(0.6 * g.L, 1.7), g.b(0.66 * g.L, 0.2), g.b(0.6 * g.L, -1.6), g.b(0.3 * g.L, -1.9)])}
          fill={pele}
          opacity={0.96}
        />
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ braços

/** o braço inteiro (pele, manga, relógio, mão) do lado i */
export const Braco: React.FC<{ c: Ctx; i: 0 | 1; segura?: 'halter' | 'copo' }> = ({ c, i, segura }) => {
  const { j, corpo, roupa, uid } = c;
  const cima = roupa.cima;
  const manga = mangaDe(cima);
  const id = `${uid}-br${i}`;
  const pele = atras(c, c.pele, i, true);
  const cor = atras(c, cima.cor, i);
  const cor2 = cima.cor2 ? atras(c, cima.cor2, i) : undefined;
  const ombro = j.ombro[i];
  const cot = j.cotovelo[i];
  const pu = j.punho[i];
  const rimP = { cor: rimDe(c, pele, i === 1 ? 0.62 : 0.4), r: 0.42 };
  const rimR = { cor: rimDe(c, cor, i === 1 ? 0.55 : 0.35), r: 0.42 };
  const braco = suave(membro(ombro, cot, corpo.braco));
  const ante = suave(membro(cot, pu, corpo.antebraco));
  const el: React.ReactNode[] = [];
  const precisaPele = manga !== 'longa';
  if (precisaPele) el.push(<Vol key="p" id={`${id}p`} ds={[braco, ante]} cor={pele} sombra={sombraPele(pele)} s={1.2} luzDir={c.L} rim={rimP} />);
  const e = cima.tipo === 'moletom' || cima.tipo === 'pijama' ? 1.0 : cima.tipo === 'blazer' ? 0.85 : 0.55;
  if (manga === 'curta' || manga === 'blusa') {
    const fim = manga === 'blusa' ? 0.56 : 0.46;
    const perf = folga(corpo.braco, e + (manga === 'blusa' ? 0.4 : 0), 0, fim);
    if (manga === 'blusa') {
      // manga levemente evasê
      perf[perf.length - 1][1] += 0.7;
      perf[perf.length - 1][2] += 0.7;
    }
    el.push(<Vol key="m" id={`${id}m`} ds={[suave(membro(ombro, cot, perf))]} cor={cor} sombra={sombra(cor)} s={1.3} luzDir={c.L} rim={rimR} />);
    // barra da manga
    const L = dist(ombro, cot);
    const d: P = [(cot[0] - ombro[0]) / L, (cot[1] - ombro[1]) / L];
    const n: P = [d[1], -d[0]];
    const [rf, rb] = [perf[perf.length - 1][1], perf[perf.length - 1][2]];
    const m = add(ombro, mul(d, L * fim));
    const barraCor = cor2 && cima.tipo === 'camiseta' ? cor2 : sombra(cor, 0.5);
    el.push(<path key="mb" d={poli([add(m, mul(n, rf)), add(m, mul(n, -rb)), add(add(m, mul(n, -rb)), mul(d, -1.1)), add(add(m, mul(n, rf)), mul(d, -1.1))])} fill={barraCor} />);
  } else if (manga === 'dobrada') {
    // camisa com a manga dobrada logo abaixo do cotovelo
    const ds = [suave(membro(ombro, cot, folga(corpo.braco, e))), suave(membro(cot, pu, folga(corpo.antebraco, e, 0, 0.16)))];
    el.push(<Vol key="m" id={`${id}m`} ds={ds} cor={cor} sombra={sombra(cor)} s={1.3} luzDir={c.L} rim={rimR} />);
    const L = dist(cot, pu);
    const d: P = [(pu[0] - cot[0]) / L, (pu[1] - cot[1]) / L];
    const n: P = [d[1], -d[0]];
    const m0 = add(cot, mul(d, L * 0.05));
    const m1 = add(cot, mul(d, L * 0.2));
    const r0 = 2.35 * (corpo.braco[0][1] / 3.7) + e + 0.5;
    el.push(<Vol key="dob" id={`${id}d`} ds={[suave([add(m0, mul(n, r0)), add(m1, mul(n, r0 - 0.1)), add(m1, mul(n, -r0 + 0.1)), add(m0, mul(n, -r0))], true, 0.4)]} cor={clara(cor, 0.12)} sombra={sombra(cor, 0.6)} s={0.6} luzDir={c.L} />);
  } else if (manga === 'longa') {
    const pele2 = suave(membro(add(pu, mul(sub(cot, pu), 0.12)), pu, [[0, 1.8, 1.8], [1, 1.65, 1.65]]));
    el.push(<Vol key="pp" id={`${id}pp`} ds={[pele2]} cor={pele} sombra={sombraPele(pele)} s={0.6} luzDir={c.L} />);
    const fimAnte = cima.tipo === 'moletom' ? 0.97 : 0.93;
    if (cima.tipo === 'blazer' && cor2) {
      // o punho da camisa aparecendo
      el.push(<Vol key="pc" id={`${id}pc`} ds={[suave(membro(cot, pu, folga(corpo.antebraco, 0.45, 0.7, 0.98)))]} cor={cor2} sombra={sombra(cor2)} s={0.8} luzDir={c.L} />);
    }
    const ds = [suave(membro(ombro, cot, folga(corpo.braco, e))), suave(membro(cot, pu, folga(corpo.antebraco, e, 0, cima.tipo === 'blazer' ? 0.86 : fimAnte)))];
    el.push(<Vol key="m" id={`${id}m`} ds={ds} cor={cor} sombra={sombra(cor)} s={1.3} luzDir={c.L} rim={rimR} />);
    // punho (ribana do moletom, viés do pijama, debrum da manga longa)
    const L = dist(cot, pu);
    const d: P = [(pu[0] - cot[0]) / L, (pu[1] - cot[1]) / L];
    const n: P = [d[1], -d[0]];
    const t1 = cima.tipo === 'blazer' ? 0.86 : fimAnte;
    const t0 = t1 - (cima.tipo === 'moletom' ? 0.14 : 0.07);
    const r = 1.75 * (corpo.braco[0][1] / 3.7) + e * 0.9;
    const corPunho = cima.tipo === 'pijama' && cor2 ? cor2 : cima.tipo === 'manga-longa' && cor2 ? cor2 : sombra(cor, 0.45);
    const a0 = add(cot, mul(d, L * t0));
    const a1 = add(cot, mul(d, L * t1));
    el.push(<path key="pu" d={poli([add(a0, mul(n, r + 0.15)), add(a1, mul(n, r)), add(a1, mul(n, -r)), add(a0, mul(n, -r - 0.15))])} fill={corPunho} />);
    if (cima.tipo === 'manga-longa' && cor2) {
      // listra ao longo da manga (manga longa esportiva)
      const s0 = add(ombro, mul(sub(cot, ombro), 0.1));
      el.push(<path key="li" d={`M${s0[0]} ${s0[1]}L${cot[0]} ${cot[1]}L${a0[0]} ${a0[1]}`} stroke={cor2} strokeWidth={0.6} fill="none" strokeLinejoin="round" opacity={0.9} />);
    }
  }
  // relógio no punho da frente
  if (i === 1 && roupa.extras?.includes('relogio') && manga !== 'longa') {
    const L = dist(cot, pu);
    const d: P = [(pu[0] - cot[0]) / L, (pu[1] - cot[1]) / L];
    const n: P = [d[1], -d[0]];
    const m = add(cot, mul(d, L * 0.88));
    const r = 1.95;
    el.push(<path key="rp" d={poli([add(m, add(mul(n, r), mul(d, -0.8))), add(m, add(mul(n, r), mul(d, 0.8))), add(m, add(mul(n, -r), mul(d, 0.8))), add(m, add(mul(n, -r), mul(d, -0.8)))])} fill="#20264A" />);
    const face = add(m, mul(n, 0.9));
    el.push(<path key="rf" d={elipse(face, 1.25, 1.05, angDe(cot, pu) * -1)} fill="#121634" />);
    el.push(<path key="rg" d={elipse(face, 0.7, 0.55, angDe(cot, pu) * -1)} fill={c.pessoa.cor} opacity={0.95} />);
  }
  el.push(<Mao key="mao" c={c} i={i} segura={i === 1 ? segura : undefined} garrafa={i === 0 && roupa.extras?.includes('garrafa')} />);
  void lerp;
  void mix;
  return <g>{el}</g>;
};
