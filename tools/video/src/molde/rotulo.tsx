// Rótulo (fase 3): a palavra escrita na imagem, como o Notebook faz. Toda cena aceita `rotulos`;
// quem desenha é o Stage (Layer depth 1, depois da cena), com o `busy` da cena pra não cair em cima
// de lente, medidor ou balão. STUB da fundação, já funcional: Mascara "escreve" + cápsula navy.
// Dono: agente B (medida de verdade, quebra em duas linhas, fila sem sobreposição, seta desenhada).
//
// Regras (design.json, bloco rotulo): Fraunces itálico 600 (WONK 0), ≥ 44 px (default 54), cor
// clara/ouro/área, cápsula rgba(10,14,38,0.62) r 16 nascendo junto com o texto, entra escrevendo
// em ≤ 13 q a partir da deixa (nunca só por fade), sai com sai() de 8 q na `out`, texto > 620 px
// quebra em duas linhas, seta de 4 px até o ponto com um ponto r 7 na ponta.
//
// Importa só TIPOS de scenes.tsx (sem ciclo de import).
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Mascara, ramp, sai } from '../components';
import { C, FONT } from '../theme';
import { cue } from '../timeline';
import { hits, type Rect } from './ambientes';
import type { MS } from './scenes';
import type { Regiao, RotuloSpec } from './spec';

const PAD_X = 26;
const PAD_Y = 12;
/** Largura máxima de uma linha (acima disso, duas linhas). */
const LINHA = 620;
/** Fila dos rótulos sem posição: a partir de y 480, de 84 em 84 px. */
const FILA = { y: 480, passo: 84 };
const ESCREVE = 13;

/** Largura estimada (Fraunces itálico 600 ≈ 0,5 em por caractere). O agente B mede no canvas. */
const larguraDe = (text: string, size: number) => text.length * size * 0.5;

/** Onde o rótulo fica na tela: `y` = topo da cápsula; `x` = âncora conforme `align`. */
export const rotuloRect = (text: string, x: number, y: number, size = 54, align: 'left' | 'center' | 'right' = 'center'): Rect => {
  const raw = larguraDe(text, size);
  const lines = raw > LINHA ? 2 : 1;
  const w = Math.min(raw, LINHA) + 2 * PAD_X;
  const h = lines * size * 1.15 + 2 * PAD_Y;
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  return [x0, y, x0 + w, y + h];
};

const tomDe = (tom: RotuloSpec['tom'], accent: string) => (tom === 'ouro' ? C.gold2 : tom === 'area' ? accent : C.hi);

export const Rotulo: React.FC<{
  s: MS;
  text: string;
  cue?: string;
  out?: string;
  x: number;
  y: number;
  size?: number;
  align?: 'left' | 'center' | 'right';
  tom?: 'claro' | 'ouro' | 'area';
  seta?: [number, number];
  accent: string;
}> = ({ s, text, cue: deixa, out, x, y, size = 54, align = 'center', tom, seta, accent }) => {
  const frame = useCurrentFrame();
  const at = deixa ? cue(s, deixa) : s.lead;
  const p = ramp(frame, at, ESCREVE);
  if (p <= 0) return null;
  const gone = out ? sai(frame, cue(s, out), 8) : 0;
  const r = rotuloRect(text, x, y, size, align);
  const color = tomDe(tom, accent);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - gone }}>
      {seta ? (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <line x1={(r[0] + r[2]) / 2} y1={seta[1] > r[3] ? r[3] : r[1]} x2={seta[0]} y2={seta[1]} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={p} />
          <circle cx={seta[0]} cy={seta[1]} r={7} fill={color} opacity={p} />
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: r[0],
          top: r[1],
          width: r[2] - r[0],
          height: r[3] - r[1],
          borderRadius: 16,
          background: 'rgba(10,14,38,0.62)',
          opacity: Math.min(1, p * 1.6),
        }}
      />
      <Mascara p={p} modo="escreve" style={{ position: 'absolute', left: r[0] + PAD_X, top: r[1] + PAD_Y, width: r[2] - r[0] - 2 * PAD_X }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontStyle: 'italic',
            fontWeight: 600,
            fontVariationSettings: "'WONK' 0",
            fontSize: size,
            lineHeight: 1.15,
            color,
            textAlign: 'center',
          }}
        >
          {text}
        </div>
      </Mascara>
    </div>
  );
};

/**
 * Os rótulos da cena. Sem x/y, empilham na fila (y 480, de 84 em 84) e descem até ficarem livres
 * do `busy` da cena e dos outros rótulos. `seta` com Regiao usa `pontos` (a cena passa os da pessoa
 * ou do corpo); região sem ponto = sem seta.
 */
export const Rotulos: React.FC<{ s: MS; rotulos: RotuloSpec[]; pontos?: Partial<Record<Regiao, [number, number]>>; busy?: Rect[]; accent: string }> = ({
  s,
  rotulos,
  pontos = {},
  busy = [],
  accent,
}) => {
  const placed: Rect[] = [];
  let next = FILA.y;
  return (
    <>
      {rotulos.map((r, i) => {
        let y = r.y ?? next;
        const x = r.x ?? 540;
        if (r.y === undefined) {
          while (y < 1300 && hits([...busy, ...placed], rotuloRect(r.text, x, y))) y += FILA.passo;
          next = y + FILA.passo;
        }
        placed.push(rotuloRect(r.text, x, y));
        const seta = Array.isArray(r.seta) ? r.seta : r.seta ? pontos[r.seta] : undefined;
        return <Rotulo key={i} s={s} text={r.text} cue={r.cue} out={r.out} x={x} y={y} tom={r.tom} seta={seta} accent={accent} />;
      })}
    </>
  );
};
