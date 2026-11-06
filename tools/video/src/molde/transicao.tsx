// Passagens entre cenas do molde. Todas cabem no mesmo crossfade de FADE
// frames do timeline (a duração do vídeo não muda com a passagem escolhida).
//  - fade     a de sempre: a cena nova aparece por cima da antiga
//  - zoom     atravessa: a antiga cresce um pouco, a nova chega de longe
//  - desliza  a câmera continua andando: a antiga sai pro lado, a nova entra do outro
//  - corte    seco, no meio do crossfade (só quando o roteiro pede)
import React from 'react';
import { AbsoluteFill, Easing } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import type { CameraSpec, Transicao } from './spec';

type TP = { kind: Transicao; dir: 1 | -1 };

const Passagem: React.FC<TransitionPresentationComponentProps<TP>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const entering = presentationDirection === 'entering';
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
export const passagem = (transicao: Transicao | undefined, cam: CameraSpec | undefined): TransitionPresentation<TP> => {
  const kind: Transicao = transicao ?? (cam && cam.move !== 'still' ? (cam.move.startsWith('pan') ? 'desliza' : 'zoom') : 'fade');
  const dir: 1 | -1 = cam?.move === 'pan-left' ? -1 : 1;
  return { component: Passagem, props: { kind, dir } };
};
