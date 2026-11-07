// Câmera do molde: um movimento suave do palco por fala, com parallax.
//
// A cena declara onde estão as coisas (foco: pessoa, peça, mapa) e embrulha o
// que desenha em <Layer depth>. O fundo do ambiente anda menos (depth < 1), a
// protagonista anda 1, o primeiro plano anda mais (depth > 1): é isso que dá
// profundidade a um pan ou a um push. Sem `camera` no roteiro, nada se move
// (a cena sai igual à de antes).
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Easing, interpolate, spring } from 'remotion';
import type { CameraFocus, CameraSpec } from './spec';

export type Cam = {
  x: number;
  y: number;
  scale: number;
  ox: number;
  oy: number;
  /** câmera na mão (px no plano da pessoa; o fundo anda menos, o primeiro plano mais) */
  hx?: number;
  hy?: number;
  /** giro da câmera na mão, em graus */
  rot?: number;
  /** foco: 0 = tudo nítido, 1 = fundo no desfoque máximo (rack focus do push) */
  focus?: number;
  /** dolly zoom: 0..1 — o fundo cresce e a pessoa fica do mesmo tamanho */
  dolly?: number;
};
export const NO_CAM: Cam = { x: 0, y: 0, scale: 1, ox: 540, oy: 860 };

/**
 * Câmera na mão (v4, 2026-11-07): toda cena com palco respira um pouco — 3–5 px e
 * ±0,2°, em senos de períodos primos (não repete à vista). Pesquisa: "parado morto"
 * é o que mais denuncia vídeo feito em código. 0 desliga.
 */
export const HANDHELD = 1;
const handheld = (f: number) => ({
  hx: HANDHELD * (3.4 * Math.sin(f / 37 + 0.5) + 1.6 * Math.sin(f / 13.9 + 2.1)),
  hy: HANDHELD * (2.6 * Math.sin(f / 43 + 1.3) + 1.3 * Math.sin(f / 17.3 + 0.4)),
  rot: HANDHELD * 0.18 * Math.sin(f / 51 + 0.9),
});
const CamContext = createContext<Cam>(NO_CAM);
export const useCam = () => useContext(CamContext);

/** Pontos que a cena expõe pro foco da câmera (coordenadas do quadro 1080×1920). */
export type FocusMap = Partial<Record<'pessoa' | 'peca' | 'mapa', [number, number]>>;

const REGIONS: Record<Exclude<CameraFocus, 'pessoa' | 'peca' | 'mapa'>, [number, number]> = {
  centro: [540, 840],
  esquerda: [300, 840],
  direita: [780, 840],
  topo: [540, 560],
  base: [540, 1150],
};

export const focusPoint = (focus: CameraFocus | undefined, map: FocusMap): [number, number] => {
  const f = focus ?? 'pessoa';
  if (f in REGIONS) return REGIONS[f as keyof typeof REGIONS];
  return map[f as keyof FocusMap] ?? map.pessoa ?? REGIONS.centro;
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/**
 * Estado da câmera no frame local `frame` de uma cena de `dur` frames, já com a
 * câmera na mão. Sem deixa: o movimento atravessa a cena inteira (inclusive o
 * crossfade de saída — nunca para antes do corte). Com deixa: fica parada até
 * ela e dá um "soco" de mola (v4): passa ~4% do alvo e assenta em ~15 quadros.
 */
export const cameraAt = (frame: number, dur: number, cam: CameraSpec | undefined, cueAt: number | null, focus: [number, number]): Cam => {
  const base = cameraMove(frame, dur, cam, cueAt, focus);
  return { ...base, ...handheld(frame) };
};

const cameraMove = (frame: number, dur: number, cam: CameraSpec | undefined, cueAt: number | null, focus: [number, number]): Cam => {
  if (!cam || cam.move === 'still') return NO_CAM;
  const k = cam.forca === 'forte' ? 1.8 : cam.forca === 'leve' ? 0.55 : 1;
  const p =
    cueAt != null
      ? spring({ frame: frame - cueAt, fps: 30, config: { damping: 14, stiffness: 120, mass: 1 } })
      : interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  // o foco acompanha o avanço (sem a passada da mola): o fundo desfoca enquanto a câmera chega
  const pf = Math.min(1, Math.max(0, p));
  const [fx, fy] = focus;
  // o foco caminha um pouco pro centro do palco enquanto aproxima
  const rx = (540 - fx) * 0.2;
  const ry = (860 - fy) * 0.2;
  switch (cam.move) {
    case 'push':
      return { scale: 1 + 0.12 * k * p, x: rx * p, y: ry * p, ox: fx, oy: fy, focus: pf };
    case 'pull':
      return { scale: 1 + 0.12 * k * (1 - p), x: rx * (1 - p), y: ry * (1 - p), ox: fx, oy: fy, focus: 1 - pf };
    case 'dolly':
      // "caiu a ficha": o fundo cresce, a pessoa fica do mesmo tamanho (uma vez por vídeo)
      return { scale: 1, x: 0, y: 0, ox: fx, oy: fy, dolly: pf * k, focus: pf * 0.6 };
    case 'pan-left':
      return { scale: 1, x: 70 * k * (2 * p - 1), y: 0, ox: fx, oy: fy };
    case 'pan-right':
      return { scale: 1, x: -70 * k * (2 * p - 1), y: 0, ox: fx, oy: fy };
    case 'drift':
      return {
        scale: 1.02 + 0.02 * k * (0.5 + 0.5 * Math.sin(frame / 90)),
        x: 18 * k * Math.sin(frame / 62),
        y: 10 * k * Math.cos(frame / 77),
        ox: fx,
        oy: fy,
      };
    default:
      return NO_CAM;
  }
};

/** Provedor da câmera da cena. */
export const CameraRig: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <CamContext.Provider value={cam}>{children}</CamContext.Provider>
);

const isStill = (c: Cam) => c.scale === 1 && c.x === 0 && c.y === 0 && !c.hx && !c.hy && !c.rot && !c.dolly;

/**
 * Uma camada do palco; `depth` escala o movimento (fundo < 1 < primeiro plano).
 * v4: a câmera na mão também anda por profundidade (parallax de graça), as
 * camadas que não são a pessoa ganham 1,5% de sobra pra borda nunca aparecer,
 * o fundo desfoca no push (rack focus: |1 − depth| × 7 px no máximo) e cresce
 * no dolly.
 */
export const Layer: React.FC<{ depth: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ depth, children, style }) => {
  const c = useCam();
  if (isStill(c)) return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  const over = depth === 1 ? 1 : 1.015;
  const dolly = depth < 1 ? 1 + 0.28 * (c.dolly ?? 0) * (1 - depth) : 1;
  const s = (1 + (c.scale - 1) * depth) * over * dolly;
  const blur = depth < 1 ? (1 - depth) * 7 * (c.focus ?? 0) : 0;
  const filters = [style?.filter, blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : null].filter(Boolean).join(' ');
  return (
    <AbsoluteFill
      style={{
        ...style,
        filter: filters || undefined,
        transform: `translate(${c.x * depth + (c.hx ?? 0) * depth}px, ${c.y * depth + (c.hy ?? 0) * depth}px) rotate(${(c.rot ?? 0) * depth}deg) scale(${s})`,
        transformOrigin: `${c.ox}px ${c.oy}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
