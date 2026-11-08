// Vídeo da porta com abertura: o PORQUÊ contado com o elenco (molde, uma ideia de
// learning-drops/video-specs/doors.json com `bridge: "tour"`, sem verso) e, emendado,
// o tutorial da tela (Tour). Cada parte guarda o próprio relógio, a própria voz e a
// própria legenda; aqui só se decide onde uma acaba e a outra entra.
//
//   props.introKey = "<slug>.<idea>.<lang>" → public/molde/<introKey>/ (scripts/molde.mjs build + voice)
//   props.tourKey  = "<tour>.<lang>"        → public/tour/<tourKey>/    (scripts/tour.mjs build + voice)
//   scripts/tour.mjs render escolhe esta composição quando o roteiro do tour traz `intro`.
import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, Easing, interpolate } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import { Background, Lente } from '../components';
import { C } from '../theme';
import { FPS, HOLD, TAIL } from '../timeline';
import { Molde, MoldeProps, calculateMoldeMetadata } from '../molde/Molde';
import { Tour, TourProps, calculateTourMetadata } from './Tour';

/** Teto da porta inteira: 1 min + 10% (r3: abertura ~20 s + tutorial ~39 s). */
export const PORTA_MAX_SECONDS = 66;
/** A passagem da história pro celular, em quadros (Mergulho, abaixo). */
const PASS = 20;
/** Respiro depois da última fala da abertura, além do TAIL, antes da passagem. Com 10 a costura
 *  ficava ~1,95 s de silêncio, o dobro da maior pausa do resto do filme. */
const BREATH = 4;

export type PortaProps = {
  introKey: string;
  tourKey: string;
  intro?: MoldeProps;
  tour?: TourProps;
  /** quadros da abertura que ficam na tela (sem o HOLD de assinatura do molde) */
  introFrames?: number;
  tourFrames?: number;
};

export const calculatePortaMetadata: CalculateMetadataFunction<PortaProps> = async (args) => {
  const { props } = args;
  const i = await calculateMoldeMetadata({ ...args, props: { specKey: props.introKey, spec: null, scenes: [] } } as never);
  const t = await calculateTourMetadata({ ...args, props: { tourKey: props.tourKey, spec: null, scenes: [], mode: 'tour' } } as never);
  const intro = i.props as MoldeProps;
  const tour = t.props as TourProps;
  // (rascunho pode misturar parte com voz e parte sem: quem barra o render publicável é o tour.mjs)
  // o molde segura a última cena por HOLD (a assinatura do verso); a abertura não tem verso,
  // então corta ali: TAIL + BREATH depois da fala, e a passagem começa
  const introFrames = (i.durationInFrames as number) - HOLD + BREATH + PASS;
  const last = intro.scenes[intro.scenes.length - 1];
  // a passagem só pode começar depois da voz (e do `hold` da última fala). Pela conta acima a margem
  // é exatamente BREATH: a guarda só dispara com BREATH negativo ou se o buildTimeline mudar de forma
  // (ela não confere a duração real do mp3 — isso é do timings.json, medido no `voice`)
  const voiceEnd = last ? last.start + last.lead + last.speech + Math.round((last.hold ?? 0) * FPS) : 0;
  if (introFrames - PASS < voiceEnd + TAIL) throw new Error(`${props.introKey}: a passagem começaria antes do fim da última fala`);
  const tourFrames = t.durationInFrames as number;
  const total = introFrames + tourFrames - PASS;
  if (total > PORTA_MAX_SECONDS * FPS) {
    throw new Error(`${props.introKey} + ${props.tourKey}: ${(total / FPS).toFixed(1)} s passa do teto de ${PORTA_MAX_SECONDS} s — corte o roteiro`);
  }
  return { durationInFrames: total, props: { ...props, intro, tour, introFrames, tourFrames } };
};

/**
 * Mergulho: a história cresce e apaga INTEIRA na primeira metade, o fundo respira um instante e
 * o celular chega de um pouco mais perto na segunda. Um crossfade comum deixava a lista da
 * abertura (Café especial, Uma hora de jogo, Jantar fora) por cima dos cartões da loja por
 * meio segundo — texto sobre texto, a mesma mancha que o tutorial já proíbe nos modais.
 */
const Mergulho: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const ease = Easing.inOut(Easing.cubic);
  if (presentationDirection === 'exiting') {
    const o = interpolate(p, [0, 0.5], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
    return <AbsoluteFill style={{ opacity: o, transform: `scale(${1 + 0.1 * ease(p)})` }}>{children}</AbsoluteFill>;
  }
  const e = interpolate(p, [0.42, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  return <AbsoluteFill style={{ opacity: e, transform: `scale(${1.06 - 0.06 * e})` }}>{children}</AbsoluteFill>;
};
const mergulho = (): TransitionPresentation<Record<string, never>> => ({ component: Mergulho, props: {} });

export const Porta: React.FC<PortaProps> = ({ intro, tour, introFrames, tourFrames }) => {
  if (!intro || !tour || !introFrames || !tourFrames || !tour.spec) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: C.deep }}>
      {/* o fundo de baixo é o que aparece no respiro do mergulho (as duas partes a zero) */}
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={introFrames} name="porquê">
          <Molde {...intro} captions="door" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={mergulho()} timing={linearTiming({ durationInFrames: PASS })} />
        <TransitionSeries.Sequence durationInFrames={tourFrames} name="tela">
          <Tour {...tour} embedded />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Lente />
    </AbsoluteFill>
  );
};
