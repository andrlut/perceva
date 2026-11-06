// Câmera do molde: um movimento suave do palco por fala, com parallax.
//
// A cena declara onde estão as coisas (foco: pessoa, peça, mapa) e embrulha o
// que desenha em <Layer depth>. O fundo do ambiente anda menos (depth < 1), a
// protagonista anda 1, o primeiro plano anda mais (depth > 1): é isso que dá
// profundidade a um pan ou a um push. Sem `camera` no roteiro, nada se move
// (a cena sai igual à de antes).
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import type { CameraFocus, CameraSpec } from './spec';

export type Cam = { x: number; y: number; scale: number; ox: number; oy: number };
export const NO_CAM: Cam = { x: 0, y: 0, scale: 1, ox: 540, oy: 860 };
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
 * Estado da câmera no frame local `frame` de uma cena de `dur` frames.
 * Sem deixa: o movimento atravessa a cena inteira (inclusive o crossfade de
 * saída — nunca para antes do corte). Com deixa: fica parada até ela e faz o
 * movimento em ~1,3 s (um "soco" de câmera na frase que importa).
 */
export const cameraAt = (frame: number, dur: number, cam: CameraSpec | undefined, cueAt: number | null, focus: [number, number]): Cam => {
  if (!cam || cam.move === 'still') return NO_CAM;
  const k = cam.forca === 'forte' ? 1.8 : cam.forca === 'leve' ? 0.55 : 1;
  const p =
    cueAt != null
      ? interpolate(frame, [cueAt, cueAt + 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
      : interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const [fx, fy] = focus;
  // o foco caminha um pouco pro centro do palco enquanto aproxima
  const rx = (540 - fx) * 0.2;
  const ry = (860 - fy) * 0.2;
  switch (cam.move) {
    case 'push':
      return { scale: 1 + 0.12 * k * p, x: rx * p, y: ry * p, ox: fx, oy: fy };
    case 'pull':
      return { scale: 1 + 0.12 * k * (1 - p), x: rx * (1 - p), y: ry * (1 - p), ox: fx, oy: fy };
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

const isStill = (c: Cam) => c.scale === 1 && c.x === 0 && c.y === 0;

/** Uma camada do palco; `depth` escala o movimento (fundo < 1 < primeiro plano). */
export const Layer: React.FC<{ depth: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ depth, children, style }) => {
  const c = useCam();
  if (isStill(c)) return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  const s = 1 + (c.scale - 1) * depth;
  return (
    <AbsoluteFill
      style={{
        ...style,
        transform: `translate(${c.x * depth}px, ${c.y * depth}px) scale(${s})`,
        transformOrigin: `${c.ox}px ${c.oy}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
