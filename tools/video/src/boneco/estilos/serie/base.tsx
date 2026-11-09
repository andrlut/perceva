// "Animação de série" — a base: vetores, cores, caminhos suaves e o PINTOR (tinta + cel).
//
// Técnica de desenho (o que faz o estilo parecer série de TV bem feita):
//  1. LINHA COLORIDA (rodada 3, painel): cada peça tem o contorno num tom escuro e saturado da
//     PRÓPRIA cor (marrom na pele, roxo-escuro na roupa roxa); peça muito escura (marinho, cabelo
//     preto) ganha um tom MAIS CLARO dela, pra não sumir no fundo marinho. A silhueta externa é
//     grossa e mais pesada do lado da sombra (passe `silhueta`, antes de tudo); dentro, onde um
//     membro passa na frente do corpo, a linha é FINA (o forro de cada camada).
//     CAMADA = um conjunto de formas que se desenha junto: forro fino de todas, depois os
//     preenchimentos — as emendas internas (coxa → canela, ombro → braço) somem.
//  2. GRUPO dentro da camada = peça de roupa: tem o seu forro FINO (a bainha, a gola, a borda do
//     tênis aparecem como linha interna, mais leve que a silhueta).
//  3. CEL: cada forma pinta a sombra inteira e por cima a cópia DESLOCADA PRA LUZ na cor base —
//     sobra uma meia-lua de sombra no lado oposto à luz.
//  4. RECORTE: no fim, um fio da cor da LUZ do lugar só na SILHUETA e só do LADO DA LUZ, por
//     dentro do contorno (nunca uma segunda linha por fora).
import React from 'react';

export type P = [number, number];
export const RAD = Math.PI / 180;

/**
 * Espessura de traço que acompanha a ESCALA do desenho: `--sk` é posto na raiz do boneco (serie.tsx)
 * a partir dos px por unidade medidos no quadro — boneco grande (close de 1250–2300 px) ganha
 * traço proporcionalmente mais fino, boneco pequeno (150 px) um tico mais grosso. Sem a variável
 * (fora do navegador), vale 1.
 */
export const sw = (x: number): React.CSSProperties => ({ strokeWidth: `calc(var(--sk, 1) * ${x.toFixed(3)}px)` });

/** a tinta: azul-marinho fundo, nunca preto */
export const TINTA = '#14173D';
/** espessuras (unidades do boneco; ~1,1 px por unidade num boneco de 330 px) */
export const LINHA = { fora: 1.8, dentro: 0.68, fino: 0.5 };

// ------------------------------------------------------------------ vetores

export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const len = (a: P) => Math.hypot(a[0], a[1]);
export const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const norm = (a: P): P => {
  const n = Math.hypot(a[0], a[1]) || 1e-6;
  return [a[0] / n, a[1] / n];
};
/** gira +90° no SVG (y pra baixo): (1,0) → (0,1) */
export const perp = (a: P): P => [-a[1], a[0]];
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerpP = (a: P, b: P, k: number): P => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const suaviza = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
/** vetor unitário do ângulo de osso (0 = pra baixo, + = pra +x) */
export const dirDe = (ang: number): P => [Math.sin(ang * RAD), Math.cos(ang * RAD)];
/** gira um vetor (graus, sentido do SVG) */
export const gira = (a: P, graus: number): P => {
  const c = Math.cos(graus * RAD);
  const s = Math.sin(graus * RAD);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
/** ponto de um quadro local: origem `o`, eixo `u` (unitário) e o perpendicular `n` */
export const local = (o: P, u: P, n: P) => (x: number, y: number): P => [o[0] + u[0] * x + n[0] * y, o[1] + u[1] * x + n[1] * y];
/** hash estável de texto (piscar e balanço não sincronizam entre pessoas) */
export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
};

const f = (p: P) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
export const fmt = f;

// ------------------------------------------------------------------ cores

const hexRgb = (c: string): [number, number, number] => {
  const h = c.replace('#', '');
  const x = h.length === 3 ? h.split('').map((k) => k + k).join('') : h;
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
};
const rgbHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => {
  const x = hexRgb(a);
  const y = hexRgb(b);
  return rgbHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t));
};
/** luminância relativa aproximada (0..1) */
export const luma = (c: string) => {
  const [r, g, b] = hexRgb(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
const rgbHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const mx = Math.max(R, G, B);
  const mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h /= 6;
  return [h, s, l];
};
const hslHex = (h: number, s: number, l: number) => {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255);
};
/**
 * A cor do CONTORNO de uma peça: um tom escuro e saturado da própria cor. Peça muito escura
 * (marinho, grafite, cabelo preto) vira o contrário — um tom médio dela, mais claro, que separa
 * do fundo marinho do app sem virar halo.
 */
export const contornoDe = (c: string) => {
  const rgb = hexRgb(c);
  const [h, s, l] = rgbHsl(rgb);
  const croma = (Math.max(...rgb) - Math.min(...rgb)) / 255;
  if (luma(c) < 0.2) return hslHex(h, croma < 0.08 ? 0.16 : Math.min(0.5, s), Math.max(l + 0.1, 0.29));
  const s2 = croma < 0.12 ? 0.32 : Math.min(0.78, s * 1.05 + 0.1);
  return hslHex(h, s2, Math.max(0.12, Math.min(0.28, l * 0.42)));
};

/** sombra de tecido/objeto: puxa pro violeta-marinho (sombra fria, a cor continua viva) */
export const sombraDe = (c: string, k = 0.3) => mix(c, '#2A1C6E', k);
/** sombra de pele: puxa pro vinho quente (pele na sombra não fica cinza) */
export const sombraPele = (c: string) => mix(c, '#7A2E44', 0.27);
export const clareia = (c: string, k: number) => mix(c, '#FFFFFF', k);
export const escurece = (c: string, k: number) => mix(c, TINTA, k);

// ------------------------------------------------------------------ caminhos

/** um ponto com quina (a curva para nele em vez de passar suave) */
export type PQ = P | [number, number, 1];

/**
 * Curva suave (Catmull-Rom → Bézier) passando pelos pontos. `quina` (3º elemento = 1) faz a
 * curva chegar e sair reta daquele ponto (gola, bico de lapela, ponta de unha).
 */
export function suave(pts: PQ[], fechado = true, tensao = 1): string {
  const n = pts.length;
  if (n < 2) return '';
  const g = (i: number): PQ => (fechado ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const q = (p: PQ) => p.length === 3;
  let s = `M${f([pts[0][0], pts[0][1]])}`;
  const segs = fechado ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    const k = tensao / 6;
    const c1: P = q(p1) ? [p1[0], p1[1]] : [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = q(p2) ? [p2[0], p2[1]] : [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    s += ` C${f(c1)} ${f(c2)} ${f([p2[0], p2[1]])}`;
  }
  return fechado ? s + ' Z' : s;
}

/** amostra densa de uma curva Catmull-Rom fechada (pra deformar: a bochecha que cede ao dedo) */
export function amostra(pts: P[], porSeg = 6): P[] {
  const n = pts.length;
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let k = 0; k < porSeg; k++) {
      const t = k / porSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/**
 * Cápsula afinada de `a` (raio ra) a `b` (raio rb) — o osso vestido de carne. `bn`/`bm` = bojo
 * (unidades) no lado n (perp do eixo; numa perna em pé é o lado −x, a panturrilha) e no lado
 * oposto, a 1/3 e 2/3 do comprimento. `fimA`/`fimB` 'reto' = corte (bainha, punho de manga).
 */
export function capsula(
  a: P,
  b: P,
  ra: number,
  rb: number,
  o: { bn?: [number, number]; bm?: [number, number]; fimA?: 'redondo' | 'reto'; fimB?: 'redondo' | 'reto' | 'boca' } = {},
): string {
  const d = sub(b, a);
  const L = len(d) || 1e-3;
  const u = mul(d, 1 / L);
  const n = perp(u);
  const bn = o.bn ?? [0, 0];
  const bm = o.bm ?? [0, 0];
  const at = (s: number, off: number): P => add(add(a, mul(u, L * s)), mul(n, off));
  const p0 = at(0, ra);
  const p3 = at(1, rb);
  const c1 = at(0.33, lerp(ra, rb, 0.33) + bn[0]);
  const c2 = at(0.66, lerp(ra, rb, 0.66) + bn[1]);
  const q0 = at(1, -rb);
  const q3 = at(0, -ra);
  const d1 = at(0.66, -(lerp(ra, rb, 0.66) + bm[1]));
  const d2 = at(0.33, -(lerp(ra, rb, 0.33) + bm[0]));
  let s = `M${f(p0)} C${f(c1)} ${f(c2)} ${f(p3)}`;
  if (o.fimB === 'boca') {
    // boca de manga: oval e inclinada (um lado desce mais), nunca o corte reto de tesoura
    const k1 = add(p3, add(mul(u, rb * 0.62), mul(n, -rb * 0.25)));
    const k2 = add(q0, add(mul(u, rb * 0.18), mul(n, rb * 0.25)));
    s += ` C${f(k1)} ${f(k2)} ${f(q0)}`;
  } else s += o.fimB === 'reto' ? ` L${f(q0)}` : meiaVolta(p3, q0, add(b, mul(u, rb)), rb);
  s += ` C${f(d1)} ${f(d2)} ${f(q3)}`;
  s += o.fimA === 'reto' ? ' Z' : meiaVolta(q3, p0, add(a, mul(u, -ra)), ra) + ' Z';
  return s;
}

/**
 * A ponta redonda da cápsula em DOIS quartos de arco (até o ponto `meio`, depois até `fim`). Um arco
 * único de exatos 180° é ambíguo (a distância entre as pontas ≈ 2r, e o arredondamento decide pra
 * que lado ele vai): no Chrome isso fazia um pedaço do braço sumir da pintura em quadros soltos.
 */
const meiaVolta = (ini: P, fim: P, meio: P, r: number) => {
  void ini;
  const R = r.toFixed(3);
  return ` A${R} ${R} 0 0 0 ${f(meio)} A${R} ${R} 0 0 0 ${f(fim)}`;
};

export const circulo = (c: P, r: number) =>
  `M${f([c[0] - r, c[1]])} A${r} ${r} 0 1 0 ${f([c[0] + r, c[1]])} A${r} ${r} 0 1 0 ${f([c[0] - r, c[1]])} Z`;

export const elipse = (c: P, rx: number, ry: number, rot = 0) => {
  const pts: P[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push(add(c, gira([Math.cos(a) * rx, Math.sin(a) * ry], rot)));
  }
  return suave(pts);
};

/** linha aberta suave (traço de detalhe) */
export const linha = (pts: PQ[]) => suave(pts, false);

// ------------------------------------------------------------------ o pintor

export type Forma = {
  d: string;
  cor: string;
  /** cor da sombra; null = chapado (sem cel nem recorte) */
  sombra?: string | null;
  /** quanto a parte iluminada se desloca pra luz (unidades): maior = mais sombra */
  k?: number;
  /** entra na silhueta do fio de recorte (default sim) */
  rim?: boolean;
  /** opacidade (cabelo raspado do degradê) */
  op?: number;
  /** formas seguidas com a mesma `uniao` e a mesma cor são sombreadas como UMA (sem arco na junta) */
  uniao?: string;
  /** cor do contorno (default: contornoDe(cor)) */
  linhaCor?: string;
};

const linhaDe = (fm: Forma) => fm.linhaCor ?? contornoDe(fm.cor);

export type Grupo = {
  formas: Forma[];
  /** contorno interno do grupo (peça de roupa sobre a pele); 0/undefined = sem */
  linha?: number;
  /** desenhado antes do forro fino do grupo (ex.: máscara da pélvis) */
  antes?: React.ReactNode;
  /** desenhado entre o forro fino e a pintura (máscara que esconde a linha por baixo) */
  meio?: React.ReactNode;
  /** detalhes por cima (costura, dobra, cadarço) */
  depois?: React.ReactNode;
};

export class Pintor {
  private n = 0;
  /** as formas que fazem a silhueta (contorno grosso de fora + fio de recorte), com a transformação da camada */
  sil: { d: string; tf?: string; cor: string; op?: number; rim: boolean }[] = [];
  /** transformação corrente (a cabeça desenha num quadro local) */
  tf?: string;
  constructor(
    public uid: string,
    /** cor do fio de recorte */
    public luz: string,
    /** vetor unitário PRA luz (no espaço do desenho) */
    public L: P,
  ) {}
  id(s = 'c') {
    return `${this.uid}-${s}${this.n++}`;
  }

  /** uma forma: sombra cheia, fio de recorte, a cópia iluminada por cima (tudo recortado nela) */
  pinta(fm: Forma, key: string | number, L: P = this.L): React.ReactNode {
    if (fm.sombra === null) return <path key={key} d={fm.d} fill={fm.cor} opacity={fm.op} />;
    const id = this.id();
    const sh = fm.sombra ?? sombraDe(fm.cor);
    const k = fm.k ?? 3;
    return (
      <g key={key} opacity={fm.op}>
        <clipPath id={id}>
          <path d={fm.d} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <path d={fm.d} fill={sh} />
          <path d={fm.d} fill={fm.cor} transform={`translate(${(L[0] * k).toFixed(2)} ${(L[1] * k).toFixed(2)})`} />
        </g>
      </g>
    );
  }

  /**
   * Várias formas de mesma cor como uma só: sombra e luz recortadas na UNIÃO delas. A união é uma
   * MÁSCARA (pintada), não um clipPath de vários filhos: o Chrome faz a união de clipPath por
   * operação de caminho e, com bordas quase coincidentes (manga de cima × de baixo no cotovelo),
   * ela falhava em quadros soltos — o antebraço sumia e aparecia a cor do contorno (rodada 4).
   */
  pintaUniao(fs: Forma[], key: string | number, L: P = this.L): React.ReactNode {
    const id = this.id('u');
    const f0 = fs[0];
    const sh = f0.sombra ?? sombraDe(f0.cor);
    const k = f0.k ?? 3;
    const tf = `translate(${(L[0] * k).toFixed(2)} ${(L[1] * k).toFixed(2)})`;
    return (
      <g key={key}>
        <mask id={id} maskUnits="userSpaceOnUse" x={-900} y={-1200} width={1800} height={1500}>
          {fs.map((fm, i) => (
            <path key={i} d={fm.d} fill="#FFFFFF" />
          ))}
        </mask>
        <g mask={`url(#${id})`}>
          {fs.map((fm, i) => (
            <path key={`s${i}`} d={fm.d} fill={sh} />
          ))}
          {fs.map((fm, i) => (
            <path key={`l${i}`} d={fm.d} fill={fm.cor} transform={tf} />
          ))}
        </g>
      </g>
    );
  }

  private pintaGrupo(formas: Forma[], L: P): React.ReactNode[] {
    const runs: Forma[][] = [];
    for (const fm of formas) {
      const last = runs[runs.length - 1];
      if (last && fm.uniao && fm.sombra !== null && last[0].uniao === fm.uniao && last[0].cor === fm.cor) last.push(fm);
      else runs.push([fm]);
    }
    return runs.map((r, i) => (r.length === 1 ? this.pinta(r[0], `p${i}`, L) : this.pintaUniao(r, `p${i}`, L)));
  }

  /**
   * A camada: forro FINO colorido de todas as formas (é a linha que aparece onde esta camada passa
   * na frente de outra), depois cada grupo (forro da peça + pintura + detalhes). O contorno grosso
   * de fora não mora aqui: é o passe `silhueta`, desenhado antes de tudo.
   */
  camada(grupos: Grupo[], key: string | number, L: P = this.L, interna = LINHA.dentro * 0.8): React.ReactNode {
    const todas = grupos.flatMap((g) => g.formas);
    for (const fm of todas) this.sil.push({ d: fm.d, tf: this.tf, cor: linhaDe(fm), op: fm.op, rim: fm.rim !== false && (fm.op ?? 1) >= 0.99 });
    return (
      <g key={key}>
        {todas.map((fm, i) => (
          <path key={`u${i}`} d={fm.d} fill={linhaDe(fm)} stroke={linhaDe(fm)} style={sw(interna * 2)} strokeLinejoin="round" opacity={fm.op} />
        ))}
        {grupos.map((g, gi) => (
          <g key={`g${gi}`}>
            {g.antes}
            {g.linha
              ? g.formas.map((fm, i) => (
                  <path key={`l${i}`} d={fm.d} fill={linhaDe(fm)} stroke={linhaDe(fm)} style={sw(g.linha! * 2)} strokeLinejoin="round" opacity={fm.op} />
                ))
              : null}
            {g.meio}
            {this.pintaGrupo(g.formas, L)}
            {g.depois}
          </g>
        ))}
      </g>
    );
  }
}

/** traço de detalhe (dobra, costura, ruga) */
export const Traco: React.FC<{ d: string; w?: number; cor?: string; op?: number; tracejado?: string }> = ({ d, w = LINHA.dentro, cor = TINTA, op, tracejado }) => (
  <path d={d} fill="none" stroke={cor} style={sw(w)} strokeLinecap="round" strokeLinejoin="round" opacity={op} strokeDasharray={tracejado} />
);

const desloca = (x: number, y: number): React.CSSProperties => ({
  transform: `translate(calc(var(--sk, 1) * ${x.toFixed(3)}px), calc(var(--sk, 1) * ${y.toFixed(3)}px))`,
});

/**
 * O contorno GROSSO, só por fora: todas as formas do boneco com traço largo na cor de contorno de
 * cada uma, desenhadas ANTES de tudo (os preenchimentos cobrem o miolo). Uma segunda cópia,
 * deslocada pro lado oposto à luz, deixa a linha mais pesada embaixo e do lado da sombra.
 */
export function silhueta(pt: Pintor, fora = LINHA.fora): React.ReactNode {
  if (!pt.sil.length) return null;
  const [lx, ly] = pt.L;
  const todas = (k: string) =>
    pt.sil.map((s, i) => <path key={`${k}${i}`} d={s.d} transform={s.tf} fill={s.cor} stroke={s.cor} style={sw(fora * 2)} strokeLinejoin="round" opacity={s.op} />);
  return (
    <g key="silhueta">
      <g style={desloca(-lx * 0.7, -ly * 0.7)}>{todas('b')}</g>
      <g>{todas('a')}</g>
    </g>
  );
}

/** o fio de luz de recorte: só na silhueta, só do LADO DA LUZ e por dentro do contorno (desenhado por último) */
export function recorte(pt: Pintor, largura = 0.95, op = 0.85): React.ReactNode {
  const sil = pt.sil.filter((s) => s.rim);
  if (!sil.length) return null;
  const id = pt.id('rec');
  const [lx, ly] = pt.L;
  const R = { x: -700, y: -1000, w: 1400, h: 1200 };
  return (
    <g key="recorte">
      <mask id={id} maskUnits="userSpaceOnUse" x={R.x} y={R.y} width={R.w} height={R.h}>
        <g fill="#FFFFFF">
          {sil.map((s, i) => (
            <path key={i} d={s.d} transform={s.tf} />
          ))}
        </g>
        <g fill="#000000" style={desloca(-lx * largura, -ly * largura)}>
          {sil.map((s, i) => (
            <path key={i} d={s.d} transform={s.tf} />
          ))}
        </g>
      </mask>
      <rect x={R.x} y={R.y} width={R.w} height={R.h} fill={pt.luz} opacity={op} mask={`url(#${id})`} />
    </g>
  );
}
