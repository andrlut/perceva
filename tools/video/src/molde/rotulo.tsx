// Rótulo (fase 3): a palavra escrita na imagem, como o Notebook faz. Toda cena aceita `rotulos`;
// quem desenha é o Stage (Layer depth 1, depois da cena), com o `busy` da cena pra não cair em cima
// de lente, medidor, balão ou rosto.
//
// Regras (design.json, bloco rotulo + crítica):
//  - Fraunces itálico 600 (WONK 0), ≥ 44 px (default 54), cor clara / ouro / área;
//  - cápsula navy r 16 que nasce junto com o texto (cresce da esquerda com a caneta). A opacidade
//    parte de 0,62 e sobe o quanto a cor do texto precisar pra dar 4,5:1 mesmo com BRANCO atrás
//    (a janela clara da cozinha, o tanque dourado);
//  - entra escrevendo em 13 q a partir da deixa (nunca só por fade); duas linhas = uma depois da outra;
//  - sai com sai() de 8 q na `out`;
//  - linha com mais de 620 px quebra em duas linhas equilibradas; numa coluna estreita (o lado do
//    corpo) quebra antes e, se ainda não couber, encolhe até 44 px;
//  - seta: traço de 4 px que se desenha da borda da cápsula até o ponto, com um ponto r 7 na ponta
//    (termina NO ponto); um contorno navy por baixo segura o traço sobre qualquer fundo;
//  - a fila nunca sobrepõe dois rótulos que estão na tela ao mesmo tempo, e sai do `busy` da cena.
//
// Importa só TIPOS de scenes.tsx (sem ciclo de import).
import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MOLA, Mascara, ramp, sai } from '../components';
import { fontsReady } from '../fonts';
import { C, FONT } from '../theme';
import { cue } from '../timeline';
import { hits, type Rect } from './ambientes';
import type { MS } from './scenes';
import type { Regiao, RotuloSpec } from './spec';

const SIZE = 54;
const MIN = 44;
const PAD_X = 26;
const PAD_Y = 12;
const LH = 1.15;
/** Largura máxima de uma linha de texto (acima disso, duas linhas). */
const LINHA = 620;
/** Coluna dos lados do corpo: rótulo que não cabe nela quebra/encolhe antes de invadir o meio. */
const COLUNA = 300;
/** Margem lateral do quadro. */
const MARGEM = 28;
/** Faixa vertical onde rótulo pode morar (abaixo da sobrancelha, acima da legenda). */
const TOPO = 290;
const FUNDO = 1360;
/** Fila dos rótulos sem posição: a partir de y 480, de 84 em 84 px. */
const FILA = { y: 480, passo: 84 };
/** Quadros da escrita. */
const ESCREVE = 13;
/** Folga entre a cápsula e o começo da seta. */
const FOLGA = 10;

type Align = 'left' | 'center' | 'right';
type Tom = 'claro' | 'ouro' | 'area';

// ------------------------------------------------------------------ medida

const fonte = (size: number) => `italic 600 ${size}px ${FONT.display}`;
let ctx: CanvasRenderingContext2D | null = null;

/**
 * Largura do texto na Fraunces itálica 600, medida no canvas quando a fonte já carregou (o quadro
 * só sai depois: `useFontesDoRotulo`). Antes disso, uma estimativa (0,5 em por caractere).
 */
export const medeRotulo = (text: string, size: number) => {
  if (typeof document !== 'undefined') {
    try {
      if (document.fonts.check(fonte(size))) {
        ctx ??= document.createElement('canvas').getContext('2d');
        if (ctx) {
          ctx.font = fonte(size);
          return ctx.measureText(text).width;
        }
      }
    } catch {
      // sem canvas/fontes: cai na estimativa
    }
  }
  return text.length * size * 0.5;
};

/** Segura o quadro até as fontes carregarem e redesenha com a medida de verdade. */
export const useFontesDoRotulo = () => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('fontes do rótulo'));
  useEffect(() => {
    let vivo = true;
    fontsReady.then(
      () => {
        if (vivo) setOk(true);
        continueRender(handle);
      },
      () => continueRender(handle),
    );
    return () => {
      vivo = false;
    };
  }, [handle]);
  return ok;
};

type Layout = { lines: string[]; size: number; widths: number[]; w: number; h: number };

/** Melhor quebra em duas linhas (a que deixa a linha mais longa o mais curta possível). */
const duas = (text: string, size: number): { lines: string[]; widths: number[] } | null => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  let best: { lines: string[]; widths: number[]; m: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const wa = medeRotulo(a, size);
    const wb = medeRotulo(b, size);
    const m = Math.max(wa, wb);
    if (!best || m < best.m) best = { lines: [a, b], widths: [wa, wb], m };
  }
  return best;
};

const caixa = (lines: string[], widths: number[], size: number): Layout => ({
  lines,
  size,
  widths,
  w: Math.max(...widths) + 2 * PAD_X,
  h: lines.length * size * LH + 2 * PAD_Y,
});

/**
 * Como o texto se arruma: uma linha se couber em `max`; senão duas linhas equilibradas; senão
 * encolhe de 2 em 2 px até 44. Nunca abaixo de 44 (passa da largura antes).
 */
export const rotuloLayout = (text: string, size = SIZE, max = LINHA): Layout => {
  const s0 = Math.max(MIN, size);
  for (let s = s0; s >= MIN; s -= 2) {
    const w1 = medeRotulo(text, s);
    if (w1 <= max) return caixa([text], [w1], s);
    const d = duas(text, s);
    if (d && Math.max(...d.widths) <= max) return caixa(d.lines, d.widths, s);
  }
  const d = duas(text, MIN);
  return d ? caixa(d.lines, d.widths, MIN) : caixa([text], [medeRotulo(text, MIN)], MIN);
};

const x0Of = (x: number, w: number, align: Align) => (align === 'left' ? x : align === 'right' ? x - w : x - w / 2);

/** Onde o rótulo fica na tela: `y` = topo da cápsula; `x` = âncora conforme `align`. */
export const rotuloRect = (text: string, x: number, y: number, size = SIZE, align: Align = 'center', max = LINHA): Rect => {
  const L = rotuloLayout(text, size, max);
  const x0 = x0Of(x, L.w, align);
  return [x0, y, x0 + L.w, y + L.h];
};

// ------------------------------------------------------------------ cor e contraste

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const rgbOf = (hex: string): [number, number, number] | null => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = ([r, g, b]: [number, number, number]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const NAVY: [number, number, number] = [10, 14, 38];
/**
 * Opacidade da cápsula pra o texto dar ≥ 4,5:1 no pior fundo (branco). Parte de 0,62 (o desenho
 * do contrato); a cor clara já passa com ela, o ouro e as cores de área pedem um pouco mais.
 */
const alfaDe = (color: string) => {
  const rgb = rgbOf(color);
  if (!rgb) return 0.62;
  const lt = lum(rgb);
  for (let a = 0.62; a < 0.95; a += 0.01) {
    const bg = NAVY.map((c) => c * a + 255 * (1 - a)) as [number, number, number];
    if ((lt + 0.05) / (lum(bg) + 0.05) >= 4.6) return a;
  }
  return 0.95;
};

const tomDe = (tom: Tom | undefined, accent: string) => (tom === 'ouro' ? C.gold2 : tom === 'area' ? accent : C.hi);

/** Ponto na borda da cápsula (com folga) na direção do alvo; null se o alvo cai dentro dela. */
const bordaPara = (r: Rect, alvo: [number, number]): [number, number] | null => {
  const cx = (r[0] + r[2]) / 2;
  const cy = (r[1] + r[3]) / 2;
  const dx = alvo[0] - cx;
  const dy = alvo[1] - cy;
  const hw = (r[2] - r[0]) / 2 + FOLGA;
  const hh = (r[3] - r[1]) / 2 + FOLGA;
  const tx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const ty = dy === 0 ? Infinity : hh / Math.abs(dy);
  const t = Math.min(tx, ty);
  if (t >= 1) return null;
  return [cx + dx * t, cy + dy * t];
};

// ------------------------------------------------------------------ um rótulo

export const Rotulo: React.FC<{
  s: MS;
  text: string;
  cue?: string;
  out?: string;
  x: number;
  y: number;
  size?: number;
  align?: Align;
  tom?: Tom;
  seta?: [number, number];
  accent: string;
  /** largura máxima de uma linha (default 620); coluna estreita = quebra/encolhe antes */
  max?: number;
}> = ({ s, text, cue: deixa, out, x, y, size = SIZE, align = 'center', tom, seta, accent, max = LINHA }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = deixa ? cue(s, deixa) : s.lead;
  if (frame < at) return null;
  const gone = out ? sai(frame, cue(s, out), 8) : 0;
  if (gone >= 1) return null;
  const p = ramp(frame, at, ESCREVE);
  const L = rotuloLayout(text, size, max);
  const x0 = x0Of(x, L.w, align);
  const r: Rect = [x0, y, x0 + L.w, y + L.h];
  const color = tomDe(tom, accent);
  const alfa = alfaDe(color);
  // a cápsula vem um pouco à frente da tinta, da esquerda pra direita
  const capP = Math.min(1, p * 1.3);
  const ini = seta ? bordaPara(r, seta) : null;
  // a seta se desenha depois do começo da palavra e o ponto assenta no fim dela
  const q = ramp(frame, at + 8, 9);
  const dot = seta ? Math.min(1.04, spring({ frame: frame - (at + 15), fps, config: MOLA.pousa })) : 0;
  const end: [number, number] | null = ini && seta ? [ini[0] + (seta[0] - ini[0]) * q, ini[1] + (seta[1] - ini[1]) * q] : null;
  const lineP = (i: number) => (L.lines.length === 1 ? p : i === 0 ? Math.min(1, p / 0.6) : Math.max(0, (p - 0.45) / 0.55));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - gone, transform: gone ? `translateY(${-12 * gone}px)` : undefined }}>
      {ini && end && seta ? (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <line x1={ini[0]} y1={ini[1]} x2={end[0]} y2={end[1]} stroke="rgba(10,14,38,0.55)" strokeWidth={9} strokeLinecap="round" />
          <line x1={ini[0]} y1={ini[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={4} strokeLinecap="round" />
          {dot > 0 ? (
            <g transform={`translate(${seta[0]} ${seta[1]}) scale(${dot})`}>
              <circle r={10} fill="rgba(10,14,38,0.6)" />
              <circle r={7} fill={color} />
            </g>
          ) : null}
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: r[0],
          top: r[1],
          width: L.w,
          height: L.h,
          borderRadius: 16,
          background: `rgba(10,14,38,${alfa.toFixed(2)})`,
          opacity: Math.min(1, p * 3),
          clipPath: `inset(0 ${((1 - capP) * 100).toFixed(2)}% 0 0 round 16px)`,
        }}
      />
      {L.lines.map((line, i) => (
        <Mascara
          key={i}
          p={lineP(i)}
          modo="escreve"
          style={{ position: 'absolute', left: r[0], top: r[1] + PAD_Y + i * L.size * LH, width: L.w, display: 'flex', justifyContent: 'center' }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontStyle: 'italic',
              fontWeight: 600,
              fontVariationSettings: "'WONK' 0",
              fontSize: L.size,
              lineHeight: LH,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        </Mascara>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ a fila

/** Onde um rótulo foi parar. */
export type Vaga = { x: number; y: number; align: Align; max: number; rect: Rect };

/**
 * Acha um lugar livre pro texto: fora de `busy` e dentro do palco.
 * - Sem `alvo`: a fila de sempre — a partir de y 480, de 84 em 84, primeiro no centro, depois nos
 *   lados; acabou embaixo, sobe a partir de 396.
 * - Com `alvo` (a ponta da seta): a coluna do lado do alvo (`lado` força), perto da altura dele,
 *   descendo e subindo de 42 em 42; depois o outro lado; por último o centro.
 * Sem lugar livre: o centro em y 480 (o contrato antigo).
 */
export const achaVaga = (
  text: string,
  busy: Rect[],
  o: { alvo?: [number, number]; lado?: 'esquerda' | 'direita'; size?: number } = {},
): Vaga => {
  const size = o.size ?? SIZE;
  const cols: { x: number; align: Align; max: number; lado: 'esquerda' | 'direita' | 'centro' }[] = [
    { x: 540, align: 'center', max: LINHA, lado: 'centro' },
    { x: MARGEM, align: 'left', max: LINHA, lado: 'esquerda' },
    { x: MARGEM, align: 'left', max: COLUNA, lado: 'esquerda' },
    { x: 1080 - MARGEM, align: 'right', max: LINHA, lado: 'direita' },
    { x: 1080 - MARGEM, align: 'right', max: COLUNA, lado: 'direita' },
  ];
  const livre = (r: Rect) => r[0] >= MARGEM - 0.5 && r[2] <= 1080 - MARGEM + 0.5 && r[1] >= TOPO && r[3] <= FUNDO && !hits(busy, r);
  const tenta = (c: (typeof cols)[number], y: number): Vaga | null => {
    const r = rotuloRect(text, c.x, y, size, c.align, c.max);
    return livre(r) ? { x: c.x, y, align: c.align, max: c.max, rect: r } : null;
  };
  if (o.alvo) {
    const h = rotuloLayout(text, size, COLUNA).h;
    const y0 = Math.round(o.alvo[1] - h / 2);
    const ys: number[] = [y0];
    for (let d = 42; d <= 1100; d += 42) ys.push(y0 + d, y0 - d);
    const pref = o.lado ?? (o.alvo[0] < 540 ? 'esquerda' : 'direita');
    const ordem: ('esquerda' | 'direita' | 'centro')[] = [pref, pref === 'esquerda' ? 'direita' : 'esquerda', 'centro'];
    for (const lado of ordem) {
      for (const y of ys) {
        for (const c of cols.filter((k) => k.lado === lado)) {
          const v = tenta(c, y);
          if (v) return v;
        }
      }
    }
  } else {
    const ys: number[] = [];
    for (let y = FILA.y; y <= FUNDO; y += FILA.passo) ys.push(y);
    for (let y = FILA.y - FILA.passo; y >= TOPO; y -= FILA.passo) ys.push(y);
    for (const y of ys) {
      for (const c of cols) {
        const v = tenta(c, y);
        if (v) return v;
      }
    }
  }
  return { x: 540, y: FILA.y, align: 'center', max: LINHA, rect: rotuloRect(text, 540, FILA.y, size) };
};

/** Quadros em que o rótulo está na tela: da deixa até a saída (sem `out`, até o fim). */
const janela = (s: MS, r: RotuloSpec): [number, number] => [cue(s, r.cue), r.out ? cue(s, r.out) + 8 : Infinity];

/** O que a cena ocupa só durante um trecho (a lente aberta, ela no canto): quadros [de, ate). */
export type Ocupa = { rect: Rect; de?: number; ate?: number };

/**
 * Um disco como faixas horizontais (o rótulo cabe nos cantos do quadrado de uma lente redonda).
 * `folga` = margem em volta.
 */
export const discoRects = (centro: [number, number], diametro: number, faixas = 8, folga = 14): Rect[] => {
  const r = diametro / 2 + folga;
  const h = (2 * r) / faixas;
  const out: Rect[] = [];
  for (let i = 0; i < faixas; i++) {
    const y0 = centro[1] - r + i * h;
    const y1 = y0 + h;
    // a parte mais larga da faixa: o centro, se ela o contém; senão a borda mais perto dele
    const dy = y0 <= centro[1] && y1 >= centro[1] ? 0 : Math.min(Math.abs(y0 - centro[1]), Math.abs(y1 - centro[1]));
    const hw = Math.sqrt(Math.max(0, r * r - dy * dy));
    out.push([centro[0] - hw, y0, centro[0] + hw, y1]);
  }
  return out;
};

/**
 * Os rótulos da cena. Com x/y, ficam onde o roteiro mandou. Sem, cada um acha a vaga (achaVaga):
 * fora do `busy` da cena, do que ela `ocupa` enquanto o rótulo está na tela (a lente só depois de
 * abrir), e de todo rótulo que está na tela ao mesmo tempo. `seta` com Regiao usa `pontos` (a cena
 * passa os da pessoa ou do corpo); região sem ponto = sem seta.
 */
export const Rotulos: React.FC<{
  s: MS;
  rotulos: RotuloSpec[];
  pontos?: Partial<Record<Regiao, [number, number]>>;
  busy?: Rect[];
  ocupa?: Ocupa[];
  accent: string;
}> = ({ s, rotulos, pontos = {}, busy = [], ocupa = [], accent }) => {
  useFontesDoRotulo();
  const placed: { rect: Rect; win: [number, number] }[] = [];
  return (
    <>
      {rotulos.map((r, i) => {
        const win = janela(s, r);
        const seta = Array.isArray(r.seta) ? r.seta : r.seta ? pontos[r.seta] : undefined;
        // só atrapalha o que divide a tela com este rótulo
        const outros = placed.filter((p) => p.win[0] < win[1] && win[0] < p.win[1]).map((p) => p.rect);
        const agora = ocupa.filter((o) => (o.de ?? -Infinity) < win[1] && win[0] < (o.ate ?? Infinity)).map((o) => o.rect);
        let v: Vaga;
        if (r.x !== undefined || r.y !== undefined) {
          const x = r.x ?? 540;
          const y = r.y ?? FILA.y;
          v = { x, y, align: 'center', max: LINHA, rect: rotuloRect(r.text, x, y) };
        } else {
          v = achaVaga(r.text, [...busy, ...agora, ...outros], { alvo: seta });
        }
        placed.push({ rect: v.rect, win });
        return <Rotulo key={i} s={s} text={r.text} cue={r.cue} out={r.out} x={v.x} y={v.y} align={v.align} max={v.max} tom={r.tom} seta={seta} accent={accent} />;
      })}
    </>
  );
};
