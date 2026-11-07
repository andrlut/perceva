import React from 'react';
import { AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, staticFile } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Background } from '../components';
import { Captions } from '../Captions';
import { FADE, FPS, Timing, buildTimeline } from '../timeline';
import { VariantContext } from '../variant';
import { MOLDE_SCENES, MS, SpecContext } from './scenes';
import type { MoldeSpec } from './spec';

/** Teto do vídeo de ideia: passou disso, o render falha (corte o roteiro). */
export const MOLDE_MAX_SECONDS = 60;

export type MoldeProps = { specKey: string; spec: MoldeSpec | null; scenes: MS[] };

export const calculateMoldeMetadata: CalculateMetadataFunction<MoldeProps> = async ({ props }) => {
  const dir = `molde/${props.specKey}`;
  const spec: MoldeSpec = await (await fetch(staticFile(`${dir}/spec.json`))).json();
  const timings: Timing[] = await (await fetch(staticFile(`${dir}/timings.json`))).json();
  const { scenes, total } = buildTimeline(spec.lines, timings);
  if (total > MOLDE_MAX_SECONDS * FPS) {
    throw new Error(`${props.specKey}: ${(total / FPS).toFixed(1)} s passa do teto de ${MOLDE_MAX_SECONDS} s — corte o roteiro`);
  }
  return { durationInFrames: total, props: { ...props, spec, scenes: scenes as MS[] } };
};

/** Vídeo de ideia montado a partir de um spec: cenas do molde + voz por fala + legenda. */
export const Molde: React.FC<MoldeProps> = ({ specKey, spec, scenes }) => {
  if (!spec) return null;
  const skip = scenes.filter((s) => s.scene === 'verso').map((s) => s.id);
  return (
    <SpecContext.Provider value={spec}>
      <VariantContext.Provider value="app">
        <AbsoluteFill>
          <Background />
          <TransitionSeries>
            {scenes.map((s, i) => {
              const Comp = MOLDE_SCENES[s.scene];
              if (!Comp) throw new Error(`cena desconhecida: ${s.scene}`);
              return (
                <React.Fragment key={s.id}>
                  {i > 0 ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} /> : null}
                  <TransitionSeries.Sequence durationInFrames={s.frames} name={`${s.id}·${s.scene}`}>
                    <Comp s={s} />
                  </TransitionSeries.Sequence>
                </React.Fragment>
              );
            })}
          </TransitionSeries>
          {scenes.map((s) => (
            <Sequence key={s.id} from={s.start + s.lead} durationInFrames={s.speech + 30} name={`voz:${s.id}`}>
              <Audio src={staticFile(`molde/${specKey}/${s.id}.mp3`)} />
            </Sequence>
          ))}
          <Captions scenes={scenes} skip={skip} top={1440} />
        </AbsoluteFill>
      </VariantContext.Provider>
    </SpecContext.Provider>
  );
};
