// Vitrine: o vídeo de apresentação do site (perceva.app, logo abaixo do topo). Em vez da
// história com o elenco, ele passa pelas TELAS do app — as mesmas réplicas dos tutoriais
// (src/tutorial/screens), com câmera, destaque e dedo — numa volta curta: Eu (a promessa e o
// retrato) → Práticas → Recompensas → Recanto → Eu de novo (o emblema) → o cartão final.
//
// Cada trecho é um tour curto (tools/video/tours/vitrine-*.json, "kind": "vitrine") com voz,
// legenda e relógio próprios; aqui só se emendam os trechos e se fecha na marca.
//   props.lang → public/tour/vitrine-<trecho>.<lang>/ (scripts/vitrine.mjs build + voice)
import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, Easing, interpolate, useCurrentFrame } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import { Background, Lente } from '../components';
import { Glyph } from '../Glyph';
import { C } from '../theme';
import { FPS } from '../timeline';
import { Tour, TourProps, calculateTourMetadata } from './Tour';
import type { Lang } from './screens/i18n';

/** A ordem da volta pelas telas (cada um é tools/video/tours/<id>.json). */
export const VITRINE_SEGMENTS = ['vitrine-eu', 'vitrine-praticas', 'vitrine-recompensas', 'vitrine-recanto', 'vitrine-fecho'] as const;
/** Teto do filme inteiro: vídeo de marca é até 60 s (e o do site, quanto mais curto melhor). */
export const VITRINE_MAX_SECONDS = 58;
/** A passagem de uma tela pra outra, em quadros. */
const PASS = 14;
/** O cartão final (sem voz), em quadros. */
const END = 96;

export type VitrineProps = {
  lang: Lang;
  parts?: { tour: TourProps; frames: number }[];
};

export const calculateVitrineMetadata: CalculateMetadataFunction<VitrineProps> = async (args) => {
  const { props } = args;
  const parts: { tour: TourProps; frames: number }[] = [];
  for (const seg of VITRINE_SEGMENTS) {
    const t = await calculateTourMetadata({ ...args, props: { tourKey: `${seg}.${props.lang}`, spec: null, scenes: [], mode: 'tour' } } as never);
    parts.push({ tour: t.props as TourProps, frames: t.durationInFrames as number });
  }
  // cada passagem sobrepõe PASS quadros do trecho que sai com o que entra (inclusive o cartão final)
  const total = parts.reduce((n, p) => n + p.frames, 0) + END - PASS * parts.length;
  if (total > VITRINE_MAX_SECONDS * FPS) {
    throw new Error(`vitrine.${props.lang}: ${(total / FPS).toFixed(1)} s passa do teto de ${VITRINE_MAX_SECONDS} s — corte o roteiro`);
  }
  return { durationInFrames: total, props: { ...props, parts } };
};

/**
 * Passagem: a tela que sai apaga inteira na primeira metade e a que entra acende na segunda
 * (um crossfade comum poria o título e a legenda de uma por cima dos da outra — texto sobre
 * texto, o que o tutorial proíbe). Um leve recuo/avanço dá a sensação de virar a página.
 */
const Passagem: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const ease = Easing.inOut(Easing.cubic);
  if (presentationDirection === 'exiting') {
    const o = interpolate(p, [0, 0.5], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
    return <AbsoluteFill style={{ opacity: o, transform: `scale(${1 - 0.03 * ease(p)})` }}>{children}</AbsoluteFill>;
  }
  const e = interpolate(p, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  return <AbsoluteFill style={{ opacity: e, transform: `scale(${1.03 - 0.03 * e})` }}>{children}</AbsoluteFill>;
};
const passagem = (): TransitionPresentation<Record<string, never>> => ({ component: Passagem, props: {} });

const FECHO = {
  pt: { triad: ['Perceba.', 'Pratique.', 'Torne-se.'], cta: 'Grátis na App Store e no Google Play', site: 'perceva.app' },
  en: { triad: ['See.', 'Practice.', 'Become.'], cta: 'Free on the App Store and Google Play', site: 'perceva.app' },
} as const;

/** O cartão final: a marca, a tríade e onde baixar. Sem voz (a última fala já disse a promessa). */
const Fecho: React.FC<{ lang: Lang }> = ({ lang }) => {
  const f = useCurrentFrame();
  const t = FECHO[lang];
  const up = (from: number, dur = 14) => {
    const x = interpolate(f, [from, from + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    return { opacity: x, transform: `translateY(${(1 - x) * 24}px)` };
  };
  const glow = interpolate(f, [0, 40], [0.2, 0.75], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...up(4, 18) }}>
        <div style={{ position: 'relative', width: 380, height: 380 }}>
          <Glyph size={380} cx={190} cy={190} glow={glow} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 890, left: 0, right: 0, textAlign: 'center', fontFamily: 'Fraunces', fontWeight: 600, fontSize: 132, color: C.hi, letterSpacing: -1, ...up(10) }}>
        Perce<span style={{ color: C.gold }}>va</span>
      </div>
      <div style={{ position: 'absolute', top: 1080, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26, fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 500, fontSize: 60 }}>
        {t.triad.map((w, i) => (
          <span key={w} style={{ color: [C.violet2, C.gold, '#5CD6C4'][i], ...up(20 + i * 7) }}>
            {w}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 1290, left: 80, right: 80, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 700, fontSize: 44, color: C.text, ...up(40) }}>
        {t.cta}
      </div>
      <div style={{ position: 'absolute', top: 1366, left: 0, right: 0, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 40, letterSpacing: 2, color: C.gold2, ...up(46) }}>
        {t.site}
      </div>
    </AbsoluteFill>
  );
};

export const Vitrine: React.FC<VitrineProps> = ({ lang, parts }) => {
  if (!parts || parts.some((p) => !p.tour.spec)) return null;
  const items: React.ReactNode[] = [];
  parts.forEach((p, i) => {
    items.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={p.frames} name={VITRINE_SEGMENTS[i]}>
        <Tour {...p.tour} embedded />
      </TransitionSeries.Sequence>,
      <TransitionSeries.Transition key={`t${i}`} presentation={passagem()} timing={linearTiming({ durationInFrames: PASS })} />,
    );
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.deep }}>
      {/* o fundo de baixo é o que aparece no meio da passagem (as duas telas a zero) */}
      <Background />
      <TransitionSeries>
        {items}
        <TransitionSeries.Sequence durationInFrames={END} name="fecho">
          <Fecho lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Lente />
    </AbsoluteFill>
  );
};
