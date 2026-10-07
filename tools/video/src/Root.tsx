import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import './fonts';
import { Film, FilmProps } from './Film';
import { FILMS } from './films';
import { FPS, Timing, buildTimeline } from './timeline';

const calculateMetadata: CalculateMetadataFunction<FilmProps> = async ({ props }) => {
  const film = FILMS[props.film] as (typeof FILMS)[typeof props.film] & { maxSeconds?: number };
  const res = await fetch(staticFile(`${film.voDir}/timings.json`));
  const timings: Timing[] = await res.json();
  const { scenes, total } = buildTimeline(film.lines, timings);
  if (film.maxSeconds && total > film.maxSeconds * FPS) {
    throw new Error(`${props.film}: ${(total / FPS).toFixed(1)} s passa do teto de ${film.maxSeconds} s — corte o roteiro`);
  }
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
    {/* Fixado do Instagram, Reels/TikTok e anúncio: 9:16, voz, legenda queimada e CTA. */}
    <Composition id="Manifesto" {...common} defaultProps={{ film: 'manifesto', scenes: [], captions: true, voice: true, variant: 'ad' }} />
    {/* Entrada do tutorial no app: mesmo filme sem CTA. Tem áudio, mas o player abre mudo
        (som nunca é obrigatório no app) — a legenda carrega sozinha. */}
    <Composition id="ManifestoApp" {...common} defaultProps={{ film: 'manifesto', scenes: [], captions: true, voice: true, variant: 'app' }} />
    {/* Gancho B ("Você sabe o que deveria fazer. Mas tá fazendo?") pro teste A/B do anúncio. */}
    <Composition id="ManifestoB" {...common} defaultProps={{ film: 'manifestoB', scenes: [], captions: true, voice: true, variant: 'ad' }} />
    {/* Recanto: Reels pra levar gente à aba Aprender. */}
    <Composition id="Recanto" {...common} defaultProps={{ film: 'recanto', scenes: [], captions: true, voice: true, variant: 'ad' }} />
  </>
);
