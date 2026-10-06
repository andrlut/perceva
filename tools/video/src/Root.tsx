import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import './fonts';
import { Manifesto, ManifestoProps } from './Manifesto';
import { FPS, Timing, buildTimeline } from './timeline';

const calculateMetadata: CalculateMetadataFunction<ManifestoProps> = async ({ props }) => {
  const res = await fetch(staticFile('vo/timings.json'));
  const timings: Timing[] = await res.json();
  const { scenes, total } = buildTimeline(timings);
  return { durationInFrames: total, props: { ...props, scenes } };
};

export const RemotionRoot: React.FC = () => (
  <>
    {/* Fixado do Instagram + Reels: 9:16, com voz e legenda queimada. */}
    <Composition
      id="Manifesto"
      component={Manifesto}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 60}
      defaultProps={{ scenes: [], captions: true, voice: true }}
      calculateMetadata={calculateMetadata}
    />
    {/* Entrada do app: mudo por padrão (som nunca é obrigatório), legenda faz o trabalho. */}
    <Composition
      id="ManifestoApp"
      component={Manifesto}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 60}
      defaultProps={{ scenes: [], captions: true, voice: false }}
      calculateMetadata={calculateMetadata}
    />
  </>
);
