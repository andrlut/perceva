// Passagens entre cenas do molde. Todas cabem no mesmo crossfade de FADE
// frames do timeline (a duração do vídeo não muda com a passagem escolhida).
//  - fade     a de sempre: a cena nova aparece por cima da antiga
//  - zoom     atravessa: a antiga cresce um pouco, a nova chega de longe
//  - desliza  a câmera continua andando: a antiga sai pro lado, a nova entra do outro
//  - corte    seco, no meio do crossfade (só quando o roteiro pede)
//  - hexa     (v4) atravessa pelo hexágono: a antiga cresce rumo ao centro e a nova
//             nasce de dentro de um hexágono que se abre, com aro dourado — a marca
//             como passagem (pesquisa: o hexágono como motivo de continuidade)
//  - chicote  (v4) whip pan: as duas cenas correm juntas pro lado, coladas, com
//             desfoque só na horizontal no pico do movimento
import React, { useId } from 'react';
import { AbsoluteFill, Easing } from 'remotion';
import { C } from '../theme';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import type { CameraSpec, Transicao } from './spec';

type TP = { kind: Transicao; dir: 1 | -1 };

// hexágono em pé (o radar do app), em px do quadro 1080×1920
const HEX_C: [number, number] = [540, 860];
const hexClip = (r: number) =>
  `polygon(${[-90, -30, 30, 90, 150, 210]
    .map((a) => {
      const t = (a * Math.PI) / 180;
      return `${(HEX_C[0] + Math.cos(t) * r).toFixed(1)}px ${(HEX_C[1] + Math.sin(t) * r).toFixed(1)}px`;
    })
    .join(', ')})`;
const hexPath = (r: number) =>
  [-90, -30, 30, 90, 150, 210]
    .map((a, i) => {
      const t = (a * Math.PI) / 180;
      return `${i ? 'L' : 'M'}${(HEX_C[0] + Math.cos(t) * r).toFixed(1)} ${(HEX_C[1] + Math.sin(t) * r).toFixed(1)}`;
    })
    .join(' ') + 'Z';

const Hexa: React.FC<{ entering: boolean; p: number; children: React.ReactNode }> = ({ entering, p, children }) => {
  if (!entering) {
    const e = Easing.in(Easing.cubic)(p);
    // no fim a antiga some (o que sobra nos cantos fora do hexágono não vira um segundo título)
    const fade = 1 - Math.max(0, Math.min(1, (p - 0.55) / 0.4));
    return <AbsoluteFill style={{ opacity: fade, transform: `scale(${1 + 0.4 * e})`, transformOrigin: `${HEX_C[0]}px ${HEX_C[1]}px`, filter: `blur(${(5 * e).toFixed(2)}px)` }}>{children}</AbsoluteFill>;
  }
  // abre rápido no fim (ease-in): o hexágono pequeno lê como "porta", não como máscara
  const e = Easing.bezier(0.55, 0, 0.85, 0.35)(p);
  const r = 40 + 1500 * e;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: hexClip(r), transform: `scale(${1.12 - 0.12 * p})`, transformOrigin: `${HEX_C[0]}px ${HEX_C[1]}px` }}>{children}</AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* o aro dourado some antes do hexágono passar das bordas (não fica risco nos cantos) */}
        <path d={hexPath(r)} fill="none" stroke={C.gold} strokeWidth={14 - 8 * p} strokeLinejoin="round" opacity={Math.pow(Math.max(0, 1 - p / 0.8), 1.4)} />
      </svg>
    </AbsoluteFill>
  );
};

const Chicote: React.FC<{ entering: boolean; p: number; dir: 1 | -1; children: React.ReactNode }> = ({ entering, p, dir, children }) => {
  const id = 'ch' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const e = Easing.bezier(0.7, 0, 0.3, 1)(p);
  // as duas cenas coladas: a nova vem exatamente atrás da borda da antiga
  const x = entering ? dir * 1080 * (1 - e) : -dir * 1080 * e;
  const blur = 60 * Math.sin(Math.PI * p);
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-20%" y="0%" width="140%" height="100%">
          <feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `translateX(${x.toFixed(1)}px)`, filter: blur > 0.5 ? `url(#${id})` : undefined }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Passagem: React.FC<TransitionPresentationComponentProps<TP>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const entering = presentationDirection === 'entering';
  if (passedProps.kind === 'hexa') return <Hexa entering={entering} p={presentationProgress}>{children}</Hexa>;
  if (passedProps.kind === 'chicote') return <Chicote entering={entering} p={presentationProgress} dir={passedProps.dir}>{children}</Chicote>;
  const e = Easing.inOut(Easing.cubic)(presentationProgress);
  let style: React.CSSProperties = {};
  // nunca abaixo de scale 1: a borda do quadro não pode aparecer no meio da passagem
  switch (passedProps.kind) {
    case 'zoom':
      style = entering ? { opacity: e, transform: `scale(${1 + 0.08 * (1 - e)})` } : { transform: `scale(${1 + 0.08 * e})` };
      break;
    case 'desliza':
      // o zoom de 16% cobre os 80 px de deslize (sobra ~86 px de cada lado)
      style = entering
        ? { opacity: Math.min(1, e * 1.6), transform: `translateX(${passedProps.dir * 80 * (1 - e)}px) scale(${1 + 0.16 * (1 - e)})` }
        : { transform: `translateX(${-passedProps.dir * 80 * e}px) scale(${1 + 0.16 * e})` };
      break;
    case 'corte':
      style = entering ? { opacity: presentationProgress >= 0.5 ? 1 : 0 } : {};
      break;
    default:
      style = entering ? { opacity: presentationProgress } : {};
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/**
 * A passagem PRA esta cena: a que o roteiro pediu (`transicao`), senão uma que
 * acompanha a câmera (pan → desliza no mesmo sentido; push/pull/drift → zoom),
 * senão o fade de sempre.
 */
/** A passagem que vale pra esta cena (a pedida, a que acompanha a câmera, ou fade). */
export const passagemKind = (transicao: Transicao | undefined, cam: CameraSpec | undefined): Transicao =>
  transicao ?? (cam && cam.move !== 'still' ? (cam.move.startsWith('pan') ? 'desliza' : 'zoom') : 'fade');

export const passagem = (transicao: Transicao | undefined, cam: CameraSpec | undefined): TransitionPresentation<TP> => {
  const kind = passagemKind(transicao, cam);
  const dir: 1 | -1 = cam?.move === 'pan-left' ? -1 : 1;
  return { component: Passagem, props: { kind, dir } };
};
