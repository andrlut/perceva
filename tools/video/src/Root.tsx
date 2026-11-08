import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import './fonts';
import { Film, FilmProps } from './Film';
import { FILMS } from './films';
import { FPS, Timing, buildTimeline } from './timeline';
import { ElencoSheet } from './elenco/Sheet';
import { Molde, calculateMoldeMetadata } from './molde/Molde';
import { IdentidadeSheet } from './identidade/Sheet';
import { Tour, calculateTourMetadata } from './tutorial/Tour';
import { Porta, calculatePortaMetadata } from './tutorial/Porta';

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
    {/* Teste: vídeo de uma ideia do Recanto (comparação com o Curta do Gemini Notebook). */}
    <Composition id="Ideia" {...common} defaultProps={{ film: 'ideia', scenes: [], captions: true, voice: true, variant: 'app' }} />
    {/* Molde genérico do vídeo de ideia: o roteiro vem de public/molde/<specKey>/ (scripts/molde.mjs).
        Renderize com --props='{"specKey":"<slug>.<idea>.<lang>"}'. */}
    <Composition
      id="Molde"
      component={Molde}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 60}
      calculateMetadata={calculateMoldeMetadata}
      defaultProps={{ specKey: 'buying-time-chores.comprar-tempo.pt', spec: null, scenes: [] }}
    />
    {/* Folha de elenco: personagens e objetos-padrão (amostra de estilo). */}
    <Composition id="Elenco" component={ElencoSheet} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 6} />
    {/* Opções de identidade visual das pessoas (scripts/identidade.mjs <id>). */}
    <Composition id="Identidade" component={IdentidadeSheet} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 4} defaultProps={{ option: 'atual' }} />
    {/* Tutorial de tela (réplica + câmera + destaque + dedo), roteiro em tours/<tela>.json
        (scripts/tour.mjs, TOUR.md). --props='{"tourKey":"rewards.pt"}'; mode "replica" = só a tela. */}
    <Composition
      id="Tour"
      component={Tour}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 40}
      calculateMetadata={calculateTourMetadata}
      defaultProps={{ tourKey: 'rewards.pt', spec: null, scenes: [], mode: 'tour' as const }}
    />
    {/* Porta com abertura: o porquê com o elenco (molde, ideia com bridge "tour") emendado no
        tutorial da tela. scripts/tour.mjs render usa esta quando o roteiro do tour traz `intro`. */}
    <Composition
      id="Porta"
      component={Porta}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 60}
      calculateMetadata={calculatePortaMetadata}
      defaultProps={{ introKey: 'doors.rewards-why.pt', tourKey: 'rewards.pt' }}
    />
  </>
);
