// Traço editorial — a cabeça: contorno por vista, olhos amendoados com brilho, sobrancelha, nariz
// (sombra, não linha), boca por humor, orelhas, bochecha, barba, óculos, brinco, o cabelo (12
// tipos, com volume, sombra e brilho) e os acessórios de cabeça (boné, faixa, fone).
// Tudo é desenhado no espaço LOCAL da cabeça (centro na origem, y pra baixo, gira com ela).
//
// O DEDO NA PELE: quando a mão da frente aponta e encosta na bochecha, o contorno da bochecha
// afunda em volta da ponta do dedo (e estufa um tico dos lados), aparece a covinha de sombra em
// volta da ponta e o olho daquele lado aperta um pouco — a pele cede de verdade.
import React from 'react';
import type { Humor } from '../../esqueleto';
import { type Ctx, rimDe } from './ctx';
import { type P, add, denso, dist, dirDe, elipse, gira, linhaFechada, lerp, mul, poli, sub, suave, clamp01, canto, type Q } from './geo';
import { Vol } from './Vol';
import { clara, lum, mix, sombra, sombraPele } from './cor';
import { CONTORNO, OLHOS, ORELHAS } from './rosto';
import { cabeloAtras, cabeloFrente } from './cabelo';

const RAD = Math.PI / 180;

/** local da cabeça → mundo */
export const mundo = (c: Ctx) => {
  const a = c.j.ang.cabeca * RAD;
  const [cx, cy] = c.j.cabeca;
  return (p: P): P => [cx + p[0] * Math.cos(a) - p[1] * Math.sin(a), cy + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
/** mundo → local da cabeça */
export const local = (c: Ctx) => {
  const a = c.j.ang.cabeca * RAD;
  const [cx, cy] = c.j.cabeca;
  return (p: P): P => {
    const x = p[0] - cx;
    const y = p[1] - cy;
    return [x * Math.cos(a) + y * Math.sin(a), -x * Math.sin(a) + y * Math.cos(a)];
  };
};

/** o contorno da cabeça em unidades locais (já denso) */
export const contornoLocal = (c: Ctx): P[] => {
  const W = c.prop.cabecaLarg;
  const H = c.prop.cabeca;
  const m = c.pessoa.genero === 'm';
  const magro = c.pessoa.idade === 'idoso' ? 0.97 : 1;
  const largo = c.pessoa.corpo === 'largo' ? 1.07 : c.pessoa.corpo === 'forte' && m ? 1.03 : 1;
  return denso(
    // rosto mais cheio embaixo (bochecha/mandíbula) no corpo largo, sem quina
    CONTORNO[c.j.vista](m).map(([x, y]) => [x * W * magro * (1 + (largo - 1) * Math.max(0, Math.min(1, (y + 0.05) / 0.35))), y * H] as P),
    6,
  );
};

/** a sombra que o queixo joga no pescoço (mundo) */
export const sombraQueixo = (c: Ctx): string => {
  const w = mundo(c);
  const dx = c.j.vista === 'frente' ? -0.4 : -0.9;
  return linhaFechada(contornoLocal(c).map((p) => w([p[0] + dx, p[1] + 1.2])));
};

/** quanto a pele cede no toque (0..1) e onde — calculado pela PONTA do dedo desenhado */
export const toqueDe = (c: Ctx, toque?: { ponto: [number, number]; forca: number }) => {
  if (!toque) return null;
  const { j, prop } = c;
  const W = prop.cabecaLarg;
  if (j.mao[1] !== 'aponta') return null;
  const d = dirDe(j.ang.mao[1]);
  const ponta = add(j.punho[1], mul(d, 0.85 * prop.mao));
  // a pose para o dedo 5% de W fora do ponto e afunda até 3% pra dentro (poses.tocarRosto)
  const fora = ponta[0] - toque.ponto[0];
  if (fora > 0.08 * W) return null;
  const aperto = clamp01((0.05 * W - fora) / (0.08 * W));
  return { ponta, d, aperto };
};

// ------------------------------------------------------------------ olhos, boca, nariz

type Expr = { abre: number; sobeBaixo: number; sobr: [number, number]; arco: number };
const EXPR: Record<Humor, Expr> = {
  ok: { abre: 1, sobeBaixo: 0.05, sobr: [0, 0], arco: 0.35 },
  feliz: { abre: 0.78, sobeBaixo: 0.45, sobr: [-0.35, -0.3], arco: 0.5 },
  cansado: { abre: 0.42, sobeBaixo: 0, sobr: [-0.7, 0.35], arco: 0.15 },
  focado: { abre: 0.74, sobeBaixo: 0.22, sobr: [0.3, 0.1], arco: 0.1 },
  surpresa: { abre: 1.3, sobeBaixo: 0, sobr: [-1.7, -0.95], arco: 0.5 },
};

const corOlho = (pele: string) => (lum(pele) > 0.78 ? '#46698A' : '#3B2418');

const OlhoEl: React.FC<{
  c: Ctx;
  o: { c: P; ew: number; lado: 1 | -1; fs: number };
  abre: number;
  sobe: number;
  humor: Humor;
  id: string;
  W: number;
  H: number;
}> = ({ c, o, abre, sobe, humor, id, W, H }) => {
  const s = o.lado;
  const cx = o.c[0] * W;
  const cy = o.c[1] * H;
  const ew = o.ew * W;
  const eh = 1.0 * (o.fs < 0.6 ? 0.85 : 1);
  const el = 0.62;
  const perfil = o.fs < 0.6;
  const I: P = perfil ? [cx - ew * 0.6, cy + 0.15] : [cx - s * ew, cy + 0.08];
  const O: P = perfil ? [cx + ew, cy - 0.05] : [cx + s * ew, cy - 0.14];
  const escuro = '#1B1220';
  const fem = c.pessoa.genero === 'f';
  if (abre < 0.12) {
    // fechado: a linha dos cílios curva pra baixo (no feliz, curva pra cima)
    const cv = humor === 'feliz' ? -0.7 : 0.55;
    return <path d={`M${I[0]} ${I[1]}Q${cx} ${cy + cv} ${O[0]} ${O[1]}`} stroke={escuro} strokeWidth={0.42} fill="none" strokeLinecap="round" />;
  }
  const topo = cy - eh * 2 * abre;
  const baixo = cy + el * 2 * (1 - sobe);
  const branco = `M${I[0]} ${I[1]}Q${cx + s * 0.1 * ew} ${topo} ${O[0]} ${O[1]}Q${cx} ${baixo} ${I[0]} ${I[1]}Z`;
  const ir = Math.min(ew * 0.62, 1.05);
  const ix = cx + (perfil ? ew * 0.35 : s * 0.06 * ew);
  const iy = cy + 0.08;
  const cid = `${id}-o`;
  const lid = `M${I[0] - (perfil ? 0 : s * 0.1)} ${I[1]}Q${cx + s * 0.1 * ew} ${topo - 0.08} ${O[0] + (fem ? s * 0.35 : 0)} ${O[1] - (fem ? 0.3 : 0)}`;
  return (
    <g>
      <defs>
        <clipPath id={cid}>
          <path d={branco} />
        </clipPath>
      </defs>
      <path d={branco} fill="#F4EEE9" />
      <g clipPath={`url(#${cid})`}>
        <circle cx={ix} cy={iy} r={ir} fill={corOlho(c.pele)} />
        <circle cx={ix} cy={iy} r={ir * 0.5} fill="#120C10" />
        <circle cx={ix + ir * 0.38} cy={iy - ir * 0.42} r={ir * 0.3} fill="#FFFFFF" />
        {/* a pálpebra de cima faz sombra no branco */}
        <path d={`M${I[0]} ${I[1]}Q${cx + s * 0.1 * ew} ${topo} ${O[0]} ${O[1]}L${O[0]} ${O[1] - 3}L${I[0]} ${I[1] - 3}Z`} transform="translate(0 0.45)" fill={sombraPele(c.pele, 1.2)} opacity={0.35} />
      </g>
      <path d={lid} stroke={escuro} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      {/* vinco da pálpebra */}
      {abre > 0.5 && !perfil ? <path d={`M${cx - s * ew * 0.55} ${topo - 0.75}Q${cx + s * 0.1 * ew} ${topo - 1.25} ${cx + s * ew * 0.85} ${O[1] - 0.95}`} stroke={sombraPele(c.pele, 0.9)} strokeWidth={0.26} fill="none" strokeLinecap="round" opacity={0.75} /> : null}
    </g>
  );
};

const Sobrancelha: React.FC<{ o: { c: P; ew: number; lado: 1 | -1; fs: number }; e: Expr; cor: string; W: number; H: number; m: boolean; extra?: number }> = ({ o, e, cor, W, H, m, extra = 0 }) => {
  const s = o.lado;
  const cx = o.c[0] * W;
  const cy = o.c[1] * H - 2.65 + extra;
  const ew = o.ew * W;
  const perfil = o.fs < 0.6;
  const ini: P = perfil ? [cx - ew * 0.7, cy + e.sobr[0] * 0.8] : [cx - s * ew * 0.95, cy + e.sobr[0]];
  const fim: P = perfil ? [cx + ew * 1.4, cy + 0.3 + e.sobr[1]] : [cx + s * ew * 1.3, cy + 0.35 + e.sobr[1]];
  const meio: P = [lerp(ini[0], fim[0], 0.55), Math.min(ini[1], fim[1]) - 0.45 - e.arco];
  const g1 = m ? 0.95 : 0.72;
  const g2 = m ? 0.5 : 0.28;
  const pts: Q[] = [
    [ini[0], ini[1] - g1 * 0.55],
    [meio[0], meio[1] - g1 * 0.45],
    canto([fim[0], fim[1] - g2 * 0.3]),
    canto([fim[0], fim[1] + g2 * 0.3]),
    [meio[0], meio[1] + g1 * 0.45],
    [ini[0], ini[1] + g1 * 0.45],
  ];
  return <path d={suave(pts)} fill={cor} />;
};

const Boca: React.FC<{ c: Ctx; humor: Humor; W: number; H: number; id: string }> = ({ c, humor, W, H, id }) => {
  const v = c.j.vista;
  const m = c.pessoa.genero === 'm';
  const bx = (v === 'frente' ? 0 : v === 'tres-quartos' ? 0.2 : 0.4) * W;
  const by = 0.27 * H;
  const mw = (m ? 2.35 : 2.15) * (c.pessoa.idade === 'idoso' ? 0.95 : 1);
  const L = v === 'perfil' ? mw * 0.75 : mw;
  const R = v === 'frente' ? mw : v === 'tres-quartos' ? mw * 0.66 : 0.2;
  const labio = mix(c.pele, c.corpo.labio, m ? 0.32 : 0.6);
  const labioS = sombraPele(labio, 0.8);
  const escuro = mix('#4A1424', c.pele, 0.12);
  if (humor === 'feliz') {
    const top = by - 0.55;
    const fundo = by + 3.0;
    const d = `M${bx - L * 1.08} ${top}Q${bx} ${top + 0.6} ${bx + R * 1.08} ${top}Q${bx + R * 0.4} ${fundo} ${bx - L * 0.2} ${fundo - 0.2}Q${bx - L * 1.0} ${fundo - 0.9} ${bx - L * 1.08} ${top}Z`;
    return (
      <g>
        <defs>
          <clipPath id={`${id}-b`}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={escuro} />
        <g clipPath={`url(#${id}-b)`}>
          <rect x={bx - L * 1.2} y={top - 1} width={L * 1.2 + R * 1.2} height={1.95} fill="#FBF6F0" />
          <ellipse cx={bx - L * 0.1} cy={fundo + 0.2} rx={L * 0.75} ry={1.3} fill="#D9616F" />
        </g>
        <path d={`M${bx - L * 0.7} ${fundo - 0.25}Q${bx - L * 0.1} ${fundo + 0.75} ${bx + R * 0.5} ${fundo - 0.6}`} stroke={labio} strokeWidth={0.6} fill="none" strokeLinecap="round" opacity={m ? 0.5 : 0.9} />
      </g>
    );
  }
  if (humor === 'surpresa') {
    return (
      <g>
        <ellipse cx={bx + (R - L) * 0.2} cy={by + 0.6} rx={(L + R) * 0.24} ry={1.35} fill={escuro} />
        <ellipse cx={bx + (R - L) * 0.2} cy={by + 1.95} rx={(L + R) * 0.2} ry={0.35} fill={labio} opacity={0.8} />
      </g>
    );
  }
  // fechada: lábios + a linha da boca (sorriso leve no ok, reta no focado, caída no cansado)
  const curva = humor === 'ok' ? 0.75 : humor === 'focado' ? 0.05 : -0.45;
  const enc = humor === 'focado' ? 0.82 : humor === 'cansado' ? 0.85 : 1;
  const l = L * enc;
  const r = R * enc;
  const cantoY = by - (humor === 'ok' ? 0.18 : humor === 'cansado' ? -0.25 : 0);
  const sup = `M${bx - l} ${cantoY}Q${bx - l * 0.5} ${by - 0.95} ${bx - l * 0.1} ${by - 0.7}Q${bx} ${by - 0.55} ${bx + r * 0.15} ${by - 0.7}Q${bx + r * 0.5} ${by - 0.95} ${bx + r} ${cantoY}Q${bx} ${by + curva * 0.6} ${bx - l} ${cantoY}Z`;
  const inf = `M${bx - l * 0.85} ${cantoY + 0.15}Q${bx} ${by + curva * 0.55} ${bx + r * 0.85} ${cantoY + 0.15}Q${bx + r * 0.4} ${by + 1.65} ${bx} ${by + 1.6}Q${bx - l * 0.5} ${by + 1.65} ${bx - l * 0.85} ${cantoY + 0.15}Z`;
  return (
    <g>
      <path d={inf} fill={labio} opacity={m ? 0.55 : 1} />
      <path d={sup} fill={labioS} opacity={m ? 0.55 : 1} />
      {!m ? <ellipse cx={bx - l * 0.2} cy={by + 0.95} rx={l * 0.3} ry={0.22} fill={clara(labio, 0.4)} opacity={0.7} /> : null}
      <path d={`M${bx - l * 1.03} ${cantoY - 0.05}Q${bx} ${by + curva} ${bx + r * 1.03} ${cantoY - 0.05}`} stroke={mix(escuro, labioS, 0.3)} strokeWidth={0.42} fill="none" strokeLinecap="round" />
      {m ? <path d={`M${bx - l * 0.45} ${by + 2.2}Q${bx} ${by + 2.55} ${bx + r * 0.45} ${by + 2.2}`} stroke={sombraPele(c.pele, 0.6)} strokeWidth={0.5} fill="none" strokeLinecap="round" opacity={0.7} /> : null}
    </g>
  );
};

const Nariz: React.FC<{ c: Ctx; W: number; H: number }> = ({ c, W, H }) => {
  const v = c.j.vista;
  const sp = sombraPele(c.pele, 0.85);
  const ny = 0.18 * H;
  if (v === 'frente') {
    return (
      <g>
        <path d={suave([[-0.35, 0.6], [-0.65, 2.6], [-1.15, 3.9], [-0.7, 3.8], [-0.2, 2.4]])} fill={sp} opacity={0.75} />
        <path d={suave([[-1.75, ny - 0.4], [-1.0, ny + 0.45], [0, ny + 0.3], [1.0, ny + 0.45], [1.7, ny - 0.4], [0.9, ny - 0.05], [0, ny - 0.25], [-0.95, ny - 0.05]])} fill={sp} />
        <ellipse cx={0.35} cy={ny - 1.0} rx={0.62} ry={0.42} fill={clara(c.pele, 0.22)} opacity={0.8} />
      </g>
    );
  }
  if (v === 'tres-quartos') {
    const x0 = 0.11 * W;
    return (
      <g>
        {/* a lateral do nariz (sombra suave) e a base com a narina */}
        <path d={suave([[x0 + 0.1, 1.4], [x0 + 0.5, 3.0], [x0 + 0.95, 3.9], [x0 + 1.3, 3.4], [x0 + 0.75, 2.2]])} fill={sp} opacity={0.55} />
        <path d={suave([[x0 + 0.7, ny - 0.5], [x0 + 1.4, ny + 0.5], [x0 + 2.6, ny + 0.55], [x0 + 3.3, ny + 0.05], [x0 + 3.1, ny - 0.35], [x0 + 2.4, ny - 0.1], [x0 + 1.6, ny - 0.15]])} fill={sp} />
        <ellipse cx={x0 + 2.6} cy={ny - 1.1} rx={0.6} ry={0.42} fill={clara(c.pele, 0.22)} opacity={0.8} />
      </g>
    );
  }
  return <path d={suave([[0.44 * W, ny - 0.2], [0.5 * W, ny + 0.4], [0.47 * W, ny + 0.6], [0.43 * W, ny + 0.3]])} fill={sp} />;
};

// ------------------------------------------------------------------ cabeça montada

export type CabecaProps = { c: Ctx; humor: Humor; toque?: { ponto: [number, number]; forca: number } };

/** o cabelo de trás (vai antes do tronco) */
export const CabecaAtras: React.FC<CabecaProps> = ({ c }) => {
  const [cx, cy] = c.j.cabeca;
  const Ll = gira(c.L, -c.j.ang.cabeca);
  const el = cabeloAtras(c, Ll);
  if (!el) return null;
  return <g transform={`translate(${cx} ${cy}) rotate(${c.j.ang.cabeca})`}>{el}</g>;
};

export const Cabeca: React.FC<CabecaProps> = ({ c, humor, toque }) => {
  const { prop, pessoa, uid, j } = c;
  const W = prop.cabecaLarg;
  const H = prop.cabeca;
  const v = j.vista;
  const m = pessoa.genero === 'm';
  const id = `${uid}-cab`;
  const Ll = gira(c.L, -j.ang.cabeca);
  const pele = c.pele;
  const peleS = c.peleS;

  // o toque: deforma o contorno em volta da ponta do dedo
  let cont = contornoLocal(c);
  const tq = toqueDe(c, toque);
  let cova: React.ReactNode = null;
  let apertaOlho = 0;
  if (tq && tq.aperto > 0) {
    const lc = local(c);
    const pontaL = lc(tq.ponta);
    const dDedo = gira(tq.d, -j.ang.cabeca);
    // o ponto de contato: o ponto do contorno mais perto da ponta do dedo
    let best = 0;
    let bd = Infinity;
    cont.forEach((p, k) => {
      const dd = dist(p, pontaL);
      if (dd < bd) {
        bd = dd;
        best = k;
      }
    });
    const contato = cont[best];
    // a pele afunda entre a direção do dedo e a normal da bochecha (pra dentro)
    const nx = contato[0];
    const ny = contato[1] - 0.05 * H;
    const nn = Math.hypot(nx, ny) || 1;
    const mx = dDedo[0] * 0.5 - (nx / nn) * 0.5;
    const my = dDedo[1] * 0.5 - (ny / nn) * 0.5;
    const mm = Math.hypot(mx, my) || 1;
    const dl: P = [mx / mm, my / mm];
    // o contorno cede em volta da ponta (mais largo que o dedo, pra a curva aparecer dos dois
    // lados) e estufa um tico logo depois — a pele foi empurrada, não cortada
    const fundo = 0.45 + tq.aperto * 2.3;
    const sig = 2.0;
    cont = cont.map((p) => {
      const r = dist(p, contato);
      const g = Math.exp(-((r / sig) ** 2));
      const b = Math.exp(-(((r - 2.3 * sig) / (0.9 * sig)) ** 2));
      return add(p, mul(dl, fundo * g - 0.45 * fundo * b));
    });
    apertaOlho = tq.aperto * 0.6;
    const fundoP = add(contato, mul(dl, fundo));
    const pp: P = [-dl[1], dl[0]];
    const ang = Math.atan2(dl[1], dl[0]) / RAD;
    const a = tq.aperto;
    // vincos: arcos em volta da ponta do dedo (do lado do rosto), como pele que amassa
    const pontaD = add(pontaL, mul(dDedo, -0.2));
    const angD = Math.atan2(dl[1], dl[0]);
    const vinco = (k: number) => {
      const r = 1.55 + k * 0.85;
      const abre = (0.95 - k * 0.25) * Math.PI * 0.5;
      const p0: P = [pontaD[0] + Math.cos(angD - abre) * r, pontaD[1] + Math.sin(angD - abre) * r];
      const p1: P = [pontaD[0] + Math.cos(angD + abre) * r, pontaD[1] + Math.sin(angD + abre) * r];
      return `M${p0[0]} ${p0[1]}A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`;
    };
    cova = (
      <g>
        {/* a covinha: um anel de sombra em volta da ponta do dedo */}
        <path d={elipse(add(fundoP, mul(dl, -0.5)), 1.7 + a * 0.5, 2.3 + a * 0.4, ang)} fill={sombraPele(pele, 1.1)} opacity={0.4 + a * 0.4} />
        {/* a pele amassando: dois vincos na frente do dedo, que aparecem com a força */}
        <path d={vinco(0)} stroke={sombraPele(pele, 1.0)} strokeWidth={0.32 + a * 0.18} fill="none" strokeLinecap="round" opacity={clamp01(a * 1.6) * 0.85} />
        <path d={vinco(1)} stroke={sombraPele(pele, 0.9)} strokeWidth={0.26 + a * 0.12} fill="none" strokeLinecap="round" opacity={clamp01(a * 1.6 - 0.4) * 0.7} />
        {/* o brilho da pele esticada entre os vincos */}
        <path d={vinco(0.5)} stroke={clara(pele, 0.3)} strokeWidth={0.3} fill="none" strokeLinecap="round" opacity={clamp01(a * 1.6) * 0.6} />
      </g>
    );
  }
  const cabecaD = linhaFechada(cont);
  const e = EXPR[humor];
  // não pisca enquanto o dedo aperta (o quadro-chave do toque é de olho aberto)
  const fecha = Math.max(j.fecha, tq && tq.aperto > 0 ? 0 : piscar(c.t, pessoa.id));
  const abre = e.abre * (1 - fecha);
  const corSobr = lum(pessoa.corCabelo) > 0.6 ? mix(pessoa.corCabelo, '#6B6577', 0.45) : mix(pessoa.corCabelo, '#000000', 0.15);
  const orelhas = ORELHAS[v];
  const orelha = (o: (typeof orelhas)[number], k: number) => {
    const ox = o.c[0] * W;
    const oy = o.c[1] * H;
    const rx = o.rx * W;
    const ry = o.ry * H;
    const s = o.lado;
    const forma = o.atras
      ? suave([[ox - s * rx * 0.9, oy - ry * 0.8], [ox + s * rx * 0.6, oy - ry * 1.0], [ox + s * rx * 1.1, oy - ry * 0.2], [ox + s * rx * 0.7, oy + ry * 0.75], [ox - s * rx * 0.2, oy + ry * 1.05], [ox - s * rx * 1.0, oy + ry * 0.6]])
      : elipse([ox, oy], rx, ry, -8);
    const dentro = o.atras
      ? suave([[ox + s * rx * 0.05, oy - ry * 0.55], [ox + s * rx * 0.6, oy - ry * 0.2], [ox + s * rx * 0.35, oy + ry * 0.45], [ox, oy + ry * 0.2]])
      : suave([[ox + rx * 0.35, oy - ry * 0.6], [ox - rx * 0.4, oy - ry * 0.45], [ox - rx * 0.5, oy + ry * 0.25], [ox - rx * 0.05, oy + ry * 0.55], [ox + rx * 0.1, oy + ry * 0.05]]);
    const lobo: P = o.atras ? [ox + s * rx * 0.1, oy + ry * 0.95] : [ox - rx * 0.05, oy + ry * 0.95];
    return (
      <g key={`or${k}`}>
        <Vol id={`${id}-or${k}`} ds={[forma]} cor={pele} sombra={peleS} s={0.6} luzDir={Ll} />
        <path d={dentro} fill={sombraPele(pele, 1.0)} opacity={0.8} />
        {pessoa.brinco ? (
          <g>
            <circle cx={lobo[0]} cy={lobo[1] + 1.1} r={1.05} fill="none" stroke="#FFC83D" strokeWidth={0.42} />
            <circle cx={lobo[0] + 0.3} cy={lobo[1] + 0.6} r={0.22} fill="#FFF1C2" />
          </g>
        ) : null}
      </g>
    );
  };
  const olhos = OLHOS[v];
  const blush = mix(pele, '#FF5A6E', 0.4);
  const blushes: P[] = v === 'frente' ? [[-0.27, 0.16], [0.27, 0.16]] : v === 'tres-quartos' ? [[0.0, 0.17], [0.37, 0.15]] : [[0.22, 0.16]];

  // barba (recortada pelo contorno da cabeça)
  const barba = pessoa.barba;
  const cid = `${id}-clip`;
  const regiaoBarba = (): Q[] => {
    if (v === 'frente')
      return [[-0.62, 0.02], [-0.47, 0.03], [-0.36, 0.22], [-0.18, 0.205], [0, 0.215], [0.18, 0.205], [0.36, 0.22], [0.47, 0.03], [0.62, 0.02], [0.62, 0.9], [-0.62, 0.9]].map(([x, y]) => [x * W, y * H] as P);
    if (v === 'tres-quartos')
      return [[-0.24, -0.02], [-0.13, 0.25], [0.06, 0.22], [0.2, 0.215], [0.32, 0.2], [0.44, 0.15], [0.7, 0.12], [0.7, 0.9], [-0.3, 0.9], [-0.33, 0.3]].map(([x, y]) => [x * W, y * H] as P);
    return [[-0.04, -0.02], [0.06, 0.25], [0.3, 0.205], [0.46, 0.21], [0.7, 0.2], [0.7, 0.9], [-0.2, 0.9], [-0.16, 0.38]].map(([x, y]) => [x * W, y * H] as P);
  };
  const corBarba = pessoa.corCabelo;
  const bigode = () => {
    const bx = (v === 'frente' ? 0 : v === 'tres-quartos' ? 0.2 : 0.4) * W;
    const by = 0.27 * H - 1.2;
    const L = v === 'perfil' ? 2.0 : 2.9;
    const R = v === 'frente' ? 2.9 : v === 'tres-quartos' ? 2.0 : 0.4;
    return suave([[bx - L, by + 0.9], [bx - L * 0.5, by - 0.35], [bx, by - 0.15], [bx + R * 0.5, by - 0.35], [bx + R, by + 0.9], [bx + R * 0.5, by + 0.55], [bx, by + 0.7], [bx - L * 0.5, by + 0.55]]);
  };

  return (
    <g transform={`translate(${j.cabeca[0]} ${j.cabeca[1]}) rotate(${j.ang.cabeca})`}>
      <defs>
        <clipPath id={cid}>
          <path d={cabecaD} />
        </clipPath>
      </defs>
      {orelhas.filter((o) => o.atras).map((o, k) => orelha(o, k))}
      <Vol id={id} ds={[cabecaD]} cor={pele} sombra={peleS} s={2.4} luzDir={Ll} rim={{ cor: rimDe(c, pele, 0.65), r: 0.55 }} />
      {cova ? <g clipPath={`url(#${cid})`}>{cova}</g> : null}
      {/* bochechas */}
      {blushes.map(([x, y], k) => (
        <ellipse key={`bl${k}`} cx={x * W} cy={y * H} rx={(k === 1 && v === 'tres-quartos' ? 1.6 : 2.3)} ry={1.25} fill={blush} opacity={humor === 'feliz' ? 0.42 : 0.26} />
      ))}
      {/* barba rala / cheia */}
      {barba === 'rala' || barba === 'cheia' ? (
        <g clipPath={`url(#${cid})`}>
          {barba === 'rala' ? (
            <path d={suave(regiaoBarba(), true, 0.6)} fill={corBarba} opacity={0.3} />
          ) : (
            <Vol id={`${id}-bb`} ds={[suave(regiaoBarba(), true, 0.6)]} cor={corBarba} sombra={sombra(corBarba)} s={1.6} luzDir={Ll} />
          )}
        </g>
      ) : null}
      {barba === 'cheia' ? (
        // o volume da barba passa um pouco do queixo
        <path d={elipse([(v === 'frente' ? 0 : v === 'tres-quartos' ? 0.16 : 0.3) * W, 0.47 * H], (v === 'frente' ? 0.3 : 0.24) * W, 0.07 * H)} fill={corBarba} />
      ) : null}
      {orelhas.filter((o) => !o.atras).map((o, k) => orelha(o, k + 2))}
      <Nariz c={c} W={W} H={H} />
      {olhos.map((o, k) => (
        <OlhoEl key={`ol${k}`} c={c} o={o} abre={abre * (k === olhos.length - 1 && v !== 'frente' ? 1 - apertaOlho * 0.5 : 1)} sobe={Math.min(0.9, e.sobeBaixo + (k === olhos.length - 1 ? apertaOlho : 0))} humor={humor} id={`${id}-ol${k}`} W={W} H={H} />
      ))}
      {olhos.map((o, k) => (
        <Sobrancelha key={`sb${k}`} o={o} e={e} cor={corSobr} W={W} H={H} m={m} />
      ))}
      {humor === 'cansado' ? olhos.map((o, k) => <path key={`ol${k}`} d={`M${o.c[0] * W - o.ew * W * 0.8} ${o.c[1] * H + 1.6}Q${o.c[0] * W} ${o.c[1] * H + 2.5} ${o.c[0] * W + o.ew * W * 0.8} ${o.c[1] * H + 1.5}`} stroke={sombraPele(pele, 1)} strokeWidth={0.45} fill="none" strokeLinecap="round" opacity={0.6} />) : null}
      {pessoa.idade === 'idoso' ? (
        // vincos do sorriso (nasolabial), discretos
        <g opacity={0.55}>
          {(v === 'frente' ? [-1, 1] : [-1]).map((s) => {
            const bx = (v === 'frente' ? 0 : v === 'tres-quartos' ? 0.2 : 0.4) * W;
            return <path key={`vi${s}`} d={`M${bx + s * 2.6} ${0.17 * H}Q${bx + s * 3.6} ${0.24 * H} ${bx + s * 3.1} ${0.31 * H}`} stroke={sombraPele(pele, 1)} strokeWidth={0.42} fill="none" strokeLinecap="round" />;
          })}
        </g>
      ) : null}
      {barba === 'bigode' || barba === 'cheia' ? <Vol id={`${id}-bg`} ds={[bigode()]} cor={corBarba} sombra={sombra(corBarba)} s={0.6} luzDir={Ll} /> : null}
      <Boca c={c} humor={humor} W={W} H={H} id={id} />
      {cabeloFrente(c, Ll)}
      {pessoa.oculos ? <Oculos c={c} W={W} H={H} /> : null}
      <Chapeus c={c} W={W} H={H} Ll={Ll} />
    </g>
  );
};

/** piscar: a cada ~3,3 s, 4 quadros, com fase por pessoa */
const piscar = (t: number, id: string) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const k = (((t + h) % 97) + 97) % 97;
  return k < 4 ? Math.sin((k / 4) * Math.PI) : 0;
};

// ------------------------------------------------------------------ óculos e acessórios

const Oculos: React.FC<{ c: Ctx; W: number; H: number }> = ({ c, W, H }) => {
  const v = c.j.vista;
  let h = 0;
  for (const ch of c.pessoa.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const armacao = ['#1F2340', '#6B3A24', '#C99A3A'][h % 3];
  const sw = armacao === '#C99A3A' ? 0.32 : 0.48;
  const olhos = OLHOS[v];
  const lentes = olhos.map((o, k) => {
    const cx = o.c[0] * W;
    const cy = o.c[1] * H + 0.15;
    const w = (o.ew * W + 0.9) * (o.fs < 0.6 ? 0.45 : 1);
    const hh = 1.75;
    return (
      <g key={k}>
        <rect x={cx - w} y={cy - hh} width={w * 2} height={hh * 2} rx={1.2} fill="#CFE6FF" opacity={0.14} stroke={armacao} strokeWidth={sw} />
        <path d={`M${cx - w * 0.5} ${cy - hh * 0.55}L${cx - w * 0.05} ${cy - hh * 0.95}`} stroke="#FFFFFF" strokeWidth={0.32} opacity={0.6} strokeLinecap="round" />
      </g>
    );
  });
  const el: React.ReactNode[] = [lentes];
  if (v === 'frente') {
    const a = olhos[0];
    const b = olhos[1];
    el.push(<path key="ponte" d={`M${a.c[0] * W + a.ew * W + 0.9} ${a.c[1] * H - 0.4}Q0 ${a.c[1] * H - 1.2} ${b.c[0] * W - b.ew * W - 0.9} ${b.c[1] * H - 0.4}`} stroke={armacao} strokeWidth={sw} fill="none" />);
    for (const o of olhos) {
      const x = o.c[0] * W + o.lado * (o.ew * W + 0.9);
      el.push(<path key={`h${o.lado}`} d={`M${x} ${o.c[1] * H - 0.6}L${o.lado * 0.49 * W} ${o.c[1] * H - 0.5}`} stroke={armacao} strokeWidth={sw} />);
    }
  } else {
    const o = olhos[0];
    const x = o.c[0] * W - (o.ew * W + 0.9) * (o.fs < 0.6 ? 0.45 : 1);
    const orelha = ORELHAS[v][0];
    el.push(<path key="haste" d={`M${x} ${o.c[1] * H - 0.6}L${orelha.c[0] * W + 0.3} ${orelha.c[1] * H - 1.7}`} stroke={armacao} strokeWidth={sw} />);
    if (olhos.length > 1) {
      const b = olhos[1];
      el.push(<path key="ponte" d={`M${o.c[0] * W + o.ew * W + 0.9} ${o.c[1] * H - 0.4}Q${(o.c[0] + b.c[0]) * 0.5 * W} ${o.c[1] * H - 1.1} ${b.c[0] * W - b.ew * W - 0.9} ${b.c[1] * H - 0.4}`} stroke={armacao} strokeWidth={sw} fill="none" />);
    }
  }
  return <g>{el}</g>;
};

const Chapeus: React.FC<{ c: Ctx; W: number; H: number; Ll: P }> = ({ c, W, H, Ll }) => {
  const ex = c.roupa.extras ?? [];
  const v = c.j.vista;
  const id = `${c.uid}-ch`;
  const el: React.ReactNode[] = [];
  if (ex.includes('faixa')) {
    const cor = c.roupa.cima.cor2 ?? '#F4F5FF';
    const pts: P[] =
      v === 'frente'
        ? [[-0.53, -0.27], [0, -0.37], [0.53, -0.27], [0.535, -0.17], [0, -0.26], [-0.535, -0.17]]
        : v === 'tres-quartos'
          ? [[-0.56, -0.12], [-0.1, -0.36], [0.47, -0.3], [0.49, -0.19], [-0.08, -0.25], [-0.57, -0.01]]
          : [[-0.58, -0.1], [0, -0.36], [0.44, -0.3], [0.46, -0.19], [0, -0.25], [-0.59, 0.0]];
    el.push(<Vol key="fx" id={`${id}-fx`} ds={[suave(pts.map(([x, y]) => [x * W, y * H] as P), true, 0.8)]} cor={cor} sombra={sombra(cor)} s={0.6} luzDir={Ll} />);
  }
  if (ex.includes('bone')) {
    const cor = c.pessoa.cor;
    const copa =
      v === 'frente'
        ? suave([[-0.53 * W, -0.16 * H], [-0.5 * W, -0.42 * H], [0, -0.6 * H], [0.5 * W, -0.42 * H], [0.53 * W, -0.16 * H], [0, -0.22 * H]])
        : suave([[-0.58 * W, -0.08 * H], [-0.55 * W, -0.38 * H], [-0.05 * W, -0.6 * H], [0.36 * W, -0.47 * H], [0.47 * W, -0.22 * H], [0.1 * W, -0.25 * H]]);
    const aba =
      v === 'frente'
        ? suave([[-0.5 * W, -0.2 * H], [0, -0.27 * H], [0.5 * W, -0.2 * H], [0.42 * W, -0.11 * H], [0, -0.13 * H], [-0.42 * W, -0.11 * H]])
        : suave([[0.12 * W, -0.25 * H], [0.5 * W, -0.25 * H], [0.86 * W, -0.17 * H], [0.84 * W, -0.12 * H], [0.45 * W, -0.15 * H], [0.1 * W, -0.19 * H]]);
    el.push(<Vol key="cp" id={`${id}-cp`} ds={[copa]} cor={cor} sombra={sombra(cor)} s={2.2} luzDir={Ll} rim={{ cor: rimDe(c, cor, 0.5), r: 0.45 }} />);
    el.push(<path key="cs" d={v === 'frente' ? `M0 ${-0.59 * H}L0 ${-0.23 * H}` : `M${-0.06 * W} ${-0.59 * H}Q${0.2 * W} ${-0.45 * H} ${0.3 * W} ${-0.24 * H}`} stroke={sombra(cor, 0.8)} strokeWidth={0.35} fill="none" />);
    el.push(<Vol key="ab" id={`${id}-ab`} ds={[aba]} cor={sombra(cor, 0.35)} sombra={sombra(cor, 1.1)} s={0.8} luzDir={Ll} />);
    el.push(<circle key="bt" cx={v === 'frente' ? 0 : -0.06 * W} cy={-0.6 * H} r={0.65} fill={sombra(cor, 0.5)} />);
  }
  if (ex.includes('fone')) {
    // fone claro com o anel na cor da pessoa (escuro some no cabelo e no fundo)
    const corC = '#EEF0FA';
    if (v === 'frente') {
      el.push(<path key="ar" d={`M${-0.56 * W} ${0.02 * H}Q${-0.6 * W} ${-0.7 * H} 0 ${-0.68 * H}Q${0.6 * W} ${-0.7 * H} ${0.56 * W} ${0.02 * H}`} stroke={sombra(corC, 0.6)} strokeWidth={1.1} fill="none" strokeLinecap="round" />);
      for (const s of [-1, 1]) {
        el.push(<Vol key={`fc${s}`} id={`${id}-fc${s}`} ds={[elipse([s * 0.54 * W, 0.08 * H], 1.9, 3.1)]} cor={corC} sombra={sombra(corC, 0.8)} s={0.8} luzDir={Ll} />);
        el.push(<ellipse key={`fr${s}`} cx={s * 0.555 * W} cy={0.08 * H} rx={1.0} ry={2.0} fill={c.pessoa.cor} />);
      }
    } else {
      const o = ORELHAS[v][0];
      el.push(<path key="ar" d={`M${o.c[0] * W} ${o.c[1] * H}Q${o.c[0] * W - 0.2 * W} ${-0.75 * H} ${0.25 * W} ${-0.6 * H}`} stroke={sombra(corC, 0.6)} strokeWidth={1.1} fill="none" strokeLinecap="round" />);
      el.push(<Vol key="fc" id={`${id}-fc`} ds={[elipse([o.c[0] * W, o.c[1] * H], 2.6, 3.3, -8)]} cor={corC} sombra={sombra(corC, 0.8)} s={0.9} luzDir={Ll} rim={{ cor: rimDe(c, corC, 0.45), r: 0.35 }} />);
      el.push(<path key="fr" d={elipse([o.c[0] * W + 0.2, o.c[1] * H], 1.4, 2.0, -8)} fill={c.pessoa.cor} />);
    }
  }
  void sub;
  void poli;
  return <g>{el}</g>;
};
