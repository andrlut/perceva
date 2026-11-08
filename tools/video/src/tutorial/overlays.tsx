// Sobreposições do tutorial de tela: câmera, destaque (spotlight), dedo e
// etiqueta. Câmera e destaque vivem no espaço da tela (dp) — o destaque é
// filho da câmera, então os dois andam juntos. Dedo e etiqueta vivem no espaço
// do vídeo (px) pra manter o tamanho legível em qualquer zoom; a posição vem
// de `project`, a mesma conta da câmera.
import React from 'react';
import { Easing, interpolate } from 'remotion';
import type { Rect } from './ui';
import type { Device } from './screens/chrome';

// ---------------------------------------------------------------- câmera

/** Onde a tela fica no quadro: a área do palco (px) e a escala com zoom 1 (px por dp). */
export type Stage = { x: number; y: number; w: number; h: number; d: Device; s0: number };
/** Câmera = ponto da tela (dp) no centro do palco + escala (px por dp). */
export type Cam = { cx: number; cy: number; k: number };

export const ZOOM_MAX = 2.5;
const BEZEL_MARGIN = 14; // dp de fundo que a câmera aceita mostrar além da borda da tela

export const wideCam = (st: Stage): Cam => ({ cx: st.d.w / 2, cy: st.d.h / 2, k: st.s0 });

const clampAxis = (c: number, half: number, size: number) =>
  2 * half >= size + 2 * BEZEL_MARGIN ? size / 2 : Math.max(half - BEZEL_MARGIN, Math.min(size + BEZEL_MARGIN - half, c));

/** Enquadra o alvo: cabe com folga (86% da largura, 72% da altura do palco), zoom entre 1 e ZOOM_MAX,
 *  e sem mostrar vazio além da tela quando o zoom permite. `zoom` fixa o zoom. */
export const focusCam = (st: Stage, r: Rect, zoom?: number): Cam => {
  const fit = Math.min((st.w * 0.86) / Math.max(r.w, 1), (st.h * 0.72) / Math.max(r.h, 1));
  const k = Math.max(st.s0, Math.min(st.s0 * ZOOM_MAX, zoom ? st.s0 * zoom : fit));
  return {
    k,
    cx: clampAxis(r.x + r.w / 2, st.w / 2 / k, st.d.w),
    cy: clampAxis(r.y + r.h / 2, st.h / 2 / k, st.d.h),
  };
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Zoom interpola em log (andar de 1× pra 2× parece tão rápido quanto de 2× pra 4×). */
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), t)),
});
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  r: lerp(a.r ?? 0, b.r ?? 0, t),
});

/** Ponto da tela (dp) → ponto do vídeo (px). */
export const project = (st: Stage, cam: Cam, x: number, y: number) => ({
  x: st.x + st.w / 2 + (x - cam.cx) * cam.k,
  y: st.y + st.h / 2 + (y - cam.cy) * cam.k,
});
export const projectRect = (st: Stage, cam: Cam, r: Rect): Rect => {
  const p = project(st, cam, r.x, r.y);
  return { x: p.x, y: p.y, w: r.w * cam.k, h: r.h * cam.k, r: (r.r ?? 0) * cam.k };
};

export const easeInOut = Easing.inOut(Easing.cubic);
export const progress = (f: number, from: number, to: number, ease = easeInOut) =>
  to <= from ? (f >= to ? 1 : 0) : interpolate(f, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

/** O palco: recorta a câmera, com as bordas de cima e de baixo esmaecendo. Os filhos estão em dp. */
export const CameraLayer: React.FC<{ st: Stage; cam: Cam; children: React.ReactNode }> = ({ st, cam, children }) => (
  <div
    style={{
      position: 'absolute',
      left: st.x,
      top: st.y,
      width: st.w,
      height: st.h,
      overflow: 'hidden',
      WebkitMaskImage: 'linear-gradient(180deg, transparent 0px, #000 36px, #000 calc(100% - 56px), transparent 100%)',
      maskImage: 'linear-gradient(180deg, transparent 0px, #000 36px, #000 calc(100% - 56px), transparent 100%)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: st.d.w,
        height: st.d.h,
        transformOrigin: '0 0',
        transform: `translate(${st.w / 2 - cam.cx * cam.k}px, ${st.h / 2 - cam.cy * cam.k}px) scale(${cam.k})`,
      }}
    >
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------- destaque

const roundRect = (r: Rect) => {
  const rad = Math.max(0, Math.min(r.r ?? 0, r.w / 2, r.h / 2));
  const { x, y, w, h } = r;
  return `M ${x + rad} ${y} H ${x + w - rad} A ${rad} ${rad} 0 0 1 ${x + w} ${y + rad} V ${y + h - rad} A ${rad} ${rad} 0 0 1 ${x + w - rad} ${y + h} H ${x + rad} A ${rad} ${rad} 0 0 1 ${x} ${y + h - rad} V ${y + rad} A ${rad} ${rad} 0 0 1 ${x + rad} ${y} Z`;
};

export type SpotTone = 'violet' | 'gold';
const RING: Record<SpotTone, { stroke: string; glow: string }> = {
  violet: { stroke: '#B9A8FF', glow: 'rgba(155,130,255,0.85)' },
  gold: { stroke: '#FFE08A', glow: 'rgba(255,200,61,0.8)' },
};

/** Um alvo do destaque: `hole` = o quanto o buraco no véu está aberto, `ring` = a opacidade do anel
 *  (ver SpotLayer em engine.ts: na troca de alvo o novo acende no lugar dele e o velho apaga no dele). */
export type SpotlightLayer = { rect: Rect; hole: number; ring: number; pulse: number | null; tone: SpotTone };

/**
 * Escurece tudo menos os buracos arredondados em volta dos alvos, com um anel suave em cada. Fica
 * DENTRO da câmera (coordenadas em dp); `k` (px por dp) mantém a espessura do anel constante no
 * vídeo, em qualquer zoom. Os buracos são uma máscara (cada um com a sua abertura), pra que a troca
 * de alvo nunca estique um anel pela tela: o novo abre e o velho fecha, cada um no seu lugar.
 */
export const Spotlight: React.FC<{
  layers: SpotlightLayer[];
  /** 0..1 — o quanto o resto escurece (0 = sem destaque) */
  dim: number;
  k: number;
  /** a tela (dp): o véu cobre ela com folga — a câmera nunca mostra mais que isso */
  d: Device;
  /** folga em volta do alvo, em dp */
  pad?: number;
}> = ({ layers, dim, k, d, pad = 6 }) => {
  const id = `spot${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (dim <= 0.001 || !layers.length) return null;
  const M = 700; // dp além da tela (no zoom mínimo o palco mostra ~650 × 800 dp)
  const box = { x: -M, y: -M, w: d.w + 2 * M, h: d.h + 2 * M };
  const sw = 4.5 / k; // 4,5 px no vídeo
  const holeOf = (rect: Rect): Rect => ({ x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2, r: (rect.r ?? 12) + pad });
  return (
    <>
      <svg
        width={box.w}
        height={box.h}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        style={{ position: 'absolute', left: box.x, top: box.y, pointerEvents: 'none', overflow: 'visible' }}
      >
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="white" />
            {layers.map((L, i) => (L.hole > 0.001 ? <path key={i} d={roundRect(holeOf(L.rect))} fill="black" fillOpacity={Math.min(1, L.hole)} /> : null))}
          </mask>
        </defs>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={`rgba(5,7,26,${0.64 * dim})`} mask={`url(#${id})`} />
      </svg>
      {layers.map((L, i) => {
        const o = dim * L.ring;
        if (o <= 0.001) return null;
        const ring = RING[L.tone];
        const hole = holeOf(L.rect);
        const echo = L.pulse == null ? null : { d: (4 + 26 * L.pulse) / k, o: 0.9 * (1 - L.pulse) };
        return (
          <svg
            key={i}
            width={box.w}
            height={box.h}
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            style={{ position: 'absolute', left: box.x, top: box.y, pointerEvents: 'none', overflow: 'visible', opacity: o, filter: `drop-shadow(0 0 ${10 / k}px ${ring.glow})` }}
          >
            <path d={roundRect(hole)} fill="none" stroke={ring.stroke} strokeWidth={sw} />
            {echo ? (
              <path
                d={roundRect({ x: hole.x - echo.d, y: hole.y - echo.d, w: hole.w + echo.d * 2, h: hole.h + echo.d * 2, r: (hole.r ?? 0) + echo.d })}
                fill="none"
                stroke={ring.stroke}
                strokeWidth={sw * 0.9}
                opacity={echo.o}
              />
            ) : null}
          </svg>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- dedo

/** Inclinação padrão da mão (graus): em pé, vindo de baixo. */
export const HAND_ANGLE = -8;
const HAND_SIZE = 150;
/** As peças da mão no viewBox 120×150 (dedo, nós, palma, polegar ~ caixa, punho): pra medir o que ela cobre. */
const HAND_PARTS: [number, number, number, number][] = [
  [27, 4, 47, 76],
  [45, 44, 64, 84],
  [62, 50, 80, 88],
  [78, 58, 94, 92],
  [27, 62, 94, 120],
  [0, 61, 40, 107], // o polegar é girado −36° em volta de (20, 84): esta é a caixa dele já girado
  [34, 112, 90, 148],
];

/** As caixas (px do vídeo) que a mão ocupa com a ponta em (x, y) e inclinada `angle` graus. */
export const handBoxes = (x: number, y: number, angle = HAND_ANGLE, size = HAND_SIZE): Rect[] => {
  const s = size / 120;
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return HAND_PARTS.map(([x0, y0, x1, y1]) => {
    const pts = [
      [x0, y0],
      [x1, y0],
      [x0, y1],
      [x1, y1],
    ].map(([px, py]) => {
      const dx = (px - 37) * s;
      const dy = (py - 5) * s;
      return { x: x + dx * cos - dy * sin, y: y + dx * sin + dy * cos };
    });
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  });
};

/**
 * A mão que toca: ponta do indicador exatamente em (x, y) do vídeo. `press`
 * (0..1) afunda a mão; `ripple` (0..1) é a onda do toque; `hold` (0..1) é o
 * anel dourado do segurar; `angle` inclina a mão em volta da ponta (padrão em
 * pé; deitada, ela entra pelo lado). `trail`: arrastando — no lugar do disco
 * de toque, um rastro do ponto `trail` até a ponta (o arrasto nunca parece toque).
 */
export const Finger: React.FC<{
  x: number;
  y: number;
  opacity: number;
  press?: number;
  ripple?: number | null;
  rippleAt?: { x: number; y: number };
  hold?: number | null;
  size?: number;
  angle?: number;
  trail?: { x: number; y: number } | null;
}> = ({ x, y, opacity, press = 0, ripple = null, rippleAt, hold = null, size = HAND_SIZE, angle = HAND_ANGLE, trail = null }) => {
  if (opacity <= 0.001) return null;
  const rx = rippleAt?.x ?? x;
  const ry = rippleAt?.y ?? y;
  const s = size / 120; // viewBox 120×150, ponta do dedo em (37, 5)
  const tipX = 37 * s;
  const tipY = 5 * s;
  const scale = 1 - 0.1 * press;
  const ink = '#0A0E26';
  const skin = '#F4F5FF';
  const parts = (
    <>
      <rect x="27" y="4" width="20" height="72" rx="10" />
      <rect x="45" y="44" width="19" height="40" rx="9.5" />
      <rect x="62" y="50" width="18" height="38" rx="9" />
      <rect x="78" y="58" width="16" height="34" rx="8" />
      <rect x="27" y="62" width="67" height="58" rx="21" />
      <rect x="11" y="62" width="18" height="44" rx="9" transform="rotate(-36 20 84)" />
    </>
  );
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity, pointerEvents: 'none' }}>
      {hold != null ? (
        <svg width={120} height={120} viewBox="0 0 120 120" style={{ position: 'absolute', left: x - 60, top: y - 60, overflow: 'visible' }}>
          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="#FFC83D"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${hold} 1`}
            transform="rotate(-90 60 60)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,200,61,0.8))' }}
          />
        </svg>
      ) : null}
      {trail && press > 0.05 ? (
        <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id="dragTrail" gradientUnits="userSpaceOnUse" x1={trail.x} y1={trail.y} x2={x} y2={y}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.42 * press} />
            </linearGradient>
          </defs>
          <line x1={trail.x} y1={trail.y} x2={x} y2={y} stroke="url(#dragTrail)" strokeWidth={26} strokeLinecap="round" />
          <circle cx={x} cy={y} r={15} fill={`rgba(255,255,255,${0.3 * press})`} />
        </svg>
      ) : null}
      {press > 0.05 && !trail ? (
        <div
          style={{
            position: 'absolute',
            left: x - 26,
            top: y - 26,
            width: 52,
            height: 52,
            borderRadius: 26,
            background: `rgba(255,255,255,${0.32 * press})`,
            boxShadow: `0 0 18px rgba(255,255,255,${0.35 * press})`,
          }}
        />
      ) : null}
      {ripple != null && ripple < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: rx - (20 + 70 * ripple),
            top: ry - (20 + 70 * ripple),
            width: (20 + 70 * ripple) * 2,
            height: (20 + 70 * ripple) * 2,
            borderRadius: '50%',
            border: `5px solid rgba(255,255,255,${0.7 * (1 - ripple)})`,
            boxSizing: 'border-box',
          }}
        />
      ) : null}
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 120 150"
        style={{
          position: 'absolute',
          left: x - tipX,
          top: y - tipY,
          overflow: 'visible',
          transformOrigin: `${tipX}px ${tipY}px`,
          transform: `scale(${scale}) rotate(${angle}deg)`,
          filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.55))',
        }}
      >
        <g fill={ink} stroke={ink} strokeWidth="7" strokeLinejoin="round">
          {parts}
          <rect x="34" y="112" width="56" height="34" rx="7" />
        </g>
        <g fill={skin}>{parts}</g>
        <rect x="34" y="114" width="56" height="34" rx="7" fill="#7B5CFF" />
        <rect x="34" y="114" width="56" height="6" rx="3" fill="#9B82FF" />
        <g stroke="#C9CCEB" strokeWidth="2.2" strokeLinecap="round">
          <line x1="46" y1="58" x2="46" y2="76" />
          <line x1="63" y1="62" x2="63" y2="80" />
          <line x1="79" y1="68" x2="79" y2="84" />
        </g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- etiqueta

/** Etiqueta curta (≤ 24 caracteres) ao lado do alvo, no espaço do vídeo: em cima se couber, senão embaixo. */
export const Callout: React.FC<{
  target: Rect;
  text: string;
  t: number;
  bounds: { top: number; bottom: number };
  tone?: SpotTone;
}> = ({ target, text, t, bounds, tone = 'gold' }) => {
  if (t <= 0.001 || !text) return null;
  const h = 78;
  const gap = 26;
  const above = target.y - gap - h > bounds.top + 10;
  const top = above ? target.y - gap - h : Math.min(bounds.bottom - h - 10, target.y + target.h + gap);
  const cx = Math.max(220, Math.min(1080 - 220, target.x + target.w / 2));
  const color = tone === 'gold' ? '#FFE08A' : '#C2B3FF';
  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top,
        transform: `translate(-50%, ${(1 - t) * (above ? 14 : -14)}px)`,
        opacity: t,
        height: h,
        padding: '0 34px',
        borderRadius: h / 2,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        background: 'rgba(14,18,48,0.94)',
        border: `3px solid ${color}`,
        boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 24px ${tone === 'gold' ? 'rgba(255,200,61,0.35)' : 'rgba(155,130,255,0.4)'}`,
        fontFamily: 'Manrope',
        fontWeight: 800,
        fontSize: 38,
        color,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
  );
};
