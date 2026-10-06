import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Background } from './components';
import { Captions } from './Captions';
import { SCENES } from './scenes';
import { FADE, LEAD, Scene } from './timeline';

export type ManifestoProps = { scenes: Scene[]; captions: boolean; voice: boolean };

export const Manifesto: React.FC<ManifestoProps> = ({ scenes, captions, voice }) => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      {scenes.map((s, i) => {
        const Comp = SCENES[s.id];
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
            <Audio src={staticFile(`vo/${s.id}.wav`)} />
          </Sequence>
        ))
      : null}
    {captions ? <Captions scenes={scenes} skip={['tagline']} /> : null}
  </AbsoluteFill>
);
