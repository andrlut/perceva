import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Background } from './components';
import { Captions } from './Captions';
import { FILMS, FilmId } from './films';
import { FADE, LEAD, Scene } from './timeline';

export type FilmProps = { film: FilmId; scenes: Scene[]; captions: boolean; voice: boolean };

/** Um filme = cenas em sequência com crossfade + uma faixa de voz por fala + legenda queimada. */
export const Film: React.FC<FilmProps> = ({ film, scenes, captions, voice }) => {
  const { scenes: sceneMap, voDir, noCaption } = FILMS[film];
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {scenes.map((s, i) => {
          const Comp = sceneMap[s.id as keyof typeof sceneMap] as React.FC<{ s: Scene }>;
          return (
            <React.Fragment key={s.id}>
              {i > 0 ? (
                <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />
              ) : null}
              <TransitionSeries.Sequence durationInFrames={s.frames} name={s.id}>
                <Comp s={s} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {voice
        ? scenes.map((s) => (
            <Sequence key={s.id} from={s.start + LEAD} durationInFrames={s.speech + 30} name={`voz:${s.id}`}>
              <Audio src={staticFile(`${voDir}/${s.id}.wav`)} />
            </Sequence>
          ))
        : null}
      {captions ? <Captions scenes={scenes} skip={noCaption} /> : null}
    </AbsoluteFill>
  );
};
