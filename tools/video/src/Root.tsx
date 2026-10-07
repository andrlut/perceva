import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import './fonts';
import { Film, FilmProps } from './Film';
import { FILMS } from './films';
import { FPS, Timing, buildTimeline } from './timeline';

const calculateMetadata: CalculateMetadataFunction<FilmProps> = async ({ props }) => {
  const { lines, voDir } = FILMS[props.film];
  const res = await fetch(staticFile(`${voDir}/timings.json`));
  const timings: Timing[] = await res.json();
  const { scenes, total } = buildTimeline(lines, timings);
  return { durationInFrames: total, props: { ...props, scenes } };
};

const common = {
  component: Film,
  width: 1080,
  height: 1920,
  fps: FPS,
  durationInFrames: FPS * 60,
  calculateMetadata,
} as const;

export const RemotionRoot: React.FC = () => (
  <>
    {/* Fixado do Instagram + Reels: 9:16, com voz e legenda queimada. */}
    <Composition id="Manifesto" {...common} defaultProps={{ film: 'manifesto', scenes: [], captions: true, voice: true }} />
    {/* Entrada do app: mudo por padrão (som nunca é obrigatório), legenda faz o trabalho. */}
    <Composition id="ManifestoApp" {...common} defaultProps={{ film: 'manifesto', scenes: [], captions: true, voice: false }} />
    {/* Recanto: Reels pra levar gente à aba Aprender. */}
    <Composition id="Recanto" {...common} defaultProps={{ film: 'recanto', scenes: [], captions: true, voice: true }} />
  </>
);
